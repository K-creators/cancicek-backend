const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.token || req.headers.authorization;
  if (authHeader) {
    // "Bearer <token>" formatı
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET || "GIZLI_KELIME", (err, user) => {
      if (err) return res.status(403).json("Token geçerli değil!");
      req.user = user;
      next();
    });
  } else {
    return res.status(401).json("Giriş yapmalısınız!");
  }
};

const verifyTokenAndAuthorization = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id || req.user.isAdmin) {
      next();
    } else {
      res.status(403).json("Bunu yapmaya izniniz yok!");
    }
  });
};

const verifyTokenAndAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.isAdmin) {
      next();
    } else {
      res.status(403).json("Bu işlem için Admin yetkisi gerekiyor!");
    }
  });
};

module.exports = {
  verifyToken,
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
};