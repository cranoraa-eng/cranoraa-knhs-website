/**
 * usePushNotifications
 *
 * Handles the full FCM lifecycle for a logged-in user:
 *   1. Registers the service worker
 *   2. Requests notification permission (once)
 *   3. Gets the FCM token
 *   4. Saves the token to the backend (POST /api/fcm-tokens/)
 *   5. Listens for foreground messages and shows an in-app toast
 *   6. Deletes the token from the backend on logout
 *
 * Usage: call this hook once inside Layout (or any always-mounted
 * authenticated component). It is safe to call multiple times — it
 * de-dupes via a ref.
 */

import { useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { requestFCMToken, onForegroundMessage } from '../utils/firebase';

const SW_PATH = '/firebase-messaging-sw.js';

export function usePushNotifications(user) {
  const tokenRef        = useRef(null);   // current FCM token
  const registeredRef   = useRef(false);  // prevent double-registration
  const unsubscribeRef  = useRef(null);   // foreground message unsubscribe fn

  // ── Register service worker ──────────────────────────────────────────────
  const registerSW = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register(SW_PATH, { scope: '/' });
      await navigator.serviceWorker.ready;
      return reg;
    } catch (err) {
      console.warn('FCM SW registration failed:', err);
      return null;
    }
  }, []);

  // ── Save token to backend ────────────────────────────────────────────────
  const saveToken = useCallback(async (token) => {
    try {
      await api.post('/fcm-tokens/', { token, device_type: 'web' });
    } catch (err) {
      // Non-fatal — push just won't work until next page load
      console.warn('FCM: failed to save token to backend:', err);
    }
  }, []);

  // ── Delete token from backend (called on logout) ─────────────────────────
  const deleteToken = useCallback(async () => {
    if (!tokenRef.current) return;
    try {
      await api.delete('/fcm-tokens/delete/', { data: { token: tokenRef.current } });
    } catch {
      // Ignore — token will expire naturally
    }
    tokenRef.current = null;
  }, []);

  // ── Main setup effect ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || registeredRef.current) return;

    // Only run in browsers that support the Notifications API
    if (!('Notification' in window)) return;

    // Don't nag if already denied
    if (Notification.permission === 'denied') return;

    let cancelled = false;

    (async () => {
      await registerSW();

      const token = await requestFCMToken();
      if (cancelled || !token) return;

      tokenRef.current = token;
      registeredRef.current = true;

      await saveToken(token);

      // Listen for foreground messages and show an in-app toast
      const unsub = await onForegroundMessage((payload) => {
        const { title, body } = payload.notification || {};
        const notifTitle = title || 'KNHS Portal';
        const notifBody  = body  || payload.data?.message || '';

        toast(
          (t) => (
            <div
              className="flex items-start gap-3 cursor-pointer"
              onClick={() => {
                toast.dismiss(t.id);
                const link = payload.data?.link;
                if (link) window.location.href = link;
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 text-violet-600 text-sm">
                🔔
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 leading-tight">{notifTitle}</p>
                {notifBody && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notifBody}</p>
                )}
              </div>
            </div>
          ),
          {
            duration: 6000,
            style: { maxWidth: '360px', padding: '12px 16px' },
          }
        );
      });

      unsubscribeRef.current = unsub;
    })();

    return () => {
      cancelled = true;
    };
  }, [user, registerSW, saveToken]);

  // ── Cleanup on logout (user becomes null) ────────────────────────────────
  useEffect(() => {
    if (!user && registeredRef.current) {
      deleteToken();
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      registeredRef.current = false;
    }
  }, [user, deleteToken]);

  return { deleteToken };
}
