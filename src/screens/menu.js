import { profile, run, ui, view } from '../core/state.js';
import { WHITE } from '../config/colors.js';
import { min, sin } from '../core/math.js';
import { goTo, startGame } from '../game/lifecycle.js';
import { text } from '../render/primitives.js';
import { button, heading } from './widgets.js';

export function drawMenu() {
  heading('BARRILETE', 100 + sin(run.clock * 1.5) * 3, min(64, view.width / 6.2));
  text('Sumpango · Todos los Santos', view.centerX, view.offsetY + 132, 15, '#fbd', 'center', 500);
  button('Jugar', view.offsetY + 175, () => startGame(false), true);
  button('Mi barrilete', view.offsetY + 235, () => goTo('custom'));
  button('Puntuaciones', view.offsetY + 295, () => {
    ui.highlightRank = -1;
    goTo('scores');
  });
  button('Instrucciones', view.offsetY + 355, () => {
    ui.helpPage = 0;
    goTo('help');
    ui.focusIndex = 3;
  });
  const record = profile.topScores[0]
    ? `Récord: ${profile.topScores[0].n} · ${profile.topScores[0].s}`
    : 'Sin récord';
  text(record, view.centerX, view.offsetY + 436, 15, WHITE, 'center', 500);
}
