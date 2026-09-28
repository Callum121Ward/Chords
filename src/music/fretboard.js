import { Note } from 'tonal'

// A finger "position" for one string is:
//   null → string is muted (not played)
//   0    → string is played open
//   n    → finger on neck fret n
//
// For the short 5th string, neck frets 1–5 don't exist, so its first
// real fret is 6 (one semitone above its open note).

// The note a string makes. `preferFlats` spells black-key notes as flats (Bb) instead of sharps (A#).
export function noteAt(openNote, startFret, fret, preferFlats = false) {
  if (fret === null) return null
  if (fret !== 0 && fret <= startFret) {
    throw new RangeError(`Fret ${fret} doesn't exist on a string that starts at fret ${startFret}`)
  }
  const semitones = fret === 0 ? 0 : fret - startFret
  const midi = Note.midi(openNote) + semitones
  return preferFlats ? Note.fromMidi(midi) : Note.fromMidiSharps(midi)
}

// The note on every string (null where muted), in string order.
export function playedNotes(instrument, tuningNotes, positions, preferFlats = false) {
  return instrument.strings.map((string, i) =>
    noteAt(tuningNotes[i], string.startFret, positions[i], preferFlats),
  )
}
