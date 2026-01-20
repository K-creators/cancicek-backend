// backend/routes/instagram.js
const router = require('express').Router();
const axios = require('axios'); // Eğer yüklü değilse terminalde: npm install axios

router.get('/', async (req, res) => {
  try {
    // .env dosyasından tokeni alacağız
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(400).json({ message: "Instagram Token bulunamadı!" });
    }

// YENİ URL: Graph API (Facebook üzerinden)
    const url = `https://graph.facebook.com/v18.0/${businessId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink&access_token=${accessToken}`;
    
    const response = await axios.get(url);
    
    // Gelen veriyi işle
    const data = response.data.data.map(item => ({
      id: item.id,
      // Eğer videoysa kapak resmini (thumbnail), değilse normal resmi al
      imageUrl: item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url, 
      permalink: item.permalink,
      caption: item.caption || ""
    }));

    res.status(200).json(data);

  } catch (err) {
    console.error("Instagram Hatası:", err.response ? err.response.data : err.message);
    res.status(500).json({ message: "Instagram verisi çekilemedi." });
  }
});

module.exports = router;