import React, { useState } from 'react';
import StockModal from '../components/stock/StockModal';
import StockPages from './StockPages';
import { Plus, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StockIn = () => {
    const { user } = useAuth();
    const canInput = ['staff', 'admin'].includes(user?.role);
    const [isOpen, setIsOpen] = useState(false);

    const handleSuccess = () => {
        setIsOpen(false);
        setTimeout(() => {
            window.location.reload();
        }, 500);
    };

    return (
        // 👇 PERBAIKAN 1: Hapus h-[calc...] yang mengunci layar, ganti dengan space-y-6 dan pb-12 agar lega
        <div className="space-y-6 pb-12">
            
            {/* --- HEADER SECTION --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                <div>
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

                {canInput && (
                    <button 
                        onClick={() => setIsOpen(true)} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center gap-2.5 px-6 py-3.5 rounded-xl shadow-[0_8px_16px_-6px_rgba(16,185,129,0.4)] transition-all active:scale-95 text-sm uppercase tracking-wider"
                    >
                        <Plus size={20} strokeWidth={3} />
                        Tambah Stok Baru
                    </button>
                )}
            </div>

             {/* --- ALUR PERSETUJUAN --- */}
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

            {/* --- TABLE SECTION AREA --- */}
            {/* 👇 PERBAIKAN 2: Hapus flex-1 min-h-0 yang membuat tabel tergencet */}
            <div className="w-full">
                <StockPages type="IN" />
            </div>

            {/* --- MODAL --- */}
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