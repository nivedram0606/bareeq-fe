import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defaultClientConditions } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
          supabase: ['@supabase/supabase-js'],
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
