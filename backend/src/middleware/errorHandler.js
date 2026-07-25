function notFound(req, res) {
  res.status(404).json({ error: `Bulunamadı: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars -- Express hata middleware'i 4 parametre ister
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    console.error("[api] sunucu hatası:", err);
  }
  res.status(status).json({
    error: status >= 500 ? "Sunucu hatası" : err.message,
  });
}

module.exports = { notFound, errorHandler };
