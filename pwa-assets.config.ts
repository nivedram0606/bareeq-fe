import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

/** Generates the favicon and install icons in public/ from public/pwa-icon.svg (`pnpm pwa:icons`). */
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#0f766e' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#0f766e' } },
  },
  images: ['public/pwa-icon.svg'],
});
