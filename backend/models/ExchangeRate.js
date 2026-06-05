// File: backend/models/ExchangeRate.js
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
    // Misal default awal Rp 15.500
    default: 17367
  },
  source: {
    type: String,
    enum: ['API_Otomatis', 'Manual_Admin'],
    default: 'API_Otomatis'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    // Opsional: Untuk mencatat Admin siapa yang terakhir mengubah kurs (RBAC)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' 
  }
});

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);