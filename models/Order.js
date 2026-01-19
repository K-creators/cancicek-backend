const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  products: [
    {
      title: String,
      quantity: { type: Number, default: 1 },
      price: Number
    }
  ],
  totalAmount: { type: Number, required: true },
  address: { type: String, required: true },
  status: { type: String, default: "Hazırlanıyor" },
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);