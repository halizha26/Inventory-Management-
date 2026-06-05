const asyncHandler = require("../utils/AsyncHandler");
const Product = require("../models/ProductModel");
const StockHistory = require("../models/StockHistoryModel");

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Admin)
const createProduct = asyncHandler(async (req, res) => {
    // 👇 PERBAIKAN 1: Tambahkan 'currency' di sini agar ditangkap dari Frontend
    const { name, sku, category, price, currency, quantity, minStock, description, supplier } = req.body;

    const productExists = await Product.findOne({ name, user: req.user.id });
    if (productExists) {
        res.status(400);
        throw new Error("Product with this name already exists in your inventory");
    }

    const product = await Product.create({
        user: req.user.id,
        name,
        sku,
        category,
        price,
        currency, // 👇 PERBAIKAN 2: Simpan 'currency' ke Database
        quantity,
        minStock,
        description,
        supplier,
    });

    // Log initial stock as IN if quantity > 0
    if (quantity > 0) {
        await StockHistory.create({
            user: req.user.id,
            productId: product._id,
            type: "IN",
            quantity: quantity,
            reason: "Initial Stock",
        });
    }

    res.status(201).json(product);
});

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
    const products = await Product.find().sort("-createdAt");
    res.status(200).json({ products, user: req.user });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, user: req.user.id });
    if (!product) {
        res.status(404);
        throw new Error("Product not found in your inventory");
    }
    res.status(200).json(product);
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin)
const updateProduct = asyncHandler(async (req, res) => {
    // 👇 PERBAIKAN 3: Tambahkan 'currency' juga saat update data
    const { name, sku, category, price, currency, quantity, minStock, description, supplier } = req.body;
    const product = await Product.findOne({ _id: req.params.id, user: req.user.id });

    if (!product) {
        res.status(404);
        throw new Error("Product not found in your inventory");
    }

    // Check if updating name and if it already exists (excluding current product)
    if (name && name !== product.name) {
        const productExists = await Product.findOne({ name, user: req.user.id });
        if (productExists) {
            res.status(400);
            throw new Error("Product name already exists in your inventory");
        }
    }

    // Update fields
    product.name = name || product.name;
    product.sku = sku !== undefined ? sku : product.sku;
    product.category = category || product.category;
    product.price = price !== undefined ? price : product.price;
    product.currency = currency || product.currency; // 👇 PERBAIKAN 4: Update data 'currency'
    product.minStock = minStock !== undefined ? minStock : product.minStock;
    product.description = description || product.description;
    product.supplier = supplier || product.supplier;

    // Note: Quantity is usually updated via stock operations, but allowing manual override here implementation choice.
    if (quantity !== undefined) {
        const diff = Number(quantity) - product.quantity;
        if (diff !== 0) {
            await StockHistory.create({
                user: req.user.id,
                productId: product._id,
                type: diff > 0 ? "IN" : "OUT",
                quantity: Math.abs(diff),
                reason: "Manual Adjustment",
            });
            product.quantity = quantity;
        }
    }

    const updatedProduct = await product.save();
    res.status(200).json(updatedProduct);
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, user: req.user.id });
    if (!product) {
        res.status(404);
        throw new Error("Product not found in your inventory");
    }

    // Use deleteOne() instead of remove() which is deprecated
    await product.deleteOne();
    // Also remove history for this product
    await StockHistory.deleteMany({ productId: req.params.id, user: req.user.id });

    res.status(200).json({ message: "Product deleted and history cleared" });
});

// @desc    Get Low Stock Products
// @route   GET /api/products/low-stock
// @access  Private
const getLowStockProducts = asyncHandler(async (req, res) => {
    // Find products where quantity is low (<= 5) OR less than or equal to custom minStock
    const products = await Product.find({
        // user: req.user.id,
        $or: [
            { $expr: { $lte: ["$quantity", "$minStock"] } },
            { quantity: { $lte: 5 } }
        ]
    }).sort("quantity");

    res.status(200).json(products);
});

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getLowStockProducts
};