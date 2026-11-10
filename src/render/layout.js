import { view } from '../core/state.js';
import { max, min } from '../core/math.js';
import { drawBackground } from './background.js';
import { canvas } from './context.js';

export function resize() {
  const dpr = min(2, devicePixelRatio || 1);
  const innerW = innerWidth;
  const innerH = innerHeight;
  const scale = min(innerH / 600, innerW / 400);
  canvas.width = innerW * dpr;
  canvas.height = innerH * dpr;
  view.width = innerW / scale;
  view.height = innerH / scale;
  view.pixelScale = dpr * scale;
  view.viewScale = scale;
  view.groundY = view.height - 70;
  view.anchorX = view.width * (view.width < 600 ? 0.2 : 0.3);
  view.anchorY = view.groundY - 24;
  view.ropeMax = min(0.8 * view.groundY, 0.9 * (view.width - view.anchorX));
  view.centerX = view.width / 2;
  view.contentWidth = min(view.width - 24, 440);
  view.offsetY = max(0, (view.height - 600) * 0.3);
  view.background = document.createElement('canvas');
  view.background.width = canvas.width;
  view.background.height = canvas.height;
  drawBackground();
}
