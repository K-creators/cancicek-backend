const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Rota Dosyalarını Çağır
const authRoute = require('./routes/auth');
const productRoute = require('./routes/products');
const orderRoute = require('./routes/orders'); // Sipariş rotası
const instagramRoute = require('./routes/instagram');
const bannerRoute = require('./routes/banner');

dotenv.config();
const app = express();

// --- 1. VERİTABANI BAĞLANTISI ---
// (MongoDB bağlantı kodun aynen korundu)
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ Veritabanı bağlantısı BAŞARILI!"))
  .catch((err) => {
    console.log("❌ Veritabanı Hatası:", err);
  });

// --- 2. AYARLAR (Middleware) ---
app.use(cors()); // Mobil uygulamanın erişimine izin ver (Önemli!)
app.use(express.json()); // Gelen verileri JSON olarak oku
app.use("/api/instagram", instagramRoute);

// --- 3. ROTALAR (Kapılar) ---
// Giriş sistemi burada devreye giriyor:
app.use("/api/auth", authRoute);       
// Ürünleri çekme sistemi:
app.use("/api/products", productRoute); 
// Sipariş verme sistemi:
app.use("/api/orders", orderRoute);  
app.use("/api/banners", bannerRoute);  

// Test için Ana Sayfa Rotası
app.get('/', (req, res) => {
  res.send('Can Çiçek Sunucusu Yayında! 🌸');
});

// --- 4. HATA YAKALAMA (YENİ EKLENDİ) ---
// Eğer kodun bir yerinde hata olursa sunucu çökmesin, bu mesajı versin.
app.use((err, req, res, next) => {
  console.error("🔥 Sunucu Hatası:", err.stack);
  res.status(500).json({ 
    success: false, 
    message: "Sunucuda beklenmedik bir hata oluştu.",
    error: err.message 
  });
});

// --- 5. SUNUCUYU BAŞLAT ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
  
  // Bilgisayarın IP adresini konsola yazdıralım
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`📡 Yerel IP Adresin: http://${net.address}:${PORT}`);
      }
    }
  }
});