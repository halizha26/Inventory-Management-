import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpCircle, ArrowDownCircle, CheckCircle, Eye, XCircle, Filter, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AnimatePresence, motion as MotionDiv } from 'framer-motion';
import stockService from '../services/stockService';
import { useAuth } from '../context/AuthContext';

const Backdrop = MotionDiv.div;
const ModalBox = MotionDiv.div;

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-900 border-amber-400',
  approved: 'bg-blue-100 text-blue-900 border-blue-400',
  acknowledged: 'bg-green-100 text-green-900 border-green-400',
  rejected: 'bg-red-100 text-red-900 border-red-400',
};

const ACTION_CONFIG = {
  'approve-in': { label: 'SETUJUI SEMUA', color: 'blue', icon: CheckCircle, message: 'Apakah Anda yakin ingin menyetujui semua barang masuk ini?' },
  'approve-out': { label: 'SETUJUI SEMUA', color: 'blue', icon: CheckCircle, message: 'Apakah Anda yakin ingin menyetujui semua barang keluar ini?' },
  'ack-in': { label: 'KONFIRMASI', color: 'green', icon: Eye, message: 'Konfirmasi bahwa barang sudah diterima dengan benar?' },
  'ack-out': { label: 'KONFIRMASI', color: 'green', icon: Eye, message: 'Konfirmasi bahwa barang sudah dikeluarkan?' },
  'reject': { label: 'TOLAK SEMUA', color: 'red', icon: XCircle, message: 'Tolak permintaan ini? Tindakan ini tidak dapat dibatalkan.' },
};

const ConfirmDialog = ({ open, config, onConfirm, onCancel }) => {
  if (!config) return null;
  const Icon = config.icon;
  const colorMap = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', btn: 'bg-green-600 hover:bg-green-700' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', btn: 'bg-red-600 hover:bg-red-700' },
  };
  const c = colorMap[config.color];

  return (
    <AnimatePresence>
      {open && (
        <>
          <Backdrop initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]" onClick={onCancel} />
          <ModalBox initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto p-8 space-y-6">
              <div className={`w-20 h-20 rounded-full ${c.bg} flex items-center justify-center mx-auto`}>
                <Icon size={40} className={c.icon} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-slate-900">Konfirmasi Aksi</h3>
                <p className="text-lg text-slate-600 leading-relaxed">{config.message}</p>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={onCancel} className="flex-1 px-4 py-4 text-base font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">BATAL</button>
                <button onClick={onConfirm} className={`flex-1 px-4 py-4 text-base font-bold text-white rounded-xl transition-all shadow-md ${c.btn}`}>{config.label}</button>
              </div>
            </div>
          </ModalBox>
        </>
      )}
    </AnimatePresence>
  );
};

const CATEGORIES = ['Logistik Material', 'Learning Material', 'Office Asset'];
const STATUSES = ['pending', 'approved', 'acknowledged', 'rejected'];

