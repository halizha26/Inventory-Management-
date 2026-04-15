import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, Layers, Tag, DollarSign, Truck, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

import Input from '../common/Input';
import Button from '../common/Button';
import productService from '../../services/productService';

// --- STRUKTUR KATEGORI 4 LEVEL (Super Fleksibel) ---
const CATEGORY_TREE = {
  "Logistik Material": null, 
  "Office Asset": null,      
  "Learning Material": {     
    "CELEMI": {
        // Punya Varian (Level 4)
        "Apples & Oranges": [
            "Triple Bottom Line", 
            "Manufacturing", 
            "Manufacturing Sales", 
            "Service", 
            "Retail", 
            "Health Care"
        ],
        // Tidak punya varian (kosong)
        "Tango": [], 
        "Decision Base": [],
        "Enterprise": [], 
        "Cayenne": [], 


    },
    "NuPMK": {
        "BBM (Branch Banking Mangement)": [],
        "IM": []
    },
    "Industry Master": {
        "Bike Manger": [],
        "Banking": [],
        "Airport Management": [],
        "Consumer Packaged Goods": [],
        "Telco Operator 5G": []

    }
  }
};

const CURRENCIES = ['IDR', 'USD'];
const REGULAR_SUPPLIERS = ['CELEMI', 'PADUKA'];

const schema = yup.object({
  name: yup.string()
    .required('Product name is required')
    .matches(/^[A-Z]/, 'Product name must start with a capital letter'),
  sku: yup.string().required('SKU is required'),
  category: yup.string().required('Category is required'),
  quantity: yup.number().typeError('Quantity must be a number').min(0, 'Min 0').required('Quantity is required'),
  currency: yup.string().required('Currency is required'),
  price: yup.number().typeError('Price must be a number').min(0, 'Min 0').required('Price is required'),
  description: yup.string(),
  supplier: yup.string().required('Supplier is required'), 
}).required();

