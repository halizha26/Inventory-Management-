const mongoose = require("mongoose");
const asyncHandler = require("../utils/AsyncHandler");
const Product = require("../models/ProductModel");
const StockHistory = require("../models/StockHistoryModel");
const exceljs = require("exceljs"); 

// @desc    Get Inventory Summary
// @route   GET /api/reports/summary
// @access  Private
const getSummary = asyncHandler(async (req, res) => {
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

// @desc    Get Detail Products by Category
// @route   GET /api/reports/category-detail/:category
// @access  Private
const getCategoryDetail = asyncHandler(async (req, res) => {
    const { category } = req.params;
    
    const products = await Product.find({ 
        category: { $regex: category, $options: 'i' } 
    }).select('name quantity createdAt');

    const chartData = products.map(p => ({
        name: p.name,
        stok: p.quantity,
        bulan: new Date(p.createdAt).toLocaleString('id-ID', { month: 'short' })
    }));

    res.status(200).json(chartData);
});

// @desc    Download Excel Report (Kartu Stok / Item)
// @route   GET /api/reports/export-excel
// @access  Private
const downloadExcel = asyncHandler(async (req, res) => {
    const products = await Product.find({}).sort('name');
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // Mengatur lebar kolom agar presisi dengan template Excel
    worksheet.columns = [
        { width: 3 },  // A (Spacer)
        { width: 3 },  // B (Spacer)
        { width: 15 }, // C (IN - TGL)
        { width: 8 },  // D (IN - Qty)
        { width: 15 }, // E (IN - Harga)
        { width: 18 }, // F (IN - Total)
        { width: 15 }, // G (OUT - TGL)
        { width: 8 },  // H (OUT - Qty)
        { width: 15 }, // I (OUT - Harga)
        { width: 18 }, // J (OUT - Total)
        { width: 10 }, // K (SALDO - Qty)
        { width: 15 }, // L (SALDO - Harga)
        { width: 18 }, // M (SALDO - Total)
        { width: 35 }, // N (Notes)
    ];

    let currentRow = 1;

    for (const product of products) {
        // 1. HEADER IDENTITAS (NuPMK Consulting)
        worksheet.getCell(`C${currentRow + 1}`).value = 'NuPMK Consulting';
        worksheet.getCell(`C${currentRow + 1}`).font = { bold: true, size: 12 };
        
        worksheet.getCell(`C${currentRow + 2}`).value = 'Inventory recap';
        worksheet.getCell(`C${currentRow + 2}`).font = { bold: true, size: 12 };
        
        worksheet.getCell(`C${currentRow + 3}`).value = product.name;
        worksheet.getCell(`C${currentRow + 3}`).font = { bold: true, size: 12 };

        currentRow += 5;

        // 2. HEADER KELOMPOK TABEL (IN, OUT, SALDO, Notes)
        const inHeader = worksheet.getCell(`C${currentRow}`);
        inHeader.value = 'IN';
        inHeader.alignment = { horizontal: 'center', vertical: 'middle' };
        inHeader.font = { bold: true };
        worksheet.mergeCells(`C${currentRow}:F${currentRow}`);

        const outHeader = worksheet.getCell(`G${currentRow}`);
        outHeader.value = 'OUT';
        outHeader.alignment = { horizontal: 'center', vertical: 'middle' };
        outHeader.font = { bold: true };
        worksheet.mergeCells(`G${currentRow}:J${currentRow}`);

        const saldoHeader = worksheet.getCell(`K${currentRow}`);
        saldoHeader.value = 'SALDO';
        saldoHeader.alignment = { horizontal: 'center', vertical: 'middle' };
        saldoHeader.font = { bold: true };
        worksheet.mergeCells(`K${currentRow}:M${currentRow}`);

        const notesHeader = worksheet.getCell(`N${currentRow}`);
        notesHeader.value = 'Notes';
        notesHeader.font = { bold: true };

        currentRow++;

        // 3. SUB-HEADER (TGL, Qty, Harga, Total)
        const subHeaders = [
            '', '', 
            'TGL', 'Qty', 'Harga', 'Total', 
            'TGL', 'Qty', 'Harga', 'Total', 
            'Qty', 'Harga', 'Total', 
            ''
        ];
        const subHeaderRow = worksheet.getRow(currentRow);
        subHeaderRow.values = subHeaders;
        subHeaderRow.font = { bold: true };
        
        currentRow++;

        // 4. MENGAMBIL RIWAYAT TRANSAKSI & MENGHITUNG MATEMATIKA KARTU STOK
        const histories = await StockHistory.find({
            productId: product._id,
            status: { $in: ['approved', 'acknowledged'] } 
        }).sort('date createdAt');

        let saldoQty = 0;
        let saldoHarga = product.price || 0;
        let saldoTotal = 0;

        if (histories.length === 0) {
            // Jika tidak ada histori, cetak master stok sebagai saldo awal
            saldoQty = product.quantity || 0;
            saldoTotal = saldoQty * saldoHarga;
            worksheet.getRow(currentRow).values = [
                '', '', 
                '', '', '', '', 
                '', '', '', '', 
                saldoQty, saldoHarga, saldoTotal, 
                'Saldo Master (Belum ada pergerakan)'
            ];
            currentRow++;
        } else {
            for (const h of histories) {
                const tgl = new Date(h.date || h.createdAt).toISOString().split('T')[0];
                const qty = Number(h.quantity) || 0;
                const harga = Number(h.unitPrice) || product.price || 0;
                const total = qty * harga;
                const notes = h.reason || '';

                if (h.type === 'IN') {
                    saldoQty += qty;
                    saldoTotal += total;
                    saldoHarga = saldoQty > 0 ? (saldoTotal / saldoQty) : harga;

                    worksheet.getRow(currentRow).values = [
                        '', '',
                        tgl, qty, harga, total,   // IN Block
                        '', '', '', '',           // OUT Block (Kosong)
                        saldoQty, Math.round(saldoHarga), Math.round(saldoTotal), // SALDO Block
                        notes
                    ];
                } else if (h.type === 'OUT') {
                    saldoQty -= qty;
                    saldoTotal -= (qty * saldoHarga); // Kurangi nilai berdasarkan harga rata-rata berjalan
                    if (saldoQty <= 0) {
                        saldoQty = 0;
                        saldoTotal = 0;
                    } else {
                        saldoHarga = saldoTotal / saldoQty;
                    }

                    worksheet.getRow(currentRow).values = [
                        '', '',
                        '', '', '', '',           // IN Block (Kosong)
                        tgl, qty, harga, (qty * harga), // OUT Block
                        saldoQty, Math.round(saldoHarga), Math.round(saldoTotal), // SALDO Block
                        notes
                    ];
                }
                currentRow++;
            }
        }

        currentRow += 3; // Jarak/Spasi untuk produk selanjutnya
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Recap_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
});

module.exports = {
    getSummary,
    getStockMovement,
    getCategoryDetail,
    downloadExcel // JANGAN LUPA DIEKSPORT DI SINI!
};