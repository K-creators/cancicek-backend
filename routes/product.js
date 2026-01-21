// backend/routes/product.js
const router = require("express").Router();
const Product = require("../models/Product");
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Cloudinary Ayarları (Banner ile aynı)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ dest: 'uploads/' });

// 1. ÜRÜN DÜZENLEME (GÜNCELLEME)
router.put("/:id", upload.single('image'), async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      productCode: req.body.productCode,
      description: req.body.desc,
      price: req.body.price,
      category: req.body.category,
      deliveryScope: req.body.deliveryScope,
      sortOrder: req.body.sortOrder,
      isActive: req.body.isActive // Pasif/Aktif güncellem
    };

    // Eğer yeni resim varsa güncelle, yoksa eskisini elleme
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "cancicek_products", resource_type: "image"
      });
      updateData.images = [result.secure_url];
      fs.unlinkSync(req.file.path);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      { $set: updateData }, 
      { new: true }
    );
    res.status(200).json(updatedProduct);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. ÜRÜN SİLME
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json("Ürün silindi.");
  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. GET (Sadece Aktifleri veya Hepsini Getir)
// Admin panelinde hepsi, Müşteri ekranında sadece aktifler görünmeli
router.get("/", async (req, res) => {
  try {
    let query = {};
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Eğer "?admin=true" gönderilmezse sadece aktifleri göster
    if (req.query.isAdmin !== "true") {
      query.isActive = true; 
    }

    const products = await Product.find(query).sort({ sortOrder: -1, createdAt: -1 });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;