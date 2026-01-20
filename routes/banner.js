// backend/routes/banner.js
const router = require('express').Router();
const Banner = require('../models/Banner');

// 1. TÜM BANNERLARI GETİR
router.get('/', async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 }); // En yeniler önce
    res.status(200).json(banners);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. YENİ BANNER EKLE (Admin İçin)
router.post('/', async (req, res) => {
  const newBanner = new Banner(req.body);
  try {
    const savedBanner = await newBanner.save();
    res.status(200).json(savedBanner);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. BANNER SİL (Admin İçin)
router.delete('/:id', async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.status(200).json("Banner silindi.");
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;