const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    
    // --- BURASI GÜNCELLENDİ: ARTIK SADECE STRİNG DEĞİL, OBJE TUTACAK ---
    address: {
      title: String,
      address: String,
      city: String,
      receiverName: { type: String, default: "" }, // Yeni eklenen
      phone: { type: String, default: "" }         // Yeni eklenen
    },
    // Eğer Frontend sadece düz yazı (String) gönderiyorsa hata almamak için 
    // yukarıdaki yerine şu da kullanılabilir: { type: mongoose.Schema.Types.Mixed } 
    // ama doğrusu üstteki gibidir.
    
    paymentMethod: { type: String, required: true },
    totalPrice: { type: Number, required: true },
    status: { type: String, default: "Hazırlanıyor" },
    
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }, // O anki fiyatı kaydetmek önemli
        note: { type: String, default: "" }
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);