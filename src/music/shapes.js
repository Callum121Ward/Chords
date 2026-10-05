import { Note } from 'tonal'
import { Chord } from './vocabulary.js'

// Finds playable shapes for a chord in the current tuning.
// A shape is a list of positions, one per string (null = muted, 0 = open, n = fret),
// in the same string order as everywhere else (5th string first).

const MAX_FRET = 15
const MAX_STRETCH = 3 // highest fretted fret minus lowest: 3 means the shape fits within 4 frets
const MAX_FINGERS = 4

export function findShapes(instrument, tuningNotes, chordSymbol) {
  const chord = Chord.get(chordSymbol)
  if (chord.empty) return []
  const chordChromas = new Set(chord.notes.map(Note.chroma))
  const rootChroma = Note.chroma(chord.tonic)
  // In chords of 4+ notes, players often leave out the 5th; allow that.
  const fifthIndex = chord.intervals.findIndex((i) => i === '5P')
  // Retain the fifth in added-fourth chords: otherwise the new vocabulary no
  // longer describes the complete set, and recognition can become ambiguous.
  const addedFourth = chord.type === 'major added fourth' || chord.aliases.includes('madd4')
  const optional = chord.notes.length >= 4 && fifthIndex >= 0 && !addedFourth ? Note.chroma(chord.notes[fifthIndex]) : null
  const required = [...chordChromas].filter((c) => c !== optional)

  // For each string: every position that plays a chord note (or mutes the string).
  const choices = instrument.strings.map((string, i) => {
    const openMidi = Note.midi(tuningNotes[i])
    const options = [null]
    if (chordChromas.has(openMidi % 12)) options.push(0)
    for (let fret = string.startFret + 1; fret <= Math.min(MAX_FRET, instrument.frets); fret++) {
      if (chordChromas.has((openMidi + fret - string.startFret) % 12)) options.push(fret)
    }
    return options
  })

  const shapes = []
  const walk = (i, positions) => {
    if (i === choices.length) {
      const scored = score(positions, instrument, tuningNotes, required, rootChroma)
      if (scored) {
        const midis = positions.map((p, j) => p === null ? Infinity : Note.midi(tuningNotes[j]) + (p === 0 ? 0 : p - instrument.strings[j].startFret))
        if (!chord.bass || Math.min(...midis) % 12 === Note.chroma(chord.bass)) shapes.push(scored)
      }
      return
    }
    for (const option of choices[i]) walk(i + 1, [...positions, option])
  }
  walk(0, [])

  // Keep the easiest shape at each position on the neck, then order them from the nut upwards.
  const bestAt = new Map()
  for (const shape of shapes) {
    const current = bestAt.get(shape.position)
    if (!current || shape.difficulty < current.difficulty) bestAt.set(shape.position, shape)
  }
  return [...bestAt.values()].sort((a, b) => a.position - b.position).map((s) => s.positions)
}

// Returns { positions, position, difficulty } for a playable shape, or null if it isn't playable.
function score(positions, instrument, tuningNotes, required, rootChroma) {
  const fretted = positions.filter((p) => p > 0)
  const mutedOthers = positions.slice(1).filter((p) => p === null).length // 5th string may be muted freely
  if (mutedOthers > 1 || fretted.length > MAX_FINGERS) return null
  const lowest = fretted.length ? Math.min(...fretted) : 0
  const highest = fretted.length ? Math.max(...fretted) : 0
  if (highest - lowest > MAX_STRETCH) return null

  // Which notes sound, and which is lowest in pitch (the bass)?
  const midis = positions
    .map((p, i) => (p === null ? null : Note.midi(tuningNotes[i]) + (p === 0 ? 0 : p - instrument.strings[i].startFret)))
    .filter((m) => m !== null)
  const sounding = new Set(midis.map((m) => m % 12))
  if (!required.every((c) => sounding.has(c))) return null
  const bassIsRoot = Math.min(...midis) % 12 === rootChroma

  const difficulty =
    fretted.length * 2 + // each finger
    (highest - lowest) + // stretch
    (positions[0] === null ? 1 : 0) + // muting the 5th string is easy but not free
    mutedOthers * 4 + // muting an inner string is awkward
    (bassIsRoot ? 0 : 1)
  return { positions, position: lowest, difficulty }
}
