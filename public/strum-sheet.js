import { shapes } from './chords.js';
import { lyricTiming } from './lyric-timing.js';

const $ = id => document.getElementById(id);
const ink = '#082f49', blue = '#0369a1';

function el(tag, text) {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}
function line(svg, tag, attrs, value) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key,val] of Object.entries(attrs)) node.setAttribute(key,val);
  if (value != null) node.textContent = value;
  svg.append(node);
}
function diagram(chord) {
  const [frets,fingers] = shapes[chord];
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 64 78'); svg.setAttribute('aria-hidden','true');
  for (let i = 0; i < 5; i++) {
    const y = 14 + 13 * i;
    line(svg,'line',{x1:11,x2:53,y1:y,y2:y,stroke:ink,'stroke-width':i ? .8 : 2.8});
  }
  for (let s = 0; s < 4; s++) {
    const x = 11 + 14 * s, fret = Number(frets[s]);
    line(svg,'line',{x1:x,x2:x,y1:14,y2:66,stroke:ink,'stroke-width':.8});
    const y = fret ? 14 + (fret - .5) * 13 : 6;
    line(svg,'circle',{cx:x,cy:y,r:fret ? 5.7 : 2.8,fill:fret ? blue : 'none',stroke:blue,'stroke-width':1});
    if (fret) line(svg,'text',{x,y:y+3.1,'text-anchor':'middle',fill:'white','font-size':10.5,'font-family':'sans-serif'}, fingers[s]);
    line(svg,'text',{x,y:76,'text-anchor':'middle',fill:'#57534e','font-size':9}, 'GCEA'[s]);
  }
  return svg;
}

const cachedWords = new Map();
async function loadWords(timing, signal) {
  if (cachedWords.has(timing.recordId)) return cachedWords.get(timing.recordId);
  const key = 'uke:lyrics:' + timing.recordId;
  const split = value => value?.trim().split(/\s+/u);
  try {
    const saved = split(localStorage.getItem(key));
    if (saved?.length === timing.wordCount) { cachedWords.set(timing.recordId,saved); return saved; }
  } catch { /* Storage is optional. */ }
  const response = await fetch('https://lrclib.net/api/get/' + timing.recordId,{signal,credentials:'omit'});
  if (!response.ok) throw new Error('Lyrics unavailable');
  const result = await response.json(), words = split(result.plainLyrics);
  if (result.id !== timing.recordId || words?.length !== timing.wordCount) throw new Error('Lyrics edition changed');
  cachedWords.set(timing.recordId,words);
  try { localStorage.setItem(key,result.plainLyrics); } catch { /* This visit still works. */ }
  return words;
}

