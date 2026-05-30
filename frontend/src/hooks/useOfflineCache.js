import { useCallback } from 'react';

const CACHE_PREFIX = 'knhs_offline_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Simple localStorage-based cache for offline data.
 * Only caches non-sensitive, non-auth data.
 *
 * Safe to cache: announcements, schedules, grade summaries, attendance summaries
 * Never cache: tokens, passwords, admin-only data, private messages
 */
export function useOfflineCache() {
  const set = useCallback((key, data, ttl = DEFAULT_TTL) => {
    try {
      const entry = {
        data,
        expires: Date.now() + ttl,
        cachedAt: Date.now(),
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
      // localStorage full — silently skip caching
      console.warn('[OfflineCache] Could not cache:', key, e);
    }
  }, []);

  const get = useCallback((key) => {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (Date.now() > entry.expires) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  }, []);

  const remove = useCallback((key) => {
    localStorage.removeItem(CACHE_PREFIX + key);
  }, []);

  const clear = useCallback(() => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  }, []);

  /**
   * Fetch with offline fallback.
   * - Online: fetches fresh data, caches it, returns it
   * - Offline: returns cached data if available
   */
  const fetchWithCache = useCallback(async (key, fetchFn, ttl = DEFAULT_TTL) => {
    if (navigator.onLine) {
      try {
        const data = await fetchFn();
        set(key, data, ttl);
        return { data, fromCache: false };
      } catch (err) {
        // Network error even though "online" — try cache
        const cached = get(key);
        if (cached) return { data: cached, fromCache: true };
        throw err;
      }
    } else {
      const cached = get(key);
      if (cached) return { data: cached, fromCache: true };
      throw new Error('You are offline and no cached data is available.');
    }
  }, [set, get]);

  return { set, get, remove, clear, fetchWithCache };
}
