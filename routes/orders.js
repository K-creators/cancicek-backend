const router = require('express').Router();
const Order = require('../models/Order');
const Product = require('../models/Product'); // <-- Güvenlik kontrolü için kritik
const User = require('../models/User'); 
const jwt = require('jsonwebtoken');

// --- RESİM YÜKLEME AYARLARI ---
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ dest: 'uploads/' });
// ------------------------------

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

    // --- 🛑 GÜVENLİK KONTROLÜ BAŞLANGICI 🛑 ---
    for (const item of items) {
        const productData = await Product.findById(item.product);
        
        // Ürün varsa VE deliveryScope 'corum_only' ise
        if (productData && (productData.deliveryScope === 'corum_only')) {
            
            const city = (address.city || "").toLowerCase();
            const district = (address.district || "").toLowerCase();

            const isCityCorum = city.includes("çorum") || city.includes("corum");
            const isDistrictMerkez = district.includes("merkez") || district.includes("center");

            if (!isCityCorum || !isDistrictMerkez) {
                return res.status(400).json({ 
                    success: false, 
                    error: `"${productData.title}" ürünü hassas olduğu için sadece Çorum Merkez adresine teslim edilebilir! Lütfen adresinizi düzeltin.` 
                });
            }
        }
    }
    // --- 🛑 GÜVENLİK KONTROLÜ BİTİŞİ 🛑 ---

    const newOrder = new Order({
      userId: userIdFromToken,
      address,
      paymentMethod,
      totalPrice,
      items,
    });

    const savedOrder = await newOrder.save();
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

// 2. KULLANICININ SİPARİŞLERİNİ GETİR (DÜZELTİLDİ)
router.get('/find/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
        // createdAt yerine _id kullandık. Bu en garantisidir.
        .sort({ _id: -1 }) 
        .populate('items.product'); 
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. TÜM SİPARİŞLERİ GETİR (Admin İçin - DÜZELTİLDİ)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
        .sort({ _id: -1 }) // En yeni en üstte
        .populate('items.product');
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 4. ADMIN: DETAYLI SİPARİŞ LİSTESİ (DÜZELTİLDİ)
router.get('/admin/all', async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ _id: -1 }) // En yeni en üstte
            .populate('items.product');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: "Siparişler çekilemedi." });
    }
});

// 5. ADMIN: DURUM GÜNCELLE
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

// 6. ADRES GÜNCELLEME
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

    if (!user) return res.status(404).json({ message: "Adres bulunamadı." });
    res.status(200).json({ success: true, user });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. İPTAL TALEBİ
router.put("/cancel-request/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json("Sipariş bulunamadı.");
    if (order.status !== 'pending') return res.status(400).json("Sipariş iptal edilemez.");

    order.status = "cancel_requested";
    await order.save();
    res.status(200).json(order);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 8. ADMIN: RESİM YÜKLEME
router.put('/admin/upload-image/:id', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "Dosya seçilmedi." });

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "orders_prepared",
            use_filename: true
        });
        fs.unlinkSync(req.file.path);

        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { preparedImage: result.secure_url },
            { new: true }
        );
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: "Resim yüklenemedi: " + error.message });
    }
});

// 9. KULLANICI: GERİ BİLDİRİM
router.put('/user/feedback/:id', async (req, res) => {
    try {
        const { feedback } = req.body; 
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { customerFeedback: feedback },
            { new: true }
        );
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: "Geri bildirim gönderilemedi." });
    }
});

module.exports = router;