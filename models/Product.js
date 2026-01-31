const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    title: { type: String, required: true },
    productCode: { type: String, required: true, unique: true },
    desc: { type: String, required: true }, // Hem desc hem description kullanıyorsan ikisi de kalsın
    description: { type: String }, 
    images: { type: Array },
    price: { type: Number, required: true },
    category: { type: String, default: "Genel" },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  
    // KRİTİK KURAL: Satış Kapsamı
    // 'corum_only' (Canlı çiçekler) veya 'all_turkey' (Oyuncak/Hediye)
    deliveryScope: { 
        type: String, 
        enum: ['corum_only', 'all_turkey'], 
        default: 'all_turkey', // Varsayılan değer ekledim
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