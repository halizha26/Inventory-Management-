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
    globalValueIDR: 0,
    usdRate: 15500,
    lowStock: 0,
    movements: [],
    stockSummary: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [productsData, history, summary, rateResponse] = await Promise.all([
        productService.getAll(),
        stockService.getHistory(),
        reportService.getSummary().catch(() => ({ stockMovement: [] })),
        fetch("http://localhost:3000/api/settings").then(res => res.json()).catch(() => null)
      ]);

      const historyList = Array.isArray(history) ? history : [];
      const allProducts = productsData.products || [];
      const currentUsdRate = rateResponse?.usdRate || 15500;

      let usdValue = 0;
      let idrValue = 0;
      let lowStockCount = 0;

      allProducts.forEach(p => {
        const qty = p.quantity || 0;
        const price = Number(p.price || 0);
        const totalItemValue = price * qty;

        if (p.currency === 'USD') {
          usdValue += totalItemValue;
        } else {
          idrValue += totalItemValue;
        }

        if (qty <= 10) {
          lowStockCount++;
        }
      });

      const globalValuation = idrValue + (usdValue * currentUsdRate);

      setStats({
        totalProducts: allProducts.length,
        totalValueUSD: usdValue,
        totalValueIDR: idrValue,
        globalValueIDR: globalValuation,
        usdRate: currentUsdRate,
        lowStock: lowStockCount,
        movements: historyList.slice(0, 5),
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back, {user?.name} 👋</h1>
        <p className="text-slate-500 font-medium">Here's what's happening with your inventory today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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
          value={`$ ${Number(stats.totalValueUSD).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
          icon={<DollarSign className="text-emerald-600" size={24} />}
          trend="International"
          isUp={true}
          color="green"
        />
        <StatCard 
          title="Global Asset (IDR)" 
          value={`Rp ${Math.round(stats.globalValueIDR).toLocaleString('id-ID')}`} 
          icon={<Wallet className="text-indigo-600" size={24} />}
          trend={`Kurs BI: Rp ${stats.usdRate.toLocaleString('id-ID')}`}
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
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-sm min-w-0">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-8">Stock In vs Out</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }} 
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'IN' ? '#3b82f6' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Movements Section */}
        <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-sm flex flex-col">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-6">Recent Movements</h3>
          <div className="flex-1 space-y-4">
            {stats.movements.length > 0 ? stats.movements.map((move, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className={`p-3 rounded-2xl flex-shrink-0 transition-transform group-hover:scale-110 ${move.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {move.type === 'IN' ? <TrendingUp size={20} strokeWidth={3} /> : <TrendingDown size={20} strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{move.product?.name || 'Deleted Product'}</p>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">{new Date(move.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className={`text-lg font-black ${move.type === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {move.type === 'IN' ? '+' : '-'}{move.quantity}
                </div>
              </div>
            )) : (
              <p className="text-sm font-bold text-center text-slate-400 py-10 uppercase tracking-widest">No recent activity</p>
            )}
          </div>
          
          <Link 
            to="/reports" 
            className="w-full mt-8 py-4 text-sm font-black text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-2xl transition-all border-2 border-blue-100 hover:border-blue-600 text-center uppercase tracking-widest"
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
  const bgColors = {
    blue: 'bg-blue-50',
    green: 'bg-emerald-50',
    indigo: 'bg-indigo-50',
    amber: 'bg-amber-50'
  };
  const bgColorClass = bgColors[color] || 'bg-slate-50';

  const cardContent = (
    <div className="flex flex-col h-full justify-between">
      <div className="flex items-start justify-between mb-6 gap-3">
        <div className={`p-3 md:p-4 rounded-2xl shrink-0 ${bgColorClass}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg whitespace-nowrap shrink-0 ${isUp ? 'text-emerald-700 bg-emerald-100/50' : 'text-red-700 bg-red-100/50'}`}>
          {isUp ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
          {trend}
        </div>
      </div>
      <div className="mt-auto">
        <p className="text-slate-500 text-[11px] md:text-xs font-black uppercase tracking-widest mb-1 truncate">{title}</p>
        {/* 👇 MENGHAPUS truncate, MENGGANTI DENGAN break-words & PENYESUAIAN UKURAN FONT 👇 */}
        <h4 className={`text-2xl xl:text-[22px] 2xl:text-3xl font-black tracking-tight break-words leading-tight ${color === 'amber' ? 'text-amber-600' : 'text-slate-900'}`}>
          {value}
        </h4>
      </div>
    </div>
  );

  const baseClasses = `block bg-white p-6 md:p-7 rounded-[28px] border-2 h-full ${warning ? 'border-amber-200 shadow-amber-50' : 'border-slate-100'} shadow-sm transition-all duration-300 ${to ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer hover:border-blue-300' : ''}`;

  return to ? (
    <Link to={to} className={baseClasses}>{cardContent}</Link>
  ) : (
    <div className={baseClasses}>{cardContent}</div>
  );
};

export default Dashboard;