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

// ÜRÜN EKLE (RESİMLİ)
router.post("/", upload.single('image'), async (req, res) => {
  try {
    let imageUrl = "";

    // Eğer resim seçildiyse yükle
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "cancicek_products",
        resource_type: "image"
      });
      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path); // Geçici dosyayı sil
    } else {
        // Resim yoksa varsayılan veya boş gönder
        imageUrl = req.body.imageUrl || "https://via.placeholder.com/150";
    }

    const newProduct = new Product({
      title: req.body.title,
      productCode: req.body.productCode, // YENİ
      description: req.body.desc, // Modelde 'desc' diye bir alan yoksa burayı düzeltmiştim, dikkat et.
      // Eğer model dosyanı benim 2. adımdaki gibi yaptıysan şuna dikkat:
      // Modelde: desc dedik. Route'da da desc kaydedelim.
      desc: req.body.desc, 
      
      price: req.body.price,
      images: [imageUrl],
      category: req.body.category,
      deliveryScope: req.body.deliveryScope,
      sortOrder: req.body.sortOrder || 0 // YENİ
    });

    const savedProduct = await newProduct.save();
    res.status(200).json(savedProduct);

  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// TÜM ÜRÜNLERİ GETİR
router.get("/", async (req, res) => {
  try {
    let products;
    if (req.query.category) {
      // Önce sortOrder'a göre (büyükten küçüğe), sonra tarihe göre sırala
      products = await Product.find({ category: req.query.category })
                              .sort({ sortOrder: -1, createdAt: -1 }); 
    } else {
      products = await Product.find().sort({ sortOrder: -1, createdAt: -1 });
    }
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});
module.exports = router;