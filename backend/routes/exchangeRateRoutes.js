// File: backend/routes/exchangeRateRoutes.js
const express = require('express');
const router = express.Router();
const { getActiveRate, syncWithApi, updateManualRate } = require('../controllers/exchangeRateController');

// Rute untuk mendapatkan kurs saat ini
router.get('/', getActiveRate);

// Rute untuk sinkronisasi API Otomatis
router.post('/sync', syncWithApi);

// Rute untuk update manual oleh Admin
router.put('/manual', updateManualRate);

module.exports = router;

