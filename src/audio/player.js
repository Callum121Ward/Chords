import { Note } from 'tonal'
import { pluckSamples, noteTimes } from './pluck.js'

// Plays notes through the speaker using the browser's Web Audio API.
//
// iPhone rules this code works around:
//  - Sound can only start after a tap, so audio is set up on the first play, not at page load.
//  - Web Audio is normally silenced by the ring/silent switch; asking for "playback" mode
//    (supported on iOS 17+) lets it play anyway, like a music app.

export const STRUM_GAP = 0.035 // seconds between strings in a strum
export const PICK_GAP = 0.3 // seconds between strings when picking notes one by one

let context = null
let output = null
const soundCache = new Map() // midi number → { buffer, playbackRate }
const ringing = [] // the sound currently playing on each string

function audio() {
  if (!context) {
    if (navigator.audioSession) navigator.audioSession.type = 'playback'
    context = new AudioContext()
    // A compressor stops loud strums from distorting when all 5 strings ring together.
    const compressor = context.createDynamicsCompressor()
    output = context.createGain()
    output.gain.value = 0.6
    output.connect(compressor).connect(context.destination)
  }
  if (context.state !== 'running') context.resume()
  return context
}

function soundFor(note) {
  const midi = Note.midi(note)
  if (!soundCache.has(midi)) {
    const { samples, playbackRate } = pluckSamples(Note.freq(note), context.sampleRate)
    const buffer = context.createBuffer(1, samples.length, context.sampleRate)
    buffer.copyToChannel(samples, 0)
    soundCache.set(midi, { buffer, playbackRate })
  }
  return soundCache.get(midi)
}

// Play the given notes (one per string, null = silent), `gap` seconds apart.
// Like a real banjo, a new note on a string stops whatever that string was playing.
export function play(notes, gap = STRUM_GAP) {
  const ctx = audio()
  const startAt = ctx.currentTime + 0.03
  noteTimes(notes, gap).forEach((offset, string) => {
    if (offset === null) return
    const { buffer, playbackRate } = soundFor(notes[string])
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.playbackRate.value = playbackRate
    source.connect(output)

    const when = startAt + offset
    ringing[string]?.stop(when)
    source.start(when)
    ringing[string] = source
  })
}

// Play a single string's note (used when you tap the neck).
export function playString(notes, string) {
  play(notes.map((note, i) => (i === string ? note : null)))
}
