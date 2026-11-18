import { shapes } from './chords.js';

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

export function makeStrumSheet(audition, seek) {
  let song, frame, page, patternCells = [], chordButtons = new Map(), barButtons = [];
  let prevEvent;
  // Mobile browsers can advertise PDF support while leaving embedded pages blank.
  const mobileReader = navigator.pdfViewerEnabled === false || matchMedia('(pointer:coarse)').matches;
  function close() {
    song = undefined; frame = undefined; page = undefined; prevEvent = undefined;
    $('published-page').replaceChildren();
  }
  function showPage(n) {
    if (n === page) return;
    page = n;
    const url = song.sheet.pdf + '#page=' + page + '&toolbar=0&navpanes=0&view=FitH';
    $('open-source').href = url;
    if (mobileReader && frame) return;
    // A fragment change on an existing Chrome PDF plugin leaves its page in place.
    frame = el('iframe','');
    frame.title = song.title + ' lyrics and chords · ' + song.sheet.publisher;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.src = mobileReader ? 'https://docs.google.com/gview?embedded=true&url=' + encodeURIComponent(song.sheet.pdf) : url;
    $('published-page').replaceChildren(frame);
  }
  function load(s) {
    close(); song = s; chordButtons = new Map(); barButtons = [];
    $('time-signature').textContent = s.meter.join('/') + ' time';
    $('pattern-note').textContent = s.pattern.tip;
    patternCells = s.pattern.counts.map((count,i) => {
      const cell = el('span',''), arrow = s.pattern.strokes[i];
      cell.setAttribute('aria-label', count + ' ' + ({D:'down',U:'up','-':'hold'})[arrow]);
      cell.append(el('small',count),el('b',({D:'↓',U:'↑','-':'·'})[arrow]));
      if (s.pattern.accents.includes(i)) cell.className = 'accent';
      return cell;
    });
    $('pattern').replaceChildren(...patternCells);
    $('chord-shapes').replaceChildren(...s.chords.map(name => {
      const b = el('button',name);
      b.className = 'chord-shape';
      const [frets,fingers] = shapes[name];
      const label = name + ' chord. ' + [...frets].map((f,i) => 'GCEA'[i] + ' ' + (f === '0' ? 'open' : 'fret ' + f + ', finger ' + fingers[i])).join('; ');
      b.setAttribute('aria-label','Hear ' + label); b.title = label;
      b.append(diagram(name)); b.onclick = () => audition(name); chordButtons.set(name,b);
      return b;
    }));
    const credit = el('a', s.sheet.publisher);
    credit.href = s.sheet.site; credit.target = '_blank'; credit.rel = 'noopener';
    $('source-credit').replaceChildren('Song sheet from ',credit,'.');
    showPage(1);
    $('chord-map').open = false;
    $('changes').replaceChildren(...s.sections.map(part => {
      const section = el('section',''), row = el('div','');
      row.className = 'bar-list'; section.append(el('h4',part.label),row);
      for (let i = part.first; i <= part.last; i++) {
        const names = s.bars[i].filter(e => e.change).map(e => e.chord).join(' · ');
        const b = el('button',names); b.title = 'Go to bar ' + (i+1); b.setAttribute('aria-label', b.title + ', ' + names);
        b.onclick = () => seek(i); barButtons[i] = b; row.append(b);
      }
      return section;
    }));
  }
  function mark(event, nextChord) {
    if (prevEvent) {
      patternCells[prevEvent.phase].classList.remove('current');
      chordButtons.get(prevEvent.chord).classList.remove('current');
      barButtons[prevEvent.bar].removeAttribute('aria-current');
    }
    patternCells[event.phase].classList.add('current');
    chordButtons.get(event.chord).classList.add('current');
    barButtons[event.bar].setAttribute('aria-current','true');
    $('current-chord').textContent = event.chord;
    $('next-chord').textContent = nextChord ? 'Next ' + nextChord : 'Ending';
    const cue = [event.part];
    if (event.line) cue.push('line ' + event.line);
    if (song.parts.some(part => part.page > 1)) cue.push('p. ' + event.page);
    $('phrase-cue').textContent = cue.join(' · ');
    showPage(event.page);
    prevEvent = event;
  }
  return {load,mark,close};
}
