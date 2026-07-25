const express = require("express");
const cors = require("cors");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { requireAuth } = require("./middleware/auth");
const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const sensorRoutes = require("./routes/sensors");
const alertRoutes = require("./routes/alerts");

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Açık uçlar: sağlık kontrolü (izleme araçları için) ve giriş.
  app.use("/api/health", healthRoutes);
  app.use("/api/auth", authRoutes);

  // Veri uçlarının tamamı JWT ile korunur.
  app.use("/api/sensors", requireAuth, sensorRoutes);
  app.use("/api/alerts", requireAuth, alertRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
