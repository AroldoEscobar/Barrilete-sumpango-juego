import { run, view } from '../core/state.js';
import { tone } from '../audio/sound.js';
import { WHITE, YELLOW } from '../config/colors.js';
import { KITE_RADIUS, MIN_ROPE } from '../config/constants.js';
import { clamp, cos, ease, hypot, max, min, random, sin } from '../core/math.js';
import { burstParticles, showPopup } from './effects.js';
import { difficulty, windAt } from './wind.js';

// Nace en un punto que el hilo alcanza y que cabe en pantalla
function spawnPaper() {
  for (let tries = 0; tries < 20; tries++) {
    const radius = MIN_ROPE + 50 + random() * (view.ropeMax - MIN_ROPE - 80);
    const angle = 0.27 + random() * 0.8;
    const x = view.anchorX + radius * cos(angle);
    const y = view.anchorY - radius * sin(angle);
    if (x < view.width - 30 && y > 50) {
      const life = 10 - difficulty() * 4;
      run.papers.push({
        x,
        y,
        homeX: x,
        homeY: y,
        driftX: 0,
        driftY: 0,
        vx: 0,
        life,
        maxLife: life,
        color: run.kiteSprite.colors[(random() * 4) | 0],
        phase: random() * 6,
      });
      return;
    }
  }
}

function catchPaper(paper) {
  paper.life = -1;
  run.combo = run.comboTimer > 0 ? min(run.combo + 1, 8) : 1;
  run.comboTimer = 5;
  run.papersCaught++;
  const points = Math.round(10 * run.combo * run.multiplier);
  run.score += points;
  run.shake = max(run.shake, 0.1);
  tone(520 * 1.12 ** run.combo, 1040 * 1.12 ** run.combo, 0.18, 'sine', 0.25);
  burstParticles(paper.x, paper.y, paper.color, 14);
  showPopup(paper.x, paper.y - 20, `+${points}`, YELLOW, 20 + run.combo * 2);
  if (run.combo > 1) showPopup(paper.x, paper.y - 48, `combo ×${run.combo}`, WHITE, 13);
}

// El papel se deja llevar: la calma lo frena y la ráfaga lo empuja y lo eleva.
// Se limita a lo que el hilo alcanza para que siempre se pueda atrapar.
function updatePaper(paper, dt) {
  const wind = windAt(paper.x);
  const previousX = paper.x;
  const driftTarget = 0.65 * max(0, wind - 40);
  paper.driftX = ease(paper.driftX, driftTarget, driftTarget > paper.driftX ? 2.2 : 0.7, dt);
  paper.driftY = ease(paper.driftY, clamp((120 - wind) * 0.1, -30, 30), 2.2, dt);
  paper.x = min(
    paper.homeX + paper.driftX + 6 * sin(run.clock * 1.3 + paper.phase),
    view.width - 30,
  );
  const flutter = (3 + wind / 60) * sin(run.clock * 2 + paper.phase);
  paper.y = clamp(paper.homeY + paper.driftY + flutter, 50, view.groundY - 60);
  const reach = hypot(paper.x - view.anchorX, paper.y - view.anchorY);
  const maxReach = view.ropeMax - 12;
  if (reach > maxReach) {
    paper.x = view.anchorX + ((paper.x - view.anchorX) * maxReach) / reach;
    paper.y = view.anchorY + ((paper.y - view.anchorY) * maxReach) / reach;
  }
  paper.vx = ease(paper.vx, (paper.x - previousX) / dt, 8, dt);
}

export function updatePapers(dt, diff) {
  if ((run.nextPaper -= dt) < 0 && run.papers.length < (diff > 0.5 ? 3 : 2)) {
    run.nextPaper = 1.2 + random() * 1.5;
    spawnPaper();
  }
  for (const paper of run.papers) {
    paper.life -= dt;
    updatePaper(paper, dt);
    if (hypot(run.kite.x - paper.x, run.kite.y - paper.y) < KITE_RADIUS + 14) catchPaper(paper);
    else if (paper.life < 0) run.combo = 1;
  }
  run.papers = run.papers.filter(paper => paper.life >= 0);
}
