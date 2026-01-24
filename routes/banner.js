const router = require("express").Router();
const Banner = require("../models/Banner");
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ dest: 'uploads/' });

// 1. BANNER EKLE
router.post("/", upload.single('image'), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "cancicek_banners", resource_type: "image"
    });
    fs.unlinkSync(req.file.path);

    const newBanner = new Banner({ imageUrl: result.secure_url, isActive: true });
    const savedBanner = await newBanner.save();
    res.status(200).json(savedBanner);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. TÜM BANNERLARI GETİR
router.get("/", async (req, res) => {
  try {
    // En son eklenen en başta görünsün
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.status(200).json(banners);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. SİLME
router.delete("/:id", async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.status(200).json("Banner silindi.");
  } catch (err) {
    res.status(500).json(err);
  }
});

// 4. DURUM GÜNCELLEME (AKTİF/PASİF)
router.put("/:id", async (req, res) => {
  try {
    const updatedBanner = await Banner.findByIdAndUpdate(
      req.params.id,
      { $set: req.body }, 
      { new: true }
    );
    res.status(200).json(updatedBanner);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;