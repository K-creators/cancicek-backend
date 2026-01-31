const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema(
  {
    name: { type: String, default: "Can Çiçekçilik" },
    slogan: { type: String, default: "En taze çiçekler..." },
    logo: { type: String, default: "" }, // Cloudinary URL
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    instagram: { type: String, default: "" },
  },
  { timestamps: true }
);

// Tek bir kayıt olacağı için Singleton mantığıyla çalışacak
module.exports = mongoose.model("Company", CompanySchema);