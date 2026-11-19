import { songs } from './songs.js';
import { readSong, fingering, barNumber } from './music.js';
import { drawScore, drawFingerboard } from './score.js';
import { audioContext, pluck, silence } from './audio.js';
import { makeTuner } from './tuner.js';
import { savedSheetLink } from './personal-sheet.js';
import { readStrumSong, chordNotes } from './chords.js';
import { makeStrumSheet } from './strum-sheet.js';

const $ = id => document.getElementById(id);
const library = songs.map(s => s.pattern ? readStrumSong(s) : readSong(s));
const tuner = makeTuner(), showSavedSheet = savedSheetLink($('saved-sheet'));
const strums = makeStrumSheet(hearChord, seekChord);
let song, bpm, firstBar, lastBar, startBeat, endBeat, cursor, selected;
let loop = false, playing = false, generation = 0, clock, origin, frame, tick, scheduleIndex, cycleStart;

let targets = [], markFret;
const smallScreen = matchMedia('(max-width:720px)');
function placeChordReference() {
  $(smallScreen.matches ? 'inline-reference' : 'side-reference').append($('chord-reference'));
}
smallScreen.addEventListener('change',placeChordReference);
placeChordReference();

function setNote(event, follow = false) {
  if (song.pattern) {
    selected = event.index;
    strums.mark(event, follow);
    $('position').textContent = event.part + ' · Bar ' + (event.bar + 1);
    return;
  }
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
    markFret(event);
  }
  const barCount = song.bars.length - (song.pickup ? 1 : 0);
  $('position').textContent = song.pickup && event.bar === 0 ? 'Pickup · ' + barCount + ' bars' : barNumber(song,event.bar) + ' of ' + barCount;
  if (follow && target && previousRow !== target.ownerSVGElement) {
    const box = target.getBoundingClientRect();
    if (box.bottom > innerHeight || box.top < 0) target.scrollIntoView({ block:'center', behavior:'instant' });
  }
}
function render() {
  if ($('practice').hidden || song.pattern) return;
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
function soundChord(name, stroke, when, length, volume) {
  const spacing = Math.min(.016, length / 7);
  chordNotes(name,stroke).forEach((midi,i) => pluck(midi, when + i * spacing, length - i * spacing, volume));
}
async function hearChord(name) {
  stop(); const current = generation;
  try {
    const ctx = await audioContext();
    if (current === generation) soundChord(name,'D',ctx.currentTime,1.2,.47);
  } catch { if (current === generation) $('message').textContent = 'Chord audio is unavailable.'; }
}
function seekChord(index) {
  const resume = playing, event = song.events[index];
  stop(false); cursor = event.beat; setNote(event);
  if (resume) play(); else hearChord(event.chord);
}
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
    if (length > .015) {
      if (!song.pattern) pluck(event.midi, onset, length);
      else if (event.stroke !== '-') soundChord(event.chord,event.stroke,onset,length,event.accent ? .65 : .29);
    }
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
  if (song.pattern) strums.range(firstBar,lastBar);
  setNote(song.bars[firstBar][0]); render();
}
function loadSong(id) {
  stop(false); strums.close(); song = library.find(s => s.id === id) ?? library[0];
  targets = [];
  $('credit').textContent = song.credit;
  document.title = song.title + ' · ukulele · Sam Barbeau';
  const strummed = Boolean(song.pattern);
  $('practice').classList.toggle('strummed',strummed);
  for (const id of ['finger-panel','mobile-finger','score']) $(id).hidden = strummed;
  for (const id of ['strum-setup','lyric-sheet']) $(id).hidden = !strummed;
  $('chord-reference').hidden = !strummed;
  $('score').replaceChildren();
  function sourceLink(label,url) {
    const link = document.createElement('a');
    link.textContent = label; link.href = url; link.target = '_blank'; link.rel = 'noopener'; return link;
  }
  if (strummed) {
    strums.load(song);
    $('credits').replaceChildren(sourceLink(song.sheet.publisher,song.sheet.site),' · ',sourceLink('Lyrics via LRCLIB','https://lrclib.net/'));
  } else {
    markFret = drawFingerboard($('fingerboard'),song);
    $('credits').replaceChildren(sourceLink('Rock Class 101 lesson',song.reference.url));
  }
  showSavedSheet(song.id);
  $('song-select').value = song.id;
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
  if (!strummed && song.bars.length > 4) for (let i = pickup; i < song.bars.length; i += 4) {
    const last = Math.min(i+3,song.bars.length-1);
    addPassage('Bars ' + (i+1-pickup) + '–' + (last+1-pickup),i,last);
  }
  $('message').textContent = ''; range();
}
function route() {
  const hash = location.hash.slice(1), tuning = hash === 'tuner';
  stop(); tuner.stop();
  $('practice').hidden = tuning; $('tuner').hidden = !tuning;
  $('practice-view').setAttribute('aria-pressed',String(!tuning));
  $('tuner-view').setAttribute('aria-pressed',String(tuning));
  $('message').textContent = '';
  if (tuning) document.title = 'Tuner · ukulele · Sam Barbeau';
  if (!tuning) {
    const next = library.find(s => s.id === hash) ?? library[0];
    if (song !== next) loadSong(next.id);
    else { document.title = song.title + ' · ukulele · Sam Barbeau'; render(); }
  }
}
for (const s of library) $('song-select').add(new Option(s.title,s.id));
$('song-select').onchange = e => { location.hash = e.target.value; };
$('practice-view').onclick = () => { if ($('practice').hidden) location.hash = (song ?? library[0]).id; };
$('tuner-view').onclick = () => { location.hash = 'tuner'; };
$('play').onclick = () => {
  if (playing) { stop(); return; }
  play();
  const reading = song.pattern ? $('chart').querySelector('[aria-current]') : targets[noteAt(cursor).index];
  if (!reading) return;
  const box = reading.getBoundingClientRect();
  const controls = $('play').closest('.transport').offsetHeight;
  if (box.top > innerHeight * .48 || box.bottom < controls) {
    window.scrollBy({top:box.top-controls-8, behavior:'instant'});
  }
};
$('restart').onclick = () => { stop(false); cursor = startBeat; setNote(song.bars[firstBar][0]); };
$('tempo').onchange = () => {
  const resume = playing; stop(); bpm = Number($('tempo').value); if (resume) play();
};
$('repeat').onchange = () => {
  const resume = playing; stop(); loop = $('repeat').checked;
  if (resume) play(); else if (song.pattern) setNote(song.events[selected]);
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
  if (width && width !== lastWidth && song && !song.pattern) { lastWidth = width; render(); }
}).observe($('score'));
route();
