import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileText,
  LogOut,
  X,
  PieChart,
  Users2,
  BoxesIcon
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// --- TAMBAHAN IMPORT SERVICE ---
import productService from '../../services/productService'; 

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  
  // --- STATE UNTUK MENYIMPAN JUMLAH LOW STOCK ---
  const [lowStockCount, setLowStockCount] = useState(0);

  // --- EFEK UNTUK MENGAMBIL DATA PRODUK & MENGHITUNG LOW STOCK ---
  useEffect(() => {
    let isMounted = true; // Mencegah memory leak jika komponen dilepas
    
    const fetchProducts = async () => {
      try {
        const data = await productService.getAll();
        const products = data.products || [];
        // Hitung produk yang quantity-nya <= 10 (standar Low Stock)
        const count = products.filter(p => p.quantity <= 10).length;
        if (isMounted) setLowStockCount(count);
      } catch (error) {
        console.error("Failed to fetch products for sidebar:", error);
      }
    };

    // Ambil data saat pertama kali dimuat
    fetchProducts();
    
    // (Opsional) Polling setiap 30 detik agar datanya selalu update
    const interval = setInterval(fetchProducts, 30000); 

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'staff', 'finance', 'management'] },
    { name: 'Products', path: '/products', icon: Package, roles: ['admin', 'staff', 'finance', 'management'] },
    { name: 'Request Stock In', path: '/stock-in', icon: TrendingUp, roles: ['admin', 'staff', 'finance', 'management'] },
    { name: 'Request Stock Out', path: '/stock-out', icon: TrendingDown, roles: ['admin', 'staff', 'finance', 'management'] },
    { name: 'Low Stock', path: '/low-stock', icon: AlertTriangle, roles: ['admin', 'staff', 'finance', 'management'] },
    { name: 'Reports', path: '/reports', icon: FileText, roles: ['admin', 'finance', 'management'] },
    { name: 'User Management', path: '/users', icon: Users2, roles: ['admin'] },
  ];

  // Filter links based on user role
  const filteredLinks = links.filter(link => link.roles.includes(user?.role));

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-600 rounded-lg">
            <PieChart className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Inventory</span>
        </div>
        <button onClick={onClose} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
        {filteredLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            onClick={() => window.innerWidth < 1024 && onClose()}
            className={({ isActive }) => clsx(
              "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 font-medium",
              isActive
                ? "bg-brand-50 text-brand-700 shadow-sm"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <div className="flex items-center gap-3">
               <link.icon size={20} className={clsx({ "text-brand-600": true })} />
               <span>{link.name}</span>
            </div>

            {/* --- TAMBAHAN BADGE KUNING KHUSUS UNTUK MENU LOW STOCK --- */}
            {link.name === 'Low Stock' && lowStockCount > 0 && (
               <span className="inline-flex items-center justify-center px-2 py-0.5 ml-2 text-xs font-bold leading-none text-yellow-800 bg-yellow-200 rounded-full animate-pulse">
                 {lowStockCount}
               </span>
            )}

          </NavLink>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 fixed inset-y-0 left-0 z-50">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;