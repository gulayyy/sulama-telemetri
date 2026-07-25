import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartColors, formatAxisTime, formatFullTime } from "../chartTheme";

function ChartTooltip({ active, payload, color }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="tooltip">
      <p className="tooltip-time">{formatFullTime(point.recordedAt)}</p>
      <p className="tooltip-row">
        <span className="series-swatch" style={{ background: color }} />
        Sıcaklık <b>{point.value} °C</b>
      </p>
    </div>
  );
}

export default function TemperatureChart({ readings, range, theme, loading }) {
  const colors = chartColors(theme);
  const data = readings.map((r) => ({
    time: formatAxisTime(r.recordedAt, range),
    recordedAt: r.recordedAt,
    value: r.temperature,
  }));
  const latest = data.length ? data[data.length - 1].value : null;

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>
            <span className="series-swatch" style={{ background: colors.temperature }} />
            Sıcaklık
          </h2>
          <p className="panel-sub">Gün içi sıcaklık eğrisi — buharlaşma hızını belirler</p>
        </div>
        {latest !== null && (
          <div className="panel-metric">
            <b>{latest} °C</b>
            <span>son okuma</span>
          </div>
        )}
      </div>

      <div className="chart-body">
        {data.length === 0 ? (
          <p className="panel-empty">
            {loading ? "Veri yükleniyor..." : "Bu aralıkta kayıtlı okuma yok."}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={172}>
            <LineChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: -14 }}>
              <CartesianGrid stroke={colors.grid} vertical={false} />
              <XAxis
                dataKey="time"
                stroke={colors.axis}
                fontSize={11.5}
                tickLine={false}
                axisLine={{ stroke: colors.grid }}
                minTickGap={40}
              />
              <YAxis
                domain={["dataMin - 2", "dataMax + 2"]}
                stroke={colors.axis}
                fontSize={11.5}
                tickLine={false}
                axisLine={false}
                unit="°"
                width={46}
              />
              <Tooltip
                cursor={{ stroke: colors.cursor, strokeWidth: 1 }}
                content={<ChartTooltip color={colors.temperature} />}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors.temperature}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4.5, strokeWidth: 2, stroke: colors.surface }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
