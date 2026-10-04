// Remembers your settings on this device (in the browser's localStorage),
// so the app opens where you left off. If storage isn't available
// (e.g. private browsing), the app still works; it just forgets.

const STATE_KEY = 'banjo-chords:state'
const TUNINGS_KEY = 'banjo-chords:tunings'

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key))
  } catch {
    return null
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable; ignore.
  }
}

export const loadState = () => read(STATE_KEY)
export const saveState = (state) => write(STATE_KEY, state)
export const loadCustomTunings = () => {
  const tunings = read(TUNINGS_KEY)
  return Array.isArray(tunings) ? tunings.filter(t => t && typeof t.name === 'string' && Array.isArray(t.notes) && t.notes.length === 5 && typeof t.key === 'string') : []
}
export const saveCustomTunings = (tunings) => write(TUNINGS_KEY, tunings)
