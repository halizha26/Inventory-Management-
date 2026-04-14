import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

import productService from "../services/productService";
import ProductModal from "../components/products/ProductModal";
import ProductFilter from "../components/products/ProductFilter";
import Button from "../components/common/Button";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [user, setUser] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data.products);
      setUser(data.user);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleEdit = (product) => { setEditingProduct(product); setModalOpen(true); };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await productService.delete(id);
        toast.success("Product deleted");
        fetchProducts();
      } catch {
        toast.error("Failed to delete product");
      }
    }
  };

  const handleModalClose = () => { setModalOpen(false); setEditingProduct(null); };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    setSelectedIds(selectedIds.length === filteredProducts.length ? [] : filteredProducts.map(p => p._id));
  };

  const selectedProducts = products.filter(p => selectedIds.includes(p._id));
  const totalSelectedStock = selectedProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);

  // --- PERBAIKAN: Math.round() ditambahkan di sini agar IDR bulat ---
  const totalSelectedPriceIDR = selectedProducts
    .filter(p => (p.currency || (['Logistik Material', 'Office Asset'].includes(p.category) ? 'IDR' : 'USD')) === 'IDR')
    .reduce((sum, p) => sum + Math.round(Number(p.price || 0)), 0);

  // --- PERBAIKAN: Memastikan hitungan USD tetap dalam format angka sebelum diformat ---
  const totalSelectedPriceUSD = selectedProducts
    .filter(p => (p.currency || (['Logistik Material', 'Office Asset'].includes(p.category) ? 'IDR' : 'USD')) === 'USD')
    .reduce((sum, p) => sum + Number(p.price || 0), 0);

  const filteredProducts = products.filter(
    (p) =>
      (p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())) &&
      (categoryFilter === "" || p.category === categoryFilter)
  );

  const formatPrice = (product) => {
    const currency = product.currency || (['Logistik Material', 'Office Asset'].includes(product.category) ? 'IDR' : 'USD');
    
    if (currency === 'IDR') {
      const roundedPrice = Math.round(Number(product.price));
      return `Rp ${roundedPrice.toLocaleString('id-ID')}`;
    }
    
    return `$ ${Number(product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">Manage your inventory items</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2"
          disabled={user?.role !== "admin"}
        >
          <Plus size={20} /> Add Product
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <ProductFilter
          search={search}
          onSearchChange={setSearch}
          category={categoryFilter}
          onCategoryChange={setCategoryFilter}
        />
      </div>

      {/* Summary bar */}
      {selectedIds.length > 0 && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl px-6 py-3 flex flex-wrap gap-4 items-center text-sm transition-all duration-300">
          <span className="font-semibold text-brand-700">{selectedIds.length} product(s) selected</span>
          <span className="text-gray-700 border-l border-brand-200 pl-4">
            Total Stock: <span className="font-bold">{totalSelectedStock} units</span>
          </span>
          <span className="text-gray-700 border-l border-brand-200 pl-4 flex gap-3">
            Total Price: 
            {totalSelectedPriceIDR > 0 && (
              <span className="font-bold text-emerald-600">Rp {totalSelectedPriceIDR.toLocaleString('id-ID')}</span>
            )}
            {totalSelectedPriceUSD > 0 && (
              // --- PERBAIKAN: maximumFractionDigits ditambahkan untuk USD ---
              <span className="font-bold text-blue-600">$ {totalSelectedPriceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            )}
            {totalSelectedPriceIDR === 0 && totalSelectedPriceUSD === 0 && (
              <span className="font-bold text-gray-500">0</span>
            )}
          </span>
          <button onClick={() => setSelectedIds([])} className="ml-auto text-xs font-medium text-gray-500 hover:text-red-600 transition-colors">
            Clear selection
          </button>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Ref/SKU</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-600" />
                      Loading products...
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">No products found.</td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product._id)}
                        onChange={() => handleSelectOne(product._id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[150px]">{product.description}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{product.sku}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 italic">
                      {product.supplier || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-medium ${product.quantity <= 10 ? "text-red-600" : "text-green-600"}`}>
                        {product.quantity}
                      </div>
                      <div className="text-xs text-gray-400">units</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatPrice(product)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium
                        ${product.status === "pending" ? "bg-amber-100 text-amber-700" : ""}
                        ${product.status === "approved" ? "bg-green-100 text-green-700" : ""}
                      `}>
                        {product.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(product._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        productToEdit={editingProduct}
        onSuccess={fetchProducts}
      />
    </div>
  );
};

export default Products;