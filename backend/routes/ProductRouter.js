const express = require("express");
const router = express.Router();
const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getLowStockProducts,
    generateAutoSKU // 👇 Ditambahkan import
} = require("../controllers/ProductController");
const { protect } = require("../middlewares/ProtectRouters");
const { adminOnly } = require("../middlewares/AdminMiddleware");

// Routes
router.route("/")
    .get(protect, getProducts)
    .post(protect, adminOnly, createProduct);

// 👇 Rute spesifik harus DI ATAS /:id agar tidak terjadi bentrok 👇
router.get("/low-stock", protect, getLowStockProducts);
router.get("/generate-sku", protect, generateAutoSKU); 

router.route("/:id")
    .get(protect, getProductById)
    .put(protect, adminOnly, updateProduct)
    .delete(protect, adminOnly, deleteProduct);

module.exports = router;