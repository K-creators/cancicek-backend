// backend/models/Banner.js
const mongoose = require("mongoose");

const BannerSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    title: { type: String }, // İstersen banner'a başlık da eklersin
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banner", BannerSchema);