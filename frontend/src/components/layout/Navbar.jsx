import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, AlertTriangle, CheckCircle, Info, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios'; // Jangan lupa import axios!

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);
  
  // State ini awalnya kosong, menunggu data dari database
  const [notifications, setNotifications] = useState([]);

  // 👇 FUNGSI UNTUK MENARIK DATA DARI API BACKEND
  const fetchNotifications = async () => {
    try {
      // Pastikan port ini sesuai dengan port backend kamu (3000)
      const res = await axios.get('http://localhost:3000/api/notifications');
      setNotifications(res.data);
    } catch (error) {
      console.error("Gagal mengambil notifikasi:", error);
    }
  };

  // Ambil notifikasi saat halaman pertama kali dimuat
  useEffect(() => {
    fetchNotifications();
    
    // Opsional: Cek notifikasi baru setiap 30 detik secara otomatis di latar belakang
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Saat ikon bel diklik
  const handleBellClick = () => {
    const newStatus = !isNotifOpen;
    setIsNotifOpen(newStatus);
    // Kalau kotak dibuka, tarik data terbaru lagi biar selalu update
    if (newStatus) {
      fetchNotifications();
    }
  };

  // 👇 FUNGSI UPDATE KE DATABASE SAAT KLIK "TANDAI SEMUA"
  const handleMarkAllAsRead = async () => {
    try {
      // Lapor ke database bahwa semua sudah dibaca
      await axios.put('http://localhost:3000/api/notifications/mark-read');
      // Kosongkan layar frontend
      setNotifications([]);
    } catch (error) {
      console.error("Gagal menandai notifikasi:", error);
    }
  };

  // Tutup kotak kalau area di luarnya diklik
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fungsi pembantu untuk memilih Ikon berdasarkan tipe dari database
  const getIcon = (type) => {
    switch (type) {
      case 'warning': return AlertTriangle;
      case 'approval': return CheckCircle;
      case 'info': return Info;
      default: return Info;
    }
  };

  // Fungsi pembantu untuk warna
  const getColorClasses = (color) => {
    const classes = {
      amber: 'bg-amber-100 text-amber-600 group-hover:bg-amber-200',
      blue: 'bg-blue-100 text-blue-600 group-hover:bg-blue-200',
      emerald: 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200',
    };
    return classes[color] || classes.blue;
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 fixed top-0 right-0 left-0 lg:left-64 z-30 flex items-center justify-between px-4 lg:px-8">
      
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={notifRef}>
          <button 
            onClick={handleBellClick}
            className={`relative p-2.5 rounded-xl transition-all active:scale-95 ${
              isNotifOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Bell size={22} strokeWidth={2.5} />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
              
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center backdrop-blur-sm">
                <h3 className="font-black text-slate-800 tracking-tight text-base">Notifikasi</h3>
                <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full uppercase tracking-widest">
                  {notifications.length} Baru
                </span>
              </div>

              <div className="max-h-[340px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => {
                    const Icon = getIcon(notif.type);
                    return (
                      <div key={notif._id} className="px-5 py-4 border-b border-slate-50 hover:bg-blue-50/50 transition-colors cursor-pointer flex gap-4 items-start group">
                        <div className={`p-2.5 rounded-xl mt-0.5 transition-colors shadow-sm ${getColorClasses(notif.color)}`}>
                          <Icon size={18} strokeWidth={3} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 leading-none mb-1.5">{notif.title}</p>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">{notif.message}</p>
                          <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-wider">
                            {new Date(notif.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-5 py-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-sm">
                      <CheckCircle2 size={32} className="text-slate-300" strokeWidth={2.5} />
                    </div>
                    <p className="text-sm font-black text-slate-700">Hore! Semuanya sudah dibaca.</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">Belum ada pembaruan sistem lagi saat ini.</p>
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 text-center">
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors active:scale-95"
                  >
                    Tandai Semua Telah Dibaca
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;