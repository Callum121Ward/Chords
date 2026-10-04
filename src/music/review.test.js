import { describe, expect, test } from 'vitest'
import { Chord, Note } from 'tonal'
import { BANJO, TUNINGS } from './instrument.js'
import { withCapo, moveShapeWithCapo, NO_CAPO } from './capo.js'
import { playedNotes } from './fretboard.js'
import { findShapes } from './shapes.js'
import { identifyChord } from './chords.js'
import { keyChords } from './nashville.js'

describe('review: shapes across tunings, keys and capos', () => {
  for (const tuning of TUNINGS) {
    test(tuning.name, () => {
      for (const fret of [0, 2, 5, 9]) {
        for (const fifth of [false, true]) {
          const { instrument, tuningNotes } = withCapo(BANJO, tuning.notes, { fret, fifth })
          for (const key of ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']) {
            for (const { symbol } of keyChords(key)) {
              const expected = new Set(Chord.get(symbol).notes.map(Note.chroma))
              const shapes = findShapes(instrument, tuningNotes, symbol)
              for (const shape of shapes) {
                const actual = new Set(playedNotes(instrument, tuningNotes, shape).filter(Boolean).map(Note.chroma))
                expect([...actual].sort(), `${symbol}: ${shape}`).toEqual([...expected].sort())
                expect(shape.every((p, i) => p === null || p === 0 || (p > instrument.strings[i].startFret && p <= instrument.frets))).toBe(true)
                const fretted = shape.filter(p => p > 0)
                expect(fretted.length).toBeLessThanOrEqual(4)
                if (fretted.length) expect(Math.max(...fretted) - Math.min(...fretted)).toBeLessThanOrEqual(3)
              }
            }
          }
        }
      }
    }, 30000)
  }
  test('moving a shape beyond the end of the neck opens those strings', () => {
    expect(moveShapeWithCapo([0, 22, 21, 20, 19], BANJO, NO_CAPO, { fret: 9, fifth: true })).toEqual([0, 0, 0, 0, 0])
  })
})

describe('review: expected correctness at uncovered boundaries', () => {
  test('diminished seventh has a double-flat seventh role', () => {
    const chord = identifyChord(['C3', 'Eb3', 'Gb3', 'A3'])
    expect(chord.tones.find(t => t.note === 'A').role).toBe('♭♭7')
  })
  test('shape search respects an instrument with fewer frets', () => {
    const instrument = { ...BANJO, frets: 7 }
    const shapes = findShapes(instrument, TUNINGS[0].notes, 'D')
    expect(shapes.every(s => s.every(p => p === null || p <= 7))).toBe(true)
  })
})
