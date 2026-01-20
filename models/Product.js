const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  productCode: { type: String, required: true, unique: true }, // YENİ: Ürün Kodu
  desc: { type: String, required: true }, // (Frontend'den 'desc' geliyor, backend route'da description'a çeviriyoruz dikkat)
  images: { type: Array },
  price: { type: Number, required: true },
  category: { type: String },
  deliveryScope: { type: String },
  sortOrder: { type: Number, default: 0 },
  
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