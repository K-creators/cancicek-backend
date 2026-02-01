const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path'); 
const fs = require('fs');

// Rota Dosyalarını Çağır
const authRoute = require('./routes/auth');
const productRoute = require('./routes/products');
const orderRoute = require('./routes/orders');
const instagramRoute = require('./routes/instagram');
const bannerRoute = require('./routes/banner');
const categoryRoute = require("./routes/category");
const notificationRoutes = require('./routes/notifications');
const settingsRoute = require("./routes/settings");
const companyRoute = require("./routes/company");

// --- 1. DEĞİŞİKLİK: Payment dosyasını buraya ekledik ---
const paymentRoute = require("./routes/payment"); 
// ------------------------------------------------------

dotenv.config();
const app = express();

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
  console.log("📂 'uploads' klasörü oluşturuldu.");
}

// --- VERİTABANI BAĞLANTISI ---
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ Veritabanı bağlantısı BAŞARILI!"))
  .catch((err) => {
    console.log("❌ Veritabanı Hatası:", err);
  });

// --- AYARLAR ---
app.use(cors()); 
app.use(express.json()); 
app.use("/api/settings", settingsRoute);

// --- RESİMLERİ PAYLAŞIMA AÇ ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 

app.use("/api/instagram", instagramRoute);
app.use("/api/categories", categoryRoute);

// --- 3. ROTALAR (Kapılar) ---
app.use("/api/auth", authRoute);       
app.use("/api/products", productRoute); 
app.use("/api/orders", orderRoute);  
app.use("/api/banners", bannerRoute);  
app.use('/api/notifications', notificationRoutes);
app.use("/api/company", companyRoute);

// --- 2. DEĞİŞİKLİK: Payment rotasını aktif ettik ---
app.use("/api/payment", paymentRoute); 
// ---------------------------------------------------

// Test için Ana Sayfa Rotası
app.get('/', (req, res) => {
  res.send('Can Çiçek Sunucusu Yayında! 🌸');
});

// --- HATA YAKALAMA ---
app.use((err, req, res, next) => {
  console.error("🔥 Sunucu Hatası:", err.stack);
  res.status(500).json({ 
    success: false, 
    message: "Sunucuda beklenmedik bir hata oluştu.",
    error: err.message 
  });
});

// --- SUNUCUYU BAŞLAT ---
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