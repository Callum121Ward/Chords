# Chord Simulator — Product Brief & Backlog

_Status: v0.1 live, v0.2 in progress · Last updated 2026-09-29 · Live at https://callum121ward.github.io/Chords/_

## 1. Product brief

**Problem.** When playing banjo in alternate tunings, it's hard to know what chord a
given finger shape makes, what notes are in it, and how it fits into the key of a song.

**Solution.** An iPhone-friendly web app (PWA) showing a virtual 5-string banjo neck.
The user sets their own tuning, taps frets to place fingers, and the app names the chord,
lists its notes, gives its Nashville number in the chosen key, and suggests chords that
go well with it. It can play the chord through the speaker.

**User.** Just me (single user, personal use). No accounts, no server, no sharing.

**Platform.** Progressive Web App, installed to the iPhone home screen from Safari.
Hosted free on GitHub Pages.

**Success looks like.**
- I can set a tuning, tap a shape, and see the correct chord name, notes and number in under 10 seconds.
- It works offline once installed.
- I actually use it while practising.

**Out of scope (for now).** Microphone, other instruments, accounts, cloud sync, payments, App Store.

## 2. Tech stack

| Concern | Choice | Why |
|---|---|---|
| Language | JavaScript (plain, no framework) | Simplest to learn; can add TypeScript later |
| Build tool | Vite | Fast local dev server, trivial setup |
| Drawing the neck | SVG | Crisp at any size, easy tap targets |
| Music theory | [tonal](https://github.com/tonaljs/tonal) library | Proven chord detection, keys, intervals |
| Sound out | Web Audio API | Built into Safari |
| Tests | Vitest | Same tooling as Vite |
| Hosting / CI | GitHub + GitHub Actions → GitHub Pages | Free, auto-deploys on push |

## 3. Backlog (MoSCoW)

### Must have — MVP (v0.1) ✅ shipped 2026-09-28
1. **Show a neck.** I see a 5-string banjo neck (strings, frets, position markers).
2. **Custom tuning.** I can set each string's note (default open G: g D G B D) and save presets.
3. **5th-string handling.** The short 5th (drone) string starts at the 5th fret, as on a real banjo.
4. **Place fingers.** I tap a fret to place/remove a finger; one note per string; each string can be open, fretted or muted.
5. **Name the chord.** The app shows the chord name (e.g. "G", "Em7/B"), or "no chord" if the shape isn't one.
6. **Show the notes.** The app lists each string's note, and the chord's notes with their role (root, 3rd, 5th, 7th…).
7. **Key & Nashville number.** I pick a key (defaults to one that suits the tuning, e.g. G for open G). The app shows the chord's Nashville number in that key (e.g. D7 in G → **5⁷**; Em → **6m**); a chord outside the key is shown with a flat/sharp (e.g. F in G → **♭7**).
8. **Chords that go with it.** The app shows the chords in the key with their numbers (1, 2m, 3m, 4, 5, 6m, 7°) and highlights the most common next chords from the current one (e.g. from 1 → 4, 5, 6m).
9. **Works on iPhone.** Layout fits a phone screen and is usable with a thumb.

### Should have (v0.2) ✅ shipped 2026-09-29
10. ✅ **Play the chord** through the speaker (strummed and one note at a time). Tapping the neck plays that string.
11. ✅ **Alternative names & inversion** (e.g. "C6 = Am7/C"; bass note shown). Unusual names are flagged.
12. ✅ **Installable & offline** (PWA manifest + service worker, banjo icon).
13. ✅ **Tap a suggested chord** to see a shape for it on the neck in the current tuning. Easiest shape near the nut first; ‹ › step through the best shape at each position up the neck.

### Could have (later)
14. Microphone tuner for the real banjo.
15. Microphone chord recognition (hard).
16. Other instruments (guitar, mandolin, ukulele, 4-string banjo).
17. Reverse lookup: pick any chord, see all shapes for it in the current tuning.
18. Capo support.
19. Left-handed neck.
20. Saved favourite shapes.

### Won't have (this version)
- Accounts, sync, sharing, payments, App Store release.

## 4. Decisions log
- 2026-09-28: PWA rather than native. Personal use, and development is on Windows.
- 2026-09-28: Microphone moved out of the MVP.
- 2026-09-28: Banjo only for the MVP. Code should still keep instrument details (string count, short strings) in data, so other instruments can be added later.
- 2026-09-28: MVP adds Nashville numbers (relative to a user-chosen key), per-note display and harmonising chords.
- 2026-09-28: Show the chord name without the slash (G), with the bass note underneath (D in bass).
- 2026-09-29: Chord notes are spelled the way they're played (G, not F##), even when theory would spell them differently.
- 2026-09-29: Sound is synthesised (Karplus–Strong), so no audio files are needed.
- 2026-09-29: Play buttons sit at the very bottom, so they don't move as the chord panel changes size.
- 2026-09-29: Compact chord panel (unusual-chord note removed) so an iPhone 17 shows 6+ frets.
- 2026-09-29: Playable shape = all chord notes (5th optional in 4-note chords), within 4 frets, max 4 fingers, max 1 muted string besides the 5th.

## 5. Known iPhone/PWA constraints
- Audio can't start until the user taps something (Safari autoplay rule).
- The ring/silent switch may mute web audio. We request "playback" audio mode (iOS 17+). Sound confirmed on device 2026-09-29; silent-switch behaviour still to check.
