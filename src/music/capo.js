import { Note } from 'tonal'

// A capo is { fret, fifth }:
//   fret  → 0 for no capo, otherwise the fret it clamps
//   fifth → whether the short 5th string is capo'd too (e.g. with a railroad spike)
//
// A capo'd string behaves just like the short 5th string already does: it "starts"
// further up the neck and its open note is higher. So instead of teaching the rest
// of the app about capos, we turn (instrument, tuning, capo) into an equivalent
// instrument and tuning, and everything else works unchanged.
// Finger positions stay as real neck fret numbers; 0 still means "open" (at the capo).

export const NO_CAPO = { fret: 0, fifth: false }

// How many frets the capo raises each string by.
export function capoOffsets(instrument, capo) {
  return instrument.strings.map((string) => (string.startFret > 0 && !capo.fifth ? 0 : capo.fret))
}

export function withCapo(instrument, tuningNotes, capo) {
  const offsets = capoOffsets(instrument, capo)
  return {
    instrument: {
      ...instrument,
      strings: instrument.strings.map((string, i) => ({ ...string, startFret: string.startFret + offsets[i] })),
    },
    tuningNotes: tuningNotes.map((note, i) => Note.fromMidiSharps(Note.midi(note) + offsets[i])),
  }
}

// When the capo moves, move the fretted fingers with it, as a player would,
// so the same shape now makes a chord that's higher (or lower) by the same amount.
export function moveShapeWithCapo(positions, instrument, oldCapo, newCapo) {
  const before = capoOffsets(instrument, oldCapo)
  const after = capoOffsets(instrument, newCapo)
  return positions.map((position, i) => {
    if (!position) return position // open or muted: stays open or muted
    const moved = position + after[i] - before[i]
    const startFret = instrument.strings[i].startFret + after[i]
    return moved > startFret && moved <= instrument.frets ? moved : 0
  })
}

// The key, moved by the change in capo: capo 0 → 2 turns G into A.
export function transposeKey(key, semitones, keys) {
  const chroma = (Note.chroma(key) + semitones + 120) % 12
  return keys.find((k) => Note.chroma(k) === chroma) ?? key
}
