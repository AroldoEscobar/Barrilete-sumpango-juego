import { WHITE } from './colors.js';

// Cada lista de personalización se guarda como el índice elegido en `config`
export const SHAPES = [
  ['Rombo', 4],
  ['Hexágono', 6],
  ['Octágono', 8],
  ['Estrella', 16],
];

// [nombre, matiz inicial, salto de matiz, saturación]
export const PALETTES = [
  ['Volcán', 5, 22, 90],
  ['Cempasúchil', 28, 12, 95],
  ['Jacaranda', 265, 28, 75],
  ['Selva', 110, 40, 70],
  ['Fiesta', 330, 90, 85],
  ['Hielo', 190, 18, 70],
  ['Papel picado', 0, 60, 85],
  ['Atardecer', 350, 35, 85],
  ['Mar', 172, 24, 75],
];

// [nombre, colores que se saltan, giro entre anillos]
export const PATTERNS = [
  ['Sectores', 1, 0],
  ['Alterno', 2, 0],
  ['Espiral', 1, 1],
  ['Mosaico', 2, 1],
];
export const FRINGES = ['Sin flecos', 'Cortos', 'Largos'];
export const TAILS = ['Sin cola', 'Moños', 'Cintas', 'Borlas'];
export const SKIN_TONES = ['#fdb', '#eb8', '#c85', '#a63', '#742'];

// [nombre, base, franja, adorno]
export const SHIRTS = [
  ['Rojo', '#d42'],
  ['Azul', '#36d'],
  ['Huipil rojo', '#b23', '#fc3', WHITE],
  ['Huipil morado', '#628', '#f83', '#3cc'],
  ['Huipil turquesa', '#299', '#e37', '#fe9'],
];

// [nombre, base, franja]; con franja es un corte (falda)
export const PANTS = [
  ['Pantalón azul', '#348'],
  ['Pantalón café', '#532'],
  ['Pantalón negro', '#222'],
  ['Corte morado', '#727', '#e59'],
  ['Corte rojo', '#a23', '#fb3'],
];
export const HATS = ['Sin sombrero', 'Sombrero de palma', 'Gorra'];

// [nombre, color, estilo: 0 corto, 1 trenza, 2 largo]
export const HAIRS = [
  ['Negro corto', '#111', 0],
  ['Negro con trenza', '#111', 1],
  ['Castaño corto', '#532', 0],
  ['Castaño largo', '#532', 2],
  ['Canoso', '#bbc', 0],
];
export const CUSTOM_LISTS = [
  SHAPES,
  PALETTES,
  PATTERNS,
  FRINGES,
  TAILS,
  SKIN_TONES,
  SHIRTS,
  PANTS,
  HATS,
  HAIRS,
];
export const KITE_OPTIONS = 5;
