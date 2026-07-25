const { Router } = require("express");
const jwt = require("jsonwebtoken");
const config = require("../config");

const router = Router();

// POST /api/auth/login — kullanıcı adı/parola doğruysa JWT üretir.
// Prototip olduğu için kullanıcılar veritabanında değil ortam değişkenlerinde tutuluyor.
router.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "username ve password alanları zorunlu" });
  }

  if (username !== config.auth.user || password !== config.auth.password) {
    return res.status(401).json({ error: "Kullanıcı adı veya parola hatalı" });
  }

  const token = jwt.sign({ sub: username, role: "operator" }, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
  });

  res.json({ token, tokenType: "Bearer", expiresIn: config.auth.jwtExpiresIn });
});

module.exports = router;
