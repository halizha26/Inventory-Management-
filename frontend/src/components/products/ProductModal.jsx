import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, Layers, Tag, DollarSign, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

import Input from '../common/Input';
import productService from '../../services/productService';

// 👇 1. DATABASE COA EXCEL (Otomatisasi Data Master NuPMK) 👇
const COA_DATABASE = [
  // Logistik Material
  { name: "Pensil", sku: "115011", mainCat: "Logistik Material", subCat: "Inventory Class Delivery" },
  { name: "Bolpoint", sku: "115012", mainCat: "Logistik Material", subCat: "Inventory Class Delivery" },
  { name: "Penghapus", sku: "115013", mainCat: "Logistik Material", subCat: "Inventory Class Delivery" },
  { name: "Tas Rhodey", sku: "115014", mainCat: "Logistik Material", subCat: "Inventory Class Delivery" },
  { name: "Blocknote", sku: "115015", mainCat: "Logistik Material", subCat: "Inventory Class Delivery" },
  { name: "Workbook", sku: "115016", mainCat: "Logistik Material", subCat: "Inventory Class Delivery" },
  { name: "Giftset 3in1", sku: "115017", mainCat: "Logistik Material", subCat: "Inventory Class Delivery" },
  { name: "Giftset 2in1", sku: "115018", mainCat: "Logistik Material", subCat: "Inventory Class Delivery" },
  { name: "Goodiebag", sku: "115019", mainCat: "Logistik Material", subCat: "Inventory Class Delivery" },
  { name: "Tumbler", sku: "115020", mainCat: "Logistik Material", subCat: "Inventory Class Delivery" },
  { name: "Gantungan Kunci", sku: "115021", mainCat: "Logistik Material", subCat: "Inventory Class Delivery" },

  // Learning Material
  { name: "AO", sku: "115021-C", mainCat: "Learning Material", subCat: "CELEMI", detailCat: "Apples & Oranges" }, 
  { name: "AM", sku: "115022", mainCat: "Learning Material", subCat: "Industry Master", detailCat: "Airport Management" },
  { name: "BIKE", sku: "115023", mainCat: "Learning Material", subCat: "Industry Master", detailCat: "Bike Manger" },
  { name: "BNK", sku: "115024", mainCat: "Learning Material", subCat: "Industry Master", detailCat: "Banking" },
  { name: "CAY", sku: "115025", mainCat: "Learning Material", subCat: "CELEMI", detailCat: "Cayenne" },
  { name: "DAO", sku: "115026", mainCat: "Learning Material", subCat: "CELEMI", detailCat: "Decision Base" }, 
  { name: "DB", sku: "115027", mainCat: "Learning Material", subCat: "CELEMI", detailCat: "Decision Base" },
  { name: "DIST", sku: "115028", mainCat: "Learning Material", subCat: "CELEMI", detailCat: "Enterprise" }, 
  { name: "ENT", sku: "115029", mainCat: "Learning Material", subCat: "CELEMI", detailCat: "Enterprise" },
  { name: "SUS", sku: "115030", mainCat: "Learning Material", subCat: "CELEMI", detailCat: "Sustainability" },
  { name: "AO TBL", sku: "115031", mainCat: "Learning Material", subCat: "CELEMI", detailCat: "Apples & Oranges", varian: "Triple Bottom Line" },
  { name: "BBM", sku: "115032", mainCat: "Learning Material", subCat: "NuPMK", detailCat: "BBM (Branch Banking Mangement)" },

  // Office Asset
  { name: "Wireless Mic", sku: "12401", mainCat: "Office Asset", subCat: "Fixed Assets" },
  { name: "Pointers Pen", sku: "12402", mainCat: "Office Asset", subCat: "Fixed Assets" }
];

