import { run } from '../core/state.js';
import { GREEN, RED, WHITE, YELLOW, rgba, white } from '../config/colors.js';
import { WIND_EVENTS } from '../config/constants.js';
import { PI, atan2, cos, exp, lerp, max, min, sin } from '../core/math.js';
import { ctx } from '../render/context.js';
import { drawDoll } from '../render/doll.js';
import { drawButtonIcon } from '../render/hud.js';
import { drawKite } from '../render/kite.js';
import {
  line,
  polygon,
  rect,
  restoreCtx,
  roundedRect,
  saveCtx,
  setAlpha,
  text,
  translate,
} from '../render/primitives.js';
import { drawPaperShape } from '../render/scene.js';

const smooth = p => 0.5 - 0.5 * cos(2 * PI * p);
const phase = seconds => (run.clock % seconds) / seconds;
const bell = (value, center, spread) => exp(-(((value - center) / spread) ** 2));

function drawArrow(x1, y1, x2, y2, color) {
  const angle = atan2(y2 - y1, x2 - x1);
  line(color, 3, x1, y1, x2, y2);
  const head = [x2, y2];
  for (const side of [-0.5, 0.5]) head.push(x2 - 9 * cos(angle + side), y2 - 9 * sin(angle + side));
  polygon(head, color);
}

function drawKidAndKite(x, y, rotation, scale, wind, extra) {
  drawDoll(18, 104, 0.8, 0, -0.8);
  line(WHITE, 2, 26, 80, x - 4, y + extra);
  drawKite(x, y, rotation, scale, wind);
}

function drawGustBand(bandX, rgb, dash) {
  rect(rgba(rgb, 0.12 + 0.1 * bell(bandX, 92, 28)), bandX - 24, 6, 48, 100);
  ctx.setLineDash(dash);
  for (const y of [28, 55, 82]) line(rgba(rgb, 0.8), 2.5, bandX - 24, y, bandX + 10, y);
  ctx.setLineDash([]);
}

function drawGustDiagram(isLull) {
  const bandX = lerp(-35, 150, phase(4));
  const reach = bell(bandX, 92, 28);
  const y = isLull ? lerp(50, 74, reach) : 50;
  drawGustBand(bandX, isLull ? '122,176,255' : '255,255,255', isLull ? [6, 8] : []);
  drawKidAndKite(96, y, isLull ? 0 : reach * 0.5, 0.75, 100, 16);
  setAlpha(reach);
  text(isLull ? '¡JALA!' : '¡SUELTA!', 60, 102, 13, isLull ? GREEN : RED);
  setAlpha(1);
}

function drawControlsDiagram() {
  const on = run.clock % 1.6 < 0.5;
  roundedRect(11, 24, 22, 36, 10, on && YELLOW, WHITE);
  drawButtonIcon(62, 46, on);
  roundedRect(86, 38, 32, 16, 4, on && YELLOW, WHITE);
  ['Clic', 'Toque', 'Espacio'].forEach((label, i) => text(label, [20, 62, 102][i], 86, 10, WHITE));
}

function drawHoldDiagram() {
  const p = phase(4);
  const s = smooth(p);
  const on = p < 0.5;
  const color = on ? GREEN : RED;
  drawKidAndKite(lerp(100, 66, s), lerp(70, 26, s), lerp(0.3, -0.25, s), 0.75, 100, 16);
  drawButtonIcon(18, 22, on);
  text(on ? 'JALA' : 'SUELTA', 4, 52, 12, color, 'left');
  drawArrow(110, on ? 60 : 30, 110, on ? 30 : 60, color);
}

function drawTapDiagram() {
  const p = phase(3);
  const u = max(0, p - 0.25);
  const rise = u < 0.2 ? sin(((u / 0.2) * PI) / 2) : exp(-(u - 0.2) * 2.5);
  drawKidAndKite(70, 72 - 40 * rise, 0, 0.75, 100, 16);
  drawButtonIcon(18, 22, p > 0.18 && p < 0.25);
  text('TOQUE', 4, 52, 12, YELLOW, 'left');
  if (u > 0 && u < 0.5) {
    setAlpha(1 - u * 2);
    text('¡Tirón!', 92, 20, 13, WHITE);
    setAlpha(1);
  }
}