export function makeStrumSheet(audition, seek) {
  let song, words, request, firstBar, lastBar, lastEvent, selectedCell;
  let chordButtons = new Map(), patternCells = [], cellsByEvent = [];
  const chart = $('chart');

  function close() {
    request?.abort();
    song = words = lastEvent = selectedCell = undefined;
    chart.replaceChildren();
    $('lyric-status').hidden = true;
  }
  function makeShape(name) {
    const b = el('button',name);
    b.className = 'chord-shape';
    const [frets,fingers] = shapes[name];
    const strings = [...frets].map((f,i) => 'GCEA'[i] + ' ' + (f === '0' ? 'open' : 'fret ' + f + ', finger ' + fingers[i]));
    b.setAttribute('aria-label','Hear ' + name + ' chord. ' + strings.join(', '));
    b.append(diagram(name)); b.onclick = () => audition(name); chordButtons.set(name,b);
    return b;
  }
  async function lyrics() {
    const current = song;
    request?.abort(); request = new AbortController();
    const signal = request.signal;
    const timeout = setTimeout(() => request?.signal === signal && request.abort(),12000);
    $('lyric-status').hidden = true;
    try {
      const result = await loadWords(lyricTiming[current.id],signal);
      if (song !== current || signal.aborted) return;
      words = result; draw();
    } catch {
      if (song === current && request.signal === signal) $('lyric-status').hidden = false;
    } finally { clearTimeout(timeout); }
  }
  $('retry-lyrics').onclick = lyrics;
  function load(s) {
    close(); song = s; firstBar = 0; lastBar = s.bars.length - 1;
    chordButtons = new Map();
    $('pattern-note').textContent = s.pattern.tip;
    patternCells = s.pattern.counts.map((count,i) => {
      const cell = el('span',''), stroke = s.pattern.strokes[i];
      const accented = s.pattern.accents.includes(i);
      cell.setAttribute('aria-label',count + (accented ? ' accented ' : ' ') + ({D:'downstroke',U:'upstroke','-':'hold'})[stroke]);
      const accent = el('i',accented ? '>' : '');
      accent.setAttribute('aria-hidden','true');
      cell.append(el('small',count),accent,el('b',({D:'↓',U:'↑','-':'·'})[stroke]));
      if (accented) cell.className = 'accent';
      return cell;
    });
    $('pattern').replaceChildren(...patternCells);
    $('chord-shapes').replaceChildren(...s.chords.map(makeShape));
    lyrics();
  }
  function makeLine(events, mapping) {
    const row = el('div',''); row.className = 'chart-line';
    const text = words && mapping ? words.slice(mapping[0],mapping[1]).join(' ') : '';
    const changes = events.filter(e => e.change), segments = [];
    for (const [i,event] of changes.entries()) {
      const offset = text ? mapping[2][i] : null;
      const prev = segments.at(-1);
      if (prev && prev.event.chord === event.chord && (offset == null || offset === prev.offset)) continue;
      segments.push({event,offset:offset ?? 0});
    }
    if (text && segments[0].offset > 0) {
      const lead = el('span',text.slice(0,segments[0].offset));
      lead.className = 'lyric-lead'; row.append(lead);
    }
    let index = 0;
    for (const [i,segment] of segments.entries()) {
      const {event,offset} = segment, next = segments[i+1];
      const cell = el('button','');
      cell.type = 'button'; cell.className = 'chart-cell'; cell.tabIndex = -1;
      cell.dataset.event = event.index;
      const phrase = text.slice(offset,next?.offset ?? text.length);
      const name = el('strong',event.chord);
      const endBeat = next?.event.beat ?? events.at(-1).beat + events.at(-1).beats;
      const bars = (endBeat - event.beat) / song.pattern.beats;
      if (!phrase && Number.isInteger(bars) && bars > 1) name.append(el('small',' ×' + bars));
      cell.title = 'Bar ' + (event.bar+1) + ' · ' + event.chord;
      cell.setAttribute('aria-label',cell.title + (phrase ? ', ' + phrase : ''));
      cell.append(name);
      if (phrase) cell.append(el('span',phrase));
      else cell.classList.add('instrumental');
      row.append(cell);
      while (index < events.length && events[index].index < (next?.event.index ?? Infinity)) {
        cellsByEvent[events[index++].index] = cell;
      }
    }
    return row;
  }
  function draw() {
    if (!song) return;
    const sections = [], timing = lyricTiming[song.id];
    cellsByEvent = []; selectedCell = undefined;
    song.sections.forEach((part,i) => {
      if (part.last < firstBar || part.first > lastBar) return;
      const section = el('section',''); section.className = 'chart-section'; section.append(el('h3',part.label));
      const starts = song.parts[i].lines ?? [0];
      starts.forEach((start,j) => {
        const begin = part.first + start, end = starts[j+1] == null ? part.last+1 : part.first+starts[j+1];
        section.append(makeLine(song.bars.slice(begin,end).flat(),timing.sections[i][j]));
      });
      sections.push(section);
    });
    chart.replaceChildren(...sections);
    if (lastEvent) mark(lastEvent);
  }
  function range(first,last) { firstBar = first; lastBar = last; draw(); }
  function mark(event, follow = false) {
    if (lastEvent) {
      patternCells[lastEvent.phase].classList.remove('current');
      chordButtons.get(lastEvent.chord).classList.remove('current');
    }
    patternCells[event.phase].classList.add('current');
    chordButtons.get(event.chord).classList.add('current');
    const next = cellsByEvent[event.index];
    if (next && next !== selectedCell) {
      const previousRow = selectedCell?.parentElement;
      if (selectedCell) { selectedCell.removeAttribute('aria-current'); selectedCell.tabIndex = -1; }
      selectedCell = next; next.tabIndex = 0; next.setAttribute('aria-current','true');
      if (follow && previousRow !== next.parentElement) {
        const r = next.getBoundingClientRect(), controls = document.querySelector('.transport').getBoundingClientRect();
        if (r.top < controls.bottom || r.bottom > innerHeight) next.scrollIntoView({block:'center',behavior:'instant'});
      }
    }
    lastEvent = event;
  }
  chart.onclick = e => {
    const cell = e.target.closest('.chart-cell');
    if (cell) seek(Number(cell.dataset.event));
  };
  chart.onkeydown = e => {
    if (!e.target.matches('.chart-cell') || !['ArrowRight','ArrowLeft','Home','End'].includes(e.key)) return;
    const cells = [...chart.querySelectorAll('.chart-cell')];
    const i = cells.indexOf(e.target);
    const index = {Home:0,End:cells.length-1,ArrowRight:i+1,ArrowLeft:i-1}[e.key];
    e.preventDefault();
    if (cells[index]) { cells[index].focus(); seek(Number(cells[index].dataset.event)); }
  };
  return {load,range,mark,close};
}
