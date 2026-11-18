import { frequency } from './music.js';

let context, wave;
const sounding = new Set();

export async function audioContext() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) throw new Error('Audio playback is unavailable in this browser.');
  if (!context) {
    context = new Audio();
    wave = context.createPeriodicWave(new Float32Array(6), new Float32Array([0,1,.48,.24,.12,.06]));
  }
  if (context.state !== 'running') await context.resume();
  return context;
}

export function pluck(midi, when, duration) {
  const osc = context.createOscillator(), gain = context.createGain(), filter = context.createBiquadFilter();
  const hz = frequency(midi), length = Math.min(2.5, duration * .98);
  osc.frequency.value = hz;
  osc.setPeriodicWave(wave);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(hz * 9, 7200), when);
  filter.frequency.exponentialRampToValueAtTime(hz * 1.7, when + length);
  gain.gain.setValueAtTime(.0001, when);
  gain.gain.exponentialRampToValueAtTime(.28, when + .006);
  gain.gain.exponentialRampToValueAtTime(.07, when + length * .55);
  gain.gain.exponentialRampToValueAtTime(.0001, when + length);
  osc.connect(filter).connect(gain).connect(context.destination);
  osc.onended = () => { sounding.delete(osc); osc.disconnect(); gain.disconnect(); filter.disconnect(); };
  sounding.add(osc);
  osc.start(when); osc.stop(when + length + .01);
}

export function silence() {
  for (const osc of sounding) osc.stop();
  sounding.clear();
}
