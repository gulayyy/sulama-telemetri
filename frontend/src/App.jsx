import { useCallback, useEffect, useState } from "react";
import { clearToken, getToken } from "./api";
import { applyTheme, initialTheme } from "./theme";
import Dashboard from "./components/Dashboard";
import LoginForm from "./components/LoginForm";

export default function App() {
  // Token localStorage'da tutulur; sayfa yenilendiğinde oturum korunur.
  const [authenticated, setAuthenticated] = useState(() => Boolean(getToken()));
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const handleLogout = useCallback(() => {
    clearToken();
    setAuthenticated(false);
  }, []);

  if (!authenticated) {
    return <LoginForm onSuccess={() => setAuthenticated(true)} />;
  }
  return <Dashboard theme={theme} onToggleTheme={toggleTheme} onLogout={handleLogout} />;
}
