import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defaultClientConditions } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Installable app + service worker. Only the app's own files are cached (fast start, works
    // through brief network drops); API calls are never cached, so school data stays online-only.
    VitePWA({
      registerType: 'prompt', // users choose when to reload, so half-filled forms aren't lost
      injectRegister: false, // registered from src/app/PwaUpdatePrompt.tsx
      includeAssets: ['favicon.ico', 'pwa-icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: '/',
        name: 'Bareeq Cloud',
        short_name: 'Bareeq',
        description: 'School management: students, fees, payments and reports.',
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        theme_color: '#0f766e',
        background_color: '#ffffff',
        categories: ['education', 'business'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        // No runtimeCaching: the API (another origin) always goes to the network.
      },
    }),
  ],
  resolve: {
    conditions: ['source', ...defaultClientConditions],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@bareeq/shared': fileURLToPath(new URL('./src/shared/index.ts', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router'],
          ui: ['radix-ui', 'lucide-react', 'sonner'],
          data: [
            '@tanstack/react-query',
            '@tanstack/react-table',
            'zod',
            'i18next',
            'react-i18next',
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
