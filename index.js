const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path'); // --- 1. EKLENDİ: Dosya yolu işlemleri için ---

// Rota Dosyalarını Çağır
const authRoute = require('./routes/auth');
const productRoute = require('./routes/products');
const orderRoute = require('./routes/orders'); // Sipariş rotası
const instagramRoute = require('./routes/instagram');
const bannerRoute = require('./routes/banner');
const categoryRoute = require("./routes/category");
const notificationRoutes = require('./routes/notifications');

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

// --- 2.1 RESİMLERİ PAYLAŞIMA AÇ (ÇOK ÖNEMLİ) ---
// Bu satır sayesinde 'uploads' klasöründeki dosyalar internetten erişilebilir olur.
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 
// ------------------------------------------------

app.use("/api/instagram", instagramRoute);
app.use("/api/categories", categoryRoute);

// --- 3. ROTALAR (Kapılar) ---
app.use("/api/auth", authRoute);       
app.use("/api/products", productRoute); 
app.use("/api/orders", orderRoute);  
app.use("/api/banners", bannerRoute);  
app.use('/api/notifications', notificationRoutes);

// Test için Ana Sayfa Rotası
app.get('/', (req, res) => {
  res.send('Can Çiçek Sunucusu Yayında! 🌸');
});

// --- 4. HATA YAKALAMA ---
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