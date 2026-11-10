import { profile, run, ui, view } from '../core/state.js';
import { click } from '../audio/sound.js';
import { WHITE, YELLOW, white } from '../config/colors.js';
import { TOP_SIZE } from '../config/constants.js';
import { min } from '../core/math.js';
import { save } from '../core/storage.js';
import { goTo, startGame } from '../game/lifecycle.js';
import { bestScore } from '../render/hud.js';
import { rect, roundedRect, text } from '../render/primitives.js';
import { addItem, button, heading } from './widgets.js';

export function drawScores() {
  heading('PUNTUACIONES', 40, 28);
  const x = view.centerX - view.contentWidth / 2;
  roundedRect(x, view.offsetY + 62, view.contentWidth, 356, 14, 'rgba(0,0,0,.35)');
  for (let i = 0; i < TOP_SIZE; i++) {
    const entry = profile.topScores[i];
    const y = view.offsetY + 92 + i * 34;
    const color = i == ui.highlightRank ? YELLOW : entry ? WHITE : white(0.3);
    if (i == ui.highlightRank)
      rect('rgba(255,213,74,.18)', x + 6, y - 22, view.contentWidth - 12, 32);
    text(`${i + 1}.`, x + 16, y, 17, color, 'left');
    text(entry ? entry.n : '---', x + 56, y, 17, color, 'left');
    const date = entry ? new Date(entry.d).toLocaleDateString('es') : '';
    text(date, x + view.contentWidth * 0.55, y, 14, color, 'center', 400);
    text(entry ? entry.s : '—', x + view.contentWidth - 16, y, 17, color, 'right');
  }
  button('Volver', view.offsetY + 440, () => goTo('menu'), true);
}

function saveScore() {
  const entry = { n: profile.initials.join(''), s: run.score | 0, d: Date.now() };
  profile.topScores.push(entry);
  profile.topScores.sort((a, b) => b.s - a.s || a.d - b.d);
  profile.topScores = profile.topScores.slice(0, TOP_SIZE);
  ui.highlightRank = profile.topScores.indexOf(entry);
  save('barrilete_top', profile.topScores);
  save('barrilete_ini', profile.initials.join(''));
  click();
  goTo('scores');
}

export function drawGameOver() {
  heading(run.cause, 150, min(40, view.width / 11));
  text(`Puntos: ${run.score | 0}`, view.centerX, view.offsetY + 205, 32, WHITE);
  let verdict = `Récord: ${bestScore()}`;
  if (run.practice) verdict = 'Práctica: no cuenta para el Top 10';
  else if (run.rank) verdict = `¡Entraste al Top 10, lugar ${run.rank}!`;
  text(verdict, view.centerX, view.offsetY + 238, 18, run.rank ? YELLOW : '#ddd', 'center', 600);
  if (run.overTime <= 0.6) return;
  let y = view.offsetY + 275;
  if (run.rank) {
    button(
      'Guardar puntaje',
      y,
      () => {
        goTo('name');
        click();
      },
      true,
    );
    y += 58;
  }
  button('Reintentar', y, () => startGame(run.practice), !run.rank);
  button('Menú', y + 58, () => goTo('menu'));
}

function nextLetter(letter, step) {
  return String.fromCharCode(65 + ((letter.charCodeAt(0) - 65 + step + 26) % 26));
}

export function drawNameEntry() {
  heading('TUS INICIALES', 100, 28);
  text(
    `Lugar ${run.rank} · ${run.score | 0} puntos`,
    view.centerX,
    view.offsetY + 140,
    18,
    WHITE,
    'center',
    500,
  );
  for (let i = 0; i < 3; i++) {
    const x = view.centerX - 100 + i * 72;
    const y = view.offsetY + 170;
    const changeLetter = step => {
      profile.initials[i] = nextLetter(profile.initials[i], step);
      click();
    };
    const options = { isStepper: true, onEnter: () => ui.focusIndex++ };
    const focused = addItem(x, y, 64, 100, changeLetter, options);
    const fill = focused ? 'rgba(255,213,74,.25)' : white(0.12);
    roundedRect(x, y, 64, 100, 12, fill, focused && YELLOW);
    text(profile.initials[i], x + 32, y + 66, 52, WHITE);
    text('▲', x + 32, y + 22, 16, YELLOW);
    text('▼', x + 32, y + 94, 16, YELLOW);
  }
  button('Guardar', view.offsetY + 300, saveScore, true);
  text('Teclea letras o usa ▲ ▼', view.centerX, view.offsetY + 372, 13, white(0.7), 'center', 400);
}

export function drawPause() {
  heading('PAUSA', 140, 36);
  button('Continuar', view.offsetY + 200, () => goTo('play'), true);
  button('Menú', view.offsetY + 260, () => goTo('menu'));
}
