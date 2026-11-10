import { input, ui, view } from '../core/state.js';
import { wakeAudio } from '../audio/sound.js';
import { abs } from '../core/math.js';
import { pauseGame } from '../game/lifecycle.js';
import { updateHold } from './hold.js';
import { activateItem, directionAt, handleMenuKey, itemAt } from './menu.js';
import { canvas } from '../render/context.js';
import { resize } from '../render/layout.js';
import { turnPage } from '../screens/help.js';

const HOLD_KEYS = [' ', 'arrowup', 'w'];

addEventListener('pointerdown', e => {
  if (e.pointerType == 'mouse' && e.button) return;
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch {
    // el puntero ya no existe
  }
  if (ui.currentScreen == 'play') {
    input.pointers.add(e.pointerId);
    updateHold();
    return;
  }
  const x = e.clientX / view.viewScale;
  const y = e.clientY / view.viewScale;
  input.pointerDown = { x, y, index: itemAt(x, y) };
});

function onPointerRelease(e) {
  wakeAudio();
  if (input.pointers.delete(e.pointerId)) updateHold();
  if (!input.pointerDown || e.type != 'pointerup') {
    input.pointerDown = null;
    return;
  }
  const x = e.clientX / view.viewScale;
  const y = e.clientY / view.viewScale;
  const { index } = input.pointerDown;
  const dx = x - input.pointerDown.x;
  input.pointerDown = null;
  if (ui.currentScreen == 'help' && abs(dx) > 50) {
    turnPage(dx < 0 ? 1 : -1);
    return;
  }
  const item = ui.menuItems[index];
  if (item && itemAt(x, y) == index) activateItem(index, directionAt(item, x, y));
}

for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  addEventListener(type, onPointerRelease);
}

addEventListener('pointermove', e => {
  if (e.pointerType != 'mouse' || ui.currentScreen == 'play') return;
  const index = itemAt(e.clientX / view.viewScale, e.clientY / view.viewScale);
  if (index >= 0) ui.focusIndex = index;
});

addEventListener('keydown', e => {
  const lower = e.key.toLowerCase();
  wakeAudio();
  if (ui.currentScreen != 'play') {
    handleMenuKey(e);
    return;
  }
  if (HOLD_KEYS.includes(lower)) {
    e.preventDefault();
    if (!e.repeat) {
      input.pressedKeys.add(lower);
      updateHold();
    }
  } else if (e.key == 'Escape' || lower == 'p') {
    pauseGame();
  }
});

addEventListener('keyup', e => {
  if (input.pressedKeys.delete(e.key.toLowerCase())) updateHold();
});
addEventListener('blur', pauseGame);
document.addEventListener('visibilitychange', () => document.hidden && pauseGame());

// Sin esto el navegador hace zoom, scroll o menú contextual al jugar con toques
const BLOCKED_EVENTS = [
  'touchstart',
  'touchmove',
  'gesturestart',
  'dblclick',
  'auxclick',
  'contextmenu',
  'dragstart',
];
for (const type of BLOCKED_EVENTS) {
  addEventListener(type, e => e.preventDefault(), { passive: false });
}
addEventListener('resize', resize);
