import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const AdminPanel = () => {
  const [currentRate, setCurrentRate] = useState(15500);
  const [inputRate, setInputRate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  // 1. Ambil kurs aktif dari database saat halaman dibuka
  useEffect(() => {
    fetchCurrentRate();
  }, []);

  const fetchCurrentRate = async () => {
    try {
      // Kita panggil API dengan alamat lengkap backend-mu agar tidak nyasar
      const response = await axios.get('http://localhost:3000/api/exchange-rate'); 
      
      // Pengaman: Pastikan datanya benar-benar ada sebelum dimasukkan ke state
      if (response.data && response.data.rate) {
        setCurrentRate(response.data.rate);
        if (response.data.updatedAt) {
          setLastUpdated(new Date(response.data.updatedAt).toLocaleString('id-ID'));
        }
      }
    } catch (error) {
      console.error('Gagal memuat kurs aktif:', error);
      toast.error('Gagal terhubung ke server backend');
    }
  };

  // 2. Fungsi untuk menyimpan perubahan kurs baru
  const handleSaveRate = async (e) => {
    e.preventDefault();
    const parsedRate = parseInt(String(inputRate).replace(/[^0-9]/g, ''), 10);

    if (!parsedRate || parsedRate <= 0) {
      toast.error('Masukkan nominal kurs yang valid');
      return;
    }

    setIsLoading(true);
    try {
      // Kirim ke alamat lengkap backend
      const response = await axios.post('http://localhost:3000/api/exchange-rate', { rate: parsedRate });
      
      if (response.data && response.data.rate) {
        setCurrentRate(response.data.rate);
        setLastUpdated(new Date().toLocaleString('id-ID'));
        setInputRate('');
        
        toast.success(`Kurs USD Berhasil Diperbarui menjadi Rp ${parsedRate.toLocaleString('id-ID')}`);
      }
    } catch (error) {
      console.error('Error saat menyimpan:', error);
      toast.error('Gagal memperbarui kurs');
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
        <div className="p-6 rounded-2xl border-2 border-slate-200 shadow-md bg-white flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Patokan Kurs Aktif</span>
            <div className="flex items-baseline gap-2 pt-2">
              <span className="text-sm font-black text-emerald-600">1 USD =</span>
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                Rp {Number(currentRate || 15500).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
          <div className="border-t-2 border-slate-100 pt-4 mt-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Pembaruan Terakhir:</p>
            <p className="text-xs font-bold text-slate-700 mt-1">{lastUpdated || 'Belum ada data'}</p>
          </div>
        </div>

        <div className="md:col-span-2 p-6 rounded-2xl border-2 border-slate-200 shadow-md bg-white">
          <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest border-b-2 border-slate-100 pb-3 mb-4">
            Perbarui Nilai Tukar Acuan
          </h4>
          
          <form onSubmit={handleSaveRate} className="space-y-4">
            <div className="w-full space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nilai Rupiah Baru (IDR)
              </label>
              <div className="flex border-2 border-slate-200 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-600 transition-all shadow-sm max-w-md bg-white">
                <span className="bg-slate-100 border-r-2 border-slate-200 px-4 flex items-center font-black text-slate-700 text-sm">
                  Rp
                </span>
                <input
                  type="number"
                  placeholder="Contoh: 15600"
                  value={inputRate}
                  onChange={(e) => setInputRate(e.target.value)}
                  className="w-full px-4 py-3 font-black text-lg text-slate-900 outline-none bg-transparent"
                />
              </div>
              <p className="text-[11px] font-medium text-slate-400 leading-relaxed pt-1">
                *Mengubah angka ini akan langsung menyesuaikan visualisasi **Total Valuasi Global** di halaman laporan manajemen.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all uppercase tracking-widest flex items-center gap-2 shadow-md disabled:opacity-50 active:scale-95"
              >
                {isLoading ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                Simpan Kebijakan Baru
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;