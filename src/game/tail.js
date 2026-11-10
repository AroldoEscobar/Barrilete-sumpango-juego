import { run } from '../core/state.js';
import { hypot, sin } from '../core/math.js';

export function updateTail(links, anchorPointX, anchorPointY, wind, dt, count) {
  while (links.length < count) {
    links.push({ x: anchorPointX, y: anchorPointY + links.length * 8 });
  }
  links.length = count;
  if (!count) return;
  links[0].x = anchorPointX;
  links[0].y = anchorPointY;
  for (let i = 1; i < count; i++) {
    const link = links[i];
    const previous = links[i - 1];
    link.x += (wind * 0.45 + sin(run.clock * 6 + i) * 14) * dt;
    link.y += 60 * dt;
    const dx = link.x - previous.x;
    const dy = link.y - previous.y;
    const dist = hypot(dx, dy) || 1;
    link.x = previous.x + (dx / dist) * 9;
    link.y = previous.y + (dy / dist) * 9;
  }
}
