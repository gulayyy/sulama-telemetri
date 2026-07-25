const { query } = require("../db");

/**
 * Doğrulanmış bir telemetri okumasını readings tablosuna yazar.
 * @returns {Promise<{id: string, recordedAt: Date}>}
 */
async function insertReading(reading) {
  const { rows } = await query(
    `INSERT INTO readings
       (sensor_id, soil_moisture, temperature, air_humidity, battery, recorded_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, recorded_at`,
    [
      reading.sensorId,
      reading.soilMoisture,
      reading.temperature,
      reading.airHumidity,
      reading.battery,
      reading.recordedAt,
    ]
  );
  return { id: rows[0].id, recordedAt: rows[0].recorded_at };
}

module.exports = { insertReading };
