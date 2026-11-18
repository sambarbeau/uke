// One entry between bars is one measure. Equally spaced chord names split a bar;
// name:beats gives an explicit length in playback pulses. ! rings once, * uses
// just the main pulses. A 6/8 measure has two dotted-quarter pulses.
const lavaPhrase = 'C | C | G7 | G7 | F | F | C | G7 | G7';
const lavaChorus = 'F | F | C | C | G7 | G7 | C | C | F | F | C | C | F | G7 | C | C | C | C';
// Numbers are the zero-based measures where printed lyric lines begin.
const lavaVerseLines = [0,4,9,13];
const lavaChorusLines = [0,4,8,12];
const loveOpening = 'C | Em | Am | Am | F | C | G | G';
const loveBridge = 'Em | B7 | Em | B7 | Em | B7 | Em | A7 | Dm | Dm | G7 | G7*';
const yesterdayVerse = 'F | Em7 A7 | Dm | Bb C | F | Dm G | Bb F';
const yesterdayBridge = 'A7 | Dm:1 C:1 Bb:2 | Gm C7 | F | A7 | Gm:1 C:1 Bb:2 | Gm C7 | F';

export const strummedSongs = [
  {
    id:'lava', title:'Lava', shortCredit:'Pixar', credit:'James Ford Murphy · Pixar’s Lava',
    key:'C', meter:[4,4], bpm:124,
    pattern:{ beats:4, counts:['1','&','2','&','3','&','4','&'], strokes:'D-DUDUDU', accents:[2,6],
      tip:'Leave the first upstroke silent. Give beats 2 and 4 a little more weight.' },
    sheet:{ publisher:'Uke Like the Pros', site:'https://www.ukelikethepros.com/ukulele-songs-lava',
      pdf:'https://s3.amazonaws.com/kajabi-storefronts-production/sites/11716/themes/3689040/downloads/xWM7D7hsTMqDfDXFuXLP_ULTP_LAVA_Printable_NEW.pdf' },
    parts:[
      {label:'Verse 1', music:Array(3).fill(lavaPhrase).join(' | '), lines:[0,4,9,13,18,24], page:1},
      {label:'Chorus 1', music:lavaChorus, lines:lavaChorusLines, page:1},
      {label:'Verse 2', music:[lavaPhrase,lavaPhrase].join(' | '), lines:lavaVerseLines, page:1},
      {label:'Verse 3', music:[lavaPhrase,lavaPhrase].join(' | '), lines:lavaVerseLines, page:1},
      {label:'Chorus 2', music:lavaChorus, lines:lavaChorusLines, page:2},
      {label:'Verse 4', music:[lavaPhrase,lavaPhrase].join(' | '), lines:lavaVerseLines, page:2},
      {label:'Verse 5', music:lavaPhrase, lines:[0,4], page:2},
      {label:'Chorus 3', music:lavaChorus, lines:lavaChorusLines, page:2},
      {label:'Verse 6', music:[lavaPhrase,lavaPhrase].join(' | '), lines:lavaVerseLines, page:2},
      {label:'Last chorus', music:'F | F | C | C | G7 | G7 | C | C | F | F | C | C', lines:[0,4,8], page:3},
      {label:'Ending', music:'F | G7 | C | C | F | G7 | C | C | F | G7 | G7 | C!', lines:[0,4,8], page:3},
    ],
  },
  {
    id:'cant-help-falling-in-love', title:'Can’t Help Falling in Love', shortCredit:'Elvis Presley',
    credit:'Elvis Presley · from Blue Hawaii', key:'C', meter:[6,8], bpm:68,
    pattern:{beats:2, counts:['1','2','3','4','5','6'], strokes:'D-UD-U', accents:[0,3],
      tip:'Sway in two groups of three. Strum down on 1 and 4, then brush up lightly on 3 and 6.'},
    sheet:{ publisher:'Gloucester Strings Ukulele Club', site:'https://glosukeclub.org.uk/song-sheets',
      pdf:'https://glosukeclub.org.uk/wp-content/uploads/simple-file-list/Cant-Help-Falling-in-Love-With-You-GS.pdf' },
    parts:[
      {label:'Intro', music:loveOpening+' | F | G | Am | Dm | C | G | C | G7'},
      {label:'Verse 1', lines:[0,8], music:loveOpening+' | F | G7 | Am | F | C | G7 | C | G7'},
      {label:'Verse 2', lines:[0,8], music:loveOpening+' | F | G7 | Am | F | C | G | C | C'},
      {label:'Bridge 1', music:loveBridge, lines:[0,4,6]},
      {label:'Verse 3', lines:[0,8], music:loveOpening+' | F | G7 | Am | F | C | G | C | C'},
      {label:'Bridge 2', music:loveBridge, lines:[0,4,6]},
      {label:'Final verse', lines:[0,8], music:loveOpening+' | F | G7 | Am | F | C | G | Am | Am'},
      {label:'Ending', music:'F | G7 | Am | F | C | C | G | G | C | F | C | C!'},
    ],
  },
  {
    id:'yesterday', title:'Yesterday', shortCredit:'The Beatles', credit:'The Beatles · Lennon–McCartney',
    key:'F', meter:[4,4], bpm:86,
    pattern:{beats:4, counts:['1','2','3','4'], strokes:'DDDD', accents:[0],
      tip:'Play four even downstrokes. Keep counting through the quick chord changes in the bridge.'},
    sheet:{publisher:'Hull Ukulele Group', site:'https://hullukulelegroup.com/music/',
      pdf:'https://hullukulelegroup.com/wp-content/uploads/2025/01/yesterday-v1.pdf'},
    parts:[
      {label:'Intro', music:'F | F'}, {label:'Verse 1', music:yesterdayVerse, lines:[0,1,3,5]},
      {label:'Verse 2', music:yesterdayVerse, lines:[0,1,3,5]}, {label:'Bridge 1', music:yesterdayBridge, lines:[0,2,4,6]},
      {label:'Verse 3', music:yesterdayVerse, lines:[0,1,3,5]}, {label:'Bridge 2', music:yesterdayBridge, lines:[0,2,4,6]},
      {label:'Verse 4', music:yesterdayVerse, lines:[0,1,3,5]}, {label:'Hummed ending', music:'Dm G | Bb F!'},
    ],
  },
];
