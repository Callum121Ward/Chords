// What a 5-string banjo looks like, and some common tunings.
//
// Strings are listed left → right as you look at the neck in the app:
// the short 5th (drone) string first, then 4, 3, 2, 1.
// Every list of notes or finger positions in the app uses this same order.

export const BANJO = {
  name: '5-string banjo',
  frets: 22,
  strings: [
    { label: '5', startFret: 5 }, // short drone string: its "open" note sounds at the 5th fret
    { label: '4', startFret: 0 },
    { label: '3', startFret: 0 },
    { label: '2', startFret: 0 },
    { label: '1', startFret: 0 },
  ],
}

// Notes include the octave number (e.g. 'D3') so we know the real pitch
// (needed to find the lowest/bass note, and later to play sounds).
export const TUNINGS = [
  { name: 'Open G', notes: ['G4', 'D3', 'G3', 'B3', 'D4'], key: 'G' },
  { name: 'Double C', notes: ['G4', 'C3', 'G3', 'C4', 'D4'], key: 'C' },
  { name: 'Sawmill (G modal)', notes: ['G4', 'D3', 'G3', 'C4', 'D4'], key: 'G' },
  { name: 'Standard C', notes: ['G4', 'C3', 'G3', 'B3', 'D4'], key: 'C' },
  { name: 'Open D', notes: ['F#4', 'D3', 'F#3', 'A3', 'D4'], key: 'D' },
  { name: 'Double D', notes: ['A4', 'D3', 'A3', 'D4', 'E4'], key: 'D' },
]
