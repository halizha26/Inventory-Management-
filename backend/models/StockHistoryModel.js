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
        // --- TAMBAHAN: Kolom Harga ---
        unitPrice: {
            type: Number,
            default: 0, // Default 0 supaya transaksi Stock Out (yang gak ada harga) gak error
        },
        totalPrice: {
            type: Number,
            default: 0,
        },
        // -----------------------------
        reason: {
            type: String, // e.g., "Purchase", "Sale", "Damage", "Return"
            required: false,
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