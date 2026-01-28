const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    
    // --- DEĞİŞİKLİK BURADA: MIXED TİPİ ---
    // Bu, "içine ne koyarsan koy, soru sorma, kaydet" demektir.
    // String, Object, Array... Her şeyi kabul eder.
    address: { type: mongoose.Schema.Types.Mixed, required: true },
    // -------------------------------------
    
    paymentMethod: { type: String, required: true },
    totalPrice: { type: Number, required: true },
    status: { type: String, default: "Hazırlanıyor" },
    
    items: [
      {
        // Eğer ürün ID'siyle ilgili hata alıyorsan burayı da String yapabiliriz
        // Ama şimdilik ObjectId kalsın, sorun adres kısmında.
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1 },
        price: { type: Number, default: 0 },
        note: { type: String, default: "" }
      },
    ],
  },
  { timestamps: true, strict: false } // strict: false -> Şemada olmayan alan gelse bile hata verme!
);

module.exports = mongoose.model("Order", OrderSchema);