// Session utilities - centralized token storage to break circular dependencies

// In-memory access token - NOT accessible to XSS scripts
let _accessToken = null;

export const saveSession = (access, user) => {
  _accessToken = access;
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAccessToken = () => {
  _accessToken = null;
};

export const getAccessToken = () => _accessToken;

export const updateTokens = (access) => {
  if (access) _accessToken = access;
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const updateStoredUser = (updatedUser) => {
  const current = getStoredUser();
  const merged = { ...current, ...updatedUser };
  localStorage.setItem('user', JSON.stringify(merged));
  return merged;
};

export const clearSession = () => {
  clearAccessToken();
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth:logout'));
};
