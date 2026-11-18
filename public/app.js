import { songs } from './songs.js';
import { readSong, fingering, barNumber } from './music.js';
import { drawScore, drawFingerboard } from './score.js';
import { audioContext, pluck, silence } from './audio.js';
import { makeTuner } from './tuner.js';
import { makeLessons } from './lessons.js';

const $ = id => document.getElementById(id);
const library = songs.map(readSong), tuner = makeTuner(), lessons = makeLessons();
let mode;
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
  const barCount = song.bars.length - (song.pickup ? 1 : 0);
  $('position').textContent = song.pickup && event.bar === 0 ? 'Pickup · ' + barCount + ' bars' : barNumber(song,event.bar) + ' of ' + barCount;
  if (follow && target && previousRow !== target.ownerSVGElement) {
    const box = target.getBoundingClientRect();
    if (box.bottom > innerHeight || box.top < 0) target.scrollIntoView({ block:'center', behavior:'instant' });
  }
}
function render() {
  if ($('practice').hidden || mode !== 'score') return;
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
    $('position').textContent = 'Finished · ' + barNumber(song,lastBar).toLowerCase();
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
    const length = cycleStart + (Math.min(event.soundEnd,endBeat) - startBeat) * seconds - onset;
    if (length > .015) pluck(event.midi, onset, length);
    scheduleIndex = event.afterTie;
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
  const selection = $('section').selectedOptions[0];
  firstBar = Number(selection.value === 'all' ? 0 : selection.value);
  lastBar = Number(selection.dataset.last ?? song.bars.length - 1);
  startBeat = song.bars[firstBar][0].beat;
  const last = song.bars[lastBar].at(-1);
  endBeat = last.beat + last.beats;
  cursor = startBeat; selected = undefined;
  setNote(song.bars[firstBar][0]); render();
}
function showMode(next) {
  stop(); lessons.close(); mode = next;
  for (const value of ['score','lesson','sheet']) {
    $(value + '-view').hidden = value !== mode;
    $('mode-' + value).setAttribute('aria-pressed',String(value === mode));
  }
  $('finger-panel').hidden = mode !== 'score';
  if (mode === 'lesson') lessons.video(song);
  if (mode === 'sheet') lessons.sheet(song);
  if (mode === 'score') render();
}
for (const value of ['score','lesson','sheet']) $('mode-' + value).onclick = () => showMode(value);
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
  const addPassage = (label,first,last) => {
    const opt = new Option(label,first); opt.dataset.last = last; $('section').add(opt);
  };
  for (const part of song.sections ?? []) addPassage(part.label,part.first,part.last);
  const pickup = song.pickup ? 1 : 0;
  if (song.bars.length > 4) for (let i = pickup; i < song.bars.length; i += 4) {
    const last = Math.min(i+3,song.bars.length-1);
    addPassage('Bars ' + (i+1-pickup) + '–' + (last+1-pickup),i,last);
  }
  $('modes').hidden = !song.lesson;
  $('mode-score').textContent = song.exercise ? 'Picking exercise' : 'Score';
  $('exercise').hidden = !song.exercise;
  $('exercise').textContent = song.exercise ?? '';
  mode = undefined;
  $('message').textContent = ''; range();
  showMode(song.exercise ? 'lesson' : 'score');
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
    if (song !== next) loadSong(next.id); else showMode(mode);
  } else lessons.close();
}
for (const s of library) {
  const b = document.createElement('button'), meta = document.createElement('span');
  b.className = 'song'; b.append(s.title); meta.textContent = s.shortCredit + ' · ' + (s.exercise ? 'video lesson' : (s.bars.length - (s.pickup ? 1 : 0)) + ' bars'); b.append(meta);
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
function releaseAudio() { stop(); tuner.stop(); if (mode === 'lesson') lessons.video(song); }
window.addEventListener('pagehide', releaseAudio);
document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAudio(); });
let lastWidth;
new ResizeObserver(() => {
  const width = $('score').clientWidth;
  if (width && width !== lastWidth && song) { lastWidth = width; render(); }
}).observe($('score'));
route();
