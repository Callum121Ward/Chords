import { describe, expect, test } from 'vitest'
import { BANJO, TUNINGS } from './instrument.js'
import { playedNotes } from './fretboard.js'
import { identifyChord } from './chords.js'
import { findShapes } from './shapes.js'
import { NO_CAPO, withCapo, moveShapeWithCapo, transposeKey } from './capo.js'

const OPEN_G = TUNINGS[0].notes
const KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']
const X = null

const notesWith = (capo, positions) => {
  const { instrument, tuningNotes } = withCapo(BANJO, OPEN_G, capo)
  return playedNotes(instrument, tuningNotes, positions)
}
const nameWith = (capo, positions) => identifyChord(notesWith(capo, positions)).name

describe('capo', () => {
  test('no capo changes nothing', () => {
    expect(withCapo(BANJO, OPEN_G, NO_CAPO)).toEqual({ instrument: BANJO, tuningNotes: OPEN_G })
  })

  test('capo 2 with the 5th string: open strings make A (everything up a tone)', () => {
    expect(notesWith({ fret: 2, fifth: true }, [0, 0, 0, 0, 0])).toEqual(['A4', 'E3', 'A3', 'C#4', 'E4'])
    expect(nameWith({ fret: 2, fifth: true }, [0, 0, 0, 0, 0])).toBe('A/E')
  })

  test('capo 2 without the 5th string: the open 5th stays G, so the strum is A7', () => {
    expect(notesWith({ fret: 2, fifth: false }, [0, 0, 0, 0, 0])[0]).toBe('G4')
    expect(nameWith({ fret: 2, fifth: false }, [0, 0, 0, 0, 0])).toBe('A7/E')
  })

  test('frets behind the capo cannot be played', () => {
    expect(() => notesWith({ fret: 3, fifth: false }, [X, 2, 0, 0, 0])).toThrow(RangeError)
    expect(notesWith({ fret: 3, fifth: false }, [X, 4, 0, 0, 0])[1]).toBe('F#3') // capo'd D string is F; one fret up is F#
  })

  test('5th string capo sits at fret 5 + capo', () => {
    const { instrument } = withCapo(BANJO, OPEN_G, { fret: 2, fifth: true })
    expect(instrument.strings[0].startFret).toBe(7)
    expect(instrument.strings[1].startFret).toBe(2)
  })

  test('moving the capo moves the fingers, so C/E becomes D/F# at capo 2', () => {
    const cShape = [0, 2, 0, 1, 2]
    const moved = moveShapeWithCapo(cShape, BANJO, NO_CAPO, { fret: 2, fifth: true })
    expect(moved).toEqual([0, 4, 0, 3, 4])
    expect(nameWith({ fret: 2, fifth: true }, moved)).toBe('D/F#')
    // ...and back again
    expect(moveShapeWithCapo(moved, BANJO, { fret: 2, fifth: true }, NO_CAPO)).toEqual(cShape)
  })

  test('the key moves with the capo', () => {
    expect(transposeKey('G', 2, KEYS)).toBe('A')
    expect(transposeKey('G', 1, KEYS)).toBe('Ab')
    expect(transposeKey('A', -2, KEYS)).toBe('G')
    expect(transposeKey('C', -1, KEYS)).toBe('B')
  })

  test('shape finder works with a capo: A at capo 2 is all open', () => {
    const { instrument, tuningNotes } = withCapo(BANJO, OPEN_G, { fret: 2, fifth: true })
    expect(findShapes(instrument, tuningNotes, 'A')[0]).toEqual([0, 0, 0, 0, 0])
  })
})
