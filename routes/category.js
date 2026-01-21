const router = require("express").Router();
const Category = require("../models/Category");
const Product = require("../models/Product");

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

// 1. GET Rotasını Güncelle (Sıralı gelmesi için)
router.get("/", async (req, res) => {
  try {
    // orderIndex'e göre (küçükten büyüğe) sırala
    const cats = await Category.find().sort({ orderIndex: 1 });
    res.status(200).json(cats);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. YENİ ROTA: Sıralamayı Kaydet
router.post("/reorder", async (req, res) => {
  try {
    const { orderedIds } = req.body; // Frontend'den sıralı ID listesi gelecek

    // Toplu güncelleme işlemi (Bulk Write)
    const updates = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { orderIndex: index } }, // Dizideki sırasını kaydet
      },
    }));

    await Category.bulkWrite(updates);
    res.status(200).json("Sıralama güncellendi.");
  } catch (err) {
    res.status(500).json(err);
  }
});

// KATEGORİ SİL (Akıllı Silme)
router.delete("/:id", async (req, res) => {
  try {
    // 1. Silinecek kategoriyi bul
    const categoryToDelete = await Category.findById(req.params.id);
    if (!categoryToDelete) return res.status(404).json("Kategori bulunamadı");

    // 2. Bu kategorideki tüm ürünleri "Genel" kategorisine taşı
    await Product.updateMany(
      { category: categoryToDelete.name },
      { $set: { category: "Genel" } }
    );

    // 3. Kategoriyi sil
    await Category.findByIdAndDelete(req.params.id);
    
    res.status(200).json("Kategori silindi, ürünler 'Genel' kategorisine taşındı.");
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;