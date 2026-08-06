const asyncHandler = require("../utils/AsyncHandler");
const Product = require("../models/ProductModel");
const StockHistory = require("../models/StockHistoryModel");

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Admin)
const createProduct = asyncHandler(async (req, res) => {
    const { name, sku, category, subCategory, price, currency, quantity, minStock, description, supplier } = req.body;

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
        subCategory,
        price,
        currency,
        quantity,
        minStock,
        description,
        supplier,
    });

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
    const { name, sku, category, subCategory, price, currency, quantity, minStock, description, supplier } = req.body;
    const product = await Product.findOne({ _id: req.params.id, user: req.user.id });

    if (!product) {
        res.status(404);
        throw new Error("Product not found in your inventory");
    }

    if (name && name !== product.name) {
        const productExists = await Product.findOne({ name, user: req.user.id });
        if (productExists) {
            res.status(400);
            throw new Error("Product name already exists in your inventory");
        }
    }

    product.name = name || product.name;
    product.sku = sku !== undefined ? sku : product.sku;
    product.category = category || product.category;
    product.subCategory = subCategory || product.subCategory;
    product.price = price !== undefined ? price : product.price;
    product.currency = currency || product.currency;
    product.minStock = minStock !== undefined ? minStock : product.minStock;
    product.description = description || product.description;
    product.supplier = supplier || product.supplier;

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

    await product.deleteOne();
    await StockHistory.deleteMany({ productId: req.params.id, user: req.user.id });

    res.status(200).json({ message: "Product deleted and history cleared" });
});

// @desc    Get Low Stock Products
// @route   GET /api/products/low-stock
// @access  Private
const getLowStockProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({
        $or: [
            { $expr: { $lte: ["$quantity", "$minStock"] } },
            { quantity: { $lte: 5 } }
        ]
    }).sort("quantity");

    res.status(200).json(products);
});

// 👇 PERBAIKAN: Generate Auto SKU Berdasarkan Standar COA Excel NuPMK 👇
// @route   GET /api/products/generate-sku
// @access  Private
const generateAutoSKU = asyncHandler(async (req, res) => {
    const { subCategory } = req.query;

    if (!subCategory) {
        res.status(400);
        throw new Error("Sub-Kategori dibutuhkan untuk membuat SKU otomatis.");
    }

    // Kamus Aturan SKU Sesuai Lampiran Excel COA
    const skuConfig = {
        "Inventory Class Delivery": { defaultStart: 115011, step: 1 },
        "Celemi Material Inventory": { defaultStart: 115021, step: 1 },
        "Fixed Assets": { defaultStart: 12401, step: 1 },
        "OFFICE EQUIPMENT - PERALATAN KANTOR": { defaultStart: 96100, step: 10 },
        "WORKING TOOLS/EQUIPMENT - PERALATAN KERJA": { defaultStart: 97100, step: 10 }
    };

    const config = skuConfig[subCategory] || { defaultStart: 999000, step: 1 };

    // Cari semua produk pada sub-kategori tersebut di database
    const products = await Product.find({ subCategory: subCategory });

    let maxSkuVal = 0;
    if (products && products.length > 0) {
        // Logika aman untuk mencari angka tertinggi tanpa error string sorting
        products.forEach(p => {
            if (p.sku) {
                const num = parseInt(p.sku, 10);
                if (!isNaN(num) && num > maxSkuVal) {
                    maxSkuVal = num;
                }
            }
        });
    }

    let newSKU;
    if (maxSkuVal > 0) {
        newSKU = maxSkuVal + config.step;
    } else {
        newSKU = config.defaultStart;
    }

    res.status(200).json({ sku: newSKU.toString() });
});

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getLowStockProducts,
    generateAutoSKU
};