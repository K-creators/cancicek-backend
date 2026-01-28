const router = require('express').Router();
const Order = require('../models/Order');

// SİPARİŞ OLUŞTURMA
router.post("/", async (req, res) => {
  try {
    // Frontend'den gelen verileri al
    const { userId, address, paymentMethod, totalPrice, items } = req.body;

    // Adres Kontrolü (String mi Obje mi?)
    let finalAddress = {};
    
    if (typeof address === 'string') {
      // Eğer eski usul sadece yazı geldiyse
      finalAddress = {
        title: "Kayıtlı Adres",
        address: address,
        city: "",
        receiverName: "Kullanıcı", // Varsayılan
        phone: ""
      };
    } else {
      // Eğer detaylı obje geldiyse direkt al
      finalAddress = address;
    }

    const newOrder = new Order({
      userId,
      address: finalAddress, // Düzenlenmiş adresi kaydet
      paymentMethod,
      totalPrice,
      items,
    });

    const savedOrder = await newOrder.save();
    res.status(200).json({ success: true, order: savedOrder });

  } catch (err) {
    console.error("Sipariş Hatası:", err); // Hatayı terminale yazdır ki görelim
    // Detaylı hatayı frontend'e gönder
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

module.exports = router;