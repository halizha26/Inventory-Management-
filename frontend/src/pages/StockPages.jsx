import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpCircle, ArrowDownCircle, CheckCircle, Eye, XCircle, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { motion as MotionDiv } from 'framer-motion';
const Backdrop = MotionDiv.div;
const ModalBox = MotionDiv.div;
import stockService from '../services/stockService';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800 border-amber-300',
  approved: 'bg-blue-100 text-blue-800 border-blue-300',
  acknowledged: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
};

const ACTION_CONFIG = {
  'approve-in': { label: 'Approve Batch', color: 'blue', icon: CheckCircle, message: 'Approve all items in this Request? Stock will be added.' },
  'approve-out': { label: 'Approve Batch', color: 'blue', icon: CheckCircle, message: 'Approve all items in this Request? Stock will be deducted.' },
  'ack-in': { label: 'Acknowledge Batch', color: 'green', icon: Eye, message: 'Acknowledge all items in this Request?' },
  'ack-out': { label: 'Acknowledge Batch', color: 'green', icon: Eye, message: 'Acknowledge all items in this Request?' },
  'reject': { label: 'Reject Batch', color: 'red', icon: XCircle, message: 'Reject all items in this request? This action cannot be undone.' },
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
          <Backdrop initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40" onClick={onCancel} />
          <ModalBox initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm pointer-events-auto p-6 space-y-4">
              <div className={`w-12 h-12 rounded-full ${c.bg} flex items-center justify-center mx-auto`}><Icon size={24} className={c.icon} /></div>
              <div className="text-center">
                <h3 className="text-base font-bold text-gray-900">Confirm Action</h3>
                <p className="text-sm text-gray-500 mt-1">{config.message}</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={onCancel} className="flex-1 px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
                <button onClick={onConfirm} className={`flex-1 px-4 py-2 text-sm font-bold text-white rounded-xl transition-colors ${c.btn}`}>{config.label}</button>
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

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await stockService.getHistory(type !== 'HISTORY' ? type : undefined);
      setHistory(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load stock history');
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const requestAction = (action, items) => setConfirm({ action, items });

  const filteredHistory = history.filter((item) => {
    const itemDate = new Date(item.createdAt);
    if (dateFrom && itemDate < new Date(dateFrom)) return false;
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (itemDate > to) return false;
    }
    if (filterCategory && item.product?.category !== filterCategory) return false;
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
      existingGroup.totalQty += current.quantity;
    } else {
      acc.push({ ...current, items: [current], totalQty: current.quantity });
    }
    return acc;
  }, []);

  const handleConfirm = async () => {
    const { action, items } = confirm;
    setConfirm(null);
    try {
      const promises = items.map(item => {
        if (action === 'approve-in') return stockService.approveStockIn(item._id);
        else if (action === 'ack-in') return stockService.acknowledgeStockIn(item._id);
        else if (action === 'approve-out') return stockService.approveStockOut(item._id);
        else if (action === 'ack-out') return stockService.acknowledgeStockOut(item._id);
        else if (action === 'reject') return stockService.reject(item._id);
        return null;
      });
      await Promise.all(promises);
      toast.success(`${ACTION_CONFIG[action].label} successful`);
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const getActionButton = (group) => {
    const role = user?.role;
    const isAdmin = role === 'admin';
    const { status, type: itemType, items } = group;

    if (itemType === 'IN') {
      if (status === 'pending' && (role === 'finance' || isAdmin)) {
        return (
          <div className="flex flex-col gap-2 min-w-[120px]">
            <button onClick={() => requestAction('approve-in', items)} className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-black bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"><CheckCircle size={14} /> Approve All</button>
            <button onClick={() => requestAction('reject', items)} className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-black bg-red-50 text-red-600 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-colors"><XCircle size={14} /> Reject All</button>
          </div>
        );
      }
      if (status === 'approved' && (role === 'management' || isAdmin)) {
        return <button onClick={() => requestAction('ack-in', items)} className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-black bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors min-w-[120px] shadow-md"><Eye size={14} /> Acknowledge</button>;
      }
    }

    if (itemType === 'OUT') {
      if (status === 'pending' && (role === 'management' || isAdmin)) {
        return (
          <div className="flex flex-col gap-2 min-w-[120px]">
            <button onClick={() => requestAction('approve-out', items)} className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-black bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"><CheckCircle size={14} /> Approve All</button>
            <button onClick={() => requestAction('reject', items)} className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-black bg-red-50 text-red-600 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-colors"><XCircle size={14} /> Reject All</button>
          </div>
        );
      }
      if (status === 'approved' && (role === 'finance' || isAdmin)) {
        return <button onClick={() => requestAction('ack-out', items)} className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-black bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors min-w-[120px] shadow-sm"><Eye size={14} /> Acknowledge</button>;
      }
    }
    return <span className="text-sm text-gray-400 block text-center font-black">—</span>;
  };

  return (
    <>
      <ConfirmDialog open={!!confirm} config={confirm ? ACTION_CONFIG[confirm.action] : null} onConfirm={handleConfirm} onCancel={() => setConfirm(null)} />

      <div className="bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm flex flex-wrap gap-4 items-end mb-6">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-black text-gray-700">From</label>
          <input type="date" className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-black focus:ring-2 focus:ring-brand-500 focus:outline-none" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-black text-gray-700">To</label>
          <input type="date" className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-black focus:ring-2 focus:ring-brand-500 focus:outline-none" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-black text-gray-700">Category</label>
          <select className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-black focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white min-w-[160px]" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-black text-gray-700">Status</label>
          <select className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-black focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white min-w-[140px]" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        {(dateFrom || dateTo || filterCategory || filterStatus) && (
          <button onClick={() => { setDateFrom(''); setDateTo(''); setFilterCategory(''); setFilterStatus(''); }} className="flex items-center gap-1 px-4 py-2 text-xs font-black text-gray-800 hover:text-red-600 border-2 border-gray-300 rounded-lg hover:border-red-400 transition-colors bg-gray-50"><Filter size={14} /> Clear Filters</button>
        )}
      </div>

      <div className="bg-white rounded-xl border-2 border-gray-300 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* Header Kontras Tinggi untuk Orang Tua */}
              <tr className="bg-slate-800 border-b-2 border-slate-900 text-[11px] uppercase text-white font-black tracking-widest">
                <th className="px-6 py-5 border-r border-slate-700">Date</th>
                <th className="px-6 py-5 border-r border-slate-700">Product(s)</th>
                <th className="px-6 py-5 border-r border-slate-700">Category</th>
                {type === 'HISTORY' && <th className="px-6 py-5 border-r border-slate-700">Type</th>}
                <th className="px-6 py-5 border-r border-slate-700">Qty</th>
                {(type === 'IN' || type === 'HISTORY') && <th className="px-6 py-5 border-r border-slate-700 text-right">Amount</th>}
                <th className="px-6 py-5 border-r border-slate-700">Reason</th>
                <th className="px-6 py-5 border-r border-slate-700">Submitted By</th>
                {(type === 'OUT' || type === 'HISTORY') && <th className="px-6 py-5 border-r border-slate-700">Sales Order No.</th>}
                <th className="px-6 py-5 border-r border-slate-700 text-center">Status</th>
                <th className="px-6 py-5 text-center sticky right-0 z-10 bg-slate-800 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.2)]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {loading ? (
                <tr><td colSpan="12" className="px-6 py-12 text-center text-gray-900 font-black text-lg italic">Memuat Data...</td></tr>
              ) : groupedHistory.length === 0 ? (
                <tr><td colSpan="12" className="px-6 py-12 text-center text-gray-500 font-black">No records found.</td></tr>
              ) : (
                groupedHistory.map((group, index) => (
                  <tr key={group._id} className={`group transition-colors align-top ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                    <td className="px-6 py-6 text-sm font-black text-gray-800 whitespace-nowrap border-r border-gray-200">{new Date(group.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-6 py-6 border-r border-gray-200">
                      <div className="space-y-4">
                        {group.items.map((item, idx) => (
                          <div key={idx} className="font-black text-gray-950 truncate max-w-[200px] h-10 flex items-center text-base">{item.product?.name || 'Unknown'}</div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-6 border-r border-gray-200">
                      <div className="space-y-4">
                        {group.items.map((item, idx) => (
                          <div key={idx} className="flex items-center h-10"><span className="inline-flex items-center px-3 py-1 rounded text-[10px] font-black bg-blue-600 text-white border border-blue-700 whitespace-nowrap uppercase">{item.product?.category || '—'}</span></div>
                        ))}
                      </div>
                    </td>
                    {type === 'HISTORY' && (
                      <td className="px-6 py-6 border-r border-gray-200">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border-2 ${group.type === 'IN' ? 'bg-green-50 text-green-800 border-green-300' : 'bg-red-50 text-red-800 border-red-300'}`}>
                          {group.type === 'IN' ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />} {group.type}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-6 border-r border-gray-200">
                      <div className="space-y-4">
                        {group.items.map((item, idx) => (
                          <div key={idx} className="font-mono font-black text-gray-950 h-10 flex items-center text-lg">{item.quantity}</div>
                        ))}
                      </div>
                    </td>
                    {(type === 'IN' || type === 'HISTORY') && (
                      <td className="px-6 py-6 border-r border-gray-200 whitespace-nowrap">
                        <div className="space-y-4">
                          {group.items.map((item, idx) => (
                            <div key={idx} className="flex flex-col justify-center items-end h-10">
                              {item.totalPrice > 0 ? (
                                <>
                                  <span className="text-base font-black text-blue-900 leading-none mb-1">Rp {item.totalPrice?.toLocaleString('id-ID')}</span>
                                  <span className="text-[12px] text-gray-600 font-bold leading-none">@ Rp {item.unitPrice?.toLocaleString('id-ID')}</span>
                                </>
                              ) : <span className="text-sm text-gray-400 font-black">—</span>}
                            </div>
                          ))}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-6 border-r border-gray-200 text-sm font-bold text-gray-700 leading-snug">{group.reason || '—'}</td>
                    <td className="px-6 py-6 border-r border-gray-200 text-sm font-black text-gray-900 uppercase">{group.inputBy?.name || group.user?.name || '—'}</td>
                    {(type === 'OUT' || type === 'HISTORY') && (
                      <td className="px-6 py-6 border-r border-gray-200 text-sm font-black text-gray-800 font-mono">
                        {group.type === 'OUT' ? (group.salesOrderNumber || '—') : '—'}
                      </td>
                    )}
                    
                    {/* Status dengan Detail Approved By yang Jelas */}
                    <td className="px-6 py-6 border-r border-gray-200 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 min-w-[130px]">
                        <span className={`inline-flex px-3 py-1.5 rounded-lg text-[11px] font-black border-2 uppercase tracking-widest shadow-sm ${STATUS_STYLES[group.status] || 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                          {group.status}
                        </span>
                        {group.approvedBy?.name && (
                          <div className="flex flex-col items-center bg-slate-100 px-3 py-2 rounded-lg border-2 border-slate-200 w-full shadow-inner">
                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-tighter mb-1">Approved By:</span>
                            <span className="text-[14px] text-slate-950 font-black capitalize leading-tight">
                              {group.approvedBy.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Action Sticky dengan Border Pemisah yang Jelas */}
                    <td className={`px-6 py-6 sticky right-0 z-10 transition-colors border-l-2 border-gray-300 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.1)] ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} group-hover:bg-amber-50`}>
                      {getActionButton(group)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default StockPages;