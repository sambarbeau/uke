// A token is pitch, optional duration in quarter-note beats, and optional string
// override (e.g. G4@2). A lyric row has one syllable per sounded note.
export const songs = [
  {
    id: 'twinkle', title: 'Twinkle, Twinkle, Little Star', credit: 'Traditional French melody · words by Jane Taylor',
    shortCredit: 'Traditional', key: 'C', meter: [4, 4], bpm: 88,
    bars: [
      ['C4 C4 G4 G4', 'Twin- kle, twin- kle,'],
      ['A4 A4 G4:2', 'lit- tle star,'],
      ['F4 F4 E4 E4', 'How I won- der'],
      ['D4 D4 C4:2', 'what you are.'],
      ['G4 G4 F4 F4', 'Up a- bove the'],
      ['E4 E4 D4:2', 'world so high,'],
      ['G4 G4 F4 F4', 'Like a dia- mond'],
      ['E4 E4 D4:2', 'in the sky.'],
      ['C4 C4 G4 G4', 'Twin- kle, twin- kle,'],
      ['A4 A4 G4:2', 'lit- tle star,'],
      ['F4 F4 E4 E4', 'How I won- der'],
      ['D4 D4 C4:2', 'what you are.'],
    ],
  },
  {
    id: 'frere-jacques', title: 'Frère Jacques', credit: 'Traditional French round',
    shortCredit: 'Traditional', key: 'F', meter: [4, 4], bpm: 92,
    bars: [
      ['F4 G4 A4 F4', 'Frè- re Jac- ques,'], ['F4 G4 A4 F4', 'Frè- re Jac- ques,'],
      ['A4 Bb4 C5:2', 'Dor- mez- vous?'], ['A4 Bb4 C5:2', 'Dor- mez- vous?'],
      ['C5:0.5 D5:0.5 C5:0.5 Bb4:0.5 A4 F4', 'Son- nez les ma- ti- nes,'],
      ['C5:0.5 D5:0.5 C5:0.5 Bb4:0.5 A4 F4', 'Son- nez les ma- ti- nes,'],
      ['F4 C4 F4:2', 'Din, dan, don.'], ['F4 C4 F4:2', 'Din, dan, don.'],
    ],
  },
  {
    id: 'ode-to-joy', title: 'Ode to Joy', credit: 'Ludwig van Beethoven · Symphony No. 9, main theme',
    shortCredit: 'Beethoven', key: 'F', meter: [4, 4], bpm: 96,
    bars: [
      ['A4 A4 Bb4 C5'], ['C5 Bb4 A4 G4'], ['F4 F4 G4 A4'], ['A4:1.5 G4:0.5 G4:2'],
      ['A4 A4 Bb4 C5'], ['C5 Bb4 A4 G4'], ['F4 F4 G4 A4'], ['G4:1.5 F4:0.5 F4:2'],
      ['G4 G4 A4 F4'], ['G4 A4:0.5 Bb4:0.5 A4 F4'], ['G4 A4:0.5 Bb4:0.5 A4 G4'], ['F4 G4 C4:2'],
      ['A4 A4 Bb4 C5'], ['C5 Bb4 A4 G4'], ['F4 F4 G4 A4'], ['G4:1.5 F4:0.5 F4:2'],
    ],
  },
];
