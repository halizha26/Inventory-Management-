const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema({
  rate: {
    type: Number,
    required: true,
    default: 15500
  }
}, { timestamps: true }); 

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);