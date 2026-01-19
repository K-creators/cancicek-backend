const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Rota Dosyalarını Çağır
const authRoute = require('./routes/auth');
const productRoute = require('./routes/products');
const orderRoute = require('./routes/orders'); // YENİ: Sipariş rotası

dotenv.config();
const app = express();

// --- 1. VERİTABANI BAĞLANTISI ---
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ Veritabanı bağlantısı BAŞARILI!"))
  .catch((err) => {
    console.log("❌ Veritabanı Hatası:", err);
  });

// --- 2. AYARLAR (Middleware) ---
app.use(cors()); // Mobil uygulamanın erişimine izin ver
app.use(express.json()); // Gelen verileri JSON olarak oku

// --- 3. ROTALAR (Kapılar) ---
app.use("/api/auth", authRoute);       // Giriş/Kayıt işlemleri
app.use("/api/products", productRoute); // Ürün işlemleri
app.use("/api/orders", orderRoute);    // YENİ: Sipariş işlemleri

// Test için Ana Sayfa Rotası
app.get('/', (req, res) => {
  res.send('Can Çiçek Sunucusu Yayında! 🌸');
});

// --- 4. SUNUCUYU BAŞLAT ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
  
  // Bilgisayarın IP adresini konsola yazdıralım (Kolaylık olsun)
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