const router = require("express").Router();
const Settings = require("../models/Settings");

// AYARLARI GETİR (Yoksa varsayılan oluşturur)
router.get("/", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.status(200).json(settings);
  } catch (err) {
    res.status(500).json(err);
  }
});

// AYARLARI GÜNCELLE
router.put("/", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    
    settings.shippingFee = req.body.shippingFee;
    settings.freeShippingThreshold = req.body.freeShippingThreshold;
    settings.isFreeShippingActive = req.body.isFreeShippingActive;
    
    await settings.save();
    res.status(200).json(settings);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;