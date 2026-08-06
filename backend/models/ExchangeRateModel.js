const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema({
    currencyPair: {
        type: String,
        required: true,
        default: 'USD_TO_IDR'
    },
    rate: {
        type: Number,
        required: true,
        default: 15500
    },
    source: {
        type: String,
        default: 'Manual_Admin'
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true }); 

module.exports = mongoose.models.ExchangeRate || mongoose.model('ExchangeRate', exchangeRateSchema);