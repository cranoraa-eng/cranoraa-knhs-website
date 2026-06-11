import api, { clearSession } from './api';

// ---------------------------------------------------------------------------
// Token / session helpers
//
// Security model:
//   - access_token  → localStorage (short-lived: 15 min, acceptable XSS risk)
//   - refresh_token → httpOnly cookie set by the backend (never readable by JS)
//   - user          → localStorage (non-sensitive profile data for UI rendering)
//
// The refresh token is rotated server-side on every /token/refresh/ call.
// On logout, the backend blacklists the refresh token and clears the cookie.
// ---------------------------------------------------------------------------

export const saveSession = (access, user) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('user', JSON.stringify(user));
};

export { clearSession };

export const updateStoredUser = (updatedUser) => {
  const current = getStoredUser();
  const merged = { ...current, ...updatedUser };
  localStorage.setItem('user', JSON.stringify(merged));
  return merged;
};

export const updateTokens = (access) => {
  if (access) localStorage.setItem('access_token', access);
  // refresh token is managed exclusively by the httpOnly cookie — never stored here
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

export const loginRequest = async (identifier, password, role) => {
  const { data } = await api.post('/login/', {
    username: identifier,
    password,
    role,
  });

  // Backend sets the httpOnly refresh-token cookie automatically.
  // We only store the short-lived access token and user profile.
  if (data.must_change_password) {
    saveSession(data.access, data.user);
    return { ...data.user, must_change_password: true };
  }

  saveSession(data.access, data.user || { email: identifier });
  return data.user || { email: identifier };
};

export const logoutRequest = async () => {
  try {
    // Tell the backend to blacklist the refresh token and clear the cookie.
    // withCredentials is set globally on the api instance so the cookie is sent.
    await api.post('/logout/');
  } catch {
    // Even if the request fails (e.g. network error), clear local state
  } finally {
    clearSession();
  }
};

export const verifyOtp = async (email, code, type = 'signup') => {
  const { data } = await api.post('/verify-otp/', { email, code, type });
  return data;
};

export const resendOtp = async (email, type = 'signup') => {
  const { data } = await api.post('/resend-otp/', { email, type });
  return data;
};
