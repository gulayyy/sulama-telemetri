import { Logo, LogoutIcon, MoonIcon, SunIcon } from "./icons";

const STALE_AFTER_MS = 45000;

export default function Topbar({ updatedAt, theme, onToggleTheme, onLogout }) {
  const stale = updatedAt === null || Date.now() - updatedAt.getTime() > STALE_AFTER_MS;

  return (
    <header className="topbar">
      <div className="brand-mark">
        <Logo />
        Sulama Telemetri
      </div>

      <div className="topbar-actions">
        <span className="live-pill">
          <span className={stale ? "live-dot is-stale" : "live-dot"} />
          {updatedAt
            ? `${stale ? "Veri bekleniyor" : "Canlı"} · ${updatedAt.toLocaleTimeString("tr-TR")}`
            : "Bağlanıyor..."}
        </span>

        <button
          type="button"
          className="icon-button"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
          title={theme === "dark" ? "Açık tema" : "Koyu tema"}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>

        <button type="button" className="topbar-logout" onClick={onLogout}>
          <LogoutIcon />
          Çıkış
        </button>
      </div>
    </header>
  );
}
