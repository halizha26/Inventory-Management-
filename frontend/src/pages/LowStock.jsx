import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package, Search, XOctagon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import productService from '../services/productService';

const LowStock = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // State untuk Tab Navigasi - Default: 'OUT' (Habis)
  const [activeTab, setActiveTab] = useState('OUT'); 

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      const allProducts = data?.products || data || [];
      
      const warningItems = Array.isArray(allProducts) ? allProducts.filter(p => {
          const qty = Number(p?.quantity ?? 0);
          const isLowOrOut = qty <= 25;
          
          // Null-safe check untuk property category
          const categoryName = p?.category ? String(p.category).toLowerCase() : '';
          
          // MENDETEKSI DUA KATEGORI: Logistik Material ATAU Learning Material (termasuk sub-kategori)
          const isTargetCategory = categoryName.includes('logistik material') || categoryName.includes('learning material');
          
          return isLowOrOut && isTargetCategory;
      }) : [];
      
      setProducts(warningItems);
    } catch (error) {
      console.error("Error fetching stock warning data:", error);
      toast.error('Gagal memuat data peringatan stok');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  // 1. FILTER BERDASARKAN STATUS TAB
  const lowStockItems = products.filter(p => p.quantity > 0 && p.quantity <= 25);
  const outOfStockItems = products.filter(p => p.quantity === 0);

  // 2. TENTUKAN DATA MANA YANG AKAN DITAMPILKAN & FILTER BERDASARKAN PENCARIAN
  const currentItems = activeTab === 'LOW' ? lowStockItems : outOfStockItems;
  const filteredProducts = currentItems.filter(p => 
    p?.name?.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          {activeTab === 'LOW' ? (
             <AlertTriangle className="text-amber-500" size={28} />
          ) : (
             <XOctagon className="text-red-500" size={28} />
          )}
          Peringatan Stok: Logistik & Learning Material
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Pantau khusus produk kategori <span className="font-bold">Logistik Material</span> dan <span className="font-bold">Learning Material</span> yang membutuhkan tindakan pembelian (Restock). Batas stok kritis (Low Stock) adalah ≤ 25 unit.
        </p>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab('OUT')}
          className={`relative px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
            activeTab === 'OUT' 
            ? 'text-red-600' 
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          <XOctagon size={18} />
          Habis (Out of Stock)
          <span className={`ml-2 px-2 py-0.5 text-[10px] rounded-full ${activeTab === 'OUT' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
            {outOfStockItems.length}
          </span>
          {activeTab === 'OUT' && (
            <div className="absolute bottom-[-2px] left-0 w-full h-1 bg-red-500 rounded-t-full"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('LOW')}
          className={`relative px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
            activeTab === 'LOW' 
            ? 'text-amber-600' 
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          <AlertTriangle size={18} />
          Kritis (Low Stock)
          <span className={`ml-2 px-2 py-0.5 text-[10px] rounded-full ${activeTab === 'LOW' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
            {lowStockItems.length}
          </span>
          {activeTab === 'LOW' && (
            <div className="absolute bottom-[-2px] left-0 w-full h-1 bg-amber-500 rounded-t-full"></div>
          )}
        </button>
      </div>

      {/* TOOLBAR PENCARIAN */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder={`Cari barang ${activeTab === 'LOW' ? 'kritis' : 'habis'}...`}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={`text-sm font-bold px-4 py-2 rounded-lg border ${
            activeTab === 'LOW' 
            ? 'text-amber-600 bg-amber-50 border-amber-200' 
            : 'text-red-600 bg-red-50 border-red-200'
        }`}>
            {filteredProducts.length} Data Ditampilkan
        </div>
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white uppercase font-bold tracking-wider text-[12px]">
                <th className="px-6 py-5 border-r border-slate-700/50">Nama Produk</th>
                <th className="px-6 py-5 border-r border-slate-700/50 text-center">Stok Saat Ini</th>
                <th className="px-6 py-5 border-r border-slate-700/50 text-center">Status</th>
                <th className="px-6 py-5 text-center">Kategori</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center font-bold text-slate-500 italic">Memuat data inventaris...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Package className="text-gray-300" size={56} strokeWidth={1.5} />
                      <p className="font-bold text-gray-500 text-lg">
                        {search 
                          ? 'Tidak ada barang yang cocok dengan pencarianmu.' 
                          : activeTab === 'LOW' 
                            ? 'Hebat! Stok material terpantau aman di atas 25 unit.' 
                            : 'Aman! Tidak ada material yang kehabisan stok.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product, index) => (
                  <tr key={product?._id || index} className={`transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/50`}>
                    <td className="px-6 py-6 border-r border-slate-100">
                      <div className="font-bold text-slate-900 text-sm md:text-base uppercase tracking-tight">{product?.name || 'Tanpa Nama'}</div>
                      {product?.sku && <div className="text-[11px] text-gray-400 mt-1 font-bold">SKU: {product.sku}</div>}
                    </td>
                    <td className="px-6 py-6 border-r border-slate-100 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-2xl font-black ${product.quantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                          {product.quantity}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{product.unit || 'Unit'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 border-r border-slate-100 text-center">
                      <span className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest border-2 shadow-sm ${
                        product.quantity === 0 
                        ? 'bg-red-50 text-red-700 border-red-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {product.quantity === 0 ? 'Habis (Out)' : 'Kritis (Low)'}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-center">
                        <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md border border-slate-200 uppercase tracking-wider">
                            {product.category || 'Tanpa Kategori'}
                        </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LowStock;