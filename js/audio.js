/**
 * audio.js — Web Audio API Synthesizer
 * Generates all sounds procedurally — no external files needed.
 */

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// ─── Creeper Hiss ───────────────────────────────────────────────
export function playHiss(duration = 1.5) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 0.5);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const bpf = ctx.createBiquadFilter();
  bpf.type = 'bandpass';
  bpf.frequency.setValueAtTime(2000, ctx.currentTime);
  bpf.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + duration);
  bpf.Q.value = 0.8;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.6, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  source.connect(bpf);
  bpf.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start();
}

// ─── Explosion ──────────────────────────────────────────────────
export function playExplosion() {
  const ctx = getCtx();
  const duration = 2.5;

  // Boom — low sub
  for (let layer = 0; layer < 3; layer++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const delay = layer * 0.04;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80 - layer * 20, ctx.currentTime + delay);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + duration + delay);
    gain.gain.setValueAtTime(0.8 / (layer + 1), ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration + delay);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + duration + delay + 0.1);
  }

  // Noise burst
  const bufSize = ctx.sampleRate * duration;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.5);
  }
  const ns = ctx.createBufferSource();
  ns.buffer = buf;
  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.setValueAtTime(1500, ctx.currentTime);
  lpf.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + duration);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(1.2, ctx.currentTime);
  ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  ns.connect(lpf); lpf.connect(ng); ng.connect(ctx.destination);
  ns.start();
}

// ─── Lightning / Charged ─────────────────────────────────────────
export function playLightning() {
  const ctx = getCtx();

  for (let i = 0; i < 5; i++) {
    const delay = i * 0.05;
    const bufSize = Math.floor(ctx.sampleRate * 0.15);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let j = 0; j < bufSize; j++) {
      d[j] = (Math.random() * 2 - 1) * (1 - j / bufSize);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 3000 + i * 500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5 - i * 0.07, ctx.currentTime + delay);
    src.connect(hpf); hpf.connect(g); g.connect(ctx.destination);
    src.start(ctx.currentTime + delay);
  }
}

// ─── Cat Meow (deterrent) ────────────────────────────────────────
export function playCatMeow() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
  osc.frequency.setValueAtTime(900, ctx.currentTime + 0.18);
  osc.frequency.setValueAtTime(700, ctx.currentTime + 0.3);
  osc.frequency.setValueAtTime(650, ctx.currentTime + 0.4);

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.4, ctx.currentTime + 0.35);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.55);

  const dist = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i * 2) / 256 - 1;
    curve[i] = ((Math.PI + 50) * x) / (Math.PI + 50 * Math.abs(x));
  }
  dist.curve = curve;

  osc.connect(dist); dist.connect(gain); gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.6);
}

// ─── Resume context on user interaction ─────────────────────────
document.addEventListener('click', () => {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}, { once: true });
