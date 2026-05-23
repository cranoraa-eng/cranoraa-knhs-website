import { useState, useEffect, useCallback } from 'react';

/**
 * Tracks online/offline status and fires callbacks on change.
 * Uses both navigator.onLine and actual fetch probes for accuracy.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  const probe = useCallback(async () => {
    try {
      // Lightweight probe — HEAD request to our own origin
      const res = await fetch('/manifest.webmanifest', {
        method: 'HEAD',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true); // flag so consumers can trigger a resync
    };
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Probe every 30s to catch silent connectivity loss
    const interval = setInterval(probe, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [probe]);

  const clearWasOffline = useCallback(() => setWasOffline(false), []);

  return { isOnline, wasOffline, clearWasOffline };
}
