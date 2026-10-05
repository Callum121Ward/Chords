import { Chord, ChordType } from 'tonal'

// Extend the shared dictionary so detection, lookup and shape search agree.
// add4/add11 describe the same pitch classes; display the compact add4 name.
if (ChordType.get('add4').empty) {
  ChordType.add(['1P', '3M', '4P', '5P'], ['add4', 'add11'], 'major added fourth')
}
ChordType.addAlias(ChordType.get('madd4'), 'madd11')
if (ChordType.get('7sus2').empty) {
  ChordType.add(['1P', '2M', '5P', '7m'], ['7sus2'], 'seventh suspended second')
}
for (const [alias, third, seventh] of [['maj7no5', '3M', '7M'], ['m7no5', '3m', '7m']]) {
  if (ChordType.get(alias).empty) {
    ChordType.add(['1P', third, seventh], [alias, alias.replace('no5', '(no5)')], `${alias} (fifth omitted)`)
  }
}

export { Chord }
