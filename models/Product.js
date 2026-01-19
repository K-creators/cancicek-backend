const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  images: [{ type: String }], // Resim URL'leri
  category: { type: String, required: true }, // Örn: Buket, Oyuncak
  stock: { type: Number, default: 0 },
  
  // KRİTİK KURAL: Satış Kapsamı
  // 'corum_only' (Canlı çiçekler) veya 'all_turkey' (Oyuncak/Hediye)
  deliveryScope: { 
    type: String, 
    enum: ['corum_only', 'all_turkey'], 
    required: true 
  },

  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: String,
    rating: Number,
    date: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);