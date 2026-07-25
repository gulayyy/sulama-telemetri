import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartColors, formatAxisTime, formatFullTime } from "../chartTheme";
import { MOISTURE_THRESHOLD } from "../constants";

function ChartTooltip({ active, payload, color }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="tooltip">
      <p className="tooltip-time">{formatFullTime(point.recordedAt)}</p>
      <p className="tooltip-row">
        <span className="series-swatch" style={{ background: color }} />
        Toprak nemi <b>%{point.value}</b>
      </p>
    </div>
  );
}

export default function MoistureChart({ readings, range, theme, loading }) {
  const colors = chartColors(theme);
  const data = readings.map((r) => ({
    time: formatAxisTime(r.recordedAt, range),
    recordedAt: r.recordedAt,
    value: r.soilMoisture,
  }));
  const latest = data.length ? data[data.length - 1].value : null;

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>
            <span className="series-swatch" style={{ background: colors.moisture }} />
            Toprak nemi
          </h2>
          <p className="panel-sub">
            Kuruma ve sulama döngüsü — kesikli çizgi %{MOISTURE_THRESHOLD} uyarı eşiği
          </p>
        </div>
        {latest !== null && (
          <div className="panel-metric">
            <b>%{latest}</b>
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
          <ResponsiveContainer width="100%" height={268}>
            <AreaChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: -14 }}>
              <defs>
                <linearGradient id="moistureFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.moisture} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={colors.moisture} stopOpacity={0.02} />
                </linearGradient>
              </defs>

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
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                stroke={colors.axis}
                fontSize={11.5}
                tickLine={false}
                axisLine={false}
                unit="%"
                width={46}
              />
              <Tooltip
                cursor={{ stroke: colors.cursor, strokeWidth: 1 }}
                content={<ChartTooltip color={colors.moisture} />}
              />
              <ReferenceLine
                y={MOISTURE_THRESHOLD}
                stroke={colors.threshold}
                strokeDasharray="5 4"
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={colors.moisture}
                strokeWidth={2}
                fill="url(#moistureFill)"
                dot={false}
                activeDot={{ r: 4.5, strokeWidth: 2, stroke: colors.surface }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
