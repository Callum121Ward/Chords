import { expect, test } from 'vitest'
import { keyChords, goesWellWith, prefersFlats, nashvilleNumber } from './nashville.js'
import { BANJO, TUNINGS } from './instrument.js'
import { findShapes } from './shapes.js'
import { playedNotes } from './fretboard.js'
import { identifyChord } from './chords.js'

test('A minor has natural minor chords and major V, numbered relative to A', () => {
  expect(keyChords('A', 'minor').map(c => [c.symbol, c.number])).toEqual([
    ['Am', '1m'], ['Bdim', '2°'], ['C', '♭3'], ['Dm', '4m'],
    ['Em', '5m'], ['F', '♭6'], ['G', '♭7'], ['E', '5'],
  ])
  expect(nashvilleNumber({ root: 'C', suffix: '', bass: null }, 'A')).toBe('♭3')
})

test('minor keys use their own key signature for spelling', () => {
  expect(prefersFlats('C', 'minor')).toBe(true)
  expect(prefersFlats('E', 'minor')).toBe(false)
})

test('minor suggestions include the dominant and resolve back to the tonic', () => {
  expect(goesWellWith({ root: 'A' }, 'A', 'minor').map(c => c.symbol)).toEqual(['Dm', 'E', 'F'])
  expect(goesWellWith({ root: 'E' }, 'A', 'minor').map(c => c.symbol)).toEqual(['Am', 'F'])
  expect(goesWellWith({ root: 'Bb' }, 'A', 'minor').map(c => c.symbol)).toEqual(['Am', 'Dm', 'E'])
})

test('minor suggestions always resolve to a displayed chord in every key', () => {
  for (const key of ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']) {
    const chords = keyChords(key, 'minor')
    expect(chords).toHaveLength(8)
    for (const chord of chords) {
      const root = chord.symbol.match(/^[A-G][#b]*/)[0]
      expect(goesWellWith({ root }, key, 'minor').length).toBeGreaterThan(0)
    }
  }
})

test('arbitrary chord lookup supports out-of-key chords and requested bass notes', () => {
  const tuning = TUNINGS[0].notes
  for (const symbol of ['Bb', 'F#m7', 'D7', 'C/E']) {
    const shapes = findShapes(BANJO, tuning, symbol)
    expect(shapes.length, symbol).toBeGreaterThan(0)
    if (symbol === 'C/E') {
      for (const shape of shapes) expect(identifyChord(playedNotes(BANJO, tuning, shape)).name).toBe('C/E')
    }
  }
})
