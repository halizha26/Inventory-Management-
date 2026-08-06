const mongoose = require("mongoose");

// 👇 SKEMA UNTUK FIFO / IDENTIFIKASI SPESIFIK 👇
const batchSchema = new mongoose.Schema({
    qty: {
        type: Number,
        required: true,
        min: [0, "Batch quantity cannot be negative"],
    },
    dateIn: {
        type: Date,
        default: Date.now,
    },
    // 👇 Simpan harga per kloter untuk kebutuhan Finance 👇
    pricePerUnit: {
        type: Number,
        default: 0
    }
});

const productSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: [true, "Please add a product name"],
            trim: true,
        },
        sku: {
            type: String,
            required: [true, "Please add an SKU"],
            unique: true,
            trim: true,
        },
        category: {
            type: String,
            required: [true, "Please add a category"],
            trim: true,
        },
        // 👇 TAMBAHAN BARU: subCategory wajib ada di Model agar terbaca oleh database 👇
        subCategory: {
            type: String,
            required: false,
            trim: true,
        },
        price: {
            type: Number,
            required: [true, "Please add a price"],
            min: [0, "Price must be greater than or equal to 0"],
        },
        currency: {
            type: String,
            enum: ["IDR", "USD"],
            default: "IDR",
        },
        unit: {
            type: String,
            enum: ["Pcs", "Paket"],
            default: "Pcs",
        },
        quantity: {
            type: Number,
            required: [true, "Please add a quantity"],
            min: [0, "Quantity must be greater than or equal to 0"],
            default: 0,
        },
        batches: [batchSchema],
        minStock: {
            type: Number,
            required: [true, "Please add a minimum stock level"],
            min: [25, "Minimum stock alert level cannot be less than 25"],
            default: 25,
        },
        description: {
            type: String,
            required: false,
        },
        supplier: {
            type: String,
            required: false,
            trim: true,
        },
        status : {
            type: String,
            enum: ["pending", "validated", "approved", "rejected"],
            default: "pending",
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Product", productSchema);