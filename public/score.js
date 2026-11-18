import { durations, fingering, strings, barNumber } from './music.js';

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

export function drawScore(container, song, firstBar, lastBar) {
  const VF = window.Vex.Flow;
  const width = Math.floor(container.clientWidth);
  if (!width) return;
  const rows = [];
  let row = [], used = 0;
  for (const bar of song.bars.slice(firstBar, lastBar + 1)) {
    const weight = 18 + bar.reduce((sum, n) => sum + Math.max(29, n.lyric.length * 7 + 8), 0);
    if (row.length && (used + weight + 85 > width || row.length === 4)) {
      rows.push(row); row = []; used = 0;
    }
    row.push({ bar, weight }); used += weight;
  }
  if (row.length) rows.push(row);
  container.replaceChildren();
  const ink = '#082f49', paper = '#f8f7f3';
  for (const measures of rows) {
    const line = document.createElement('div');
    line.className = 'system';
    container.append(line);
    const renderer = new VF.Renderer(line, VF.Renderer.Backends.SVG);
    const lyrics = measures.some(({ bar }) => bar.some(n => n.lyric));
    const offset = lyrics ? 17 : 0;
    const height = 147 + offset;
    renderer.resize(width, height);
    const ctx = renderer.getContext();
    ctx.setFillStyle(ink).setStrokeStyle(ink).setBackgroundFillStyle(paper);
    const svg = line.querySelector('svg');
    const first = measures[0].bar[0].bar;
    svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', barNumber(song,first) + ' through ' + barNumber(song,first + measures.length - 1));
    const weightSum = measures.reduce((sum, m) => sum + m.weight, 0);
    const lead = first === firstBar ? 68 : 46;
    const available = width - 10 - lead;
    let x = 4;
    const engravings = new Map();
    measures.forEach(({ bar, weight }, m) => {
      const start = m === 0;
      const barWidth = available * weight / weightSum + (start ? lead : 0);
      const stave = new VF.Stave(x, -1 + offset, barWidth);
      const tab = new VF.TabStave(x, 69 + offset, barWidth, { num_lines:4, spacing_between_lines_px:10 });
      if (start) {
        stave.addClef('treble').addKeySignature(song.key);
        if (first === firstBar) stave.addTimeSignature(song.meter.join('/'));

      } else {
        stave.setBegBarType(VF.Barline.type.NONE); tab.setBegBarType(VF.Barline.type.NONE);
      }
      if (bar[0].bar === song.bars.length - 1) {
        stave.setEndBarType(VF.Barline.type.END); tab.setEndBarType(VF.Barline.type.END);
      }
      stave.setContext(ctx).draw(); tab.setContext(ctx).draw();
      tab.setNoteStartX(stave.getNoteStartX());
      if (start) new VF.StaveConnector(stave, tab).setType(VF.StaveConnector.type.SINGLE_LEFT).setContext(ctx).draw();
      if (start) {
        // Label each tab line with its string, in playing order.
        svg.append(svgElement('rect', { x:x+3, y:tab.getYForLine(0)-8, width:18, height:46, fill:paper, stroke:'none' }));
        strings.forEach((string,i) => svg.append(svgElement('text', { x:x+12, y:tab.getYForLine(i)+3.5,
          'text-anchor':'middle', 'font-family':'Georgia, serif', 'font-size':12, fill:ink, stroke:'none' }, string.name)));
      }
      const notes = bar.map(n => {
        const note = new VF.StaveNote({ keys:[n.key], duration:durations[n.beats], auto_stem:true });
        if (durations[n.beats].endsWith('d')) VF.Dot.buildAndAttach([note]);
        return note;
      });
      const frets = bar.map(n => new VF.TabNote({ positions:[{ str:n.string, fret:n.fret }], duration:durations[n.beats] }));
      const time = { num_beats:song.meter[0], beat_value:song.meter[1] };
      const voiceMode = song.pickup && (bar[0].bar === 0 || bar[0].bar === song.bars.length - 1) ? VF.Voice.Mode.SOFT : VF.Voice.Mode.STRICT;
      const melody = new VF.Voice(time).setMode(voiceMode).addTickables(notes);
      const tablature = new VF.Voice(time).setMode(voiceMode).addTickables(frets);
      VF.Accidental.applyAccidentals([melody], song.key);
      const beams = VF.Beam.generateBeams(notes, { groups:VF.Beam.getDefaultBeamGroups(song.meter.join('/')) });
      new VF.Formatter().joinVoices([melody]).joinVoices([tablature]).formatToStave([melody, tablature], stave);
      melody.draw(ctx, stave); tablature.draw(ctx, tab);
      beams.forEach(b => b.setContext(ctx).draw());
      const centers = notes.map(n => n.getNoteHeadBeginX() + n.getGlyphWidth()/2);
      bar.forEach((n, j) => {
        const center = centers[j];
        engravings.set(n.index,notes[j]);
        if (n.lyric) svg.append(svgElement('text', { x:center, y:23, 'text-anchor':'middle', class:'lyric' }, n.lyric));
        const left = j ? (centers[j-1] + center)/2 : center - Math.min(18, center - x);
        const right = centers[j+1] ? (center + centers[j+1])/2 : x + barWidth - 2;
        svg.append(svgElement('rect', { x:left, y:lyrics ? 5 : 12, width:Math.max(1,right-left), height:height - (lyrics ? 12 : 19),
          rx:3, class:'note-target', 'data-index':n.index, role:'button', tabindex:-1,
          'aria-label':barNumber(song,n.bar) + ', ' + n.pitch + ', ' + fingering(n) + (n.lyric ? ', ' + n.lyric : '') }));
      });
      x += barWidth;
    });
    const tie = (left, right) => new VF.StaveTie({first_note:left,last_note:right,first_indices:[0],last_indices:[0]}).setContext(ctx).draw();
    for (const [index, note] of engravings) {
      if (song.events[index].tied) tie(engravings.get(index-1),note);
      if (song.events[index+1]?.tied && !engravings.has(index+1)) tie(note,undefined);
    }
  }
}
