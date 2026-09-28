import { describe, expect, test } from 'vitest'
import { BANJO, TUNINGS } from './instrument.js'
import { playedNotes } from './fretboard.js'
import { identifyChord } from './chords.js'
import { findShapes } from './shapes.js'
import { keyChords } from './nashville.js'

const tuning = (name) => TUNINGS.find((t) => t.name === name).notes
const OPEN_G = tuning('Open G')

// The chord a shape actually makes, ignoring the bass note (G/D counts as G).
const chordOf = (shape, notes = OPEN_G) => {
  const chord = identifyChord(playedNotes(BANJO, notes, shape))
  return chord && chord.root + chord.suffix
}

describe('chord shapes in Open G', () => {
  test('G: all strings open', () => {
    expect(findShapes(BANJO, OPEN_G, 'G')[0]).toEqual([0, 0, 0, 0, 0])
  })

  test('C: the classic shape (4th string 2, 2nd string 1, 1st string 2)', () => {
    expect(findShapes(BANJO, OPEN_G, 'C')[0]).toEqual([0, 2, 0, 1, 2])
  })

  test('Em: a shape that really makes Em', () => {
    expect(chordOf(findShapes(BANJO, OPEN_G, 'Em')[0])).toBe('Em')
  })

  test('D7 may leave out the 5th (A)', () => {
    const first = findShapes(BANJO, OPEN_G, 'D7')[0]
    expect(chordOf(first)).toBe('D7')
  })

  test('every chord in G has a shape, and each shape really makes that chord', () => {
    for (const { symbol } of keyChords('G')) {
      const shapes = findShapes(BANJO, OPEN_G, symbol)
      expect(shapes.length, symbol).toBeGreaterThan(0)
      for (const shape of shapes) expect(chordOf(shape), `${symbol} ${shape}`).toBe(symbol)
    }
  })
})

describe('shape rules', () => {
  const shapes = findShapes(BANJO, OPEN_G, 'D')

  test('fits within 4 frets and uses at most 4 fingers', () => {
    for (const shape of shapes) {
      const fretted = shape.filter((p) => p > 0)
      expect(fretted.length).toBeLessThanOrEqual(4)
      if (fretted.length) expect(Math.max(...fretted) - Math.min(...fretted)).toBeLessThanOrEqual(3)
    }
  })

  test('mutes at most one string apart from the 5th', () => {
    for (const shape of shapes) expect(shape.slice(1).filter((p) => p === null).length).toBeLessThanOrEqual(1)
  })

  test('shapes go up the neck, one per position', () => {
    const positions = shapes.map((s) => Math.min(...s.filter((p) => p > 0), 99))
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(new Set(positions).size).toBe(positions.length)
    expect(shapes.length).toBeGreaterThan(3)
  })

  test('the short 5th string is never fretted below fret 6', () => {
    for (const shape of shapes) expect(shape[0] === null || shape[0] === 0 || shape[0] >= 6).toBe(true)
  })

  test('works in other tunings: C in Double C (gCGCD) needs just the 1st string at fret 2', () => {
    expect(findShapes(BANJO, tuning('Double C'), 'C')[0]).toEqual([0, 0, 0, 0, 2])
  })

  test('unknown chord gives no shapes', () => {
    expect(findShapes(BANJO, OPEN_G, 'not a chord')).toEqual([])
  })
})
