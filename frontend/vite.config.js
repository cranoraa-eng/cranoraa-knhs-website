import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt' = new SW installs but waits; our UpdateModal controls when it activates.
      // This prevents silent mid-session reloads and gives users control.
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: 'Kiwalan National High School Portal',
        short_name: 'KNHS Portal',
        description: 'School management portal for students, teachers, and administrators.',
        theme_color: '#1A0B2E',
        background_color: '#1A0B2E',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/login',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'Go to your dashboard',
            url: '/dashboard',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Messages',
            short_name: 'Messages',
            description: 'Open messages',
            url: '/messages',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Announcements',
            short_name: 'Announcements',
            description: 'View announcements',
            url: '/announcements',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
        ],
        categories: ['education', 'productivity'],
      },
      workbox: {
        // Bump this version string on every deploy to bust old caches.
        // vite-plugin-pwa auto-versions the precache manifest, but this
        // ensures runtime caches are also invalidated cleanly.
        cacheId: 'knhs-portal-v2',

        // Pre-cache all Vite build assets (hashed filenames = safe forever)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

        // Runtime caching strategies
        runtimeCaching: [
          // ── Google Fonts ──────────────────────────────────────────────────
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── External images (school logo CDN) ─────────────────────────────
          {
            urlPattern: /^https:\/\/plain-apac-prod-public\.komododecks\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'external-images-cache',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── Public announcements (safe, stale-while-revalidate) ───────────
          {
            urlPattern: ({ url }) =>
              url.pathname.includes('/api/') &&
              url.pathname.includes('/announcements/public/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'public-announcements-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 2 },
              cacheableResponse: { statuses: [200] },
            },
          },

          // ── Website content (public pages) ────────────────────────────────
          {
            urlPattern: ({ url }) =>
              url.pathname.includes('/api/') &&
              url.pathname.includes('/website-content/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'website-content-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 6 },
              cacheableResponse: { statuses: [200] },
            },
          },

          // ── Media files (uploaded materials, avatars) ─────────────────────
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/media/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'media-cache',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── NEVER cache these — always live data ──────────────────────────
          // grades, attendance, messages, notifications, analytics, realtime
          {
            urlPattern: ({ url }) =>
              url.pathname.includes('/api/') && (
                url.pathname.includes('/grades/') ||
                url.pathname.includes('/grade-reports/') ||
                url.pathname.includes('/attendance/') ||
                url.pathname.includes('/chat/') ||
                url.pathname.includes('/notifications/') ||
                url.pathname.includes('/analytics') ||
                url.pathname.includes('/token/') ||
                url.pathname.includes('/login/') ||
                url.pathname.includes('/admin/')
              ),
            handler: 'NetworkOnly',
            options: { cacheName: 'never-cache' },
          },

          // ── All other API calls: NetworkFirst ─────────────────────────────
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],

        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/admin\//],

        // Clean up caches from previous versions automatically
        cleanupOutdatedCaches: true,

        // With registerType: 'prompt', the SW waits for our explicit signal.
        // skipWaiting is called by updateServiceWorker(true) in useSWUpdate.
        skipWaiting: false,
        clientsClaim: true,
      },
      devOptions: {
        // Enable SW in dev for testing (disable if it causes issues)
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching and smaller initial load
        manualChunks(id) {
          // Core React runtime
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // Router
          if (id.includes('node_modules/react-router-dom/') || id.includes('node_modules/react-router/')) {
            return 'vendor-router';
          }
          // Charts (large, lazy-loadable)
          if (id.includes('node_modules/recharts/')) {
            return 'vendor-charts';
          }
          // PDF / Excel export (large, rarely used)
          if (id.includes('node_modules/jspdf/') || id.includes('node_modules/xlsx/') || id.includes('node_modules/html2canvas/')) {
            return 'vendor-export';
          }
          // Query
          if (id.includes('node_modules/@tanstack/')) {
            return 'vendor-query';
          }
          // UI utilities
          if (id.includes('node_modules/sweetalert2/') || id.includes('node_modules/react-hot-toast/')) {
            return 'vendor-ui';
          }
          // Axios
          if (id.includes('node_modules/axios/')) {
            return 'vendor-axios';
          }
          // Workbox (PWA)
          if (id.includes('node_modules/workbox-') || id.includes('virtual:pwa-register')) {
            return 'vendor-pwa';
          }
        },
      },
    },
    // Raise warning threshold slightly since we're splitting properly
    chunkSizeWarningLimit: 600,
  },
})
