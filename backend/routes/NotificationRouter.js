const express = require('express');
const router = express.Router();
const Notification = require('../models/NotificationModel'); // Pastikan path ini sesuai dengan letak folder models-mu

// 1. API untuk mengambil notifikasi yang belum dibaca (GET)
router.get('/', async (req, res) => {
  try {
    // Mengambil data yang isRead-nya false, diurutkan dari yang paling baru
    const notifications = await Notification.find({ isRead: false }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil notifikasi', error: error.message });
  }
});

// 2. API untuk menandai semua notifikasi sudah dibaca (PUT)
router.put('/mark-read', async (req, res) => {
  try {
    // Mengubah semua isRead: false menjadi isRead: true
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ message: 'Semua notifikasi berhasil ditandai telah dibaca' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menandai notifikasi', error: error.message });
  }
});

module.exports = router;