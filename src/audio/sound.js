import { run, ui } from '../core/state.js';
import { TENSION_LIMIT } from '../config/constants.js';
import { min, random } from '../core/math.js';

let audioCtx, windGain, windFilter, creakGain, creakOsc, noiseBuffer;

const chain = (...nodes) => nodes.reduce((from, to) => from.connect(to));

function rampValue(param, from, to, start, duration) {
  param.setValueAtTime(from, start);
  param.exponentialRampToValueAtTime(to, start + duration);
}

// Viento (ruido filtrado) y crujido del hilo suenan siempre; solo cambia su volumen
function startAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new AudioContext();
    const rate = audioCtx.sampleRate;
    noiseBuffer = audioCtx.createBuffer(1, rate * 2, rate);
    const samples = noiseBuffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = random() * 2 - 1;

    const wind = audioCtx.createBufferSource();
    wind.buffer = noiseBuffer;
    wind.loop = true;
    windFilter = audioCtx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.Q.value = 0.8;
    windGain = audioCtx.createGain();
    windGain.gain.value = 0;
    chain(wind, windFilter, windGain, audioCtx.destination);
    wind.start();

    creakOsc = audioCtx.createOscillator();
    creakOsc.type = 'sawtooth';
    creakGain = audioCtx.createGain();
    creakGain.gain.value = 0;
    chain(creakOsc, creakGain, audioCtx.destination);
    creakOsc.start();
  } catch {
    audioCtx = null;
  }
}

function playNoise(startFreq, duration, volume) {
  const now = audioCtx.currentTime;
  const source = audioCtx.createBufferSource();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  source.buffer = noiseBuffer;
  filter.type = 'lowpass';
  rampValue(filter.frequency, startFreq, 80, now, duration);
  rampValue(gain.gain, volume, 0.001, now, duration);
  chain(source, filter, gain, audioCtx.destination);
  source.start(now);
  source.stop(now + duration);
}

function playOscillator(startFreq, endFreq, duration, type, volume) {
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  rampValue(osc.frequency, startFreq, endFreq, now, duration);
  rampValue(gain.gain, volume, 0.001, now, duration);
  chain(osc, gain, audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration);
}

export function tone(startFreq, endFreq, duration, type, volume) {
  if (audioCtx) playOscillator(startFreq, endFreq, duration, type, volume);
}

export function noiseBurst(duration, startFreq, volume) {
  if (audioCtx) playNoise(startFreq, duration, volume);
}

export const click = () => tone(660, 990, 0.07, 'square', 0.06);

// Los navegadores solo dejan sonar tras un gesto del usuario
export function wakeAudio() {
  startAudio();
  if (audioCtx && audioCtx.state == 'suspended') audioCtx.resume();
}

export function updateSound(wind) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const playing = ui.currentScreen == 'play';
  const aim = (param, value, smoothing) => param.setTargetAtTime(value, now, smoothing);
  aim(windGain.gain, min(0.3, wind / 700) * (playing ? 1 : 0.5), 0.1);
  aim(windFilter.frequency, 250 + wind * 3, 0.1);
  const pull = run.tension / TENSION_LIMIT;
  const creak = playing && pull > 0.5 ? min(0.06, pull * 0.03 + run.strain * 0.05) : 0;
  aim(creakGain.gain, creak, 0.05);
  aim(creakOsc.frequency, 160 + run.strain * 500 + pull * 80, 0.05);
}
