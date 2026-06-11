import axios from 'axios';

const RAW_API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function normalizeApiBaseUrl(apiUrl) {
  const value = apiUrl.replace(/\/+$/, '');

  try {
    const url = new URL(value);
    const pathname = url.pathname.replace(/\/+$/, '');
    url.pathname = pathname.endsWith('/api') ? pathname : `${pathname}/api`;
    return url.toString().replace(/\/+$/, '');
  } catch {
    return value.endsWith('/api') ? value : `${value}/api`;
  }
}

export const API_BASE_URL = normalizeApiBaseUrl(RAW_API_BASE_URL);

// Derive the WebSocket root URL from the API_BASE_URL using URL parsing
// so we don't accidentally corrupt URLs that contain 'http' or '/api' elsewhere.
function deriveWsRoot(apiUrl) {
  try {
    const url = new URL(apiUrl);
    url.pathname = url.pathname.replace(/\/api\/?$/, '') || '/';
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return url.toString().replace(/\/$/, '');
  } catch {
    return apiUrl.replace(/\/api\/?$/, '').replace(/^http/, 'ws');
  }
}

function deriveMediaRoot(apiUrl) {
  try {
    const url = new URL(apiUrl);
    url.pathname = url.pathname.replace(/\/api\/?$/, '') || '/';
    return url.toString().replace(/\/$/, '');
  } catch {
    return apiUrl.replace(/\/api\/?$/, '');
  }
}

export const WS_ROOT = deriveWsRoot(API_BASE_URL);
export const MEDIA_ROOT = deriveMediaRoot(API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // Send the httpOnly refresh-token cookie on same-origin requests to /api/token/
  withCredentials: true,
});

// Attach the short-lived access token (kept in memory via auth.js) to every request.
// The refresh token lives in an httpOnly cookie — JS never touches it directly.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, ask the backend to rotate the refresh token (cookie → cookie) and
// return a new access token. If that also fails, clear the session.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (!original) return Promise.reject(error);

    // Never retry the refresh endpoint itself — avoids infinite loops
    if (original.url?.includes('/token/refresh/')) {
      clearSession();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        // POST with no body — the backend reads the refresh token from the httpOnly cookie.
        // withCredentials ensures the cookie is sent cross-origin in production.
        const { data } = await axios.post(
          `${API_BASE_URL}/token/refresh/`,
          {},
          { withCredentials: true }
        );

        // Store only the short-lived access token in localStorage
        localStorage.setItem('access_token', data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        clearSession();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export function clearSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  // Dispatch a custom event so AuthContext can react without a hard reload
  window.dispatchEvent(new Event('auth:logout'));
}

export default api;
