const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// HERKESE BİLDİRİM GÖNDERME
router.post('/send-all', async (req, res) => {
  try {
    const { title, body } = req.body;

    // Eğer firebase kurulu değilse hata dönmesin diye kontrol
    if (admin.apps.length === 0) {
      return res.status(500).json({ error: "Firebase Admin başlatılmamış." });
    }

    const message = {
      notification: {
        title: title,
        body: body,
      },
      topic: 'all_users', // Flutter'da abone olduğumuz konu
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