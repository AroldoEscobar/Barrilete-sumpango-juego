import { profile } from '../core/state.js';
import { HAIRS, PANTS, SHIRTS, SKIN_TONES } from '../config/catalog.js';
import { PI, cos, sin } from '../core/math.js';
import { ctx } from './context.js';
import { circle, line, polygon, rect, restoreCtx, saveCtx, translate } from './primitives.js';

function drawDollLegs(pants, color) {
  rect(color, -4.5, -12, 4, 12);
  rect(color, 0.5, -12, 4, 12);
  rect('#222', -5, -1.5, 10, 1.5);
  if (pants[2]) {
    polygon([-5.5, -13, 5.5, -13, 8, -2, -8, -2], pants[1]);
    for (let i = -2; i < 3; i++) line(pants[2], 1.2, i * 2.2, -13, i * 3.2, -2);
    line(pants[2], 2, -7.6, -3, 7.6, -3);
  }
}

function drawDollShirt(shirt) {
  rect(shirt[1], -5.5, -25, 11, 14);
  if (!shirt[2]) return;
  [-3.4, 0, 3.4].forEach(v => {
    polygon([v, -23.5, v + 2, -21.5, v, -19.5, v - 2, -21.5], shirt[2]);
  });
  rect(shirt[3], -5.5, -17.5, 11, 1.5);
  rect(shirt[2], -5.5, -14.5, 11, 1.2);
  rect(shirt[2], -5.5, -25, 11, 1.2);
}

function drawDollHat(hatIndex) {
  if (hatIndex == 1) {
    saveCtx();
    ctx.scale(1, 0.25);
    circle('#ec6', 0, -136, 11);
    restoreCtx();
    circle('#ec6', 0, -34, 5, PI, 2 * PI);
    rect('#a42', -5, -35.2, 10, 1.3);
  }
  if (hatIndex == 2) {
    circle('#27b', 0, -33, 5.8, PI, 2 * PI);
    polygon([3, -33, 10, -32, 10, -31, 3, -31.2], '#185');
  }
}

export function drawDoll(x, y, scale, bodyLean, armAngle) {
  const [, , , , , skinIndex, shirtIndex, pantsIndex, hatIndex, hairIndex] = profile.config;
  const shirt = SHIRTS[shirtIndex];
  const pants = PANTS[pantsIndex];
  const hair = HAIRS[hairIndex];
  const skin = SKIN_TONES[skinIndex];
  const armDir = armAngle - bodyLean;
  const armX = cos(armDir);
  const armY = sin(armDir);

  saveCtx();
  translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(bodyLean);
  if (hair[2] == 1) line(hair[1], 3, -3, -29, -6, -22, -7, -14);
  if (hair[2] == 2) rect(hair[1], -7, -33, 6, 17);
  drawDollLegs(pants, pants[2] ? skin : pants[1]);
  drawDollShirt(shirt);
  line(shirt[1], 3.4, 0, -22, armX * 9, -22 + armY * 9);
  circle(skin, armX * 10.5, -22 + armY * 10.5, 2.4);
  circle(skin, 0, -30, 5.5);
  circle('#222', 2.6, -30.5, 0.8);
  circle(hair[1], 0, -31, 5.8, PI, 2 * PI);
  drawDollHat(hatIndex);
  restoreCtx();

  const handX = x + scale * (22 * sin(bodyLean) + 10.5 * cos(armAngle));
  const handY = y + scale * (-22 * cos(bodyLean) + 10.5 * sin(armAngle));
  return [handX, handY];
}
