const router = require('express').Router();
const Order = require('../models/Order');
const Product = require('../models/Product'); // <-- Critical for security check
const User = require('../models/User'); 
const jwt = require('jsonwebtoken');

// --- IMAGE UPLOAD SETTINGS ---
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "YOUR_CLOUD_NAME",
  api_key: process.env.CLOUDINARY_API_KEY || "YOUR_API_KEY",
  api_secret: process.env.CLOUDINARY_API_SECRET || "YOUR_API_SECRET"
});

const upload = multer({ dest: 'uploads/' });
// ------------------------------

// ============================================================
// HELPER FUNCTION: CREATE ORDER
// ============================================================
const createOrderHandler = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: "You need to log in." });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
       decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_KEY");
    } catch (err) {
       return res.status(403).json({ success: false, error: "Invalid session." });
    }

    const userIdFromToken = decoded.id; 
    const { address, paymentMethod, totalPrice, items } = req.body;

    // --- 🛑 SECURITY CHECK START (UPDATED) 🛑 ---
    // Check every item in the cart against the database
    for (const item of items) {
        // item.product is the ID
        const productData = await Product.findById(item.product);
        
        // If product exists AND deliveryScope is 'corum_only'
        if (productData && (productData.deliveryScope === 'corum_only')) {
            
            // Analyze Address (Clean strings to avoid case/locale issues)
            const city = (address.city || "").toLowerCase();
            const district = (address.district || "").toLowerCase();

            // Check if it is Corum
            const isCityCorum = city.includes("çorum") || city.includes("corum");
            // Check if it is Merkez (Center)
            const isDistrictMerkez = district.includes("merkez") || district.includes("center");

            // If NOT Corum Center -> THROW ERROR
            if (!isCityCorum || !isDistrictMerkez) {
                return res.status(400).json({ 
                    success: false, 
                    // Error message shown to user
                    error: `"${productData.title}" can only be delivered to Çorum Merkez! Please change your address.` 
                });
            }
        }
    }
    // --- 🛑 SECURITY CHECK END 🛑 ---

    const newOrder = new Order({
      userId: userIdFromToken,
      address,
      paymentMethod,
      totalPrice,
      items,
    });

    const savedOrder = await newOrder.save();
    res.status(200).json({ success: true, order: savedOrder });

  } catch (err) {
    console.error("❌ ORDER ERROR:", err);
    res.status(500).json({ 
      success: false, 
      error: "Server Error: " + err.message,
      details: err 
    });
  }
};

// ============================================================
// ROUTES
// ============================================================

// 1. CREATE ORDER
router.post("/", createOrderHandler);
router.post("/create", createOrderHandler);

// 2. GET USER ORDERS
router.get('/find/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
        .sort({ createdAt: -1 })
        .populate('items.product'); 
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. GET ALL ORDERS (Admin)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
        .sort({ createdAt: -1 })
        .populate('items.product');
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 4. ADMIN: DETAILED ORDER LIST
router.get('/admin/all', async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate('items.product');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: "Could not fetch orders." });
    }
});

// 5. ADMIN: UPDATE STATUS
router.put('/admin/update-status/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: status },
            { new: true }
        );
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: "Could not update status." });
    }
});

// 6. UPDATE ADDRESS
router.put('/update-address', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token." });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "GIZLI_KELIME");
    const userId = decoded.id;

    const { id, title, address, city, district, neighborhood, receiverName, phone } = req.body;

    const user = await User.findOneAndUpdate(
      { _id: userId, "addresses.id": id },
      {
        $set: {
          "addresses.$.title": title,
          "addresses.$.address": address,
          "addresses.$.city": city,
          "addresses.$.district": district,
          "addresses.$.neighborhood": neighborhood,
          "addresses.$.receiverName": receiverName,
          "addresses.$.phone": phone
        }
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "Address not found." });
    res.status(200).json({ success: true, user });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. CANCEL REQUEST
router.put("/cancel-request/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json("Order not found.");
    if (order.status !== 'pending') return res.status(400).json("Cannot cancel order.");

    order.status = "cancel_requested";
    await order.save();
    res.status(200).json(order);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 8. ADMIN: UPLOAD IMAGE
router.put('/admin/upload-image/:id', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file selected." });

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "orders_prepared",
            use_filename: true
        });
        fs.unlinkSync(req.file.path);

        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { preparedImage: result.secure_url },
            { new: true }
        );
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: "Image upload failed: " + error.message });
    }
});

// 9. USER: FEEDBACK
router.put('/user/feedback/:id', async (req, res) => {
    try {
        const { feedback } = req.body; 
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { customerFeedback: feedback },
            { new: true }
        );
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: "Could not send feedback." });
    }
});

module.exports = router;