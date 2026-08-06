import axios from 'axios';

// Gunakan URL yang sesuai dengan port backend kamu
const API_URL = 'http://localhost:3000/api/exchange-rates'; 

// Helper untuk mengambil token
const getConfig = () => {
    // Sesuaikan cara kamu menyimpan data user/token saat login
    const userString = localStorage.getItem('user');
    let token = '';
    
    if (userString) {
        try {
            const user = JSON.parse(userString);
            token = user.token || '';
        } catch (e) {
            token = localStorage.getItem('token') || '';
        }
    } else {
        token = localStorage.getItem('token') || '';
    }
    
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

// Mengambil kurs aktif
const getCurrentRate = async () => {
    const response = await axios.get(`${API_URL}/`, getConfig());
    return response.data.data;
};

// Menjalankan sinkronisasi otomatis ke BI / Pasar Global
const syncRate = async () => {
    const response = await axios.post(`${API_URL}/sync`, {}, getConfig());
    return response.data;
};

// Mengubah kurs secara manual
const updateManualRate = async (newRate) => {
    const response = await axios.put(`${API_URL}/manual`, { newRate }, getConfig());
    return response.data;
};

// Bungkus semua fungsi ke dalam satu object
const exchangeRateService = {
    getCurrentRate,
    syncRate,
    updateManualRate
};

// 👇 INI BAGIAN YANG PALING PENTING UNTUK MENGHILANGKAN LAYAR PUTIH 👇
export default exchangeRateService;