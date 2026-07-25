const jwt = require("jsonwebtoken");
const config = require("../config");

/**
 * Authorization: Bearer <token> başlığını doğrular.
 * Token geçerliyse req.user doldurulur, değilse istek 401 ile reddedilir.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Authorization: Bearer <token> başlığı gerekli" });
  }

  try {
    req.user = jwt.verify(token, config.auth.jwtSecret);
    next();
  } catch (err) {
    const message =
      err.name === "TokenExpiredError" ? "Token süresi dolmuş" : "Geçersiz token";
    res.status(401).json({ error: message });
  }
}

module.exports = { requireAuth };
