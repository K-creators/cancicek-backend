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

// 1. YENİ ÜRÜN EKLE (POST /api/products)
router.post("/", upload.single('image'), async (req, res) => {
  try {
    let imageUrl = "";

    // Resim varsa Cloudinary'ye yükle
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "cancicek_products",
        resource_type: "image"
      });
      imageUrl = result.secure_url;
      // Geçici dosyayı sil
      fs.unlinkSync(req.file.path);
    } else {
      imageUrl = "https://via.placeholder.com/150";
    }

    const newProduct = new Product({
      title: req.body.title,
      productCode: req.body.productCode, // YENİ EKLENEN
      description: req.body.desc,        // DİKKAT: Frontend 'desc' atıyor, Model 'desc' veya 'description' olabilir.
      // Eğer model dosyan 'desc' ise burayı 'desc: req.body.desc' yap.
      // Eğer model dosyan 'description' ise burayı 'description: req.body.desc' yap.
      // Biz garanti olsun diye ikisini de eşitliyoruz (Model hangisini kabul ederse):
      desc: req.body.desc, 
      
      price: req.body.price,
      images: [imageUrl],
      category: req.body.category,
      deliveryScope: req.body.deliveryScope,
      sortOrder: req.body.sortOrder || 0, // YENİ EKLENEN
      isActive: true
    });

    const savedProduct = await newProduct.save();
    res.status(200).json(savedProduct);

  } catch (err) {
    console.error("Ürün Ekleme Hatası:", err);
    res.status(500).json(err);
  }
});

// 2. ÜRÜN DÜZENLE (PUT /api/products/:id)
router.put("/:id", upload.single('image'), async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      productCode: req.body.productCode,
      desc: req.body.desc, // Model uyumu için
      description: req.body.desc, // Model uyumu için
      price: req.body.price,
      category: req.body.category,
      deliveryScope: req.body.deliveryScope,
      sortOrder: req.body.sortOrder,
      isActive: req.body.isActive
    };

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

// 3. ÜRÜN SİL (DELETE /api/products/:id)
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json("Ürün silindi.");
  } catch (err) {
    res.status(500).json(err);
  }
});

// 4. ÜRÜNLERİ GETİR (ARAMA FİLTRESİ EKLENDİ)
router.get("/", async (req, res) => {
  try {
    let query = {};
    
    // 1. Kategori Filtresi
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // 2. ARAMA FİLTRESİ (YENİ!)
    // Hem başlıkta (title) hem de ürün kodunda (productCode) arar.
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i'); // 'i' büyük/küçük harf duyarsız yapar
      query.$or = [
        { title: searchRegex },
        { productCode: searchRegex }
      ];
    }
    
    // 3. Admin Filtresi
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