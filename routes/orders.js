const router = require('express').Router();
const Order = require('../models/Order');

// 1. SİPARİŞ OLUŞTUR (Sepeti Onayla)
router.post('/', async (req, res) => {
  const newOrder = new Order(req.body);

  try {
    const savedOrder = await newOrder.save();
    res.status(200).json(savedOrder);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. KULLANICININ SİPARİŞLERİNİ GETİR
router.get('/find/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. TÜM SİPARİŞLERİ GETİR (Admin İçin)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- ADMIN: TÜM SİPARİŞLERİ GETİR ---
router.get('/admin/all', async (req, res) => {
    try {
        // En yeniden en eskiye sırala
        const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: "Siparişler çekilemedi." });
    }
});

// --- ADMIN: SİPARİŞ DURUMUNU GÜNCELLE ---
router.put('/admin/update-status/:id', async (req, res) => {
    try {
        const { status } = req.body; // 'pending', 'shipped', 'delivered', 'cancelled'
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: status },
            { new: true } // Güncellenmiş veriyi döndür
        );
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: "Durum güncellenemedi." });
    }
});

module.exports = router;