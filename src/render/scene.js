import { input, run, ui, view } from '../core/state.js';
import { RED, WHITE, YELLOW, rgba, white } from '../config/colors.js';
import { KITE_RADIUS, TAP_SECONDS } from '../config/constants.js';
import { PI, abs, atan2, clamp, hypot, max, min, sin } from '../core/math.js';
import { difficulty, windAt } from '../game/wind.js';
import { ctx } from './context.js';
import { drawDoll } from './doll.js';
import { drawKite, drawTail } from './kite.js';
import {
  circle,
  line,
  polygon,
  rect,
  restoreCtx,
  saveCtx,
  setAlpha,
  strokeArc,
  text,
  translate,
} from './primitives.js';

export function drawPaperShape(color, flutter = 0) {
  const outline = [-16, -10, 16, -10, 16, 10];
  for (let i = 0; i < 6; i++) {
    outline.push(16 - i * 6.4 - 3.2, 10 - (i % 2 ? 0 : 5) + sin(run.clock * 9 + i * 1.7) * flutter);
  }
  polygon([...outline, -16, 10], color);
  rect(white(0.55), -16, -10, 32, 3);
}

function drawBonfireSmoke() {
  for (let i = 0; i < 7; i++) {
    const u = (run.clock * 0.08 + i / 7) % 1;
    setAlpha(0.22 * (1 - u));
    circle(
      '#8a7a9a',
      view.bonfire.x + u * 90 + sin(i * 3) * 5,
      view.bonfire.y - u * 140,
      6 + u * 22,
    );
  }
  setAlpha(0.5 + 0.3 * sin(run.clock * 5));
  circle('#f62', view.bonfire.x, view.bonfire.y, 4);
  setAlpha(1);
}

function drawWind() {
  ctx.lineCap = 'round';
  for (const streak of run.windStreaks) {
    const wind = windAt(streak.x);
    line(white(0.08 + wind / 900), 1.5, streak.x, streak.y, streak.x - 6 - wind * 0.12, streak.y);
  }
  for (const gust of run.gusts) {
    const strong = min(1, abs(gust.strength) / 200);
    const isGust = gust.strength > 0;
    const tint = rgba(isGust ? '255,255,255' : '90,140,255', 0.03 + 0.05 * strong);
    rect(tint, gust.x - gust.width * 1.3, 0, gust.width * 2.6, view.groundY);
    rect(tint, gust.x - gust.width * 0.6, 0, gust.width * 1.2, view.groundY);
    ctx.setLineDash(isGust ? [] : [6, 10]);
    gust.streakHeights.forEach((h, i) => {
      const y = h * view.groundY * 0.9 + 10;
      const x = gust.x + ((i % 3) - 1) * gust.width * 0.4;
      const color = isGust ? white(0.35 + 0.4 * strong) : 'rgba(120,170,255,.5)';
      line(color, 2, x - abs(gust.strength) * 0.35, y, x, y);
    });
  }
  ctx.setLineDash([]);
}

function drawPapers() {
  for (const paper of run.papers) {
    const remaining = paper.life / paper.maxLife;
    const wind = windAt(paper.x);
    saveCtx();
    translate(paper.x, paper.y);
    for (let i = 1; i < 4; i++) {
      setAlpha(0.3 / i);
      circle(paper.color, -paper.vx * 0.12 * i, 0, 6);
    }
    setAlpha(1);
    ctx.rotate(
      sin(run.clock * 1.5 + paper.phase) * 0.3 + (wind / 700) * sin(run.clock * 9 + paper.phase),
    );
    ctx.transform(1, 0, (sin(run.clock * 6 + paper.phase) * wind) / 1200, 1, 0, 0);
    const expiring = rgba('255,120,120', 0.5 + 0.5 * sin(run.clock * 14));
    const ringColor = remaining < 0.3 ? expiring : white(0.6);
    strokeArc(ringColor, 2, 0, 0, 30, -PI / 2, -PI / 2 + 2 * PI * remaining);
    drawPaperShape(paper.color, wind / 80);
    restoreCtx();
  }
}

function drawRivalKite() {
  polygon([0, -26, 18, 0, 0, 26, -18, 0], '#103');
  polygon([0, -26, 18, 0, 0, 0], '#e22');
  polygon([0, 26, -18, 0, 0, 0], '#e22');
  line(WHITE, 1.5, 0, -26, 18, 0, 0, 26, -18, 0, 0, -26);
  for (let i = 1; i < 5; i++) {
    rect(i % 2 ? '#e22' : '#222', sin(run.clock * 8 + i) * 3 - 3, 26 + i * 7, 6, 5);
  }
}