const ProductModal = ({ isOpen, onClose, productToEdit, onSuccess }) => {
  const [supplierType, setSupplierType] = useState('regular');
  
  // State Kategori Bertingkat
  const [kategoriUtama, setKategoriUtama] = useState('');
  const [subKategori, setSubKategori] = useState('');
  const [detailKategori, setDetailKategori] = useState('');
  const [varianKategori, setVarianKategori] = useState(''); // State Baru untuk Level 4

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { currency: 'IDR' },
  });

  // --- LOGIKA PENGECEKAN DINAMIS ---
  const isLearningMaterial = kategoriUtama === 'Learning Material';
  
  // Ambil data dari tree secara aman (mencegah error jika kosong)
  const level2Data = isLearningMaterial ? CATEGORY_TREE["Learning Material"] : null;
  const level3Data = (isLearningMaterial && subKategori) ? level2Data[subKategori] : null;
  const level4Data = (level3Data && detailKategori) ? level3Data[detailKategori] : [];
  
  // Cek apakah modul yang dipilih punya varian (Level 4)
  const hasVarian = level4Data && level4Data.length > 0;

  useEffect(() => {
    // Penggabungan Data: Utama - Merek - Modul - Varian
    let combinedCategory = kategoriUtama;
    
    if (isLearningMaterial) {
      combinedCategory = [kategoriUtama, subKategori, detailKategori, varianKategori].filter(Boolean).join(' - ');
    }
    
    setValue('category', combinedCategory, { shouldValidate: true });
  }, [kategoriUtama, subKategori, detailKategori, varianKategori, isLearningMaterial, setValue]);

  useEffect(() => {
    if (productToEdit) {
      const fields = ['name', 'sku', 'quantity', 'price', 'description', 'supplier'];
      fields.forEach(field => setValue(field, productToEdit[field]));
      setValue('currency', productToEdit.currency || 'IDR');
      
      if (productToEdit.category) {
        const catParts = productToEdit.category.split(' - ');
        setKategoriUtama(catParts[0] || '');
        
        if (catParts[0] === 'Learning Material') {
          setSubKategori(catParts[1] || '');
          setDetailKategori(catParts[2] || '');
          setVarianKategori(catParts[3] || ''); // Parsing varian jika ada
        } else {
          setSubKategori('');
          setDetailKategori('');
          setVarianKategori('');
        }
      }
      
      if (REGULAR_SUPPLIERS.includes(productToEdit.supplier)) {
        setSupplierType('regular');
      } else {
        setSupplierType('adhoc');
      }
    } else {
      reset({ currency: 'IDR', supplier: '' });
      setSupplierType('regular');
      setKategoriUtama('');
      setSubKategori('');
      setDetailKategori('');
      setVarianKategori('');
    }
  }, [productToEdit, reset, setValue, isOpen]);

  const onSubmit = async (data) => {
    try {
      // Validasi Ekstra untuk Learning Material
      if (isLearningMaterial) {
        if (!subKategori || !detailKategori) {
            toast.error('Mohon lengkapi Merek dan Modul Barang!');
            return;
        }
        // Cegah save jika modul punya varian tapi user lupa pilih
        if (hasVarian && !varianKategori) {
            toast.error('Modul ini memiliki Varian, mohon dipilih!');
            return;
        }
      }

      if (productToEdit) {
        await productService.update(productToEdit._id, data);
        toast.success('Product updated successfully');
      } else {
        await productService.create(data);
        toast.success('Product created successfully');
      }
      onSuccess();
      onClose();
      reset({ currency: 'IDR' });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto pointer-events-auto border-2 border-slate-100 flex flex-col">
              
              {/* HEADER */}
              <div className="flex items-center justify-between p-8 border-b-2 border-slate-100 bg-slate-800 text-white sticky top-0 z-10 shadow-sm">
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">
                    {productToEdit ? 'Edit Data Produk' : 'Tambah Produk Baru'}
                    </h3>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Master Data Inventory</p>
                </div>
                <button onClick={onClose} className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-full transition-all active:scale-95">
                  <X size={24} strokeWidth={3} />
                </button>
              </div>

              {/* FORM BODY */}
              <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8 bg-slate-50/50">
                
                {/* 1. IDENTITAS PRODUK */}
                <div className="bg-white p-6 rounded-[24px] border-2 border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag size={20} className="text-blue-500" />
                    <label className="text-sm font-black text-slate-800 uppercase tracking-widest">Identitas Produk</label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Nama Produk" placeholder="e.g. Buku Fasilitator" error={errors.name} className="font-bold py-4 text-base" {...register('name')} />
                    <Input label="SKU (Kode Barang)" placeholder="e.g. C-AO-TBL-01" error={errors.sku} className="font-bold py-4 text-base uppercase" {...register('sku')} />
                  </div>
                </div>

                {/* 2. KLASIFIKASI KATEGORI (Grid 2 Kolom Dinamis) */}
                <div className="bg-white p-6 rounded-[24px] border-2 border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers size={20} className="text-indigo-500" />
                    <label className="text-sm font-black text-slate-800 uppercase tracking-widest">Klasifikasi Kategori</label>
                  </div>
                  
                  <div className={`grid grid-cols-1 gap-5 transition-all duration-300 ${isLearningMaterial ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
                    {/* Level 1: Utama */}
                    <div className="flex flex-col gap-2">
                      <select
                        value={kategoriUtama}
                        onChange={(e) => {
                          setKategoriUtama(e.target.value);
                          setSubKategori(''); 
                          setDetailKategori('');
                          setVarianKategori('');
                        }}
                        className={`px-4 py-4 border-2 rounded-xl font-bold text-sm outline-none transition-all ${errors.category && !kategoriUtama ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}`}
                      >
                        <option value="">-- Kategori Utama --</option>
                        {Object.keys(CATEGORY_TREE).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>

                    {/* Level 2: Merek / Franchise */}
                    {isLearningMaterial && (
                      <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
                        <select
                          value={subKategori}
                          onChange={(e) => {
                            setSubKategori(e.target.value);
                            setDetailKategori(''); 
                            setVarianKategori('');
                          }}
                          className="px-4 py-4 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.08)] border-indigo-100"
                        >
                          <option value="">-- Merek / Franchise --</option>
                          {Object.keys(level2Data || {}).map(sub => <option key={sub} value={sub}>{sub}</option>)}
                        </select>
                      </div>
                    )}

                    {/* Level 3: Modul */}
                    {isLearningMaterial && (
                      <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-left-4 duration-500">
                        <select
                          value={detailKategori}
                          onChange={(e) => {
                            setDetailKategori(e.target.value);
                            setVarianKategori('');
                          }}
                          disabled={!subKategori}
                          className="px-4 py-4 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.08)] border-indigo-100"
                        >
                          <option value="">-- Modul Program --</option>
                          {Object.keys(level3Data || {}).map(det => <option key={det} value={det}>{det}</option>)}
                        </select>
                      </div>
                    )}

                    {/* Level 4: Varian (Hanya muncul jika Modul yang dipilih punya varian) */}
                    {isLearningMaterial && hasVarian && (
                      <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-500">
                        <select
                          value={varianKategori}
                          onChange={(e) => setVarianKategori(e.target.value)}
                          className="px-4 py-4 border-2 border-indigo-300 bg-indigo-50/50 rounded-xl font-black text-indigo-900 text-sm outline-none transition-all focus:border-indigo-600 focus:ring-4 focus:ring-indigo-200 cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                        >
                          <option value="">-- Pilih Varian Khusus --</option>
                          {level4Data.map(varian => <option key={varian} value={varian}>{varian}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  <input type="hidden" {...register('category')} />
                  {errors.category && <p className="text-[10px] font-black text-red-500 uppercase mt-1">{errors.category.message}</p>}
                </div>

                {/* 3. STOK & HARGA */}
                <div className="bg-white p-6 rounded-[24px] border-2 border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={20} className="text-emerald-500" />
                    <label className="text-sm font-black text-slate-800 uppercase tracking-widest">Stok & Nilai Barang</label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Jumlah Awal (Stok)" type="number" placeholder="0" error={errors.quantity} className="font-bold py-4 text-2xl text-center text-slate-800" {...register('quantity')} />

                    <div className="flex flex-col gap-1">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Harga Satuan</label>
                      <div className="flex border-2 border-slate-200 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-emerald-100 focus-within:border-emerald-500 transition-all bg-white">
                        <select
                          className="px-4 py-4 bg-slate-50 border-r-2 border-slate-200 font-black text-emerald-600 text-sm outline-none cursor-pointer"
                          {...register('currency')}
                        >
                          {CURRENCIES.map(c => <option key={c} value={c}>{c === 'IDR' ? 'Rp' : '$'}</option>)}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          className="w-full px-4 py-4 font-black text-xl text-emerald-700 outline-none"
                          {...register('price')}
                        />
                      </div>
                      {errors.price && <p className="text-[10px] font-black text-red-600 mt-1 uppercase">{errors.price.message}</p>}
                    </div>
                  </div>
                </div>

                {/* 4. SUPPLIER INFO */}
                <div className="flex flex-col gap-1 bg-white p-6 rounded-[24px] border-2 border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <Truck size={20} className="text-orange-500" />
                        <label className="text-sm font-black text-slate-800 uppercase tracking-widest">Informasi Supplier</label>
                    </div>
                    <div className="flex bg-slate-100 border-2 border-slate-200 rounded-xl p-1 gap-1">
                      <button
                        type="button"
                        onClick={() => { setSupplierType('regular'); setValue('supplier', ''); }}
                        className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${supplierType === 'regular' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Mitra Tetap
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSupplierType('adhoc'); setValue('supplier', ''); }}
                        className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${supplierType === 'adhoc' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Ad-hoc (Lain)
                      </button>
                    </div>
                  </div>

                  {supplierType === 'regular' ? (
                    <select
                      className={`w-full px-4 py-4 border-2 rounded-xl bg-white focus:ring-4 focus:ring-orange-100 focus:border-orange-500 font-bold text-sm outline-none transition-all ${errors.supplier ? 'border-red-400' : 'border-slate-200'}`}
                      {...register('supplier')}
                    >
                      <option value="">-- Pilih Supplier Tetap --</option>
                      {REGULAR_SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <Input 
                      placeholder="Ketik nama supplier manual..." 
                      error={errors.supplier} 
                      className="font-bold py-4 text-base"
                      {...register('supplier')} 
                    />
                  )}
                </div>

                {/* 5. DESKRIPSI */}
                <div className="bg-white p-6 rounded-[24px] border-2 border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText size={20} className="text-slate-400" />
                        <label className="text-sm font-black text-slate-800 uppercase tracking-widest">Catatan Tambahan</label>
                    </div>
                    <textarea
                        className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all min-h-[100px] font-bold text-sm"
                        placeholder="Tuliskan spesifikasi detail atau catatan untuk barang ini..."
                        {...register('description')}
                    />
                </div>

                {/* FOOTER BUTTONS */}
                <div className="flex flex-col md:flex-row items-center justify-end gap-4 pt-4 border-t-2 border-slate-200">
                  <button 
                    type="button" 
                    onClick={onClose} 
                    className="w-full md:w-auto px-8 py-5 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors italic"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`w-full md:w-auto px-12 py-5 text-lg font-black text-white rounded-2xl transition-all shadow-xl uppercase tracking-widest flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 active:scale-95 ${isSubmitting ? 'opacity-50' : ''}`}
                  >
                    {isSubmitting ? 'Menyimpan...' : (productToEdit ? 'Simpan Perubahan' : 'Tambah Produk')}
                  </button>
                </div>
              </form>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProductModal;