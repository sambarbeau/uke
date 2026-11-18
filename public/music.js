// Indexed in tablature order, from top line (string 1) to bottom (string 4).
export const strings = [
  { name: 'A', midi: 69 }, { name: 'E', midi: 64 }, { name: 'C', midi: 60 }, { name: 'G', midi: 67 },
];
export const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
const semitones = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export const durations = { 0.5: '8', 1: 'q', 1.5: 'qd', 2: 'h', 3: 'hd', 4: 'w' };

export function readSong(song) {
  let beat = 0;
  const events = [];
  const bars = song.bars.map(([music, words], bar) => {
    const syllables = words?.trim().split(/\s+/);
    const start = beat;
    const notes = music.split(/\s+/).map((token, i) => {
      const match = /^([A-G])([b#]?)(\d)(?:@(\d))?(?::([.\d]+))?$/.exec(token);
      if (!match) throw new Error('Invalid note ' + token);
      const [, letter, accidental, octave, preferredString, length] = match;
      const midi = 12 * (Number(octave) + 1) + semitones[letter] + ({ b: -1, '#': 1, '': 0 })[accidental];
      const choices = strings.map((s, index) => ({ string: index + 1, fret: midi - s.midi }));
      const position = preferredString ? choices[Number(preferredString) - 1] :
        choices.filter(p => p.fret >= 0).sort((a, b) => a.fret - b.fret)[0];
      const beats = Number(length ?? 1);
      if (!position || position.fret < 0 || position.fret > 15 || !durations[beats]) throw new Error('Unplayable note ' + token);
      const event = { ...position, index: events.length, bar, beat, beats, midi, pitch: letter + accidental + octave,
        key: letter.toLowerCase() + accidental + '/' + octave, lyric: syllables?.[i] ?? '' };
      events.push(event);
      beat += beats;
      return event;
    });
    if (syllables && syllables.length !== notes.length) throw new Error('Check lyrics in bar ' + (bar + 1));
    if (beat - start !== song.meter[0] * 4 / song.meter[1]) throw new Error('Check rhythm in bar ' + (bar + 1));
    return notes;
  });
  return { ...song, bars, events, beats: beat };
}

export function fingering(note) {
  return strings[note.string - 1].name + ' string, ' + (note.fret ? 'fret ' + note.fret : 'open');
}
