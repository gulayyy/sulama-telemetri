import { useCallback, useState } from "react";
import { clearToken, getToken } from "./api";
import Dashboard from "./components/Dashboard";
import LoginForm from "./components/LoginForm";

export default function App() {
  // Token localStorage'da tutulur; sayfa yenilendiğinde oturum korunur.
  const [authenticated, setAuthenticated] = useState(() => Boolean(getToken()));

  const handleLogout = useCallback(() => {
    clearToken();
    setAuthenticated(false);
  }, []);

  if (!authenticated) {
    return <LoginForm onSuccess={() => setAuthenticated(true)} />;
  }
  return <Dashboard onLogout={handleLogout} />;
}
