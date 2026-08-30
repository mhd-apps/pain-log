import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves this project at /pain-log/. The build and `vite preview`
// both need that prefix so preview matches production; only the dev server,
// which serves from the root, keeps '/'.
const BASE = '/pain-log/'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? BASE : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registration is done from src/main.tsx so the app can also re-check for
      // updates when it is resumed — a home-screen PWA is suspended rather than
      // closed, so a load-time-only check can leave it on an old version forever.
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: '痛み日誌',
        short_name: '痛み日誌',
        description: '痛みの記録を3秒でつける個人用日誌アプリ',
        theme_color: '#8aa8b7',
        background_color: '#f4f1ec',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
}))
