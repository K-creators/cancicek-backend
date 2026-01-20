const router = require("express").Router();
const Category = require("../models/Category");

// KATEGORİ EKLE
router.post("/", async (req, res) => {
  const newCat = new Category(req.body);
  try {
    const savedCat = await newCat.save();
    res.status(200).json(savedCat);
  } catch (err) {
    res.status(500).json(err);
  }
});

// TÜM KATEGORİLERİ GETİR
router.get("/", async (req, res) => {
  try {
    const cats = await Category.find();
    res.status(200).json(cats);
  } catch (err) {
    res.status(500).json(err);
  }
});

// KATEGORİ SİL
router.delete("/:id", async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json("Kategori silindi.");
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;