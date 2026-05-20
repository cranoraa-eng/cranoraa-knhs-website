import api from './api';

// ---------------------------------------------------------------------------
// Token / session helpers
// ---------------------------------------------------------------------------

export const saveSession = (access, refresh, user) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Aliases kept for backward compatibility with existing pages
export const getUser = getStoredUser;
export const isAuthenticated = () => !!localStorage.getItem('access_token');

export const hasToken = () => !!localStorage.getItem('access_token');

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export const loginRequest = async (email, password) => {
  const { data } = await api.post('/login/', { email, password });
  
  // If user is unverified, don't save session, just return the status info
  if (data.verified === false) {
    return data;
  }

  saveSession(data.access, data.refresh, data.user || { email });
  return data.user || { email };
};

export const logoutRequest = () => {
  clearSession();
};

export const verifyOtp = async (email, code, type = 'signup') => {
  const { data } = await api.post('/verify-otp/', { email, code, type });
  return data;
};

export const resendOtp = async (email, type = 'signup') => {
  const { data } = await api.post('/resend-otp/', { email, type });
  return data;
};
