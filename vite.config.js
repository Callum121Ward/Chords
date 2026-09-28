import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    // Makes the app installable and usable offline.
    // It writes a manifest (name, icons, colours) and a service worker that keeps
    // a copy of the app on the phone. New versions are picked up automatically
    // the next time the app is opened with an internet connection.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: {
        name: 'Banjo Chords',
        short_name: 'Banjo Chords',
        description: 'Tap a shape on a banjo neck and see what chord it is.',
        theme_color: '#1b1814',
        background_color: '#1b1814',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
