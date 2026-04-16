const jwt = require("jsonwebtoken");

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: token tidak ditemukan" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: token tidak valid" });
  }
}

function authorizeAdministrator(req, res, next) {
  if (!req.user || req.user.role !== "Administrator") {
    return res.status(403).json({ message: "Forbidden: khusus role Administrator" });
  }

  return next();
}

module.exports = {
  authenticateJWT,
  authorizeAdministrator,
};
