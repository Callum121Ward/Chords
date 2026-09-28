import { Note } from 'tonal'

// Draws the banjo neck as SVG, vertically: nut at the top, strings left → right (5th string first).
//
// The drawing is 300 units wide. The first 30 are a margin for fret numbers;
// each string then gets a 54-unit column. The string header row in style.css
// uses the same proportions (10% + 5 × 18%) so it lines up with the strings.

const WIDTH = 300
const MARGIN = 30
const COLUMN = 54
const FRET_HEIGHT = 56
const SINGLE_DOTS = [3, 5, 7, 10, 15, 17, 19, 22]
const DOUBLE_DOTS = [12]

const stringX = (i) => MARGIN + COLUMN / 2 + i * COLUMN
const fretY = (fret) => fret * FRET_HEIGHT // y of the fret wire
const cellY = (fret) => (fret - 0.5) * FRET_HEIGHT // middle of the space above that wire

export function renderNeck(el, { instrument, notes, positions }) {
  const frets = instrument.frets
  const height = fretY(frets) + 12
  const neckMiddle = MARGIN + (instrument.strings.length * COLUMN) / 2
  const parts = []

  // Wood
  parts.push(`<rect class="wood" x="${MARGIN}" y="0" width="${WIDTH - MARGIN}" height="${height}" />`)

  // Position dots and fret numbers
  for (const fret of SINGLE_DOTS) {
    parts.push(`<circle class="inlay" cx="${neckMiddle}" cy="${cellY(fret)}" r="6" />`)
  }
  for (const fret of DOUBLE_DOTS) {
    parts.push(`<circle class="inlay" cx="${neckMiddle - COLUMN / 2}" cy="${cellY(fret)}" r="6" />`)
    parts.push(`<circle class="inlay" cx="${neckMiddle + COLUMN / 2}" cy="${cellY(fret)}" r="6" />`)
  }
  for (const fret of [...SINGLE_DOTS, ...DOUBLE_DOTS]) {
    parts.push(`<text class="fret-number" x="${MARGIN / 2}" y="${cellY(fret)}">${fret}</text>`)
  }

  // Nut and fret wires
  parts.push(`<rect class="nut" x="${MARGIN}" y="0" width="${WIDTH - MARGIN}" height="6" />`)
  for (let fret = 1; fret <= frets; fret++) {
    parts.push(`<line class="fret" x1="${MARGIN}" x2="${WIDTH}" y1="${fretY(fret)}" y2="${fretY(fret)}" />`)
  }

  // Strings (the short 5th string starts at its peg, at its start fret)
  instrument.strings.forEach((string, i) => {
    const top = fretY(string.startFret)
    parts.push(`<line class="string" x1="${stringX(i)}" x2="${stringX(i)}" y1="${top}" y2="${height}" />`)
    if (string.startFret > 0) {
      parts.push(`<circle class="peg" cx="${stringX(i)}" cy="${top}" r="7" />`)
    }
  })

  // Invisible tap targets, one per string per fret
  instrument.strings.forEach((string, i) => {
    for (let fret = string.startFret + 1; fret <= frets; fret++) {
      parts.push(
        `<rect class="cell" x="${stringX(i) - COLUMN / 2}" y="${fretY(fret - 1)}" width="${COLUMN}" height="${FRET_HEIGHT}"` +
          ` data-string="${i}" data-fret="${fret}" role="button" aria-label="String ${string.label}, fret ${fret}" />`,
      )
    }
  })

  // Fingers, labelled with the note they make
  positions.forEach((fret, i) => {
    if (!fret) return
    const x = stringX(i)
    const y = cellY(fret)
    parts.push(`<g class="finger"><circle cx="${x}" cy="${y}" r="19" />`)
    parts.push(`<text x="${x}" y="${y}">${Note.pitchClass(notes[i])}</text></g>`)
  })

  el.innerHTML = `<svg class="neck" viewBox="0 0 ${WIDTH} ${height}" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`
}
