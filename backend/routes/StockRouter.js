const express = require("express");
const router = express.Router();
const {
    stockIn,
    stockOut,
    approveStockIn,
    acknowledgeStockIn,
    approveStockOut,
    acknowledgeStockOut,
    rejectStock,
    getStockHistory,
} = require("../controllers/StockController");
const { protect } = require("../middlewares/ProtectRouters");
const { financeOnly, managementOnly } = require("../middlewares/ManajemenPengadaan");

// --- JALUR VIP: Mengizinkan Admin untuk bypass aturan Finance & Management ---
const allowAdminOrFinance = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next(); // Kalau Admin, silakan langsung masuk
    }
    return financeOnly(req, res, next); // Kalau bukan, cek apakah dia Finance
};

const allowAdminOrManagement = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next(); // Kalau Admin, silakan langsung masuk
    }
    return managementOnly(req, res, next); // Kalau bukan, cek apakah dia Management
};
// -----------------------------------------------------------------------------

// Staff input
router.post("/in", protect, stockIn);
router.post("/out", protect, stockOut);

// Request stockIn flow: Finance approve → Management acknowledge
// (Sekarang Admin bisa melakukan keduanya)
router.patch("/:id/approve", protect, allowAdminOrFinance, approveStockIn);
router.patch("/:id/acknowledge", protect, allowAdminOrManagement, acknowledgeStockIn);

// Request stockOut flow: Management approve → Finance acknowledge
// (Sekarang Admin bisa melakukan keduanya)
router.patch("/:id/approve-out", protect, allowAdminOrManagement, approveStockOut);
router.patch("/:id/acknowledge-out", protect, allowAdminOrFinance, acknowledgeStockOut);

// Reject (finance or management or admin)
router.patch("/:id/reject", protect, rejectStock);

// History
router.get("/history", protect, getStockHistory);

module.exports = router;