import './style.css'
import { Note } from 'tonal'
import { BANJO, TUNINGS } from './music/instrument.js'
import { playedNotes } from './music/fretboard.js'
import { identifyChord } from './music/chords.js'
import { prefersFlats } from './music/nashville.js'
import { findShapes } from './music/shapes.js'
import { renderNeck, scrollToFret } from './ui/neck.js'
import { renderPanel } from './ui/panel.js'
import { loadState, saveState, loadCustomTunings, saveCustomTunings } from './storage.js'
import { play, playString, PICK_GAP } from './audio/player.js'

const KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']
const CUSTOM = 'Custom'
const RETUNE_RANGE = 6 // semitones up/down offered when retuning a string

const $ = (id) => document.getElementById(id)

// ---- State: everything the screen shows is worked out from this ----

let customTunings = loadCustomTunings()
let state = { ...defaultState(), ...loadState() }
let currentNotes = [] // the note on each string right now (worked out in render)

function defaultState() {
  const tuning = TUNINGS[0]
  return {
    tuningName: tuning.name,
    tuningNotes: [...tuning.notes],
    key: tuning.key,
    positions: BANJO.strings.map(() => 0), // all strings open
    tapSound: true, // play a string's note when you tap the neck
    browse: null, // after tapping a key chord: { symbol, name, index } of the shape being shown
  }
}

const allTunings = () => [...TUNINGS, ...customTunings]

function update(changes) {
  state = { ...state, ...changes }
  saveState(state)
  render()
}

// ---- Drawing ----

function render() {
  const flats = prefersFlats(state.key)
  const notes = playedNotes(BANJO, state.tuningNotes, state.positions, flats)
  const chord = identifyChord(notes)
  currentNotes = notes

  renderControls()
  $('tap-sound').setAttribute('aria-pressed', String(state.tapSound))
  renderStringHeads(flats)
  renderNeck($('neck'), { instrument: BANJO, notes, positions: state.positions })
  renderPanel($('panel'), { chord, notes, key: state.key })
  renderShapeNav()
}

// The floating ‹ C · 1 of 7 › control over the neck, while browsing shapes for a chord.
function renderShapeNav() {
  const nav = $('shape-nav')
  nav.hidden = !state.browse
  if (!state.browse) return
  const count = shapesFor(state.browse.symbol).length
  const { name, index } = state.browse
  $('shape-label').textContent = count ? `${name} · ${index + 1} of ${count}` : `No easy shape for ${name}`
  $('shape-prev').disabled = index <= 0
  $('shape-next').disabled = index >= count - 1
}

const shapesFor = (symbol) => findShapes(BANJO, state.tuningNotes, symbol)

// Put the chosen shape on the neck, scroll to it and (if sounds are on) strum it.
function showShape(symbol, name, index) {
  const shape = shapesFor(symbol)[index]
  if (!shape) return update({ browse: { symbol, name, index: 0 } })
  update({ positions: shape, browse: { symbol, name, index } })
  const fretted = shape.filter((p) => p > 0)
  scrollToFret($('neck'), fretted.length ? Math.min(...fretted) : 1)
  if (state.tapSound) play(currentNotes)
}

function options(values, selected, label = (v) => v) {
  return values
    .map((v) => `<option value="${v}" ${v === selected ? 'selected' : ''}>${label(v)}</option>`)
    .join('')
}

function renderControls() {
  const names = allTunings().map((t) => t.name)
  if (state.tuningName === CUSTOM) names.push(CUSTOM)
  $('tuning').innerHTML = options(names, state.tuningName)
  $('key').innerHTML = options(KEYS, state.key)
}

