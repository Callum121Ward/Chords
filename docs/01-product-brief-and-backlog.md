# Chord Simulator — Product Brief & Backlog

_Status: v0.3 implemented · Last updated 2026-10-05 · Live at https://callum121ward.github.io/Chords/_

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
17. ✅ Reverse lookup: enter any supported chord symbol, including chords outside the key and slash chords, and browse the easiest shape at each position in the current tuning. Chords with no easy shape show a message.
18. ✅ Capo support (optionally including the 5th string; key moves with the capo; Clear keeps it). Shipped 2026-09-29.
19. Left-handed neck.
20. Saved favourite shapes.
21. ✅ Fixed Warm sound; tone picker removed at user request on 2026-10-05.
22. ✅ Major and minor keys. Minor shows the seven natural-minor triads plus major V from harmonic minor. Nashville numbers stay relative to the tonic: Am = 1m, C = ♭3 in A minor.
23. ✅ Changing a tuning preset or retuning an individual string resets all strings to open; the capo stays in place.

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
- 2026-10-05: Personal use, banjo, iPhone first, current appearance and comfortable shape rules remain the goal. Updates go directly to main with git commits.
- 2026-10-05: Minor keys use natural minor plus the common major V. The numbering remains relative to the tonic's major scale, so minor-key degrees include ♭3, ♭6 and ♭7.
- 2026-10-05: Chord lookup does not change the selected key. Shapes respect slash-chord bass notes and explicit sharp/flat root spelling. A shape need not exist for every chord under the current playability rules.
- 2026-10-05: Custom tunings remember major/minor mode; older saved settings and tunings default to major.

## 5. Known iPhone/PWA constraints
- Audio can't start until the user taps something (Safari autoplay rule).
- The ring/silent switch may mute web audio. We request "playback" audio mode (iOS 17+). Sound confirmed on device 2026-09-29; silent-switch behaviour still to check.

- 2026-10-05 UI follow-up: reclaim neck space by combining note labels and chord lookup in one row, removing repeated key/legend rows, and tightening padding. All playback uses Warm, including for older saved settings.
