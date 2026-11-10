import { ctx } from './context.js';

export const setAlpha = alpha => (ctx.globalAlpha = alpha);
export const saveCtx = () => ctx.save();
export const restoreCtx = () => ctx.restore();
export const translate = (x, y) => ctx.translate(x, y);

export function polygon(points, fill) {
  ctx.beginPath();
  for (let i = 0; i < points.length; i += 2) {
    if (i) ctx.lineTo(points[i], points[i + 1]);
    else ctx.moveTo(points[i], points[i + 1]);
  }
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
}

export function rect(color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

export function circle(color, x, y, radius, start = 0, end = 7) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, start, end);
  ctx.fill();
}

export function strokeArc(color, lineWidth, x, y, radius, start = 0, end = 7) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(x, y, radius, start, end);
  ctx.stroke();
}

export function line(color, lineWidth, ...points) {
  polygon(points);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

export function roundedRect(x, y, w, h, radius, fill, stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export function text(str, x, y, size, color, align, weight) {
  ctx.font = `${weight || 700} ${size}px system-ui,sans-serif`;
  ctx.textAlign = align || 'center';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

export function wrapText(str, x, y, maxWidth, lineHeight, size, color) {
  ctx.font = `400 ${size}px system-ui,sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillStyle = color;
  let current = '';
  for (const word of str.split(' ')) {
    const attempt = current ? `${current} ${word}` : word;
    if (ctx.measureText(attempt).width > maxWidth && current) {
      ctx.fillText(current, x, y);
      y += lineHeight;
      current = word;
    } else {
      current = attempt;
    }
  }
  ctx.fillText(current, x, y);
}
