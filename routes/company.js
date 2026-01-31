const router = require("express").Router();
const Company = require("../models/Company");
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Cloudinary Ayarları (Mevcut ayarlarınla aynı)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ dest: 'uploads/' });

// 1. BİLGİLERİ GETİR
router.get("/", async (req, res) => {
  try {
    // Veritabanındaki ilk ve tek kaydı bul
    let company = await Company.findOne();
    // Eğer hiç kayıt yoksa boş bir tane oluştur
    if (!company) {
      company = new Company();
      await company.save();
    }
    res.status(200).json(company);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. BİLGİLERİ GÜNCELLE (RESİM YÜKLEMELİ)
router.put("/", upload.single('logo'), async (req, res) => {
  try {
    let updateData = {
      name: req.body.name,
      slogan: req.body.slogan,
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address,
      instagram: req.body.instagram
    };

    // Eğer yeni logo yüklendiyse
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "company_assets",
        use_filename: true
      });
      updateData.logo = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    // İlk kaydı bul ve güncelle (upsert: true -> yoksa oluştur demek)
    const updatedCompany = await Company.findOneAndUpdate(
      {}, 
      { $set: updateData }, 
      { new: true, upsert: true }
    );

    res.status(200).json(updatedCompany);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

module.exports = router;