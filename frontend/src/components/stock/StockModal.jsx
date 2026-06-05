import React, { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, ArrowUpCircle, ArrowDownCircle, Plus, Trash2, Calculator, CreditCard, Wallet, Layers, ChevronDown, CheckCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
const MotionDiv = motion.div;
import { toast } from 'react-hot-toast';

import Input from '../common/Input';
import stockService from '../../services/stockService';
import productService from '../../services/productService';
import { useAuth } from '../../context/AuthContext';

const formatRibuan = (angka) => {
  if (angka === null || angka === undefined || angka === '') return '';
  const stringAngka = String(angka).replace(/[^0-9]/g, '');
  return stringAngka.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseRibuan = (string) => {
  if (!string) return 0;
  return parseInt(String(string).replace(/\./g, ''), 10) || 0;
};

// Skema Form disesuaikan untuk Kategori Bertingkat
const itemSchema = yup.object({
  mainCategory: yup.string().required('Kategori utama wajib dipilih'),
  subCategory: yup.string(), 
  productId: yup.string().required('Barang wajib dipilih'),
  quantity: yup.number().typeError('Harus angka').positive('Minimal 1').integer().required('Qty wajib isi'),
  unitPrice: yup.number().transform((value) => (isNaN(value) ? undefined : value)).nullable(),
  currency: yup.string().default('IDR')
});

const schemaIn = yup.object({
  items: yup.array().of(itemSchema).min(1, 'Minimal pilih satu barang'),
  reason: yup.string().required('Alasan wajib diisi'),
}).required();

const schemaOut = yup.object({
  items: yup.array().of(itemSchema).min(1, 'Minimal pilih satu barang'),
  reason: yup.string().required('Alasan wajib diisi'),
  salesOrderNumber: yup.string().optional(),
}).required();

// Komponen Select yang sudah ditebalkan
const SelectField = ({ label, name, error, children, registerFn, disabled, onChangeCustom }) => {
  const { onChange: hookFormOnChange, ...rest } = registerFn(name);
  return (
    <div className="w-full flex flex-col gap-1.5 space-y-1">
      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</label>
      <select
        disabled={disabled}
        {...rest}
        onChange={(e) => {
          hookFormOnChange(e); 
          if (onChangeCustom) onChangeCustom(e); 
        }}
        className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:outline-none bg-white text-sm font-bold text-slate-900 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer transition-all shadow-sm"
      >
        {children}
      </select>
      {error && <p className="text-[11px] font-bold text-red-600 uppercase mt-1">{error.message}</p>}
    </div>
  );
};

// Searchable Select yang lebih kontras
const SearchableSelect = ({ label, name, control, error, options, disabled, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => {
        const selectedOption = options.find(opt => opt.value === value);
        const displayValue = isOpen ? searchTerm : (selectedOption ? selectedOption.label : '');
        
        const filteredOptions = options.filter(opt =>
          opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
          <div className="w-full flex flex-col gap-1.5 relative space-y-1" ref={wrapperRef}>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</label>
            <div className="relative">
              <input
                type="text"
                disabled={disabled}
                placeholder={placeholder}
                value={displayValue}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsOpen(true);
                }}
                onClick={() => {
                  if (!disabled) {
                    setIsOpen(true);
                    setSearchTerm('');
                  }
                }}
                className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:outline-none bg-white text-sm font-bold shadow-sm transition-all pr-10 ${
                  disabled ? 'text-slate-400 bg-slate-100 border-slate-200' : 'text-slate-900 border-slate-200'
                } ${error ? 'border-red-500' : ''}`}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <ChevronDown size={20} strokeWidth={3} />
              </div>

              <AnimatePresence>
                {isOpen && !disabled && (
                  <MotionDiv
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.1 }}
                    className="absolute z-[100] w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto"
                  >
                    {filteredOptions.length > 0 ? (
                      <ul className="py-2">
                        {filteredOptions.map((opt) => (
                          <li
                            key={opt.value}
                            onClick={() => {
                              onChange(opt.value);
                              setIsOpen(false);
                              setSearchTerm('');
                            }}
                            className={`px-5 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0 font-bold text-sm transition-colors ${
                              value === opt.value ? 'bg-blue-100 text-blue-800' : 'text-slate-800'
                            }`}
                          >
                            {opt.label}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-4 py-5 text-center text-slate-500 font-bold italic text-sm">
                        Barang tidak ditemukan...
                      </div>
                    )}
                  </MotionDiv>
                )}
              </AnimatePresence>
            </div>
            {error && <p className="text-[11px] font-bold text-red-600 uppercase mt-1">{error.message}</p>}
          </div>
        );
      }}
    />
  );
};

const StockModal = ({ isOpen, onClose, type = 'IN', onSuccess }) => {
  const isStockIn = type === 'IN';
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [stockInType, setStockInType] = useState('NEW_PURCHASE'); 

  const defaultItem = { mainCategory: '', subCategory: '', productId: '', quantity: '', unitPrice: '', currency: 'IDR' };

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(isStockIn ? schemaIn : schemaOut),
    defaultValues: { items: [defaultItem] }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = watch("items") || [];
  
  const grandTotals = watchedItems.reduce((acc, curr) => {
    const qty = Number(curr?.quantity || 0);
    const price = Number(curr?.unitPrice || 0);
    const currType = curr?.currency || 'IDR';
    
    if (!acc[currType]) acc[currType] = 0;
    acc[currType] += (qty * price);
    return acc;
  }, {});

  const hasAnyTotal = Object.values(grandTotals).some(total => total > 0);

  useEffect(() => {
    if (isOpen) {
      reset({ items: [defaultItem], reason: '', salesOrderNumber: '' });
      setStockInType('NEW_PURCHASE'); 
      const load = async () => {
        try {
          const prodData = await productService.getAll();
          const productsArray = prodData?.products || prodData?.data || prodData || [];
          setProducts(Array.isArray(productsArray) ? productsArray : []);
        } catch {
          toast.error('Gagal mengambil data produk dari database');
        }
      };
      load();
    }
  }, [isOpen, reset]);

  const handleTypeChange = (t) => {
    setStockInType(t);
    setValue('reason', t === 'INTERNAL_RETURN' ? 'Pengembalian sisa material event / training' : '');
  };

  const onSubmit = async (data) => {
    try {
      const promises = data.items.map(item => {
        const payload = { 
          reason: data.reason,
          inputBy: user?._id || user?.id,
          productId: item.productId, 
          quantity: item.quantity,
          ...(isStockIn && stockInType === 'NEW_PURCHASE' ? { 
            unitPrice: Number(item.unitPrice),
            currency: item.currency 
          } : {}),
          ...(!isStockIn ? { salesOrderNumber: data.salesOrderNumber } : {})
        };
        return isStockIn ? stockService.stockIn(payload) : stockService.stockOut(payload);
      });

      await Promise.all(promises);

      const targetTim = isStockIn ? "Tim Finance" : "Tim Manajemen";

      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-in slide-in-from-top-2 fade-in duration-300' : 'animate-out fade-out slide-out-to-right-5 duration-200'
          } max-w-sm w-full bg-white shadow-xl rounded-2xl pointer-events-auto flex border border-slate-200 overflow-hidden ring-1 ring-slate-900/5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-emerald-200">
                   <CheckCircle className="h-6 w-6 text-emerald-600" strokeWidth={2.5} />
                </div>
              </div>
              <div className="ml-1 flex-1 space-y-1">
                <p className="text-sm font-bold text-slate-900 tracking-tight">Berhasil Disimpan!</p>
                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                  <strong className="text-slate-900">{data.items.length} data barang</strong> tercatat. Notifikasi email dikirim ke <strong className="text-blue-700">{targetTim}</strong>.
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-slate-200 bg-slate-50">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-2xl px-4 flex items-center justify-center text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all focus:outline-none"
            >
              Tutup
            </button>
          </div>
        </div>
      ), { duration: 10000 }); 
      
      onClose();
      setTimeout(() => { onSuccess(); }, 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Proses gagal');
    }
  };

  const safeProducts = Array.isArray(products) ? products : [];
  const categoryTree = {};

  safeProducts.forEach(p => {
    const fullCat = p.category || 'Lainnya';
    const parts = fullCat.split('-').map(s => s.trim());
    const main = parts[0];
    const sub = parts.slice(1).join(' - '); 

    if (!categoryTree[main]) categoryTree[main] = new Set();
    if (sub) categoryTree[main].add(sub);
  });

  const mainCategories = ['Learning Material', 'Logistik Material', 'Office Asset'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <MotionDiv
            key="modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80]"
          />
          <MotionDiv
            key="modal-content"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-3 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl pointer-events-auto max-h-[92vh] overflow-hidden flex flex-col border-2 border-slate-200">
              
              {/* HEADER */}
              <div className="flex items-center justify-between px-6 py-5 border-b-2 border-slate-100 bg-white shadow-sm z-10">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl border-2 ${isStockIn ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
                    {isStockIn ? <ArrowUpCircle size={24} strokeWidth={2.5} /> : <ArrowDownCircle size={24} strokeWidth={2.5} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                      {isStockIn ? 'Stok Masuk' : 'Stok Keluar'}
                    </h3>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Logistik & Aset</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all active:scale-90 border-2 border-transparent hover:border-slate-200">
                  <X size={24} strokeWidth={3} />
                </button>
              </div>

              {/* BODY SCROLLABLE: Background jadi abu-abu agar form putihnya kelihatan (Shading) */}
              <div className="overflow-y-auto flex-1 p-5 md:p-6 bg-slate-100 space-y-6">
                <form id="stock-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  
                  {/* DETAIL INFORMASI UTAMA */}
                  <div className="p-6 rounded-2xl border-2 border-slate-200 shadow-sm space-y-5 bg-white">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 border-b-2 border-slate-100 pb-4">
                      <div className="flex items-center gap-2">
                        <Wallet className="text-slate-500" size={20} />
                        <h4 className="font-black text-slate-800 uppercase text-[12px] tracking-widest">Informasi</h4>
                      </div>
                      
                      {isStockIn && (
                        <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1.5 border-2 border-slate-200 overflow-x-auto">
                          <button
                            type="button"
                            onClick={() => handleTypeChange('NEW_PURCHASE')}
                            className={`px-4 py-2.5 min-w-[110px] text-xs font-bold rounded-lg transition-all uppercase whitespace-nowrap ${stockInType === 'NEW_PURCHASE' ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200' : 'text-slate-500 hover:text-slate-800'}`}
                          >
                            Pembelian
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTypeChange('INTERNAL_RETURN')}
                            className={`px-4 py-2.5 min-w-[110px] text-xs font-bold rounded-lg transition-all uppercase whitespace-nowrap ${stockInType === 'INTERNAL_RETURN' ? 'bg-white text-blue-700 shadow-sm border border-blue-200' : 'text-slate-500 hover:text-slate-800'}`}
                          >
                            Barang Sisa
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 space-y-4 md:space-y-0">
                        <div className="w-full space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Keterangan</label>
                            <input 
                                type="text"
                                placeholder="Contoh: Stok ulang bulanan..."
                                className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:outline-none text-sm font-bold text-slate-900 shadow-sm"
                                {...register('reason')}
                            />
                            {errors.reason && <p className="text-[11px] font-bold text-red-600 uppercase mt-1">{errors.reason.message}</p>}
                        </div>
                        {!isStockIn && (
                            <div className="w-full space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">No. Pesanan / SO</label>
                                <input 
                                    type="text"
                                    placeholder="SO-001"
                                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:outline-none text-sm font-bold text-slate-900 uppercase shadow-sm"
                                    {...register('salesOrderNumber')}
                                />
                                {errors.salesOrderNumber && <p className="text-[11px] font-bold text-red-600 uppercase mt-1">{errors.salesOrderNumber.message}</p>}
                            </div>
                        )}
                    </div>
                  </div>

                  {/* PRODUCTS LIST */}
                  <div className="space-y-5">
                    <h4 className="font-black text-slate-800 uppercase text-[12px] tracking-widest ml-1 shadow-sm px-4 py-2 bg-white w-fit rounded-lg border-2 border-slate-200">Daftar Input Barang</h4>

                    {fields.map((field, index) => {
                      const showPrice = isStockIn && stockInType === 'NEW_PURCHASE';
                      const currentQty = watch(`items.${index}.quantity`) || 0;
                      const currentPrice = watch(`items.${index}.unitPrice`) || 0;
                      const currentCurrency = watch(`items.${index}.currency`) || 'IDR';
                      const currencySymbol = currentCurrency === 'USD' ? '$' : 'Rp';
                      const localeFormat = currentCurrency === 'USD' ? 'en-US' : 'id-ID';
                      
                      const selectedMainCategory = watch(`items.${index}.mainCategory`);
                      const selectedSubCategory = watch(`items.${index}.subCategory`);
                      const selectedProductId = watch(`items.${index}.productId`);
                      
                      const subCategoriesList = selectedMainCategory && categoryTree[selectedMainCategory] 
                        ? Array.from(categoryTree[selectedMainCategory]).sort() 
                        : [];
                      
                      const hasSubCategories = subCategoriesList.length > 0;
                      const selectedProductObj = safeProducts.find(p => p._id === selectedProductId);

                      const filteredProducts = safeProducts.filter(p => {
                        if (!selectedMainCategory) return false;
                        const parts = (p.category || '').split('-').map(s=>s.trim());
                        const pMain = parts[0] || '';
                        const pSub = parts.slice(1).join(' - ') || '';
                        
                        if (pMain !== selectedMainCategory) return false;
                        if (hasSubCategories && pSub !== selectedSubCategory) return false;
                        return true;
                      });

                      const productOptions = filteredProducts.map(p => ({
                        value: p?._id || '',
                        label: `${String(p?.name || 'Tanpa Nama').toUpperCase()} (Stok: ${p?.quantity || 0})`
                      }));

                      return (
                        <div key={field.id} className="relative p-6 rounded-2xl border-2 border-slate-200 flex flex-col gap-6 animate-in slide-in-from-bottom-5 duration-300 shadow-md bg-white">
                          {fields.length > 1 && (
                            <button type="button" onClick={() => remove(index)} className="absolute -top-3 -right-3 bg-red-600 text-white p-2.5 rounded-xl hover:bg-red-700 active:scale-90 transition-all z-10 border-2 border-white shadow-md">
                              <Trash2 size={18} strokeWidth={3} />
                            </button>
                          )}

                          <div className={`grid grid-cols-1 gap-5 items-start ${hasSubCategories ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                            <div className="w-full">
                              <SelectField 
                                label="Kategori Utama" 
                                name={`items.${index}.mainCategory`} 
                                error={errors?.items?.[index]?.mainCategory} 
                                registerFn={register}
                                onChangeCustom={() => {
                                  setValue(`items.${index}.subCategory`, '');
                                  setValue(`items.${index}.productId`, '');
                                }}
                              >
                                <option value="" disabled>-- Utama --</option>
                                {mainCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </SelectField>
                            </div>

                            {hasSubCategories && (
                              <div className="w-full animate-in fade-in zoom-in duration-300">
                                <SelectField 
                                  label="Sub-Kategori" 
                                  name={`items.${index}.subCategory`} 
                                  error={errors?.items?.[index]?.subCategory} 
                                  registerFn={register}
                                  onChangeCustom={() => {
                                    setValue(`items.${index}.productId`, '');
                                  }}
                                >
                                  <option value="" disabled>-- Sub --</option>
                                  {subCategoriesList.map(sub => (
                                      <option key={sub} value={sub}>{sub}</option>
                                  ))}
                                </SelectField>
                              </div>
                            )}

                            <div className="w-full">
                              <SearchableSelect 
                                label="Pilih Barang" 
                                name={`items.${index}.productId`} 
                                control={control}
                                error={errors?.items?.[index]?.productId} 
                                options={productOptions}
                                disabled={!selectedMainCategory || (hasSubCategories && !selectedSubCategory)}
                                placeholder={!selectedMainCategory ? 'Terkunci' : (hasSubCategories && !selectedSubCategory ? 'Terkunci' : 'Ketik nama barang...')}
                              />
                            </div>
                          </div>

                          {selectedProductObj?.category && (
                            <div className="p-3.5 bg-blue-50 border-2 border-blue-200 rounded-xl flex flex-col md:flex-row md:items-center gap-3 shadow-sm">
                              <div className="flex items-center gap-2 text-blue-700 bg-white px-2.5 py-1.5 rounded-lg border border-blue-200 shadow-sm w-fit">
                                <Layers size={16} strokeWidth={2.5} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Hierarki</span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap text-sm font-bold text-slate-800">
                                {selectedProductObj.category.split('-').map((part, idx, arr) => (
                                  <React.Fragment key={idx}>
                                    <span className="text-blue-900">{part.trim()}</span>
                                    {idx < arr.length - 1 && <span className="text-blue-400">➔</span>}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            {showPrice && (
                              <div className="w-full space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Harga Beli Satuan</label>
                                <div className="flex border-2 border-slate-200 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-600 transition-all shadow-sm bg-white">
                                  <select {...register(`items.${index}.currency`)} className="bg-slate-100 border-r-2 border-slate-200 px-4 font-black text-emerald-800 text-sm outline-none cursor-pointer">
                                    <option value="IDR">Rp</option>
                                    <option value="USD">$</option>
                                  </select>
                                  <Controller
                                    name={`items.${index}.unitPrice`}
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                      <input
                                        type="text"
                                        placeholder="0"
                                        className="w-full px-4 py-3.5 font-black text-xl text-emerald-800 outline-none bg-transparent"
                                        value={formatRibuan(value)}
                                        onChange={(e) => onChange(parseRibuan(e.target.value))}
                                      />
                                    )}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="w-full space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Jumlah Stok {isStockIn ? 'Masuk' : 'Keluar'}</label>
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="0"
                                  className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:outline-none font-black text-2xl text-slate-900 transition-all shadow-sm bg-white"
                                  {...register(`items.${index}.quantity`)}
                                />
                            </div>
                          </div>

                          {showPrice && currentQty > 0 && currentPrice > 0 && (
                            <div className="flex justify-end items-center gap-3 pt-5 border-t-2 border-slate-100">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sub-Total:</span>
                                <span className="text-emerald-700 font-black text-xl italic">
                                    {currencySymbol} {(currentQty * currentPrice).toLocaleString(localeFormat)}
                                </span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => append(defaultItem)}
                      className="w-full py-5 border-4 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold text-[12px] hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-all flex items-center justify-center gap-3 uppercase tracking-wider active:scale-[0.99] bg-white shadow-sm"
                    >
                      <Plus size={24} strokeWidth={3} /> Tambah Input Barang
                    </button>
                  </div>
                </form>
              </div>

              {/* FOOTER */}
              <div className="px-6 py-5 border-t-2 border-slate-200 bg-white z-10 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col md:flex-row items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    {isStockIn && stockInType === 'NEW_PURCHASE' && hasAnyTotal ? (
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 border-2 border-emerald-200 shadow-sm">
                            <CreditCard size={24} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-none">Total Pembayaran</span>
                          {Object.entries(grandTotals).map(([currency, total]) => {
                            if (total === 0) return null;
                            const isUSD = currency === 'USD';
                            return (
                              <span key={currency} className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                                <span className="text-emerald-700 mr-1.5 text-xl">{isUSD ? '$' : 'Rp'}</span>
                                {total.toLocaleString(isUSD ? 'en-US' : 'id-ID')}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-slate-400 italic">
                        <Calculator size={20} />
                        <span className="text-xs font-bold">Menunggu input barang...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border-2 border-transparent"
                    >
                        Batal
                    </button>
                    <button
                        form="stock-form"
                        type="submit"
                        disabled={isSubmitting}
                        className={`flex-1 md:flex-none px-8 py-4 text-sm font-black text-white rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-3 shadow-md ${isStockIn ? 'bg-emerald-600 hover:bg-emerald-700 border-2 border-emerald-700' : 'bg-red-600 hover:bg-red-700 border-2 border-red-700'} ${isSubmitting ? 'opacity-50' : 'active:scale-95'}`}
                    >
                        {isSubmitting ? 'Menyimpan...' : `Simpan ${fields.length} Barang`}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </MotionDiv>
        </>
      )}
    </AnimatePresence>
  );
};

export default StockModal;