const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const path = require('path'); // Dosya yollarını garantiye almak için

// --- FIREBASE BAŞLATMA ---
try {
  // Eğer daha önce başlatılmadıysa başlat
  if (admin.apps.length === 0) {
    
    // 1. Yetki dosyasının yolunu tam olarak bul
    // __dirname = routes klasörü
    // '..' = bir üst klasör (ana dizin)
    const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    
    const serviceAccount = require(serviceAccountPath); 
    
    // 2. Admin yetkisiyle başlat
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase Admin Başarıyla Başlatıldı!");
  }
} catch (error) {
  console.error("❌ Firebase başlatma hatası! 'serviceAccountKey.json' dosyası eksik veya okunamıyor.");
  console.error("Hata Detayı:", error.message);
}
// -------------------------

// HERKESE BİLDİRİM GÖNDERME
router.post('/send-all', async (req, res) => {
  try {
    const { title, body } = req.body;

    // Kontrol: Başlatma başarısız olduysa işlemi durdur
    if (admin.apps.length === 0) {
      return res.status(500).json({ error: "Firebase Admin başlatılamadı (Json dosyası eksik)." });
    }

    const message = {
      notification: {
        title: title || "Can Çiçek", // Başlık boşsa varsayılan
        body: body || "Kampanyalarımızı kaçırmayın!",
      },
      topic: 'all_users', // Flutter tarafında bu konuya abone olmalıyız
    };

    // Firebase'e gönder
    const response = await admin.messaging().send(message);

    console.log('Bildirim başarıyla gönderildi:', response);
    res.status(200).json({ success: true, messageId: response });
  } catch (error) {
    console.error('Bildirim gönderme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;