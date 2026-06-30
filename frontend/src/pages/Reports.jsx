import React, { useEffect, useState } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { FileDown, FileText, Wallet, Package, AlertTriangle, XCircle, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';

import Button from '../components/common/Button';
import reportService from '../services/reportService';

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // State untuk konversi Multi-Mata Uang
  const [exchangeRate, setExchangeRate] = useState(15500);
  const [rateSource, setRateSource] = useState('Default_System');

  // State untuk detail kategori
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryDetailData, setCategoryDetailData] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Mengambil data summary dari API lama, dan mengambil Kurs dari API Settings TERBARU
        const [summaryData, rateResponse] = await Promise.all([
            reportService.getSummary(),
            fetch("http://localhost:3000/api/settings").then(res => res.json()).catch(() => null)
        ]);

        setSummary(summaryData);

        // Jika berhasil mengambil data dari database pengaturan global kita
        if (rateResponse && rateResponse.usdRate) {
            setExchangeRate(rateResponse.usdRate);
            setRateSource('Bank Indonesia (JISDOR)'); 
        }
      } catch (error) {
        console.error(error);
        toast.error('Gagal memuat data laporan');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDownload = async (type) => {
    try {
      toast.loading(`Menyiapkan ${type.toUpperCase()}...`, { id: 'download' });
      let blob = type === 'pdf' ? await reportService.downloadPDF() : await reportService.downloadExcel();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan_Inventaris.${type === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Download selesai', { id: 'download' });
    } catch (error) {
      toast.error('Download gagal', { id: 'download' });
    }
  };

  const handlePieClick = async (data) => {
    const categoryName = data.name;
    setSelectedCategory(categoryName);
    setDetailLoading(true);
    
    try {
      const response = await reportService.getCategoryDetail(categoryName);
      setCategoryDetailData(response);
      
      setTimeout(() => {
        document.getElementById('detail-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } catch (error) {
      console.error("Error ambil detail:", error);
      toast.error('Gagal mengambil detail kategori');
    } finally {
      setDetailLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md border-2 border-slate-100 p-4 rounded-2xl shadow-xl">
          <p className="text-slate-900 font-black text-sm uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">
            {label}
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end gap-6">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total Stok</span>
              <span className="text-blue-600 font-black text-xl leading-none">
                {payload[0].value} <span className="text-[10px] text-slate-400 uppercase">Unit</span>
              </span>
            </div>
            <div className="flex justify-between items-end gap-6 mt-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Periode</span>
              <span className="text-emerald-600 font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-md">
                <Calendar size={12} /> {payload[0].payload.bulan || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest">Memuat Analitik...</p>
      </div>
    );
  }

  const pieData = summary?.categoryStats?.map(item => ({
      name: item._id || 'Uncategorized',
      value: item.count
  })) || [];

  // LOGIKA KONVERSI MULTI-MATA UANG
  const totalIDR = Number(summary?.totalStoreValueIDR || 0);
  const totalUSD = Number(summary?.totalStoreValueUSD || 0);
  const globalValuationIDR = totalIDR + (totalUSD * exchangeRate);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Laporan & Analitik</h1>
          <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Ringkasan performa inventaris sistem Invento</p>
        </div>
        <div className="flex gap-3">
             <Button variant="secondary" onClick={() => handleDownload('pdf')} className="flex items-center gap-2 font-bold shadow-sm">
                <FileText size={18} /> Export PDF
            </Button>
            <Button variant="secondary" onClick={() => handleDownload('excel')} className="flex items-center gap-2 font-bold shadow-sm">
                <FileDown size={18} /> Export Excel
            </Button>
        </div>
      </div>

      {/* KARTU GRAND TOTAL (Estimasi Global) */}
      <div className="bg-gradient-to-br from-indigo-50 to-white border-2 border-dashed border-indigo-200 p-8 rounded-[32px] shadow-sm w-full relative overflow-hidden group">
          {/* Dekorasi Visual Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/50 rounded-full mix-blend-multiply filter blur-3xl group-hover:opacity-70 transition-opacity duration-700 pointer-events-none -mr-10 -mt-20"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                  <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={20} className="text-indigo-600" />
                      <h3 className="text-indigo-900 text-sm font-black uppercase tracking-widest">
                          Total Valuasi Global (Estimasi IDR)
                      </h3>
                  </div>
                  <div className="text-4xl md:text-5xl font-black text-indigo-700 tracking-tight">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(globalValuationIDR)}
                  </div>
                  
                  {/* Badge Transparansi Informasi Kurs */}
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100/80 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                          *Kurs Aktif: 1 USD = Rp {exchangeRate.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg uppercase tracking-wider bg-white/50">
                          Sumber: {rateSource}
                      </span>
                  </div>
              </div>
          </div>
      </div>

      {/* KPI CARDS (Buku Terpisah) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[24px] border-2 border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-emerald-100">
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Wallet size={20}/></div>
                <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest">Nilai Inventaris (IDR)</h3>
            </div>
            <p className="text-3xl font-black text-slate-900">Rp {totalIDR.toLocaleString('id-ID')}</p>
        </div>

        <div className="bg-white p-6 rounded-[24px] border-2 border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-blue-100">
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Wallet size={20}/></div>
                <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest">Nilai Inventaris (USD)</h3>
            </div>
            <p className="text-3xl font-black text-slate-900">$ {totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-white p-6 rounded-[24px] border-2 border-slate-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg"><Package size={20}/></div>
                <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest">Total Produk</h3>
            </div>
            <p className="text-3xl font-black text-slate-900">{summary?.totalProducts || 0}</p>
        </div>
      </div>

      {/* ALERT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[24px] border-2 border-amber-100 shadow-sm flex items-center justify-between">
            <div>
                <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest">Stok Menipis</h3>
                <p className="text-3xl font-black text-amber-600 mt-1">{summary?.lowStockCount || 0}</p>
            </div>
            <AlertTriangle size={48} className="text-amber-200" />
        </div>
        <div className="bg-white p-6 rounded-[24px] border-2 border-red-100 shadow-sm flex items-center justify-between">
            <div>
                <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest">Stok Habis</h3>
                <p className="text-3xl font-black text-red-600 mt-1">{summary?.outOfStock || 0}</p>
            </div>
            <XCircle size={48} className="text-red-200" />
        </div>
      </div>

      {/* PIE CHART SECTION */}
      <div className="bg-white p-8 md:p-12 rounded-[40px] border-2 border-slate-100 shadow-sm">
          <div className="text-center mb-10">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Analisis Inventaris Per Kategori</h3>
              <p className="text-blue-600 font-bold text-sm mt-1 animate-pulse italic">💡 Tips: Klik kategori untuk melihat detail produk</p>
          </div>

          <div className="flex flex-col items-center">
              <div className="h-[400px] w-full max-w-2xl">
                {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%" cy="50%"
                                innerRadius={100}
                                outerRadius={150}
                                paddingAngle={8}
                                dataKey="value"
                                onClick={handlePieClick}
                                className="cursor-pointer outline-none"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                        <FileText size={64} className="mb-4 opacity-20" />
                        <p className="font-black text-xl italic uppercase">Data tidak tersedia</p>
                    </div>
                )}
              </div>

              {/* LEGEND CARDS */}
              <div className="mt-12 w-full max-w-5xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pieData.map((item, index) => (
                          <div 
                            key={index} 
                            onClick={() => handlePieClick(item)}
                            className="flex items-center p-5 rounded-3xl border-2 border-slate-50 hover:border-blue-100 hover:bg-blue-50/30 transition-all group cursor-pointer"
                          >
                              <div className="w-5 h-5 rounded-full mr-4 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <div className="flex flex-col flex-1">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kategori</span>
                                  <span className="text-[15px] font-black text-slate-800 leading-tight">{item.name}</span>
                                  <div className="flex items-baseline gap-1 mt-2">
                                      <span className="text-blue-600 font-black text-xl">{item.value}</span>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase italic">Barang</span>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>

      {/* 📈 SECTION BAR CHART DETAIL (LIGHT MODE) */}
      {selectedCategory && (
        <div id="detail-section" className="bg-white p-8 md:p-12 rounded-[40px] border-2 border-slate-100 shadow-sm animate-in slide-in-from-bottom-5 duration-500 mt-10">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-8 bg-blue-500 rounded-full"></div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">
                          Detail Produk: <span className="text-blue-600">{selectedCategory}</span>
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Komposisi stok per item barang</p>
                    </div>
                </div>
                <button 
                  onClick={() => setSelectedCategory(null)} 
                  className="group flex items-center gap-2 text-slate-500 hover:text-slate-800 font-black text-[10px] uppercase tracking-widest border-2 border-slate-100 px-5 py-2.5 rounded-xl transition-all hover:bg-slate-50"
                >
                  <XCircle size={14} className="group-hover:text-red-500 transition-colors" />
                  Tutup
                </button>
            </div>

            {detailLoading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                    <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Menyusun Data...</p>
                </div>
            ) : (
                <div className="h-[320px] w-full">
                    {categoryDetailData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={categoryDetailData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                              <defs>
                                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.8}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.8} />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}}
                                interval={0}
                                angle={-30}
                                textAnchor="end"
                                height={60}
                              />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} />
                              
                              <Tooltip 
                                  cursor={{fill: '#f1f5f9', opacity: 0.6}}
                                  content={<CustomBarTooltip />}
                              />
                              
                              <Bar dataKey="stok" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={32} />
                          </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <Package size={40} className="mb-3 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-widest">Tidak ada data produk</p>
                      </div>
                    )}
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default Reports;