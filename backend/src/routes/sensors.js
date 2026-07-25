const { Router } = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { parseRange } = require("../utils/range");
const {
  listSensorsWithLastReading,
  findSensorById,
  listReadings,
  readingStats,
} = require("../services/sensorsService");

const router = Router();

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Rota gövdelerinde tekrar etmemek için ortak id + range çözümlemesi.
async function resolveSensorAndRange(req, res) {
  const sensorId = parseId(req.params.id);
  if (sensorId === null) {
    res.status(400).json({ error: "Geçersiz sensör id'si" });
    return null;
  }

  const range = parseRange(req.query.range);
  if (!range.ok) {
    res.status(400).json({ error: range.error });
    return null;
  }

  const sensor = await findSensorById(sensorId);
  if (!sensor) {
    res.status(404).json({ error: `Sensör bulunamadı: ${sensorId}` });
    return null;
  }

  return { sensor, range };
}

// GET /api/sensors — sensör listesi + her birinin son okuması
router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await listSensorsWithLastReading());
  })
);

// GET /api/sensors/:id/readings?range=24h — zaman aralıklı ham veri
router.get(
  "/:id/readings",
  asyncHandler(async (req, res) => {
    const resolved = await resolveSensorAndRange(req, res);
    if (!resolved) return;

    const readings = await listReadings(resolved.sensor.id, resolved.range.interval);
    res.json({
      sensor: resolved.sensor,
      range: resolved.range.range,
      count: readings.length,
      readings,
    });
  })
);

// GET /api/sensors/:id/stats?range=24h — min / max / ortalama
router.get(
  "/:id/stats",
  asyncHandler(async (req, res) => {
    const resolved = await resolveSensorAndRange(req, res);
    if (!resolved) return;

    const stats = await readingStats(resolved.sensor.id, resolved.range.interval);
    res.json({ sensor: resolved.sensor, range: resolved.range.range, stats });
  })
);

module.exports = router;
