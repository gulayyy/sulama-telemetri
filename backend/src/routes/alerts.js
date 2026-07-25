const { Router } = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { listAlerts, resolveAlert } = require("../services/alertsService");

const router = Router();

// 'false' / 'true' dışında bir değer gelirse hata döndürülür; filtre yoksa hepsi listelenir.
function parseResolved(value) {
  if (value === undefined || value === "") return { ok: true, resolved: null };
  if (value === "false") return { ok: true, resolved: false };
  if (value === "true") return { ok: true, resolved: true };
  return { ok: false, error: "resolved parametresi yalnızca 'true' veya 'false' olabilir" };
}

// GET /api/alerts?resolved=false — aktif (çözülmemiş) uyarılar
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = parseResolved(req.query.resolved);
    if (!filter.ok) return res.status(400).json({ error: filter.error });

    const alerts = await listAlerts(filter.resolved);
    res.json({ count: alerts.length, alerts });
  })
);

// PATCH /api/alerts/:id/resolve — uyarıyı 'sulama yapıldı' olarak kapat
router.patch(
  "/:id/resolve",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Geçersiz uyarı id'si" });
    }

    const result = await resolveAlert(id);
    if (result.status === "not-found") {
      return res.status(404).json({ error: `Uyarı bulunamadı: ${id}` });
    }
    if (result.status === "already-resolved") {
      return res.status(409).json({ error: `Uyarı zaten çözülmüş: ${id}` });
    }

    res.json({ message: "Uyarı çözüldü olarak işaretlendi", alert: result.alert });
  })
);

module.exports = router;
