import { useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { requestFCMToken, onForegroundMessage, getMessagingInstance } from '../utils/firebase';

const SW_PATH = '/firebase-messaging-sw.js';
const STORAGE_KEY = 'fcm_token';

export function usePushNotifications(user) {
  const tokenRef       = useRef(null);
  const registeredRef  = useRef(false);
  const unsubscribeRef = useRef(null);

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
      localStorage.setItem(STORAGE_KEY, token);
    } catch (err) {
      console.warn('FCM: failed to save token to backend:', err);
    }
  }, []);

  // ── Delete token from backend (called on logout) ─────────────────────────
  const deleteToken = useCallback(async () => {
    const token = tokenRef.current || localStorage.getItem(STORAGE_KEY);
    if (!token) return;
    try {
      await api.delete('/fcm-tokens/delete/', { data: { token } });
    } catch { /* ignore */ }
    tokenRef.current = null;
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // ── Main setup effect ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || registeredRef.current) return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'denied') return;

    let cancelled = false;

    (async () => {
      await registerSW();

      const token = await requestFCMToken();
      if (cancelled || !token) return;

      tokenRef.current = token;
      registeredRef.current = true;

      await saveToken(token);

      // ── Token refresh listener ─────────────────────────────────────────
      // Firebase can rotate the token; listen and re-save when it does
      try {
        const { onTokenRefresh } = await import('firebase/messaging');
        const messaging = await getMessagingInstance();
        if (messaging) {
          const unsubRefresh = onTokenRefresh(messaging, async () => {
            const newToken = await requestFCMToken();
            if (newToken && newToken !== tokenRef.current) {
              // Deactivate old token
              if (tokenRef.current) {
                try {
                  await api.delete('/fcm-tokens/delete/', { data: { token: tokenRef.current } });
                } catch { /* ignore */ }
              }
              tokenRef.current = newToken;
              await saveToken(newToken);
            }
          });
          // Store for cleanup
          const prevUnsub = unsubscribeRef.current;
          unsubscribeRef.current = () => {
            if (prevUnsub) prevUnsub();
            unsubRefresh();
          };
        }
      } catch { /* onTokenRefresh not available in all SDK versions */ }

      // ── Foreground message handler ─────────────────────────────────────
      const unsubMsg = await onForegroundMessage((payload) => {
        const { title, body } = payload.notification || {};
        const notifTitle = title || 'KNHS Portal';
        const notifBody  = body  || payload.data?.message || '';
        const link       = payload.data?.link;

        const toastId = toast(
          `🔔 ${notifTitle}${notifBody ? ` — ${notifBody}` : ''}`,
          { duration: 6000, style: { maxWidth: '360px', cursor: link ? 'pointer' : 'default' } }
        );

        // Navigate on click by listening for the toast dismiss
        if (link) {
          const handler = (e) => {
            // react-hot-toast renders toasts in a portal; check if click is on this toast
            const toastEl = document.querySelector(`[data-toast-id="${toastId}"]`);
            if (toastEl && toastEl.contains(e.target)) {
              window.location.href = link;
            }
          };
          document.addEventListener('click', handler, { once: true });
        }
      });

      // Merge foreground unsub with any existing unsub
      const existingUnsub = unsubscribeRef.current;
      unsubscribeRef.current = () => {
        if (existingUnsub) existingUnsub();
        if (unsubMsg) unsubMsg();
      };
    })();

    return () => { cancelled = true; };
  }, [user, registerSW, saveToken]);

  // ── Cleanup on logout ────────────────────────────────────────────────────
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
