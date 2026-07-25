import { RANGES } from "../constants";
import { ChartIcon, TableIcon } from "./icons";

// Filtreler tek satırda ve kapsadığı her şeyin üstünde durur;
// grafik kartlarının içine gömülmez.
export default function FilterBar({ sensorName, range, onRangeChange, view, onViewChange }) {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <span>Seçili sensör</span>
        <strong>{sensorName ?? "—"}</strong>
      </div>

      <div className="filter-group">
        <div className="segmented" role="group" aria-label="Zaman aralığı">
          {RANGES.map((option) => (
            <button
              key={option.value}
              type="button"
              className={option.value === range ? "is-active" : undefined}
              aria-pressed={option.value === range}
              onClick={() => onRangeChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="segmented" role="group" aria-label="Görünüm">
          <button
            type="button"
            className={view === "chart" ? "is-active" : undefined}
            aria-pressed={view === "chart"}
            onClick={() => onViewChange("chart")}
          >
            <ChartIcon />
            Grafik
          </button>
          <button
            type="button"
            className={view === "table" ? "is-active" : undefined}
            aria-pressed={view === "table"}
            onClick={() => onViewChange("table")}
          >
            <TableIcon />
            Tablo
          </button>
        </div>
      </div>
    </div>
  );
}
