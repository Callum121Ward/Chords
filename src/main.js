import './style.css'
import { Chord, Note } from 'tonal'
import { BANJO, TUNINGS } from './music/instrument.js'
import { playedNotes } from './music/fretboard.js'
import { identifyChord } from './music/chords.js'
import { prefersFlats } from './music/nashville.js'
import { findShapes } from './music/shapes.js'
import { NO_CAPO, withCapo, moveShapeWithCapo, transposeKey } from './music/capo.js'
import { renderNeck, scrollToFret } from './ui/neck.js'
import { renderPanel } from './ui/panel.js'
import { loadState, saveState, loadCustomTunings, saveCustomTunings } from './storage.js'
import { play, playString, PICK_GAP, STRUM_GAP } from './audio/player.js'
import { DEFAULT_TONE } from './audio/pluck.js'

const KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']
const CUSTOM = 'Custom'
const SAVE = '__save__' // the 'Save this tuning…' item in the tuning menu
const MAX_CAPO = 9
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
    mode: 'major',
    positions: BANJO.strings.map(() => 0), // all strings open
    capo: NO_CAPO,
    tapSound: true, // play a string's note when you tap the neck
    browse: null, // after tapping a key chord: { symbol, name, index } of the shape being shown
  }
}

const allTunings = () => [...TUNINGS, ...customTunings]

// The banjo and tuning as they behave with the capo on (see music/capo.js).
const capoed = () => withCapo(BANJO, state.tuningNotes, state.capo)

function update(changes) {
  state = { ...state, ...changes }
  saveState(state)
  render()
}

// ---- Drawing ----

function render() {
  const requestedRoot = state.browse?.symbol.match(/^[A-G][#b]*/)?.[0] ?? ''
  const flats = requestedRoot.includes('b') ? true : requestedRoot.includes('#') ? false : prefersFlats(state.key, state.mode)
  const { instrument, tuningNotes } = capoed()
  const notes = playedNotes(instrument, tuningNotes, state.positions, flats)
  const chord = identifyChord(notes)
  currentNotes = notes

  renderControls()
  $('tap-sound').setAttribute('aria-pressed', String(state.tapSound))
  renderStringHeads(flats)
  renderNeck($('neck'), { instrument, baseInstrument: BANJO, capo: state.capo, notes, positions: state.positions })
  renderPanel($('panel'), { chord, notes, key: state.key, mode: state.mode }, $('key-chords'), $('chord-notes'))
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

const shapesFor = (symbol) => {
  const { instrument, tuningNotes } = capoed()
  return findShapes(instrument, tuningNotes, symbol)
}

// Put the chosen shape on the neck, scroll to it and (if sounds are on) strum it.
function showShape(symbol, name, index) {
  const shape = shapesFor(symbol)[index]
  if (!shape) return update({ browse: { symbol, name, index: 0 } })
  update({ positions: shape, browse: { symbol, name, index } })
  const fretted = shape.filter((p) => p > 0)
  scrollToFret($('neck'), fretted.length ? Math.min(...fretted) : 1)
  if (state.tapSound) play(currentNotes, STRUM_GAP, DEFAULT_TONE)
}

function options(values, selected, label = (v) => v) {
  return values
    .map((v) => `<option value="${escapeHtml(v)}" ${v === selected ? 'selected' : ''}>${escapeHtml(label(v))}</option>`)
    .join('')
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}

function renderControls() {
  const names = allTunings().map((t) => t.name)
  if (state.tuningName === CUSTOM) names.push(CUSTOM)
  $('tuning').innerHTML =
    options(names, state.tuningName) + `<option value="${SAVE}">Save this tuning…</option>`
  const keyValues = KEYS.flatMap(key => [`${key}:major`, `${key}:minor`])
  $('key').innerHTML = options(keyValues, `${state.key}:${state.mode}`, v => v.replace(':', ' '))

  // Capo menu values: '0' (none), '2' (capo at 2), '2+' (capo at 2, 5th string too).
  const capoValues = ['0']
  for (let fret = 1; fret <= MAX_CAPO; fret++) capoValues.push(`${fret}`, `${fret}+`)
  const capoValue = state.capo.fret ? `${state.capo.fret}${state.capo.fifth ? '+' : ''}` : '0'
  $('capo').innerHTML = options(capoValues, capoValue, (v) =>
    v === '0' ? 'None' : v.endsWith('+') ? `${parseInt(v)} + 5th` : v,
  )
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
  if (state.tapSound) playString(currentNotes, string, DEFAULT_TONE)
})

$('strum').addEventListener('click', () => play(currentNotes, STRUM_GAP, DEFAULT_TONE))
$('pick').addEventListener('click', () => play(currentNotes, PICK_GAP, DEFAULT_TONE))
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
  update({ tuningNotes, tuningName: match ? match.name : CUSTOM, positions: BANJO.strings.map(() => 0), browse: null })
})

