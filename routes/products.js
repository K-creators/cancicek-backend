const router = require('express').Router();
const Product = require('../models/Product');

// 1. ÜRÜN EKLEME (Sadece Admin - Şimdilik herkese açık yapıyoruz test için)
router.post('/', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(200).json(savedProduct);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. TÜM ÜRÜNLERİ GETİR
router.get('/', async (req, res) => {
  try {
    // Kategoriye göre filtreleme (Opsiyonel: ?category=Buket)
    const qCategory = req.query.category;
    let products;

    if (qCategory) {
      products = await Product.find({
        category: { $in: [qCategory] },
      });
    } else {
      products = await Product.find();
    }

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. TEK BİR ÜRÜNÜ GETİR (Detay Sayfası İçin)
router.get('/find/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;