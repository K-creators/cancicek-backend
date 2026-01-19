const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product'); // Ürün modelini çağır

dotenv.config();

// --- ÖRNEK ÜRÜN LİSTESİ ---
const sampleProducts = [
  {
    title: "Kırmızı Aşk Buketi",
    description: "101 adet taze kırmızı gülden oluşan, sevdikleriniz için özel tasarım dev buket. Aşkınızı en tutkulu haliyle anlatın.",
    price: 1250,
    images: ["https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?q=80&w=1000&auto=format&fit=crop"],
    category: "Buket",
    deliveryScope: "corum_only"
  },
  {
    title: "Beyaz Asalet Orkidesi",
    description: "Çift dallı, seramik saksıda ithal beyaz orkide. Ofis ve ev hediyesi için en zarif tercih.",
    price: 850,
    images: ["https://images.unsplash.com/photo-1566206091558-1f4a9b691152?q=80&w=1000&auto=format&fit=crop"],
    category: "Saksı",
    deliveryScope: "corum_only"
  },
  {
    title: "Papatya Bahçesi",
    description: "Mevsimin en taze beyaz papatyaları ve cipso süslemeleriyle hazırlanan, içinizi açacak renkli aranjman.",
    price: 450,
    images: ["https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=1000&auto=format&fit=crop"],
    category: "Buket",
    deliveryScope: "corum_only"
  },
  {
    title: "Kalpli Çikolata Kutusu",
    description: "Özel tasarım kalp kutu içerisinde 24 adet spesiyal sütlü ve bitter çikolata. Yanında küçük bir ayıcık hediyeli.",
    price: 600,
    images: ["https://images.unsplash.com/photo-1549411963-31518e0cb7a8?q=80&w=1000&auto=format&fit=crop"],
    category: "Çikolata",
    deliveryScope: "all_turkey"
  },
  {
    title: "Sevimli Peluş Ayı (50cm)",
    description: "Yumuşacık dokusuyla sarılmaya doyamayacağınız, papyonlu dev peluş ayı. Tüm Türkiye'ye kargo imkanı.",
    price: 350,
    images: ["https://images.unsplash.com/photo-1559454403-b8fb87521bc7?q=80&w=1000&auto=format&fit=crop"],
    category: "Oyuncak",
    deliveryScope: "all_turkey"
  },
  {
    title: "Teraryum Mini Bahçe",
    description: "Cam fanus içerisinde sukulentler ve minyatür objelerle tasarlanmış, bakımı kolay masaüstü bahçe.",
    price: 550,
    images: ["https://images.unsplash.com/photo-1663449330999-522617651a24?q=80&w=1000&auto=format&fit=crop"],
    category: "Saksı",
    deliveryScope: "corum_only"
  }
];

// --- VERİTABANINA KAYDETME İŞLEMİ ---
const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Veritabanına bağlanıldı.");

    // Önceki verileri temizle (İstersen bu satırı silebilirsin)
    await Product.deleteMany({});
    console.log("🧹 Eski ürünler temizlendi.");

    // Yeni ürünleri ekle
    await Product.insertMany(sampleProducts);
    console.log("🎉 6 Adet Örnek Ürün Başarıyla Eklendi!");

  } catch (err) {
    console.log("❌ Hata oluştu:", err);
  } finally {
    mongoose.connection.close(); // İş bitince bağlantıyı kapat
    console.log("👋 Bağlantı kapatıldı.");
  }
};

seedDB();