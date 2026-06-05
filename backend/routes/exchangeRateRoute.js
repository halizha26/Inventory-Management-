const express = require('express');
const router = express.Router();

// Memanggil file model yang baru saja kita beri nama "ExchangeRateModel"
const ExchangeRate = require('../models/ExchangeRateModel');

// GET: Dipanggil saat halaman Admin Panel pertama kali dibuka
router.get('/', async (req, res) => {
  try {
    let currentRate = await ExchangeRate.findOne().sort({ createdAt: -1 });
    
    if (!currentRate) {
      currentRate = await ExchangeRate.create({ rate: 15500 });
    }
    
    res.json(currentRate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Dipanggil saat Admin klik tombol "Simpan Kebijakan Baru"
router.post('/', async (req, res) => {
  try {
    const { rate } = req.body;
    const newRate = await ExchangeRate.create({ rate });
    res.status(201).json(newRate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;