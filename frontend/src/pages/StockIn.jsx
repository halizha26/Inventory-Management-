import React, { useState } from 'react';
import StockModal from '../components/stock/StockModal';
import StockPages from './StockPages';
import { Plus, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StockIn = () => {
    const { user } = useAuth();
    const canInput = ['staff', 'admin'].includes(user?.role);
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="space-y-6">
            {/* --- HEADER SECTION --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <span className="p-2 bg-green-100 text-green-600 rounded-lg shadow-sm">
                            <TrendingUp size={24} />
                        </span>
                        Permintaan Stok Masuk
                    </h1>
                    <p className="text-sm text-gray-500 mt-1.5 uppercase font-semibold tracking-tight">
                        {user?.role === 'admin'
                            ? 'Akses Penuh: Input, Setujui, dan Konfirmasi permintaan stok masuk.'
                            : canInput
                            ? 'Kirim permintaan pemasukan stok barang baru.'
                            : user?.role === 'finance'
                                ? 'Periksa dan setujui permintaan stok masuk di bawah ini.'
                                : 'Konfirmasi permintaan stok yang telah disetujui.'}
                    </p>
                </div>

                {/* TOMBOL NEW REQUEST: Ukuran Sama dengan Stock Out, Warna Hijau */}
                {canInput && (
                    <button 
                        onClick={() => setIsOpen(true)} 
                        className="
                            bg-emerald-600 hover:bg-emerald-700 
                            text-white font-black 
                            flex items-center gap-2.5 
                            px-6 py-3.5 
                            rounded-xl 
                            shadow-[0_4px_12px_0_rgba(16,185,129,0.3)] 
                            transition-all 
                            active:scale-95 
                            uppercase 
                            tracking-wide 
                            text-sm
                        "
                    >
                        <div className="bg-white/20 p-1 rounded-md">
                            <Plus size={20} strokeWidth={3} />
                        </div>
                       Tambah Stok Baru
                    </button>
                )}
            </div>

             {/* --- PANDUAN ALUR RINGKAS (Versi Clean) --- */}
             <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2 min-w-max">
                    <span className="w-1.5 h-4 bg-green-500 rounded-full"></span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Alur:</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 font-bold text-[11px] uppercase">
                        <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">1</span>
                        Input (Staff)
                    </div>
                    <span className="text-slate-300">➔</span>
                    <div className="flex items-center gap-2 text-blue-700 font-bold text-[11px] uppercase">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                        Setuju (Keuangan)
                    </div>
                    <span className="text-slate-300">➔</span>
                    <div className="flex items-center gap-2 text-green-700 font-bold text-[11px] uppercase">
                        <span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px]">3</span>
                        Konfirmasi (Manajemen)
                    </div>
                </div>
            </div>

            {/* --- TABLE SECTION --- */}
            <StockPages type="IN" />

            {/* --- MODAL --- */}
            <StockModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                type="IN"
                onSuccess={() => { setIsOpen(false); window.location.reload(); }}
            />
        </div>
    );
};

export default StockIn;