import { run, view } from '../core/state.js';
import { tone } from '../audio/sound.js';
import { GUST_SPEED } from '../config/constants.js';
import { clamp, exp, max, min, random, sin } from '../core/math.js';

export const difficulty = () => min(1, run.playTime / 200);
export const altitudeFactor = y => clamp((view.anchorY - y) / (view.ropeMax * 0.85), 0, 1);
const baseWind = () =>
  (115 + 60 * difficulty()) * (1 + 0.2 * sin(run.clock * 0.5)) * run.eventWindScale;

export function windAt(x) {
  let wind = baseWind();
  for (const gust of run.gusts) {
    wind += gust.strength * exp(-(((x - gust.x) / gust.width) ** 2));
  }
  return max(0, wind);
}

export function updateWindEvent(dt) {
  if (!run.windEvent && (run.nextEvent -= dt) < 0) {
    run.windEvent = { kind: (random() * 3) | 0, active: false, timer: 3 };
    tone(220, 180, 0.5, 'sawtooth', 0.12);
  }
  if (run.windEvent && (run.windEvent.timer -= dt) < 0) {
    if (run.windEvent.active) {
      run.windEvent = null;
      run.nextEvent = 16 + random() * 10;
    } else {
      run.windEvent.active = true;
      run.windEvent.timer = 8;
      tone(110, 70, 0.9, 'sawtooth', 0.2);
      run.shake = 0.3;
    }
  }
}

export function targetEventWindScale() {
  if (!run.windEvent || !run.windEvent.active) return 1;
  return [1.5, 0.68, 1 + 0.4 * sin(run.clock * 5.2)][run.windEvent.kind];
}

// Las ráfagas entran por la izquierda y avanzan hacia el barrilete para dar aviso
export function updateGusts(dt, diff) {
  if ((run.nextGust -= dt) < 0) {
    run.nextGust = max(1.6, 4.5 - 2.8 * diff) * (0.6 + random() * 0.8);
    const isLull = random() < 0.3;
    const gustWidth = 80 + random() * 80;
    const strength = isLull
      ? -(0.15 + 0.4 * random() * min(1, run.playTime / 90)) * baseWind()
      : (60 + random() * (60 + 190 * diff)) * min(1, 0.5 + run.playTime / 60);
    const streakHeights = Array.from({ length: 9 }, random);
    run.gusts.push({ x: -120, width: gustWidth, strength, streakHeights });
  }
  run.gusts.forEach(gust => (gust.x += GUST_SPEED * dt));
  run.gusts = run.gusts.filter(gust => gust.x < view.width + 200);
}
