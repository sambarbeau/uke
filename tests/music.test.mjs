import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSong, strings, frequency } from '../public/music.js';
import { songs } from '../public/songs.js';
import { detectPitch, tuningReading } from '../public/pitch.js';

test('every bar, syllable, pitch and fingering in the songbook stays in sync', () => {
  assert.equal(new Set(songs.map(s => s.id)).size, songs.length);
  for (const raw of songs) {
    const song = readSong(raw);
    assert.equal(song.beats, (song.bars.length - (song.pickup ? 1 : 0)) * song.meter[0] * 4 / song.meter[1]);
    let beat = 0;
    for (const [index, e] of song.events.entries()) {
      assert.equal(e.index, index); assert.equal(e.beat, beat);
      assert.equal(strings[e.string - 1].midi + e.fret, e.midi);
      assert.ok(e.soundEnd >= e.beat + e.beats);
      if (e.tied) assert.equal(e.midi,song.events[index-1].midi);
      beat += e.beats;
    }
  }
});
test('an authored alternative string keeps the pitch and rejects invalid lyrics and rhythm', () => {
  const raw = {...songs.find(s => s.id === 'twinkle'), bars:[['G4@2:4','Sing']]};
  assert.deepEqual([readSong(raw).events[0].string,readSong(raw).events[0].fret], [2,3]);
  for (const bars of [[['C4:4','Too many']], [['C4:3']], [['C4@1:4']]]) assert.throws(() => readSong({...raw,bars}));
});
test('tuner detects each open string with flat and sharp offsets and strong harmonics', () => {
  for (const rate of [44100,48000,96000]) {
    for (const s of strings) for (const cents of [-38,0,31]) {
      const hz = frequency(s.midi) * 2 ** (cents/1200);
      const frame = Float32Array.from({length:2048}, (_,i) => {
        const phase = 2*Math.PI*i*hz/rate;
        return .16*Math.sin(phase) + .26*Math.sin(2*phase) + .07*Math.sin(3*phase);
      });
      const found = tuningReading(detectPitch(frame,rate));
      assert.equal(found.name,s.name); assert.ok(Math.abs(found.cents-cents)<2);
    }
  }
});
test('tuner ignores silence, noise and pitches outside the target neighborhood', () => {
  let seed = 55;
  const noise = Float32Array.from({length:2048}, () => { seed = (1664525*seed + 1013904223) >>> 0; return (seed/2**32-.5)*.4; });
  assert.equal(detectPitch(new Float32Array(2048),48000),null);
  assert.equal(detectPitch(noise,48000),null);
  assert.equal(tuningReading(196),null);
});

test('Cielito Lindo preserves the pickup, sections and sustained chorus notes', () => {
  const song = readSong(songs.find(s => s.id === 'cielito-lindo'));
  assert.equal(song.beats,96);
  assert.equal(song.bars[0][0].pitch,'G4');
  const chorus = song.sections.find(s => s.label === 'Chorus');
  assert.equal(song.bars[chorus.first][0].beat,49);
  const held = song.bars[chorus.first + 2][0];
  assert.equal(held.soundEnd - held.beat,6);
  assert.equal(song.events[held.afterTie].pitch,'D5');
  assert.equal(song.events.at(-1).beat + song.events.at(-1).beats,96);
});
test('video lessons and warm-ups have a distinct score source and correct bar count', () => {
  for (const s of songs.filter(s => s.lesson)) {
    assert.match(s.lesson.video,/^[a-zA-Z0-9_-]{11}$/);
    assert.equal(new URL(s.lesson.sheet).protocol,'https:');
    if (s.exercise) assert.equal(s.chords.length,s.bars.length);
  }
});
