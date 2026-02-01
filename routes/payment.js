const router = require('express').Router();
const Iyzipay = require('iyzipay');
require('dotenv').config();

// --- IYZICO AYARLARI ---
const iyzipay = new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY,
    secretKey: process.env.IYZICO_SECRET_KEY,
    uri: 'https://sandbox-api.iyzipay.com'
});

// ============================================================
// 1. ÖDEME FORMUNU BAŞLAT (Initialize)
// ============================================================
router.post('/initialize', (req, res) => {
    // Frontend'den gelen verileri alıyoruz
    // Not: buyer... bilgileri Register ekranından veya Profil'den gelmeli
    const { 
        price, 
        paidPrice, 
        basketItems, 
        buyerName, 
        buyerSurname, 
        buyerPhone, 
        buyerEmail, 
        buyerAddress, 
        buyerCity 
    } = req.body;

    // Fiyatı string formatına çevir (Iyzico string ister)
    const priceStr = price.toString();

    // Sepet içeriğini Iyzico formatına çeviriyoruz
    // Eğer sepet boş gelirse hata vermemesi için "Genel Sipariş" adında tek bir ürün oluşturuyoruz
    const items = (basketItems && basketItems.length > 0) 
        ? basketItems.map((item) => ({
            id: item._id || 'BI101',
            name: item.title || 'Ürün',
            category1: 'Çiçek',
            itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
            price: item.price.toString()
        }))
        : [{
            id: 'BI101',
            name: 'Sipariş Toplamı',
            category1: 'Genel',
            itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
            price: priceStr
        }];

    const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: '123456789',
        price: priceStr,
        paidPrice: priceStr, // İndirim varsa burası düşer
        currency: Iyzipay.CURRENCY.TRY,
        basketId: 'B67832',
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        
        // ÖNEMLİ: Buraya kendi Render URL'ini yazmalısın!
        // Localde test ediyorsan çalışmaz, deploy etmelisin veya ngrok kullanmalısın.
        callbackUrl: 'https://cancicek-api.onrender.com/api/payment/callback',
        
        enabledInstallments: [1, 2, 3, 6, 9],
        
        buyer: {
            id: 'BY789',
            name: buyerName || 'Misafir',
            surname: buyerSurname || 'Kullanıcı',
            gsmNumber: buyerPhone || '+905555555555',
            email: buyerEmail || 'email@email.com',
            identityNumber: '11111111110', // Sandbox'ta rastgele geçerli bir TC
            lastLoginDate: '2015-10-05 12:43:35',
            registrationDate: '2013-04-21 15:12:09',
            registrationAddress: buyerAddress || 'Nidakule Göztepe, Merdivenköy Mah.',
            ip: '85.34.78.112', // Kullanıcının IP'si (Req.ip'den de alabilirsin)
            city: buyerCity || 'Istanbul',
            country: 'Turkey',
            zipCode: '34732'
        },
        shippingAddress: {
            contactName: `${buyerName} ${buyerSurname}`,
            city: buyerCity || 'Istanbul',
            country: 'Turkey',
            address: buyerAddress || 'Nidakule Göztepe, Merdivenköy Mah.',
            zipCode: '34742'
        },
        billingAddress: {
            contactName: `${buyerName} ${buyerSurname}`,
            city: buyerCity || 'Istanbul',
            country: 'Turkey',
            address: buyerAddress || 'Nidakule Göztepe, Merdivenköy Mah.',
            zipCode: '34742'
        },
        basketItems: items
    };

    iyzipay.checkoutFormInitialize.create(request, (err, result) => {
        if (err) {
            return res.status(500).json({ status: 'failure', message: err });
        }
        // Başarılıysa 'checkoutFormContent' (HTML) ve 'paymentPageUrl' döner
        res.status(200).json(result);
    });
});

// ============================================================
// 2. CALLBACK (IYZICO BURAYA DÖNECEK)
// ============================================================
router.post('/callback', (req, res) => {
    // Iyzico işlem bitince buraya bir POST isteği atar ve 'token' gönderir.
    const { token } = req.body;

    iyzipay.checkoutForm.retrieve({ token: token }, (err, result) => {
        if (!err && result.paymentStatus === 'SUCCESS') {
            // Ödeme Başarılı!
            // Flutter WebView bu HTML'i görünce anlayacak.
            res.send(`
                <html>
                <head><title>Ödeme Başarılı</title></head>
                <body style="background-color:#e1b3ea; display:flex; justify-content:center; align-items:center; height:100vh;">
                    <h1 style="color:white; font-family:sans-serif;">SUCCESS</h1>
                </body>
                </html>
            `);
        } else {
            // Ödeme Başarısız
            res.send(`
                <html>
                <head><title>Ödeme Başarısız</title></head>
                <body style="background-color:red; display:flex; justify-content:center; align-items:center; height:100vh;">
                    <h1 style="color:white; font-family:sans-serif;">FAILURE</h1>
                    <p>${result ? result.errorMessage : 'Hata'}</p>
                </body>
                </html>
            `);
        }
    });
});

module.exports = router;