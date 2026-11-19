import { fingering, strings, barNumber } from './music.js';

function svgElement(name, attrs, text) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  if (text != null) el.textContent = text;
  return el;
}

export function drawFingerboard(container, song) {
  const frets = Math.max(4, ...song.events.map(note => note.fret));
  const svg = svgElement('svg', {viewBox:'0 0 160 ' + (47 + 23 * frets)});
  const rail = [36,65,94,123], top = 37;
  [...strings].reverse().forEach((s,i) => {
    svg.append(svgElement('text',{x:rail[i],y:13,'text-anchor':'middle',fill:'#57534e','font-size':13},s.name));
    svg.append(svgElement('line',{x1:rail[i],x2:rail[i],y1:top,y2:top+23*frets,stroke:'#928e88'}));
  });
  for (let fret = 0; fret <= frets; fret++) {
    const y = top + 23 * fret;
    svg.append(svgElement('line',{x1:rail[0],x2:rail[3],y1:y,y2:y,stroke:'#817e79','stroke-width':fret ? 1 : 3}));
    if (fret) svg.append(svgElement('text',{x:18,y:y-7,'text-anchor':'middle',fill:'#57534e','font-size':12},fret));
  }
  const notes = new Map();
  for (const note of song.events) {
    const position = note.string + '-' + note.fret;
    if (notes.has(position)) continue;
    const x = rail[4-note.string], y = note.fret ? top + 23 * (note.fret-.5) : top - 11;
    const mark = svgElement('g',{class:'fret-position'});
    mark.append(svgElement('circle',{cx:x,cy:y,r:8.6}));
    mark.append(svgElement('text',{x,y:y+3.9,'text-anchor':'middle','font-size':11.5},note.pitch.slice(0,-1)));
    notes.set(position,mark); svg.append(mark);
  }
  container.replaceChildren(svg);
  let current;
  return note => {
    current?.classList.remove('current');
    current = notes.get(note.string + '-' + note.fret);
    current?.classList.add('current');
  };
}

// Each quarter beat occupies the same horizontal space within a system.
// Long sung syllables increase the minimum spacing before bars wrap.
export function drawScore(container, song, firstBar, lastBar) {
  const width = Math.floor(container.clientWidth);
  if (!width) return;
  const rows = [];
  let row = [], used = 0;
  for (const bar of song.bars.slice(firstBar, lastBar + 1)) {
    const beats = bar.reduce((sum,n) => sum + n.beats,0);
    const unit = Math.max(29, ...bar.map(n => (n.lyric.length * 9 + 10) / n.beats));
    const natural = beats * unit + 12;
    if (row.length && (used+natural+29 > width || row.length === 4)) {
      rows.push(row); row = []; used = 0;
    }
    row.push({bar,beats,natural}); used += natural;
  }
  if (row.length) rows.push(row);
  const systems = rows.map(measures => {
    const wrap = document.createElement('div'); wrap.className = 'system';
    const first = measures[0].bar[0].bar;
    const svg = svgElement('svg',{viewBox:'0 0 ' + width + ' 108',role:'group',
      'aria-label':barNumber(song,first)+' through '+barNumber(song,first+measures.length-1)});
    wrap.append(svg);
    const left = 25, right = width - 3, top = 43, gap = 14;
    strings.forEach((string,i) => {
      const y = top+i*gap;
      svg.append(svgElement('text',{x:5,y:y+4,class:'tab-label'},string.name));
      svg.append(svgElement('line',{x1:left,x2:right,y1:y,y2:y,class:'tab-rule'}));
    });
    let x = left;
    const total = measures.reduce((sum,m)=>sum+m.natural,0);
    svg.append(svgElement('line',{x1:left,x2:left,y1:top,y2:top+3*gap,class:'tab-rule'}));
    for (const {bar,beats,natural} of measures) {
      const span = (right-left) * natural / total, unit = (span-10)/beats;
      const centers = bar.map(n => x+5+(n.beat-bar[0].beat+.5*Math.min(1,n.beats))*unit);
      bar.forEach((n,j) => {
        const cx = centers[j], y = top + (n.string-1)*gap;
        if (n.lyric) svg.append(svgElement('text',{x:cx,y:21,'text-anchor':'middle',class:'lyric'},n.lyric));
        svg.append(svgElement('text',{x:cx,y:y+4.5,'text-anchor':'middle',class:'tab-fret'},n.tied?'('+n.fret+')':n.fret));
        const start = j ? (centers[j-1]+cx)/2 : x;
        const end = j+1 < bar.length ? (centers[j+1]+cx)/2 : x+span;
        svg.append(svgElement('rect',{x:start,y:2,width:end-start,height:94,rx:3,class:'note-target',
          'data-index':n.index,role:'button',tabindex:-1,'aria-label':barNumber(song,n.bar)+', '+(n.tied?'hold ':'')+n.pitch+', '+fingering(n)+(n.lyric?', '+n.lyric:'')}));
      });
      x += span;
      svg.append(svgElement('line',{x1:x,x2:x,y1:top,y2:top+3*gap,class:'tab-rule'}));
    }
    return wrap;
  });
  container.replaceChildren(...systems);
}
