const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // Kategori Adı
    icon: { type: String, default: "local_florist" },     // İkon ismi
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", CategorySchema);