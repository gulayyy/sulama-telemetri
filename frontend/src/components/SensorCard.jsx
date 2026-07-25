import { MOISTURE_THRESHOLD } from "../constants";
import { AlertIcon } from "./icons";

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export default function SensorCard({ sensor, selected, onSelect }) {
  const reading = sensor.lastReading;
  const dry = reading !== null && reading.soilMoisture < MOISTURE_THRESHOLD;
  const lowBattery = reading !== null && reading.battery !== null && reading.battery < 20;

  const className = ["sensor-card", selected ? "is-selected" : "", dry ? "is-dry" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={className}
      onClick={() => onSelect(sensor.id)}
      aria-pressed={selected}
    >
      <div className="sensor-card-head">
        <div>
          <p className="sensor-name">{sensor.name}</p>
          <p className="sensor-location">{sensor.location}</p>
        </div>
        {dry && (
          <span className="badge badge-critical">
            <AlertIcon />
            Sulama gerekli
          </span>
        )}
      </div>

      {reading === null ? (
        <p className="sensor-empty">Bu sensörden henüz veri alınmadı.</p>
      ) : (
        <>
          <div className="sensor-reading">
            <span className="value">{reading.soilMoisture}</span>
            <span className="unit">% toprak nemi</span>
          </div>

          <div
            className="level"
            role="img"
            aria-label={`Toprak nemi %${reading.soilMoisture}`}
          >
            <div
              className={dry ? "level-fill is-dry" : "level-fill"}
              style={{ width: `${Math.min(100, Math.max(0, reading.soilMoisture))}%` }}
            />
          </div>

          <dl className="sensor-metrics">
            <div>
              <dt>Sıcaklık</dt>
              <dd>{reading.temperature} °C</dd>
            </div>
            <div>
              <dt>Hava nemi</dt>
              <dd>{reading.airHumidity ?? "—"} %</dd>
            </div>
            <div>
              <dt>Pil</dt>
              <dd className={lowBattery ? "tone-critical" : undefined}>
                {reading.battery === null ? "—" : `${Math.round(reading.battery)} %`}
              </dd>
            </div>
          </dl>

          <p className="sensor-foot">Son okuma {formatTime(reading.recordedAt)}</p>
        </>
      )}
    </button>
  );
}
