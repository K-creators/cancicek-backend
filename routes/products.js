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
// 'images' adında en fazla 5 resim kabul et
router.post("/", upload.array('images', 5), async (req, res) => {
  try {
    let imageUrls = [];

    // Eğer resimler varsa hepsini tek tek Cloudinary'ye yükle
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "cancicek_products",
          resource_type: "image"
        });
        imageUrls.push(result.secure_url);
        fs.unlinkSync(file.path); // Yükledikten sonra sil
      }
    } else {
      // Resim yoksa varsayılan bir tane koy
      imageUrls.push("https://via.placeholder.com/300");
    }

    const newProduct = new Product({
      title: req.body.title,
      productCode: req.body.productCode,
      description: req.body.desc, // Frontend 'desc' gönderiyor
      price: req.body.price,
      images: imageUrls, // Artık bir dizi (liste) kaydediyoruz
      category: req.body.category,
      deliveryScope: req.body.deliveryScope,
      sortOrder: req.body.sortOrder || 0,
      isActive: true
    });

    const savedProduct = await newProduct.save();
    res.status(200).json(savedProduct);

  } catch (err) {
    console.error("Ürün Ekleme Hatası:", err);
    res.status(500).json(err);
  }
});

// 2. ÜRÜN DÜZENLE (GÜNCELLEME)
router.put("/:id", upload.array('images', 5), async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      productCode: req.body.productCode,
      description: req.body.desc,
      price: req.body.price,
      category: req.body.category,
      deliveryScope: req.body.deliveryScope,
      sortOrder: req.body.sortOrder,
      isActive: req.body.isActive
    };

    // Yeni resimler geldiyse eskilerin üzerine yaz (Veya ekle, şu an üzerine yazıyoruz)
    if (req.files && req.files.length > 0) {
      let newUrls = [];
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "cancicek_products", resource_type: "image"
        });
        newUrls.push(result.secure_url);
        fs.unlinkSync(file.path);
      }
      updateData.images = newUrls;
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