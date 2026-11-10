import { run, view } from '../core/state.js';
import { GRAVITY, TENSION_LIMIT } from '../config/constants.js';
import { abs, cos, hypot, max, sin } from '../core/math.js';
import { die } from './lifecycle.js';

// Devuelve la tensión radial: lo que el hilo frena al barrilete en este paso
function applyTether(dt) {
  if (run.threadCut) return 0;
  const dx = run.kite.x - view.anchorX;
  const dy = run.kite.y - view.anchorY;
  const dist = hypot(dx, dy);
  if (dist <= run.ropeLength) return 0;
  const nx = dx / dist;
  const ny = dy / dist;
  const radialSpeed = run.kite.vx * nx + run.kite.vy * ny;
  run.kite.x = view.anchorX + nx * run.ropeLength;
  run.kite.y = view.anchorY + ny * run.ropeLength;
  if (radialSpeed <= run.ropeSpeed) return 0;
  run.kite.vx -= nx * (radialSpeed - run.ropeSpeed);
  run.kite.vy -= ny * (radialSpeed - run.ropeSpeed);
  return (radialSpeed - run.ropeSpeed) / dt;
}

export function moveKite(dt, holding, wind) {
  const pitch = holding ? 1 : 0.28;
  const relativeWind = wind - run.kite.vx;
  run.kite.vx += 2.2 * relativeWind * dt;
  run.kite.vy += (GRAVITY - 1.2 * run.kite.vy - 0.047 * pitch * wind * wind) * dt;
  run.kite.x += run.kite.vx * dt;
  run.kite.y += run.kite.vy * dt;
  return applyTether(dt);
}

export function keepKiteInBounds(playing) {
  if (run.kite.x < 12) {
    run.kite.x = 12;
    run.kite.vx = abs(run.kite.vx) * 0.3;
  }
  if (run.kite.x > view.width - 12) {
    run.kite.x = view.width - 12;
    run.kite.vx = -abs(run.kite.vx) * 0.3;
  }
  if (run.kite.y > view.groundY - 22) {
    run.kite.y = view.groundY - 22;
    run.kite.vy = 0;
    run.kite.vx *= 0.9;
    if (!playing) return;
    if (run.invulnerable) run.kite.vy = -230;
    else die('Cayó el barrilete', false);
  }
}

// En el menú el barrilete flota abajo a la derecha, lejos de los botones
export function floatKiteForMenu() {
  const angle = 0.1 + 0.04 * sin(run.clock * 0.8);
  run.kite.x = view.anchorX + 0.9 * view.ropeMax * cos(angle);
  run.kite.y = view.anchorY - 0.9 * view.ropeMax * sin(angle);
  run.kite.vx = 0;
  run.kite.vy = 0;
  run.ropeLength = 0.9 * view.ropeMax;
}

// El hilo se desgasta mientras la tensión pasa el límite y se recupera si afloja
export function nextStrain(dt) {
  if (run.invulnerable) return 0;
  if (run.tension > TENSION_LIMIT) return run.strain + (run.tension / TENSION_LIMIT - 1) * dt * 1.4;
  return max(0, run.strain - dt);
}
