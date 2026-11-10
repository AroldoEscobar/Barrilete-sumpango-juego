import { run, view } from '../core/state.js';
import { noiseBurst } from '../audio/sound.js';
import { FIRST_RIVAL_SECONDS, KITE_RADIUS } from '../config/constants.js';
import { clamp, hypot, max, min, random, sin } from '../core/math.js';
import { burstParticles, showPopup } from './effects.js';
import { die } from './lifecycle.js';

function bumpIntoRival(rival) {
  const dx = run.kite.x - rival.x;
  const dy = run.kite.y - rival.currentY;
  const dist = hypot(dx, dy) || 1;
  run.kite.vx += (dx / dist) * 200;
  run.kite.vy += (dy / dist) * 200;
  run.combo = 1;
  run.comboTimer = 0;
  run.shake = 0.4;
  noiseBurst(0.2, 3000, 0.3);
  showPopup(run.kite.x, run.kite.y - 44, '¡Choque!', '#f85');
  burstParticles(rival.x, rival.currentY, '#e22', 10);
}

export function spawnRivals(dt, diff) {
  if (run.playTime <= FIRST_RIVAL_SECONDS || run.practice || (run.nextRival -= dt) >= 0) return;
  run.nextRival = max(3.2, 8 - 4.8 * diff) * (0.7 + random() * 0.6);
  const count = diff > 0.55 && random() < 0.5 ? 2 : 1;
  for (let i = 0; i < count; i++) {
    run.rivals.push({
      x: view.width + 260 + i * 190,
      y: clamp(run.kite.y + (random() - 0.5) * (300 + 200 * diff), 90, view.groundY - 110),
      speed: -(75 + 70 * diff + random() * 30),
      phase: random() * 6,
    });
  }
}

// Un rival corta el hilo solo si lo cruza dentro del tramo vulnerable, cerca del
// barrilete: así siempre se puede esquivar subiendo o bajando
export function updateRivals(dt, diff) {
  const bx = run.kite.x - sin(run.tilt) * KITE_RADIUS * 0.9;
  const by = run.kite.y + KITE_RADIUS * 0.9;
  const handX = view.anchorX + 6;
  const handY = view.anchorY;
  const threadLength = hypot(handX - bx, handY - by) || 1;
  const ux = (handX - bx) / threadLength;
  const uy = (handY - by) / threadLength;
  const vulnerable = min(70 + 60 * diff, threadLength);
  run.rivalDanger = false;
  for (const rival of run.rivals) {
    rival.x += rival.speed * dt;
    rival.currentY = rival.y + 35 * sin(rival.phase + run.clock * 1.7);
    const qx = rival.x - bx;
    const qy = rival.currentY - by;
    const along = qx * ux + qy * uy;
    const side = ux * qy - uy * qx;
    if (
      rival.side * side < 0 &&
      along > 0 &&
      along < vulnerable &&
      !run.threadCut &&
      !run.invulnerable
    ) {
      die('Te cortaron el hilo', true);
      break;
    }
    rival.side = side;
    const near = rival.x > bx - 30 && rival.x < bx + 380;
    if (near && rival.currentY > by - 45 && rival.currentY < by + uy * vulnerable + 45) {
      run.rivalDanger = true;
    }
    if (
      !rival.bumped &&
      hypot(run.kite.x - rival.x, run.kite.y - rival.currentY) < KITE_RADIUS + 16
    ) {
      rival.bumped = true;
      bumpIntoRival(rival);
    }
  }
  run.rivals = run.rivals.filter(rival => rival.x > -80);
}
