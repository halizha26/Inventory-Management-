const mongoose = require("mongoose");

const stockHistorySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: ["IN", "OUT"],
        },
        quantity: {
            type: Number,
            required: true,
        },
        
        // 👇 Kolom Satuan (Unit) 👇
        unit: {
            type: String,
            enum: ["Pcs", "Paket"],
            default: "Pcs", 
        },

        // --- Kolom Harga & Mata Uang ---
        unitPrice: {
            type: Number,
            default: 0, 
        },
        totalPrice: {
            type: Number,
            default: 0,
        },
        currency: {
            type: String,
            enum: ["IDR", "USD"], // Ditambahkan perlindungan enum agar data konsisten
            default: 'IDR', 
        },
        
        // 👇 TAMBAHAN BARU: Snapshot Kurs & Hasil Konversi 👇
        exchangeRateSnapshot: {
            type: Number,
            required: false, // Tidak required agar data lama di database tidak error
            default: null, 
        },
        convertedTotalCost: {
            type: Number,
            required: false,
            default: null,
        },
        // -----------------------------
        
        reason: {
            type: String, 
            required: false,
        },
        
        // 👇 Menyimpan ID Kloter (Batch) yang dipilih Manajemen 👇
        batchId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false 
        },

        date: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["pending", "validated", "approved", "rejected"],
            default: "pending",
        },
        validatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        rejectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        rejectNote: {
            type: String,
        },
        salesOrderNumber: {
            type: String,
            required: false,
            trim: true,
        },
        inputBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("StockHistory", stockHistorySchema);