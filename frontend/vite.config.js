import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
  plugins: [react()],
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
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/react-router-dom/') || id.includes('node_modules/react-router/')) {
            return 'vendor-router';
          }
          if (id.includes('node_modules/recharts/')) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/jspdf/') || id.includes('node_modules/xlsx/') || id.includes('node_modules/html2canvas/')) {
            return 'vendor-export';
          }
          if (id.includes('node_modules/@tanstack/')) {
            return 'vendor-query';
          }
          if (id.includes('node_modules/sweetalert2/') || id.includes('node_modules/react-hot-toast/')) {
            return 'vendor-ui';
          }
          if (id.includes('node_modules/axios/')) {
            return 'vendor-axios';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  }
})
