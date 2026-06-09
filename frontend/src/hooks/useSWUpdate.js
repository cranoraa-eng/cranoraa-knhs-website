import { useCallback, useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Manages the full service worker update lifecycle.
 *
 * registerType is set to 'prompt' in vite.config.js so the SW waits
 * for our explicit signal before activating — this prevents the app
 * from reloading mid-session without user consent.
 *
 * Flow:
 *   1. New SW installs in the background (waiting state)
 *   2. needRefresh becomes true → UpdateModal appears
 *   3. User clicks "Refresh Now" → applyUpdate() → SW skips waiting → page reloads
 *   4. User clicks "Later"      → dismissUpdate() → modal hides, SW stays waiting
 *      (modal re-appears next time they open the app)
 */
export function useSWUpdate() {
  const intervalRef = useRef(null);

  const sw = useRegisterSW({
    onRegistered(registration) {
      if (!registration) return;
      // Poll for updates every 60 minutes while the app is open.
      // Render's free tier redeploys can happen any time — this catches them.
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        registration.update().catch(() => {
          // Silently ignore — user may be offline
        });
      }, 60 * 60 * 1000);
    },
    onRegisterError(error) {
      console.error('[SW] Registration failed:', error);
    },
  });

  // Extract state pairs safely — handles different plugin versions/configs
  const [needRefresh, setNeedRefresh] = Array.isArray(sw.needRefresh)
    ? sw.needRefresh
    : [!!sw.needRefresh, typeof sw.needRefresh === 'function' ? sw.needRefresh : () => {}];

  // Clean up the polling interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  /**
   * Tell the waiting SW to skip waiting and take control.
   * The page will reload automatically once the new SW activates.
   * Pass reloadPage=true so vite-plugin-pwa triggers window.location.reload().
   */
  const applyUpdate = useCallback(() => {
    if (typeof sw.updateServiceWorker === 'function') {
      sw.updateServiceWorker(true);
    }
  }, [sw.updateServiceWorker]);

  /**
   * Hide the modal without applying the update.
   * The waiting SW stays in place and the modal will reappear
   * on the next page load if the SW is still waiting.
   */
  const dismissUpdate = useCallback(() => {
    if (typeof setNeedRefresh === 'function') {
      setNeedRefresh(false);
    }
  }, [setNeedRefresh]);

  return { needRefresh, applyUpdate, dismissUpdate };
}
