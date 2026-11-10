import './input/listeners.js';
import { run, ui } from './core/state.js';
import { STEP } from './config/constants.js';
import { max, min } from './core/math.js';
import { resetGame } from './game/lifecycle.js';
import { update } from './game/update.js';
import { applyConfig } from './render/kite.js';
import { resize } from './render/layout.js';
import { draw } from './screens/index.js';

let lastFrame = 0;
let accumulator = 0;

// La simulación avanza en pasos fijos para no depender de los fps
function loop(now) {
  const dt = min(0.05, (now - lastFrame) / 1000 || 0);
  lastFrame = now;
  if (ui.currentScreen != 'pause') {
    accumulator += dt;
    while (accumulator >= STEP) {
      update(STEP);
      accumulator -= STEP;
    }
  }
  if (ui.currentScreen == 'over') run.overTime += dt;
  ui.transition = max(0, ui.transition - dt * 4);
  run.shake = max(0, run.shake - dt * 1.6);
  draw();
  requestAnimationFrame(loop);
}

resize();
applyConfig();
resetGame();
requestAnimationFrame(loop);
