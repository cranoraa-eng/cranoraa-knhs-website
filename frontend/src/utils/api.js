import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Derive the WebSocket root URL from the API_BASE_URL
// If API_BASE_URL is https://example.onrender.com/api, WS_ROOT will be wss://example.onrender.com
export const WS_ROOT = API_BASE_URL.replace('/api', '').replace('http', 'ws');

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
