import { useCallback, useEffect, useState } from "react";
import { fetchOpenAlerts, fetchReadings, fetchSensors, resolveAlert } from "../api";
import { REFRESH_MS } from "../constants";
import AlertsPanel from "./AlertsPanel";
import ReadingsChart from "./ReadingsChart";
import SensorCard from "./SensorCard";

export default function Dashboard({ onLogout }) {
  const [sensors, setSensors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [readings, setReadings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [range, setRange] = useState("24h");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const [sensorList, alertData] = await Promise.all([fetchSensors(), fetchOpenAlerts()]);
      setSensors(sensorList);
      setAlerts(alertData.alerts);

      // İlk yüklemede henüz seçim yok; listedeki ilk sensörle başla.
      const activeId = selectedId ?? sensorList[0]?.id ?? null;
      if (selectedId === null && activeId !== null) setSelectedId(activeId);

      if (activeId !== null) {
        const data = await fetchReadings(activeId, range);
        setReadings(data.readings);
      }

      setUpdatedAt(new Date());
      setError(null);
    } catch (err) {
      if (err.status === 401) {
        onLogout();
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedId, range, onLogout]);

  // Veriyi çek ve 15 saniyede bir yenile. Sensör ya da aralık değişince
  // load fonksiyonu yenilenir; effect kapanışta eski zamanlayıcıyı temizler.
  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  async function handleResolve(alertId) {
    try {
      await resolveAlert(alertId);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const selectedSensor = sensors.find((sensor) => sensor.id === selectedId) ?? null;

  return (
    <div className="dashboard">
      <header className="app-header">
        <div>
          <h1>Sulama Telemetri</h1>
          <p className="app-subtitle">Akıllı sulama sensör gösterge paneli</p>
        </div>
        <div className="app-header-right">
          <span className="updated-at">
            {updatedAt
              ? `Son güncelleme ${updatedAt.toLocaleTimeString("tr-TR")}`
              : "Yükleniyor..."}
          </span>
          <button type="button" className="ghost" onClick={onLogout}>
            Çıkış
          </button>
        </div>
      </header>

      {error && <p className="banner-error">{error}</p>}

      <section className="sensor-grid">
        {sensors.map((sensor) => (
          <SensorCard
            key={sensor.id}
            sensor={sensor}
            selected={sensor.id === selectedId}
            onSelect={setSelectedId}
          />
        ))}
      </section>

      <div className="panels">
        <ReadingsChart
          sensor={selectedSensor}
          readings={readings}
          range={range}
          onRangeChange={setRange}
          loading={loading}
        />
        <AlertsPanel alerts={alerts} onResolve={handleResolve} />
      </div>
    </div>
  );
}
