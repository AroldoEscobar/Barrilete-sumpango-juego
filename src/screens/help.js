import { ui, view } from '../core/state.js';
import { click } from '../audio/sound.js';
import { WHITE, YELLOW, white } from '../config/colors.js';
import { clamp } from '../core/math.js';
import { goTo, startGame } from '../game/lifecycle.js';
import { ctx } from '../render/context.js';
import {
  circle,
  restoreCtx,
  roundedRect,
  saveCtx,
  text,
  translate,
  wrapText,
} from '../render/primitives.js';
import { DIAGRAMS } from './diagrams.js';
import { button, heading } from './widgets.js';

const HELP_PAGES = [
  [
    'Cómo se juega',
    [
      ['UN SOLO BOTÓN', 'Clic, toque, Espacio, ↑ o W.'],
      ['MANTÉN Y SUELTA', 'Mantén: sube y acorta la cuerda. Suelta: da cuerda y baja.'],
      ['TIRÓN CORTO', 'Un toque rápido (<0,2 s) da un empujón arriba.'],
    ],
  ],
  [
    'Viento y tensión',
    [
      ['RÁFAGA', 'Franja blanca: viento fuerte. ¡Suelta cuerda!'],
      ['CALMA', 'Franja azul: viento flojo. ¡Jala o cae!'],
      ['TENSIÓN', 'Si la barra pasa la marca blanca mucho rato, el hilo se revienta.'],
    ],
  ],
  [
    'Puntos y peligros',
    [
      ['PAPEL DE CHINA', 'Flota con el viento. Atrápalo y haz combos hasta ×8.'],
      [
        'RIVALES',
        'Si cruzan el tramo amarillo del hilo, lo cortan. ' +
          '♥ Salvavidas: perdona 1 fallo, recarga en 45 s.',
      ],
      ['EVENTOS', 'Ventarrón, calma y torbellino avisan 3 s antes. Valen ×2.'],
    ],
  ],
];

export function turnPage(step) {
  ui.helpPage = clamp(ui.helpPage + step, 0, HELP_PAGES.length - 1);
  click();
}

export function drawHelp() {
  const [title, cards] = HELP_PAGES[ui.helpPage];
  const x = view.centerX - view.contentWidth / 2;
  const cardHeight = 134;
  heading(title.toUpperCase(), 30, 24);
  for (let i = 0; i < 3; i++) {
    circle(
      i == ui.helpPage ? YELLOW : white(0.35),
      view.centerX + (i - 1) * 20,
      view.offsetY + 54,
      5,
    );
  }
  button('‹', view.offsetY + 40, () => turnPage(-1), false, 40, view.centerX - 90, 28);
  button('›', view.offsetY + 40, () => turnPage(1), false, 40, view.centerX + 50, 28);
  cards.forEach(([name, description], i) => {
    const y = view.offsetY + 78 + i * (cardHeight + 8);
    roundedRect(x, y, view.contentWidth, cardHeight, 14, 'rgba(0,0,0,.5)');
    saveCtx();
    ctx.beginPath();
    ctx.rect(x + 4, y + 4, 122, cardHeight - 8);
    ctx.clip();
    translate(x + 4, y + (cardHeight - 110) / 2);
    DIAGRAMS[ui.helpPage * 3 + i]();
    restoreCtx();
    text(name, x + 134, y + 30, 16, YELLOW, 'left');
    wrapText(description, x + 134, y + 54, view.contentWidth - 148, 18, 14, WHITE);
  });
  const y = view.offsetY + 78 + 3 * (cardHeight + 8) + 2;
  const buttonWidth = (view.contentWidth - 8) / 2;
  button('Volver', y, () => goTo('menu'), false, buttonWidth, x);
  button('Practicar', y, () => startGame(true), true, buttonWidth, x + buttonWidth + 8);
}
