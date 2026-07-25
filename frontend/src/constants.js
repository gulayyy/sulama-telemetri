// Backend'deki MOISTURE_THRESHOLD ile aynı olmalı; kartların ve grafikteki
// eşik çizgisinin kırmızıya dönme sınırı.
export const MOISTURE_THRESHOLD = 25;

// Dashboard'un kendini yenileme aralığı (simülatör 10 sn'de bir veri üretiyor).
export const REFRESH_MS = 15000;

export const RANGES = [
  { value: "1h", label: "Son 1 saat" },
  { value: "24h", label: "Son 24 saat" },
  { value: "7d", label: "Son 7 gün" },
];
