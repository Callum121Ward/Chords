import { expect, test } from 'vitest'
import { BANJO, TUNINGS } from '../music/instrument.js'
import { playedNotes } from '../music/fretboard.js'
import { identifyChord } from '../music/chords.js'
import { withCapo } from '../music/capo.js'
import { renderNeck } from './neck.js'
import { renderPanel } from './panel.js'

test('capo prevents tap targets behind it and preserves the short string boundary', () => {
  const capo = { fret: 2, fifth: true }
  const { instrument, tuningNotes } = withCapo(BANJO, TUNINGS[0].notes, capo)
  const positions = [0, 0, 0, 0, 0]
  const el = { innerHTML: '' }
  renderNeck(el, { instrument, baseInstrument: BANJO, capo, positions, notes: playedNotes(instrument, tuningNotes, positions) })
  const targets = [...el.innerHTML.matchAll(/data-string="(\d+)" data-fret="(\d+)"/g)]
  expect(targets.length).toBe(95)
  expect(targets.every(([, string, fret]) => Number(fret) > instrument.strings[Number(string)].startFret)).toBe(true)
})

test('chord panel separates the bass from the chord name and offers seven key chords', () => {
  const notes = playedNotes(BANJO, TUNINGS[0].notes, [0, 0, 0, 0, 0])
  const el = { innerHTML: '' }
  renderPanel(el, { notes, chord: identifyChord(notes), key: 'G' })
  expect(el.innerHTML).toContain('class="chord-name">G</div>')
  expect(el.innerHTML).toContain('D in bass')
  expect([...el.innerHTML.matchAll(/data-symbol=/g)]).toHaveLength(7)
})

test('all-muted panel gives an explicit message and retains key suggestions', () => {
  const el = { innerHTML: '' }
  renderPanel(el, { notes: [null, null, null, null, null], chord: null, key: 'G' })
  expect(el.innerHTML).toContain('All strings muted')
  expect([...el.innerHTML.matchAll(/data-symbol=/g)]).toHaveLength(7)
})
