# Banjo Chords

A personal, iPhone-friendly five-string banjo chord explorer. Set a tuning, tap a shape, and see its chord name, notes and Nashville number. Browse chords in a major or minor key, or use **Find a chord** to enter a chord independently of the key, such as `Bb`, `F#m7`, `D7` or `C/E`.

Minor keys show natural-minor triads and the major V commonly used in minor songs. Numbers remain relative to the tonic: in A minor, Am is 1m and C is ♭3.

Changing tuning opens all strings and retains the capo. Custom tunings and settings are saved on the device. Shape lookup returns the easiest shape at each position up to fret 15, using the playability rules in the [product brief](docs/01-product-brief-and-backlog.md). Some complex chords have no easy shape; the app says so and retains the previous shape.

## Development

Use Node.js 22.12 or newer.

```sh
npm ci
npm run dev
npm test
npm run build -- --base=/Chords/
```

Vitest covers music theory, shape validity across tunings and capos, storage, rendering and app interactions. Interaction tests use jsdom with audio playback mocked; real Safari audio, touch layout and offline updates need device checks.

Every push to `main` runs tests and builds before deploying to GitHub Pages. Changes should be committed before pushing. The app is a PWA, with generated icons and a service worker for offline use.
