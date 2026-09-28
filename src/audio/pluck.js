// A plucked-string sound made with the Karplus–Strong method:
// fill a short loop with random noise (the "pluck"), then keep going round the loop,
// averaging neighbouring samples each time. The averaging softens the sound and makes it fade,
// much like a real string. The loop length sets the pitch.
//
// This file does no audio playback itself; it only computes the sound's samples,
// so it can be tested without a browser.

// Returns the samples, plus a playbackRate that fine-tunes the pitch exactly.
// (The loop must be a whole number of samples long, which would leave notes slightly out of tune.)
export function pluckSamples(frequency, sampleRate, { seconds = 2.5, decay = 0.995, random = Math.random } = {}) {
  const period = Math.max(2, Math.round(sampleRate / frequency))
  const loop = new Float32Array(period)
  for (let i = 0; i < period; i++) loop[i] = random() * 2 - 1

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
