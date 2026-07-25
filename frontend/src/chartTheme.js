// Recharts renkleri SVG özniteliği olarak verildiği için CSS değişkenleri yerine
// düz hex kullanılır. Değerler index.css'teki --series-* / --grid ile aynıdır ve
// erişilebilirlik doğrulayıcısından geçmiştir (kontrast, renk körlüğü ayrımı).
const THEMES = {
  dark: {
    moisture: "#3987e5",
    temperature: "#d95926",
    grid: "rgba(255,255,255,0.07)",
    axis: "#7d8ca3",
    cursor: "rgba(255,255,255,0.22)",
    surface: "#121c2e",
    threshold: "#d03b3b",
  },
  light: {
    moisture: "#2a78d6",
    temperature: "#eb6834",
    grid: "rgba(11,18,32,0.08)",
    axis: "#6b7889",
    cursor: "rgba(11,18,32,0.25)",
    surface: "#ffffff",
    threshold: "#d03b3b",
  },
};

export const chartColors = (theme) => THEMES[theme] ?? THEMES.dark;

/** 7 günlük aralıkta saat yetmez, gün de gösterilir. */
export function formatAxisTime(iso, range) {
  const date = new Date(iso);
  if (range === "7d") {
    return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
  }
  return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export function formatFullTime(iso) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
