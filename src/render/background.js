import { view } from '../core/state.js';
import { DARK, WHITE } from '../config/colors.js';
import { sin } from '../core/math.js';
import { ctx, useContext } from './context.js';
import { circle, line, polygon, rect, setAlpha } from './primitives.js';

// Generador propio para que el fondo salga igual cada vez que se redimensiona
function seededRandom(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

function drawSky(rnd) {
  const sky = ctx.createLinearGradient(0, 0, 0, view.groundY);
  [
    [0, '#0f0a2c'],
    [0.4, '#4a2480'],
    [0.72, '#c93f6e'],
    [1, '#ffb35c'],
  ].forEach(stop => {
    sky.addColorStop(...stop);
  });
  rect(sky, 0, 0, view.width, view.height);
  for (let i = 0; i < 70; i++) {
    setAlpha(rnd() * 0.7);
    rect(WHITE, rnd() * view.width, rnd() * view.groundY * 0.6, 1.5, 1.5);
  }
  setAlpha(0.15);
  circle('#fe9', view.width * 0.82, 90, 44);
  setAlpha(1);
  circle('#ffe', view.width * 0.82, 90, 24);
}

function drawVolcano(rnd, centerPx, peakHeight, halfBase, color, ridge) {
  const left = [centerPx - halfBase, view.groundY];
  const right = [centerPx + halfBase, view.groundY];
  for (let i = 1; i < 10; i++) {
    const u = i / 10;
    const slopeY = () => view.groundY - peakHeight * u ** 1.6 * (1 + (rnd() - 0.5) * 0.04);
    left.push(centerPx - halfBase * (1 - u), slopeY());
    right.unshift(centerPx + halfBase * (1 - u), slopeY());
  }
  const top = view.groundY - peakHeight;
  polygon([...left, centerPx - 8, top, centerPx + 8, top, ...right], color);
  if (ridge) {
    polygon(
      [
        centerPx + halfBase * 0.5,
        view.groundY,
        centerPx + halfBase * 0.62,
        view.groundY - peakHeight * 0.78,
        centerPx + halfBase * 0.7,
        view.groundY - peakHeight * 0.75,
        centerPx + halfBase * 1.4,
        view.groundY,
      ],
      color,
    );
  }
}

function drawGraveyardBlock(rnd, x, base, lights) {
  const stoneHeight = 14 + rnd() * 16;
  rect(DARK, x + 7, base - stoneHeight, 4, stoneHeight);
  rect(DARK, x + 2, base - stoneHeight + 5, 14, 4);
  if (rnd() < 0.7) lights.push([x + 4, base - 3, '#f91'], [x + 12, base - 2, '#fb3']);
}

function drawChurch(x, base, w, h) {
  rect(DARK, x + w * 0.3, base - h - 34, w * 0.4, 34);
  polygon([x + w * 0.3, base - h - 34, x + w / 2, base - h - 50, x + w * 0.7, base - h - 34], DARK);
  rect(DARK, x + w / 2 - 1, base - h - 62, 2, 12);
  rect(DARK, x + w / 2 - 5, base - h - 58, 10, 2);
}

function drawRoof(x, base, w, h) {
  polygon([x - 3, base - h, x + w / 2, base - h - 14, x + w + 3, base - h], DARK);
}

// Casas, iglesias y un cementerio; las ventanas se pintan al final para que queden encima
function drawTown(rnd) {
  const lights = [];
  const base = view.groundY + 1;
  for (let x = -10; x < view.width;) {
    const kind = rnd();
    const w = 26 + rnd() * 28;
    const h = 18 + rnd() * 26;
    if (x > view.width * 0.62 && x < view.width * 0.9) {
      for (let i = 0; i < 3 && x < view.width * 0.9; i++, x += 22) {
        drawGraveyardBlock(rnd, x, base, lights);
      }
      continue;
    }
    rect(DARK, x, base - h, w, h);
    if (kind < 0.45) drawRoof(x, base, w, h);
    else if (kind < 0.55) drawChurch(x, base, w, h);
    for (let i = 0; i < 2; i++) {
      if (rnd() < 0.5) {
        lights.push([x + 4 + rnd() * (w - 10), base - h + 4 + rnd() * (h - 10), '#fc6']);
      }
    }
    x += w + 4 + rnd() * 10;
  }
  lights.forEach(([x, y, color]) => rect(color, x, y, 3, 3));
}

export function drawBackground() {
  const screenCtx = ctx;
  const rnd = seededRandom(7);
  useContext(view.background.getContext('2d'));
  ctx.setTransform(
    view.background.width / view.width,
    0,
    0,
    view.background.width / view.width,
    0,
    0,
  );
  drawSky(rnd);
  drawVolcano(rnd, view.width * 0.74, 240, 300, '#3a1a5a');
  drawVolcano(rnd, view.width * 0.16, 200, 260, '#2b1248', true);
  view.bonfire = { x: view.width * 0.16 + 260 * 0.66, y: view.groundY - 200 * 0.77 + 2 };
  const hills = [0, view.groundY];
  for (let x = 0; x <= view.width; x += 40) {
    hills.push(x, view.groundY - 40 - 30 * sin(x * 0.01) - rnd() * 14);
  }
  polygon([...hills, view.width, view.groundY], '#1d0d33');
  rect(DARK, 0, view.groundY, view.width, view.height - view.groundY);
  drawTown(rnd);
  for (let x = view.width * 0.05; x < view.width; x += view.width * 0.3) {
    line(DARK, 2, x, view.groundY, x, view.groundY - 78);
    rect(DARK, x - 9, view.groundY - 76, 18, 2);
  }
  useContext(screenCtx);
}
