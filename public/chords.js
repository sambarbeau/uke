// String order matches a right-handed chord diagram, left to right: G C E A.
// Finger numbers run from index (1) to little finger (4); 0 is an open string.
export const shapes = {
  C:['0003','0003'], G7:['0212','0213'], F:['2010','2010'], Em:['0432','0321'],
  Am:['2000','2000'], G:['0232','0132'], Dm:['2210','2310'], B7:['2322','1211'],
  A7:['0100','0100'], Bb:['3211','3211'], Em7:['0202','0102'], Gm:['0231','0231'], C7:['0001','0001'],
};

export function readStrumSong(song) {
  const bars = [], events = [], sections = [], chords = new Set();
  const pattern = song.pattern;
  const step = pattern.beats / pattern.strokes.length;
  let slot = 0;
  for (const part of song.parts) {
    const first = bars.length;
    for (const measure of part.music.split('|')) {
      const names = measure.trim().split(/\s+/);
      const bar = [];
      const barInPart = bars.length - first;
      const line = part.lines?.filter(start => start <= barInPart).length;
      let slotsInBar = 0;
      for (const token of names) {
        const match = /^([A-G][bm7]*)([!*]?)(?::(\d+))?$/.exec(token);
        if (!match || !shapes[match[1]]) throw new Error('Unknown chord ' + token);
        const [,chord,articulation,length] = match;
        const duration = length ? Number(length) : pattern.beats / names.length;
        const count = duration / step;
        if (!Number.isInteger(count) || count <= 0) throw new Error('Chord falls between strokes: ' + token);
        chords.add(chord);
        for (let i = 0; i < count; i++) {
          const phase = slotsInBar++;
          let stroke = pattern.strokes[phase];
          if (articulation === '!') stroke = i === 0 ? 'D' : '-';
          if (articulation === '*') stroke = Number.isInteger(i * step) ? 'D' : '-';
          const event = {index:slot, beat:slot * step, beats:step, bar:bars.length, chord, phase, stroke,
            accent:pattern.accents.includes(phase), change:i === 0, part:part.label, line,
            afterTie:slot + 1};
          bar.push(event); events.push(event); slot++;
        }
      }
      if (slotsInBar !== pattern.strokes.length) throw new Error('Incomplete measure: ' + measure);
      bars.push(bar);
    }
    sections.push({label:part.label, first, last:bars.length - 1});
  }
  let nextSound = slot * step, nextChange = Infinity;
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (events[i+1] && events[i+1].chord !== event.chord) nextChange = i + 1;
    event.nextChange = nextChange;
    event.soundEnd = nextSound;
    if (event.stroke !== '-') nextSound = event.beat;
  }
  return {...song, sections, chords:[...chords], bars, events, beats:slot * step};
}

export function chordNotes(name, stroke) {
  const tuning = [67,60,64,69];
  const notes = [...shapes[name][0]].map((fret,i) => tuning[i] + Number(fret));
  return stroke === 'U' ? notes.reverse() : notes;
}