function drawTensionDiagram() {
  const p = phase(5);
  const pull = p < 0.8 ? min(1, p / 0.7) * 1.15 : 0;
  rect(white(0.25), 8, 30, 104, 16);
  rect(pull < 0.7 ? GREEN : pull < 1 ? YELLOW : RED, 8, 30, (pull / 1.2) * 104, 16);
  rect(WHITE, 8 + 0.83 * 104, 24, 3, 28);
  if (p < 0.8) {
    line(pull > 1 ? RED : pull > 0.7 ? YELLOW : WHITE, 1.5 + pull * 2.5, 10, 84, 110, 84);
    return;
  }
  line(WHITE, 1.5, 10, 84, 52, 84);
  line(WHITE, 1.5, 70, 84, 110, 84);
  if (p < 0.9) text('¡CRAC!', 61, 104, 14, RED);
}

function drawPaperDiagram() {
  const p = phase(4);
  const t = p < 0.45 ? p / 0.45 : p < 0.85 ? 1 : 1 - (p - 0.85) / 0.15;
  if (p < 0.45 || p > 0.9) {
    saveCtx();
    translate(84 + 8 * sin(run.clock * 2), 40 + 4 * sin(run.clock * 3));
    drawPaperShape('#f7b', 1);
    restoreCtx();
  }
  drawKite(lerp(26, 84, t), lerp(84, 40, t), 0, 0.6, 60);
  if (p > 0.45 && p < 0.85) {
    setAlpha(1 - (p - 0.45) / 0.4);
    text('+35', 84, 36 - (p - 0.45) * 60, 16, YELLOW);
    setAlpha(1);
  }
  drawArrow(10, 100, 10, 16, YELLOW);
  text('×2,5', 16, 22, 11, YELLOW, 'left');
  text('×1', 16, 104, 11, WHITE, 'left');
}

function drawRivalDiagram() {
  const p = phase(4);
  const rivalX = lerp(132, -10, p);
  const cutNow = p > 0.64 && p < 0.95;
  line(WHITE, 2, 14, 98, 56, 64);
  const warn = rivalX < 110 && !cutNow && p < 0.64;
  line(warn ? rgba('255,60,60', 0.6 + 0.4 * sin(run.clock * 16)) : '#fe7', 4, 33, 81, 56, 64);
  if (cutNow) {
    rect('#0c0618', 30, 66, 14, 22);
    text('¡Corte!', 70, 100, 13, RED);
  }
  drawKite(56, 36, 0, 0.65, 80);
  polygon([rivalX, 62, rivalX + 10, 76, rivalX, 90, rivalX - 10, 76], '#e22');
}

function drawEventsDiagram() {
  const kind = ((run.clock / 2.5) | 0) % 3;
  const y = 80 + (kind == 1 ? 10 : 0) + 8 * sin(run.clock * (kind == 2 ? 5 : 2));
  roundedRect(4, 4, 114, 24, 10, '#e85');
  text(`${WIND_EVENTS[kind][0]} ×2`, 61, 21, 11, WHITE);
  for (const lineY of [48, 62]) {
    const x = (run.clock * (kind ? 30 : 90) + lineY * 3) % 130;
    line(kind == 1 ? '#7bf' : WHITE, 2, x - 8, lineY, x + 12, lineY);
  }
  drawKite(61, y, 0, 0.6, 60);
  if (kind == 1 && (run.clock * 4) % 1 < 0.6) text('¡JALA!', 61, y - 22, 13, RED);
}

export const DIAGRAMS = [
  drawControlsDiagram,
  drawHoldDiagram,
  drawTapDiagram,
  () => drawGustDiagram(false),
  () => drawGustDiagram(true),
  drawTensionDiagram,
  drawPaperDiagram,
  drawRivalDiagram,
  drawEventsDiagram,
];
