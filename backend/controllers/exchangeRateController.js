// File: backend/controllers/exchangeRateController.js
const ExchangeRate = require('../models/ExchangeRate');
const axios = require('axios');

// 1. Fungsi untuk Dashboard Frontend (Mengambil kurs aktif saat ini dari database)
exports.getActiveRate = async (req, res) => {
    try {
        let currentRate = await ExchangeRate.findOne({ currencyPair: 'USD_TO_IDR' });
        
        // Jika database masih kosong (baru pertama kali jalan), buat data default
        if (!currentRate) {
            currentRate = await ExchangeRate.create({ rate: 17367, source: 'Manual_Admin' });
        }
        
        res.status(200).json({ success: true, data: currentRate });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

// 2. Fungsi API Otomatis (Menarik data dari ExchangeRate-API)
exports.syncWithApi = async (req, res) => {
    try {
        // Menggunakan endpoint publik (open) dari ExchangeRate-API
        const response = await axios.get('https://open.er-api.com/v6/latest/USD');
        const idrRate = response.data.rates.IDR; // Mengekstrak kurs Rupiah

        // Update database dengan nilai terbaru
        const updatedRate = await ExchangeRate.findOneAndUpdate(
            { currencyPair: 'USD_TO_IDR' },
            { 
                rate: idrRate, 
                source: 'API_Otomatis', 
                lastUpdated: Date.now() 
            },
            { new: true, upsert: true } // upsert: buat baru jika belum ada
        );

        res.status(200).json({ 
            success: true, 
            message: 'Kurs berhasil disinkronisasi dengan pasar global!', 
            data: updatedRate 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal menarik data dari API Global' });
    }
};

// 3. Fungsi Manual Admin (Sesuai Kurs BI/Pajak PT Para Mitra Karya)
exports.updateManualRate = async (req, res) => {
    try {
        const { newRate } = req.body;

        const updatedRate = await ExchangeRate.findOneAndUpdate(
            { currencyPair: 'USD_TO_IDR' },
            { 
                rate: newRate, 
                source: 'Manual_Admin', 
                lastUpdated: Date.now() 
            },
            { new: true, upsert: true }
        );

        res.status(200).json({ success: true, message: 'Kurs manual berhasil diperbarui', data: updatedRate });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memperbarui kurs manual' });
    }
};