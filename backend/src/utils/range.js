// İstemciden gelen range parametresi doğrudan SQL'e gömülmez;
// yalnızca bu tabloda tanımlı değerler kabul edilir (SQL injection önlemi).
const RANGES = {
  "1h": "1 hour",
  "24h": "24 hours",
  "7d": "7 days",
};

const DEFAULT_RANGE = "24h";

/**
 * @returns {{ok: true, range: string, interval: string} | {ok: false, error: string}}
 */
function parseRange(value) {
  const range = value === undefined || value === "" ? DEFAULT_RANGE : String(value);
  const interval = RANGES[range];
  if (!interval) {
    return {
      ok: false,
      error: `Geçersiz range değeri: '${range}'. Kabul edilenler: ${Object.keys(RANGES).join(", ")}`,
    };
  }
  return { ok: true, range, interval };
}

module.exports = { parseRange, RANGES, DEFAULT_RANGE };
