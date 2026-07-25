import { formatFullTime } from "../chartTheme";
import { MOISTURE_THRESHOLD } from "../constants";

// Grafiklerin erişilebilir eşdeğeri: aynı veri, renkten bağımsız okunabilir.
export default function ReadingsTable({ readings, loading }) {
  const rows = [...readings].reverse();

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Ham okumalar</h2>
          <p className="panel-sub">
            Grafiklerin tablo eşdeğeri — en yeni kayıt üstte ({readings.length} satır)
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="panel-empty">
          {loading ? "Veri yükleniyor..." : "Bu aralıkta kayıtlı okuma yok."}
        </p>
      ) : (
        <div className="table-wrap">
          <table>
            <caption className="visually-hidden">
              Seçili sensörün seçili zaman aralığındaki telemetri okumaları
            </caption>
            <thead>
              <tr>
                <th scope="col">Zaman</th>
                <th scope="col">Toprak nemi (%)</th>
                <th scope="col">Sıcaklık (°C)</th>
                <th scope="col">Hava nemi (%)</th>
                <th scope="col">Pil (%)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((reading) => (
                <tr
                  key={reading.recordedAt}
                  className={reading.soilMoisture < MOISTURE_THRESHOLD ? "is-dry" : undefined}
                >
                  <td>{formatFullTime(reading.recordedAt)}</td>
                  <td>{reading.soilMoisture}</td>
                  <td>{reading.temperature}</td>
                  <td>{reading.airHumidity ?? "—"}</td>
                  <td>{reading.battery === null ? "—" : reading.battery.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
