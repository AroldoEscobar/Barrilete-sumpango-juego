import { input, run, ui, view } from '../core/state.js';
import { tone, updateSound } from '../audio/sound.js';
import { KITE_RADIUS, LIFELINE_RECHARGE, MIN_ROPE, TENSION_LIMIT } from '../config/constants.js';
import { clamp, cos, ease, max, min, sin } from '../core/math.js';
import { updateControls } from './controls.js';
import { updateEffects } from './effects.js';
import { die } from './lifecycle.js';
import { updatePapers } from './papers.js';
import { spawnRivals, updateRivals } from './rivals.js';
import { updateTail } from './tail.js';
import { floatKiteForMenu, keepKiteInBounds, moveKite, nextStrain } from './tether.js';
import {
  altitudeFactor,
  difficulty,
  targetEventWindScale,
  updateGusts,
  updateWindEvent,
  windAt,
} from './wind.js';

function warnNearGround(dt) {
  if (run.kite.y > view.groundY - 95 && (run.groundWarnTimer -= dt) < 0) {
    run.groundWarnTimer = 0.35;
    tone(240, 200, 0.1, 'square', 0.1);
  }
}

// Paso fijo de simulación; `playing` se fija al inicio aunque el paso termine la partida
export function update(dt) {
  run.clock += dt;
  const playing = ui.currentScreen == 'play';
  if (playing) run.playTime += dt;
  run.invulnerable = max(0, run.invulnerable - dt);
  if (playing && !run.invulnerable && run.lifeline < 1) {
    run.lifeline = min(1, run.lifeline + dt / LIFELINE_RECHARGE);
  }
  const diff = difficulty();
  // Fuera de la partida el barrilete se sostiene solo si está bajo, para no caer tras el menú
  const holding = playing
    ? input.held
    : ui.currentScreen == 'over'
      ? false
      : run.kite.y > view.groundY - 260;

  if (playing) updateControls();
  if (playing && !run.practice) updateWindEvent(dt);
  run.eventWindScale = ease(run.eventWindScale, targetEventWindScale(), 6, dt);
  updateGusts(dt, diff);

  run.ropeSpeed = ease(run.ropeSpeed, run.threadCut ? 0 : holding ? -40 : 130, 6, dt);
  run.ropeLength = clamp(run.ropeLength + run.ropeSpeed * dt, MIN_ROPE, view.ropeMax);
  const wind = windAt(run.kite.x);
  const pulled = moveKite(dt, holding, wind);
  keepKiteInBounds(playing);
  if (ui.currentScreen == 'menu') floatKiteForMenu();
  run.tension = ease(run.tension, pulled, 10, dt);
  if (playing) {
    run.strain = nextStrain(dt);
    if (run.strain >= 1) die('Se reventó el hilo', true);
  } else if (ui.currentScreen == 'over' || ui.currentScreen == 'name') {
    run.strain = max(0, run.strain - dt);
  }
  run.tilt = ease(run.tilt, holding ? -0.35 : 0.25, 5, dt);
  run.lean = ease(run.lean, holding ? -0.14 : 0.04, 6, dt);

  const rotation = run.tilt + (0.12 * sin(run.clock * 3.1) * wind) / 150;
  const tailLinks = run.kiteSprite.tail ? 6 + min(8, run.papersCaught) : 0;
  updateTail(
    run.tail,
    run.kite.x - sin(rotation) * KITE_RADIUS,
    run.kite.y + cos(rotation) * KITE_RADIUS,
    wind,
    dt,
    tailLinks,
  );
  updateEffects(dt);
  if (!playing) {
    updateSound(wind);
    return;
  }

  const edgeBonus = run.tension > TENSION_LIMIT * 0.6 ? 1.5 : 1;
  const eventBonus = run.windEvent && run.windEvent.active ? 2 : 1;
  run.multiplier = (1 + 1.5 * altitudeFactor(run.kite.y)) * edgeBonus * eventBonus;
  run.score += dt * 3 * run.multiplier;
  warnNearGround(dt);
  if (run.comboTimer > 0 && (run.comboTimer -= dt) <= 0) run.combo = 1;
  updatePapers(dt, diff);
  spawnRivals(dt, diff);
  updateRivals(dt, diff);
  updateSound(wind);
}
