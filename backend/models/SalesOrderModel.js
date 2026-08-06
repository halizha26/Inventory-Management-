const mongoose = require('mongoose');

const salesOrderSchema = new mongoose.Schema({
    soNumber: { 
        type: String, 
        required: true, 
        unique: true // Nomor SO tidak boleh kembar
    },
    items: [{
        productName: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, default: 'pcs' }
    }],
    status: { 
        type: String, 
        default: 'Pending' 
    }
}, { timestamps: true });

// Kode sakti anti-crash seperti sebelumnya
module.exports = mongoose.models.SalesOrder || mongoose.model('SalesOrder', salesOrderSchema);