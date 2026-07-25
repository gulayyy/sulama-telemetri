const { query } = require("../db");

function toLastReading(row) {
  if (row.recorded_at === null) return null;
  return {
    soilMoisture: row.soil_moisture,
    temperature: row.temperature,
    airHumidity: row.air_humidity,
    battery: row.battery,
    recordedAt: row.recorded_at,
  };
}

/**
 * Sensör listesi + her sensörün son okuması.
 * LATERAL join, her sensör için idx_readings_sensor_time indeksini kullanarak
 * yalnızca 1 satır okur; tüm tabloyu tarayıp gruplamaktan çok daha hızlıdır.
 */
async function listSensorsWithLastReading() {
  const { rows } = await query(
    `SELECT s.id, s.name, s.location, s.type, s.created_at,
            r.soil_moisture, r.temperature, r.air_humidity, r.battery, r.recorded_at
       FROM sensors s
       LEFT JOIN LATERAL (
         SELECT soil_moisture, temperature, air_humidity, battery, recorded_at
           FROM readings
          WHERE readings.sensor_id = s.id
          ORDER BY recorded_at DESC
          LIMIT 1
       ) r ON TRUE
      ORDER BY s.id`
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    location: row.location,
    type: row.type,
    createdAt: row.created_at,
    lastReading: toLastReading(row),
  }));
}

async function findSensorById(id) {
  const { rows } = await query(
    `SELECT id, name, location, type, created_at FROM sensors WHERE id = $1`,
    [id]
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    type: row.type,
    createdAt: row.created_at,
  };
}

/** Belirtilen zaman aralığındaki ham okumalar (eskiden yeniye). */
async function listReadings(sensorId, interval) {
  const { rows } = await query(
    `SELECT soil_moisture, temperature, air_humidity, battery, recorded_at
       FROM readings
      WHERE sensor_id = $1
        AND recorded_at >= now() - $2::interval
      ORDER BY recorded_at ASC`,
    [sensorId, interval]
  );

  return rows.map((row) => ({
    soilMoisture: row.soil_moisture,
    temperature: row.temperature,
    airHumidity: row.air_humidity,
    battery: row.battery,
    recordedAt: row.recorded_at,
  }));
}

/** Zaman aralığı için min / max / ortalama değerler. */
async function readingStats(sensorId, interval) {
  const { rows } = await query(
    `SELECT count(*)::int                       AS count,
            min(soil_moisture)                  AS moisture_min,
            max(soil_moisture)                  AS moisture_max,
            round(avg(soil_moisture), 2)        AS moisture_avg,
            min(temperature)                    AS temperature_min,
            max(temperature)                    AS temperature_max,
            round(avg(temperature), 2)          AS temperature_avg,
            min(air_humidity)                   AS humidity_min,
            max(air_humidity)                   AS humidity_max,
            round(avg(air_humidity), 2)         AS humidity_avg,
            min(battery)                        AS battery_min,
            max(battery)                        AS battery_max,
            min(recorded_at)                    AS first_at,
            max(recorded_at)                    AS last_at
       FROM readings
      WHERE sensor_id = $1
        AND recorded_at >= now() - $2::interval`,
    [sensorId, interval]
  );

  const row = rows[0];
  return {
    count: row.count,
    firstAt: row.first_at,
    lastAt: row.last_at,
    soilMoisture: { min: row.moisture_min, max: row.moisture_max, avg: row.moisture_avg },
    temperature: {
      min: row.temperature_min,
      max: row.temperature_max,
      avg: row.temperature_avg,
    },
    airHumidity: { min: row.humidity_min, max: row.humidity_max, avg: row.humidity_avg },
    battery: { min: row.battery_min, max: row.battery_max },
  };
}

module.exports = { listSensorsWithLastReading, findSensorById, listReadings, readingStats };
