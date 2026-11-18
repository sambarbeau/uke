import { strings, frequency } from './music.js';

// Normalized autocorrelation over the playable open-string neighborhood.
// The earliest strong local maximum avoids choosing a multiple of the period.
export function detectPitch(samples, sampleRate) {
  const minLag = Math.floor(sampleRate / 700), maxLag = Math.ceil(sampleRate / 155);
  const size = samples.length - maxLag - 1;
  if (size < maxLag) return null;
  let energy = 0;
  for (let i = 0; i < size; i++) energy += samples[i] ** 2;
  if (energy / size < 0.000045) return null;
  const scores = new Float32Array(maxLag + 2);
  for (let lag = minLag - 1; lag <= maxLag + 1; lag++) {
    let product = 0, shifted = 0;
    for (let i = 0; i < size; i++) {
      product += samples[i] * samples[i + lag];
      shifted += samples[i + lag] ** 2;
    }
    scores[lag] = 2 * product / (energy + shifted);
  }
  let best = 0;
  const peaks = [];
  for (let lag = minLag; lag <= maxLag; lag++) {
    if (scores[lag] > .86 && scores[lag] >= scores[lag - 1] && scores[lag] > scores[lag + 1]) {
      best = Math.max(best, scores[lag]); peaks.push(lag);
    }
  }
  const lag = peaks.find(l => scores[l] >= best * .98);
  if (!lag) return null;
  const left = scores[lag-1], center = scores[lag], right = scores[lag+1];
  const offset = .5 * (left - right) / (left - 2 * center + right);
  return sampleRate / (lag + offset);
}

export function tuningReading(hz) {
  const readings = strings.map(s => ({ name:s.name, cents:1200 * Math.log2(hz / frequency(s.midi)) }));
  const closest = readings.reduce((best, r) => Math.abs(r.cents) < Math.abs(best.cents) ? r : best);
  return Math.abs(closest.cents) <= 100 ? closest : null;
}
