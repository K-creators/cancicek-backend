// backend/routes/banner.js
const router = require('express').Router();
const Banner = require('../models/Banner');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// --- CLOUDINARY AYARLARI ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Dosyayı geçici olarak tutmak için Multer ayarı
const upload = multer({ dest: 'uploads/' });

// 1. TÜM BANNERLARI GETİR
router.get('/', async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.status(200).json(banners);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. YENİ BANNER YÜKLE (RESİMLİ)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    // 1. Resmi Cloudinary'ye yükle
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "cancicek_banners", // Cloudinary'de klasör adı
      resource_type: "image"
    });

    // 2. Yüklenen resmin linkini veritabanına kaydet
    const newBanner = new Banner({
      imageUrl: result.secure_url,
      title: req.body.title || "Yeni Banner"
    });

    const savedBanner = await newBanner.save();

    // 3. Geçici dosyayı sunucudan sil (Çöp birikmesin)
    fs.unlinkSync(req.file.path);

    res.status(200).json(savedBanner);

  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// 3. BANNER SİL
router.delete('/:id', async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.status(200).json("Banner silindi.");
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;