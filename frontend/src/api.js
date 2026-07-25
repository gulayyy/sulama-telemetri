const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TOKEN_KEY = "sulama.token";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, options = {}) {
  const token = getToken();

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError("Sunucuya ulaşılamıyor", 0);
  }

  // Token süresi dolduysa saklanan token'ı temizle; App giriş ekranına döner.
  if (response.status === 401) {
    clearToken();
    throw new ApiError("Oturum sona erdi, tekrar giriş yapın", 401);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(body?.error || `İstek başarısız (${response.status})`, response.status);
  }
  return body;
}

export async function login(username, password) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  return data;
}

export const fetchSensors = () => request("/api/sensors");

export const fetchReadings = (sensorId, range) =>
  request(`/api/sensors/${sensorId}/readings?range=${range}`);

export const fetchStats = (sensorId, range) =>
  request(`/api/sensors/${sensorId}/stats?range=${range}`);

export const fetchOpenAlerts = () => request("/api/alerts?resolved=false");

export const resolveAlert = (alertId) =>
  request(`/api/alerts/${alertId}/resolve`, { method: "PATCH" });