function drawRivals() {
  for (const rival of run.rivals) {
    const y = rival.currentY ?? rival.y;
    if (rival.x > view.width - 10) {
      const alert = rgba('255,60,60', 0.5 + 0.5 * sin(run.clock * 12));
      polygon([view.width - 8, y, view.width - 30, y - 14, view.width - 30, y + 14], alert);
      text('!', view.width - 42, y + 8, 22, RED);
    }
    line(white(0.35), 1, rival.x, y, rival.x + 60, view.groundY);
    saveCtx();
    translate(rival.x, y);
    ctx.rotate(sin(run.clock * 3 + rival.phase) * 0.2);
    drawRivalKite();
    restoreCtx();
  }
}

function strokeCurve(color, lineWidth, fromX, fromY, controlX, controlY, toX, toY) {
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.quadraticCurveTo(controlX, controlY, toX, toY);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawThread(bx, by, handX, handY) {
  if (run.threadCut) {
    const controlX = bx - run.kite.vx * 0.1;
    const controlY = by - run.kite.vy * 0.1 - 20;
    const endX = bx - run.kite.vx * 0.25;
    const endY = by - run.kite.vy * 0.25 - 50;
    strokeCurve(white(0.7), 1.5, bx, by, controlX, controlY, endX, endY);
    return;
  }
  const dist = hypot(bx - handX, by - handY);
  const slack = max(0, run.ropeLength - dist);
  const worn = min(1, run.strain);
  const green = (255 - worn * 200) | 0;
  const blue = (255 - worn * 220) | 0;
  const color = worn > 0.05 ? `rgb(255,${green},${blue})` : white(0.85);
  const sag = (handY + by) / 2 + 4 + slack * 0.9;
  strokeCurve(color, 1.6 + worn * 1.5, handX, handY, (handX + bx) / 2, sag, bx, by);
  if (ui.currentScreen == 'play' && run.rivals.length) {
    const share = min(70 + 60 * difficulty(), dist) / dist;
    const alert = rgba('255,60,60', 0.6 + 0.4 * sin(run.clock * 16));
    const danger = run.rivalDanger ? alert : 'rgba(255,225,120,.4)';
    line(danger, 4, bx, by, bx + (handX - bx) * share, by + (handY - by) * share);
  }
}

function drawKiteAndThread() {
  const bx = run.kite.x - sin(run.tilt) * KITE_RADIUS * 0.9;
  const by = run.kite.y + KITE_RADIUS * 0.9;
  const armAngle = atan2(by - view.anchorY, bx - view.anchorX);
  const bodyLean = run.lean + 0.02 * sin(run.clock * 2);
  const [handX, handY] = drawDoll(view.anchorX, view.groundY + 4, 1.25, bodyLean, armAngle);
  if (['custom', 'help', 'scores'].includes(ui.currentScreen)) return;
  drawThread(bx, by, handX, handY);
  drawTail(run.tail);
  const wind = windAt(run.kite.x);
  const blinkOn = Math.floor(run.clock * 14) % 2 == 1;
  if (!run.invulnerable || blinkOn) {
    drawKite(
      run.kite.x,
      run.kite.y,
      run.tilt + (0.12 * sin(run.clock * 3.1) * wind) / 150,
      1,
      wind,
    );
  }
}

function drawTapRing() {
  if (ui.currentScreen != 'play' || !input.held) return;
  const progress = (run.clock - input.pressStart) / TAP_SECONDS;
  const color = progress < 1 ? YELLOW : 'rgba(111,224,138,.75)';
  const end = -PI / 2 + 2 * PI * clamp(progress, 0, 1);
  strokeArc(color, 3, run.kite.x, run.kite.y, KITE_RADIUS + 9, -PI / 2, end);
}

export function drawScene() {
  drawBonfireSmoke();
  drawWind();
  drawPapers();
  drawRivals();
  drawKiteAndThread();
  drawTapRing();
  for (const p of run.particles) {
    setAlpha(min(1, p.life * 2));
    rect(p.color, p.x - 2, p.y - 2, 4, 4);
  }
  for (const p of run.popups) {
    setAlpha(min(1, p.life * 2));
    text(p.label, p.x, p.y, p.size, p.color);
  }
  setAlpha(1);
  if (run.strain > 0.3) {
    const pulse = (run.strain - 0.3) * 0.25 * (0.6 + 0.4 * sin(run.clock * 20));
    rect(rgba('255,0,0', pulse), 0, 0, view.width, view.height);
  }
}
