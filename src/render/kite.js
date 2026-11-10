import { profile, run } from '../core/state.js';
import { PALETTES, PATTERNS, SHAPES } from '../config/catalog.js';
import { WHITE, white } from '../config/colors.js';
import { KITE_RADIUS } from '../config/constants.js';
import { PI, atan2, cos, sin } from '../core/math.js';
import { save } from '../core/storage.js';
import { ctx, useContext } from './context.js';
import { circle, line, polygon, rect, restoreCtx, saveCtx, translate } from './primitives.js';

export function paletteColors(paletteIndex) {
  const [, hue, step, saturation] = PALETTES[paletteIndex];
  return [0, 1, 2, 3].map(i => {
    const lightness = 50 + (i % 2) * 14;
    return `hsl(${(hue + i * step) % 360} ${saturation}% ${lightness}%)`;
  });
}

// El barrilete se dibuja una vez en un canvas aparte y luego solo se estampa
function buildKiteSprite() {
  const [shapeIndex, paletteIndex, patternIndex, fringeIndex, tailIndex] = profile.config;
  const sides = SHAPES[shapeIndex][1];
  const isStar = shapeIndex == 3;
  const [, colorStep, twist] = PATTERNS[patternIndex];
  const colors = paletteColors(paletteIndex);
  const image = document.createElement('canvas');
  const screenCtx = ctx;

  const vertex = (radius, i) => {
    const angle = (i * 2 * PI) / sides;
    const spike = isStar && i % 2 ? 0.55 : 1;
    return [radius * spike * cos(angle), radius * spike * sin(angle)];
  };

  image.width = image.height = 144;
  useContext(image.getContext('2d'));
  translate(72, 72);
  ctx.lineJoin = 'round';
  [1, 0.76, 0.52, 0.28].forEach((ring, ringIndex) => {
    saveCtx();
    ctx.rotate(((twist * PI) / sides) * ringIndex);
    for (let i = 0; i < sides; i++) {
      const color = colors[(i * colorStep + ringIndex) % 4];
      polygon([0, 0, ...vertex(64 * ring, i), ...vertex(64 * ring, i + 1)], color);
    }
    restoreCtx();
  });
  const outline = Array.from({ length: sides + 1 }, (_, i) => vertex(64, i));
  line(WHITE, 3, ...outline.flat());
  circle(WHITE, 0, 0, 5);
  useContext(screenCtx);

  return { image, colors, sides, isStar, vertex, fringe: [0, 9, 17][fringeIndex], tail: tailIndex };
}

export function applyConfig() {
  run.kiteSprite = buildKiteSprite();
  save('barrilete_cfg', profile.config);
}

export function drawKite(x, y, rotation, scale, wind) {
  const { image, colors, sides, isStar, vertex, fringe } = run.kiteSprite;
  saveCtx();
  translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.drawImage(image, -31.5, -31.5, 63, 63);
  if (fringe) {
    for (let i = 0; i < sides; i++) {
      if (isStar && i % 2) continue;
      const [vx, vy] = vertex(KITE_RADIUS * 0.93, i);
      const angle = (i * 2 * PI) / sides;
      const c = cos(angle);
      const n = sin(angle);
      const sway = sin(run.clock * 9 + i * 2) * 3 + wind * 0.02;
      polygon(
        [
          vx - n * 3,
          vy + c * 3,
          vx + n * 3,
          vy - c * 3,
          vx + c * fringe - n * sway * 0.5 + sway * 0.6,
          vy + n * fringe + c * sway * 0.5 + fringe * 0.5,
        ],
        colors[i % 4],
      );
    }
  }
  restoreCtx();
}

export function drawTail(links) {
  if (!run.kiteSprite.tail || links.length < 2) return;
  line(white(0.7), 1.5, ...links.flatMap(link => [link.x, link.y]));
  links.forEach((link, i) => {
    if (!i) return;
    const previous = links[i - 1];
    const color = run.kiteSprite.colors[i % 4];
    saveCtx();
    translate(link.x, link.y);
    if (run.kiteSprite.tail == 3) {
      circle(color, 0, 0, 5);
    } else {
      ctx.rotate(atan2(link.y - previous.y, link.x - previous.x) + sin(run.clock * 8 + i) * 0.5);
      if (run.kiteSprite.tail == 1) rect(color, -1, -6, 6, 12);
      else rect(color, -2, -2, 16, 4);
    }
    restoreCtx();
  });
}
