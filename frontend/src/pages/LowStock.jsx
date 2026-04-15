import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import productService from '../services/productService';

const LowStock = () => {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLowStock = async () => {
    try {
      setLoading(true);
      // MENGAMBIL SEMUA PRODUK AGAR LOGIKANYA SAMA DENGAN SIDEBAR
      const data = await productService.getAll();
      const allProducts = data.products || [];
      
      // FILTER MANUAL: Stok 10 ke bawah
      const lowItems = allProducts.filter(p => p.quantity <= 10);
      setLowStockProducts(lowItems);
    } catch (error) {
      console.error(error);
      toast.error('Gagal memuat data stok tipis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, []);

  const filteredProducts = lowStockProducts.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="text-amber-500" size={28} />
          Peringatan Stok Tipis (≤ 10)
        </h1>
        <p className="text-sm text-gray-500">Daftar produk yang stoknya sudah kritis dan perlu ditambah.</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Cari nama barang..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-sm font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
            Total: {filteredProducts.length} Produk Terdeteksi
        </div>
      </div>

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
                <tr><td colSpan="4" className="px-6 py-12 text-center font-bold text-slate-500 italic">Mengecek tingkat stok...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="text-gray-300" size={48} />
                      <p className="font-bold text-gray-500">Hebat! Semua stok aman di atas 10 unit.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product, index) => (
                  <tr key={product._id} className={`transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-6 py-6 border-r border-slate-100">
                      <div className="font-bold text-slate-900 text-lg uppercase tracking-tight">{product.name}</div>
                    </td>
                    <td className="px-6 py-6 border-r border-slate-100 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-2xl font-black ${product.quantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                          {product.quantity}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Unit Tersisa</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 border-r border-slate-100 text-center">
                      <span className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border-2 ${
                        product.quantity === 0 
                        ? 'bg-red-100 text-red-700 border-red-300' 
                        : 'bg-amber-100 text-amber-700 border-amber-300'
                      }`}>
                        {product.quantity === 0 ? 'Habis' : 'Kritis'}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-center">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md border border-slate-200 uppercase">
                            {product.category}
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