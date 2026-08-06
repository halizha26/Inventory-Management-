import React, { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, ArrowUpCircle, ArrowDownCircle, Plus, Trash2, Calculator, Wallet, Layers, ChevronDown, Hash, Search, Lock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
const MotionDiv = motion.div;
import { toast } from 'react-hot-toast';

import stockService from '../../services/stockService';
import productService from '../../services/productService';
import { useAuth } from '../../context/AuthContext';

// Endpoint Backend
const API_BASE_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const CATEGORY_TREE = {
  "Logistik Material": ["Inventory Class Delivery"],
  "Office Asset": ["Fixed Assets", "Office Equipment"],
  "Learning Material": ["CELEMI", "NuPMK", "Industry Master"]
};

const formatRibuan = (angka) => {
  if (angka === null || angka === undefined || angka === '') return '';
  const stringAngka = String(angka).replace(/[^0-9]/g, '');
  return stringAngka.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseRibuan = (string) => {
  if (!string) return 0;
  return parseInt(String(string).replace(/\./g, ''), 10) || 0;
};

const itemSchema = yup.object({
  mainCategory: yup.string().required('Kategori utama wajib dipilih'),
  subCategory: yup.string().optional(), 
  productId: yup.string().required('Barang wajib dipilih'),
  quantity: yup.number().typeError('Harus angka').positive('Minimal 1').integer().required('Qty wajib isi'),
  unitPrice: yup.number().transform((value) => (isNaN(value) ? undefined : value)).nullable(),
  currency: yup.string().default('IDR'),
  batchId: yup.string(),
  unit: yup.string().oneOf(['Pcs', 'Paket']).default('Pcs')
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

const SelectField = ({ label, name, error, children, registerFn, disabled, onChangeCustom, required }) => {
  const { onChange: hookFormOnChange, ...rest } = registerFn(name);
  return (
    <div className="w-full flex flex-col gap-1.5 space-y-1">
      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        disabled={disabled}
        required={required}
        {...rest}
        onChange={(e) => {
          hookFormOnChange(e); 
          if (onChangeCustom) onChangeCustom(e); 
        }}
        className="w-full px-4 h-[56px] border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:outline-none bg-white text-sm font-bold text-slate-900 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer transition-all shadow-sm"
      >
        {children}
      </select>
      {error && <p className="text-[11px] font-bold text-red-600 uppercase mt-1">{error.message}</p>}
    </div>
  );
};

const SearchableSelect = ({ label, name, control, error, options, disabled, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
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
        const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
          <div className="w-full flex flex-col gap-1.5 relative space-y-1" ref={wrapperRef}>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label} <span className="text-blue-500">*</span></label>
            <div className="relative">
              <input
                type="text"
                disabled={disabled}
                placeholder={placeholder}
                value={displayValue}
                onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
                onClick={() => { if (!disabled) { setIsOpen(true); setSearchTerm(''); } }}
                className={`w-full px-4 h-[56px] border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:outline-none bg-white text-sm font-bold shadow-sm transition-all pr-10 ${
                  disabled ? 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed' : 'text-slate-900 border-slate-200 cursor-pointer'
                } ${error ? 'border-red-500' : ''}`}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <ChevronDown size={20} strokeWidth={3} />
              </div>

              <AnimatePresence>
                {isOpen && !disabled && (
                  <MotionDiv
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.1 }}
                    className="absolute z-[100] w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto"
                  >
                    {filteredOptions.length > 0 ? (
                      <ul className="py-2">
                        {filteredOptions.map((opt) => (
                          <li
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setIsOpen(false); setSearchTerm(''); }}
                            className={`px-5 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0 font-bold text-sm transition-colors ${value === opt.value ? 'bg-blue-100 text-blue-800' : 'text-slate-800'}`}
                          >
                            {opt.label}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-4 py-5 text-center text-slate-500 font-bold italic text-sm">Barang tidak ditemukan...</div>
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

  // 👇 STATE BARU UNTUK FITUR SO 👇
  const [isSoLocked, setIsSoLocked] = useState(false);
  const [isSoLoading, setIsSoLoading] = useState(false);

  const defaultItem = { mainCategory: '', subCategory: '', productId: '', quantity: '', unitPrice: '', currency: 'IDR', batchId: '', unit: 'Pcs' };

  const { register, control, handleSubmit, reset, watch, setValue, getValues, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(isStockIn ? schemaIn : schemaOut),
    defaultValues: { items: [defaultItem] }
  });

  const { fields, append, remove, replace } = useFieldArray({
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
      setIsSoLocked(false); // Reset kunci SO setiap modal dibuka
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

  // 👇 FUNGSI SAKTI UNTUK MENCARI DAN MENGUNCI DATA SO 👇
  const handleSearchSO = async () => {
    const soNumber = getValues('salesOrderNumber');
    if (!soNumber) {
        toast.error("Ketik nomor SO terlebih dahulu!");
        return;
    }

    setIsSoLoading(true);
    try {
        const res = await fetch(`${API_BASE_URL}/sales-orders/${soNumber}`);
        const json = await res.json();

        if (!json.success) {
            toast.error(json.message || 'Nomor SO tidak ditemukan di sistem.');
            setIsSoLocked(false);
            return;
        }

        const soData = json.data;
        toast.success(`Berhasil! ${soData.items.length} barang dari SO ditemukan.`);
        
        // Memetakan data dari SO ke format form gudang kita
        const mappedItems = soData.items.map(soItem => {
            // Mencocokkan nama barang dari SO dengan database Gudang
            const matchedProduct = products.find(p => p.name.toLowerCase() === soItem.productName.toLowerCase());
            
            let mainCat = '';
            let subCat = '';
            
            if (matchedProduct && matchedProduct.category) {
                const parts = matchedProduct.category.split(' - ');
                mainCat = parts[0] ? parts[0].trim() : '';
                subCat = parts[1] ? parts[1].trim() : '';
            }

            return {
                mainCategory: mainCat,
                subCategory: subCat,
                productId: matchedProduct ? matchedProduct._id : '',
                quantity: soItem.quantity,
                unit: soItem.unit || 'Pcs',
                batchId: '', // Tetap kosong agar gudang wajib pilih kloter
                unitPrice: '',
                currency: 'IDR'
            };
        });

        // Peringatan jika ada nama barang dari divisi sales yang tidak terdaftar di gudang
        const hasUnmatched = mappedItems.some(i => !i.productId);
        if (hasUnmatched) toast.error("Perhatian: Ada barang dari SO yang tidak terdaftar di master gudang!");

        // Timpa dan Kunci form
        replace(mappedItems);
        setIsSoLocked(true);

    } catch (error) {
        toast.error('Gagal menghubungi server SO. Pastikan backend menyala.');
    } finally {
        setIsSoLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (!isStockIn) {
        const isMissingBatch = data.items.some(item => !item.batchId);
        if (isMissingBatch) {
            toast.error("Mohon pilih Sumber Kloter (Tanggal Masuk) untuk semua barang!");
            return; 
        }
      }

      const promises = data.items.map(item => {
        let outUnitPrice = 0;
        let outCurrency = 'IDR';

        if (!isStockIn && item.batchId) {
            const prod = products.find(p => p._id === item.productId);
            if (prod && prod.batches) {
                const selectedBatch = prod.batches.find(b => b._id === item.batchId);
                if (selectedBatch) {
                    outUnitPrice = selectedBatch.pricePerUnit || 0;
                    outCurrency = selectedBatch.currency || 'IDR';
                }
            }
        }

        const payload = { 
          reason: data.reason,
          inputBy: user?._id || user?.id,
          productId: item.productId, 
          quantity: item.quantity,
          unit: item.unit,
          ...(isStockIn && stockInType === 'NEW_PURCHASE' ? { unitPrice: Number(item.unitPrice), currency: item.currency } : {}),
          ...(!isStockIn ? { salesOrderNumber: data.salesOrderNumber, batchId: item.batchId, unitPrice: outUnitPrice, currency: outCurrency } : {}) 
        };
        return isStockIn ? stockService.stockIn(payload) : stockService.stockOut(payload);
      });

      await Promise.all(promises);
      toast.success('Transaksi berhasil disimpan!');
      onClose();
      setTimeout(() => { onSuccess(); }, 500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Proses gagal');
    }
  };

  const mainCategories = Object.keys(CATEGORY_TREE);

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
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl pointer-events-auto max-h-[92vh] overflow-hidden flex flex-col border-2 border-slate-200">
              
              {/* HEADER */}
              <div className="flex items-center justify-between px-6 py-5 border-b-2 border-slate-100 bg-white shadow-sm z-10">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl border-2 ${isStockIn ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
                    {isStockIn ? <ArrowUpCircle size={24} strokeWidth={2.5} /> : <ArrowDownCircle size={24} strokeWidth={2.5} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                      {isStockIn ? 'Permintaan Stok Masuk' : 'Permintaan Stok Keluar'}
                    </h3>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Logistik & Aset Perusahaan</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all active:scale-90 border-2 border-transparent hover:border-slate-200">
                  <X size={24} strokeWidth={3} />
                </button>
              </div>

              {/* BODY SCROLLABLE */}
              <div className="overflow-y-auto flex-1 p-5 md:p-6 bg-slate-50 space-y-6">
                <form id="stock-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  
                  {/* DETAIL INFORMASI UTAMA */}
                  <div className="p-6 rounded-2xl border-2 border-slate-200 shadow-sm space-y-5 bg-white">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 border-b-2 border-slate-100 pb-4">
                      <div className="flex items-center gap-2">
                        <Wallet className="text-slate-500" size={20} />
                        <h4 className="font-black text-slate-800 uppercase text-[12px] tracking-widest">Informasi Utama</h4>
                      </div>
                      
                      {isStockIn && (
                        <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1.5 border-2 border-slate-200">
                          <button type="button" onClick={() => handleTypeChange('NEW_PURCHASE')} className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all uppercase ${stockInType === 'NEW_PURCHASE' ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200' : 'text-slate-500'}`}>Pembelian</button>
                          <button type="button" onClick={() => handleTypeChange('INTERNAL_RETURN')} className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all uppercase ${stockInType === 'INTERNAL_RETURN' ? 'bg-white text-blue-700 shadow-sm border border-blue-200' : 'text-slate-500'}`}>Barang Sisa Event</button>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div className="w-full space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Alasan / Keterangan Transaksi</label>
                            <input type="text" placeholder="Contoh: Kebutuhan kelas Training BRI..." className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:outline-none text-sm font-bold text-slate-900 shadow-sm" {...register('reason')} />
                            {errors.reason && <p className="text-[11px] font-bold text-red-600 uppercase mt-1">{errors.reason.message}</p>}
                        </div>
                        
                        {/* 👇 INPUT SO YANG BARU DENGAN TOMBOL CARI & BATAL 👇 */}
                        {!isStockIn && (
                            <div className="w-full space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">No. Pesanan / SO (Sales Order)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        disabled={isSoLocked}
                                        placeholder="Ketik lalu klik cari (Cth: SO-2026-001)" 
                                        className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:outline-none text-sm font-bold text-slate-900 uppercase shadow-sm disabled:bg-slate-100 disabled:text-slate-500" 
                                        {...register('salesOrderNumber')} 
                                    />
                                    {!isSoLocked ? (
                                        <button 
                                            type="button" 
                                            onClick={handleSearchSO}
                                            disabled={isSoLoading}
                                            className="px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm"
                                        >
                                            {isSoLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Search size={20} />}
                                            <span className="hidden sm:block">Cari</span>
                                        </button>
                                    ) : (
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setIsSoLocked(false);
                                                setValue('salesOrderNumber', '');
                                                replace([defaultItem]); 
                                            }}
                                            className="px-5 bg-red-100 text-red-600 hover:bg-red-200 border-2 border-red-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                                        >
                                            <X size={20} />
                                            <span className="hidden sm:block">Batal</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                  </div>

                  {/* PRODUCTS LIST */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                        <h4 className="font-black text-slate-800 uppercase text-[12px] tracking-widest ml-1 shadow-sm px-4 py-2 bg-white w-fit rounded-lg border-2 border-slate-200">Daftar Input Barang</h4>
                        {/* Status indikator terkunci */}
                        {!isStockIn && isSoLocked && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-black uppercase tracking-widest animate-pulse">
                                <Lock size={12} /> Terkunci oleh SO
                            </div>
                        )}
                    </div>

                    {fields.map((field, index) => {
                      const currentUnit = watch(`items.${index}.unit`) || 'Pcs';
                      const selectedMainCat = watch(`items.${index}.mainCategory`);
                      const selectedSubCat = watch(`items.${index}.subCategory`);
                      const selectedProdId = watch(`items.${index}.productId`);
                      
                      const selectedProductObj = products.find(p => p._id === selectedProdId);
                      const subCatList = selectedMainCat ? CATEGORY_TREE[selectedMainCat] : [];

                      const filteredProducts = products.filter(p => {
                        if (!selectedMainCat) return false;
                        const catString = p.category || '';
                        if (!catString.startsWith(selectedMainCat)) return false;
                        if (selectedSubCat && !catString.includes(selectedSubCat)) return false;
                        return true;
                      });

                      const productOptions = filteredProducts.map(p => ({
                        value: p._id,
                        label: p.name.toUpperCase()
                      }));

                      return (
                        <div key={field.id} className="relative p-6 rounded-2xl border-2 border-slate-200 flex flex-col gap-6 bg-white shadow-md animate-in slide-in-from-bottom-5 duration-300">
                          {fields.length > 1 && !(!isStockIn && isSoLocked) && (
                            <button type="button" onClick={() => remove(index)} className="absolute -top-3 -right-3 bg-red-600 text-white p-2 rounded-xl border-2 border-white shadow-lg active:scale-95 transition-all">
                              <Trash2 size={16} strokeWidth={3} />
                            </button>
                          )}

                          {/* KATEGORI DAN BARANG */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <SelectField 
                              label="Kategori Utama" 
                              name={`items.${index}.mainCategory`} 
                              registerFn={register} 
                              error={errors?.items?.[index]?.mainCategory}
                              disabled={!isStockIn && isSoLocked}
                              onChangeCustom={() => {
                                setValue(`items.${index}.subCategory`, '');
                                setValue(`items.${index}.productId`, '');
                                setValue(`items.${index}.batchId`, ''); 
                              }}
                            >
                                <option value="" disabled>-- Pilih Utama --</option>
                                {mainCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </SelectField>

                            <SelectField 
                              label="Sub-Kategori" 
                              name={`items.${index}.subCategory`} 
                              registerFn={register} 
                              disabled={subCatList.length === 0 || (!isStockIn && isSoLocked)}
                              onChangeCustom={() => {
                                setValue(`items.${index}.productId`, '');
                                setValue(`items.${index}.batchId`, ''); 
                              }}
                            >
                                <option value="">-- Tanpa Sub-Kategori / Pilih --</option>
                                {subCatList.map(s => <option key={s} value={s}>{s}</option>)}
                            </SelectField>

                            <SearchableSelect 
                              label="Pilih Barang" 
                              name={`items.${index}.productId`} 
                              control={control} 
                              error={errors?.items?.[index]?.productId} 
                              options={productOptions}
                              disabled={!selectedMainCat || (!isStockIn && isSoLocked)}
                              placeholder={!selectedMainCat ? 'Pilih Kategori Terlebih Dahulu' : 'Ketik nama barang...'}
                            />
                          </div>

                          {/* DETEKSI KODE SKU OTOMATIS & BADGE STATUS */}
                          {selectedProductObj && (
                            <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl flex flex-wrap items-center gap-6 shadow-inner animate-in fade-in duration-300">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg"><Hash size={16} /></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kode SKU Produk:</span>
                                    <span className="text-sm font-black text-blue-700 uppercase">
                                        {selectedProductObj.sku || '-'}
                                    </span>
                                </div>
                                <div className="h-4 w-[2px] bg-slate-200 hidden md:block"></div>
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg"><Layers size={16} /></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status Stok Terdaftar:</span>
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase border bg-emerald-50 text-emerald-700 border-emerald-200">
                                        Stok Master: {selectedProductObj.quantity || 0} {selectedProductObj.unit || 'Pcs'}
                                    </span>
                                </div>
                            </div>
                          )}

                          {/* ROW HARGA/KLOTER & KUANTITAS */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            
                            {isStockIn && stockInType === 'NEW_PURCHASE' ? (
                                <div className="w-full flex flex-col">
                                  <div className="h-[24px] flex items-center mb-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Harga Beli {currentUnit}</label>
                                  </div>
                                  <div className="flex border-2 border-slate-200 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-600 transition-all shadow-sm bg-white h-[56px]">
                                    <select {...register(`items.${index}.currency`)} className="bg-slate-50 border-r-2 border-slate-200 px-4 font-black text-emerald-800 text-sm outline-none cursor-pointer">
                                      <option value="IDR">Rp</option>
                                      <option value="USD">$</option>
                                    </select>
                                    <Controller
                                      name={`items.${index}.unitPrice`}
                                      control={control}
                                      render={({ field: { onChange, value } }) => (
                                        <input type="text" placeholder="0" className="w-full px-4 h-full font-black text-xl text-emerald-800 outline-none bg-transparent" value={formatRibuan(value)} onChange={(e) => onChange(parseRibuan(e.target.value))} />
                                      )}
                                    />
                                  </div>
                                </div>
                            ) : !isStockIn && selectedProductObj ? (
                                <div className="w-full flex flex-col relative">
                                  <div className="h-[24px] flex items-center mb-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pilih Sumber Kloter Masuk <span className="text-red-500">*</span></label>
                                  </div>
                                  {/* Select ini sengaja TIDAK dikunci agar gudang bisa mengatur FIFO */}
                                  <select required {...register(`items.${index}.batchId`)} className="w-full px-4 h-[56px] border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:outline-none bg-white text-sm font-bold text-slate-900 shadow-sm cursor-pointer relative z-10">
                                    <option value="" disabled>-- Pilih Sumber Stok Terdaftar --</option>
                                    {selectedProductObj.batches?.filter(b => b.qty > 0).map((batch, bIdx) => (
                                        <option key={batch._id || bIdx} value={batch._id}>
                                            {new Date(batch.dateIn).toLocaleDateString('id-ID')} | Sisa: {batch.qty} {currentUnit} | Rp {batch.pricePerUnit?.toLocaleString('id-ID')}
                                        </option>
                                    ))}
                                  </select>
                                </div>
                            ) : (
                                <div className="p-5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-[11px] font-bold text-slate-400 italic text-center flex items-center justify-center h-[56px] mt-[32px]">
                                    Silakan pilih barang untuk melihat riwayat kloter.
                                </div>
                            )}

                            {/* JUMLAH INPUT */}
                            <div className="w-full flex flex-col">
                                <div className="h-[24px] flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Jumlah {isStockIn ? 'Masuk' : 'Keluar'}</label>
                                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner">
                                        {['Pcs', 'Paket'].map(u => (
                                            <button 
                                              key={u} 
                                              type="button" 
                                              disabled={!isStockIn && isSoLocked}
                                              onClick={() => setValue(`items.${index}.unit`, u)} 
                                              className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all duration-300 disabled:cursor-not-allowed ${currentUnit === u ? (isStockIn ? 'bg-emerald-600 text-white shadow-sm' : 'bg-red-600 text-white shadow-sm') : 'text-slate-500 hover:bg-slate-200'}`}
                                            >
                                              {u}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="relative h-[56px]">
                                  <input 
                                    type="number" 
                                    min="1" 
                                    placeholder="0" 
                                    disabled={!isStockIn && isSoLocked}
                                    className="w-full h-full pl-4 pr-16 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:outline-none font-black text-2xl text-slate-900 transition-all shadow-sm bg-white disabled:bg-slate-100 disabled:text-slate-500" 
                                    {...register(`items.${index}.quantity`)} 
                                  />
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                      <span className="text-sm font-black text-slate-300 uppercase tracking-widest">{currentUnit}</span>
                                  </div>
                                </div>
                                {errors?.items?.[index]?.quantity && <p className="text-[11px] font-bold text-red-600 mt-1 uppercase">{errors.items[index].quantity.message}</p>}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Tombol Tambah disembunyikan jika SO dikunci */}
                    {!(!isStockIn && isSoLocked) && (
                        <button
                          type="button"
                          onClick={() => append(defaultItem)}
                          className="w-full py-5 border-4 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-[12px] hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-all flex items-center justify-center gap-3 uppercase tracking-wider bg-white shadow-sm"
                        >
                          <Plus size={20} strokeWidth={3} /> Tambah Masukan Barang Lain
                        </button>
                    )}
                  </div>
                </form>
              </div>

              {/* FOOTER TRANSAKSI */}
              <div className="px-6 py-5 border-t-2 border-slate-200 bg-white z-10 shadow-lg">
                <div className="flex flex-col md:flex-row items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    {isStockIn && stockInType === 'NEW_PURCHASE' && hasAnyTotal ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Estimasi Valuasi</span>
                          {Object.entries(grandTotals).map(([cur, tot]) => tot > 0 && (
                            <span key={cur} className="text-2xl font-black text-slate-900 leading-none mt-1">
                                <span className="text-emerald-600 mr-1.5">{cur === 'USD' ? '$' : 'Rp'}</span>
                                {tot.toLocaleString(cur === 'USD' ? 'en-US' : 'id-ID')}
                            </span>
                          ))}
                        </div>
                    ) : (
                      <div className="flex items-center gap-3 text-slate-400 italic">
                        <Calculator size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Menunggu Input Form Barang...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button type="button" onClick={onClose} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-800 transition-colors">Batal</button>
                    <button form="stock-form" type="submit" disabled={isSubmitting} className={`flex-1 md:flex-none px-10 py-4 text-sm font-black text-white rounded-xl transition-all uppercase tracking-widest shadow-md ${isStockIn ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} ${isSubmitting ? 'opacity-50' : 'active:scale-95'}`}>
                        {isSubmitting ? 'Menyimpan...' : `Simpan ${fields.length} Permintaan`}
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