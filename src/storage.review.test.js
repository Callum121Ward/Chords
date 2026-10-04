import { afterEach, describe, expect, test, vi } from 'vitest'
import { loadState, saveState, loadCustomTunings, saveCustomTunings } from './storage.js'

afterEach(() => vi.unstubAllGlobals())

function storage() {
  const data = new Map()
  vi.stubGlobal('localStorage', {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  })
  return data
}

describe('review: persisted settings', () => {
  test('fresh storage has no state and no custom tunings', () => {
    storage()
    expect(loadState()).toBeNull()
    expect(loadCustomTunings()).toEqual([])
  })
  test('settings and custom tunings survive saving and loading', () => {
    storage()
    const state = { positions: [null, 0, 2, 1, 2], capo: { fret: 2, fifth: true }, tone: 'warm' }
    const tunings = [{ name: 'My tuning', notes: ['G4', 'C3', 'G3', 'C4', 'D4'], key: 'C' }]
    saveState(state)
    saveCustomTunings(tunings)
    expect(loadState()).toEqual(state)
    expect(loadCustomTunings()).toEqual(tunings)
  })
  test('invalid JSON falls back safely', () => {
    const data = storage()
    data.set('banjo-chords:state', '{broken')
    data.set('banjo-chords:tunings', '{broken')
    expect(loadState()).toBeNull()
    expect(loadCustomTunings()).toEqual([])
  })
  test('unavailable browser storage does not throw', () => {
    vi.stubGlobal('localStorage', { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } })
    expect(loadState()).toBeNull()
    expect(loadCustomTunings()).toEqual([])
    expect(() => saveState({})).not.toThrow()
    expect(() => saveCustomTunings([])).not.toThrow()
  })
  test('valid JSON with an invalid tuning-list type is rejected', () => {
    storage().set('banjo-chords:tunings', '{}')
    expect(loadCustomTunings()).toEqual([])
  })
})
