const router = require("express").Router();
const Product = require("../models/Product");
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Cloudinary Ayarları
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Geçici dosya tutucu
const upload = multer({ dest: 'uploads/' });

// 1. YENİ ÜRÜN EKLE (ÇOKLU RESİM DESTEĞİ)
router.post("/", upload.array('images', 5), async (req, res) => {
  try {
    let imageUrls = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "cancicek_products",
          resource_type: "image"
        });
        imageUrls.push(result.secure_url);
        fs.unlinkSync(file.path); 
      }
    } else {
      imageUrls.push("https://via.placeholder.com/300");
    }

    const newProduct = new Product({
      title: req.body.title,
      productCode: req.body.productCode,
      description: req.body.desc, 
      desc: req.body.desc, 
      price: req.body.price,
      images: imageUrls, 
      category: req.body.category,
      deliveryScope: req.body.deliveryScope,
      sortOrder: req.body.sortOrder || 0,
      isActive: true,
      
      // --- YENİ EKLENEN KISIM ---
      isCorumOnly: req.body.isCorumOnly === 'true' || req.body.isCorumOnly === true
      // --------------------------
    });

    const savedProduct = await newProduct.save();
    res.status(200).json(savedProduct);

  } catch (err) {
    console.error("Ürün Ekleme Hatası:", err);
    res.status(500).json(err);
  }
});

// 2. ÜRÜN DÜZENLE (GÜNCELLEME)
router.put("/:id", upload.array('images', 10), async (req, res) => {
  try {
    let finalImages = [];

    // 1. Frontend'den gelen "Silinmemiş Eski Resimler"
    if (req.body.existingImages) {
      try {
        finalImages = JSON.parse(req.body.existingImages);
      } catch (e) {
        finalImages = [req.body.existingImages];
      }
    }

    // 2. Yeni Yüklenen Dosyalar
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "cancicek_products", resource_type: "image"
        });
        finalImages.push(result.secure_url); 
        fs.unlinkSync(file.path);
      }
    }

    const updateData = {
      title: req.body.title,
      productCode: req.body.productCode,
      desc: req.body.desc, 
      description: req.body.desc,
      price: req.body.price,
      images: finalImages, 
      category: req.body.category,
      deliveryScope: req.body.deliveryScope,
      sortOrder: req.body.sortOrder,
      isActive: req.body.isActive,

      // --- YENİ EKLENEN KISIM ---
      isCorumOnly: req.body.isCorumOnly === 'true' || req.body.isCorumOnly === true
      // --------------------------
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      { $set: updateData }, 
      { new: true }
    );
    res.status(200).json(updatedProduct);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// 3. ÜRÜN SİL
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json("Ürün silindi.");
  } catch (err) {
    res.status(500).json(err);
  }
});

// 4. ÜRÜNLERİ GETİR
router.get("/", async (req, res) => {
  try {
    let query = {};
    if (req.query.category) query.category = req.query.category;
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [{ title: searchRegex }, { productCode: searchRegex }];
    }
    
    if (req.query.isAdmin !== "true") query.isActive = true; 

    const products = await Product.find(query).sort({ sortOrder: -1, createdAt: -1 });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;