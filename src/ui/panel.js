import { Note } from 'tonal'
import { nashvilleNumber, degreeOf, keyChords, goesWellWith } from '../music/nashville.js'

// The chord panel at the bottom: chord name, Nashville number, notes and chords in the key.

export function renderPanel(el, { chord, notes, key }) {
  el.innerHTML = chord ? chordSection(chord, key) : noChordSection(notes)
  el.innerHTML += keySection(chord, key)
}

function chordSection(chord, key) {
  // Show the chord without its slash (G, not G/D), and the bass note underneath.
  const mainName = chord.root + chord.suffix
  const mainNumber = nashvilleNumber({ ...chord, bass: null }, key)
  const bassLine = chord.bass
    ? `<div class="sub">${chord.bass} in bass <span class="muted">(/${degreeOf(chord.bass, key)})</span></div>`
    : `<div class="sub muted">Root in bass</div>`
  const tones = chord.tones
    .map((t) => `<li class="tone"><span class="tone-note">${t.note}</span><span class="tone-role">${t.role}</span></li>`)
    .join('')
  const also = chord.alternatives.length
    ? `<div class="also">Also called: ${chord.alternatives.join(', ')}</div>`
    : ''
  const unusual = chord.unusual
    ? `<div class="also">Unusual shape: this is the closest standard chord name for these notes.</div>`
    : ''

  return `
    <div class="chord-head">
      <div>
        <div class="chord-name">${mainName}</div>
        ${bassLine}
      </div>
      <div class="nashville">
        <div class="label">Nashville in ${key}</div>
        <div class="number">${mainNumber}</div>
      </div>
    </div>
    <ul class="tones" aria-label="Notes in the chord">${tones}</ul>
    ${also}${unusual}`
}

function noChordSection(notes) {
  const played = [...new Set(notes.filter(Boolean).map(Note.pitchClass))]
  const message = played.length === 0 ? 'All strings muted' : `Notes: ${played.join(' ')}`
  return `
    <div class="chord-head">
      <div>
        <div class="chord-name muted">—</div>
        <div class="sub muted">Not a chord · ${message}</div>
      </div>
    </div>`
}

function keySection(chord, key) {
  const chords = keyChords(key)
  const current = chord ? triadNumber(chord, key) : null
  const next = chord ? goesWellWith(chord, key).map((c) => c.number) : []

  const chips = chords
    .map((c) => {
      const cls = c.number === current ? 'current' : next.includes(c.number) ? 'next' : ''
      return `<li class="key-chip ${cls}"><span class="chip-number">${c.number}</span><span class="chip-name">${c.name}</span></li>`
    })
    .join('')
  const legend = chord ? `<span class="legend"><i class="dot current"></i>this chord <i class="dot next"></i>goes well next</span>` : ''

  return `
    <div class="key-title">Chords in ${key} ${legend}</div>
    <ul class="key-chips">${chips}</ul>`
}

// The key-chord number this chord belongs to, ignoring extras like 7 or sus (D7 in G → '5').
function triadNumber(chord, key) {
  const degree = degreeOf(chord.root, key)
  const quality = /^dim|^m7b5/.test(chord.suffix) ? '°' : /^m(?!aj)/.test(chord.suffix) ? 'm' : ''
  return degree + quality
}
