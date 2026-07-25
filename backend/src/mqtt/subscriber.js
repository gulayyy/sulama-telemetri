const mqtt = require("mqtt");
const config = require("../config");
const { validateReading } = require("../validation");
const { insertReading } = require("../services/readingsService");

// /api/health endpoint'inin okuyacağı canlı durum bilgisi.
const state = {
  connected: false,
  lastMessageAt: null,
  received: 0,
  stored: 0,
  rejected: 0,
};

// farm/sensors/3 → 3
function sensorIdFromTopic(topic) {
  const id = Number(topic.split("/").pop());
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function handleMessage(topic, buffer) {
  state.received++;
  state.lastMessageAt = new Date();

  let raw;
  try {
    raw = JSON.parse(buffer.toString());
  } catch {
    state.rejected++;
    console.warn(`[mqtt] ${topic} — geçersiz JSON, mesaj yok sayıldı`);
    return;
  }

  const result = validateReading(raw, sensorIdFromTopic(topic));
  if (!result.ok) {
    state.rejected++;
    console.warn(`[mqtt] ${topic} — doğrulama hatası: ${result.error}`);
    return;
  }

  try {
    await insertReading(result.value);
    state.stored++;
  } catch (err) {
    state.rejected++;
    // 23503 = foreign key violation → sensors tablosunda olmayan bir sensör id'si
    if (err.code === "23503") {
      console.warn(`[mqtt] ${topic} — tanımsız sensör id'si: ${result.value.sensorId}`);
    } else {
      console.error(`[mqtt] ${topic} — kayıt hatası:`, err.message);
    }
  }
}

function startSubscriber() {
  const client = mqtt.connect(config.mqtt.url, { reconnectPeriod: 3000 });

  client.on("connect", () => {
    state.connected = true;
    client.subscribe(config.mqtt.topic, { qos: 1 }, (err) => {
      if (err) return console.error("[mqtt] abonelik hatası:", err.message);
      console.log(`[mqtt] bağlandı: ${config.mqtt.url} — abone: ${config.mqtt.topic}`);
    });
  });

  client.on("message", handleMessage);
  client.on("close", () => {
    state.connected = false;
  });
  client.on("error", (err) => console.error("[mqtt] hata:", err.message));
  client.on("reconnect", () => console.log("[mqtt] yeniden bağlanılıyor..."));

  return client;
}

module.exports = { startSubscriber, mqttState: state };
