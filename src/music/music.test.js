import { describe, expect, test } from 'vitest'
import { BANJO, TUNINGS } from './instrument.js'
import { noteAt, playedNotes } from './fretboard.js'
import { identifyChord, intervalLabel } from './chords.js'
import { nashvilleNumber, keyChords, goesWellWith, prefersFlats } from './nashville.js'

const OPEN_G = TUNINGS.find((t) => t.name === 'Open G').notes
const X = null // muted string

// Shape is written 5th string → 1st string, like the app's neck.
const chordFor = (positions, tuning = OPEN_G) => identifyChord(playedNotes(BANJO, tuning, positions))

describe('fretboard', () => {
  test('fretting raises the note one semitone per fret', () => {
    expect(noteAt('D3', 0, 0)).toBe('D3')
    expect(noteAt('D3', 0, 2)).toBe('E3')
    expect(noteAt('B3', 0, 1)).toBe('C4')
  })

  test('short 5th string: its first fret is neck fret 6', () => {
    expect(noteAt('G4', 5, 0)).toBe('G4')
    expect(noteAt('G4', 5, 7)).toBe('A4')
    expect(() => noteAt('G4', 5, 3)).toThrow(RangeError)
  })

  test('muted strings give no note', () => {
    expect(playedNotes(BANJO, OPEN_G, [X, 0, 0, 0, 0])).toEqual([null, 'D3', 'G3', 'B3', 'D4'])
  })

  test('can spell notes with flats', () => {
    expect(noteAt('A3', 0, 1)).toBe('A#3')
    expect(noteAt('A3', 0, 1, true)).toBe('Bb3')
  })
})

describe('chord names', () => {
  test('open G strum is G, with D in the bass', () => {
    const chord = chordFor([0, 0, 0, 0, 0])
    expect(chord.name).toBe('G/D')
    expect(chord.bass).toBe('D')
  })

  test('C shape: 4th string 2, 3rd open, 2nd 1, 1st 2', () => {
    expect(chordFor([X, 2, 0, 1, 2]).name).toBe('C/E')
  })

  test('D7 shape: 4th string 4, 3rd 2, 2nd 1, 1st open', () => {
    expect(chordFor([X, 4, 2, 1, 0]).name).toBe('D7/F#')
  })

  test('Em shape: 4th string 2, 1st string 2', () => {
    expect(chordFor([X, 2, 0, 0, 2]).name).toBe('Em')
  })

  test('lists the chord notes with their roles', () => {
    expect(chordFor([X, 2, 0, 0, 2]).tones).toEqual([
      { note: 'E', role: 'R' },
      { note: 'G', role: '♭3' },
      { note: 'B', role: '5' },
    ])
  })

  test('prefers familiar names: C6 over Am7/C, Gadd9 not GMadd9', () => {
    expect(identifyChord(['C3', 'E3', 'G3', 'A3']).name).toBe('C6')
    expect(identifyChord(['G3', 'A3', 'B3', 'D4']).name).toBe('Gadd9')
    expect(identifyChord(['G3', 'A3', 'B3', 'D4']).tones.map((t) => t.role)).toEqual(['R', '3', '5', '9'])
  })

  test('offers alternative names for the same notes', () => {
    expect(chordFor([X, 2, 0, 0, 0]).alternatives).toContain('G6/E')
  })

  test('unusual chords: notes shown as played (G, not F##)', () => {
    // 5th open, 4th open, 3rd fret 2, 2nd open, 1st fret 1 in Open G
    const chord = chordFor([0, 0, 2, 0, 1])
    expect(chord.name).toBe('B7#5#9/D')
    expect(chord.tones.map((t) => `${t.note}:${t.role}`)).toEqual(['B:R', 'D#:3', 'G:♯5', 'A:♭7', 'D:♯9'])
  })

  test('hides unfamiliar alternative names', () => {
    expect(chordFor([0, 0, 0, 0, 0]).alternatives).toEqual([]) // not 'Bm#5/D'
  })

  test('a single note, or no notes, is not a chord', () => {
    expect(chordFor([X, X, 0, X, X])).toBeNull()
    expect(chordFor([X, X, X, X, X])).toBeNull()
  })

  test('interval labels', () => {
    expect(['1P', '3M', '3m', '5P', '5d', '5A', '7m', '7M', '7d'].map(intervalLabel)).toEqual([
      'R', '3', '♭3', '5', '♭5', '♯5', '♭7', '7', '♭7',
    ])
  })
})

describe('Nashville numbers', () => {
  const chord = (name, root, suffix = '', bass = null) => ({ name, root, suffix, bass })

  test('chords in the key of G', () => {
    expect(nashvilleNumber(chord('G', 'G'), 'G')).toBe('1')
    expect(nashvilleNumber(chord('C', 'C'), 'G')).toBe('4')
    expect(nashvilleNumber(chord('Em', 'E', 'm'), 'G')).toBe('6m')
    expect(nashvilleNumber(chord('Am7', 'A', 'm7'), 'G')).toBe('2m⁷')
    expect(nashvilleNumber(chord('F#dim', 'F#', 'dim'), 'G')).toBe('7°')
  })

  test('slash chords show the bass as a number too', () => {
    expect(nashvilleNumber(chord('D7/F#', 'D', '7', 'F#'), 'G')).toBe('5⁷/7')
  })

  test('chords from outside the key get a flat', () => {
    expect(nashvilleNumber(chord('F', 'F'), 'G')).toBe('♭7')
  })

  test('works from a real shape: D7 shape in G', () => {
    expect(nashvilleNumber(chordFor([X, 4, 2, 1, 0]), 'G')).toBe('5⁷/7')
  })
})

describe('key chords', () => {
  test('the seven chords of G major', () => {
    expect(keyChords('G')).toEqual([
      { number: '1', name: 'G', symbol: 'G' },
      { number: '2m', name: 'Am', symbol: 'Am' },
      { number: '3m', name: 'Bm', symbol: 'Bm' },
      { number: '4', name: 'C', symbol: 'C' },
      { number: '5', name: 'D', symbol: 'D' },
      { number: '6m', name: 'Em', symbol: 'Em' },
      { number: '7°', name: 'F#°', symbol: 'F#dim' },
    ])
  })

  test('chords that go well after Em in G are Am, C and D', () => {
    const names = goesWellWith({ root: 'E', suffix: 'm' }, 'G').map((c) => c.name)
    expect(names).toEqual(['Am', 'C', 'D'])
  })

  test('chords outside the key fall back to 1, 4 and 5', () => {
    const names = goesWellWith({ root: 'F', suffix: '' }, 'G').map((c) => c.name)
    expect(names).toEqual(['G', 'C', 'D'])
  })

  test('flat keys use flat spellings', () => {
    expect(prefersFlats('F')).toBe(true)
    expect(prefersFlats('G')).toBe(false)
  })
})