$('tuning').addEventListener('change', (event) => {
  if (event.target.value === SAVE) return saveTuning()
  const tuning = allTunings().find((t) => t.name === event.target.value)
  if (!tuning) return
  // The tuning's home key, moved up by the capo (Open G with capo 2 → A).
  const key = transposeKey(tuning.key, state.capo.fret, KEYS)
  update({ tuningName: tuning.name, tuningNotes: [...tuning.notes], key, mode: tuning.mode ?? 'major', positions: BANJO.strings.map(() => 0), browse: null })
})

// Moving the capo moves your fingers and the key with it, as on a real banjo.
$('capo').addEventListener('change', (event) => {
  const fret = parseInt(event.target.value)
  const capo = { fret, fifth: fret > 0 && event.target.value.endsWith('+') }
  update({
    capo,
    positions: moveShapeWithCapo(state.positions, BANJO, state.capo, capo),
    key: transposeKey(state.key, capo.fret - state.capo.fret, KEYS),
    browse: null,
  })
})

$('key').addEventListener('change', (event) => {
  const [key, mode] = event.target.value.split(':')
  update({ key, mode, browse: null })
})

function setChordPicker(open) {
  $('chord-picker').hidden = !open
  $('find-chord-toggle').setAttribute('aria-expanded', String(open))
  $('find-chord-toggle').textContent = open ? 'Close finder' : 'Find a chord'
  if (open) $('chord-input').focus()
  else $('find-chord-toggle').focus()
}

$('find-chord-toggle').addEventListener('click', () => setChordPicker($('chord-picker').hidden))
$('chord-picker').addEventListener('keydown', event => {
  if (event.key === 'Escape') setChordPicker(false)
})

$('chord-picker').addEventListener('submit', (event) => {
  event.preventDefault()
  const symbol = $('chord-input').value.trim().replace(/♯/g, '#').replace(/♭/g, 'b')
  const chord = Chord.get(symbol)
  if (chord.empty || !chord.tonic) {
    $('chord-error').textContent = 'Enter a chord such as Bb, F#m7 or D7.'
    return
  }
  $('chord-error').textContent = ''
  showShape(chord.symbol, chord.symbol.replace(/^([A-G][#b]*)M(?=\/|$|add)/, '$1'), 0)
  setChordPicker(false)
})

$('clear').addEventListener('click', () => update({ positions: BANJO.strings.map(() => 0), browse: null }))

// Tap a chord in the key row to see (and hear) a shape for it.
$('key-chords').addEventListener('click', (event) => {
  const chip = event.target.closest('.key-chip')
  if (chip) showShape(chip.dataset.symbol, chip.dataset.name, 0)
})

$('shape-prev').addEventListener('click', () => showShape(state.browse.symbol, state.browse.name, state.browse.index - 1))
$('shape-next').addEventListener('click', () => showShape(state.browse.symbol, state.browse.name, state.browse.index + 1))
$('shape-close').addEventListener('click', () => update({ browse: null }))

function saveTuning() {
  const name = prompt('Name this tuning:', state.tuningName === CUSTOM ? '' : state.tuningName)?.trim()
  if (!name) return render() // puts the menu back on the current tuning
  if (TUNINGS.some((t) => t.name === name)) {
    alert(`"${name}" is a built-in tuning. Please choose another name.`)
    return render()
  }
  // Save the key without the capo, so it's right whatever capo you use later.
  const key = transposeKey(state.key, -state.capo.fret, KEYS)
  const tuning = { name, notes: [...state.tuningNotes], key, mode: state.mode }
  customTunings = [...customTunings.filter((t) => t.name !== name), tuning]
  saveCustomTunings(customTunings)
  update({ tuningName: name })
}

render()
