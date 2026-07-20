const asyncHandler = require("../utils/AsyncHandler");
const Product = require("../models/ProductModel");
const StockHistory = require("../models/StockHistoryModel"); // 👈 Wajib dipanggil untuk melacak histori
const PDFDocument = require("pdfkit");
const exceljs = require("exceljs"); // 👈 Library baru yang mendukung Merge Cells & Styling

// @desc    Export Products to PDF
// @route   GET /api/export/products/pdf
// @access  Private
const exportProductsPDF = asyncHandler(async (req, res) => {
    // Asumsi: Laporan ini untuk melihat semua data kantor, kita hapus filter { user: req.user.id }
    const products = await Product.find({}).sort("-createdAt");

    const doc = new PDFDocument({ margin: 50 });
    
    const filename = `Inventory-Report-${Date.now()}.pdf`;
    res.setHeader("Content-disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-type", "application/pdf");

    doc.pipe(res);

    // Header PDF
    doc.fontSize(24).font('Helvetica-Bold').text("NuPMK Consulting", { align: "center" });
    doc.fontSize(12).font('Helvetica').fillColor('gray').text("Inventory Master Recap", { align: "center" });
    doc.moveDown(2);

    // List Produk
    products.forEach((product, index) => {
        doc.fontSize(12).font('Helvetica-Bold').fillColor('black')
           .text(`${index + 1}. ${product.name} (SKU: ${product.sku || '-'})`);
        
        doc.fontSize(10).font('Helvetica').fillColor('#333333')
           .text(`Kategori: ${product.category}  |  Sisa Stok: ${product.quantity} ${product.unit || 'Pcs'}`);
        
        doc.text(`Harga Satuan: Rp ${product.price?.toLocaleString('id-ID')}  |  Total Nilai: Rp ${(product.price * product.quantity)?.toLocaleString('id-ID')}`);
        
        doc.moveDown(1);
        
        // Garis Pemisah
        doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);
    });

    doc.end();
});

// @desc    Export Products to Excel (Format Kartu Stok Lengkap)
// @route   GET /api/export/products/excel
// @access  Private
const exportProductsExcel = asyncHandler(async (req, res) => {
    const products = await Product.find({}).sort("name");
    
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet("Inventory Recap");

    // 1. SETTING LEBAR KOLOM PRESISI
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
        // 2. HEADER IDENTITAS PERUSAHAAN (NuPMK)
        worksheet.getCell(`C${currentRow + 1}`).value = 'NuPMK Consulting';
        worksheet.getCell(`C${currentRow + 1}`).font = { bold: true, size: 12 };
        
        worksheet.getCell(`C${currentRow + 2}`).value = 'Inventory recap';
        worksheet.getCell(`C${currentRow + 2}`).font = { bold: true, size: 12 };
        
        worksheet.getCell(`C${currentRow + 3}`).value = product.name;
        worksheet.getCell(`C${currentRow + 3}`).font = { bold: true, size: 12, italic: true };

        currentRow += 5;

        // 3. HEADER KELOMPOK TABEL (Merge Cells untuk IN, OUT, SALDO)
        worksheet.mergeCells(`C${currentRow}:F${currentRow}`);
        const inHeader = worksheet.getCell(`C${currentRow}`);
        inHeader.value = 'IN';
        inHeader.alignment = { horizontal: 'center', vertical: 'middle' };
        inHeader.font = { bold: true };

        worksheet.mergeCells(`G${currentRow}:J${currentRow}`);
        const outHeader = worksheet.getCell(`G${currentRow}`);
        outHeader.value = 'OUT';
        outHeader.alignment = { horizontal: 'center', vertical: 'middle' };
        outHeader.font = { bold: true };

        worksheet.mergeCells(`K${currentRow}:M${currentRow}`);
        const saldoHeader = worksheet.getCell(`K${currentRow}`);
        saldoHeader.value = 'SALDO';
        saldoHeader.alignment = { horizontal: 'center', vertical: 'middle' };
        saldoHeader.font = { bold: true };

        const notesHeader = worksheet.getCell(`N${currentRow}`);
        notesHeader.value = 'Notes';
        notesHeader.font = { bold: true };

        currentRow++;

        // 4. SUB-HEADER KARTU STOK
        const subHeaderRow = worksheet.getRow(currentRow);
        subHeaderRow.values = [
            '', '', 
            'TGL', 'Qty', 'Harga', 'Total', 
            'TGL', 'Qty', 'Harga', 'Total', 
            'Qty', 'Harga', 'Total', 
            ''
        ];
        subHeaderRow.font = { bold: true };
        
        currentRow++;

        // 5. KALKULASI HISTORI TRANSAKSI
        const histories = await StockHistory.find({
            productId: product._id,
            status: { $in: ['approved', 'acknowledged'] } 
        }).sort('date createdAt');

        let saldoQty = 0;
        let saldoHarga = product.price || 0;
        let saldoTotal = 0;

        if (histories.length === 0) {
            saldoQty = product.quantity || 0;
            saldoTotal = saldoQty * saldoHarga;
            worksheet.getRow(currentRow).values = [
                '', '', 
                '', '', '', '', 
                '', '', '', '', 
                saldoQty, saldoHarga, saldoTotal, 
                'Stok Awal (Belum ada pergerakan)'
            ];
            currentRow++;
        } else {
            for (const h of histories) {
                const tglObj = new Date(h.date || h.createdAt);
                // Format tanggal YYYY-MM-DD
                const tgl = `${tglObj.getFullYear()}-${String(tglObj.getMonth() + 1).padStart(2, '0')}-${String(tglObj.getDate()).padStart(2, '0')}`;
                
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
                        tgl, qty, harga, total, 
                        '', '', '', '',         
                        saldoQty, Math.round(saldoHarga), Math.round(saldoTotal), 
                        notes
                    ];
                } else if (h.type === 'OUT') {
                    saldoQty -= qty;
                    saldoTotal -= (qty * saldoHarga); // Costing menggunakan rata-rata berjalan (Average Cost)
                    
                    if (saldoQty <= 0) {
                        saldoQty = 0;
                        saldoTotal = 0;
                    } else {
                        saldoHarga = saldoTotal / saldoQty;
                    }

                    worksheet.getRow(currentRow).values = [
                        '', '',
                        '', '', '', '',         
                        tgl, qty, harga, (qty * harga), 
                        saldoQty, Math.round(saldoHarga), Math.round(saldoTotal), 
                        notes
                    ];
                }
                currentRow++;
            }
        }

        currentRow += 4; // Spasi antar produk
    }

    const filename = `Recap_Inventory_${Date.now()}.xlsx`;
    res.setHeader("Content-disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    await workbook.xlsx.write(res);
    res.end();
});

module.exports = {
    exportProductsPDF,
    exportProductsExcel
};