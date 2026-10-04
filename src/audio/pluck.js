// A plucked-string sound made with the Karplus–Strong method:
// fill a short loop with random noise (the "pluck"), then keep going round the loop,
// averaging neighbouring samples each time. The averaging softens the sound and makes it fade,
// much like a real string. The loop length sets the pitch.
//
// This file does no audio playback itself; it only computes the sound's samples,
// so it can be tested without a browser.

// Tones. The first four settings shape the pluck itself (used here); `body` describes the
// banjo's drum head and is applied as audio filters by player.js.
//   decay         → how long notes ring (closer to 1 = longer)
//   smoothing     → how many times the initial noise is softened: 0 = hard pick, higher = rounder fingertip
//   pluckPosition → where along the string it's plucked (0 = right at the bridge: brightest)
//   body          → trim deep bass below `lowCut` Hz; a resonant "honk" at `honk` Hz; soften above `highCut` Hz
export const TONES = {
  mellow: {
    label: 'Mellow',
    decay: 0.994, smoothing: 2, pluckPosition: 0.18,
    body: { lowCut: 90, honk: 700, honkGain: 3, highCut: 3200 },
  },
  warm: {
    label: 'Warm',
    decay: 0.992, smoothing: 8, pluckPosition: 0.25,
    body: { lowCut: 80, honk: 450, honkGain: 3, highCut: 2200 },
  },
  bright: {
    label: 'Bright',
    decay: 0.996, smoothing: 0, pluckPosition: 0,
    body: { lowCut: 110, honk: 1500, honkGain: 4, highCut: 9000 },
  },
}
export const DEFAULT_TONE = 'warm'

// The starting shape of the string: random noise, softened and shaped by the pluck position.
function pluckShape(period, smoothing, pluckPosition, random) {
  let shape = new Float32Array(period)
  for (let i = 0; i < period; i++) shape[i] = random() * 2 - 1

  // Softening: average each point with its neighbour (removes the harshest high frequencies).
  for (let pass = 0; pass < smoothing; pass++) {
    const soft = new Float32Array(period)
    for (let i = 0; i < period; i++) soft[i] = 0.5 * (shape[i] + shape[(i + 1) % period])
    shape = soft
  }

  // Pluck position: subtracting a shifted copy silences the overtones a real pluck at that point would.
  if (pluckPosition > 0) {
    const shift = Math.max(1, Math.round(pluckPosition * period))
    const plucked = new Float32Array(period)
    for (let i = 0; i < period; i++) plucked[i] = shape[i] - shape[(i + shift) % period]
    shape = plucked
  }

  // Centre on zero and scale so the loudest point is 0.9 (same volume whatever the tone).
  const mean = shape.reduce((sum, v) => sum + v, 0) / period
  let peak = 0
  for (let i = 0; i < period; i++) peak = Math.max(peak, Math.abs(shape[i] - mean))
  for (let i = 0; i < period; i++) shape[i] = ((shape[i] - mean) / (peak || 1)) * 0.9
  return shape
}

// Returns the samples, plus a playbackRate that fine-tunes the pitch exactly.
// (The loop must be a whole number of samples long, which would leave notes slightly out of tune.)
export function pluckSamples(
  frequency,
  sampleRate,
  { seconds = 2.5, decay = 0.995, smoothing = 0, pluckPosition = 0, random = Math.random } = {},
) {
  const period = Math.max(2, Math.round(sampleRate / frequency))
  const loop = pluckShape(period, smoothing, pluckPosition, random)

  const length = Math.round(sampleRate * seconds)
  const samples = new Float32Array(length)
  let position = 0
  for (let i = 0; i < length; i++) {
    const current = loop[position]
    const next = loop[(position + 1) % period]
    samples[i] = current
    loop[position] = decay * 0.5 * (current + next)
    position = (position + 1) % period
  }

  // Fade out the last 50 ms so the sound never ends with a click.
  const fade = Math.min(length, Math.round(sampleRate * 0.05))
  for (let i = 0; i < fade; i++) samples[length - 1 - i] *= i / fade

  // The averaging adds half a sample of delay, so the true pitch is sampleRate / (period + 0.5).
  const playbackRate = (frequency * (period + 0.5)) / sampleRate
  return { samples, playbackRate }
}

// When each string starts sounding, in seconds from now. Muted strings (null) are skipped.
// A strum uses a short gap between strings; picking the notes one by one uses a longer gap.
export function noteTimes(notes, gap) {
  let t = 0
  return notes.map((note) => {
    if (!note) return null
    const start = t
    t += gap
    return start
  })
}
