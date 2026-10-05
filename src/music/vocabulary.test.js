import { expect, test } from 'vitest'
import { Note } from 'tonal'
import { Chord } from './vocabulary.js'
import { identifyChord, intervalLabel } from './chords.js'
import { findShapes } from './shapes.js'
import { playedNotes } from './fretboard.js'
import { BANJO, TUNINGS } from './instrument.js'

test('B D G C is Gadd4 with B in the bass', () => {
  expect(identifyChord(['B2', 'D3', 'G3', 'C4'])).toMatchObject({
    name: 'Gadd4/B', root: 'G', suffix: 'add4', bass: 'B',
    tones: [{ note: 'G', role: 'R' }, { note: 'B', role: '3' }, { note: 'C', role: '4' }, { note: 'D', role: '5' }],
  })
})

test('added fourth detection works in every root and inversion', () => {
  for (let root = 48; root < 60; root++) {
    const pitches = [0, 4, 5, 7].map(n => root + n)
    for (let inversion = 0; inversion < 4; inversion++) {
      const notes = pitches.map((p, i) => Note.fromMidiSharps(p + (i < inversion ? 12 : 0)))
      const chord = identifyChord(notes)
      expect(Note.chroma(chord.root)).toBe(root % 12)
      expect(chord.suffix).toBe('add4')
      expect(chord.bass && Note.chroma(chord.bass)).toBe(inversion ? pitches[inversion] % 12 : null)
    }
  }
})

test('add11 and madd11 aliases work for lookup and shape generation', () => {
  const chromas = notes => [...new Set(notes.filter(Boolean).map(Note.chroma))].sort()
  for (const [symbol, expected] of [['Gadd11', ['G', 'B', 'C', 'D']], ['Gmadd11', ['G', 'Bb', 'C', 'D']]]) {
    expect(chromas(Chord.get(symbol).notes)).toEqual(chromas(expected))
    const shapes = findShapes(BANJO, TUNINGS[0].notes, symbol)
    expect(shapes.length).toBeGreaterThan(0)
    for (const shape of shapes) expect(chromas(playedNotes(BANJO, TUNINGS[0].notes, shape))).toEqual(chromas(expected))
  }
})

test('retaining the third makes add4; replacing it makes sus4', () => {
  expect(identifyChord(['G3', 'B3', 'C4', 'D4']).name).toBe('Gadd4')
  expect(identifyChord(['G3', 'C4', 'D4']).name).toBe('Gsus4')
})

test.each([
  [['C3', 'D3', 'G3', 'Bb3'], 'C7sus2'],
  [['C3', 'E3', 'B3'], 'Cmaj7no5'],
  [['C3', 'Eb3', 'Bb3'], 'Cm7no5'],
  [['C3', 'E3', 'Bb3'], 'C7no5'],
  [['E3', 'G3', 'A3', 'C4', 'D4'], 'C6add9/E'],
])('recognises common voicing %j as %s', (notes, name) => {
  expect(identifyChord(notes).name).toBe(name)
})

test('common chords remain available among names across roots and inversions', () => {
  for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']) {
    for (const suffix of ['M', 'm', '7', 'maj7', 'm7', '6', 'm6', 'sus2', 'sus4', 'add9', 'madd9', 'add4', 'madd4', '7sus2', '7sus4', '6add9', 'maj9', '9', 'm9', 'dim', 'dim7', 'm7b5', 'aug', '5']) {
      const expected = Chord.get(root + suffix)
      for (let inversion = 0; inversion < expected.notes.length; inversion++) {
        const rootMidi = Note.midi(root + '3')
        const notes = expected.notes.map((note, i) => Note.fromMidiSharps(rootMidi + (Note.chroma(note) - Note.chroma(root) + 12) % 12 + (i < inversion ? 12 : 0)))
        const result = identifyChord(notes)
        expect(result, `${root}${suffix}: ${notes}`).not.toBeNull()
        const names = [result.name, ...result.alternatives]
        expect(names.some(name => {
          const candidate = Chord.get(name)
          return Note.chroma(candidate.tonic) === Note.chroma(root) && candidate.setNum === expected.setNum
        }), `${root}${suffix}: ${names}`).toBe(true)
      }
    }
  }
})

test('enharmonic duplicates do not change detection', () => {
  expect(identifyChord(['Db3', 'F3', 'Ab3', 'C#4']).name).toBe(identifyChord(['Db3', 'F3', 'Ab3']).name)
})

test('altered interval labels distinguish perfect and major families', () => {
  expect(['7d', '9d', '5dd', '3dd', '4AA'].map(intervalLabel)).toEqual(['♭♭7', '♭♭9', '♭♭5', '♭♭♭3', '♯♯4'])
})
