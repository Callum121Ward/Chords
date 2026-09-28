import { Chord, Note } from 'tonal'

// Work out which chord a set of notes makes.
// `notes` are notes with octaves, e.g. ['D3', 'G3', 'B3', null, 'G4'] (null = muted string).
// Returns null if the notes don't form a chord.
export function identifyChord(notes) {
  // Lowest note first, so the bass note is known; then drop repeated note names.
  const sorted = notes.filter(Boolean).sort((a, b) => Note.midi(a) - Note.midi(b))
  const pitchClasses = [...new Set(sorted.map(Note.pitchClass))]
  if (pitchClasses.length < 2) return null

  const candidates = Chord.detect(pitchClasses).sort((a, b) => commonness(a) - commonness(b))
  if (candidates.length === 0) return null

  const [best, ...others] = candidates
  const { root, suffix: tonalSuffix } = splitName(best)
  const chord = Chord.get(root + tonalSuffix)
  const { suffix, bass } = splitName(tidyName(best))
  return {
    name: tidyName(best), // e.g. 'Em7/B'
    root, // 'E'
    suffix, // 'm7'
    bass, // 'B' (null when the root is the lowest note)
    alternatives: others.map(tidyName), // other valid names for the same notes, e.g. ['G6/B']
    tones: chord.notes.map((note, i) => ({ note, role: intervalLabel(chord.intervals[i]) })),
  }
}

// Chord types, most familiar first. tonal can name the same notes several ways
// (E G C is 'C/E' or 'Em#5'); we pick the name a player would most likely use.
const FAMILIAR = ['M', 'm', '7', 'm7', 'maj7', '6', 'm6', 'sus4', 'sus2', 'Madd9', 'madd9',
  '9', 'm9', '7sus4', 'dim', 'dim7', 'm7b5', 'aug', '5']

// Lower score = more natural name. Slash chords (root not in the bass) score a little worse.
function commonness(name) {
  const { suffix, bass } = splitName(name)
  const rank = FAMILIAR.indexOf(suffix)
  return (rank === -1 ? 100 : rank) + (bass ? 10 : 0)
}

// tonal writes 'GM' and 'GMadd9'; musicians write 'G' and 'Gadd9'.
function tidyName(name) {
  return name.replace(/^([A-G][#b]*)M(?=\/|$|add)/, '$1')
}

// 'Em7/B' → { root: 'E', suffix: 'm7', bass: 'B' }
export function splitName(name) {
  const [, root, suffix, bass] = name.match(/^([A-G][#b]*)(.*?)(?:\/([A-G][#b]*))?$/)
  return { root, suffix, bass: bass ?? null }
}

// Turn tonal's interval codes into the labels musicians use:
// '1P' → 'R', '3m' → '♭3', '3M' → '3', '5A' → '♯5', '7m' → '♭7'
export function intervalLabel(interval) {
  const [, number, quality] = interval.match(/^(\d+)([PMmdA]+)$/)
  if (number === '1') return 'R'
  if (quality === 'm' || quality === 'd') return '♭' + number
  if (quality === 'dd') return '♭♭' + number
  if (quality === 'A') return '♯' + number
  return number
}
