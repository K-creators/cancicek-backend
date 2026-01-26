// Node.js Backend Kodu (Örnek)
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin'); // Firebase Admin SDK

// SERVİS HESABI ANAHTARINI YÜKLE (Sunucu tarafında yapılmalı)
// const serviceAccount = require("path/to/serviceAccountKey.json");
// admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// HERKESE BİLDİRİM GÖNDERME ENDPOINT'İ
router.post('/send-all', async (req, res) => {
    try {
        const { title, body } = req.body;

        const message = {
            notification: {
                title: title,
                body: body
            },
            topic: 'all_users' // Flutter'da abone olduğumuz konu adı
        };

        // Firebase'e gönder
        const response = await admin.messaging().send(message);
        
        console.log('Başarıyla gönderildi:', response);
        res.status(200).json({ success: true, message: 'Bildirim gönderildi.' });
    } catch (error) {
        console.error('Bildirim hatası:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;