# UI review — 5 October 2026

## Design direction

Keep the warm colours, vertical neck and compact chord readout. They support the main job: try a shape, understand it, and hear it. The neck should remain the largest area. The user reports that the appearance, usability and suggested shapes work well, so changes should improve clarity without disrupting that familiarity.

Evidence: inspected the live app in a desktop browser, reviewed the DOM and CSS, and exercised the changed interactions with jsdom. This was not an iPhone visual or touch test. Phone keyboard behaviour, small-screen fit, dark-mode appearance and the number of visible frets need device confirmation.

## Included in this update

| Finding | Change | Intended benefit |
|---|---|---|
| Lookup was above the neck, separated from the chord shortcuts. | Put **Find a chord** in a toolbar immediately above the chord buttons. Its form opens below them. | Both ways of choosing a chord are in one place, within thumb reach. |
| The key row had no visible context or explanation of its colours. | Add the selected key and a compact **Current / Try next** legend; label the added major V in minor keys. | Make the row understandable without trial and error. |
| Main controls were only 38 px tall; chord chips were smaller. | Raise main controls and chord chips to 44 px tall; widen mute controls and enlarge shape arrows. | More forgiving tapping. Minor-key chips can still be narrower than 44 px on small phones. |
| Light-mode secondary text was faint. | Darken the shared secondary text colour. | Make tuning labels, bass notes and note roles easier to read. |
| The finder requires typing and can remain associated with the keyboard after submission. | Focus the field when opened; return focus to its toggle on close or successful submission; support Escape and a Go keyboard action. | A clearer entry and exit from lookup. Safari keyboard dismissal still needs device testing. |
| Re-rendering the chord display could disrupt a relocated form. | Keep the form outside the regenerated chord markup. | Preserve a partially typed chord while tapping the neck or changing controls. |
| Unusually long chord names and short viewports can overwhelm the fixed layout. | Allow chord names to wrap; provide a scrollable page with a fixed-height neck in short viewports. | Keep controls reachable when space is limited. |

## Recommended next improvements

### 1. Choose a root and chord type without typing — high value

Typing `F#m7` is awkward while holding a banjo, and opening the keyboard takes away much of the neck. Add a root selector and common chord types (major, minor, 7, m7, maj7, sus2, sus4, dim), with text entry retained for less common chords and inversions. Keep this inside the expandable finder so the resting screen stays compact.

### 2. Separate shape browsing from playing the neck — medium value

The floating shape navigation covers frets. Integrate previous/next controls into the chord area, or reserve space for them so they cannot cover a finger target. Compare the tradeoff on the phone: a permanently taller panel may cost more useful neck space than the current overlay.

### 3. Make string state and the short fifth string explicit — medium value

The open-circle and cross controls require interpretation; the fifth-string selector is visually far from its peg. Small string numbers and clearer open/muted states would help. Show the sounding open note when capoed separately from the underlying tuning if space allows. Avoid adding another permanent row unless it helps actual practice.

### 4. Improve recovery from resetting a shape — medium value

**Clear** resets fingers and mutes, while keeping tuning and capo. **Open strings** would describe this more precisely. A short-lived Undo action would also help after a tuning change resets the shape. Confirm whether accidental clearing is a real problem before adding more controls.

### 5. Complete accessibility for the fretboard — important follow-up

Fret targets expose button roles but are not keyboard-operable. Add a single keyboard entry point with arrow-key movement between strings/frets and Enter/Space to toggle, preserving focus when re-rendering. Test VoiceOver navigation on iPhone; hundreds of individually tabbable frets would be cumbersome. Increase the mute target height further if phone testing shows missed taps.

### 6. Refine dense information and sound controls — lower priority

Alternative chord names can make the readout grow and reduce neck space. Consider an expandable “Also…” line for long lists. A visible On/Off state for **Tap sound** would be clearer than strikethrough alone. Add a light tuning affordance to string-note menus if their editability is not obvious to the user.

## Phone acceptance checks

- In portrait, check G major and A minor: all chord names remain legible and at least six frets are visible on the user's normal device with the finder closed.
- Open the finder, type `Bb`, submit, and browse shapes. Check keyboard dismissal, focus, and whether the fretted notes remain visible.
- Try an invalid symbol and `C13#11`; the error or no-shape message must be clear without suggesting the old neck is the requested chord.
- Change tuning while a shape is selected; all strings should open and the capo should remain.
- Check light/dark mode, larger text, landscape and VoiceOver. Watch for clipped selectors, long chord names, crowded minor-key chips and overlapping controls.

The most useful next investment is the root/type picker. It removes typing from a frequent action while preserving the current practice screen.
