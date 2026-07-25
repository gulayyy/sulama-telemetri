const { Router } = require("express");
const { query } = require("../db");
const { mqttState } = require("../mqtt/subscriber");

const router = Router();

// GET /api/health — servis + DB + MQTT bağlantı durumu (kimlik doğrulama gerektirmez)
router.get("/", async (req, res) => {
  let database = "down";
  try {
    await query("SELECT 1");
    database = "up";
  } catch {
    database = "down";
  }

  const mqtt = mqttState.connected ? "up" : "down";
  const healthy = database === "up" && mqtt === "up";

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    uptimeSeconds: Math.round(process.uptime()),
    database,
    mqtt: {
      status: mqtt,
      lastMessageAt: mqttState.lastMessageAt,
      received: mqttState.received,
      stored: mqttState.stored,
      rejected: mqttState.rejected,
      alertsCreated: mqttState.alerts,
    },
  });
});

module.exports = router;
