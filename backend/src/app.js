const express = require("express");
const cors = require("cors");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const healthRoutes = require("./routes/health");
const sensorRoutes = require("./routes/sensors");

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api/health", healthRoutes);
  app.use("/api/sensors", sensorRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
