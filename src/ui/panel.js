import { Note } from 'tonal'
import { nashvilleNumber, degreeOf, keyChords, goesWellWith } from '../music/nashville.js'

// The chord panel at the bottom: chord name, Nashville number, notes and chords in the key.

export function renderPanel(el, { chord, notes, key }) {
  el.innerHTML = chord ? chordSection(chord, key) : noChordSection(notes)
  el.innerHTML += keySection(chord, key)
}

function chordSection(chord, key) {
  // One row: chord name without its slash (G, not G/D), bass note and other names beside it,
  // Nashville number on the right.
  const mainName = chord.root + chord.suffix
  const mainNumber = nashvilleNumber({ ...chord, bass: null }, key)
  const bass = chord.bass
    ? `${chord.bass} in bass <span class="muted">(/${degreeOf(chord.bass, key)})</span>`
    : `<span class="muted">Root in bass</span>`
  const also = chord.alternatives.length ? `<div class="muted">also ${chord.alternatives.join(', ')}</div>` : ''
  const tones = chord.tones
    .map((t) => `<li class="tone"><b>${t.note}</b><span>${t.role}</span></li>`)
    .join('')

  return `
    <div class="chord-row">
      <div class="chord-name">${mainName}</div>
      <div class="chord-info"><div>${bass}</div>${also}</div>
      <div class="nashville" aria-label="Nashville number in ${key}">
        <div class="label">Nashville</div>
        <div class="number">${mainNumber}</div>
      </div>
    </div>
    <ul class="tones" aria-label="Notes in the chord">${tones}</ul>`
}

function noChordSection(notes) {
  const played = [...new Set(notes.filter(Boolean).map(Note.pitchClass))]
  const message = played.length === 0 ? 'All strings muted' : `Notes: ${played.join(' ')}`
  return `
    <div class="chord-row">
      <div class="chord-name muted">—</div>
      <div class="chord-info"><div>Not a chord</div><div class="muted">${message}</div></div>
    </div>`
}
function keySection(chord, key) {
  const chords = keyChords(key)
  const current = chord ? triadNumber(chord, key) : null
  const next = chord ? goesWellWith(chord, key).map((c) => c.number) : []

  const chips = chords
    .map((c) => {
      const cls = c.number === current ? 'current' : next.includes(c.number) ? 'next' : ''
      return `<li><button type="button" class="key-chip ${cls}" data-symbol="${c.symbol}" data-name="${c.name}"
        aria-label="Show a shape for ${c.name}"><span class="chip-number">${c.number}</span><span class="chip-name">${c.name}</span></button></li>`
    })
    .join('')

  return `
    <ul class="key-chips" aria-label="Chords in ${key}. Solid: this chord. Outlined: goes well next.">${chips}</ul>`
}

// The key-chord number this chord belongs to, ignoring extras like 7 or sus (D7 in G → '5').
function triadNumber(chord, key) {
  const degree = degreeOf(chord.root, key)
  const quality = /^dim|^m7b5/.test(chord.suffix) ? '°' : /^m(?!aj)/.test(chord.suffix) ? 'm' : ''
  return degree + quality
}
