// Session utilities - extracted to break circular dependency between api.js and auth.js

import { clearAccessToken } from './auth';

export const clearSession = () => {
  clearAccessToken();
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth:logout'));
};