const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    
    // --- BURAYI DEĞİŞTİRDİK: ESNEK OBJE YAPTIK ---
    // 'Object' diyerek Mongoose'a "İçeriğine karışma, ne gelirse kaydet" diyoruz.
    // Böylece ilçe, mahalle, telefon hatasız kaydedilir.
    address: { type: Object, required: true },
    // ---------------------------------------------
    
    paymentMethod: { type: String, required: true },
    totalPrice: { type: Number, required: true },
    status: { type: String, default: "Hazırlanıyor" },
    
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        note: { type: String, default: "" }
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);