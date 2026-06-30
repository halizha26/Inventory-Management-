const express = require("express");
const router = express.Router();

const {
    createCategory,
    getCategories,
    deleteCategory,
} = require("../controllers/CategoryController");

const { protect } = require("../middlewares/ProtectRouters");
const { adminOnly } = require("../middlewares/AdminMiddleware"); // Hapus baris ini jika kamu belum punya middleware adminOnly

// Rute untuk mengambil semua kategori & membuat kategori baru
router.route("/")
    .get(protect, getCategories)
    .post(protect, adminOnly, createCategory); // Pastikan adminOnly benar-benar ada di middleware-mu

// Rute untuk menghapus kategori
router.route("/:id")
    .delete(protect, adminOnly, deleteCategory);

module.exports = router;