require("dotenv").config();

const config = {
  port: Number(process.env.PORT || 4000),

  db: {
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || "sulama",
    password: process.env.PGPASSWORD || "sulama123",
    database: process.env.PGDATABASE || "telemetri",
  },

  mqtt: {
    url: process.env.MQTT_URL || "mqtt://localhost:1883",
    topic: process.env.MQTT_TOPIC || "farm/sensors/+",
  },

  // Toprak nemi bu değerin altına düşünce sulama uyarısı üretilir.
  moistureThreshold: Number(process.env.MOISTURE_THRESHOLD || 25),

  auth: {
    jwtSecret: process.env.JWT_SECRET || "degistirilmesi-gereken-gizli-anahtar",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
    user: process.env.ADMIN_USER || "admin",
    password: process.env.ADMIN_PASSWORD || "sulama123",
  },
};

module.exports = config;
