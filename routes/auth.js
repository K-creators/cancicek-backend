const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. KAYIT OLMA (REGISTER)
router.post('/register', async (req, res) => {
  try {
    const { fullName, username, email, phone, password } = req.body;

    // Kullanıcı var mı kontrol et
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ message: "Bu e-posta veya kullanıcı adı zaten kayıtlı." });

    // Şifreyi kriptola (Hash)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4 Haneli Rastgele SMS Kodu Üret
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiry = new Date(Date.now() + 3 * 60000); // 3 dakika geçerli

    // Yeni kullanıcıyı oluştur (Doğrulanmamış olarak)
    const newUser = new User({
      fullName,
      username,
      email,
      phone,
      password: hashedPassword,
      otp: otpCode,
      otpExpires: otpExpiry,
      isVerified: false
    });

    await newUser.save();

    // --- SMS SİMÜLASYONU ---
    console.log(`==========================================`);
    console.log(`TELEFONA GİDEN SMS KODU: ${otpCode}`);
    console.log(`==========================================`);

    res.status(201).json({ message: "Kayıt başarılı! Lütfen telefona gelen kodu girin.", userId: newUser._id });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. SMS DOĞRULAMA (VERIFY OTP)
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, code } = req.body;
    const user = await User.findById(userId);

    if (!user) return res.status(400).json({ message: "Kullanıcı bulunamadı." });

    // Kod doğru mu ve süresi dolmamış mı?
    if (user.otp !== code || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Kod hatalı veya süresi dolmuş." });
    }

    // Doğrulama başarılı -> Kullanıcıyı onayla ve kodu sil
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Giriş anahtarı (Token) oluştur
    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(200).json({ message: "Hesap doğrulandı!", token, user });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GİRİŞ YAP (LOGIN)
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    // Email veya Username ile ara
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    });

    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });

    // Şifre kontrolü
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Şifre hatalı." });

    // Hesap doğrulanmış mı?
    if (!user.isVerified) return res.status(403).json({ message: "Lütfen önce hesabınızı SMS ile doğrulayın." });

    // Token oluştur
    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '30d' });

    // Hassas bilgileri gönderme (şifre vs)
    const { password: p, ...others } = user._doc;

    res.status(200).json({ token, user: others });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// --- YENİ EKLENEN KISIMLAR (PROFİL İÇİN) ---
// ============================================================

// 4. KULLANICI BİLGİSİNİ GETİR (/me)
router.get('/me', async (req, res) => {
  try {
    // 1. Token'ı al
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Token yok." });
    
    const token = authHeader.split(" ")[1];
    
    // 2. Doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Kullanıcıyı bul (Şifre hariç)
    const user = await User.findById(decoded.id).select("-password");
    
    res.status(200).json(user);
  } catch (err) {
    res.status(401).json({ message: "Geçersiz token." });
  }
});

// 5. PROFİL GÜNCELLEME (/updateDetails)
router.put('/updateDetails', async (req, res) => {
  try {
    // 1. Token Kontrolü
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Token yok." });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // 2. Gelen Verileri Al
    const { fullName, email, password } = req.body;

    // Güncellenecek objeyi hazırla
    let updateData = {
      fullName: fullName,
      email: email
    };

    // Eğer şifre de geldiyse hashleyip ekle
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // 3. Veritabanında Güncelle
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true } // Güncel halini döndür
    ).select("-password"); // Şifreyi geri döndürme

    res.status(200).json({ success: true, user: updatedUser });

  } catch (err) {
    console.error("TAM HATA DETAYI:", err); // Bunu backend terminalinde görmek için
    
    // Flutter'a hatanın kendisini gönderiyoruz:
    res.status(500).json({ error: err.message }); 
  }
});

module.exports = router;