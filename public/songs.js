import { strummedSongs } from './arrangements.js';

// A token is pitch, optional duration in quarter-note beats, and optional string
// override (e.g. G4@2). A lyric row has one syllable per sounded note.
export const songs = [
  {
    id: 'cielito-lindo', title: 'Cielito Lindo', shortCredit: 'Mexican song',
    credit: 'Quirino Mendoza y Cortés · 1927 melody',
    key: 'C', meter: [3, 4], bpm: 108, pickup: 1,
    sections: [{label:'Verse', first:0, last:16}, {label:'Chorus', first:17, last:32}],
    reference: { label: 'Rock Class 101 fingerstyle lesson', url: 'https://www.youtube.com/watch?v=cDc6dDq0gdM' },
    bars: [
      ['G4', 'De'], ['C5 C5 A4', 'la Sie- _'], ['~A4 B4 G4', '_ rra Mo-'],
      ['C5 C5 A4', 're- na, cie-'], ['~A4 B4 G4', '_ li- to'],
      ['C5 C5 A4', 'lin- do, vie-'], ['~A4 B4 G4', '_ nen ba-'],
      ['F4 D4:2', 'jan- do'], ['~D4:3', '_'],
      ['B4 B4 B4', 'un par de‿o-'], ['~B4 A4 G4', '_ ji- tos'],
      ['F4 E4 D4', 'ne- gros, cie-'], ['~D4 E4 F4', '_ li- to'],
      ['G4 G4 G4', 'lin- do, de'], ['~G4 B4 D5', '_ con- tra-'],
      ['E5 C5:2', 'ban- do.'], ['~C5:3', '_'],
      ['E5:3', '¡Ay,'], ['D5:2 C5', 'ay, ay,'], ['A4:3', 'ay!'], ['~A4:3', '_'],
      ['D5:3', 'Can-'], ['D5:2 C5', 'ta‿y no'], ['E5 C5:2', 'llo- res,'], ['~C5:2 G4', '_ por-'],
      ['A4 A4 G4', 'que can- tan-'], ['~G4 A4 G4', '_ do se‿a-'],
      ['F5 F5 D5', 'le- gran, cie-'], ['~D5 B4 G4', '_ li- to'],
      ['A4 A4 G4', 'lin- do, los'], ['~G4 B4 D5', '_ co- ra-'],
      ['E5 C5:2', 'zo- nes.'], ['~C5:2', '_'],
    ],
  },
  ...strummedSongs,
];
