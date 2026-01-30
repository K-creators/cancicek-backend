const router = require('express').Router();
const Order = require('../models/Order');
const User = require('../models/User'); 
const jwt = require('jsonwebtoken');

// ============================================================
// YARDIMCI FONKSİYON: SİPARİŞ OLUŞTURMA
// ============================================================
const createOrderHandler = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: "Oturum açmanız gerekiyor." });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
       decoded = jwt.verify(token, process.env.JWT_SECRET || "GIZLI_KELIME");
    } catch (err) {
       return res.status(403).json({ success: false, error: "Geçersiz oturum." });
    }

    const userIdFromToken = decoded.id; 

    const { address, paymentMethod, totalPrice, items } = req.body;

    console.log("📥 Gelen Adres:", JSON.stringify(address));

    const newOrder = new Order({
      userId: userIdFromToken,
      address,
      paymentMethod,
      totalPrice,
      items,
    });

    const savedOrder = await newOrder.save();
    console.log("✅ Sipariş Kaydedildi:", savedOrder._id);
    
    res.status(200).json({ success: true, order: savedOrder });

  } catch (err) {
    console.error("❌ SİPARİŞ HATASI:", err);
    res.status(500).json({ 
      success: false, 
      error: "Sunucu Hatası: " + err.message,
      details: err 
    });
  }
};

// ============================================================
// ROTALAR
// ============================================================

// 1. SİPARİŞ OLUŞTUR
router.post("/", createOrderHandler);
router.post("/create", createOrderHandler);

// 2. KULLANICININ SİPARİŞLERİNİ GETİR
router.get('/find/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
        .sort({ createdAt: -1 })
        .populate('items.product'); 

    res.status(200).json(orders);
  } catch (err) {
    console.error("Sipariş Çekme Hatası:", err);
    res.status(500).json(err);
  }
});

// 3. TÜM SİPARİŞLERİ GETİR (Admin İçin)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
        .sort({ createdAt: -1 })
        .populate('items.product');
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 4. ADMIN: DETAYLI SİPARİŞ LİSTESİ (Alternatif Route)
router.get('/admin/all', async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate('items.product');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: "Siparişler çekilemedi." });
    }
});

// 5. ADMIN: SİPARİŞ DURUMUNU GÜNCELLE
router.put('/admin/update-status/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: status },
            { new: true }
        );
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: "Durum güncellenemedi." });
    }
});

// 6. ADRES GÜNCELLEME (User Modeli Üzerinden)
router.put('/update-address', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Token yok." });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "GIZLI_KELIME");
    const userId = decoded.id;

    const { id, title, address, city, district, neighborhood, receiverName, phone } = req.body;

    const user = await User.findOneAndUpdate(
      { _id: userId, "addresses.id": id },
      {
        $set: {
          "addresses.$.title": title,
          "addresses.$.address": address,
          "addresses.$.city": city,
          "addresses.$.district": district,
          "addresses.$.neighborhood": neighborhood,
          "addresses.$.receiverName": receiverName,
          "addresses.$.phone": phone
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "Adres bulunamadı." });
    }

    res.status(200).json({ success: true, user });

  } catch (err) {
    console.error("Adres Güncelleme Hatası:", err);
    res.status(500).json({ error: err.message });
  }
});

// 7. İPTAL TALEBİ ROTASI (Flutter'dan gelen istek)
router.put("/cancel-request/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json("Sipariş bulunamadı.");
    }

    // Sadece 'pending' ise iptal isteği atılabilir
    if (order.status !== 'pending') {
      return res.status(400).json("Bu sipariş iptal edilemez (Kargoda olabilir).");
    }

    order.status = "cancel_requested";
    await order.save();

    res.status(200).json(order);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;