// backend/routes/instagram.js
const router = require('express').Router();
const axios = require('axios'); // Eğer yüklü değilse terminalde: npm install axios

router.get('/', async (req, res) => {
  try {
    // BU İKİ SATIR ÇOK ÖNEMLİ (Bunlar eksik olduğu için hata alıyorsun)
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const businessId = process.env.INSTAGRAM_BUSINESS_ID; 

    // Kontrol bloğu
    if (!accessToken || !businessId) {
      console.error("HATA: Render Environment kısmında Token veya ID eksik!");
      return res.status(500).json({ message: "Sunucu ayarları eksik." });
    }

    // URL oluşturma (Hata burada çıkıyordu çünkü businessId yukarıda yoktu)
    const url = `https://graph.facebook.com/v18.0/${businessId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink&access_token=${accessToken}`;
    
    const response = await axios.get(url);
    
    const data = response.data.data.map(item => ({
      id: item.id,
      imageUrl: item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url, 
      permalink: item.permalink,
      caption: item.caption || ""
    }));

    res.status(200).json(data);

  } catch (err) {
    // Hatayı detaylı görelim
    console.error("Instagram Hatası:", err.response ? err.response.data : err.message);
    res.status(500).json({ message: "Instagram verisi çekilemedi." });
  }
});

module.exports = router;