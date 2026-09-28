import { describe, expect, test } from 'vitest'
import { pluckSamples, noteTimes, TONES, DEFAULT_TONE } from './pluck.js'

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

describe('tones', () => {
  // How harsh a sound is: how much it jumps between neighbouring samples, relative to its loudness.
  // Bright, scratchy sounds jump a lot; mellow, rounded ones change smoothly.
  const harshness = (samples) => {
    let diff = 0
    let level = 0
    for (let i = 1; i < 4410; i++) {
      diff += (samples[i] - samples[i - 1]) ** 2
      level += samples[i] ** 2
    }
    return Math.sqrt(diff / level)
  }
  const sound = (tone, frequency = 196) => pluckSamples(frequency, RATE, { ...TONES[tone], random: seeded() }).samples

  test('mellow is smoother than bright, and warm is smoother still', () => {
    expect(harshness(sound('mellow'))).toBeLessThan(harshness(sound('bright')) * 0.6)
    expect(harshness(sound('warm'))).toBeLessThan(harshness(sound('mellow')))
  })

  test('every tone starts at a similar volume and never clips', () => {
    for (const tone of Object.keys(TONES)) {
      const samples = sound(tone)
      expect(loudness(samples, 0, 2205), tone).toBeGreaterThan(0.1)
      expect(samples.every((s) => Math.abs(s) <= 1), tone).toBe(true)
    }
  })

  test('the tone does not change the pitch', () => {
    const rates = Object.keys(TONES).map((tone) => pluckSamples(246.94, RATE, { ...TONES[tone], seconds: 0.1 }).playbackRate)
    expect(new Set(rates).size).toBe(1)
  })

  test('the default tone exists', () => {
    expect(TONES[DEFAULT_TONE]).toBeDefined()
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