// Above each string: its open note (tap to retune) and an open/muted toggle.
function renderStringHeads(flats) {
  const spell = (midi) => (flats ? Note.fromMidi(midi) : Note.fromMidiSharps(midi))
  const heads = BANJO.strings.map((string, i) => {
    const current = Note.midi(state.tuningNotes[i])
    const choices = []
    for (let m = current - RETUNE_RANGE; m <= current + RETUNE_RANGE; m++) choices.push(spell(m))

    const position = state.positions[i]
    const toggle = position === null ? '✕' : '○'
    const toggleLabel = position === null ? 'muted, tap to play open' : 'tap to mute'
    const toggleClass = position === null ? 'muted' : position === 0 ? 'open' : 'fretted'

    return `
      <div class="head">
        <select class="string-note" data-string="${i}" aria-label="String ${string.label} tuning">
          ${options(choices, spell(current), Note.pitchClass)}
        </select>
        <button type="button" class="mute ${toggleClass}" data-string="${i}"
          aria-label="String ${string.label}: ${toggleLabel}">${toggle}</button>
      </div>`
  })
  $('string-heads').innerHTML = `<div class="head-spacer"></div>${heads.join('')}`
}

// ---- Taps and changes ----

$('neck').addEventListener('click', (event) => {
  const cell = event.target.closest('[data-fret]')
  if (!cell) return
  const string = Number(cell.dataset.string)
  const fret = Number(cell.dataset.fret)
  const positions = [...state.positions]
  positions[string] = positions[string] === fret ? 0 : fret // tap again to lift the finger
  update({ positions, browse: null })
  if (state.tapSound) playString(currentNotes, string)
})

$('strum').addEventListener('click', () => play(currentNotes))
$('pick').addEventListener('click', () => play(currentNotes, PICK_GAP))
$('tap-sound').addEventListener('click', () => update({ tapSound: !state.tapSound }))

$('string-heads').addEventListener('click', (event) => {
  const button = event.target.closest('.mute')
  if (!button) return
  const string = Number(button.dataset.string)
  const positions = [...state.positions]
  positions[string] = positions[string] === null ? 0 : null
  update({ positions, browse: null })
})

$('string-heads').addEventListener('change', (event) => {
  const select = event.target.closest('.string-note')
  if (!select) return
  const tuningNotes = [...state.tuningNotes]
  tuningNotes[Number(select.dataset.string)] = select.value
  // If the new notes happen to match a saved tuning, show its name.
  const match = allTunings().find((t) => t.notes.every((n, i) => Note.midi(n) === Note.midi(tuningNotes[i])))
  update({ tuningNotes, tuningName: match ? match.name : CUSTOM, browse: null })
})

$('tuning').addEventListener('change', (event) => {
  const tuning = allTunings().find((t) => t.name === event.target.value)
  if (tuning) update({ tuningName: tuning.name, tuningNotes: [...tuning.notes], key: tuning.key, browse: null })
})

$('key').addEventListener('change', (event) => update({ key: event.target.value, browse: null }))

$('clear').addEventListener('click', () => update({ positions: BANJO.strings.map(() => 0), browse: null }))

// Tap a chord in the key row to see (and hear) a shape for it.
$('panel').addEventListener('click', (event) => {
  const chip = event.target.closest('.key-chip')
  if (chip) showShape(chip.dataset.symbol, chip.dataset.name, 0)
})

$('shape-prev').addEventListener('click', () => showShape(state.browse.symbol, state.browse.name, state.browse.index - 1))
$('shape-next').addEventListener('click', () => showShape(state.browse.symbol, state.browse.name, state.browse.index + 1))
$('shape-close').addEventListener('click', () => update({ browse: null }))

$('save-tuning').addEventListener('click', () => {
  const name = prompt('Name this tuning:', state.tuningName === CUSTOM ? '' : state.tuningName)?.trim()
  if (!name) return
  if (TUNINGS.some((t) => t.name === name)) {
    alert(`"${name}" is a built-in tuning. Please choose another name.`)
    return
  }
  const tuning = { name, notes: [...state.tuningNotes], key: state.key }
  customTunings = [...customTunings.filter((t) => t.name !== name), tuning]
  saveCustomTunings(customTunings)
  update({ tuningName: name })
})

render()
