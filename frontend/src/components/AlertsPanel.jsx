import { useState } from "react";
import { AlertIcon, CheckIcon } from "./icons";

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
      <div className="panel-head">
        <div>
          <h2>Aktif uyarılar</h2>
          <p className="panel-sub">Sulama yapıldığında 'çözüldü' olarak işaretleyin</p>
        </div>
        <span className={alerts.length ? "badge badge-critical" : "badge badge-good"}>
          {alerts.length}
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="empty-state">
          <CheckIcon />
          <p>Açık uyarı yok — tüm parseller yeterli nemde.</p>
        </div>
      ) : (
        <ul className="alert-list">
          {alerts.map((alert) => (
            <li key={alert.id} className="alert-item">
              <div>
                <div className="alert-head">
                  <AlertIcon />
                  <span className="alert-sensor">{alert.sensorName}</span>
                </div>
                <p className="alert-meta">
                  %{alert.value} · {formatDateTime(alert.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleResolve(alert.id)}
                disabled={busyId === alert.id}
              >
                {busyId === alert.id ? "..." : "Sulama yapıldı"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
