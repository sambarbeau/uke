import { songs } from './songs.js';
import { readSong, fingering } from './music.js';
import { drawScore, drawFingerboard } from './score.js';
import { audioContext, pluck, silence } from './audio.js';
import { makeTuner } from './tuner.js';

const $ = id => document.getElementById(id);
const library = songs.map(readSong), tuner = makeTuner();
let song, bpm, firstBar, lastBar, startBeat, endBeat, cursor, selected;
let loop = false, playing = false, generation = 0, clock, origin, frame, tick, scheduleIndex, cycleStart;
const buttons = new Map();
let targets = [];

function setNote(event, follow = false) {
  const changed = selected !== event.index;
  targets[selected]?.classList.remove('selected');
  targets[selected]?.setAttribute('tabindex', '-1');
  const previousRow = targets[selected]?.ownerSVGElement;
  selected = event.index;
  const target = targets[selected];
  target?.classList.add('selected'); target?.setAttribute('tabindex', '0');
  if (changed || !$('finger-note').textContent) {
    $('finger-note').textContent = event.pitch;
    $('finger-caption').textContent = fingering(event);
    $('mobile-finger').textContent = event.pitch + ' · ' + fingering(event);
    drawFingerboard($('fingerboard'), event);
  }
  $('position').textContent = 'Bar ' + (event.bar+1) + ' of ' + song.bars.length;
  if (follow && target && previousRow !== target.ownerSVGElement) {
    const box = target.getBoundingClientRect();
    if (box.bottom > innerHeight || box.top < 0) target.scrollIntoView({ block:'center', behavior:'instant' });
  }
}
function render() {
  if ($('practice').hidden) return;
  drawScore($('score'), song, firstBar, lastBar);
  targets = [];
  $('score').querySelectorAll('.note-target').forEach(t => { targets[Number(t.dataset.index)] = t; });
  setNote(song.events[selected]);
}
function currentBeat() {
  if (!playing) return cursor;
  const beat = Math.max(startBeat, (clock.currentTime - origin) * bpm / 60);
  return loop ? startBeat + (beat - startBeat) % (endBeat - startBeat) : Math.min(beat, endBeat);
}
function noteAt(beat) {
  return song.events.findLast(n => n.beat <= Math.min(beat, endBeat - .0001));
}
function stop(remember = true) {
  if (playing && remember) cursor = currentBeat();
  generation++; playing = false;
  clearInterval(tick); cancelAnimationFrame(frame); silence();
  $('play-text').textContent = 'Play'; $('play').classList.remove('playing');
}
function updateView() {
  if (!playing) return;
  const beat = currentBeat();
  if (beat >= endBeat) {
    stop(false); cursor = startBeat;
    setNote(song.bars[lastBar].at(-1));
    $('position').textContent = 'Finished · bar ' + (lastBar+1);
    return;
  }
  const event = noteAt(beat);
  if (event.index !== selected) setNote(event, true);
  frame = requestAnimationFrame(updateView);
}
// Schedule against the audio clock. Only the small look-ahead window needs canceling on seek.
function schedule() {
  const horizon = clock.currentTime + .16, seconds = 60 / bpm;
  while (true) {
    if (scheduleIndex > song.bars[lastBar].at(-1).index) {
      if (!loop) return;
      scheduleIndex = song.bars[firstBar][0].index;
      cycleStart += (endBeat - startBeat) * seconds;
    }
    const event = song.events[scheduleIndex];
    const when = cycleStart + (event.beat - startBeat) * seconds;
    if (when >= horizon) return;
    const onset = Math.max(when, clock.currentTime);
    const length = when + event.beats * seconds - onset;
    if (length > .015) pluck(event.midi, onset, length);
    scheduleIndex++;
  }
}
async function play() {
  stop(false); const current = generation;
  try {
    const context = await audioContext();
    if (generation !== current) return;
    if (cursor >= endBeat || cursor < startBeat) cursor = startBeat;
    clock = context;
    origin = clock.currentTime + .025 - cursor * 60 / bpm;
    cycleStart = origin + startBeat * 60 / bpm;
    scheduleIndex = noteAt(cursor).index;
    playing = true;
    $('message').textContent = ''; $('play-text').textContent = 'Pause'; $('play').classList.add('playing');
    setNote(noteAt(cursor)); schedule(); tick = setInterval(schedule, 40); updateView();
  } catch { if (generation === current) { stop(); $('message').textContent = 'Playback is unavailable. Check your browser’s audio settings.'; } }
}
async function pick(index) {
  const resume = playing;
  stop(false); cursor = song.events[index].beat; setNote(song.events[index]);
  if (resume) { await play(); return; }
  const current = generation;
  try {
    const ctx = await audioContext();
    if (current === generation) pluck(song.events[index].midi, ctx.currentTime, .85);
  } catch { if (current === generation) $('message').textContent = 'Couldn’t play that note. Check your audio settings.'; }
}
function range() {
  stop(false);
  const all = $('section').value === 'all';
  firstBar = all ? 0 : Number($('section').value);
  lastBar = all ? song.bars.length-1 : Math.min(firstBar+3, song.bars.length-1);
  startBeat = song.bars[firstBar][0].beat;
  const last = song.bars[lastBar].at(-1);
  endBeat = last.beat + last.beats;
  cursor = startBeat; selected = undefined;
  setNote(song.bars[firstBar][0]); render();
}
function loadSong(id) {
  stop(false); song = library.find(s => s.id === id) ?? library[0];
  $('title').textContent = song.title; $('credit').textContent = song.credit;
  $('score-info').textContent = song.key + ' major · ' + song.meter.join('/') + ' · high-G ukulele';
  $('song-select').value = song.id;
  buttons.forEach((b,k) => b.setAttribute('aria-pressed', String(k === song.id)));
  $('tempo').replaceChildren();
  for (const factor of [.5,.75,1,1.25,1.5]) {
    const speed = Math.round(song.bpm * factor);
    $('tempo').add(new Option(speed + ' BPM', speed, false, factor === 1));
  }
  bpm = song.bpm; loop = false; $('repeat').checked = false;
  $('section').replaceChildren(new Option('Whole song','all'));
  for (let i = 0; i < song.bars.length; i += 4) $('section').add(new Option('Bars ' + (i+1) + '–' + Math.min(i+4,song.bars.length), i));
  $('message').textContent = ''; range();
}
function route() {
  const hash = location.hash.slice(1), tuning = hash === 'tuner';
  stop(); tuner.stop();
  $('practice').hidden = tuning; $('tuner').hidden = !tuning;
  $('practice-view').setAttribute('aria-pressed',String(!tuning));
  $('tuner-view').setAttribute('aria-pressed',String(tuning));
  $('message').textContent = '';
  if (!tuning) {
    const next = library.find(s => s.id === hash) ?? library[0];
    if (song !== next) loadSong(next.id); else render();
  }
}
for (const s of library) {
  const b = document.createElement('button'), meta = document.createElement('span');
  b.className = 'song'; b.append(s.title); meta.textContent = s.shortCredit + ' · ' + s.bars.length + ' bars'; b.append(meta);
  b.onclick = () => { location.hash = s.id; };
  $('songs').append(b); buttons.set(s.id,b); $('song-select').add(new Option(s.title,s.id));
}
$('song-select').onchange = e => { location.hash = e.target.value; };
$('practice-view').onclick = () => { if ($('practice').hidden) location.hash = (song ?? library[0]).id; };
$('tuner-view').onclick = () => { location.hash = 'tuner'; };
$('play').onclick = () => playing ? stop() : play();
$('restart').onclick = () => { stop(false); cursor = startBeat; setNote(song.bars[firstBar][0]); };
$('tempo').onchange = () => {
  const resume = playing; stop(); bpm = Number($('tempo').value); if (resume) play();
};
$('repeat').onchange = () => {
  const resume = playing; stop(); loop = $('repeat').checked;
  if (resume) play();
};
$('section').onchange = range;
$('score').onclick = e => { const t = e.target.closest('.note-target'); if (t) pick(Number(t.dataset.index)); };
$('score').onkeydown = e => {
  const t = e.target.closest('.note-target'); if (!t) return;
  const idx = Number(t.dataset.index);
  const indices = { ArrowLeft:idx-1, ArrowRight:idx+1, Home:song.bars[firstBar][0].index, End:song.bars[lastBar].at(-1).index, Enter:idx, ' ':idx };
  if (!(e.key in indices)) return;
  e.preventDefault();
  const target = targets[indices[e.key]];
  if (target) { target.focus(); pick(indices[e.key]); }
};
window.addEventListener('hashchange', route);
function releaseAudio() { stop(); tuner.stop(); }
window.addEventListener('pagehide', releaseAudio);
document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAudio(); });
let lastWidth;
new ResizeObserver(() => {
  const width = $('score').clientWidth;
  if (width && width !== lastWidth && song) { lastWidth = width; render(); }
}).observe($('score'));
route();
