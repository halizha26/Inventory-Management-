import React, { useState } from 'react';
import StockModal from '../components/stock/StockModal';
import StockPages from './StockPages';
import { Minus, TrendingDown, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StockOut = () => {
    const { user } = useAuth();
    const canInput = ['staff', 'admin'].includes(user?.role);
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="space-y-4"> {/* Mengurangi jarak utama dari space-y-6 ke space-y-4 */}
            {/* --- HEADER & TOMBOL --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <span className="p-2 bg-red-100 text-red-600 rounded-lg shadow-sm">
                            <TrendingDown size={24} />
                        </span>
                        Permintaan Stok Keluar
                    </h1>
                    <p className="text-sm text-gray-500 mt-1.5 uppercase font-semibold tracking-tight">
                        {user?.role === 'admin'
                            ? 'Akses Penuh: Input, Setujui, dan Konfirmasi permintaan.'
                            : canInput
                            ? 'Kirim permintaan pengeluaran stok barang baru.'
                            : user?.role === 'management'
                                ? 'Periksa dan setujui permintaan stok keluar di bawah.'
                                : 'Konfirmasi permintaan stok yang telah disetujui.'}
                    </p>
                </div>
                
                {canInput && (
                    <button 
                        onClick={() => setIsOpen(true)} 
                        className="
                            bg-red-600 hover:bg-red-700 
                            text-white font-black 
                            flex items-center gap-2.5 
                            px-6 py-3.5 
                            rounded-xl 
                            shadow-[0_4px_12px_0_rgba(220,38,38,0.3)] 
                            transition-all 
                            active:scale-95 
                            uppercase 
                            tracking-wide 
                            text-sm
                        "
                    >
                        <div className="bg-white/20 p-1 rounded-md">
                            <Minus size={20} strokeWidth={3} />
                        </div>
                        Keluarkan Stok
                    </button>
                )}
            </div>

            {/* --- PANDUAN ALUR (STEPPER) - VERSI CLEAN & COMPACT --- */}
            <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 lg:gap-8">
                <div className="flex items-center gap-2 min-w-max">
                    <span className="w-1.5 h-4 bg-red-500 rounded-full"></span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Alur Persetujuan:</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 md:gap-3 text-sm w-full">
                    {/* Step 1 */}
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">1</span>
                        <span className="font-bold text-slate-700 text-[11px] uppercase tracking-tight">Input <span className="hidden md:inline text-slate-400 font-medium">(Staff)</span></span>
                    </div>
                    
                    <span className="text-slate-300 text-xs">➔</span>

                    {/* Step 2 */}
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">2</span>
                        <span className="font-bold text-blue-800 text-[11px] uppercase tracking-tight">Setuju <span className="hidden md:inline text-blue-500/80 font-medium">(Manajemen)</span></span>
                    </div>

                    <span className="text-slate-300 text-xs">➔</span>

                    {/* Step 3 */}
                    <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                        <span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">3</span>
                        <span className="font-bold text-green-800 text-[11px] uppercase tracking-tight">Konfirmasi <span className="hidden md:inline text-green-600/80 font-medium">(Keuangan)</span></span>
                    </div>
                </div>
            </div>

            {/* --- COMPONENT TABEL (Filter Box sudah ada di dalam StockPages) --- */}
            <StockPages type="OUT" />

            <StockModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                type="OUT"
                onSuccess={() => { setIsOpen(false); window.location.reload(); }}
            />
        </div>
    );
};

export default StockOut;