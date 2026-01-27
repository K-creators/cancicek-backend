const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- CLOUDINARY AYARLARI (YENİ) ---
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// 1. Cloudinary Girişi
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Depolama Ayarı (Resim nereye, nasıl yüklenecek?)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'cancicek_avatars', // Cloudinary'de bu klasöre kaydeder
    allowed_formats: ['jpg', 'png', 'jpeg'], // İzin verilen formatlar
    public_id: (req, file) => 'user_' + Date.now(), // Dosya ismi
  },
});

const upload = multer({ storage: storage });
// ----------------------------------

// 1. KAYIT OLMA (REGISTER)
router.post('/register', async (req, res) => {
  try {
    const { fullName, username, email, phone, password } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ message: "Bu e-posta veya kullanıcı adı zaten kayıtlı." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiry = new Date(Date.now() + 3 * 60000);

    const newUser = new User({
      fullName, username, email, phone, password: hashedPassword,
      otp: otpCode, otpExpires: otpExpiry, isVerified: false
    });

    await newUser.save();
    console.log(`SMS KODU: ${otpCode}`);
    res.status(201).json({ message: "Kayıt başarılı!", userId: newUser._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. SMS DOĞRULAMA
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, code } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: "Kullanıcı bulunamadı." });

    if (user.otp !== code || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Kod hatalı veya süresi dolmuş." });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET || "GIZLI_KELIME", { expiresIn: '30d' });
    res.status(200).json({ message: "Hesap doğrulandı!", token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GİRİŞ YAP
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    const user = await User.findOne({ $or: [{ email: emailOrUsername }, { username: emailOrUsername }] });

    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Şifre hatalı." });
    if (!user.isVerified) return res.status(403).json({ message: "Önce hesabınızı doğrulayın." });

    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET || "GIZLI_KELIME", { expiresIn: '30d' });
    const { password: p, ...others } = user._doc;

    res.status(200).json({ token, user: others });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. PROFİL BİLGİSİ (/me)
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token yok." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "GIZLI_KELIME");
    const user = await User.findById(decoded.id).select("-password");
    res.status(200).json(user);
  } catch (err) {
    res.status(401).json({ message: "Geçersiz token." });
  }
});

// 5. PROFİL GÜNCELLEME (CLOUDINARY MODU)
router.put('/updateDetails', upload.single("photo"), async (req, res) => {
  try {
    // Token Kontrolü
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Token yok." });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "GIZLI_KELIME");
    const userId = decoded.id;

    const { fullName, email, password } = req.body;
    let updateData = { fullName, email };

    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // --- CLOUDINARY KISMI ---
    if (req.file) {
      console.log("☁️ Resim Cloudinary'ye yüklendi:", req.file.path);
      
      // Cloudinary bize direkt HTTPS linki verir (req.file.path)
      // Artık slash düzeltmeye gerek yok!
      updateData.profileImage = req.file.path; 
    }
    // ------------------------

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).select("-password");
    res.status(200).json({ success: true, user: updatedUser });

  } catch (err) {
    console.error("Cloudinary Yükleme Hatası:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;