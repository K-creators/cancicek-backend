const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    
    // Adres her türlü veriyi kabul etsin (Map veya String sorunu olmasın)
    address: { type: mongoose.Schema.Types.Mixed, required: true },
    
    paymentMethod: { type: String, required: true },
    totalPrice: { type: Number, required: true },
    
    // TEK VE DOĞRU STATUS TANIMI
    status: { 
        type: String, 
        default: "pending", 
        // 'cancel_rejected' durumunu buraya ekledik:
        enum: ["pending", "shipped", "delivered", "cancelled", "cancel_requested", "cancel_rejected"],
    },
    
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1 },
        price: { type: Number, default: 0 },
        note: { type: String, default: "" }
      },
    ],
  },
  { timestamps: true, strict: false }
);

module.exports = mongoose.model("Order", OrderSchema);