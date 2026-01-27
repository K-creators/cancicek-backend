const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: "" }, 
    
    // --- YENİ: KULLANICI ADI DEĞİŞTİRME TARİHİ ---
    lastUsernameChange: { type: Date, default: null },
    // ----------------------------------------------

    isAdmin: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date },
    favorites: { type: Array, default: [] },
    
    // --- GÜNCELLENMİŞ ADRES YAPISI ---
    addresses: [
      {
        title: String,       // Ev, İş vs.
        receiverName: String, // Alıcı Adı Soyadı (YENİ)
        phone: String,        // İletişim Numarası (YENİ)
        address: String,      // Açık adres
        city: String,
        zip: String,
      },
    ],
  },
  { timestamps: true }
);

module.

module.exports = mongoose.model('User', UserSchema);