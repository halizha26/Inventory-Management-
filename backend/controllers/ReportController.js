const mongoose = require("mongoose");
const asyncHandler = require("../utils/AsyncHandler");
const Product = require("../models/ProductModel");
const StockHistory = require("../models/StockHistoryModel");

// @desc    Get Inventory Summary
// @route   GET /api/reports/summary
// @access  Private
const getSummary = asyncHandler(async (req, res) => {
    // Ambil SEMUA produk tanpa filter user agar data kantor muncul semua
    const products = await Product.find({}); 
    
    let totalStoreValueIDR = 0;
    let totalStoreValueUSD = 0;
    const categoryMap = {};
    let outOfStockCount = 0;
    let lowStockCount = 0;

    products.forEach(p => {
        const itemValue = (Number(p.price) || 0) * (Number(p.quantity) || 0);
        
        if (p.currency === 'USD') {
            totalStoreValueUSD += itemValue;
        } else {
            totalStoreValueIDR += itemValue;
        }

        if (p.quantity === 0) outOfStockCount++;
        if (p.quantity <= (p.minStock || 0) || p.quantity <= 10) lowStockCount++;
        
        const cat = p.category && p.category.trim() !== "" ? p.category : 'Uncategorized';
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    const categoryStats = Object.keys(categoryMap).map(name => ({
        _id: name,
        count: categoryMap[name]
    }));

    const history = await StockHistory.find({}); 
    const movementMap = { 'IN': 0, 'OUT': 0 };

    history.forEach(h => {
        if (movementMap[h.type] !== undefined) {
            movementMap[h.type] += (Number(h.quantity) || 0);
        }
    });

    const stockMovement = Object.keys(movementMap).map(type => ({
        _id: type,
        totalQuantity: movementMap[type]
    }));

    res.status(200).json({
        totalProducts: products.length,
        totalStoreValueIDR,
        totalStoreValueUSD,
        outOfStock: outOfStockCount,
        lowStockCount,
        categoryStats,
        stockMovement,
        userId: req.user.id
    });
});

// @desc    Get Stock Movement Analytics
// @route   GET /api/reports/stock-movement
// @access  Private
const getStockMovement = asyncHandler(async (req, res) => {
    const history = await StockHistory.find({}); 
    
    const stats = {
        'IN': { _id: 'IN', totalQuantity: 0, count: 0 },
        'OUT': { _id: 'OUT', totalQuantity: 0, count: 0 }
    };

    history.forEach(h => {
        if (stats[h.type]) {
            stats[h.type].totalQuantity += (Number(h.quantity) || 0);
            stats[h.type].count += 1;
        }
    });

    res.status(200).json(Object.values(stats));
});

// @desc    Get Detail Products by Category (FITUR DRILL-DOWN)
// @route   GET /api/reports/category-detail/:category
// @access  Private
const getCategoryDetail = asyncHandler(async (req, res) => {
    const { category } = req.params;
    
    // Cari produk berdasarkan kategori yang diklik (Case Insensitive)
    const products = await Product.find({ 
        category: { $regex: category, $options: 'i' } 
    }).select('name quantity createdAt');

    // Kita petakan datanya agar siap dipakai grafik batang (per bulan)
    const chartData = products.map(p => ({
        name: p.name,
        stok: p.quantity,
        bulan: new Date(p.createdAt).toLocaleString('id-ID', { month: 'short' })
    }));

    res.status(200).json(chartData);
});

module.exports = {
    getSummary,
    getStockMovement,
    getCategoryDetail
};