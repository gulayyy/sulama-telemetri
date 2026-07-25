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

const LOGIN_PATH = "/api/auth/login";

async function request(path, options = {}) {
  const token = getToken();
  const isLoginRequest = path === LOGIN_PATH;

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

  const body = await response.json().catch(() => null);

  // Giriş isteğindeki 401 'parola hatalı' demektir; diğer uçlardaki 401 ise
  // token'ın geçersiz olduğunu gösterir, o durumda saklanan token temizlenir.
  if (response.status === 401 && !isLoginRequest) {
    clearToken();
    throw new ApiError("Oturum sona erdi, tekrar giriş yapın", 401);
  }

  if (!response.ok) {
    throw new ApiError(body?.error || `İstek başarısız (${response.status})`, response.status);
  }
  return body;
}

export async function login(username, password) {
  const data = await request(LOGIN_PATH, {
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
