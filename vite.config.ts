import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // The game is served from https://<user>.github.io/dream-restaurant/
  base: '/dream-restaurant/',
  plugins: [
    react(),
    VitePWA({
      // New versions install themselves; they take over when the app is reopened.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Old Town Kitchen',
        short_name: 'Old Town Kitchen',
        description: 'A cozy restaurant game in Gdańsk’s Old Town.',
        lang: 'en',
        display: 'fullscreen',
        orientation: 'landscape',
        theme_color: '#b5452f',
        background_color: '#fbf3e4',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache every built file so the game works fully offline.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
