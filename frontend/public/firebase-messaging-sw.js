/**
 * Firebase Cloud Messaging Service Worker
 *
 * Must live at the root path so the browser registers it as
 * /firebase-messaging-sw.js (Vite serves everything in /public at root).
 *
 * This file handles BACKGROUND push messages — i.e. when the tab is closed
 * or the app is not in focus. Foreground messages are handled in the app
 * itself via onMessage() in src/utils/firebase.js.
 *
 * SECURITY: Firebase config is injected at build time by the
 * injectFirebaseConfigIntoSW Vite plugin (see vite.config.js).
 * The __FIREBASE_CONFIG_PLACEHOLDER__ token is replaced with the actual
 * values from VITE_FIREBASE_* environment variables during `vite build`.
 *
 * For local development, the SW is disabled (devOptions.enabled = false in
 * vite.config.js), so this file is not executed during `vite dev`.
 */

// ─── Firebase config injected at build time ───────────────────────────────────
// DO NOT hardcode values here. Set VITE_FIREBASE_* in your .env file.
const FIREBASE_CONFIG = __FIREBASE_CONFIG_PLACEHOLDER__;

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp(FIREBASE_CONFIG);

const messaging = firebase.messaging();

/**
 * Handle background messages.
 * Called when the app is not in the foreground (tab closed / minimised).
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  const { title, body, icon } = payload.notification || {};
  const data = payload.data || {};

  const notificationTitle = title || 'KNHS Portal';
  const notificationOptions = {
    body: body || '',
    icon: icon || '/icon-192.png',
    badge: '/badge-72.png',
    tag: data.notification_id || 'knhs-notification',   // deduplicates same-type toasts
    data: {
      url: data.link || '/',
      ...data,
    },
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * Open / focus the correct tab when the user clicks the notification.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // If a tab with the portal is already open, focus it and navigate
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        // Otherwise open a new tab
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

/**
 * CRITICAL: Do NOT intercept fetch or navigate events.
 *
 * The Workbox PWA service worker (sw.js, registered by vite-plugin-pwa)
 * handles all caching, navigation fallback, and the skipWaiting reload flow.
 *
 * If this SW intercepts fetch events it will:
 *   1. Break the Workbox SW update flow (causing the "stuck on Applying update" bug)
 *   2. Interfere with API calls and page navigations
 *
 * This SW is ONLY for FCM push message handling — nothing else.
 */
self.addEventListener('fetch', () => {
  // Intentionally empty — pass all requests through to Workbox SW / network
});

// Do NOT call self.skipWaiting() or self.clients.claim() here.
// Those are managed exclusively by the Workbox SW.
