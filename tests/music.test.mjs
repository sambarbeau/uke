import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSong, strings, frequency } from '../public/music.js';
import { readStrumSong, shapes, chordNotes } from '../public/chords.js';
import { songs } from '../public/songs.js';
import { detectPitch, tuningReading } from '../public/pitch.js';

test('every bar, syllable, pitch and fingering in the songbook stays in sync', () => {
  assert.equal(new Set(songs.map(s => s.id)).size, songs.length);
  for (const raw of songs.filter(s => !s.pattern)) {
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
test('each printed strum arrangement is playable from its first measure to its last', () => {
  const charts = songs.filter(song => song.pattern);
  assert.deepEqual(charts.map(s => s.id), ['lava','cant-help-falling-in-love','yesterday']);
  for (const raw of charts) {
    const song = readStrumSong(raw);
    assert.equal(song.pattern.strokes.length,song.pattern.counts.length);
    assert.equal(song.beats,song.bars.length * song.pattern.beats);
    assert.deepEqual(song.chords,[...new Set(song.events.map(e => e.chord))]);
    assert.equal(song.sections[0].first,0);
    assert.equal(song.sections.at(-1).last,song.bars.length-1);
    for (const [i,section] of song.sections.entries()) {
      const part = raw.parts[i];
      for (const start of part.lines ?? []) assert.ok(start >= 0 && start <= section.last - section.first);
      if (i) assert.equal(section.first,song.sections[i-1].last+1);
    }
    for (const [i,e] of song.events.entries()) {
      assert.equal(e.index,i); assert.equal(e.afterTie,i+1);
      assert.ok(e.soundEnd > e.beat);
      assert.ok(['D','U','-'].includes(e.stroke));
      assert.match(shapes[e.chord][0],/^\d{4}$/);
      if (Number.isFinite(e.nextChange)) assert.notEqual(song.events[e.nextChange].chord,e.chord);
    }
    const final = song.bars.at(-1);
    assert.equal(final.filter(e => e.chord === final.at(-1).chord && e.stroke !== '-').length,1);
    assert.match(song.sheet.pdf,/^https:.*\.pdf$/);
  }
});
test('voicings sound in GCEA order, reversed on an upstroke', () => {
  const tones = {C:[0,4,7],G7:[7,11,2,5],F:[5,9,0],Em:[4,7,11],Am:[9,0,4],G:[7,11,2],
    Dm:[2,5,9],B7:[11,3,6,9],A7:[9,1,4,7],Bb:[10,2,5],Em7:[4,7,11,2],Gm:[7,10,2],C7:[0,4,7,10]};
  for (const [name,expected] of Object.entries(tones)) {
    const down = chordNotes(name,'D');
    assert.deepEqual(new Set(down.map(m => m % 12)),new Set(expected));
    assert.deepEqual(chordNotes(name,'U'),[...down].reverse());
  }
});
test('Yesterday has seven-bar verses, one-beat bridge changes and a ringing final F', () => {
  const song = readStrumSong(songs.find(s => s.id === 'yesterday'));
  const verse = song.sections[1], bridge = song.sections[3];
  assert.equal(verse.last-verse.first+1,7); assert.equal(bridge.last-bridge.first+1,8);
  assert.deepEqual(song.bars[bridge.first+1].map(e=>e.chord),['Dm','C','Bb','Bb']);
  assert.deepEqual(song.bars.at(-1).map(e=>e.stroke),['D','D','D','-']);
});
test('Lava counts its silent upstroke and Elvis counts six subdivisions in two pulses', () => {
  const lava = readStrumSong(songs.find(s => s.id === 'lava'));
  assert.equal(lava.bars[0][0].soundEnd,1);
  assert.equal(lava.bars[0][1].stroke,'-');
  assert.deepEqual([...new Set(lava.events.map(e=>e.page))],[1,2,3]);
  const love = readStrumSong(songs.find(s => s.id === 'cant-help-falling-in-love'));
  assert.equal(love.bars[1][0].beat,2); assert.equal(love.bars[0][3].beat,1);
  const bridge = love.sections[3];
  assert.deepEqual(love.bars[bridge.last].map(e => e.stroke),['D','-','-','D','-','-']);
});
