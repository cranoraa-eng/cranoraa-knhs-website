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
 * The Firebase config values below are injected at build time via
 * Vite's import.meta.env, but service workers cannot use ES modules or
 * import.meta, so we read them from a self.__FIREBASE_CONFIG object that
 * we write into the HTML via a <script> tag, OR we hard-code them here.
 *
 * SIMPLEST APPROACH: hard-code the public (non-secret) Firebase config
 * directly in this file. These values are safe to expose — they only
 * identify your Firebase project, not grant admin access.
 */

// ─── Replace these with your actual Firebase project config ──────────────────
// You can find them in Firebase Console → Project Settings → General → Your apps
const FIREBASE_CONFIG = {
  apiKey:            self.VITE_FIREBASE_API_KEY            || '__VITE_FIREBASE_API_KEY__',
  authDomain:        self.VITE_FIREBASE_AUTH_DOMAIN        || '__VITE_FIREBASE_AUTH_DOMAIN__',
  projectId:         self.VITE_FIREBASE_PROJECT_ID         || '__VITE_FIREBASE_PROJECT_ID__',
  storageBucket:     self.VITE_FIREBASE_STORAGE_BUCKET     || '__VITE_FIREBASE_STORAGE_BUCKET__',
  messagingSenderId: self.VITE_FIREBASE_MESSAGING_SENDER_ID|| '__VITE_FIREBASE_MESSAGING_SENDER_ID__',
  appId:             self.VITE_FIREBASE_APP_ID             || '__VITE_FIREBASE_APP_ID__',
};
// ─────────────────────────────────────────────────────────────────────────────

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
