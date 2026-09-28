import { Note } from 'tonal'
import { pluckSamples, noteTimes, TONES, DEFAULT_TONE } from './pluck.js'

// Plays notes through the speaker using the browser's Web Audio API.
//
// iPhone rules this code works around:
//  - Sound can only start after a tap, so audio is set up on the first play, not at page load.
//  - Web Audio is normally silenced by the ring/silent switch; asking for "playback" mode
//    (supported on iOS 17+) lets it play anyway, like a music app.
//
// Sound path: each string → banjo body filters (per tone) → volume → compressor → speaker.

export const STRUM_GAP = 0.035 // seconds between strings in a strum
export const PICK_GAP = 0.3 // seconds between strings when picking notes one by one

let context = null
let output = null
let body = null // { tone, input } — the filter chain for the current tone
const soundCache = new Map() // 'tone:midi' → { buffer, playbackRate }
const ringing = [] // the sound currently playing on each string

function audio() {
  if (!context) {
    if (navigator.audioSession) navigator.audioSession.type = 'playback'
    context = new AudioContext()
    // A compressor stops loud strums from distorting when all 5 strings ring together.
    const compressor = context.createDynamicsCompressor()
    output = context.createGain()
    output.gain.value = 0.7
    output.connect(compressor).connect(context.destination)
  }
  if (context.state !== 'running') context.resume()
  return context
}

// The banjo "body": trims deep bass, adds the drum head's resonant honk, softens the top.
function bodyFor(tone) {
  if (body?.tone === tone) return body.input
  const { lowCut, honk, honkGain, highCut } = TONES[tone].body
  const filter = (type, frequency, extra = {}) => {
    const node = context.createBiquadFilter()
    node.type = type
    node.frequency.value = frequency
    if (extra.gain !== undefined) node.gain.value = extra.gain
    if (extra.Q !== undefined) node.Q.value = extra.Q
    return node
  }
  const input = filter('highpass', lowCut, { Q: 0.7 })
  input
    .connect(filter('peaking', honk, { gain: honkGain, Q: 1.1 }))
    .connect(filter('lowpass', highCut, { Q: 0.6 }))
    .connect(output)
  body?.input.disconnect() // notes already ringing through the old tone stop here
  body = { tone, input }
  return input
}

function soundFor(note, tone) {
  const cacheKey = `${tone}:${Note.midi(note)}`
  if (!soundCache.has(cacheKey)) {
    const { samples, playbackRate } = pluckSamples(Note.freq(note), context.sampleRate, TONES[tone])
    const buffer = context.createBuffer(1, samples.length, context.sampleRate)
    buffer.copyToChannel(samples, 0)
    soundCache.set(cacheKey, { buffer, playbackRate })
  }
  return soundCache.get(cacheKey)
}

// Play the given notes (one per string, null = silent), `gap` seconds apart.
// Like a real banjo, a new note on a string stops whatever that string was playing.
export function play(notes, gap = STRUM_GAP, tone = DEFAULT_TONE) {
  const ctx = audio()
  const destination = bodyFor(tone)
  const startAt = ctx.currentTime + 0.03
  noteTimes(notes, gap).forEach((offset, string) => {
    if (offset === null) return
    const { buffer, playbackRate } = soundFor(notes[string], tone)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.playbackRate.value = playbackRate
    source.connect(destination)

    const when = startAt + offset
    ringing[string]?.stop(when)
    source.start(when)
    ringing[string] = source
  })
}

// Play a single string's note (used when you tap the neck).
export function playString(notes, string, tone = DEFAULT_TONE) {
  play(
    notes.map((note, i) => (i === string ? note : null)),
    STRUM_GAP,
    tone,
  )
}
