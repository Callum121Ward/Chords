// Generates the app icons (home screen, browser tab) from public/icon.svg.
// Run with: npm run icons
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    // The icon already has a full-bleed background, so fill the whole square.
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: { background: '#b5561f' } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: '#b5561f' } },
  },
  images: ['public/icon.svg'],
})
