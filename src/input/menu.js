import { profile, run, ui } from '../core/state.js';
import { click } from '../audio/sound.js';
import { max, min } from '../core/math.js';
import { goTo } from '../game/lifecycle.js';
import { turnPage } from '../screens/help.js';

export const itemAt = (x, y) => {
  const inside = b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  return ui.menuItems.findIndex(inside);
};

export function activateItem(index, direction) {
  if (ui.currentScreen == 'over' && run.overTime < 0.6) return;
  const item = ui.menuItems[index];
  if (!item) return;
  ui.focusIndex = index;
  item.action(direction);
  if (!item.isRow && !item.isStepper) click();
}

// Filas: mitad izquierda -1, derecha +1. Selectores de letra: arriba +1, abajo -1
export function directionAt(item, x, y) {
  if (item.isRow) return x < item.x + item.w / 2 ? -1 : 1;
  if (item.isStepper) return y < item.y + item.h / 2 ? 1 : -1;
  return 1;
}

export function handleMenuKey(e) {
  const key = e.key;
  const count = ui.menuItems.length;
  const item = ui.menuItems[ui.focusIndex];
  if (e.repeat && !key.startsWith('Arrow')) return;
  if (ui.currentScreen == 'name' && /^[a-zA-Z]$/.test(key)) {
    profile.initials[min(ui.focusIndex, 2)] = key.toUpperCase();
    ui.focusIndex = min(ui.focusIndex + 1, 3);
    click();
    return;
  }
  if (ui.currentScreen == 'name' && key == 'Backspace') {
    ui.focusIndex = max(0, ui.focusIndex - 1);
    return;
  }
  if (key == 'Escape') {
    e.preventDefault();
    goTo(ui.currentScreen == 'pause' ? 'play' : 'menu');
    return;
  }
  const vertical = key == 'ArrowUp' ? 1 : key == 'ArrowDown' ? -1 : 0;
  const horizontal = key == 'ArrowLeft' ? -1 : key == 'ArrowRight' ? 1 : 0;
  const moveFocus = step => (ui.focusIndex = (ui.focusIndex + step + count) % count);
  if (vertical || horizontal) e.preventDefault();
  if (vertical) {
    if (item && item.isStepper) item.action(vertical);
    else moveFocus(-vertical);
  } else if (horizontal) {
    if (item && item.isRow) item.action(horizontal);
    else if (ui.currentScreen == 'help') turnPage(horizontal);
    else moveFocus(horizontal);
  } else if (key == 'Enter' || key == ' ') {
    e.preventDefault();
    if (item && item.onEnter) item.onEnter();
    else activateItem(ui.focusIndex, 1);
  }
}
