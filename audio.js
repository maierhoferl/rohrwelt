'use strict';
// Handwerker-Rock & Geräusche – alles live mit WebAudio erzeugt, keine Audio-Dateien.
const Sound = (() => {
  let ac = null, master, music, sfx, shaper, noise, timer = null, next = 0, step = 0;
  const BPM = 150, SPB = 60 / BPM / 4; // Länge einer Sechzehntel
  const f = m => 440 * Math.pow(2, (m - 69) / 12);
  const ROOTS = [40, 40, 43, 45, 40, 40, 38, 43];          // E E G A E E D G (Powerchords)
  const GTR = [0, 2, 3, 6, 8, 10, 11, 14];
  const KICK = [0, 6, 8, 11];
  const MEL = [76, 79, 81, 79, 76, 74, 76, 0, 79, 81, 83, 81, 79, 76, 79, 0,
               76, 79, 81, 79, 76, 74, 72, 0, 74, 76, 74, 72, 71, 72, 74, 0];

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
    music = ac.createGain(); music.gain.value = 0.16; music.connect(master);
    sfx = ac.createGain(); sfx.gain.value = 0.5; sfx.connect(master);
    shaper = ac.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) curve[i] = Math.tanh((i / 512 - 1) * 8);
    shaper.curve = curve;
    const tone = ac.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 2800;
    shaper.connect(tone); tone.connect(music);
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function env(g, t, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function osc(type, freq, t, dur, peak, dest, freqEnd) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    env(g, t, peak, dur); o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  }
  function nz(t, dur, peak, type, freq, dest) {
    const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise; fl.type = type; fl.frequency.value = freq;
    env(g, t, peak, dur); s.connect(fl); fl.connect(g); g.connect(dest);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  const kick = t => osc('sine', 160, t, 0.25, 1, music, 40);
  const snare = t => { nz(t, 0.16, 0.7, 'highpass', 1200, music); osc('triangle', 190, t, 0.08, 0.4, music); };
  const hat = (t, open) => nz(t, open ? 0.18 : 0.04, 0.25, 'highpass', 7000, music);
  const clank = (t, dest) => [523, 1336, 2217].forEach((fr, i) => osc('square', fr, t, 0.28 - i * 0.06, 0.1, dest));
  const bass = (t, m, dur) => { osc('square', f(m), t, dur, 0.12, music); osc('triangle', f(m), t, dur, 0.4, music); };
  function guitar(t, root, dur) {
    for (const iv of [0, 7, 12]) for (const det of [-6, 6]) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sawtooth'; o.frequency.value = f(root + iv); o.detune.value = det;
      env(g, t, 0.1, dur); o.connect(g); g.connect(shaper); o.start(t); o.stop(t + dur + 0.05);
    }
  }

  function schedule(s, t) {
    const bar = Math.floor(s / 16), st = s % 16, root = ROOTS[bar];
    if (KICK.includes(st)) kick(t);
    if (st === 4 || st === 12) snare(t);
    if (st % 2 === 0) { hat(t, st === 14); bass(t, root + (st === 14 ? 7 : 0), SPB * 1.8); }
    if (GTR.includes(st)) guitar(t, root + 12, st % 8 === 0 ? SPB * 3.5 : SPB * 1.4);
    if ((bar === 3 || bar === 7) && st >= 13) clank(t, music);            // Hammer-Schläge im Takt
    if (bar >= 4 && st % 2 === 0) { const m = MEL[(bar - 4) * 8 + st / 2]; if (m) osc('square', f(m), t, SPB * 1.7, 0.07, music); }
  }
  function pump() {
    if (next < ac.currentTime - 0.2) next = ac.currentTime + 0.05;   // nach Tab-Pause nicht nachholen
    while (next < ac.currentTime + 0.12) { schedule(step, next); next += SPB; step = (step + 1) % 128; }
  }
  function setMusic(on) {
    if (!ac) return;
    if (on && !timer) { next = ac.currentTime + 0.05; step = 0; timer = setInterval(pump, 25); }
    if (!on && timer) { clearInterval(timer); timer = null; }
  }

  function play(name) {
    if (!ac) return;
    const t = ac.currentTime + 0.01;
    switch (name) {
      case 'clank': clank(t, sfx); nz(t, 0.08, 0.5, 'bandpass', 2500, sfx); break;
      case 'boing': osc('triangle', 520, t, 0.35, 0.6, sfx, 140); break;
      case 'pickup': osc('sine', 600, t, 0.12, 0.5, sfx, 1100); break;
      case 'coin': osc('square', 988, t, 0.08, 0.2, sfx); osc('square', 1319, t + 0.08, 0.25, 0.2, sfx); break;
      case 'fixed': [72, 76, 79].forEach((m, i) => osc('square', f(m), t + i * 0.07, 0.15, 0.2, sfx)); break;
      case 'win': [60, 64, 67, 72, 67, 72].forEach((m, i) => osc('square', f(m), t + i * 0.12, i === 5 ? 0.6 : 0.14, 0.22, sfx)); break;
      case 'fail': [67, 63, 60].forEach((m, i) => osc('sawtooth', f(m), t + i * 0.25, 0.3, 0.15, sfx, f(m) * 0.97)); break;
      case 'tick': osc('sine', 1500, t, 0.05, 0.15, sfx); break;
      case 'splash': nz(t, 0.35, 0.5, 'lowpass', 900, sfx); break;
    }
  }

  return {
    init, music: setMusic, sfx: play,
    pause: () => ac && ac.suspend(),
    resume: () => ac && ac.resume(),
  };
})();
