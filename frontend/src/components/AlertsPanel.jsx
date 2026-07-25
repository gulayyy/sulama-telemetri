import { useState } from "react";

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AlertsPanel({ alerts, onResolve }) {
  const [busyId, setBusyId] = useState(null);

  async function handleResolve(alertId) {
    setBusyId(alertId);
    try {
      await onResolve(alertId);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="panel alerts-panel">
      <header className="panel-header">
        <div>
          <h2>Aktif uyarılar</h2>
          <p className="panel-subtitle">Sulama yapıldığında 'çözüldü' olarak işaretleyin</p>
        </div>
        <span className={alerts.length ? "badge badge-danger" : "badge"}>{alerts.length}</span>
      </header>

      {alerts.length === 0 ? (
        <p className="panel-empty">Açık uyarı yok — tüm parseller yeterli nemde.</p>
      ) : (
        <ul className="alert-list">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <div>
                <p className="alert-sensor">{alert.sensorName}</p>
                <p className="alert-message">
                  Toprak nemi %{alert.value} — {formatDateTime(alert.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleResolve(alert.id)}
                disabled={busyId === alert.id}
              >
                {busyId === alert.id ? "..." : "Çözüldü"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
