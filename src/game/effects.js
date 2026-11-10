import { run, view } from '../core/state.js';
import { random, sin } from '../core/math.js';
import { windAt } from './wind.js';

export function burstParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    run.particles.push({
      x,
      y,
      vx: (random() - 0.5) * 260,
      vy: (random() - 0.5) * 260 - 40,
      life: 0.8,
      color,
    });
  }
}

export function showPopup(x, y, label, color, size) {
  run.popups.push({ x, y, label, color, size: size || 18, life: 1.1 });
}

export function updateEffects(dt) {
  while (run.windStreaks.length < 70) {
    run.windStreaks.push({
      x: random() * view.width,
      y: random() * view.groundY,
      phase: random() * 6,
    });
  }
  for (const streak of run.windStreaks) {
    streak.x += windAt(streak.x) * dt * 0.9;
    streak.y += sin(run.clock * 0.7 + streak.phase) * 8 * dt;
    if (streak.x > view.width + 30) {
      streak.x = -30;
      streak.y = random() * view.groundY;
    }
  }
  run.particles.forEach(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 300 * dt;
    p.life -= dt;
  });
  run.particles = run.particles.filter(p => p.life > 0);
  run.popups.forEach(p => {
    p.y -= 36 * dt;
    p.life -= dt;
  });
  run.popups = run.popups.filter(p => p.life > 0);
}
