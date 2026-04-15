import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, ArrowUpCircle, ArrowDownCircle, Plus, Trash2, Calculator, Coins, Wallet, CreditCard } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

import Input from '../common/Input';
import Button from '../common/Button';
import stockService from '../../services/stockService';
import productService from '../../services/productService';
import { useAuth } from '../../context/AuthContext';

const MotionDiv = motion.div;

const formatRibuan = (angka) => {
  if (!angka) return '';
  const stringAngka = angka.toString().replace(/[^0-9]/g, '');
  return stringAngka.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseRibuan = (string) => {
  return string ? parseInt(string.replace(/\./g, ''), 10) : 0;
};

const itemSchema = yup.object({
  category: yup.string().required('Pilih kategori dulu'),
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

const SelectField = ({ label, name, error, children, registerFn, disabled }) => (
  <div className="w-full">
    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{label}</label>
    <select
      disabled={disabled}
      {...registerFn(name)}
      className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none bg-white text-base font-bold text-slate-700 disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer appearance-none shadow-sm transition-all"
    >
      {children}
    </select>
    {error && <p className="mt-1 text-[10px] font-black text-red-600 ml-1 uppercase">{error.message}</p>}
  </div>
);

const StockModal = ({ isOpen, onClose, type = 'IN', onSuccess }) => {
  const isStockIn = type === 'IN';
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [stockInType, setStockInType] = useState('NEW_PURCHASE'); 

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(isStockIn ? schemaIn : schemaOut),
    defaultValues: {
      items: [{ category: '', productId: '', quantity: '', unitPrice: '', currency: 'IDR' }],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = watch("items");

  const grandTotal = watchedItems?.reduce((acc, curr) => {
    return acc + (Number(curr.quantity || 0) * Number(curr.unitPrice || 0));
  }, 0);

  useEffect(() => {
    if (isOpen) {
      reset({
        items: [{ category: '', productId: '', quantity: '', unitPrice: '', currency: 'IDR' }],
        reason: '',
        salesOrderNumber: ''
      });
      setStockInType('NEW_PURCHASE'); 
      const load = async () => {
        try {
          const prodData = await productService.getAll();
          setProducts(prodData.products);
        } catch {
          toast.error('Gagal mengambil data produk');
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
      toast.success(`Berhasil menyimpan ${data.items.length} data barang!`);
      onClose();
      setTimeout(() => { onSuccess(); }, 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Proses gagal');
    }
  };

  const uniqueCategories = [...new Set(products.map(p => p.category))].filter(Boolean);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <MotionDiv
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80]"
          />
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl pointer-events-auto max-h-[95vh] overflow-hidden flex flex-col border-2 border-slate-100">
              
              {/* HEADER */}
              <div className={`flex items-center justify-between p-8 text-white ${isStockIn ? 'bg-emerald-600' : 'bg-red-600'}`}>
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-white/20 rounded-3xl shadow-inner">
                    {isStockIn ? <ArrowUpCircle size={40} strokeWidth={2.5} /> : <ArrowDownCircle size={40} strokeWidth={2.5} />}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black uppercase tracking-tight leading-none">
                      {isStockIn ? 'Stok Masuk' : 'Stok Keluar'}
                    </h3>
                    <p className="text-[11px] font-black uppercase opacity-80 tracking-[0.3em] mt-2 italic">Input Logistik & Aset</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2.5 hover:bg-white/20 rounded-full transition-all active:scale-90">
                  <X size={36} strokeWidth={3} />
                </button>
              </div>

              {/* BODY SCROLLABLE */}
              <div className="overflow-y-auto flex-1 p-8 bg-slate-50/50">
                <form id="stock-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  
                  {/* DETAIL INFORMASI */}
                  <div className="bg-white p-8 rounded-[32px] border-2 border-slate-200/60 shadow-sm space-y-6">
                    <div className="flex justify-between items-center border-b-2 border-slate-50 pb-5">
                      <div className="flex items-center gap-3">
                        <Wallet className="text-slate-400" size={24} />
                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest font-bold">Informasi Utama</h4>
                      </div>
                      
                      {isStockIn && (
                        <div className="flex bg-slate-100 p-2 rounded-2xl gap-2 border-2 border-slate-200/50">
                          <button
                            type="button"
                            onClick={() => handleTypeChange('NEW_PURCHASE')}
                            className={`px-8 py-3 text-[12px] font-black rounded-xl transition-all uppercase ${stockInType === 'NEW_PURCHASE' ? 'bg-white text-emerald-600 shadow-md font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            Pembelian Baru
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTypeChange('INTERNAL_RETURN')}
                            className={`px-8 py-3 text-[12px] font-black rounded-xl transition-all uppercase ${stockInType === 'INTERNAL_RETURN' ? 'bg-white text-blue-600 shadow-md font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            Barang Sisa
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-bold">
                        <Input
                          label="Alasan / Keterangan"
                          placeholder="Contoh: Stok ulang bulanan..."
                          error={errors.reason}
                          className="font-bold py-4 text-lg rounded-2xl border-2"
                          {...register('reason')}
                        />
                        {!isStockIn && (
                          <Input
                            label="No. Pesanan / SO"
                            placeholder="Contoh: SO-001"
                            error={errors.salesOrderNumber}
                            className="font-bold py-4 text-lg rounded-2xl border-2 uppercase"
                            {...register('salesOrderNumber')}
                          />
                        )}
                    </div>
                  </div>

                  {/* PRODUCTS LIST */}
                  <div className="space-y-6">
                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-[0.25em] ml-2 font-bold">Detail Barang</h4>

                    {fields.map((field, index) => {
                      const selectedCat = watchedItems?.[index]?.category;
                      const filteredProducts = selectedCat ? products.filter(p => p.category === selectedCat) : [];
                      const showPrice = isStockIn && stockInType === 'NEW_PURCHASE';
                      const currentQty = watchedItems?.[index]?.quantity || 0;
                      const currentPrice = watchedItems?.[index]?.unitPrice || 0;

                      return (
                        <div key={field.id} className="relative bg-white p-8 rounded-[32px] border-2 border-slate-200 shadow-lg flex flex-col gap-6 animate-in slide-in-from-bottom-6 duration-500">
                          {fields.length > 1 && (
                            <button type="button" onClick={() => remove(index)} className="absolute -top-4 -right-4 bg-red-600 text-white p-3 rounded-2xl hover:bg-red-700 shadow-xl active:scale-90 transition-all z-10 border-4 border-white">
                              <Trash2 size={24} strokeWidth={3} />
                            </button>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                            <div className="md:col-span-3 font-bold">
                              <SelectField label="Kategori" name={`items.${index}.category`} error={errors?.items?.[index]?.category} registerFn={register}>
                                <option value="">-- Kategori --</option>
                                {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              </SelectField>
                            </div>

                            <div className={showPrice ? "md:col-span-4" : "md:col-span-7"}>
                              <SelectField label="Nama Produk" name={`items.${index}.productId`} error={errors?.items?.[index]?.productId} registerFn={register} disabled={!selectedCat}>
                                <option value="">{!selectedCat ? "Pilih Kategori Dulu" : "-- Pilih Barang --"}</option>
                                {filteredProducts.map(p => <option key={p._id} value={p._id}>{p.name.toUpperCase()} (Stok: {p.quantity})</option>)}
                              </SelectField>
                            </div>

                            {showPrice && (
                              <div className="md:col-span-3 space-y-2">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1 font-bold">Harga Satuan</label>
                                <div className="flex border-2 border-slate-200 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-500 transition-all">
                                  <select {...register(`items.${index}.currency`)} className="bg-slate-50 border-r-2 border-slate-200 px-3 font-black text-blue-600 text-sm font-bold">
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
                                        className="w-full px-4 py-4 font-black text-xl text-emerald-700 outline-none font-bold"
                                        value={formatRibuan(value)}
                                        onChange={(e) => onChange(parseRibuan(e.target.value))}
                                      />
                                    )}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="md:col-span-2">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1 text-center font-bold">Jumlah</label>
                                <input
                                  type="number"
                                  placeholder="0"
                                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 font-black text-3xl text-slate-800 text-center font-bold"
                                  {...register(`items.${index}.quantity`)}
                                />
                            </div>
                          </div>

                          {showPrice && currentQty > 0 && currentPrice > 0 && (
                            <div className="flex justify-end items-center gap-3 pt-4 border-t-2 border-slate-50">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-tighter font-bold">Sub-Total:</span>
                                <span className="text-emerald-700 font-black text-xl font-bold italic">
                                    Rp {(currentQty * currentPrice).toLocaleString('id-ID')}
                                </span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => append({ category: '', productId: '', quantity: '', unitPrice: '', currency: 'IDR' })}
                      className="w-full py-6 border-4 border-dashed border-slate-200 rounded-[32px] text-slate-400 font-black text-sm hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-3 uppercase tracking-widest active:scale-[0.99] font-bold"
                    >
                      <Plus size={28} strokeWidth={4} /> Tambah Barang Lainnya
                    </button>
                  </div>
                </form>
              </div>

              {/* FOOTER - CLEAN & PROFESSIONAL SUMMARY */}
              <div className="px-10 py-8 border-t-2 border-slate-100 bg-white shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  
                  {/* TOTAL SUMMARY AREA */}
                  <div className="flex items-center gap-6">
                    {isStockIn && stockInType === 'NEW_PURCHASE' && grandTotal > 0 ? (
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
                            <CreditCard size={30} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none mb-1.5 font-bold">Total Pembayaran</span>
                          <span className="text-4xl font-black text-slate-900 tracking-tight leading-none font-bold">
                            <span className="text-emerald-600 mr-2 text-2xl font-bold">Rp</span>
                            {grandTotal.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-slate-300 italic">
                        <Calculator size={20} />
                        <span className="text-sm font-bold">Menunggu input barang...</span>
                      </div>
                    )}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-8 py-5 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors font-bold italic"
                    >
                        Batal
                    </button>
                    <button
                        form="stock-form"
                        type="submit"
                        disabled={isSubmitting}
                        className={`flex-1 md:flex-none px-14 py-5 text-lg font-black text-white rounded-[20px] transition-all shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] uppercase tracking-widest flex items-center justify-center gap-3 font-bold ${isStockIn ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'} ${isSubmitting ? 'opacity-50' : 'active:scale-95'}`}
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