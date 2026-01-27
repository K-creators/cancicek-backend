const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true }, // Doğrulama için gerekli
  password: { type: String, required: true },
  profileImage: { type: String, default: "" },
  isAdmin: { type: Boolean, default: false }, // Admin yetkisi
  addresses: [{ 
    title: String, 
    city: String, 
    district: String, 
    fullAddress: String 
  }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  isVerified: { type: Boolean, default: false }, // SMS/Email onayı
  pushToken: { type: String }, // Bildirim göndermek için
  otp: { type: String }, // Telefonyay gönderilen kod
  otpExpires: { type: Date }, // Kodun geçerlilik süresi (örn: 3 dk)
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);