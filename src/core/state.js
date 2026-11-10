import { isValidConfig, randomConfig } from './profile.js';
import { load } from './storage.js';

const savedConfig = load('barrilete_cfg', null);
const savedInitials = [...String(load('barrilete_ini', 'AAA'))];

// Geometría del lienzo; resize() la recalcula en cada cambio de tamaño
export const view = {
  width: 0,
  height: 0,
  groundY: 0,
  anchorX: 0,
  anchorY: 0,
  ropeMax: 0,
  viewScale: 1,
  pixelScale: 1,
  background: null,
  bonfire: null,
  centerX: 0,
  contentWidth: 0,
  offsetY: 0,
};

export const ui = {
  currentScreen: 'menu',
  transition: 1,
  menuItems: [],
  focusIndex: 0,
  highlightRank: -1,
  helpPage: 0,
  customTab: 0,
  hintStage: 3,
  hintTimer: 0,
};

export const input = {
  pointers: new Set(),
  pressedKeys: new Set(),
  pointerDown: null,
  pressStart: 0,
  jerkCooldownEnd: 0,
  held: false,
  tapQueued: false,
  holdSustained: false,
};

// Lo que se guarda en el navegador. Cada entrada del Top 10: { n: iniciales, s: puntos, d: fecha }
export const profile = {
  topScores: load('barrilete_top', []),
  config: isValidConfig(savedConfig) ? savedConfig : randomConfig(),
  initials: [0, 1, 2].map(i => (/^[A-Z]$/.test(savedInitials[i]) ? savedInitials[i] : 'A')),
  hasPlayed: load('barrilete_seen', false),
};

// La partida en curso; resetGame() la deja en su valor inicial
export const run = {
  clock: 0,
  playTime: 0,
  overTime: 0,
  cause: '',
  rank: 0,
  shake: 0,
  groundWarnTimer: 0,
  practice: false,
  kite: null,
  ropeLength: 0,
  ropeSpeed: 0,
  tension: 0,
  strain: 0,
  score: 0,
  combo: 1,
  comboTimer: 0,
  papersCaught: 0,
  threadCut: false,
  tilt: 0,
  lean: 0,
  lifeline: 1,
  invulnerable: 0,
  multiplier: 1,
  eventWindScale: 1,
  windEvent: null,
  rivalDanger: false,
  papers: [],
  rivals: [],
  gusts: [],
  particles: [],
  popups: [],
  tail: [],
  windStreaks: [],
  previewTail: [],
  nextGust: 0,
  nextRival: 0,
  nextPaper: 0,
  nextEvent: 0,
  kiteSprite: null,
};
