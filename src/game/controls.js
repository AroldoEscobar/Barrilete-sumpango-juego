import { input, profile, run, ui } from '../core/state.js';
import { noiseBurst, tone } from '../audio/sound.js';
import { WHITE } from '../config/colors.js';
import { MIN_ROPE, TAP_SECONDS } from '../config/constants.js';
import { PI, cos, max, sin } from '../core/math.js';
import { save } from '../core/storage.js';
import { showPopup } from './effects.js';

function finishHints() {
  ui.hintStage = 3;
  profile.hasPlayed = true;
  save('barrilete_seen', true);
}

function tug() {
  input.jerkCooldownEnd = run.clock + 0.9;
  run.kite.vy -= 140;
  if (!run.threadCut) run.ropeLength = max(MIN_ROPE, run.ropeLength - 20);
  run.shake = max(run.shake, 0.12);
  noiseBurst(0.12, 6000, 0.12);
  tone(300, 900, 0.1, 'triangle', 0.14);
  showPopup(run.kite.x, run.kite.y - 44, '¡Tirón!', WHITE, 14);
  for (let i = 0; i < 14; i++) {
    const angle = (i * PI) / 7;
    run.particles.push({
      x: run.kite.x,
      y: run.kite.y,
      vx: cos(angle) * 170,
      vy: sin(angle) * 170 - 60,
      life: 0.35,
      color: WHITE,
    });
  }
  if (ui.hintStage == 2) finishHints();
}

// Un toque corto pide el tirón; mantener más de TAP_SECONDS cuenta como jalar
export function updateControls() {
  if (input.tapQueued) {
    input.tapQueued = false;
    if (run.clock > input.jerkCooldownEnd) tug();
  }
  if (input.held && !input.holdSustained && run.clock - input.pressStart >= TAP_SECONDS) {
    input.holdSustained = true;
    tone(200, 330, 0.16, 'sine', 0.12);
    if (ui.hintStage == 0) ui.hintStage = 1;
  }
  if (ui.hintStage == 1 && !input.held) {
    ui.hintStage = 2;
    ui.hintTimer = run.clock;
  }
  if (ui.hintStage == 2 && run.clock - ui.hintTimer > 9) finishHints();
}

export function releaseInputs() {
  input.pointers.clear();
  input.pressedKeys.clear();
  input.held = false;
  input.tapQueued = false;
}
