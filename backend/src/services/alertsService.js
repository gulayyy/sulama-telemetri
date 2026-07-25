const { query } = require("../db");
const config = require("../config");

const IRRIGATION = "IRRIGATION_NEEDED";

function toAlert(row) {
  return {
    id: row.id,
    sensorId: row.sensor_id,
    sensorName: row.sensor_name,
    alertType: row.alert_type,
    message: row.message,
    value: row.value,
    resolved: row.resolved,
    createdAt: row.created_at,
  };
}

/**
 * Okuma eşiğin altındaysa sulama uyarısı üretir.
 *
 * Spam önleme: aynı sensör için çözülmemiş bir uyarı varsa yenisi açılmaz.
 * Kontrol ile insert'i tek SQL cümlesinde (NOT EXISTS) yapıyoruz; böylece
 * arka arkaya gelen iki mesaj arasında çift kayıt oluşamaz.
 *
 * @returns {Promise<object|null>} yeni uyarı ya da null
 */
async function createIrrigationAlertIfNeeded(reading) {
  if (reading.soilMoisture >= config.moistureThreshold) return null;

  const { rows } = await query(
    `INSERT INTO alerts (sensor_id, alert_type, message, value)
     SELECT s.id,
            $3::text,
            s.name || ' toprak nemi %' || ($2::numeric)::text ||
              ' seviyesine dustu (esik %' || ($4::numeric)::text || ') - sulama gerekli',
            $2::numeric
       FROM sensors s
      WHERE s.id = $1
        AND NOT EXISTS (
              SELECT 1 FROM alerts a
               WHERE a.sensor_id = s.id
                 AND a.alert_type = $3::text
                 AND a.resolved = FALSE
            )
     RETURNING id, sensor_id, alert_type, message, value, resolved, created_at`,
    [reading.sensorId, reading.soilMoisture, IRRIGATION, config.moistureThreshold]
  );

  return rows.length ? toAlert(rows[0]) : null;
}

/** @param {boolean|null} resolved  null → hepsi */
async function listAlerts(resolved = null) {
  const { rows } = await query(
    `SELECT a.id, a.sensor_id, s.name AS sensor_name, a.alert_type,
            a.message, a.value, a.resolved, a.created_at
       FROM alerts a
       JOIN sensors s ON s.id = a.sensor_id
      WHERE $1::boolean IS NULL OR a.resolved = $1::boolean
      ORDER BY a.created_at DESC`,
    [resolved]
  );
  return rows.map(toAlert);
}

/** @returns {Promise<{status: 'resolved'|'already-resolved'|'not-found', alert?: object}>} */
async function resolveAlert(id) {
  const { rows } = await query(
    `UPDATE alerts SET resolved = TRUE
      WHERE id = $1 AND resolved = FALSE
      RETURNING id, sensor_id, alert_type, message, value, resolved, created_at`,
    [id]
  );

  if (rows.length) return { status: "resolved", alert: toAlert(rows[0]) };

  const existing = await query(`SELECT id FROM alerts WHERE id = $1`, [id]);
  return { status: existing.rows.length ? "already-resolved" : "not-found" };
}

module.exports = { createIrrigationAlertIfNeeded, listAlerts, resolveAlert, IRRIGATION };
