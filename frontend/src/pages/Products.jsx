import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Package, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-hot-toast";

import productService from "../services/productService";
import ProductModal from "../components/products/ProductModal";
import ProductFilter from "../components/products/ProductFilter"; 
import { useAuth } from "../context/AuthContext";

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  // --- STATE UNTUK KURS BANK INDONESIA ---
  const [usdRate, setUsdRate] = useState(0);

  // --- STATE UNTUK PAGINASI ---
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 20;

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data.products || []);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data produk");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsdRate = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3000/api/settings");
      const data = await res.json();
      if (data && data.usdRate) {
        setUsdRate(data.usdRate);
      }
    } catch (error) {
      console.error("Gagal memuat kurs BI:", error);
    }
  }, []);

  useEffect(() => { 
    fetchProducts(); 
    fetchUsdRate();
  }, [fetchProducts, fetchUsdRate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  const handleEdit = (product) => { 
    setEditingProduct(product); 
    setModalOpen(true); 
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      try {
        await productService.delete(id);
        toast.success("Produk berhasil dihapus");
        fetchProducts();
      } catch {
        toast.error("Gagal menghapus produk");
      }
    }
  };

  const handleModalClose = () => { 
    setModalOpen(false); 
    setEditingProduct(null); 
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filteredProducts = products.filter((p) => {
    const searchTerm = (search || "").toLowerCase();
    const matchName = (p.name || "").toLowerCase().includes(searchTerm);
    const matchSku = (p.sku || "").toLowerCase().includes(searchTerm);
    const matchCategory = categoryFilter === "" || p.category?.includes(categoryFilter); 
    return (matchName || matchSku) && matchCategory;
  });

  const handleSelectAll = () => {
    const currentIds = currentProducts.map(p => p._id);
    const isAllCurrentSelected = currentIds.every(id => selectedIds.includes(id));
    
    if (isAllCurrentSelected) {
      setSelectedIds(prev => prev.filter(id => !currentIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  // --- LOGIKA PAGINASI ---
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // 👇 LOGIKA MULTI-CURRENCY 👇
  const selectedProducts = products.filter(p => selectedIds.includes(p._id));
  const totalSelectedStock = selectedProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);

  const totalSelectedPriceIDR = selectedProducts
    .filter(p => (p.currency || 'IDR') === 'IDR')
    .reduce((sum, p) => sum + (Math.round(Number(p.price || 0)) * (p.quantity || 0)), 0);

  const totalSelectedPriceUSD = selectedProducts
    .filter(p => (p.currency || 'IDR') === 'USD')
    .reduce((sum, p) => sum + (Number(p.price || 0) * (p.quantity || 0)), 0);

  const grandTotalIDR = totalSelectedPriceIDR + (totalSelectedPriceUSD * usdRate);

  // Fungsi Pembantu Formatter Mata Uang Dinamis
  const formatValue = (amount, currency = 'IDR') => {
    if (currency === 'USD') {
      return `$ ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
    return `Rp ${Math.round(Number(amount)).toLocaleString('id-ID')}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <span className="p-2 bg-blue-100 text-blue-600 rounded-xl shadow-sm">
                <Package size={28} />
            </span>
            Daftar Produk
          </h1>
          <p className="text-sm text-gray-500 mt-1 uppercase font-bold tracking-tight">Kelola inventaris dan stok barang Anda</p>
        </div>
        
        {user?.role === "admin" && (
            <button
                onClick={() => setModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black flex items-center gap-2.5 px-6 py-4 rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-wide text-sm border-2 border-blue-700"
            >
                <Plus size={22} strokeWidth={3} />
                Tambah Produk
            </button>
        )}
      </div>

      {/* Filter Section */}
      <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1 w-full space-y-2">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Cari Barang / SKU</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
            <input 
              type="text"
              placeholder="Ketik nama barang di sini..."
              className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none font-bold text-lg text-slate-700 transition-all placeholder:text-slate-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full md:w-72 space-y-2">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Pilih Kategori</label>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select 
              className="w-full pl-12 pr-10 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none font-bold text-lg text-slate-700 bg-white appearance-none cursor-pointer"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              <option value="Logistik Material">Logistik Material</option>
              <option value="Learning Material">Learning Material</option>
              <option value="Office Asset">Office Asset</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                ▼
            </div>
          </div>
        </div>
      </div>

      {/* Summary Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-600 border-2 border-blue-700 rounded-2xl px-8 py-5 flex flex-wrap gap-8 items-center text-white shadow-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex flex-col border-r border-blue-400 pr-8">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-100 italic">Terpilih</span>
            <span className="text-2xl font-black">{selectedIds.length} Produk</span>
          </div>

          <div className="flex flex-col border-r border-blue-400 pr-8">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-100 italic">Total Stok</span>
            <span className="text-2xl font-black">{totalSelectedStock} Unit</span>
          </div>

          <div className="flex flex-col flex-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-100 italic">Total Valuasi Aset Terpilih (Rupiah)</span>
            <div className="flex flex-wrap gap-3 items-center mt-1">
              <span className="text-2xl font-black text-yellow-300">
                  Rp {grandTotalIDR.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <button 
            onClick={() => setSelectedIds([])} 
            className="px-5 py-2.5 bg-white text-blue-700 hover:bg-red-50 hover:text-red-700 rounded-xl text-xs font-black uppercase transition-all shadow-md active:scale-95 border-2 border-white"
          >
            Batal Pilih
          </button>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white uppercase font-black tracking-widest text-[12px]">
                <th className="px-5 py-6 border-r border-slate-700/50">
                  <input
                    type="checkbox"
                    checked={currentProducts.length > 0 && currentProducts.every(p => selectedIds.includes(p._id))}
                    onChange={handleSelectAll}
                    className="w-6 h-6 rounded-md border-gray-300 accent-blue-600 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-6 border-r border-slate-700/50">Info Produk</th>
                <th className="px-6 py-6 border-r border-slate-700/50">Kategori</th>
                <th className="px-6 py-6 border-r border-slate-700/50 text-center">Stok</th>
                {/* 👇 BERUBAH MENJADI TOTAL BIAYA 👇 */}
                <th className="px-6 py-6 border-r border-slate-700/50 text-right">Total Aset</th>
                <th className="px-6 py-6 border-r border-slate-700/50 text-center">Status</th>
                {user?.role?.toLowerCase() !== 'staff' && (
  <th className="px-6 py-6 text-center sticky right-0 z-20 bg-slate-800 border-l border-slate-700 shadow-[-10px_0_15px_rgba(0,0,0,0.3)]">Aksi</th>
)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
            {loading ? (
  <tr><td colSpan={user?.role?.toLowerCase() !== 'staff' ? "7" : "6"} className="px-6 py-12 text-center font-black text-slate-500 italic uppercase">Sedang Memuat Data...</td></tr>
) : currentProducts.length === 0 ? (
  <tr><td colSpan={user?.role?.toLowerCase() !== 'staff' ? "7" : "6"} className="px-6 py-12 text-center font-black text-slate-400 uppercase">Produk Tidak Ditemukan</td></tr>
) : (
                currentProducts.map((product, index) => (
                  <tr key={product._id} className={`group transition-all hover:bg-blue-50/50 align-middle ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                    <td className="px-5 py-8 border-r border-slate-100 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product._id)}
                        onChange={() => handleSelectOne(product._id)}
                        className="w-6 h-6 rounded-md border-gray-300 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-8 border-r border-slate-100 min-w-[220px]">
                      <div className="font-black text-slate-900 text-[19px] uppercase tracking-tight leading-tight mb-1">{product.name}</div>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU:</span>
                         <span className="text-[12px] font-black text-blue-600 italic">{product.sku}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-8 border-r border-slate-100">
                      {(() => {
                        if (product.category && product.category.includes(' - ')) {
                          const catParts = product.category.split(' - ');
                          const kategoriUtama = catParts[0]; 
                          const subPath = catParts.slice(1).join(' • '); 

                          return (
                            <div className="flex flex-col gap-1.5 items-start">
                              <span className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-lg shadow-sm uppercase tracking-wider">
                                {kategoriUtama}
                              </span>
                              <div className="flex items-start gap-1.5 mt-1">
                                <span className="text-slate-400 text-[12px] font-bold">↳</span>
                                <span className="text-[11px] font-bold text-slate-500 leading-snug text-left">
                                  {subPath}
                                </span>
                              </div>
                            </div>
                          );
                        } 
                        
                        return (
                          <div className="flex justify-start">
                              <span className="px-3 py-1.5 bg-slate-800 text-white text-[10px] font-black rounded-lg shadow-sm uppercase tracking-wider">
                                {product.category || 'TIDAK ADA KATEGORI'}
                              </span>
                          </div>
                        );
                      })()}
                    </td>

                    <td className="px-6 py-8 border-r border-slate-100 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className={`text-3xl font-black italic leading-none ${product.quantity <= 10 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {product.quantity}
                        </span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-1">Sisa Unit</span>
                      </div>
                    </td>
                    
                    {/* 👇 STRUKTUR BARU: TOTAL BIAYA DI ATAS, HARGA SATUAN DI BAWAH 👇 */}
                    <td className="px-6 py-8 border-r border-slate-100 text-right whitespace-nowrap">
                      <div className="text-[20px] font-black text-slate-900 tracking-tight">
                        {formatValue((product.price || 0) * (product.quantity || 0), product.currency)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                        {formatValue(product.price || 0, product.currency)} / Unit
                      </div>
                    </td>
                    
                    <td className="px-6 py-8 border-r border-slate-100 text-center uppercase">
                      <span className={`inline-block px-5 py-2 rounded-xl text-[12px] font-black tracking-widest border-2 shadow-sm
                        ${product.status === "pending" ? "bg-amber-100 text-amber-700 border-amber-400" : "bg-green-100 text-green-700 border-green-400"}
                      `}>
                        {product.status || 'APPROVED'}
                      </span>
                    </td>
                    {user?.role?.toLowerCase() !== 'staff' && (
  <td className={`px-6 py-8 sticky right-0 z-20 border-l border-slate-200 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} group-hover:bg-blue-100/40`}>
    <div className="flex justify-center gap-4">
      <button onClick={() => handleEdit(product)} className="p-4 bg-blue-100 text-blue-700 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-md active:scale-90">
        <Edit2 size={24} strokeWidth={3} />
      </button>
      <button onClick={() => handleDelete(product._id)} className="p-4 bg-red-100 text-red-700 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-md active:scale-90">
        <Trash2 size={24} strokeWidth={3} />
      </button>
    </div>
  </td>
)}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* FOOTER PAGINASI */}
        {!loading && filteredProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-5 border-t-2 border-slate-200 bg-slate-50">
            <div className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-4 sm:mb-0">
              Menampilkan <span className="text-slate-900 font-black">{indexOfFirstProduct + 1}</span> - <span className="text-slate-900 font-black">{Math.min(indexOfLastProduct, filteredProducts.length)}</span> dari <span className="text-slate-900 font-black">{filteredProducts.length}</span> Barang
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-white hover:border-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm bg-white"
              >
                <ChevronLeft size={20} strokeWidth={3} />
              </button>
              
              <div className="flex items-center gap-1.5 px-3">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className={`w-10 h-10 rounded-xl text-sm font-black transition-all shadow-sm flex items-center justify-center ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white border-2 border-blue-700 shadow-inner'
                        : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-white hover:border-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm bg-white"
              >
                <ChevronRight size={20} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
        productToEdit={editingProduct} 
        onSuccess={fetchProducts}
        products={products} 
      />
    </div>
  );
};

export default Products;