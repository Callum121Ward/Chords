# Chord vocabulary review — 5 October 2026

## Changes

- Register major add4 with add11 as a lookup alias. B–D–G–C now resolves to Gadd4/B; the screen displays Gadd4 and B in bass.
- Accept madd11 as an alias of the existing madd4 type.
- Add 7sus2, previously missing from the dictionary.
- Recognise major and minor sevenths without a fifth, explicitly labelled maj7no5 and m7no5. Dominant 7no5 was already supported.
- Include common added, suspended, extended and altered types in the familiar-name ranking and alternatives. Previously, types such as 6add9 and maj9 were treated as unfamiliar and could lose to obscure interpretations or disappear from the alternatives.
- Deduplicate enharmonic pitch classes while preserving the lowest note's spelling.
- Correct repeated diminished/augmented interval labels using the interval family, including compound intervals.
- Use the same extended vocabulary for identification, typed lookup and shape search. Keep all four notes in suggested add4/madd4 shapes so lookup does not produce an incomplete added-fourth chord.

## Coverage

Regression tests cover the reported voicing, all 12 roots and four inversions of add4, aliases, generated shapes, the distinction between add4 and sus4, omitted-fifth seventh chords, 6add9 inversion naming, enharmonic duplicates and altered interval labels. A wider sweep checks 24 common chord types in 12 roots and their inversions, ensuring the expected interpretation remains available as the main or an alternative name. UI tests verify both Gadd4 and Gadd11 through the finder.

## Limits still worth knowing

- Naming uses the notes and bass, not the song's harmonic context. Identical notes can reasonably have different names, such as C6 and Am7/C. Alternatives are intentional.
- Added fourth and added eleventh share pitch classes. The app uses add4 as the display name; it does not infer a different name from the octave spacing.
- Rootless voicings and arbitrary missing-note chords are not inferred. The new seventh types explicitly mark the missing fifth, rather than implying it is sounding.
- This is a bounded common-chord audit, not exhaustive coverage of every library chord. Unusual combinations may still receive unusual names.
- Shape search still follows the existing finger, stretch and mute limits. A recognised chord may have no easy shape in a given tuning.
