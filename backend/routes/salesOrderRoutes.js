const express = require('express');
const router = express.Router();
const SalesOrder = require('../models/SalesOrderModel');

// Rute untuk mencari data SO berdasarkan nomornya
router.get('/:soNumber', async (req, res) => {
    try {
        const so = await SalesOrder.findOne({ soNumber: req.params.soNumber });
        if (!so) {
            return res.status(404).json({ success: false, message: 'Nomor SO tidak ditemukan di sistem Sales.' });
        }
        res.status(200).json({ success: true, data: so });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
});

module.exports = router;