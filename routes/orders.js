const router = require('express').Router();
const Order = require('../models/Order');

// SİPARİŞ OLUŞTURMA
router.post("/", async (req, res) => {
  try {
    const { userId, address, paymentMethod, totalPrice, items } = req.body;

    console.log("📥 Gelen Sipariş Adresi:", address);

    // Adres verisini garantiye al
    let finalAddress = {};

    if (typeof address === 'string') {
      // Eğer sadece yazı geldiyse (Eski versiyon uyumu için yedek)
      finalAddress = {
        title: "Teslimat Adresi",
        fullAddress: address, // Yazıyı buraya koy
        receiverName: "Alıcı",
        phone: "",
        city: "",
        district: ""
      };
    } else {
      // Eğer obje geldiyse (Senin şu an gönderdiğin gibi) direkt kullan
      finalAddress = address;
    }

    const newOrder = new Order({
      userId,
      address: finalAddress, // Veritabanı artık bunu Object olarak kabul edecek
      paymentMethod,
      totalPrice,
      items,
    });

    const savedOrder = await newOrder.save();
    console.log("✅ Sipariş Başarıyla Oluşturuldu:", savedOrder._id);
    
    res.status(200).json({ success: true, order: savedOrder });

  } catch (err) {
    console.error("❌ Sipariş Oluşturma Hatası:", err); // Terminale detaylı hata basar
    res.status(500).json({ success: false, error: err.message });
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

// --- YENİ SİPARİŞ OLUŞTUR ---
router.post('/create', async (req, res) => {
    try {
        const { userId, address, paymentMethod, items, totalPrice } = req.body;

        // 1. Yeni Sipariş Oluştur
        const newOrder = new Order({
            user: userId,
            address: address,
            paymentMethod: paymentMethod, // 'credit_card' veya 'cod' (Cash on Delivery)
            products: items,
            totalPrice: totalPrice,
            status: 'pending'
        });

        await newOrder.save();

        // 2. Kullanıcının Sepetini Temizle (Opsiyonel ama önerilir)
        // await Cart.findOneAndDelete({ user: userId }); 

        res.status(200).json({ success: true, message: "Sipariş alındı!", orderId: newOrder._id });
    } catch (error) {
        console.error("Sipariş hatası:", error);
        res.status(500).json({ success: false, error: "Sipariş oluşturulamadı." });
    }
});

// 7. ADRES GÜNCELLEME (YENİ)
router.put('/update-address', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Token yok." });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "GIZLI_KELIME");
    const userId = decoded.id;

    // Güncellenecek veriler
    const { id, title, address, city, district, neighborhood, receiverName, phone } = req.body;

    // MongoDB'de dizi içindeki (array) belirli bir elemanı güncellemek için
    // "addresses.id": id ile bulup, "$" operatörü ile güncelliyoruz.
    const user = await User.findOneAndUpdate(
      { _id: userId, "addresses.id": id },
      {
        $set: {
          "addresses.$.title": title,
          "addresses.$.address": address,
          "addresses.$.city": city,
          "addresses.$.district": district,
          "addresses.$.neighborhood": neighborhood, // Mahalle
          "addresses.$.receiverName": receiverName, // YENİ
          "addresses.$.phone": phone                // YENİ
        }
      },
      { new: true } // Güncel veriyi döndür
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

module.exports = router;