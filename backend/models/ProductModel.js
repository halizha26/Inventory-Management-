const mongoose = require("mongoose");

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
            required: [true, "Please add an SKU"], // <--- Wajib diisi
            unique: true, // <--- SKU harus unik, tidak boleh sama
            trim: true,
        },
        category: {
            type: String,
            required: [true, "Please add a category"],
            trim: true,
        },
        price: {
            type: Number,
            required: [true, "Please add a price"],
            min: [0, "Price must be greater than or equal to 0"],
        },
        // 👇 TAMBAHAN KUNCI: Kolom Mata Uang 👇
        currency: {
            type: String,
            enum: ["IDR", "USD"],
            default: "IDR", // Default Rupiah agar data lama tetap aman
        },
        // -------------------------------------
        quantity: {
            type: Number,
            required: [true, "Please add a quantity"],
            min: [0, "Quantity must be greater than or equal to 0"],
            default: 0,
        },
        minStock: {
            type: Number,
            required: [true, "Please add a minimum stock level"],
            min: [0, "Min stock must be greater than or equal to 0"],
            default: 0,
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

// Optional: Composite unique index to ensure name is unique PER user
// productSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Product", productSchema);