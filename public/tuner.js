import { audioContext, pluck, silence } from './audio.js';
import { strings } from './music.js';
import { detectPitch, tuningReading } from './pitch.js';

export function makeTuner() {
  const byId = id => document.getElementById(id);
  let generation = 0, active = false, stream, source, analyser, frame, referenceTimer;
  const mic = byId('mic'), message = byId('mic-message'), needle = byId('needle');
  const detected = byId('detected'), reading = byId('reading');

  function display(note, caption, cents) {
    detected.textContent = note;
    if (reading.textContent !== caption) reading.textContent = caption;
    needle.hidden = cents == null;
    if (cents != null) needle.style.left = Math.max(0, Math.min(100, 50 + cents)) + '%';
  }

  function stop() {
    generation++; active = false;
    cancelAnimationFrame(frame); clearTimeout(referenceTimer);
    source?.disconnect(); analyser?.disconnect();
    stream?.getTracks().forEach(t => { t.onended = null; t.stop(); });
    source = analyser = stream = null;
    silence();
    byId('reference-buttons').querySelector('.active')?.classList.remove('active');
    mic.textContent = 'Start microphone'; message.textContent = '';
    display('—', 'Microphone off', null);
  }

  async function start() {
    stop();
    const current = generation;
    if (!navigator.mediaDevices?.getUserMedia) {
      message.textContent = 'Microphone access needs HTTPS or localhost and a supported browser. You can use the reference tones below.';
      return;
    }
    active = true; mic.textContent = 'Cancel'; display('—', 'Waiting for microphone permission', null);
    try {
      const audio = await audioContext();
      if (current !== generation) return;
      const input = await navigator.mediaDevices.getUserMedia({ audio:{ echoCancellation:false, noiseSuppression:false, autoGainControl:false }, video:false });
      if (current !== generation) { input.getTracks().forEach(t => t.stop()); return; }
      stream = input;
      stream.getAudioTracks()[0].onended = () => { stop(); message.textContent = 'The microphone disconnected. Reconnect it and try again.'; };
      source = audio.createMediaStreamSource(stream); analyser = audio.createAnalyser();
      analyser.fftSize = audio.sampleRate > 96000 ? 4096 : 2048; source.connect(analyser);
      const buffer = new Float32Array(analyser.fftSize);
      mic.textContent = 'Stop microphone'; display('—', 'Listening for a string…', null);
      let last = -Infinity, lastSignal = -Infinity, recent = [];
      function listen(time) {
        if (current !== generation) return;
        if (time - last >= 75) {
          last = time;
          analyser.getFloatTimeDomainData(buffer);
          const hz = detectPitch(buffer, audio.sampleRate);
          if (hz) {
            lastSignal = time;
            recent.push(hz); if (recent.length > 3) recent.shift();
            const stable = [...recent].sort((a,b) => a-b)[Math.floor(recent.length/2)];
            const result = tuningReading(stable);
            if (result) {
              const cents = Math.round(result.cents), deviation = Math.abs(cents);
              const label = deviation <= 5 ? 'In tune' : deviation + ' cents ' + (cents < 0 ? 'flat · tune up' : 'sharp · tune down');
              display(result.name + '4', label, cents);
            } else display('—', 'Outside the open-string range', null);
          } else if (time - lastSignal > 450) {
            recent = []; display('—', 'Listening for a string…', null);
          }
        }
        frame = requestAnimationFrame(listen);
      }
      frame = requestAnimationFrame(listen);
    } catch (err) {
      if (current !== generation) return;
      stop();
      message.textContent = err.name === 'NotAllowedError' ? 'Microphone access was blocked. Allow it in your browser or use a reference tone.' :
        err.name === 'NotFoundError' ? 'No microphone found. Connect one or use a reference tone.' :
        'Couldn’t start the microphone. Check your input device and try again.';
    }
  }
  mic.onclick = () => active ? stop() : start();
  for (const string of [...strings].reverse()) {
    const button = document.createElement('button');
    button.textContent = string.name + '4';
    button.setAttribute('aria-label', 'Play ' + string.name + '4 reference tone');
    button.onclick = async () => {
      stop();
      const current = generation;
      try {
        const ctx = await audioContext();
        if (generation !== current) return;
        pluck(string.midi, ctx.currentTime, 1.8);
        button.classList.add('active');
        display(string.name + '4', 'Reference tone', null);
        referenceTimer = setTimeout(() => { button.classList.remove('active'); display('—', 'Microphone off', null); }, 1800);
      } catch { if (generation === current) message.textContent = 'Audio is unavailable. Check your browser’s sound settings.'; }
    };
    byId('reference-buttons').append(button);
  }
  return { stop };
}
