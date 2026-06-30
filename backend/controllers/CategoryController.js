const asyncHandler = require("express-async-handler"); // Atau sesuaikan dengan path utils kamu jika pakai custom
const Category = require("../models/CategoryModel");

// @desc    Create a Category
// @route   POST /api/categories
// @access  Private (Admin)
const createCategory = asyncHandler(async (req, res) => {
    const { name } = req.body;

    if (!name) {
        res.status(400);
        throw new Error("Mohon masukkan nama kategori");
    }

    // Cek apakah kategori dengan nama yang sama persis sudah ada
    const categoryExists = await Category.findOne({ name });
    
    if (categoryExists) {
        // Jika sudah ada, langsung kembalikan data yang ada saja (tidak error)
        // Ini berguna saat React-Select mencoba membuat kategori yang ternyata sudah diketik admin lain
        return res.status(200).json(categoryExists);
    }

    // Buat kategori baru
    const newCategory = await Category.create({ name });
    res.status(201).json(newCategory);
});

// @desc    Get all Categories
// @route   GET /api/categories
// @access  Private
const getCategories = asyncHandler(async (req, res) => {
    // Ambil semua kategori dan urutkan berdasarkan abjad (A-Z)
    const categories = await Category.find().sort("name");
    res.status(200).json(categories);
});

// @desc    Delete Category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
const deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
        res.status(404);
        throw new Error("Kategori tidak ditemukan");
    }

    await category.deleteOne();
    res.status(200).json({ message: "Kategori berhasil dihapus" });
});

module.exports = {
    createCategory,
    getCategories,
    deleteCategory
};