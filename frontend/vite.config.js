import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
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
        start_url: '/',
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
        // Cache name versioning
        cacheId: 'knhs-portal-v1',

        // Pre-cache all Vite build assets
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

          // ── External images (logos, avatars from CDN) ─────────────────────
          {
            urlPattern: /^https:\/\/plain-apac-prod-public\.komododecks\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'external-images-cache',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── Public announcements (safe to cache, stale-while-revalidate) ──
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

          // ── All other API calls: NetworkFirst (never serve stale auth/data) ─
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

        // Don't cache API errors or auth endpoints
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/admin\//],

        // Clean up old caches automatically
        cleanupOutdatedCaches: true,

        // Skip waiting so new SW activates immediately
        skipWaiting: true,
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
