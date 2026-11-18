import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSong, strings, frequency } from '../public/music.js';
import { songs } from '../public/songs.js';
import { detectPitch, tuningReading } from '../public/pitch.js';

test('every bar, syllable, pitch and fingering in the songbook stays in sync', () => {
  assert.equal(new Set(songs.map(s => s.id)).size, songs.length);
  for (const raw of songs) {
    const song = readSong(raw);
    assert.equal(song.beats, song.bars.length * 4);
    let beat = 0;
    for (const [index, e] of song.events.entries()) {
      assert.equal(e.index, index); assert.equal(e.beat, beat);
      assert.equal(strings[e.string - 1].midi + e.fret, e.midi);
      if (raw.bars[e.bar][1]) assert.ok(e.lyric);
      beat += e.beats;
    }
  }
});
test('an authored alternative string keeps the pitch and rejects invalid lyrics and rhythm', () => {
  const raw = {...songs[0], bars:[['G4@2:4','Sing']]};
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
