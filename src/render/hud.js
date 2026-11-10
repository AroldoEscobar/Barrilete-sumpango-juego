import { profile, run, ui, view } from '../core/state.js';
import { GREEN, WHITE, YELLOW, white } from '../config/colors.js';
import {
  GUST_SPEED,
  HINTS,
  LIFELINE_RECHARGE,
  TENSION_LIMIT,
  WIND_EVENTS,
} from '../config/constants.js';
import { abs, clamp, max, min } from '../core/math.js';
import { altitudeFactor, windAt } from '../game/wind.js';
import { ctx } from './context.js';
import { circle, rect, roundedRect, strokeArc, text } from './primitives.js';

export function drawButtonIcon(x, y, pressed) {
  circle(pressed ? YELLOW : white(0.18), x, y, 10);
  strokeArc(WHITE, 2, x, y, 10);
  if (pressed) strokeArc('rgba(255,213,74,.6)', 2, x, y, 16);
}

const textLeft = (str, y, size, color) => text(str, 16, y, size, color, 'left');
const textRight = (str, y, size, color) => text(str, view.width - 16, y, size, color, 'right');
export const bestScore = () =>
  max(profile.topScores[0] ? profile.topScores[0].s : 0, run.score | 0);

function drawScorePanel() {
  textLeft('PUNTOS', 24, 11, white(0.65));
  textLeft(run.score | 0, 58, 36, WHITE);
  text(`Mejor ${bestScore()}`, 16, 78, 13, white(0.65), 'left', 400);
  let y = 104;
  if (run.combo > 1) {
    textLeft(`COMBO ×${run.combo}`, y, 18, YELLOW);
    rect(white(0.25), 16, y + 6, 96, 4);
    rect(YELLOW, 16, y + 6, 96 * clamp(run.comboTimer / 5, 0, 1), 4);
    y += 30;
  }
  if (run.lifeline >= 1) {
    textLeft('♥ SALVAVIDAS', y, 12, '#6f8');
  } else {
    const secondsLeft = ((1 - run.lifeline) * LIFELINE_RECHARGE + 1) | 0;
    textLeft(`♡ salvavidas ${secondsLeft} s`, y, 12, white(0.55));
  }
  y += 16;
  textLeft(`ALTURA ×${(1 + 1.5 * altitudeFactor(run.kite.y)).toFixed(1)}`, y, 12, '#8df');
  if (run.tension > TENSION_LIMIT * 0.6) textLeft('AL FILO ×1.5', y + 16, 12, '#f95');
  if (run.windEvent && run.windEvent.active) textLeft('EVENTO ×2', y + 32, 12, YELLOW);
}

function drawMeters() {
  const barWidth = 150;
  const x = view.width - barWidth - 16;
  const pull = min(1.2, run.tension / TENSION_LIMIT);
  const wind = windAt(run.kite.x);
  textRight('TENSIÓN DEL HILO', 22, 11, white(0.75));
  rect('rgba(0,0,0,.45)', x, 28, barWidth, 10);
  rect(pull < 0.6 ? GREEN : pull < 1 ? YELLOW : '#f44', x, 28, (barWidth * pull) / 1.2, 10);
  rect(WHITE, x + barWidth / 1.2, 25, 2, 16);
  textRight('VIENTO', 58, 11, white(0.75));
  rect('rgba(0,0,0,.45)', x, 64, barWidth, 8);
  rect('#bdf', x, 64, barWidth * min(1, wind / 450), 8);
}

function drawGustWarning() {
  let eta = 9;
  let incoming;
  for (const gust of run.gusts) {
    const arrival = (run.kite.x - gust.x) / GUST_SPEED;
    if (gust.x < run.kite.x && abs(gust.strength) > 40 && arrival < eta) {
      eta = arrival;
      incoming = gust;
    }
  }
  if (!incoming || eta >= 4) return;
  const label = incoming.strength > 0 ? 'RÁFAGA' : 'CALMA';
  textRight(`${label} en ${eta.toFixed(1)}s`, 92, 13, incoming.strength > 0 ? WHITE : '#8bf');
}

function drawEventBanner() {
  if (!run.windEvent) return;
  const [title, advice] = WIND_EVENTS[run.windEvent.kind];
  const size = min(34, view.width / 11);
  const y = view.height * 0.13;
  text(
    run.windEvent.active ? title : `¡VIENE ${title}!`,
    view.centerX,
    y,
    size,
    YELLOW,
    'center',
    800,
  );
  text(run.windEvent.active ? advice : 'Prepárate…', view.centerX, y + 24, 15, WHITE);
}

function drawHint() {
  const label = HINTS[ui.hintStage];
  const size = min(20, view.width / 19);
  ctx.font = `700 ${size}px system-ui,sans-serif`;
  const boxWidth = ctx.measureText(label).width + 40;
  const y = view.height * 0.22;
  const boxX = view.centerX - boxWidth / 2;
  roundedRect(boxX, y - size - 6, boxWidth, size * 2 + 4, size, 'rgba(8,4,24,.72)');
  text(label, view.centerX, y, size, [GREEN, '#f88', YELLOW][ui.hintStage]);
  drawButtonIcon(view.centerX, y + size * 1.8, ui.hintStage != 1);
}

export function drawHud() {
  drawScorePanel();
  drawMeters();
  drawGustWarning();
  drawEventBanner();
  if (run.practice) text('PRÁCTICA · sin rivales', view.centerX, view.height * 0.06, 13, '#8df');
  if (ui.hintStage < 3 && ui.currentScreen == 'play') drawHint();
  const nearGround = run.kite.y > view.groundY - 95 && (run.clock * 4) % 1 < 0.6;
  if (ui.currentScreen == 'play' && nearGround)
    text('¡JALA!', run.kite.x, run.kite.y - 50, 24, '#f44');
}
