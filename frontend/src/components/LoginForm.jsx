import { useState } from "react";
import { login } from "../api";
import {
  AlertIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  Logo,
  UserIcon,
} from "./icons";

const FEATURES = [
  "5 sanal sensörden 10 saniyede bir canlı telemetri",
  "Toprak nemi eşiğin altına düşünce otomatik sulama uyarısı",
  "Son 1 saat / 24 saat / 7 gün için nem ve sıcaklık analizi",
];

export default function LoginForm({ onSuccess }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-layout">
      <aside className="login-brand">
        <div className="login-brand-grid" />

        <div className="brand-mark">
          <Logo />
          Sulama Telemetri
        </div>

        <div className="login-pitch">
          <h2>Tarladaki her damla ölçülebilir.</h2>
          <p>
            Toprak nemi, sıcaklık, hava nemi ve pil seviyesi tek ekranda. Sulama kararını
            veriye dayandırın.
          </p>
          <ul className="login-features">
            {FEATURES.map((feature) => (
              <li key={feature}>
                <CheckIcon />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <p className="login-footnote">Yonca Teknoloji · Suyabakan akıllı tarım hattı</p>
      </aside>

      <main className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <h1>Panele giriş</h1>
          <p>Devam etmek için hesap bilgilerinizi girin.</p>

          <div className="field">
            <label htmlFor="username">Kullanıcı adı</label>
            <div className="field-input">
              <UserIcon />
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="password">Parola</label>
            <div className="field-input">
              <LockIcon />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Parolayı gizle" : "Parolayı göster"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {error && (
            <p className="notice" role="alert">
              <AlertIcon />
              {error}
            </p>
          )}

          <button type="submit" className="submit" disabled={busy}>
            {busy ? "Giriş yapılıyor..." : "Giriş yap"}
          </button>

          <p className="login-hint">
            Demo hesabı: <code>admin</code> / <code>sulama123</code>
          </p>
        </form>
      </main>
    </div>
  );
}
