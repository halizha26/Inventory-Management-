// File: backend/routes/exchangeRateRoutes.js
const express = require('express');
const router = express.Router();
const { getActiveRate, syncWithApi, updateManualRate } = require('../controllers/exchangeRateController');
const { protect } = require('../middlewares/ProtectRouters'); // Tambahkan middleware proteksi

// Rute untuk mendapatkan kurs saat ini (Bisa diakses user yang login)
router.get('/', protect, getActiveRate);

// Rute untuk sinkronisasi API Otomatis
router.post('/sync', protect, syncWithApi);

// Rute untuk update manual oleh Admin
router.put('/manual', protect, updateManualRate);

module.exports = router;