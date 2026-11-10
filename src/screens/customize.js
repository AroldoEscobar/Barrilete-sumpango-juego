import { profile, run, ui, view } from '../core/state.js';
import { click } from '../audio/sound.js';
import {
  CUSTOM_LISTS,
  FRINGES,
  HAIRS,
  HATS,
  KITE_OPTIONS,
  PALETTES,
  PANTS,
  PATTERNS,
  SHAPES,
  SHIRTS,
  SKIN_TONES,
  TAILS,
} from '../config/catalog.js';
import { white } from '../config/colors.js';
import { KITE_RADIUS } from '../config/constants.js';
import { cos, min, random, sin } from '../core/math.js';
import { goTo } from '../game/lifecycle.js';
import { updateTail } from '../game/tail.js';
import { ctx } from '../render/context.js';
import { drawDoll } from '../render/doll.js';
import { applyConfig, drawKite, drawTail, paletteColors } from '../render/kite.js';
import { line, restoreCtx, saveCtx, translate } from '../render/primitives.js';
import { button, heading, optionRow } from './widgets.js';

const randomIndex = list => (random() * CUSTOM_LISTS[list].length) | 0;

const stepOption = list => step => {
  const count = CUSTOM_LISTS[list].length;
  profile.config[list] = (profile.config[list] + step + count) % count;
  applyConfig();
  click();
};

function drawKitePreview() {
  const x = view.centerX + sin(run.clock) * 8;
  const y = view.offsetY + 135 + cos(run.clock * 1.3) * 5;
  const wind = 260 + 60 * sin(run.clock * 0.9);
  const tailX = x - sin(0.2) * KITE_RADIUS * 1.9;
  const tailY = y + KITE_RADIUS * 1.85;
  updateTail(run.previewTail, tailX, tailY, wind, 1 / 60, run.kiteSprite.tail ? 10 : 0);
  saveCtx();
  translate(tailX, tailY);
  ctx.scale(1.6, 1.6);
  translate(-tailX, -tailY);
  drawTail(run.previewTail);
  restoreCtx();
  drawKite(x, y, sin(run.clock * 1.3) * 0.2, 1.9, wind);
  const [shape, palette, pattern, fringe, tailStyle] = profile.config;
  return [
    ['Forma', SHAPES[shape][0]],
    ['Paleta', PALETTES[palette][0], paletteColors(palette)],
    ['Patrón', PATTERNS[pattern][0]],
    ['Flecos', FRINGES[fringe]],
    ['Cola', TAILS[tailStyle]],
  ];
}

function drawDollPreview() {
  const [skin, shirt, pants, hat, hair] = profile.config.slice(KITE_OPTIONS);
  const kiteY = view.offsetY + 110 + sin(run.clock * 1.2) * 5;
  const lean = 0.04 * sin(run.clock);
  const hand = drawDoll(
    view.centerX - 20,
    view.offsetY + 220,
    3.6,
    lean,
    -0.7 + 0.08 * sin(run.clock * 1.7),
  );
  drawKite(view.centerX + 95, kiteY, 0.2, 1, 120);
  line(white(0.8), 1.5, ...hand, view.centerX + 90, kiteY + 26);
  return [
    ['Piel', `Tono ${skin + 1}`, [SKIN_TONES[skin]]],
    ['Camisa', SHIRTS[shirt][0], SHIRTS[shirt].slice(1)],
    ['Pantalón', PANTS[pants][0], PANTS[pants].slice(1)],
    ['Sombrero', HATS[hat]],
    ['Pelo', HAIRS[hair][0], [HAIRS[hair][1]]],
  ];
}

export function drawCustomize() {
  heading('MI BARRILETE', 36, 26);
  const buttonWidth = min(view.contentWidth / 2 - 6, 170);
  const tabs = [
    ['Barrilete', view.centerX - buttonWidth - 6],
    ['Muñeco', view.centerX + 6],
  ];
  tabs.forEach(([label, x], tab) => {
    const choose = () => {
      ui.customTab = tab;
      ui.focusIndex = 2;
      click();
    };
    button(label, view.offsetY + 48, choose, ui.customTab == tab, buttonWidth, x, 30);
  });
  const rows = ui.customTab ? drawDollPreview() : drawKitePreview();
  const firstOption = ui.customTab ? KITE_OPTIONS : 0;
  let y = view.offsetY + 232;
  rows.forEach(([label, value, swatches], i) => {
    optionRow(label, value, y, stepOption(firstOption + i), swatches);
    y += 42;
  });
  y += 10;
  const randomize = () => {
    profile.config = profile.config.map((value, i) => {
      const inActiveTab = Number(i >= KITE_OPTIONS) === ui.customTab;
      return inActiveTab ? randomIndex(i) : value;
    });
    applyConfig();
    click();
  };
  button('Aleatorio', y, randomize, false, buttonWidth, view.centerX - buttonWidth - 6);
  button('Listo', y, () => goTo('menu'), true, buttonWidth, view.centerX + 6);
}
