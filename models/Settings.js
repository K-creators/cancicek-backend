const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema({
  shippingFee: { type: Number, default: 50 }, // Standart Kargo Ücreti
  freeShippingThreshold: { type: Number, default: 1000 }, // Kaç TL üzeri bedava?
  isFreeShippingActive: { type: Boolean, default: true } // Kampanya aktif mi?
});

module.exports = mongoose.model("Settings", SettingsSchema);