import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const AdminPanel = () => {
  // --- STATE KURS (DIGABUNGKAN) ---
  const [usdRate, setUsdRate] = useState(15500);
  const [inputRate, setInputRate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  // 1. Ambil kurs dari database (API Settings yang baru kita buat)
  useEffect(() => {
    fetchUsdRate();
  }, []);

  const fetchUsdRate = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/settings'); 
      if (response.data && response.data.usdRate) {
        setUsdRate(response.data.usdRate);
        if (response.data.lastSyncDate) {
          setLastUpdated(new Date(response.data.lastSyncDate).toLocaleString('id-ID'));
        }
      }
    } catch (error) {
      console.error('Gagal memuat kurs aktif:', error);
      toast.error('Gagal memuat kurs BI dari server');
    }
  };

  // 2. Fungsi Sinkronisasi Otomatis ke Bank Indonesia
  const handleSyncBI = async () => {
    setIsSyncing(true);
    try {
      const response = await axios.post("http://localhost:3000/api/settings/sync");
      if (response.status === 200) {
        toast.success("Berhasil update kurs terbaru dari Bank Indonesia!");
        setUsdRate(response.data.data.kurs_tengah_disimpan);
        setLastUpdated(new Date().toLocaleString('id-ID'));
      }
    } catch (err) {
      toast.error("Kesalahan jaringan saat menghubungi server BI.");
    } finally {
      setIsSyncing(false);
    }
  };

  // 3. Fungsi untuk menyimpan perubahan kurs manual (Fallback)
  const handleSaveRate = async (e) => {
    e.preventDefault();
    const parsedRate = parseInt(String(inputRate).replace(/[^0-9]/g, ''), 10);

    if (!parsedRate || parsedRate <= 0) {
      toast.error('Masukkan nominal kurs yang valid');
      return;
    }

    setIsLoading(true);
    try {
      // Catatan: Jika di masa depan kamu ingin mengubah rute manual ini agar tersimpan
      // di API Settings juga, kamu cukup menyesuaikan rutenya di backend.
      // Saat ini kita biarkan mengarah ke rute lama-mu, tapi mengubah state visualnya.
      const response = await axios.post('http://localhost:3000/api/exchange-rate', { rate: parsedRate });
      
      if (response.data && response.data.rate) {
        setUsdRate(response.data.rate);
        setLastUpdated(new Date().toLocaleString('id-ID') + " (Manual)");
        setInputRate('');
        toast.success(`Kurs USD Berhasil Diperbarui secara manual menjadi Rp ${parsedRate.toLocaleString('id-ID')}`);
      }
    } catch (error) {
      console.error('Error saat menyimpan:', error);
      toast.error('Gagal memperbarui kurs secara manual');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Panel Kontrol Manajemen</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Konfigurasi Kebijakan Keuangan Internal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* --- KARTU 1: INTEGRASI BANK INDONESIA --- */}
        <div className="bg-white p-6 rounded-[24px] border-2 border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
              <RefreshCw size={28} strokeWidth={2.5} className={isSyncing ? "animate-spin" : ""} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-xl tracking-tight">Integrasi Kurs BI</h3>
              <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Web Service Bank Indonesia</p>
            </div>
          </div>
          
          <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 mb-6 mt-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kurs Akuntansi Saat Ini</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg shadow-sm">Aktif / Live</span>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              Rp {usdRate > 0 ? usdRate.toLocaleString('id-ID') : '...'}
            </div>
            <div className="border-t border-slate-200 pt-3 mt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Pembaruan Terakhir:</p>
              <p className="text-[11px] font-bold text-slate-700 mt-0.5">{lastUpdated || 'Belum ada sinkronisasi'}</p>
            </div>
          </div>

          <button
            onClick={handleSyncBI}
            disabled={isSyncing}
            className="w-full py-4 bg-slate-800 hover:bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[11px] transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 border-2 border-transparent hover:border-indigo-400"
          >
            {isSyncing ? "Menarik Data Resmi..." : "Sinkronisasi Manual Bulan Ini"}
          </button>
          <p className="text-[9px] text-center font-bold text-slate-400 uppercase tracking-widest mt-4">
            *SISTEM CRON JOB OTOMATIS UPDATE SETIAP AKHIR BULAN PADA PUKUL 16:00 WIB
          </p>
        </div>

        {/* --- KARTU 2: FORM OVERRIDE MANUAL (FALLBACK) --- */}
        <div className="md:col-span-2 p-6 rounded-[24px] border-2 border-slate-200 shadow-sm bg-white flex flex-col">
          <h4 className="font-black text-slate-800 uppercase text-sm tracking-widest border-b-2 border-slate-100 pb-4 mb-6 flex items-center gap-2">
            <Save size={18} className="text-slate-400" />
            Override Nilai Tukar (Mode Manual)
          </h4>
          
          <form onSubmit={handleSaveRate} className="space-y-6 flex-1 flex flex-col justify-center">
            <div className="w-full space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nilai Rupiah Baru (IDR)
              </label>
              <div className="flex border-2 border-slate-200 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-600 transition-all shadow-sm max-w-md bg-white">
                <span className="bg-slate-100 border-r-2 border-slate-200 px-5 flex items-center font-black text-slate-700 text-sm">
                  Rp
                </span>
                <input
                  type="number"
                  placeholder="Contoh: 15600"
                  value={inputRate}
                  onChange={(e) => setInputRate(e.target.value)}
                  className="w-full px-5 py-4 font-black text-xl text-slate-900 outline-none bg-transparent"
                />
              </div>
              <p className="text-[11px] font-medium text-slate-500 leading-relaxed pt-2 max-w-lg">
                *Gunakan form ini <b>hanya</b> jika server Bank Indonesia sedang bermasalah. Mengubah angka ini akan langsung merevisi perhitungan <b>Total Valuasi Global</b> di seluruh sistem akuntansi.
              </p>
            </div>

            <div className="flex justify-start pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-4 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all uppercase tracking-widest flex items-center gap-3 shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95"
              >
                {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                Terapkan Kurs Manual
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AdminPanel;