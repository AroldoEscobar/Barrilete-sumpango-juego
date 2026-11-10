import { input, run, ui } from '../core/state.js';
import { TAP_SECONDS } from '../config/constants.js';

// Un toque más corto que TAP_SECONDS pide el tirón aunque dure menos que un cuadro
export function updateHold() {
  const down = input.pointers.size + input.pressedKeys.size > 0;
  if (down && !input.held) {
    input.pressStart = run.clock;
    input.holdSustained = false;
  }
  if (
    !down &&
    input.held &&
    ui.currentScreen == 'play' &&
    run.clock - input.pressStart < TAP_SECONDS
  ) {
    input.tapQueued = true;
  }
  input.held = down;
}
