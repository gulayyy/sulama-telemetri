// Gelen MQTT mesajının doğrulanması.
// Broker'a herkes yayın yapabildiği için veritabanına yazmadan önce
// hem şema (alanlar var mı, tipleri doğru mu) hem de değer aralığı kontrol edilir.

const RANGES = {
  soilMoisture: [0, 100], // %
  temperature: [-20, 70], // °C
  airHumidity: [0, 100], // %
  battery: [0, 100], // %
};

const REQUIRED = ["sensorId", "soilMoisture", "temperature"];
const OPTIONAL = ["airHumidity", "battery"];

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function inRange(field, value) {
  const [min, max] = RANGES[field];
  return value >= min && value <= max;
}

/**
 * @param {unknown} raw           JSON.parse edilmiş mesaj gövdesi
 * @param {number|null} topicSensorId  Topic'ten okunan sensör id'si (farm/sensors/3 → 3)
 * @returns {{ok: true, value: object} | {ok: false, error: string}}
 */
function validateReading(raw, topicSensorId = null) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "mesaj bir JSON nesnesi değil" };
  }

  for (const field of REQUIRED) {
    if (!isFiniteNumber(raw[field])) {
      return { ok: false, error: `'${field}' alanı eksik veya sayı değil` };
    }
  }

  if (!Number.isInteger(raw.sensorId) || raw.sensorId <= 0) {
    return { ok: false, error: "'sensorId' pozitif tam sayı olmalı" };
  }

  // Topic ile gövdedeki sensör id'si çelişiyorsa mesaj güvenilmezdir.
  if (topicSensorId !== null && topicSensorId !== raw.sensorId) {
    return {
      ok: false,
      error: `topic sensör id'si (${topicSensorId}) gövdedekiyle (${raw.sensorId}) uyuşmuyor`,
    };
  }

  for (const field of [...REQUIRED, ...OPTIONAL]) {
    const value = raw[field];
    if (field === "sensorId" || value === undefined || value === null) continue;
    if (!isFiniteNumber(value)) {
      return { ok: false, error: `'${field}' sayı değil` };
    }
    if (!inRange(field, value)) {
      const [min, max] = RANGES[field];
      return { ok: false, error: `'${field}' ${min}-${max} aralığı dışında: ${value}` };
    }
  }

  // Zaman damgası opsiyonel; yoksa veya geçersizse sunucu saati kullanılır.
  let recordedAt = new Date();
  if (typeof raw.timestamp === "string") {
    const parsed = new Date(raw.timestamp);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, error: `'timestamp' geçerli bir tarih değil: ${raw.timestamp}` };
    }
    recordedAt = parsed;
  }

  return {
    ok: true,
    value: {
      sensorId: raw.sensorId,
      soilMoisture: raw.soilMoisture,
      temperature: raw.temperature,
      airHumidity: raw.airHumidity ?? null,
      battery: raw.battery ?? null,
      recordedAt,
    },
  };
}

module.exports = { validateReading, RANGES };
