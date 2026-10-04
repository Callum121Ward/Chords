// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { beforeEach, expect, test, vi } from 'vitest'

vi.mock('./audio/player.js', () => ({ play: vi.fn(), playString: vi.fn(), STRUM_GAP: 0.035, PICK_GAP: 0.3 }))

const html = readFileSync('index.html', 'utf8')
const $ = id => document.getElementById(id)
const change = (id, value) => {
  $(id).value = value
  $(id).dispatchEvent(new Event('change', { bubbles: true }))
}
const saved = () => JSON.parse(localStorage.getItem('banjo-chords:state'))
const finger = () => document.querySelector('[data-string="1"][data-fret="2"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))
const findChord = symbol => {
  if ($('chord-picker').hidden) $('find-chord-toggle').click()
  $('chord-input').value = symbol
  $('chord-picker').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
}

beforeEach(async () => {
  vi.resetModules()
  localStorage.clear()
  document.documentElement.innerHTML = html.replace(/<!doctype html>/i, '')
  Element.prototype.scrollTo = vi.fn()
  await import('./main.js')
})

test('switching to minor updates chords without changing the finger shape', () => {
  finger()
  const positions = saved().positions
  change('key', 'A:minor')
  expect(saved()).toMatchObject({ key: 'A', mode: 'minor', positions })
  expect(document.querySelectorAll('.key-chip')).toHaveLength(8)
  expect([...document.querySelectorAll('.key-chip')].map(c => c.dataset.symbol)).toEqual(['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G', 'E'])
})

test('old saved settings without a mode still load as major', async () => {
  localStorage.setItem('banjo-chords:state', JSON.stringify({ key: 'D', positions: [0, 0, 0, 0, 0] }))
  vi.resetModules()
  await import('./main.js')
  expect($('key').value).toBe('D:major')
})

test('minor selection survives reload and moving the capo', async () => {
  change('key', 'A:minor')
  change('capo', '2+')
  expect(saved()).toMatchObject({ key: 'B', mode: 'minor' })
  vi.resetModules()
  await import('./main.js')
  expect($('key').value).toBe('B:minor')
})

test('preset tuning resets fingers and muting but keeps the capo', () => {
  finger()
  document.querySelector('.mute[data-string="0"]').click()
  change('capo', '2+')
  change('tuning', 'Double C')
  expect(saved()).toMatchObject({ key: 'D', mode: 'major', positions: [0, 0, 0, 0, 0], capo: { fret: 2, fifth: true }, browse: null })
})

test('individual string retuning also resets the shape', () => {
  finger()
  const select = document.querySelector('.string-note[data-string="1"]')
  select.value = 'C3'
  select.dispatchEvent(new Event('change', { bubbles: true }))
  expect(saved().positions).toEqual([0, 0, 0, 0, 0])
  expect(saved().tuningName).toBe('Standard C')
})

test('out-of-key lookup places and browses shapes without changing the key', () => {
  change('key', 'A:minor')
  findChord('Bb')
  expect(saved()).toMatchObject({ key: 'A', mode: 'minor', browse: { symbol: 'Bb', index: 0 } })
  expect($('panel').textContent).toContain('Bb')
  expect($('shape-next').disabled).toBe(false)
  $('shape-next').click()
  expect(saved().browse.index).toBe(1)
  expect($('chord-picker').hidden).toBe(true)
})

test('invalid chords preserve the current shape and show a helpful message', () => {
  finger()
  const positions = saved().positions
  findChord('not a chord')
  expect(saved().positions).toEqual(positions)
  expect($('chord-error').textContent).toContain('Enter a chord')
  expect($('chord-picker').hidden).toBe(false)
})

test('unplayable extended chord reports no easy shape and preserves the current notes', () => {
  finger()
  const positions = saved().positions
  findChord('C13#11')
  expect(saved().positions).toEqual(positions)
  expect($('shape-label').textContent).toContain('No easy shape')
  expect($('shape-prev').disabled).toBe(true)
  expect($('shape-next').disabled).toBe(true)
})

test('custom tuning names containing markup render as literal text', async () => {
  const name = '<b>My "tuning"</b>'
  localStorage.setItem('banjo-chords:tunings', JSON.stringify([{ name, notes: ['G4', 'C3', 'G3', 'C4', 'D4'], key: 'C', mode: 'minor' }]))
  vi.resetModules()
  await import('./main.js')
  expect([...$('tuning').options].find(o => o.value === name).textContent).toBe(name)
  change('tuning', name)
  expect(saved().mode).toBe('minor')
})


test('finder keeps a draft during neck interactions and returns focus when dismissed', () => {
  $('find-chord-toggle').click()
  expect(document.activeElement).toBe($('chord-input'))
  $('chord-input').value = 'F#m7'
  finger()
  expect($('chord-input').value).toBe('F#m7')
  expect($('chord-picker').hidden).toBe(false)
  $('chord-input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  expect($('chord-picker').hidden).toBe(true)
  expect($('find-chord-toggle').getAttribute('aria-expanded')).toBe('false')
  expect(document.activeElement).toBe($('find-chord-toggle'))
})

test('key chord buttons still place shapes from their new container', () => {
  document.querySelector('[data-symbol="C"]').click()
  expect(saved().browse.symbol).toBe('C')
  expect(document.querySelector('[data-symbol="C"]').getAttribute('aria-pressed')).toBe('true')
})

test('all playback uses Warm even when an older saved setting selected Bright', async () => {
  localStorage.setItem('banjo-chords:state', JSON.stringify({ tone: 'bright' }))
  vi.resetModules()
  await import('./main.js')
  const { play, playString } = await import('./audio/player.js')
  vi.clearAllMocks()
  $('strum').click()
  $('pick').click()
  finger()
  document.querySelector('[data-symbol="C"]').click()
  expect(play.mock.calls.length).toBeGreaterThanOrEqual(3)
  expect(play.mock.calls.every(call => call[2] === 'warm')).toBe(true)
  expect(playString).toHaveBeenCalled()
  expect(playString.mock.calls.every(call => call[2] === 'warm')).toBe(true)
  expect($('tone')).toBeNull()
})
