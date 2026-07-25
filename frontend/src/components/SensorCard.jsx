import { MOISTURE_THRESHOLD } from "../constants";

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
    <button type="button" className={className} onClick={() => onSelect(sensor.id)}>
      <header>
        <span className="sensor-name">{sensor.name}</span>
        {dry && <span className="badge badge-danger">Sulama gerekli</span>}
      </header>
      <p className="sensor-location">{sensor.location}</p>

      {reading === null ? (
        <p className="sensor-empty">Henüz veri yok</p>
      ) : (
        <>
          <div className="sensor-moisture">
            <span className="value">{reading.soilMoisture}</span>
            <span className="unit">% nem</span>
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
              <dd className={lowBattery ? "text-danger" : undefined}>
                {reading.battery === null ? "—" : `${reading.battery.toFixed(0)} %`}
              </dd>
            </div>
          </dl>
          <footer>Son okuma: {formatTime(reading.recordedAt)}</footer>
        </>
      )}
    </button>
  );
}
