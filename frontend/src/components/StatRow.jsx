import { MOISTURE_THRESHOLD } from "../constants";
import { AlertIcon, BatteryIcon, DropIcon, SensorIcon } from "./icons";

const round1 = (n) => Math.round(n * 10) / 10;

export default function StatRow({ sensors, alertCount }) {
  const readings = sensors.map((s) => s.lastReading).filter(Boolean);

  const online = readings.length;
  const avgMoisture = online
    ? round1(readings.reduce((sum, r) => sum + r.soilMoisture, 0) / online)
    : null;
  const dryCount = readings.filter((r) => r.soilMoisture < MOISTURE_THRESHOLD).length;
  const minBattery = readings.length
    ? Math.min(...readings.map((r) => r.battery ?? 100))
    : null;

  return (
    <section className="stat-row">
      <article className="stat">
        <p className="stat-label">
          <SensorIcon />
          Aktif sensör
        </p>
        <p className="stat-value">
          {online}
          <small>/ {sensors.length}</small>
        </p>
        <p className="stat-note">Veri gönderen sensör sayısı</p>
      </article>

      <article className="stat">
        <p className="stat-label">
          <DropIcon />
          Ortalama toprak nemi
        </p>
        <p className="stat-value">
          {avgMoisture === null ? "—" : avgMoisture}
          <small>%</small>
        </p>
        <p className="stat-note">
          {dryCount === 0
            ? `Şu an eşiğin (%${MOISTURE_THRESHOLD}) altında parsel yok`
            : `${dryCount} parsel eşiğin (%${MOISTURE_THRESHOLD}) altında`}
        </p>
      </article>

      <article className="stat">
        <p className="stat-label">
          <AlertIcon />
          Açık uyarı
        </p>
        <p className={alertCount ? "stat-value tone-critical" : "stat-value tone-good"}>
          {alertCount}
        </p>
        <p className="stat-note">
          {alertCount ? "Sulama bekleyen parsel var" : "Bekleyen sulama yok"}
        </p>
      </article>

      <article className="stat">
        <p className="stat-label">
          <BatteryIcon />
          En düşük pil
        </p>
        <p className={minBattery !== null && minBattery < 20 ? "stat-value tone-critical" : "stat-value"}>
          {minBattery === null ? "—" : Math.round(minBattery)}
          <small>%</small>
        </p>
        <p className="stat-note">Saha bakımı için takip edilir</p>
      </article>
    </section>
  );
}
