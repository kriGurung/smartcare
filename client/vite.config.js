import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Chunk graph tweaks: heavy vendors go into their own lazily-loaded chunks so
// the initial route only fetches the React core + that page's code.
const vendorChunks = {
  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
  'vendor-icons': ['lucide-react'],
  'vendor-http': ['axios'],
  'vendor-charts': ['recharts'],
};

// Dev server proxies /api to the Express backend so the browser only ever
// talks to one origin (avoids CORS headaches during local development).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'SmartCare — Verified Caregivers',
        short_name: 'SmartCare',
        description: 'Book verified, background-checked caregivers for home and hospital care.',
        theme_color: '#2563EB',
        background_color: '#F8FAFC',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          ...vendorChunks,
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
