// Async route handler'larda oluşan hataların Express'in hata
// middleware'ine ulaşmasını sağlar (aksi halde sessizce kaybolur).
module.exports = function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};
