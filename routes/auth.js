const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Middleware
const { verifyTokenAndAuthorization } = require('./verifyToken'); 

// --- CLOUDINARY AYARLARI ---
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'cancicek_avatars',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    public_id: (req, file) => 'user_' + Date.now(),
  },
});

const upload = multer({ storage: storage });

// --- YARDIMCI FONKSİYON: Kullanıcı Adı Kontrolü ---
const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// ============================================================
// 1. KAYIT OLMA (REGISTER) - TELEFON TAMAMEN KALDIRILDI
// ============================================================
router.post('/register', async (req, res) => {
  try {
    // phone değişkenini buradan çıkardık
    const { fullName, username, email, password } = req.body;

    // 1. Kullanıcı Adı Format Kontrolü
    if (!validateUsername(username)) {
      return res.status(400).json({ message: "Kullanıcı adı formatı hatalı." });
    }

    // 2. Benzersizlik Kontrolleri
    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: "Bu kullanıcı adı zaten alınmış." });

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: "Bu e-posta adresi zaten kayıtlı." });

    // 3. Şifreleme ve Kayıt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName, 
      username, 
      email, 
      // phone alanını buraya eklemiyoruz
      password: hashedPassword,
      isVerified: true, 
      lastUsernameChange: new Date()
    });

    await newUser.save();
    res.status(201).json({ message: "Kayıt başarılı!" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 2. GİRİŞ YAP
// ============================================================
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    const user = await User.findOne({ $or: [{ email: emailOrUsername }, { username: emailOrUsername }] });

    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Şifre hatalı." });

    // isVerified kontrolü artık hep true olacağı için problem çıkarmaz.
    const token = jwt.sign(
        { id: user._id, isAdmin: user.isAdmin }, 
        process.env.JWT_SECRET || "GIZLI_KELIME", 
        { expiresIn: '30d' }
    );
    
    const { password: p, ...others } = user._doc;
    res.status(200).json({ token, user: others });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 3. PROFİL BİLGİSİ (/me)
// ============================================================
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

// ============================================================
// 4. PROFİL GÜNCELLEME
// ============================================================
router.put('/updateDetails', upload.single("photo"), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Token yok." });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "GIZLI_KELIME");
    const userId = decoded.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    const { fullName, email, username, phone, password } = req.body;
    let updateData = { fullName }; 

    if (username && username !== user.username) {
      if (!validateUsername(username)) {
        return res.status(400).json({ message: "Kullanıcı adı formatı hatalı." });
      }
      const existingUser = await User.findOne({ username });
      if (existingUser) return res.status(400).json({ message: "Bu kullanıcı adı zaten alınmış." });

      if (user.lastUsernameChange) {
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        const now = new Date().getTime();
        const lastChange = new Date(user.lastUsernameChange).getTime();

        if (now - lastChange < oneWeek) {
          const daysLeft = Math.ceil((oneWeek - (now - lastChange)) / (1000 * 60 * 60 * 24));
          return res.status(400).json({ message: `Kullanıcı adınızı değiştirmek için ${daysLeft} gün daha beklemelisiniz.` });
        }
      }
      updateData.username = username;
      updateData.lastUsernameChange = new Date();
    }

    if (email && email !== user.email) {
       const emailExists = await User.findOne({ email });
       if (emailExists) return res.status(400).json({ message: "Bu e-posta başkası tarafından kullanılıyor." });
       updateData.email = email;
    }

    if (phone && phone !== user.phone) {
       const phoneExists = await User.findOne({ phone });
       if (phoneExists) return res.status(400).json({ message: "Bu numara başkası tarafından kullanılıyor." });
       updateData.phone = phone;
    }

    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    if (req.file) {
      updateData.profileImage = req.file.path; 
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).select("-password");
    res.status(200).json({ success: true, user: updatedUser });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 5. ADRES EKLEME
// ============================================================
router.post('/add-address', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Token yok." });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "GIZLI_KELIME");
    const userId = decoded.id;

    const { title, address, city, receiverName, phone } = req.body;

    if (!title || !address || !receiverName || !phone) {
      return res.status(400).json({ message: "Lütfen zorunlu alanları doldurunuz." });
    }

    const newAddress = {
      title,
      address,
      city: city || "",
      receiverName,
      phone,
      id: new Date().getTime().toString()
    };

    const user = await User.findById(userId);
    user.addresses.push(newAddress);
    await user.save();

    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 6. HESAP SİLME
// ============================================================
router.delete("/delete/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json("Hesap başarıyla silindi.");
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;