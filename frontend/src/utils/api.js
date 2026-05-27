import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Derive the WebSocket root URL from the API_BASE_URL using URL parsing
// so we don't accidentally corrupt URLs that contain 'http' or '/api' elsewhere.
function deriveWsRoot(apiUrl) {
  try {
    const url = new URL(apiUrl);
    // Strip the /api suffix from the pathname
    url.pathname = url.pathname.replace(/\/api\/?$/, '') || '/';
    // Switch protocol: http -> ws, https -> wss
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    // Remove trailing slash
    return url.toString().replace(/\/$/, '');
  } catch {
    // Fallback for relative or malformed URLs
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
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, try to refresh the access token once, then give up
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // If there is no config (e.g. network error before request), just reject
    if (!original) return Promise.reject(error);

    // Never retry the refresh endpoint itself
    if (original.url?.includes('/token/refresh/')) {
      clearSession();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) {
        clearSession();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/token/refresh/`, { refresh });
        localStorage.setItem('access_token', data.access);
        if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
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

function clearSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  // Dispatch a custom event so AuthContext can react without a hard reload
  window.dispatchEvent(new Event('auth:logout'));
}

export default api;
