import { input, profile, run, ui, view } from '../core/state.js';
import { click, noiseBurst, tone } from '../audio/sound.js';
import { WHITE } from '../config/colors.js';
import {
  FIRST_EVENT_SECONDS,
  FIRST_RIVAL_SECONDS,
  INVULNERABLE_SECONDS,
  TOP_SIZE,
} from '../config/constants.js';
import { releaseInputs } from './controls.js';
import { burstParticles, showPopup } from './effects.js';

export function resetGame() {
  run.kite = { x: view.anchorX + 130, y: view.groundY - 190, vx: 60, vy: 0 };
  run.ropeLength = 210;
  run.ropeSpeed = 0;
  run.tension = 0;
  run.strain = 0;
  run.score = 0;
  run.combo = 1;
  run.comboTimer = 0;
  run.papersCaught = 0;
  run.threadCut = false;
  run.lifeline = 1;
  run.invulnerable = 0;
  run.tilt = 0;
  run.papers = [];
  run.rivals = [];
  run.gusts = [];
  run.particles = [];
  run.popups = [];
  run.playTime = 0;
  run.nextGust = 1;
  run.nextRival = FIRST_RIVAL_SECONDS;
  run.nextPaper = 2;
  run.nextEvent = FIRST_EVENT_SECONDS;
  run.windEvent = null;
  run.eventWindScale = 1;
  run.tail = [];
  run.overTime = 0;
  run.shake = 0;
  input.pressStart = -9;
  run.rivalDanger = false;
  input.tapQueued = false;
}

export function goTo(screenName) {
  ui.currentScreen = screenName;
  ui.transition = 1;
  ui.focusIndex = 0;
  ui.menuItems = [];
  if (screenName == 'menu') resetGame();
}

// Salvavidas: perdona un fallo y se recarga con el tiempo, para que los
// primeros descuidos sirvan de aprendizaje
function useLifeline(threadBroke) {
  run.lifeline = 0;
  run.invulnerable = INVULNERABLE_SECONDS;
  run.strain = 0;
  run.combo = 1;
  run.shake = 0.4;
  tone(400, 1200, 0.3, 'triangle', 0.25);
  if (threadBroke) {
    run.kite.vx *= 0.5;
  } else {
    run.kite.y = view.groundY - 70;
    run.kite.vy = -260;
  }
  showPopup(run.kite.x, run.kite.y - 50, '¡SALVADO!', '#6f8', 17);
}

function rankFor(points) {
  if (run.practice || points <= 0) return 0;
  const last = profile.topScores[profile.topScores.length - 1];
  if (profile.topScores.length < TOP_SIZE || points > last.s) {
    return 1 + profile.topScores.filter(entry => entry.s >= points).length;
  }
  return 0;
}

export function die(reason, threadBroke) {
  if (run.lifeline >= 1 && !run.invulnerable) {
    useLifeline(threadBroke);
    return;
  }
  goTo('over');
  run.overTime = 0;
  run.cause = reason;
  run.threadCut = threadBroke;
  run.shake = 0.6;
  run.windEvent = null;
  run.rank = rankFor(run.score | 0);
  if (threadBroke) {
    tone(1800, 200, 0.25, 'sine', 0.25);
    noiseBurst(0.3, 6000, 0.3);
  } else {
    noiseBurst(0.6, 1500, 0.5);
  }
  burstParticles(run.kite.x, run.kite.y, WHITE, 18);
}

export function startGame(isPractice) {
  resetGame();
  releaseInputs();
  run.practice = isPractice;
  ui.hintStage = run.practice || !profile.hasPlayed ? 0 : 3;
  goTo('play');
  click();
}

export function pauseGame() {
  releaseInputs();
  if (ui.currentScreen == 'play') goTo('pause');
}