// 👇 2. KATEGORI DIPERBARUI MENJADI DINAMIS UNTUK SELURUH COA 👇
const CATEGORY_TREE = {
  "Logistik Material": {     
      "Inventory Class Delivery": []
  },
  "Office Asset": {      
      "Fixed Assets": [],
      "Office Equipment": []
  },
  "Learning Material": {     
    "CELEMI": {
        "Apples & Oranges": ["Triple Bottom Line", "Manufacturing", "Manufacturing Sales", "Service", "Retail", "Health Care"],
        "Tango": [], 
        "Decision Base": [],
        "Enterprise": [], 
        "Cayenne": [], 
        "Sustainability": []
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

const defaultCategoryOptions = Object.keys(CATEGORY_TREE).map(cat => ({ value: cat, label: cat }));
const CURRENCIES = ['IDR', 'USD'];
const REGULAR_SUPPLIERS = ['CELEMI', 'PADUKA'];

const schema = yup.object({
  name: yup.string().required('Product name is required').matches(/^[A-Z]/, 'Product name must start with a capital letter'),
  sku: yup.string().required('SKU is required'),
  category: yup.string().required('Category is required'),
  quantity: yup.number().typeError('Quantity must be a number').min(0, 'Min 0').required('Quantity is required'),
  unit: yup.string().oneOf(['Pcs', 'Paket']).default('Pcs'), 
  currency: yup.string().required('Currency is required'),
  price: yup.number().typeError('Price must be a number').min(0, 'Min 0').required('Price is required'),
  description: yup.string(),
  supplier: yup.string().required('Supplier is required'), 
}).required();

const ProductModal = ({ isOpen, onClose, productToEdit, onSuccess, products = [] }) => {
  const [supplierType, setSupplierType] = useState('regular');
  
  const [kategoriUtama, setKategoriUtama] = useState('');
  const [subKategori, setSubKategori] = useState('');
  const [detailKategori, setDetailKategori] = useState('');
  const [varianKategori, setVarianKategori] = useState('');
  
  const [isManualCategory, setIsManualCategory] = useState(false);
  const [dynamicCategoryOptions, setDynamicCategoryOptions] = useState(defaultCategoryOptions);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { currency: 'IDR', unit: 'Pcs' },
  });

  const watchQuantity = watch('quantity', 0);
  const watchPrice = watch('price', 0);
  const watchCurrency = watch('currency', 'IDR');
  const watchUnit = watch('unit') || 'Pcs'; 

  const calculateLiveTotal = () => {
    const qty = Number(watchQuantity) || 0;
    const price = Number(watchPrice) || 0;
    const total = qty * price;
    if (watchCurrency === 'USD') return `$ ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    return `Rp ${Math.round(total).toLocaleString('id-ID')}`;
  };

  // 👇 3. LOGIKA DETEKSI TINGKAT KATEGORI YANG FULLY-DYNAMIC 👇
  const level2Data = CATEGORY_TREE[kategoriUtama] || null;
  const hasSubCategories = level2Data !== null && Object.keys(level2Data).length > 0;
  
  const level3Data = (hasSubCategories && subKategori) ? level2Data[subKategori] : null;
  const isLevel3Array = Array.isArray(level3Data);
  const hasDetailCategories = level3Data !== null && !isLevel3Array && Object.keys(level3Data).length > 0;
  
  const level4Data = hasDetailCategories && detailKategori ? level3Data[detailKategori] : (isLevel3Array ? level3Data : []);
  const hasVarian = level4Data !== null && level4Data.length > 0;

  useEffect(() => {
    if (Array.isArray(products) && products.length > 0) {
      const existingCategories = products.map(p => p?.category ? p.category.split(' - ')[0] : '').filter(Boolean);
      const uniqueCategories = [...new Set([...Object.keys(CATEGORY_TREE), ...existingCategories])];
      setDynamicCategoryOptions(uniqueCategories.map(cat => ({ value: cat, label: cat })));
    } else {
      setDynamicCategoryOptions(defaultCategoryOptions);
    }
  }, [products]);

  // Efek merangkai Kategori untuk Database
  useEffect(() => {
    let combinedCategory = kategoriUtama;
    const parts = [kategoriUtama, subKategori, detailKategori, varianKategori].filter(Boolean);
    if (parts.length > 1) {
        combinedCategory = parts.join(' - ');
    }
    setValue('category', combinedCategory, { shouldValidate: true });
  }, [kategoriUtama, subKategori, detailKategori, varianKategori, setValue]);

  useEffect(() => {
    if (productToEdit) {
      const fields = ['name', 'sku', 'quantity', 'price', 'description', 'supplier'];
      fields.forEach(field => setValue(field, productToEdit[field]));
      setValue('currency', productToEdit.currency || 'IDR');
      setValue('unit', productToEdit.unit || 'Pcs'); 
      
      if (productToEdit.category) {
        const catParts = productToEdit.category.split(' - ');
        const mainCat = catParts[0] || '';
        
        if (mainCat && CATEGORY_TREE[mainCat]) {
          setKategoriUtama(mainCat);
          setSubKategori(catParts[1] || '');
          setDetailKategori(catParts[2] || '');
          setVarianKategori(catParts[3] || '');
          setIsManualCategory(false);
        } else {
          setIsManualCategory(true);
          setKategoriUtama(mainCat);
          setSubKategori(''); setDetailKategori(''); setVarianKategori('');
        }
      }
      setSupplierType(REGULAR_SUPPLIERS.includes(productToEdit.supplier) ? 'regular' : 'adhoc');
    } else {
      reset({ currency: 'IDR', supplier: '', unit: 'Pcs' });
      setSupplierType('regular');
      setKategoriUtama(''); setSubKategori(''); setDetailKategori(''); setVarianKategori('');
      setIsManualCategory(false);
    }
  }, [productToEdit, reset, setValue, isOpen]);

  // 👇 EFEK BARU: Auto-Generate SKU Sekuensial (Sesuai Standar COA NuPMK) 👇
  useEffect(() => {
    const currentName = watch('name');
    const currentSku = watch('sku');

    // 1. Cek apakah produk ini sudah ada di master COA
    const isProductInDB = COA_DATABASE.some(
        item => item.name.toLowerCase() === (currentName || '').toLowerCase()
    );

    // 2. Generate SKU berurutan jika kategori dipilih manual
    if (!isProductInDB && kategoriUtama && !currentSku) {
        let prefix = '';

        // Menentukan Awalan (Prefix) berdasarkan hierarki COA
        if (kategoriUtama === 'Logistik Material' || kategoriUtama === 'Learning Material') {
            prefix = '115';
        } else if (kategoriUtama === 'Office Asset') {
            prefix = '124';
        } else {
            prefix = '999'; // Kategori custom baru di luar standar
        }

        // 3. Kumpulkan semua SKU dari master COA + produk yang sudah ada di DB
        const allSkus = [...COA_DATABASE, ...(products || [])]
            .map(p => p.sku || '')
            .filter(sku => sku.startsWith(prefix));

        let newSkuStr = '';

        if (allSkus.length > 0) {
            // Ambil murni angka dari SKU (Abaikan karakter huruf khusus seperti "115021-C")
            const skuNumbers = allSkus
                .map(sku => parseInt(sku.replace(/\D/g, ''), 10))
                .filter(n => !isNaN(n));
            
            const maxSkuNumber = Math.max(...skuNumbers);
            
            // Auto-increment dari SKU tertinggi yang ditemukan
            newSkuStr = (maxSkuNumber + 1).toString();
        } else {
            // Nomor awal default jika database untuk kategori ini masih kosong
            newSkuStr = prefix === '115' ? '115001' : (prefix === '124' ? '12401' : '99901');
        }

        // 4. Masukkan otomatis ke kolom input SKU
        setValue('sku', newSkuStr, { shouldValidate: true });
    }
  }, [kategoriUtama, watch, setValue, products]);

  const onSubmit = async (data) => {
    try {
      // 1. Validasi dinamis kategori (Kode yang sudah kamu miliki)
      if (hasSubCategories && !subKategori) { toast.error('Mohon lengkapi Merek / Sub-Kategori!'); return; }
      if (hasDetailCategories && !detailKategori) { toast.error('Mohon lengkapi Modul / Detail Barang!'); return; }
      if (hasVarian && !varianKategori) { toast.error('Barang ini memiliki Varian Khusus, mohon dipilih!'); return; }

      // 👇 2. TAMBAHKAN VALIDASI MUTLAK MASTER COA DI SINI 👇
      const isSkuInCOA = COA_DATABASE.find(item => item.sku === data.sku);
      const isNameInCOA = COA_DATABASE.find(item => item.name.toLowerCase() === data.name.toLowerCase());

      // Skenario A: User pakai SKU Master COA, tapi mengubah namanya (Kasus "Gjkiiftset" di gambar)
      if (isSkuInCOA && isSkuInCOA.name.toLowerCase() !== data.name.toLowerCase()) {
          toast.error(`⛔ Validasi Ditolak: SKU ${data.sku} adalah kode mutlak untuk "${isSkuInCOA.name}".`);
          return; // Hentikan proses save
      }

      // Skenario B: User pakai Nama Master COA, tapi mengubah SKU-nya jadi angka lain
      if (isNameInCOA && isNameInCOA.sku !== data.sku) {
          toast.error(`⛔ Validasi Ditolak: "${isNameInCOA.name}" adalah data Master dengan SKU paten ${isNameInCOA.sku}.`);
          return; // Hentikan proses save
      }
      // 👆 SELESAI TAMBAHAN VALIDASI COA 👆

      // 3. Proses eksekusi ke Backend (Kode yang sudah kamu miliki)
      if (productToEdit) {
        await productService.update(productToEdit._id, data);
        toast.success('Product updated successfully');
      } else {
        await productService.create(data);
        toast.success('Product created successfully');
      }
      onSuccess();
      onClose();
      reset({ currency: 'IDR', unit: 'Pcs' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80]" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto pointer-events-auto border-2 border-slate-100 flex flex-col">
              
              <div className="flex items-center justify-between p-8 border-b-2 border-slate-100 bg-slate-800 text-white sticky top-0 z-10 shadow-sm">
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">{productToEdit ? 'Edit Data Produk' : 'Tambah Produk Baru'}</h3>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Master Data Inventory</p>
                </div>
                <button onClick={onClose} className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-full transition-all active:scale-95"><X size={24} strokeWidth={3} /></button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8 bg-slate-50/50">
                
                <div className="bg-white p-6 rounded-[24px] border-2 border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag size={20} className="text-blue-500" />
                    <label className="text-sm font-black text-slate-800 uppercase tracking-widest">Identitas Produk</label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* 👇 4. KOMPONEN AUTO-COMPLETE COA (MAGIC DETECTOR) 👇 */}
                    <div className="flex flex-col gap-1.5 space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nama Produk <span className="text-blue-500">*</span></label>
                        <input
                            list="coa-products"
                            autoComplete="off"
                            placeholder="Ketik atau pilih nama produk..."
                            className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:outline-none text-base font-bold shadow-sm transition-all text-slate-900 bg-white ${errors.name ? 'border-red-400' : 'border-slate-200'}`}
                            {...register('name')}
                            onChange={(e) => {
                                register('name').onChange(e); // Beritahu React-Hook-Form
                                const val = e.target.value;
                                
                                // Auto-Detect COA Magic
                                const matched = COA_DATABASE.find(item => item.name.toLowerCase() === val.toLowerCase());
                                if (matched) {
                                    setValue('sku', matched.sku, { shouldValidate: true });
                                    setIsManualCategory(false);
                                    setKategoriUtama(matched.mainCat || '');
                                    setSubKategori(matched.subCat || '');
                                    setDetailKategori(matched.detailCat || '');
                                    setVarianKategori(matched.varian || '');
                                    
                                    toast.success(`Data COA Ditemukan! SKU dan Kategori otomatis diisi.`, { icon: '✨' });
                                }
                            }}
                        />
                        <datalist id="coa-products">
                            {COA_DATABASE.map((item, idx) => (
                                <option key={idx} value={item.name} />
                            ))}
                        </datalist>
                        {errors.name && <p className="text-[11px] font-bold text-red-600 uppercase mt-1">{errors.name.message}</p>}
                    </div>

                    <Input label="SKU (Kode Barang)" placeholder="e.g. C-AO-TBL-01" error={errors.sku} className="font-bold py-4 text-base uppercase" {...register('sku')} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[24px] border-2 border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers size={20} className="text-indigo-500" />
                    <label className="text-sm font-black text-slate-800 uppercase tracking-widest">Klasifikasi Kategori</label>
                  </div>
                  
                  {/* 👇 RENDER KATEGORI SEKARANG 100% DINAMIS 👇 */}
                  <div className={`grid grid-cols-1 gap-5 transition-all duration-300 ${hasSubCategories ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
                    <div className="flex flex-col gap-2">
                      {!isManualCategory ? (
                        <select
                          value={kategoriUtama}
                          onChange={(e) => {
                            if (e.target.value === 'ADD_NEW') {
                              setIsManualCategory(true);
                              setKategoriUtama(''); setSubKategori(''); setDetailKategori(''); setVarianKategori('');
                            } else {
                              setKategoriUtama(e.target.value);
                              setSubKategori(''); setDetailKategori(''); setVarianKategori('');
                            }
                          }}
                          className={`px-4 py-4 bg-white border-2 rounded-xl font-bold text-sm outline-none transition-all cursor-pointer ${errors.category && !kategoriUtama ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}`}
                        >
                          <option value="">-- Pilih Kategori Utama --</option>
                          {dynamicCategoryOptions.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                          <option value="ADD_NEW" className="font-black text-indigo-600 bg-indigo-50">➕ Tambah Kategori Manual Baru...</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-300">
                          <input type="text" autoFocus placeholder="Ketik nama kategori baru..." value={kategoriUtama} onChange={(e) => setKategoriUtama(e.target.value)} className={`w-full px-4 py-4 bg-white border-2 rounded-xl font-bold text-sm outline-none transition-all ${errors.category && !kategoriUtama ? 'border-red-400 focus:ring-red-100' : 'border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}`} />
                          <button type="button" onClick={() => { setIsManualCategory(false); setKategoriUtama(''); }} className="px-4 py-4 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-xl transition-all flex-shrink-0" title="Batal Tambah Manual"><X size={20} strokeWidth={3} /></button>
                        </div>
                      )}
                    </div>

                    {hasSubCategories && (
                      <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
                        <select value={subKategori} onChange={(e) => { setSubKategori(e.target.value); setDetailKategori(''); setVarianKategori(''); }} className="px-4 py-4 bg-white border-2 border-slate-200 rounded-xl font-bold text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.08)] border-indigo-100">
                          <option value="">-- Sub Kategori --</option>
                          {Object.keys(level2Data || {}).map(sub => <option key={sub} value={sub}>{sub}</option>)}
                        </select>
                      </div>
                    )}

                    {hasDetailCategories && (
                      <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-left-4 duration-500">
                        <select value={detailKategori} onChange={(e) => { setDetailKategori(e.target.value); setVarianKategori(''); }} disabled={!subKategori} className="px-4 py-4 bg-white border-2 border-slate-200 rounded-xl font-bold text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.08)] border-indigo-100">
                          <option value="">-- Detail / Modul --</option>
                          {Object.keys(level3Data || {}).map(det => <option key={det} value={det}>{det}</option>)}
                        </select>
                      </div>
                    )}

                    {hasVarian && (
                      <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-500">
                        <select value={varianKategori} onChange={(e) => setVarianKategori(e.target.value)} className="px-4 py-4 border-2 border-indigo-300 bg-indigo-50/50 rounded-xl font-black text-indigo-900 text-sm outline-none transition-all focus:border-indigo-600 focus:ring-4 focus:ring-indigo-200 cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                          <option value="">-- Pilih Varian --</option>
                          {level4Data.map(varian => <option key={varian} value={varian}>{varian}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  <input type="hidden" {...register('category')} />
                  {errors.category && <p className="text-[10px] font-black text-red-500 uppercase mt-1">{errors.category.message}</p>}
                </div>

                <div className="bg-white p-6 rounded-[24px] border-2 border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={20} className="text-emerald-500" />
                    <label className="text-sm font-black text-slate-800 uppercase tracking-widest">Stok & Nilai Barang</label>
                  </div>
                  
                  {/* Desain Presisi Piksel (Pixel-Perfect) Dipertahankan */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="w-full flex flex-col">
                        <div className="h-[32px] flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Jumlah Awal (Stok)</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner">
                                <button type="button" onClick={() => setValue('unit', 'Pcs')} className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all duration-300 ${watchUnit === 'Pcs' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>Pcs</button>
                                <button type="button" onClick={() => setValue('unit', 'Paket')} className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all duration-300 ${watchUnit === 'Paket' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>Paket</button>
                            </div>
                        </div>
                        <div className="relative h-[56px]">
                          <input type="number" min="0" placeholder="0" className={`w-full h-full pl-4 pr-16 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:outline-none font-black text-2xl text-slate-900 bg-white transition-all shadow-sm ${errors.quantity ? 'border-red-500' : 'border-slate-200'}`} {...register('quantity')} />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <span className="text-sm font-black text-slate-300 uppercase tracking-widest">{watchUnit}</span>
                          </div>
                        </div>
                        {errors.quantity && <p className="text-[11px] font-bold text-red-600 uppercase mt-1">{errors.quantity.message}</p>}
                    </div>

                    <div className="w-full flex flex-col">
                      <div className="h-[32px] flex items-center mb-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Harga {watchUnit}</label>
                      </div>
                      <div className="flex border-2 border-slate-200 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-emerald-100 focus-within:border-emerald-500 transition-all bg-white shadow-sm h-[56px]">
                        <select className="px-4 bg-slate-50 border-r-2 border-slate-200 font-black text-emerald-600 text-sm outline-none cursor-pointer h-full" {...register('currency')}>
                          {CURRENCIES.map(c => <option key={c} value={c}>{c === 'IDR' ? 'Rp' : '$'}</option>)}
                        </select>
                        <input type="number" step="0.01" placeholder="0" className="w-full h-full px-4 font-black text-2xl text-emerald-700 outline-none bg-transparent" {...register('price')} />
                      </div>
                      {errors.price && <p className="text-[10px] font-black text-red-600 mt-1 uppercase">{errors.price.message}</p>}
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl flex justify-between items-center animate-in fade-in duration-300">
                    <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Akumulasi Nilai Stok (Total)</span>
                    <span className="text-2xl font-black text-emerald-700 tracking-tight">{calculateLiveTotal()}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 bg-white p-6 rounded-[24px] border-2 border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <Truck size={20} className="text-orange-500" />
                        <label className="text-sm font-black text-slate-800 uppercase tracking-widest">Informasi Supplier</label>
                    </div>
                    <div className="flex bg-slate-100 border-2 border-slate-200 rounded-xl p-1 gap-1">
                      <button type="button" onClick={() => { setSupplierType('regular'); setValue('supplier', ''); }} className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${supplierType === 'regular' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Mitra Tetap</button>
                      <button type="button" onClick={() => { setSupplierType('adhoc'); setValue('supplier', ''); }} className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${supplierType === 'adhoc' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Ad-hoc (Lain)</button>
                    </div>
                  </div>

                  {supplierType === 'regular' ? (
                    <select className={`w-full px-4 py-4 border-2 rounded-xl bg-white focus:ring-4 focus:ring-orange-100 focus:border-orange-500 font-bold text-sm outline-none transition-all shadow-sm ${errors.supplier ? 'border-red-400' : 'border-slate-200'}`} {...register('supplier')}>
                      <option value="">-- Pilih Supplier Tetap --</option>
                      {REGULAR_SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <Input placeholder="Ketik nama supplier manual..." error={errors.supplier} className="font-bold py-4 text-base" {...register('supplier')} />
                  )}
                </div>

                <div className="flex flex-col md:flex-row items-center justify-end gap-4 pt-4 border-t-2 border-slate-200">
                  <button type="button" onClick={onClose} className="w-full md:w-auto px-8 py-5 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors italic">Batal</button>
                  <button type="submit" disabled={isSubmitting} className={`w-full md:w-auto px-12 py-5 text-lg font-black text-white rounded-2xl transition-all shadow-xl uppercase tracking-widest flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 active:scale-95 ${isSubmitting ? 'opacity-50' : ''}`}>
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