const StockPages = ({ type }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // --- STATE PAGINASI ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await stockService.getHistory(type !== 'HISTORY' ? type : undefined);
      setHistory(data);
    } catch (err) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Kembali ke halaman 1 jika filter diubah
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, filterCategory, filterStatus]);

  const requestAction = (action, items) => setConfirm({ action, items });

  const handleConfirm = async () => {
    if (!confirm) return;
    const { action, items } = confirm;
    setConfirm(null);
    const loadingToast = toast.loading('Sedang memproses...');
    try {
      const promises = items.map(item => {
        if (action === 'approve-in') return stockService.approveStockIn(item._id);
        if (action === 'ack-in') return stockService.acknowledgeStockIn(item._id);
        if (action === 'approve-out') return stockService.approveStockOut(item._id);
        if (action === 'ack-out') return stockService.acknowledgeStockOut(item._id);
        if (action === 'reject') return stockService.reject(item._id);
        return null;
      });
      await Promise.all(promises);
      toast.success('Berhasil!', { id: loadingToast });
      fetchHistory();
    } catch (err) {
      toast.error('Terjadi kesalahan', { id: loadingToast });
    }
  };

  const filteredHistory = history.filter((item) => {
    const itemDate = new Date(item.createdAt);
    if (dateFrom && itemDate < new Date(dateFrom)) return false;
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (itemDate > to) return false;
    }
    if (filterCategory && !item.product?.category?.includes(filterCategory)) return false;
    if (filterStatus && item.status !== filterStatus) return false;
    return true;
  });

  const groupedHistory = filteredHistory.reduce((acc, current) => {
    const existingGroup = acc.find(group => 
      group.type === current.type &&
      group.reason === current.reason &&
      group.status === current.status &&
      Math.abs(new Date(group.createdAt) - new Date(current.createdAt)) < 5000
    );
    if (existingGroup) {
      existingGroup.items.push(current);
    } else {
      acc.push({ ...current, items: [current] });
    }
    return acc;
  }, []);

  // --- LOGIKA PAGINASI (Pemotongan Data) ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentGroups = groupedHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(groupedHistory.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getActionButton = (group) => {
    const role = user?.role;
    const isAdmin = role === 'admin';
    const { status, type: itemType, items } = group;

    if (itemType === 'IN') {
      if (status === 'pending' && (role === 'finance' || isAdmin)) {
        return (
          <div className="flex flex-col gap-1.5 min-w-[120px]">
            <button onClick={() => requestAction('approve-in', items)} className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-all"><CheckCircle size={16} /> SETUJUI</button>
            <button onClick={() => requestAction('reject', items)} className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-white text-red-600 border-2 border-red-200 rounded-lg hover:bg-red-50 transition-all"><XCircle size={16} /> TOLAK</button>
          </div>
        );
      }
      if (status === 'approved' && (role === 'management' || isAdmin)) {
        return <button onClick={() => requestAction('ack-in', items)} className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm min-w-[130px] transition-all"><Eye size={16} /> KONFIRMASI</button>;
      }
    }

    if (itemType === 'OUT') {
      if (status === 'pending' && (role === 'management' || isAdmin)) {
        return (
          <div className="flex flex-col gap-1.5 min-w-[120px]">
            <button onClick={() => requestAction('approve-out', items)} className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-all"><CheckCircle size={16} /> SETUJUI</button>
            <button onClick={() => requestAction('reject', items)} className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-white text-red-600 border-2 border-red-200 rounded-lg hover:bg-red-50 transition-all"><XCircle size={16} /> TOLAK</button>
          </div>
        );
      }
      if (status === 'approved' && (role === 'finance' || isAdmin)) {
        return <button onClick={() => requestAction('ack-out', items)} className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm min-w-[130px] transition-all"><Eye size={16} /> KONFIRMASI</button>;
      }
    }
    return <span className="text-xs font-medium text-slate-400">—</span>;
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      <ConfirmDialog open={!!confirm} config={confirm ? ACTION_CONFIG[confirm.action] : null} onConfirm={handleConfirm} onCancel={() => setConfirm(null)} />

      {/* --- FILTER BOX --- */}
      <div className="flex-shrink-0 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Dari Tanggal</label>
          <input type="date" className="px-2.5 py-1.5 border-2 border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Sampai Tanggal</label>
          <input type="date" className="px-2.5 py-1.5 border-2 border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Kategori</label>
          <select className="px-2.5 py-1.5 border-2 border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-100 focus:outline-none min-w-[140px] transition-all" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Semua Kategori</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Status</label>
          <select className="px-2.5 py-1.5 border-2 border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-100 focus:outline-none min-w-[120px] transition-all" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Semua Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
          </select>
        </div>
        {(dateFrom || dateTo || filterCategory || filterStatus) && (
          <button onClick={() => { setDateFrom(''); setDateTo(''); setFilterCategory(''); setFilterStatus(''); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all mb-0.5">
            <Filter size={14} /> RESET
          </button>
        )}
      </div>

      {/* --- TABLE AREA --- */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-20 bg-slate-800 text-white uppercase font-black tracking-widest text-[12px] shadow-sm">
              <tr className="text-slate-100 uppercase text-[10px] tracking-wider">
                <th className="px-4 py-3.5 font-bold border-b border-slate-700">Tanggal & Penginput</th>
                <th className="px-4 py-3.5 font-bold border-b border-slate-700">Produk & Keterangan</th>
                <th className="px-4 py-3.5 font-bold border-b border-slate-700 text-center">Kategori</th>
                <th className="px-4 py-3.5 font-bold border-b border-slate-700 text-center">Jumlah</th>
                {(type === 'IN' || type === 'HISTORY') && <th className="px-4 py-3.5 font-bold border-b border-slate-700 text-right">Total Biaya</th>}
                <th className="px-4 py-3.5 font-bold border-b border-slate-700 text-center">Status</th>
                <th className="px-4 py-3.5 font-bold border-b border-slate-700 text-center sticky right-0 bg-slate-800 z-[25] shadow-[-5px_0_10px_rgba(0,0,0,0.1)]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {currentGroups.map((group, index) => {
                const isEven = index % 2 === 0;
                const rowBg = isEven ? 'bg-white' : 'bg-slate-50';
                const hoverBg = 'hover:bg-amber-50';

                return (
                  <tr key={group._id} className={`${rowBg} ${hoverBg} transition-colors align-top group`}>
                    
                    {/* TANGGAL & PENGINPUT */}
                    <td className="px-4 py-3 border-r border-slate-100 whitespace-nowrap align-top">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-slate-900 leading-none">
                          {new Date(group.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Oleh:</span>
                          <span className="text-xs font-bold text-blue-800">
                            {group.inputBy?.name || group.user?.name || 'Sistem'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* PRODUK + ALASAN (SKU DITAMBAHKAN DI SINI) */}
                    <td className="px-0 py-0 border-r border-slate-100 min-w-[280px] align-top">
                      <div className="flex flex-col h-full">
                        {group.items.map((item, idx) => (
                          <div key={idx} className={`px-4 py-3 flex flex-col justify-center min-h-[50px] ${idx !== group.items.length - 1 ? 'border-b border-slate-100' : ''}`}>
                            <span className="text-sm font-bold text-slate-800">
                              • {item.product?.name || 'Produk Tidak Ditemukan'}
                            </span>
                            {/* Tambahan SKU di bawah nama produk */}
                            <div className="flex items-center gap-1 mt-1 ml-3">
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200 uppercase tracking-widest">
                                    SKU: {item.product?.sku || 'N/A'}
                                </span>
                            </div>
                          </div>
                        ))}
                        {group.reason && (
                          <div className="mx-3 mb-3 mt-1.5 p-2.5 bg-white/60 border border-slate-200 rounded-lg shadow-sm">
                            <div className="flex items-center gap-1.5 mb-1">
                              <FileText size={14} className="text-slate-500" />
                              <span className="text-[10px] font-bold text-slate-700 uppercase">Catatan:</span>
                            </div>
                            <p className="text-xs text-slate-700 italic font-medium leading-relaxed">"{group.reason}"</p>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* KATEGORI */}
                    <td className="px-0 py-0 border-r border-slate-100 align-top">
                      {group.items.map((item, idx) => {
                        const rawCategory = item.product?.category || 'Tidak Ada Kategori';
                        let mainBadge = rawCategory;
                        let subPath = null;
                        if (rawCategory.includes(' - ')) {
                          const catParts = rawCategory.split(' - ');
                          mainBadge = catParts[0];
                          subPath = catParts.slice(1).join(' • ');
                        }
                        return (
                          <div key={idx} className={`px-3 py-3 flex flex-col justify-center items-center min-h-[50px] ${idx !== group.items.length - 1 ? 'border-b border-slate-100' : ''}`}>
                            <span className={`px-2 py-1 text-[9px] font-black rounded text-center shadow-sm uppercase tracking-wider ${mainBadge === 'Learning Material' ? 'bg-[#00BFD3] text-slate-900' : 'bg-slate-800 text-white'}`}>
                              {mainBadge}
                            </span>
                            {subPath && (
                              <div className="flex items-start gap-1 mt-1 max-w-[150px]">
                                <span className="text-slate-400 text-[10px] font-bold">↳</span>
                                <span className="text-[9px] font-bold text-slate-500 leading-tight text-center">
                                  {subPath}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </td>

                    {/* JUMLAH */}
                    <td className="px-0 py-0 border-r border-slate-100 align-top">
                      {group.items.map((item, idx) => (
                        <div key={idx} className={`px-4 flex items-center justify-center min-h-[50px] ${idx !== group.items.length - 1 ? 'border-b border-slate-100' : ''}`}>
                          <span className="text-lg font-black text-slate-900">{item.quantity}</span>
                        </div>
                      ))}
                    </td>

                    {/* TOTAL BIAYA */}
                    {(type === 'IN' || type === 'HISTORY') && (
                      <td className="px-0 py-0 border-r border-slate-100 align-top">
                        {group.items.map((item, idx) => {
                          const isUSD = item.currency === "USD";
                          return (
                            <div key={idx} className={`px-4 flex flex-col items-end justify-center min-h-[50px] ${idx !== group.items.length - 1 ? 'border-b border-slate-100' : ''}`}>
                              <span className="text-sm font-black text-slate-900 whitespace-nowrap">
                                {isUSD ? '$ ' : 'Rp '} 
                                {item.totalPrice?.toLocaleString('id-ID')}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap italic mt-0.5">
                                @{isUSD ? '$ ' : 'Rp '}
                                {item.unitPrice?.toLocaleString('id-ID')}
                              </span>
                            </div>
                          );
                        })}
                      </td>
                    )}

                    {/* STATUS */}
                    <td className="px-3 py-3 border-r border-slate-100 text-center align-top">
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border tracking-widest shadow-sm ${STATUS_STYLES[group.status]}`}>
                          {group.status}
                        </span>
                        <div className="flex flex-col items-center mt-0.5">
                          {group.status === 'pending' ? (
                            <span className="text-[10px] font-bold text-slate-400 italic">Menunggu...</span>
                          ) : group.approvedBy?.name ? (
                            <>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                                {group.status === 'rejected' ? 'Ditolak:' : 'Oleh:'}
                              </span>
                              <span className="text-xs font-black text-slate-700 leading-tight text-center max-w-[100px] truncate">
                                {group.approvedBy.name}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    {/* AKSI */}
                    <td className={`px-3 py-3 sticky right-0 z-10 border-l border-slate-200 align-top transition-colors ${rowBg} group-hover:bg-amber-50`}>
                      <div className="flex justify-center">
                        {getActionButton(group)}
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {currentGroups.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500 text-lg font-bold">
                    Tidak ada data yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER PAGINASI --- */}
        {!loading && groupedHistory.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-4 border-t-2 border-slate-200 bg-slate-50">
            <div className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-4 sm:mb-0">
              Menampilkan <span className="text-slate-900 font-black">{indexOfFirstItem + 1}</span> - <span className="text-slate-900 font-black">{Math.min(indexOfLastItem, groupedHistory.length)}</span> dari <span className="text-slate-900 font-black">{groupedHistory.length}</span> Data
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
    </div>
  );
};

export default StockPages;