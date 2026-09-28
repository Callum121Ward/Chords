import { describe, expect, test } from 'vitest'
import { pluckSamples, noteTimes } from './pluck.js'

// A repeatable "random" sequence, so the tests give the same result every time.
function seeded(seed = 1) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
}

const RATE = 44100
const loudness = (samples, from, to) => {
  let sum = 0
  for (let i = from; i < to; i++) sum += samples[i] ** 2
  return Math.sqrt(sum / (to - from))
}

describe('plucked string sound', () => {
  test('lasts the requested time', () => {
    const { samples } = pluckSamples(196, RATE, { seconds: 1, random: seeded() })
    expect(samples.length).toBe(RATE)
  })

  test('starts loud and fades away, like a plucked string', () => {
    const { samples } = pluckSamples(196, RATE, { random: seeded() })
    const start = loudness(samples, 0, 4410)
    const end = loudness(samples, samples.length - 8820, samples.length - 4410)
    expect(start).toBeGreaterThan(0.1)
    expect(end).toBeLessThan(start / 10)
  })

  test('never clips (stays between -1 and 1)', () => {
    const { samples } = pluckSamples(392, RATE, { random: seeded() })
    expect(samples.every((s) => Math.abs(s) <= 1)).toBe(true)
  })

  test('ends silently, with no click', () => {
    const { samples } = pluckSamples(196, RATE, { random: seeded() })
    expect(Math.abs(samples.at(-1))).toBe(0)
  })

  test('playback rate corrects the pitch to within 0.1%', () => {
    for (const frequency of [146.83, 196, 246.94, 293.66, 392]) {
      const { playbackRate } = pluckSamples(frequency, RATE, { seconds: 0.1, random: seeded() })
      const period = Math.round(RATE / frequency)
      const actual = (RATE / (period + 0.5)) * playbackRate
      expect(Math.abs(actual - frequency) / frequency).toBeLessThan(0.001)
    }
  })
})

describe('note timing', () => {
  test('strings sound one after another, skipping muted ones', () => {
    expect(noteTimes(['G4', null, 'G3', 'B3', 'D4'], 0.25)).toEqual([0, null, 0.25, 0.5, 0.75])
  })

  test('all muted: nothing plays', () => {
    expect(noteTimes([null, null, null, null, null], 0.1)).toEqual([null, null, null, null, null])
  })
})
