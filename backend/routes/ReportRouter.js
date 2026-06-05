const express = require("express");
const router = express.Router();
const { 
    getSummary, 
    getStockMovement, 
    getCategoryDetail // 👇 Tambahkan fungsi baru ini
} = require("../controllers/ReportController");
const { protect } = require("../middlewares/ProtectRouters");

// Route untuk Ringkasan Utama Dashboard
router.get("/summary", protect, getSummary);

// Route untuk Grafik Volume Stok
router.get("/stock-movement", protect, getSummary);

// 👇 ROUTE BARU: Untuk mengambil detail produk saat kategori diklik
router.get("/category-detail/:category", protect, getCategoryDetail);

module.exports = router;