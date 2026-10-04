import { Key, Note } from 'tonal'

// Nashville numbers name chords by their position in the song's key:
// in G, G = 1, C = 4, D = 5, Em = 6m. Chords outside the key get a flat: F in G = ♭7.

const DEGREES = ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7']
const SUPERSCRIPT = { 2: '²', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 9: '⁹', 1: '¹', 3: '³' }

// Should notes be spelled with flats in this key? (F, Bb, Eb… → yes)
export function prefersFlats(key, mode = 'major') {
  return (mode === 'minor' ? Key.minorKey(key) : Key.majorKey(key)).alteration < 0
}

// How far a note is above the key's home note, as a scale number: in G, D → '5'.
export function degreeOf(note, key) {
  const semitones = (Note.chroma(note) - Note.chroma(key) + 12) % 12
  return DEGREES[semitones]
}

// Chord suffix in Nashville style: 'dim' → '°', 'aug' → '+', numbers raised: 'm7' → 'm⁷'.
function nashvilleSuffix(suffix) {
  return suffix
    .replace(/^dim/, '°')
    .replace(/^aug/, '+')
    .replace(/\d/g, (d) => SUPERSCRIPT[d])
}

// A chord (from identifyChord) as a Nashville number: D7/F# in G → '5⁷/7'.
export function nashvilleNumber(chord, key) {
  const number = degreeOf(chord.root, key) + nashvilleSuffix(chord.suffix)
  return chord.bass ? `${number}/${degreeOf(chord.bass, key)}` : number
}

// Major triads, or natural-minor triads plus the commonly used major V.
// `name` is for display (F#°); `symbol` is the chord in the form the music code understands (F#dim).
export function keyChords(key, mode = 'major') {
  const triads = mode === 'minor' ? Key.minorKey(key).natural.triads : Key.majorKey(key).triads
  const chords = triads.map((triad) => {
    const name = triad.replace(/dim$/, '°')
    const quality = triad.endsWith('dim') ? '°' : triad.endsWith('m') ? 'm' : ''
    return { number: degreeOf(chordRoot(triad), key) + quality, name, symbol: triad }
  })
  // Minor songs commonly use a major V from harmonic minor, alongside natural minor's v.
  if (mode === 'minor') {
    const symbol = Key.minorKey(key).harmonic.triads[4]
    chords.push({ number: '5', name: symbol, symbol })
  }
  return chords
}

const chordRoot = (symbol) => symbol.match(/^[A-G][#b]*/)[0]

// Common next chords from each scale degree in a major key (typical folk/country/bluegrass moves).
const COMMON_NEXT = {
  1: ['4', '5', '6m'],
  2: ['5', '4'],
  3: ['6m', '4'],
  4: ['5', '1', '2m'],
  5: ['1', '6m', '4'],
  6: ['2m', '4', '5'],
  7: ['1', '3m'],
}

// Chords from the key that usually sound good next, after the given chord.
// Chords from outside the key fall back to the "big three": 1, 4 and 5.
export function goesWellWith(chord, key, mode = 'major') {
  const minorNext = {
    1: ['4m', '5', '♭6'], 2: ['5', '1m'], '♭3': ['♭6', '♭7'],
    4: ['5', '1m', '♭7'], 5: ['1m', '♭6'], '♭6': ['4m', '5', '♭7'], '♭7': ['1m', '♭3'],
  }
  const numbers = mode === 'minor'
    ? minorNext[degreeOf(chord.root, key)] ?? ['1m', '4m', '5']
    : COMMON_NEXT[degreeOf(chord.root, key)] ?? ['1', '4', '5']
  const inKey = keyChords(key, mode)
  return numbers.map((n) => inKey.find((c) => c.number === n)).filter(Boolean)
}
