import { run, ui, view } from '../core/state.js';
import { random } from '../core/math.js';
import { ctx } from '../render/context.js';
import { drawHud } from '../render/hud.js';
import { rect, restoreCtx, saveCtx, setAlpha, translate } from '../render/primitives.js';
import { drawScene } from '../render/scene.js';
import { drawCustomize } from './customize.js';
import { drawHelp } from './help.js';
import { drawMenu } from './menu.js';
import { drawGameOver, drawNameEntry, drawPause, drawScores } from './scores.js';

const SCREENS = {
  menu: drawMenu,
  custom: drawCustomize,
  scores: drawScores,
  help: drawHelp,
  over: drawGameOver,
  name: drawNameEntry,
  pause: drawPause,
};

export function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(view.background, 0, 0);
  ctx.setTransform(view.pixelScale, 0, 0, view.pixelScale, 0, 0);
  saveCtx();
  if (run.shake > 0)
    translate((random() - 0.5) * run.shake * 24, (random() - 0.5) * run.shake * 24);
  drawScene();
  restoreCtx();
  if (['play', 'pause', 'over', 'name'].includes(ui.currentScreen)) drawHud();
  if (ui.currentScreen == 'play') return;
  rect(`rgba(8,4,24,${ui.currentScreen == 'menu' ? 0.35 : 0.82})`, 0, 0, view.width, view.height);
  ui.menuItems = [];
  saveCtx();
  setAlpha(1 - ui.transition);
  translate(0, ui.transition * 16);
  SCREENS[ui.currentScreen]();
  restoreCtx();
  if (ui.focusIndex >= ui.menuItems.length) ui.focusIndex = 0;
}
