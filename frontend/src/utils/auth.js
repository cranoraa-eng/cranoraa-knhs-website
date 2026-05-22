import api from './api';

// ---------------------------------------------------------------------------
// Token / session helpers
// ---------------------------------------------------------------------------

export const saveSession = (access, refresh, user) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
  localStorage.setItem('user', JSON.stringify(user));
};

export const updateStoredUser = (user) => {
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

export const loginRequest = async (identifier, password) => {
  const { data } = await api.post('/login/', { 
    username: identifier, // Use username field for both email and student ID
    password 
  });
  
  // If forced password change is required, we still save session but redirect
  if (data.must_change_password) {
    saveSession(data.access, data.refresh, data.user);
    return { ...data.user, must_change_password: true };
  }

  saveSession(data.access, data.refresh, data.user || { email: identifier });
  return data.user || { email: identifier };
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
