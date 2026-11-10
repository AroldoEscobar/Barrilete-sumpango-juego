import { ui, view } from '../core/state.js';
import { WHITE, YELLOW, white } from '../config/colors.js';
import { min } from '../core/math.js';
import { roundedRect, text } from '../render/primitives.js';

// options: isRow (‹ ›), isStepper (▲ ▼), onEnter (acción propia de Enter)
export function addItem(x, y, w, h, action, options) {
  ui.menuItems.push({ x, y, w, h, action, ...options });
  return ui.focusIndex == ui.menuItems.length - 1;
}

export function button(label, y, action, primary, w, x, h) {
  w = w || min(view.contentWidth * 0.8, 320);
  x = x ?? view.centerX - w / 2;
  h = h || 46;
  const focused = addItem(x, y, w, h, action);
  const fill = focused ? YELLOW : primary ? 'rgba(255,213,74,.25)' : white(0.13);
  roundedRect(x, y, w, h, 14, fill, focused ? WHITE : white(0.25));
  text(label, x + w / 2, y + h / 2 + 7, 19, focused ? '#2a1346' : WHITE);
}

export function optionRow(label, value, y, action, swatches) {
  const x = view.centerX - view.contentWidth / 2;
  const focused = addItem(x, y, view.contentWidth, 36, action, { isRow: true });
  roundedRect(x, y, view.contentWidth, 36, 10, focused ? '#4a3a30' : '#2e2050', focused && YELLOW);
  text(label, x + 14, y + 24, 15, WHITE, 'left');
  if (swatches) {
    swatches.forEach((color, i) => {
      roundedRect(x + 92 + i * 17, y + 10, 14, 16, 3, color, white(0.5));
    });
  }
  text('‹', x + view.contentWidth * 0.46, y + 27, 26, YELLOW);
  text(value, x + view.contentWidth * 0.7, y + 24, 15, WHITE);
  text('›', x + view.contentWidth - 18, y + 27, 26, YELLOW);
}

export const heading = (label, y, size) => {
  text(label, view.centerX, view.offsetY + y, size || 30, YELLOW, 'center', 800);
};
