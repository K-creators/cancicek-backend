const router = require('express').Router();
const Iyzipay = require('iyzipay');

// --- IYZICO SANDBOX (TEST) AYARLARI ---
const iyzipay = new Iyzipay({
    apiKey: 'sandbox-....', // Iyzico panelinden alacağın API Key
    secretKey: 'sandbox-....', // Iyzico panelinden alacağın Secret Key
    uri: 'https://sandbox-api.iyzipay.com'
});

// 1. ÖDEMEYİ BAŞLAT (Kart bilgilerini alır, HTML döner)
router.post('/initialize', (req, res) => {
    const { cardHolderName, cardNumber, expireMonth, expireYear, cvc, price, buyerId, userAddress } = req.body;

    const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: '123456789', // Sipariş numarası (Unique olmalı)
        price: price, // Sepet tutarı
        paidPrice: price, // İndirim varsa burası düşer, yoksa aynı
        currency: Iyzipay.CURRENCY.TRY,
        installments: '1',
        basketId: 'B67832',
        paymentChannel: Iyzipay.PAYMENT_CHANNEL.MOBILE,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        callbackUrl: 'https://senin-backend-adresin.onrender.com/api/payment/callback', // 3D bitince buraya döner
        
        paymentCard: {
            cardHolderName: cardHolderName,
            cardNumber: cardNumber,
            expireMonth: expireMonth,
            expireYear: expireYear,
            cvc: cvc,
            registerCard: '0' // Kartı kaydetme
        },
        
        // --- ALICI BİLGİLERİ (Zorunlu) ---
        buyer: {
            id: buyerId || 'BY789',
            name: 'John',
            surname: 'Doe',
            gsmNumber: '+905350000000',
            email: 'email@email.com',
            identityNumber: '74300864791',
            lastLoginDate: '2015-10-05 12:43:35',
            registrationDate: '2013-04-21 15:12:09',
            registrationAddress: userAddress || 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
            ip: '85.34.78.112',
            city: 'Istanbul',
            country: 'Turkey',
            zipCode: '34732'
        },
        shippingAddress: {
            contactName: 'Jane Doe',
            city: 'Istanbul',
            country: 'Turkey',
            address: userAddress || 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
            zipCode: '34742'
        },
        billingAddress: {
            contactName: 'Jane Doe',
            city: 'Istanbul',
            country: 'Turkey',
            address: userAddress || 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
            zipCode: '34742'
        },
        basketItems: [
            {
                id: 'BI101',
                name: 'Çiçek Siparişi',
                category1: 'Çiçek',
                itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
                price: price
            }
        ]
    };

    iyzipay.threedsInitialize.create(request, (err, result) => {
        if (err) {
            return res.status(500).json({ status: 'failure', message: err });
        }
        // Başarılıysa HTML içeriğini Flutter'a gönder
        res.status(200).json(result);
    });
});

module.exports = router;