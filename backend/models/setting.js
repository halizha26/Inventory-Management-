const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  settingId: { type: String, required: true, default: 'GLOBAL_CONFIG', unique: true },
  usdRate: { type: Number, required: true, default: 15000 },
  lastSyncDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);