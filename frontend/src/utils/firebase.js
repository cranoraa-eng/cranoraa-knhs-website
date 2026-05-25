/**
 * Firebase app + FCM initialisation.
 *
 * Required .env variables (prefix with VITE_ so Vite exposes them):
 *
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_AUTH_DOMAIN
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_STORAGE_BUCKET
 *   VITE_FIREBASE_MESSAGING_SENDER_ID
 *   VITE_FIREBASE_APP_ID
 *   VITE_FIREBASE_VAPID_KEY   ← Web Push certificate public key
 *                               (Firebase Console → Project Settings →
 *                                Cloud Messaging → Web Push certificates)
 */

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'AIzaSyD5JKllrVK6oZrBmRaHEVKWdz2xTdtMqVY',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'notification-knhs.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'notification-knhs',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'notification-knhs.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID|| '117715050118',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:117715050118:web:cb20ddaa193e9ac286fb07',
};

// Initialise once — guard against HMR double-init in dev
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

/**
 * Returns the FCM Messaging instance, or null if the browser doesn't
 * support it (e.g. Safari < 16, Firefox private mode).
 */
export async function getMessagingInstance() {
  try {
    const supported = await isSupported();
    if (!supported) return null;
    return getMessaging(app);
  } catch {
    return null;
  }
}

/**
 * Request permission and return the FCM registration token.
 * Returns null if permission is denied or FCM is unsupported.
 */
export async function requestFCMToken() {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn(
      'FCM: VITE_FIREBASE_VAPID_KEY is not set.\n' +
      'Get it from: Firebase Console → Project Settings → Cloud Messaging → ' +
      'Web Push certificates → Generate key pair → copy the Key pair value.'
    );
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });

    return token || null;
  } catch (err) {
    console.warn('FCM: failed to get token:', err);
    return null;
  }
}

/**
 * Register a foreground message handler.
 * Called when the app IS in focus — the service worker won't show a
 * system notification in this case, so we handle it in-app.
 *
 * @param {(payload: object) => void} handler
 * @returns {() => void} unsubscribe function
 */
export async function onForegroundMessage(handler) {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, handler);
}
