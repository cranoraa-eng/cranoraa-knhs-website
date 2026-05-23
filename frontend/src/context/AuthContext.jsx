import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { hasToken, getStoredUser, clearSession } from '../utils/auth';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [ready, setReady] = useState(false);

  const refreshUser = useCallback(async () => {
    if (!hasToken()) return;
    try {
      const response = await api.get('/student/profile/');
      const updatedUser = {
        ...getStoredUser(),
        first_name: response.data.first_name,
        last_name: response.data.last_name,
        email: response.data.email,
        profile_picture: response.data.profile?.profile_picture,
        mute_until: response.data.profile?.mute_until,
        is_muted: response.data.profile?.is_muted,
        is_suspended: response.data.profile?.is_suspended,
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

  // Listen for the custom logout event fired by api.js interceptor
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

  const signOut = useCallback(() => {
    clearSession();
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
