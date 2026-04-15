import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { FileDown, FileText, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

import Button from '../components/common/Button';
import reportService from '../services/reportService';

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const data = await reportService.getSummary();
        setSummary(data);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleDownload = async (type) => {
    try {
      toast.loading(`Generating ${type.toUpperCase()}...`, { id: 'download' });
      let blob;
      if (type === 'pdf') {
        blob = await reportService.downloadPDF();
      } else {
        blob = await reportService.downloadExcel();
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory_report.${type === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Download complete', { id: 'download' });
    } catch (error) {
        console.error(error);
      toast.error('Download failed', { id: 'download' });
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) {
    return (
        <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
    );
  }

  const pieData = summary?.categoryStats?.map(item => ({
      name: item._id || 'Uncategorized',
      value: item.count
  })) || [];

  const moveData = summary?.stockMovement?.map(item => ({
      name: item._id, // IN or OUT
      quantity: item.totalQuantity
  })) || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">Real-time overview of your private inventory performance</p>
        </div>
        <div className="flex gap-3">
             <Button variant="secondary" onClick={() => handleDownload('pdf')} className="flex items-center gap-2">
                <FileText size={18} />
                Export PDF
            </Button>
            <Button variant="secondary" onClick={() => handleDownload('excel')} className="flex items-center gap-2">
                <FileDown size={18} />
                Export Excel
            </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-gray-500 text-sm font-medium">Total Inventory Value</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
                ${Number(summary?.totalStoreValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                <span className="bg-green-100 px-1 rounded text-xs font-bold">LIVE</span> Updated just now
            </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-gray-500 text-sm font-medium">Total Products</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{summary?.totalProducts || 0}</p>
             <p className="text-gray-400 text-sm mt-1">Items in your catalog</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-gray-500 text-sm font-medium">Low Stock Items</h3>
            <p className="text-3xl font-bold text-amber-600 mt-2">{summary?.lowStockCount || 0}</p>
            <p className="text-amber-500 text-sm mt-1">Approaching minimum level</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-gray-500 text-sm font-medium">OutOf Stock Items</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{summary?.outOfStock || 0}</p>
            <p className="text-red-500 text-sm mt-1">Requires immediate attention</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Volume Chart */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-w-0">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Stock Volume Distribution</h3>
              <div className="h-80 w-full">
                {moveData.length > 0 ? (
                    /* REVISI: Menambahkan minWidth dan minHeight agar Recharts tidak crash saat rendering */
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={moveData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="quantity" radius={[8, 8, 0, 0]}>
                                {moveData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.name === 'IN' ? '#10b981' : '#ef4444'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <Calendar size={48} className="mb-2 opacity-20" />
                        <p>No stock activity recorded yet</p>
                    </div>
                )}
              </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-w-0">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Inventory by Category</h3>
              <div className="h-80 w-full">
                {pieData.length > 0 ? (
                    /* REVISI: Menambahkan minWidth dan minHeight agar Recharts tidak crash saat rendering */
                    <ResponsiveContainer width="99%" height="100%" minWidth={10} minHeight={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <FileText size={48} className="mb-2 opacity-20" />
                        <p>No category data available</p>
                    </div>
                )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Reports;