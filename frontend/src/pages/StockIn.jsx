import React, { useState, useEffect } from 'react';
import StockModal from '../components/stock/StockModal';
import StockPages from './StockPages';
import { Plus, TrendingUp, RefreshCcw, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
// Typo tanda titik di akhir baris import sudah dihapus!
import exchangeRateService from '../services/exchangeRateService'; 

const StockIn = () => {
    const { user } = useAuth();
    const canInput = ['staff', 'admin'].includes(user?.role);
    const [isOpen, setIsOpen] = useState(false);
    
    const [exchangeRate, setExchangeRate] = useState(17944); 
    const [lastUpdate, setLastUpdate] = useState('Memuat data...');
    const [isLoadingRate, setIsLoadingRate] = useState(false);

    useEffect(() => {
        const fetchRate = async () => {
            setIsLoadingRate(true);
            try {
                const data = await exchangeRateService.getCurrentRate();
                setExchangeRate(data.rate);
                setLastUpdate(new Date(data.lastUpdated || data.updatedAt).toLocaleString('id-ID'));
            } catch (error) {
                console.error("Gagal mengambil kurs:", error);
                setLastUpdate('Gagal memuat');
            } finally {
                setIsLoadingRate(false);
            }
        };
        fetchRate();
    }, []);

    const handleSuccess = () => {
        setIsOpen(false);
        setTimeout(() => {
            window.location.reload();
        }, 500);
    };

    return (
        <div className="space-y-6 pb-12">
            
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pt-2">
                <div className="flex-1">
                    <h1 className="text-[26px] font-bold text-slate-800 flex items-center gap-3">
                        <TrendingUp className="text-emerald-500" size={32} strokeWidth={2.5} />
                        Permintaan Stok Masuk
                    </h1>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-2">
                        {user?.role === 'admin'
                            ? 'Akses Penuh: Input, Setujui, dan Konfirmasi Permintaan.'
                            : canInput
                            ? 'Akses Penuh: Input dan Kirim Permintaan Pemasukan Stok.'
                            : user?.role === 'finance'
                                ? 'Akses: Periksa dan Setujui Permintaan Stok Masuk.'
                                : 'Akses: Konfirmasi Permintaan Stok Yang Telah Disetujui.'}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                    
                    <div className="bg-white px-5 py-3 rounded-2xl border-2 border-indigo-50 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
                        
                        <div className="p-2.5 bg-indigo-100/50 rounded-xl">
                            <DollarSign className="text-indigo-600" size={24} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col pr-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kurs Acuan BI</span>
                                {isLoadingRate ? (
                                    <RefreshCcw size={10} className="text-slate-400 animate-spin" />
                                ) : (
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
                                )}
                            </div>
                            <div className="text-base font-black text-indigo-950 tracking-tight leading-none mt-1.5">
                                1 Dollar : Rp {exchangeRate.toLocaleString('id-ID')}
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 mt-1">
                                Update: {lastUpdate}
                            </span>
                        </div>
                    </div>

                    {canInput && (
                        <button 
                            onClick={() => setIsOpen(true)} 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center justify-center gap-2.5 px-6 py-4 sm:py-0 h-full min-h-[64px] rounded-2xl shadow-[0_8px_16px_-6px_rgba(16,185,129,0.4)] transition-all active:scale-95 text-sm uppercase tracking-wider border border-emerald-500 hover:border-emerald-400"
                        >
                            <Plus size={20} strokeWidth={3} />
                            Tambah Stok Baru
                        </button>
                    )}
                </div>
            </div>

             <div className="bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2.5">
                    <span className="w-1.5 h-5 bg-emerald-500 rounded-full"></span>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Alur Persetujuan:</span>
                </div>
                
                <div className="flex items-center flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 font-black uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">1</span>
                        Input <span className="text-[10px] text-slate-400 font-bold">(Staff)</span>
                    </div>
                    <span className="text-slate-200">➔</span>
                    <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                        Setuju <span className="text-[10px] text-blue-400/70 font-bold">(Finance)</span>
                    </div>
                    <span className="text-slate-200">➔</span>
                    <div className="flex items-center gap-2 text-emerald-600 font-black uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                        Konfirmasi <span className="text-[10px] text-emerald-400/70 font-bold">(Management)</span>
                    </div>
                </div>
            </div>

            <div className="w-full">
                <StockPages type="IN" />
            </div>

            <StockModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                type="IN"
                onSuccess={handleSuccess}
            />
        </div>
    );
};

export default StockIn;