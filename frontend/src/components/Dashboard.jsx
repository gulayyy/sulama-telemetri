import { useCallback, useEffect, useState } from "react";
import { fetchOpenAlerts, fetchReadings, fetchSensors, resolveAlert } from "../api";
import { REFRESH_MS } from "../constants";
import AlertsPanel from "./AlertsPanel";
import FilterBar from "./FilterBar";
import MoistureChart from "./MoistureChart";
import ReadingsTable from "./ReadingsTable";
import SensorCard from "./SensorCard";
import StatRow from "./StatRow";
import TemperatureChart from "./TemperatureChart";
import Topbar from "./Topbar";
import { AlertIcon } from "./icons";

export default function Dashboard({ theme, onToggleTheme, onLogout }) {
  const [sensors, setSensors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [readings, setReadings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [range, setRange] = useState("24h");
  const [view, setView] = useState("chart");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      setRefreshing(false);
    }
  }, [selectedId, range, onLogout]);

  // Veriyi çek ve 15 saniyede bir yenile. Sensör ya da aralık değişince load
  // yenilenir; effect kapanışta eski zamanlayıcıyı temizler.
  useEffect(() => {
    load();
    const timer = setInterval(() => {
      setRefreshing(true);
      load();
    }, REFRESH_MS);
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
    <>
      <Topbar
        updatedAt={updatedAt}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onLogout={onLogout}
      />

      <div className={refreshing ? "page is-refreshing" : "page"}>
        {error && (
          <p className="notice" role="alert">
            <AlertIcon />
            {error}
          </p>
        )}

        <StatRow sensors={sensors} alertCount={alerts.length} />

        <div className="section-title">
          <h2>Sensörler</h2>
          <span>Grafiği değiştirmek için bir sensör kartına tıklayın</span>
        </div>

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

        <FilterBar
          sensorName={selectedSensor?.name}
          range={range}
          onRangeChange={setRange}
          view={view}
          onViewChange={setView}
        />

        <div className="panels">
          <div className="charts">
            {view === "chart" ? (
              <>
                <MoistureChart
                  readings={readings}
                  range={range}
                  theme={theme}
                  loading={loading}
                />
                <TemperatureChart
                  readings={readings}
                  range={range}
                  theme={theme}
                  loading={loading}
                />
              </>
            ) : (
              <ReadingsTable readings={readings} loading={loading} />
            )}
          </div>

          <AlertsPanel alerts={alerts} onResolve={handleResolve} />
        </div>
      </div>
    </>
  );
}
