import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { hasToken, getStoredUser, logoutRequest } from '../utils/auth';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [ready, setReady] = useState(false);

  const refreshUser = useCallback(async () => {
    if (!hasToken()) return;
    try {
      // Use the generic profile endpoint that works for all roles
      const response = await api.get('/profile/');
      const profileResponse = await api.get('/student/profile/').catch(() => null);
      const updatedUser = {
        ...getStoredUser(),
        first_name: response.data.first_name,
        last_name: response.data.last_name,
        email: response.data.email,
        profile_picture: profileResponse?.data?.profile?.profile_picture ?? response.data.profile?.profile_picture,
        mute_until: profileResponse?.data?.profile?.mute_until ?? null,
        is_muted: !!(profileResponse?.data?.profile?.is_muted),
        is_suspended: !!(profileResponse?.data?.profile?.is_suspended),
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }, []);

  // Sync state from localStorage on mount
  useEffect(() => {
    if (hasToken()) {
      const storedUser = getStoredUser();
      setUser(storedUser);
      refreshUser(); // Get latest data including profile picture
    } else {
      setUser(null);
    }
    setReady(true);
  }, [refreshUser]);

  // Listen for the custom logout event fired by api.js interceptor (e.g. 401 on refresh)
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null);
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  const signIn = useCallback((userData) => {
    setUser(userData);
  }, []);

  // Calls the backend to blacklist the refresh token + clear the httpOnly cookie,
  // then clears local state. Always awaited so the cookie is gone before navigation.
  const signOut = useCallback(async () => {
    await logoutRequest();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
