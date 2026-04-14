import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Package, AlertTriangle, 
  DollarSign, Activity, ArrowUpRight, ArrowDownRight,
  Wallet 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell
} from 'recharts';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

import productService from '../services/productService';
import stockService from '../services/stockService';
import reportService from '../services/reportService';
import { useAuth } from '../context/AuthContext';
import StockActionModal from '../components/stock/StockActionModal';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValueUSD: 0,
    totalValueIDR: 0,
    lowStock: 0,
    movements: [],
    stockSummary: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [productsData, history, summary] = await Promise.all([
        productService.getAll(),
        stockService.getHistory(),
        reportService.getSummary().catch(() => ({ stockMovement: [] }))
      ]);

      const historyList = Array.isArray(history) ? history : [];
      const allProducts = productsData.products || [];

      let usdValue = 0;
      let idrValue = 0;
      let lowStockCount = 0;

      allProducts.forEach(p => {
        const totalItemValue = p.price * p.quantity;
        if (p.category === 'Office Asset' || p.price > 1000) {
          idrValue += totalItemValue;
        } else {
          usdValue += totalItemValue;
        }
        if (p.quantity <= 10) {
          lowStockCount++;
        }
      });

      setStats({
        totalProducts: allProducts.length,
        totalValueUSD: usdValue,
        totalValueIDR: idrValue,
        lowStock: lowStockCount,
        movements: historyList.slice(0, 5), // Kembali ke 5 data saja biar simpel
        stockSummary: summary?.stockMovement || []
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const chartData = stats.stockSummary?.length > 0 
    ? stats.stockSummary.map(item => ({ name: item._id, value: item.totalQuantity }))
    : [{ name: 'IN', value: 0 }, { name: 'OUT', value: 0 }];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name} 👋</h1>
        <p className="text-gray-500">Here's what's happening with your inventory today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Products" 
          value={stats.totalProducts} 
          icon={<Package className="text-blue-600" size={24} />}
          trend="In Catalog"
          isUp={true}
          color="blue"
          to="/products"
        />
        <StatCard 
          title="Value (USD)" 
          value={`$${Number(stats.totalValueUSD).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
          icon={<DollarSign className="text-green-600" size={24} />}
          trend="International"
          isUp={true}
          color="green"
        />
        <StatCard 
          title="Value (IDR)" 
          value={`Rp${Number(stats.totalValueIDR).toLocaleString('id-ID')}`} 
          icon={<Wallet className="text-indigo-600" size={24} />}
          trend="Local Assets"
          isUp={true}
          color="indigo"
        />
        <StatCard 
          title="Low Stock" 
          value={stats.lowStock} 
          icon={<AlertTriangle className="text-amber-600" size={24} />}
          trend="Needs Attention"
          isUp={false}
          color="amber"
          warning={stats.lowStock > 0}
          to="/low-stock"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Stock In vs Out</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'IN' ? '#3b82f6' : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Movements Section */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-900 mb-6">Recent Movements</h3>
          <div className="flex-1 space-y-4">
            {stats.movements.length > 0 ? stats.movements.map((move, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`p-2 rounded-xl flex-shrink-0 ${move.type === 'IN' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {move.type === 'IN' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{move.product?.name || 'Deleted Product'}</p>
                  <p className="text-xs text-gray-400">{new Date(move.createdAt).toLocaleDateString('id-ID')}</p>
                </div>
                <div className={`text-sm font-bold ${move.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                  {move.type === 'IN' ? '+' : '-'}{move.quantity}
                </div>
              </div>
            )) : (
              <p className="text-sm text-center text-gray-400 py-10">No recent activity</p>
            )}
          </div>
          
          {/* Tombol View All Activity */}
          <Link 
            to="/reports" 
            className="w-full mt-6 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-xl transition-colors border border-brand-100 text-center"
          >
            View All Activity
          </Link>
        </div>
      </div>
      
      {selectedItem && (
        <StockActionModal
          item={selectedItem}
          userRole={user?.role}
          onClose={() => setSelectedItem(null)}
          onSuccess={() => { setSelectedItem(null); fetchDashboardData(); }}
        />
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, isUp, color, warning, to }) => {
  const cardContent = (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl bg-${color}-50`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${isUp ? 'text-green-600' : 'text-red-500'}`}>
          {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      </div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h4 className="text-2xl font-bold text-gray-900 mt-1">{value}</h4>
    </>
  );

  const baseClasses = `block bg-white p-6 rounded-2xl border ${warning ? 'border-amber-200 shadow-amber-50' : 'border-gray-100'} shadow-sm transition-all duration-200 ${to ? 'hover:shadow-md hover:-translate-y-1 cursor-pointer hover:border-brand-300' : ''}`;

  return to ? (
    <Link to={to} className={baseClasses}>{cardContent}</Link>
  ) : (
    <div className={baseClasses}>{cardContent}</div>
  );
};

export default Dashboard;