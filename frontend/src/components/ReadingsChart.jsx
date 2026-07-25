import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MOISTURE_THRESHOLD, RANGES } from "../constants";

// 7 günlük aralıkta saat yetmez, gün de göstermek gerekir.
function formatAxis(iso, range) {
  const date = new Date(iso);
  if (range === "7d") {
    return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
  }
  return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export default function ReadingsChart({ sensor, readings, range, onRangeChange, loading }) {
  const data = readings.map((reading) => ({
    time: formatAxis(reading.recordedAt, range),
    nem: reading.soilMoisture,
    sicaklik: reading.temperature,
  }));

  return (
    <section className="panel chart-panel">
      <header className="panel-header">
        <div>
          <h2>{sensor ? sensor.name : "Sensör seçin"}</h2>
          <p className="panel-subtitle">Toprak nemi ve sıcaklık değişimi</p>
        </div>
        <div className="range-picker" role="group" aria-label="Zaman aralığı">
          {RANGES.map((option) => (
            <button
              key={option.value}
              type="button"
              className={option.value === range ? "is-active" : undefined}
              onClick={() => onRangeChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      {data.length === 0 ? (
        <p className="panel-empty">
          {loading ? "Veri yükleniyor..." : "Bu aralıkta kayıtlı okuma yok."}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={12} minTickGap={32} />
            <YAxis
              yAxisId="nem"
              domain={[0, 100]}
              stroke="#38bdf8"
              fontSize={12}
              unit="%"
            />
            <YAxis
              yAxisId="sicaklik"
              orientation="right"
              domain={["dataMin - 3", "dataMax + 3"]}
              stroke="#fb923c"
              fontSize={12}
              unit="°"
            />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 8,
              }}
              formatter={(value, name) => [value, name === "nem" ? "Toprak nemi (%)" : "Sıcaklık (°C)"]}
            />
            <Legend
              formatter={(value) => (value === "nem" ? "Toprak nemi (%)" : "Sıcaklık (°C)")}
            />
            <ReferenceLine
              yAxisId="nem"
              y={MOISTURE_THRESHOLD}
              stroke="#ef4444"
              strokeDasharray="6 4"
              label={{ value: `Eşik %${MOISTURE_THRESHOLD}`, fill: "#ef4444", fontSize: 11 }}
            />
            <Line
              yAxisId="nem"
              type="monotone"
              dataKey="nem"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="sicaklik"
              type="monotone"
              dataKey="sicaklik"
              stroke="#fb923c"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
