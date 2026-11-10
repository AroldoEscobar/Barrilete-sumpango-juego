const canvas = document.getElementById('c');
const { PI, sin, cos, min, max, hypot, abs, exp, atan2 } = Math;
const random = Math.random;

const DARK = '#0a0513';
const WHITE = '#fff';
const YELLOW = '#fd4';
const GREEN = '#6e8';
const RED = '#f55';

const KITE_RADIUS = 30;
// Con menos cuerda el barrilete queda pegado al muñeco y al jalar cae en espiral
const MIN_ROPE = 130;
const GRAVITY = 200;
const TENSION_LIMIT = 1500;
const TAP_SECONDS = 0.22;
const GUST_SPEED = 230;
const LIFELINE_RECHARGE = 45;
const INVULNERABLE_SECONDS = 2.5;
const FIRST_RIVAL_SECONDS = 26;
const FIRST_EVENT_SECONDS = 36;
const TOP_SIZE = 10;
const STEP = 1 / 120;

// Cada lista de personalización se guarda como el índice elegido en `config`
const SHAPES = [['Rombo', 4], ['Hexágono', 6], ['Octágono', 8], ['Estrella', 16]];
// [nombre, matiz inicial, salto de matiz, saturación]
const PALETTES = [
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
const PATTERNS = [['Sectores', 1, 0], ['Alterno', 2, 0], ['Espiral', 1, 1], ['Mosaico', 2, 1]];
const FRINGES = ['Sin flecos', 'Cortos', 'Largos'];
const TAILS = ['Sin cola', 'Moños', 'Cintas', 'Borlas'];
const SKIN_TONES = ['#fdb', '#eb8', '#c85', '#a63', '#742'];
// [nombre, base, franja, adorno]
const SHIRTS = [
  ['Rojo', '#d42'],
  ['Azul', '#36d'],
  ['Huipil rojo', '#b23', '#fc3', WHITE],
  ['Huipil morado', '#628', '#f83', '#3cc'],
  ['Huipil turquesa', '#299', '#e37', '#fe9'],
];
// [nombre, base, franja]; con franja es un corte (falda)
const PANTS = [
  ['Pantalón azul', '#348'],
  ['Pantalón café', '#532'],
  ['Pantalón negro', '#222'],
  ['Corte morado', '#727', '#e59'],
  ['Corte rojo', '#a23', '#fb3'],
];
const HATS = ['Sin sombrero', 'Sombrero de palma', 'Gorra'];
// [nombre, color, estilo: 0 corto, 1 trenza, 2 largo]
const HAIRS = [
  ['Negro corto', '#111', 0],
  ['Negro con trenza', '#111', 1],
  ['Castaño corto', '#532', 0],
  ['Castaño largo', '#532', 2],
  ['Canoso', '#bbc', 0],
];
const CUSTOM_LISTS = [
  SHAPES, PALETTES, PATTERNS, FRINGES, TAILS,
  SKIN_TONES, SHIRTS, PANTS, HATS, HAIRS,
];
const KITE_OPTIONS = 5;

const WIND_EVENTS = [
  ['VENTARRÓN', '¡Suelta cuerda, aprieta el viento!'],
  ['CALMA CHICHA', '¡Jala para no caer!'],
  ['TORBELLINO', 'El viento late: sigue el ritmo'],
];
const HINTS = ['Mantén para jalar', 'Suelta para dar cuerda', 'Toque rápido: ¡tirón!'];
const HOLD_KEYS = [' ', 'arrowup', 'w'];

let ctx = canvas.getContext('2d');
let width, height, groundY, anchorX, anchorY, ropeMax;
let viewScale, pixelScale, background, bonfire;
let centerX, contentWidth, offsetY;

let currentScreen = 'menu';
let clock = 0;
let playTime = 0;
let transition = 1;
let overTime = 0;
let cause = '';
let rank = 0;
let shake = 0;
let groundWarnTimer = 0;

let pointers = new Set();
let pressedKeys = new Set();
let pointerDown = null;
let pressStart = 0;
let jerkCooldownEnd = 0;
let held = false;
let tapQueued = false;
let holdSustained = false;

let hasPlayed = load('barrilete_seen', false);
let hintStage = 3;
let hintTimer = 0;
let practice = false;

let menuItems = [];
let focusIndex = 0;
let highlightRank = -1;
let helpPage = 0;
let customTab = 0;

let kite, ropeLength, ropeSpeed, tension, strain;
let score, combo, comboTimer, papersCaught;
let threadCut, tilt, lean = 0;
let lifeline = 1;
let invulnerable = 0;
let multiplier = 1;
let eventWindScale = 1;
let windEvent, rivalDanger;
let papers, rivals, gusts, particles, popups, tail;
let windStreaks = [];
let previewTail = [];
let nextGust, nextRival, nextPaper, nextEvent;
let kiteSprite;

let audioCtx, windGain, windFilter, creakGain, creakOsc, noiseBuffer;

// Cada entrada del Top 10: { n: iniciales, s: puntos, d: fecha }
let topScores = load('barrilete_top', []);
let config = load('barrilete_cfg', null);
let initials = [...String(load('barrilete_ini', 'AAA'))];
if (!isValidConfig(config)) config = randomConfig();

function load(key, fallback) {
  try {
    return JSON.parse(localStorage[key]) || fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage[key] = JSON.stringify(value);
  } catch {
    // sin almacenamiento (modo privado): el juego sigue sin guardar
  }
}

function isValidConfig(list) {
  return list && list.length == 10 && CUSTOM_LISTS.every((options, i) => options[list[i]]);
}

function randomConfig() {
  return CUSTOM_LISTS.map(options => (random() * options.length) | 0);
}

const clamp = (value, low, high) => max(low, min(high, value));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (value, target, rate, dt) => value + (target - value) * min(1, dt * rate);
const rgba = (rgb, alpha) => `rgba(${rgb},${alpha})`;
const white = alpha => rgba('255,255,255', alpha);

const setAlpha = alpha => (ctx.globalAlpha = alpha);
const saveCtx = () => ctx.save();
const restoreCtx = () => ctx.restore();
const translate = (x, y) => ctx.translate(x, y);

function polygon(points, fill) {
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

function rect(color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function circle(color, x, y, radius, start = 0, end = 7) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, start, end);
  ctx.fill();
}

function strokeArc(color, lineWidth, x, y, radius, start = 0, end = 7) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(x, y, radius, start, end);
  ctx.stroke();
}

function line(color, lineWidth, ...points) {
  polygon(points);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function roundedRect(x, y, w, h, radius, fill, stroke) {
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

function text(str, x, y, size, color, align, weight) {
  ctx.font = `${weight || 700} ${size}px system-ui,sans-serif`;
  ctx.textAlign = align || 'center';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function wrapText(str, x, y, maxWidth, lineHeight, size, color) {
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

const difficulty = () => min(1, playTime / 200);
const altitudeFactor = y => clamp((anchorY - y) / (ropeMax * 0.85), 0, 1);
const baseWind = () => (115 + 60 * difficulty()) * (1 + 0.2 * sin(clock * 0.5)) * eventWindScale;

function windAt(x) {
  let wind = baseWind();
  for (const gust of gusts) {
    wind += gust.strength * exp(-(((x - gust.x) / gust.width) ** 2));
  }
  return max(0, wind);
}

const chain = (...nodes) => nodes.reduce((from, to) => from.connect(to));

function rampValue(param, from, to, start, duration) {
  param.setValueAtTime(from, start);
  param.exponentialRampToValueAtTime(to, start + duration);
}

// Viento (ruido filtrado) y crujido del hilo suenan siempre; solo cambia su volumen
function startAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new AudioContext();
    const rate = audioCtx.sampleRate;
    noiseBuffer = audioCtx.createBuffer(1, rate * 2, rate);
    const samples = noiseBuffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = random() * 2 - 1;

    const wind = audioCtx.createBufferSource();
    wind.buffer = noiseBuffer;
    wind.loop = true;
    windFilter = audioCtx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.Q.value = 0.8;
    windGain = audioCtx.createGain();
    windGain.gain.value = 0;
    chain(wind, windFilter, windGain, audioCtx.destination);
    wind.start();

    creakOsc = audioCtx.createOscillator();
    creakOsc.type = 'sawtooth';
    creakGain = audioCtx.createGain();
    creakGain.gain.value = 0;
    chain(creakOsc, creakGain, audioCtx.destination);
    creakOsc.start();
  } catch {
    audioCtx = null;
  }
}

function playNoise(startFreq, duration, volume) {
  const now = audioCtx.currentTime;
  const source = audioCtx.createBufferSource();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  source.buffer = noiseBuffer;
  filter.type = 'lowpass';
  rampValue(filter.frequency, startFreq, 80, now, duration);
  rampValue(gain.gain, volume, 0.001, now, duration);
  chain(source, filter, gain, audioCtx.destination);
  source.start(now);
  source.stop(now + duration);
}

function playOscillator(startFreq, endFreq, duration, type, volume) {
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  rampValue(osc.frequency, startFreq, endFreq, now, duration);
  rampValue(gain.gain, volume, 0.001, now, duration);
  chain(osc, gain, audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration);
}

function tone(startFreq, endFreq, duration, type, volume) {
  if (audioCtx) playOscillator(startFreq, endFreq, duration, type, volume);
}

function noiseBurst(duration, startFreq, volume) {
  if (audioCtx) playNoise(startFreq, duration, volume);
}

const click = () => tone(660, 990, 0.07, 'square', 0.06);

// Los navegadores solo dejan sonar tras un gesto del usuario
function wakeAudio() {
  startAudio();
  if (audioCtx && audioCtx.state == 'suspended') audioCtx.resume();
}

function updateSound(wind) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const playing = currentScreen == 'play';
  const aim = (param, value, smoothing) => param.setTargetAtTime(value, now, smoothing);
  aim(windGain.gain, min(0.3, wind / 700) * (playing ? 1 : 0.5), 0.1);
  aim(windFilter.frequency, 250 + wind * 3, 0.1);
  const pull = tension / TENSION_LIMIT;
  const creak = playing && pull > 0.5 ? min(0.06, pull * 0.03 + strain * 0.05) : 0;
  aim(creakGain.gain, creak, 0.05);
  aim(creakOsc.frequency, 160 + strain * 500 + pull * 80, 0.05);
}

function paletteColors(paletteIndex) {
  const [, hue, step, saturation] = PALETTES[paletteIndex];
  return [0, 1, 2, 3].map(i => {
    const lightness = 50 + (i % 2) * 14;
    return `hsl(${(hue + i * step) % 360} ${saturation}% ${lightness}%)`;
  });
}

// El barrilete se dibuja una vez en un canvas aparte y luego solo se estampa
function buildKiteSprite() {
  const [shapeIndex, paletteIndex, patternIndex, fringeIndex, tailIndex] = config;
  const sides = SHAPES[shapeIndex][1];
  const isStar = shapeIndex == 3;
  const [, colorStep, twist] = PATTERNS[patternIndex];
  const colors = paletteColors(paletteIndex);
  const image = document.createElement('canvas');
  const screenCtx = ctx;

  const vertex = (radius, i) => {
    const angle = (i * 2 * PI) / sides;
    const spike = isStar && i % 2 ? 0.55 : 1;
    return [radius * spike * cos(angle), radius * spike * sin(angle)];
  };

  image.width = image.height = 144;
  ctx = image.getContext('2d');
  translate(72, 72);
  ctx.lineJoin = 'round';
  [1, 0.76, 0.52, 0.28].forEach((ring, ringIndex) => {
    saveCtx();
    ctx.rotate(((twist * PI) / sides) * ringIndex);
    for (let i = 0; i < sides; i++) {
      const color = colors[(i * colorStep + ringIndex) % 4];
      polygon([0, 0, ...vertex(64 * ring, i), ...vertex(64 * ring, i + 1)], color);
    }
    restoreCtx();
  });
  const outline = Array.from({ length: sides + 1 }, (_, i) => vertex(64, i));
  line(WHITE, 3, ...outline.flat());
  circle(WHITE, 0, 0, 5);
  ctx = screenCtx;

  return { image, colors, sides, isStar, vertex, fringe: [0, 9, 17][fringeIndex], tail: tailIndex };
}

function applyConfig() {
  kiteSprite = buildKiteSprite();
  save('barrilete_cfg', config);
}

function drawKite(x, y, rotation, scale, wind) {
  const { image, colors, sides, isStar, vertex, fringe } = kiteSprite;
  saveCtx();
  translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.drawImage(image, -31.5, -31.5, 63, 63);
  if (fringe) {
    for (let i = 0; i < sides; i++) {
      if (isStar && i % 2) continue;
      const [vx, vy] = vertex(KITE_RADIUS * 0.93, i);
      const angle = (i * 2 * PI) / sides;
      const c = cos(angle);
      const n = sin(angle);
      const sway = sin(clock * 9 + i * 2) * 3 + wind * 0.02;
      polygon(
        [
          vx - n * 3,
          vy + c * 3,
          vx + n * 3,
          vy - c * 3,
          vx + c * fringe - n * sway * 0.5 + sway * 0.6,
          vy + n * fringe + c * sway * 0.5 + fringe * 0.5,
        ],
        colors[i % 4],
      );
    }
  }
  restoreCtx();
}

function updateTail(links, anchorPointX, anchorPointY, wind, dt, count) {
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
    link.x += (wind * 0.45 + sin(clock * 6 + i) * 14) * dt;
    link.y += 60 * dt;
    const dx = link.x - previous.x;
    const dy = link.y - previous.y;
    const dist = hypot(dx, dy) || 1;
    link.x = previous.x + (dx / dist) * 9;
    link.y = previous.y + (dy / dist) * 9;
  }
}

function drawTail(links) {
  if (!kiteSprite.tail || links.length < 2) return;
  line(white(0.7), 1.5, ...links.flatMap(link => [link.x, link.y]));
  links.forEach((link, i) => {
    if (!i) return;
    const previous = links[i - 1];
    const color = kiteSprite.colors[i % 4];
    saveCtx();
    translate(link.x, link.y);
    if (kiteSprite.tail == 3) {
      circle(color, 0, 0, 5);
    } else {
      ctx.rotate(atan2(link.y - previous.y, link.x - previous.x) + sin(clock * 8 + i) * 0.5);
      if (kiteSprite.tail == 1) rect(color, -1, -6, 6, 12);
      else rect(color, -2, -2, 16, 4);
    }
    restoreCtx();
  });
}

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

function drawDoll(x, y, scale, bodyLean, armAngle) {
  const [, , , , , skinIndex, shirtIndex, pantsIndex, hatIndex, hairIndex] = config;
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

// Generador propio para que el fondo salga igual cada vez que se redimensiona
function seededRandom(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

function drawSky(rnd) {
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  [[0, '#0f0a2c'], [0.4, '#4a2480'], [0.72, '#c93f6e'], [1, '#ffb35c']].forEach(stop => {
    sky.addColorStop(...stop);
  });
  rect(sky, 0, 0, width, height);
  for (let i = 0; i < 70; i++) {
    setAlpha(rnd() * 0.7);
    rect(WHITE, rnd() * width, rnd() * groundY * 0.6, 1.5, 1.5);
  }
  setAlpha(0.15);
  circle('#fe9', width * 0.82, 90, 44);
  setAlpha(1);
  circle('#ffe', width * 0.82, 90, 24);
}

function drawVolcano(rnd, centerPx, peakHeight, halfBase, color, ridge) {
  const left = [centerPx - halfBase, groundY];
  const right = [centerPx + halfBase, groundY];
  for (let i = 1; i < 10; i++) {
    const u = i / 10;
    const slopeY = () => groundY - peakHeight * u ** 1.6 * (1 + (rnd() - 0.5) * 0.04);
    left.push(centerPx - halfBase * (1 - u), slopeY());
    right.unshift(centerPx + halfBase * (1 - u), slopeY());
  }
  const top = groundY - peakHeight;
  polygon([...left, centerPx - 8, top, centerPx + 8, top, ...right], color);
  if (ridge) {
    polygon(
      [
        centerPx + halfBase * 0.5,
        groundY,
        centerPx + halfBase * 0.62,
        groundY - peakHeight * 0.78,
        centerPx + halfBase * 0.7,
        groundY - peakHeight * 0.75,
        centerPx + halfBase * 1.4,
        groundY,
      ],
      color,
    );
  }
}

function drawGraveyardBlock(rnd, x, base, lights) {
  const stoneHeight = 14 + rnd() * 16;
  rect(DARK, x + 7, base - stoneHeight, 4, stoneHeight);
  rect(DARK, x + 2, base - stoneHeight + 5, 14, 4);
  if (rnd() < 0.7) lights.push([x + 4, base - 3, '#f91'], [x + 12, base - 2, '#fb3']);
}

function drawChurch(x, base, w, h) {
  rect(DARK, x + w * 0.3, base - h - 34, w * 0.4, 34);
  polygon([x + w * 0.3, base - h - 34, x + w / 2, base - h - 50, x + w * 0.7, base - h - 34], DARK);
  rect(DARK, x + w / 2 - 1, base - h - 62, 2, 12);
  rect(DARK, x + w / 2 - 5, base - h - 58, 10, 2);
}

function drawRoof(x, base, w, h) {
  polygon([x - 3, base - h, x + w / 2, base - h - 14, x + w + 3, base - h], DARK);
}

// Casas, iglesias y un cementerio; las ventanas se pintan al final para que queden encima
function drawTown(rnd) {
  const lights = [];
  const base = groundY + 1;
  for (let x = -10; x < width; ) {
    const kind = rnd();
    const w = 26 + rnd() * 28;
    const h = 18 + rnd() * 26;
    if (x > width * 0.62 && x < width * 0.9) {
      for (let i = 0; i < 3 && x < width * 0.9; i++, x += 22) {
        drawGraveyardBlock(rnd, x, base, lights);
      }
      continue;
    }
    rect(DARK, x, base - h, w, h);
    if (kind < 0.45) drawRoof(x, base, w, h);
    else if (kind < 0.55) drawChurch(x, base, w, h);
    for (let i = 0; i < 2; i++) {
      if (rnd() < 0.5) {
        lights.push([x + 4 + rnd() * (w - 10), base - h + 4 + rnd() * (h - 10), '#fc6']);
      }
    }
    x += w + 4 + rnd() * 10;
  }
  lights.forEach(([x, y, color]) => rect(color, x, y, 3, 3));
}

function drawBackground() {
  const screenCtx = ctx;
  const rnd = seededRandom(7);
  ctx = background.getContext('2d');
  ctx.setTransform(background.width / width, 0, 0, background.width / width, 0, 0);
  drawSky(rnd);
  drawVolcano(rnd, width * 0.74, 240, 300, '#3a1a5a');
  drawVolcano(rnd, width * 0.16, 200, 260, '#2b1248', true);
  bonfire = { x: width * 0.16 + 260 * 0.66, y: groundY - 200 * 0.77 + 2 };
  const hills = [0, groundY];
  for (let x = 0; x <= width; x += 40) {
    hills.push(x, groundY - 40 - 30 * sin(x * 0.01) - rnd() * 14);
  }
  polygon([...hills, width, groundY], '#1d0d33');
  rect(DARK, 0, groundY, width, height - groundY);
  drawTown(rnd);
  for (let x = width * 0.05; x < width; x += width * 0.3) {
    line(DARK, 2, x, groundY, x, groundY - 78);
    rect(DARK, x - 9, groundY - 76, 18, 2);
  }
  ctx = screenCtx;
}

function resize() {
  const dpr = min(2, devicePixelRatio || 1);
  const innerW = innerWidth;
  const innerH = innerHeight;
  const scale = min(innerH / 600, innerW / 400);
  canvas.width = innerW * dpr;
  canvas.height = innerH * dpr;
  width = innerW / scale;
  height = innerH / scale;
  pixelScale = dpr * scale;
  viewScale = scale;
  groundY = height - 70;
  anchorX = width * (width < 600 ? 0.2 : 0.3);
  anchorY = groundY - 24;
  ropeMax = min(0.8 * groundY, 0.9 * (width - anchorX));
  centerX = width / 2;
  contentWidth = min(width - 24, 440);
  offsetY = max(0, (height - 600) * 0.3);
  background = document.createElement('canvas');
  background.width = canvas.width;
  background.height = canvas.height;
  drawBackground();
}

function resetGame() {
  kite = { x: anchorX + 130, y: groundY - 190, vx: 60, vy: 0 };
  ropeLength = 210;
  ropeSpeed = 0;
  tension = 0;
  strain = 0;
  score = 0;
  combo = 1;
  comboTimer = 0;
  papersCaught = 0;
  threadCut = false;
  lifeline = 1;
  invulnerable = 0;
  tilt = 0;
  papers = [];
  rivals = [];
  gusts = [];
  particles = [];
  popups = [];
  playTime = 0;
  nextGust = 1;
  nextRival = FIRST_RIVAL_SECONDS;
  nextPaper = 2;
  nextEvent = FIRST_EVENT_SECONDS;
  windEvent = null;
  eventWindScale = 1;
  tail = [];
  overTime = 0;
  shake = 0;
  pressStart = -9;
  rivalDanger = false;
  tapQueued = false;
}

// Nace en un punto que el hilo alcanza y que cabe en pantalla
function spawnPaper() {
  for (let tries = 0; tries < 20; tries++) {
    const radius = MIN_ROPE + 50 + random() * (ropeMax - MIN_ROPE - 80);
    const angle = 0.27 + random() * 0.8;
    const x = anchorX + radius * cos(angle);
    const y = anchorY - radius * sin(angle);
    if (x < width - 30 && y > 50) {
      const life = 10 - difficulty() * 4;
      papers.push({
        x,
        y,
        homeX: x,
        homeY: y,
        driftX: 0,
        driftY: 0,
        vx: 0,
        life,
        maxLife: life,
        color: kiteSprite.colors[(random() * 4) | 0],
        phase: random() * 6,
      });
      return;
    }
  }
}

function burstParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (random() - 0.5) * 260,
      vy: (random() - 0.5) * 260 - 40,
      life: 0.8,
      color,
    });
  }
}

function showPopup(x, y, label, color, size) {
  popups.push({ x, y, label, color, size: size || 18, life: 1.1 });
}

function goTo(screenName) {
  currentScreen = screenName;
  transition = 1;
  focusIndex = 0;
  menuItems = [];
  if (screenName == 'menu') resetGame();
}

function finishHints() {
  hintStage = 3;
  hasPlayed = true;
  save('barrilete_seen', true);
}

function tug() {
  jerkCooldownEnd = clock + 0.9;
  kite.vy -= 140;
  if (!threadCut) ropeLength = max(MIN_ROPE, ropeLength - 20);
  shake = max(shake, 0.12);
  noiseBurst(0.12, 6000, 0.12);
  tone(300, 900, 0.1, 'triangle', 0.14);
  showPopup(kite.x, kite.y - 44, '¡Tirón!', WHITE, 14);
  for (let i = 0; i < 14; i++) {
    const angle = (i * PI) / 7;
    particles.push({
      x: kite.x,
      y: kite.y,
      vx: cos(angle) * 170,
      vy: sin(angle) * 170 - 60,
      life: 0.35,
      color: WHITE,
    });
  }
  if (hintStage == 2) finishHints();
}

// Salvavidas: perdona un fallo y se recarga con el tiempo, para que los
// primeros descuidos sirvan de aprendizaje
function useLifeline(threadBroke) {
  lifeline = 0;
  invulnerable = INVULNERABLE_SECONDS;
  strain = 0;
  combo = 1;
  shake = 0.4;
  tone(400, 1200, 0.3, 'triangle', 0.25);
  if (threadBroke) {
    kite.vx *= 0.5;
  } else {
    kite.y = groundY - 70;
    kite.vy = -260;
  }
  showPopup(kite.x, kite.y - 50, '¡SALVADO!', '#6f8', 17);
}

function rankFor(points) {
  if (practice || points <= 0) return 0;
  const last = topScores[topScores.length - 1];
  if (topScores.length < TOP_SIZE || points > last.s) {
    return 1 + topScores.filter(entry => entry.s >= points).length;
  }
  return 0;
}

function die(reason, threadBroke) {
  if (lifeline >= 1 && !invulnerable) {
    useLifeline(threadBroke);
    return;
  }
  goTo('over');
  overTime = 0;
  cause = reason;
  threadCut = threadBroke;
  shake = 0.6;
  windEvent = null;
  rank = rankFor(score | 0);
  if (threadBroke) {
    tone(1800, 200, 0.25, 'sine', 0.25);
    noiseBurst(0.3, 6000, 0.3);
  } else {
    noiseBurst(0.6, 1500, 0.5);
  }
  burstParticles(kite.x, kite.y, WHITE, 18);
}

function bumpIntoRival(rival) {
  const dx = kite.x - rival.x;
  const dy = kite.y - rival.currentY;
  const dist = hypot(dx, dy) || 1;
  kite.vx += (dx / dist) * 200;
  kite.vy += (dy / dist) * 200;
  combo = 1;
  comboTimer = 0;
  shake = 0.4;
  noiseBurst(0.2, 3000, 0.3);
  showPopup(kite.x, kite.y - 44, '¡Choque!', '#f85');
  burstParticles(rival.x, rival.currentY, '#e22', 10);
}

// Un toque corto pide el tirón; mantener más de TAP_SECONDS cuenta como jalar
function updateControls() {
  if (tapQueued) {
    tapQueued = false;
    if (clock > jerkCooldownEnd) tug();
  }
  if (held && !holdSustained && clock - pressStart >= TAP_SECONDS) {
    holdSustained = true;
    tone(200, 330, 0.16, 'sine', 0.12);
    if (hintStage == 0) hintStage = 1;
  }
  if (hintStage == 1 && !held) {
    hintStage = 2;
    hintTimer = clock;
  }
  if (hintStage == 2 && clock - hintTimer > 9) finishHints();
}

function updateWindEvent(dt) {
  if (!windEvent && (nextEvent -= dt) < 0) {
    windEvent = { kind: (random() * 3) | 0, active: false, timer: 3 };
    tone(220, 180, 0.5, 'sawtooth', 0.12);
  }
  if (windEvent && (windEvent.timer -= dt) < 0) {
    if (windEvent.active) {
      windEvent = null;
      nextEvent = 16 + random() * 10;
    } else {
      windEvent.active = true;
      windEvent.timer = 8;
      tone(110, 70, 0.9, 'sawtooth', 0.2);
      shake = 0.3;
    }
  }
}

function targetEventWindScale() {
  if (!windEvent || !windEvent.active) return 1;
  return [1.5, 0.68, 1 + 0.4 * sin(clock * 5.2)][windEvent.kind];
}

// Las ráfagas entran por la izquierda y avanzan hacia el barrilete para dar aviso
function updateGusts(dt, diff) {
  if ((nextGust -= dt) < 0) {
    nextGust = max(1.6, 4.5 - 2.8 * diff) * (0.6 + random() * 0.8);
    const isLull = random() < 0.3;
    const gustWidth = 80 + random() * 80;
    const strength = isLull
      ? -(0.15 + 0.4 * random() * min(1, playTime / 90)) * baseWind()
      : (60 + random() * (60 + 190 * diff)) * min(1, 0.5 + playTime / 60);
    const streakHeights = Array.from({ length: 9 }, random);
    gusts.push({ x: -120, width: gustWidth, strength, streakHeights });
  }
  gusts.forEach(gust => (gust.x += GUST_SPEED * dt));
  gusts = gusts.filter(gust => gust.x < width + 200);
}

// Devuelve la tensión radial: lo que el hilo frena al barrilete en este paso
function applyTether(dt) {
  if (threadCut) return 0;
  const dx = kite.x - anchorX;
  const dy = kite.y - anchorY;
  const dist = hypot(dx, dy);
  if (dist <= ropeLength) return 0;
  const nx = dx / dist;
  const ny = dy / dist;
  const radialSpeed = kite.vx * nx + kite.vy * ny;
  kite.x = anchorX + nx * ropeLength;
  kite.y = anchorY + ny * ropeLength;
  if (radialSpeed <= ropeSpeed) return 0;
  kite.vx -= nx * (radialSpeed - ropeSpeed);
  kite.vy -= ny * (radialSpeed - ropeSpeed);
  return (radialSpeed - ropeSpeed) / dt;
}

function moveKite(dt, holding, wind) {
  const pitch = holding ? 1 : 0.28;
  const relativeWind = wind - kite.vx;
  kite.vx += 2.2 * relativeWind * dt;
  kite.vy += (GRAVITY - 1.2 * kite.vy - 0.047 * pitch * wind * wind) * dt;
  kite.x += kite.vx * dt;
  kite.y += kite.vy * dt;
  return applyTether(dt);
}

function keepKiteInBounds(playing) {
  if (kite.x < 12) {
    kite.x = 12;
    kite.vx = abs(kite.vx) * 0.3;
  }
  if (kite.x > width - 12) {
    kite.x = width - 12;
    kite.vx = -abs(kite.vx) * 0.3;
  }
  if (kite.y > groundY - 22) {
    kite.y = groundY - 22;
    kite.vy = 0;
    kite.vx *= 0.9;
    if (!playing) return;
    if (invulnerable) kite.vy = -230;
    else die('Cayó el barrilete', false);
  }
}

// En el menú el barrilete flota abajo a la derecha, lejos de los botones
function floatKiteForMenu() {
  const angle = 0.1 + 0.04 * sin(clock * 0.8);
  kite.x = anchorX + 0.9 * ropeMax * cos(angle);
  kite.y = anchorY - 0.9 * ropeMax * sin(angle);
  kite.vx = 0;
  kite.vy = 0;
  ropeLength = 0.9 * ropeMax;
}

// El hilo se desgasta mientras la tensión pasa el límite y se recupera si afloja
function nextStrain(dt) {
  if (invulnerable) return 0;
  if (tension > TENSION_LIMIT) return strain + (tension / TENSION_LIMIT - 1) * dt * 1.4;
  return max(0, strain - dt);
}

function updateEffects(dt) {
  while (windStreaks.length < 70) {
    windStreaks.push({ x: random() * width, y: random() * groundY, phase: random() * 6 });
  }
  for (const streak of windStreaks) {
    streak.x += windAt(streak.x) * dt * 0.9;
    streak.y += sin(clock * 0.7 + streak.phase) * 8 * dt;
    if (streak.x > width + 30) {
      streak.x = -30;
      streak.y = random() * groundY;
    }
  }
  particles.forEach(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 300 * dt;
    p.life -= dt;
  });
  particles = particles.filter(p => p.life > 0);
  popups.forEach(p => {
    p.y -= 36 * dt;
    p.life -= dt;
  });
  popups = popups.filter(p => p.life > 0);
}

function catchPaper(paper) {
  paper.life = -1;
  combo = comboTimer > 0 ? min(combo + 1, 8) : 1;
  comboTimer = 5;
  papersCaught++;
  const points = Math.round(10 * combo * multiplier);
  score += points;
  shake = max(shake, 0.1);
  tone(520 * 1.12 ** combo, 1040 * 1.12 ** combo, 0.18, 'sine', 0.25);
  burstParticles(paper.x, paper.y, paper.color, 14);
  showPopup(paper.x, paper.y - 20, `+${points}`, YELLOW, 20 + combo * 2);
  if (combo > 1) showPopup(paper.x, paper.y - 48, `combo ×${combo}`, WHITE, 13);
}

// El papel se deja llevar: la calma lo frena y la ráfaga lo empuja y lo eleva.
// Se limita a lo que el hilo alcanza para que siempre se pueda atrapar.
function updatePaper(paper, dt) {
  const wind = windAt(paper.x);
  const previousX = paper.x;
  const driftTarget = 0.65 * max(0, wind - 40);
  paper.driftX = ease(paper.driftX, driftTarget, driftTarget > paper.driftX ? 2.2 : 0.7, dt);
  paper.driftY = ease(paper.driftY, clamp((120 - wind) * 0.1, -30, 30), 2.2, dt);
  paper.x = min(paper.homeX + paper.driftX + 6 * sin(clock * 1.3 + paper.phase), width - 30);
  const flutter = (3 + wind / 60) * sin(clock * 2 + paper.phase);
  paper.y = clamp(paper.homeY + paper.driftY + flutter, 50, groundY - 60);
  const reach = hypot(paper.x - anchorX, paper.y - anchorY);
  const maxReach = ropeMax - 12;
  if (reach > maxReach) {
    paper.x = anchorX + ((paper.x - anchorX) * maxReach) / reach;
    paper.y = anchorY + ((paper.y - anchorY) * maxReach) / reach;
  }
  paper.vx = ease(paper.vx, (paper.x - previousX) / dt, 8, dt);
}

function updatePapers(dt, diff) {
  if ((nextPaper -= dt) < 0 && papers.length < (diff > 0.5 ? 3 : 2)) {
    nextPaper = 1.2 + random() * 1.5;
    spawnPaper();
  }
  for (const paper of papers) {
    paper.life -= dt;
    updatePaper(paper, dt);
    if (hypot(kite.x - paper.x, kite.y - paper.y) < KITE_RADIUS + 14) catchPaper(paper);
    else if (paper.life < 0) combo = 1;
  }
  papers = papers.filter(paper => paper.life >= 0);
}

function spawnRivals(dt, diff) {
  if (playTime <= FIRST_RIVAL_SECONDS || practice || (nextRival -= dt) >= 0) return;
  nextRival = max(3.2, 8 - 4.8 * diff) * (0.7 + random() * 0.6);
  const count = diff > 0.55 && random() < 0.5 ? 2 : 1;
  for (let i = 0; i < count; i++) {
    rivals.push({
      x: width + 260 + i * 190,
      y: clamp(kite.y + (random() - 0.5) * (300 + 200 * diff), 90, groundY - 110),
      speed: -(75 + 70 * diff + random() * 30),
      phase: random() * 6,
    });
  }
}

// Un rival corta el hilo solo si lo cruza dentro del tramo vulnerable, cerca del
// barrilete: así siempre se puede esquivar subiendo o bajando
function updateRivals(dt, diff) {
  const bx = kite.x - sin(tilt) * KITE_RADIUS * 0.9;
  const by = kite.y + KITE_RADIUS * 0.9;
  const handX = anchorX + 6;
  const handY = anchorY;
  const threadLength = hypot(handX - bx, handY - by) || 1;
  const ux = (handX - bx) / threadLength;
  const uy = (handY - by) / threadLength;
  const vulnerable = min(70 + 60 * diff, threadLength);
  rivalDanger = false;
  for (const rival of rivals) {
    rival.x += rival.speed * dt;
    rival.currentY = rival.y + 35 * sin(rival.phase + clock * 1.7);
    const qx = rival.x - bx;
    const qy = rival.currentY - by;
    const along = qx * ux + qy * uy;
    const side = ux * qy - uy * qx;
    if (rival.side * side < 0 && along > 0 && along < vulnerable && !threadCut && !invulnerable) {
      die('Te cortaron el hilo', true);
      break;
    }
    rival.side = side;
    const near = rival.x > bx - 30 && rival.x < bx + 380;
    if (near && rival.currentY > by - 45 && rival.currentY < by + uy * vulnerable + 45) {
      rivalDanger = true;
    }
    if (!rival.bumped && hypot(kite.x - rival.x, kite.y - rival.currentY) < KITE_RADIUS + 16) {
      rival.bumped = true;
      bumpIntoRival(rival);
    }
  }
  rivals = rivals.filter(rival => rival.x > -80);
}

function warnNearGround(dt) {
  if (kite.y > groundY - 95 && (groundWarnTimer -= dt) < 0) {
    groundWarnTimer = 0.35;
    tone(240, 200, 0.1, 'square', 0.1);
  }
}

// Paso fijo de simulación; `playing` se fija al inicio aunque el paso termine la partida
function update(dt) {
  clock += dt;
  const playing = currentScreen == 'play';
  if (playing) playTime += dt;
  invulnerable = max(0, invulnerable - dt);
  if (playing && !invulnerable && lifeline < 1) {
    lifeline = min(1, lifeline + dt / LIFELINE_RECHARGE);
  }
  const diff = difficulty();
  // Fuera de la partida el barrilete se sostiene solo si está bajo, para no caer tras el menú
  const holding = playing ? held : currentScreen == 'over' ? false : kite.y > groundY - 260;

  if (playing) updateControls();
  if (playing && !practice) updateWindEvent(dt);
  eventWindScale = ease(eventWindScale, targetEventWindScale(), 6, dt);
  updateGusts(dt, diff);

  ropeSpeed = ease(ropeSpeed, threadCut ? 0 : holding ? -40 : 130, 6, dt);
  ropeLength = clamp(ropeLength + ropeSpeed * dt, MIN_ROPE, ropeMax);
  const wind = windAt(kite.x);
  const pulled = moveKite(dt, holding, wind);
  keepKiteInBounds(playing);
  if (currentScreen == 'menu') floatKiteForMenu();
  tension = ease(tension, pulled, 10, dt);
  if (playing) {
    strain = nextStrain(dt);
    if (strain >= 1) die('Se reventó el hilo', true);
  } else if (currentScreen == 'over' || currentScreen == 'name') {
    strain = max(0, strain - dt);
  }
  tilt = ease(tilt, holding ? -0.35 : 0.25, 5, dt);
  lean = ease(lean, holding ? -0.14 : 0.04, 6, dt);

  const rotation = tilt + (0.12 * sin(clock * 3.1) * wind) / 150;
  const tailLinks = kiteSprite.tail ? 6 + min(8, papersCaught) : 0;
  updateTail(
    tail,
    kite.x - sin(rotation) * KITE_RADIUS,
    kite.y + cos(rotation) * KITE_RADIUS,
    wind,
    dt,
    tailLinks,
  );
  updateEffects(dt);
  if (!playing) {
    updateSound(wind);
    return;
  }

  const edgeBonus = tension > TENSION_LIMIT * 0.6 ? 1.5 : 1;
  const eventBonus = windEvent && windEvent.active ? 2 : 1;
  multiplier = (1 + 1.5 * altitudeFactor(kite.y)) * edgeBonus * eventBonus;
  score += dt * 3 * multiplier;
  warnNearGround(dt);
  if (comboTimer > 0 && (comboTimer -= dt) <= 0) combo = 1;
  updatePapers(dt, diff);
  spawnRivals(dt, diff);
  updateRivals(dt, diff);
  updateSound(wind);
}

function drawPaperShape(color, flutter = 0) {
  const outline = [-16, -10, 16, -10, 16, 10];
  for (let i = 0; i < 6; i++) {
    outline.push(16 - i * 6.4 - 3.2, 10 - (i % 2 ? 0 : 5) + sin(clock * 9 + i * 1.7) * flutter);
  }
  polygon([...outline, -16, 10], color);
  rect(white(0.55), -16, -10, 32, 3);
}

function drawBonfireSmoke() {
  for (let i = 0; i < 7; i++) {
    const u = (clock * 0.08 + i / 7) % 1;
    setAlpha(0.22 * (1 - u));
    circle('#8a7a9a', bonfire.x + u * 90 + sin(i * 3) * 5, bonfire.y - u * 140, 6 + u * 22);
  }
  setAlpha(0.5 + 0.3 * sin(clock * 5));
  circle('#f62', bonfire.x, bonfire.y, 4);
  setAlpha(1);
}

function drawWind() {
  ctx.lineCap = 'round';
  for (const streak of windStreaks) {
    const wind = windAt(streak.x);
    line(white(0.08 + wind / 900), 1.5, streak.x, streak.y, streak.x - 6 - wind * 0.12, streak.y);
  }
  for (const gust of gusts) {
    const strong = min(1, abs(gust.strength) / 200);
    const isGust = gust.strength > 0;
    const tint = rgba(isGust ? '255,255,255' : '90,140,255', 0.03 + 0.05 * strong);
    rect(tint, gust.x - gust.width * 1.3, 0, gust.width * 2.6, groundY);
    rect(tint, gust.x - gust.width * 0.6, 0, gust.width * 1.2, groundY);
    ctx.setLineDash(isGust ? [] : [6, 10]);
    gust.streakHeights.forEach((h, i) => {
      const y = h * groundY * 0.9 + 10;
      const x = gust.x + (i % 3 - 1) * gust.width * 0.4;
      const color = isGust ? white(0.35 + 0.4 * strong) : 'rgba(120,170,255,.5)';
      line(color, 2, x - abs(gust.strength) * 0.35, y, x, y);
    });
  }
  ctx.setLineDash([]);
}

function drawPapers() {
  for (const paper of papers) {
    const remaining = paper.life / paper.maxLife;
    const wind = windAt(paper.x);
    saveCtx();
    translate(paper.x, paper.y);
    for (let i = 1; i < 4; i++) {
      setAlpha(0.3 / i);
      circle(paper.color, -paper.vx * 0.12 * i, 0, 6);
    }
    setAlpha(1);
    ctx.rotate(sin(clock * 1.5 + paper.phase) * 0.3 + (wind / 700) * sin(clock * 9 + paper.phase));
    ctx.transform(1, 0, (sin(clock * 6 + paper.phase) * wind) / 1200, 1, 0, 0);
    const expiring = rgba('255,120,120', 0.5 + 0.5 * sin(clock * 14));
    const ringColor = remaining < 0.3 ? expiring : white(0.6);
    strokeArc(ringColor, 2, 0, 0, 30, -PI / 2, -PI / 2 + 2 * PI * remaining);
    drawPaperShape(paper.color, wind / 80);
    restoreCtx();
  }
}

function drawRivalKite() {
  polygon([0, -26, 18, 0, 0, 26, -18, 0], '#103');
  polygon([0, -26, 18, 0, 0, 0], '#e22');
  polygon([0, 26, -18, 0, 0, 0], '#e22');
  line(WHITE, 1.5, 0, -26, 18, 0, 0, 26, -18, 0, 0, -26);
  for (let i = 1; i < 5; i++) {
    rect(i % 2 ? '#e22' : '#222', sin(clock * 8 + i) * 3 - 3, 26 + i * 7, 6, 5);
  }
}

function drawRivals() {
  for (const rival of rivals) {
    const y = rival.currentY ?? rival.y;
    if (rival.x > width - 10) {
      const alert = rgba('255,60,60', 0.5 + 0.5 * sin(clock * 12));
      polygon([width - 8, y, width - 30, y - 14, width - 30, y + 14], alert);
      text('!', width - 42, y + 8, 22, RED);
    }
    line(white(0.35), 1, rival.x, y, rival.x + 60, groundY);
    saveCtx();
    translate(rival.x, y);
    ctx.rotate(sin(clock * 3 + rival.phase) * 0.2);
    drawRivalKite();
    restoreCtx();
  }
}

function strokeCurve(color, lineWidth, fromX, fromY, controlX, controlY, toX, toY) {
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.quadraticCurveTo(controlX, controlY, toX, toY);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawThread(bx, by, handX, handY) {
  if (threadCut) {
    const controlX = bx - kite.vx * 0.1;
    const controlY = by - kite.vy * 0.1 - 20;
    const endX = bx - kite.vx * 0.25;
    const endY = by - kite.vy * 0.25 - 50;
    strokeCurve(white(0.7), 1.5, bx, by, controlX, controlY, endX, endY);
    return;
  }
  const dist = hypot(bx - handX, by - handY);
  const slack = max(0, ropeLength - dist);
  const worn = min(1, strain);
  const green = (255 - worn * 200) | 0;
  const blue = (255 - worn * 220) | 0;
  const color = worn > 0.05 ? `rgb(255,${green},${blue})` : white(0.85);
  const sag = (handY + by) / 2 + 4 + slack * 0.9;
  strokeCurve(color, 1.6 + worn * 1.5, handX, handY, (handX + bx) / 2, sag, bx, by);
  if (currentScreen == 'play' && rivals.length) {
    const share = min(70 + 60 * difficulty(), dist) / dist;
    const alert = rgba('255,60,60', 0.6 + 0.4 * sin(clock * 16));
    const danger = rivalDanger ? alert : 'rgba(255,225,120,.4)';
    line(danger, 4, bx, by, bx + (handX - bx) * share, by + (handY - by) * share);
  }
}

function drawKiteAndThread() {
  const bx = kite.x - sin(tilt) * KITE_RADIUS * 0.9;
  const by = kite.y + KITE_RADIUS * 0.9;
  const armAngle = atan2(by - anchorY, bx - anchorX);
  const bodyLean = lean + 0.02 * sin(clock * 2);
  const [handX, handY] = drawDoll(anchorX, groundY + 4, 1.25, bodyLean, armAngle);
  if (['custom', 'help', 'scores'].includes(currentScreen)) return;
  drawThread(bx, by, handX, handY);
  drawTail(tail);
  const wind = windAt(kite.x);
  const blinkOn = Math.floor(clock * 14) % 2 == 1;
  if (!invulnerable || blinkOn) {
    drawKite(kite.x, kite.y, tilt + (0.12 * sin(clock * 3.1) * wind) / 150, 1, wind);
  }
}

function drawTapRing() {
  if (currentScreen != 'play' || !held) return;
  const progress = (clock - pressStart) / TAP_SECONDS;
  const color = progress < 1 ? YELLOW : 'rgba(111,224,138,.75)';
  const end = -PI / 2 + 2 * PI * clamp(progress, 0, 1);
  strokeArc(color, 3, kite.x, kite.y, KITE_RADIUS + 9, -PI / 2, end);
}

function drawScene() {
  drawBonfireSmoke();
  drawWind();
  drawPapers();
  drawRivals();
  drawKiteAndThread();
  drawTapRing();
  for (const p of particles) {
    setAlpha(min(1, p.life * 2));
    rect(p.color, p.x - 2, p.y - 2, 4, 4);
  }
  for (const p of popups) {
    setAlpha(min(1, p.life * 2));
    text(p.label, p.x, p.y, p.size, p.color);
  }
  setAlpha(1);
  if (strain > 0.3) {
    const pulse = (strain - 0.3) * 0.25 * (0.6 + 0.4 * sin(clock * 20));
    rect(rgba('255,0,0', pulse), 0, 0, width, height);
  }
}

function drawButtonIcon(x, y, pressed) {
  circle(pressed ? YELLOW : white(0.18), x, y, 10);
  strokeArc(WHITE, 2, x, y, 10);
  if (pressed) strokeArc('rgba(255,213,74,.6)', 2, x, y, 16);
}

const textLeft = (str, y, size, color) => text(str, 16, y, size, color, 'left');
const textRight = (str, y, size, color) => text(str, width - 16, y, size, color, 'right');
const bestScore = () => max(topScores[0] ? topScores[0].s : 0, score | 0);

function drawScorePanel() {
  textLeft('PUNTOS', 24, 11, white(0.65));
  textLeft(score | 0, 58, 36, WHITE);
  text(`Mejor ${bestScore()}`, 16, 78, 13, white(0.65), 'left', 400);
  let y = 104;
  if (combo > 1) {
    textLeft(`COMBO ×${combo}`, y, 18, YELLOW);
    rect(white(0.25), 16, y + 6, 96, 4);
    rect(YELLOW, 16, y + 6, 96 * clamp(comboTimer / 5, 0, 1), 4);
    y += 30;
  }
  if (lifeline >= 1) {
    textLeft('♥ SALVAVIDAS', y, 12, '#6f8');
  } else {
    const secondsLeft = ((1 - lifeline) * LIFELINE_RECHARGE + 1) | 0;
    textLeft(`♡ salvavidas ${secondsLeft} s`, y, 12, white(0.55));
  }
  y += 16;
  textLeft(`ALTURA ×${(1 + 1.5 * altitudeFactor(kite.y)).toFixed(1)}`, y, 12, '#8df');
  if (tension > TENSION_LIMIT * 0.6) textLeft('AL FILO ×1.5', y + 16, 12, '#f95');
  if (windEvent && windEvent.active) textLeft('EVENTO ×2', y + 32, 12, YELLOW);
}

function drawMeters() {
  const barWidth = 150;
  const x = width - barWidth - 16;
  const pull = min(1.2, tension / TENSION_LIMIT);
  const wind = windAt(kite.x);
  textRight('TENSIÓN DEL HILO', 22, 11, white(0.75));
  rect('rgba(0,0,0,.45)', x, 28, barWidth, 10);
  rect(pull < 0.6 ? GREEN : pull < 1 ? YELLOW : '#f44', x, 28, (barWidth * pull) / 1.2, 10);
  rect(WHITE, x + barWidth / 1.2, 25, 2, 16);
  textRight('VIENTO', 58, 11, white(0.75));
  rect('rgba(0,0,0,.45)', x, 64, barWidth, 8);
  rect('#bdf', x, 64, barWidth * min(1, wind / 450), 8);
}

function drawGustWarning() {
  let eta = 9;
  let incoming;
  for (const gust of gusts) {
    const arrival = (kite.x - gust.x) / GUST_SPEED;
    if (gust.x < kite.x && abs(gust.strength) > 40 && arrival < eta) {
      eta = arrival;
      incoming = gust;
    }
  }
  if (!incoming || eta >= 4) return;
  const label = incoming.strength > 0 ? 'RÁFAGA' : 'CALMA';
  textRight(`${label} en ${eta.toFixed(1)}s`, 92, 13, incoming.strength > 0 ? WHITE : '#8bf');
}

function drawEventBanner() {
  if (!windEvent) return;
  const [title, advice] = WIND_EVENTS[windEvent.kind];
  const size = min(34, width / 11);
  const y = height * 0.13;
  text(windEvent.active ? title : `¡VIENE ${title}!`, centerX, y, size, YELLOW, 'center', 800);
  text(windEvent.active ? advice : 'Prepárate…', centerX, y + 24, 15, WHITE);
}

function drawHint() {
  const label = HINTS[hintStage];
  const size = min(20, width / 19);
  ctx.font = `700 ${size}px system-ui,sans-serif`;
  const boxWidth = ctx.measureText(label).width + 40;
  const y = height * 0.22;
  const boxX = centerX - boxWidth / 2;
  roundedRect(boxX, y - size - 6, boxWidth, size * 2 + 4, size, 'rgba(8,4,24,.72)');
  text(label, centerX, y, size, [GREEN, '#f88', YELLOW][hintStage]);
  drawButtonIcon(centerX, y + size * 1.8, hintStage != 1);
}

function drawHud() {
  drawScorePanel();
  drawMeters();
  drawGustWarning();
  drawEventBanner();
  if (practice) text('PRÁCTICA · sin rivales', centerX, height * 0.06, 13, '#8df');
  if (hintStage < 3 && currentScreen == 'play') drawHint();
  const nearGround = kite.y > groundY - 95 && (clock * 4) % 1 < 0.6;
  if (currentScreen == 'play' && nearGround) text('¡JALA!', kite.x, kite.y - 50, 24, '#f44');
}

// options: isRow (‹ ›), isStepper (▲ ▼), onEnter (acción propia de Enter)
function addItem(x, y, w, h, action, options) {
  menuItems.push({ x, y, w, h, action, ...options });
  return focusIndex == menuItems.length - 1;
}

function button(label, y, action, primary, w, x, h) {
  w = w || min(contentWidth * 0.8, 320);
  x = x ?? centerX - w / 2;
  h = h || 46;
  const focused = addItem(x, y, w, h, action);
  const fill = focused ? YELLOW : primary ? 'rgba(255,213,74,.25)' : white(0.13);
  roundedRect(x, y, w, h, 14, fill, focused ? WHITE : white(0.25));
  text(label, x + w / 2, y + h / 2 + 7, 19, focused ? '#2a1346' : WHITE);
}

function optionRow(label, value, y, action, swatches) {
  const x = centerX - contentWidth / 2;
  const focused = addItem(x, y, contentWidth, 36, action, { isRow: true });
  roundedRect(x, y, contentWidth, 36, 10, focused ? '#4a3a30' : '#2e2050', focused && YELLOW);
  text(label, x + 14, y + 24, 15, WHITE, 'left');
  if (swatches) {
    swatches.forEach((color, i) => {
      roundedRect(x + 92 + i * 17, y + 10, 14, 16, 3, color, white(0.5));
    });
  }
  text('‹', x + contentWidth * 0.46, y + 27, 26, YELLOW);
  text(value, x + contentWidth * 0.7, y + 24, 15, WHITE);
  text('›', x + contentWidth - 18, y + 27, 26, YELLOW);
}

const heading = (label, y, size) => {
  text(label, centerX, offsetY + y, size || 30, YELLOW, 'center', 800);
};

function startGame(isPractice) {
  resetGame();
  releaseInputs();
  practice = isPractice;
  hintStage = practice || !hasPlayed ? 0 : 3;
  goTo('play');
  click();
}

function drawMenu() {
  heading('BARRILETE', 100 + sin(clock * 1.5) * 3, min(64, width / 6.2));
  text('Sumpango · Todos los Santos', centerX, offsetY + 132, 15, '#fbd', 'center', 500);
  button('Jugar', offsetY + 175, () => startGame(false), true);
  button('Mi barrilete', offsetY + 235, () => goTo('custom'));
  button('Puntuaciones', offsetY + 295, () => {
    highlightRank = -1;
    goTo('scores');
  });
  button('Instrucciones', offsetY + 355, () => {
    helpPage = 0;
    goTo('help');
    focusIndex = 3;
  });
  const record = topScores[0] ? `Récord: ${topScores[0].n} · ${topScores[0].s}` : 'Sin récord';
  text(record, centerX, offsetY + 436, 15, WHITE, 'center', 500);
}

const randomIndex = list => (random() * CUSTOM_LISTS[list].length) | 0;

const stepOption = list => step => {
  const count = CUSTOM_LISTS[list].length;
  config[list] = (config[list] + step + count) % count;
  applyConfig();
  click();
};

function drawKitePreview() {
  const x = centerX + sin(clock) * 8;
  const y = offsetY + 135 + cos(clock * 1.3) * 5;
  const wind = 260 + 60 * sin(clock * 0.9);
  const tailX = x - sin(0.2) * KITE_RADIUS * 1.9;
  const tailY = y + KITE_RADIUS * 1.85;
  updateTail(previewTail, tailX, tailY, wind, 1 / 60, kiteSprite.tail ? 10 : 0);
  saveCtx();
  translate(tailX, tailY);
  ctx.scale(1.6, 1.6);
  translate(-tailX, -tailY);
  drawTail(previewTail);
  restoreCtx();
  drawKite(x, y, sin(clock * 1.3) * 0.2, 1.9, wind);
  const [shape, palette, pattern, fringe, tailStyle] = config;
  return [
    ['Forma', SHAPES[shape][0]],
    ['Paleta', PALETTES[palette][0], paletteColors(palette)],
    ['Patrón', PATTERNS[pattern][0]],
    ['Flecos', FRINGES[fringe]],
    ['Cola', TAILS[tailStyle]],
  ];
}

function drawDollPreview() {
  const [skin, shirt, pants, hat, hair] = config.slice(KITE_OPTIONS);
  const kiteY = offsetY + 110 + sin(clock * 1.2) * 5;
  const lean = 0.04 * sin(clock);
  const hand = drawDoll(centerX - 20, offsetY + 220, 3.6, lean, -0.7 + 0.08 * sin(clock * 1.7));
  drawKite(centerX + 95, kiteY, 0.2, 1, 120);
  line(white(0.8), 1.5, ...hand, centerX + 90, kiteY + 26);
  return [
    ['Piel', `Tono ${skin + 1}`, [SKIN_TONES[skin]]],
    ['Camisa', SHIRTS[shirt][0], SHIRTS[shirt].slice(1)],
    ['Pantalón', PANTS[pants][0], PANTS[pants].slice(1)],
    ['Sombrero', HATS[hat]],
    ['Pelo', HAIRS[hair][0], [HAIRS[hair][1]]],
  ];
}

function drawCustomize() {
  heading('MI BARRILETE', 36, 26);
  const buttonWidth = min(contentWidth / 2 - 6, 170);
  const tabs = [['Barrilete', centerX - buttonWidth - 6], ['Muñeco', centerX + 6]];
  tabs.forEach(([label, x], tab) => {
    const choose = () => {
      customTab = tab;
      focusIndex = 2;
      click();
    };
    button(label, offsetY + 48, choose, customTab == tab, buttonWidth, x, 30);
  });
  const rows = customTab ? drawDollPreview() : drawKitePreview();
  const firstOption = customTab ? KITE_OPTIONS : 0;
  let y = offsetY + 232;
  rows.forEach(([label, value, swatches], i) => {
    optionRow(label, value, y, stepOption(firstOption + i), swatches);
    y += 42;
  });
  y += 10;
  const randomize = () => {
    config = config.map((value, i) => {
      const inActiveTab = Number(i >= KITE_OPTIONS) === customTab;
      return inActiveTab ? randomIndex(i) : value;
    });
    applyConfig();
    click();
  };
  button('Aleatorio', y, randomize, false, buttonWidth, centerX - buttonWidth - 6);
  button('Listo', y, () => goTo('menu'), true, buttonWidth, centerX + 6);
}

function drawScores() {
  heading('PUNTUACIONES', 40, 28);
  const x = centerX - contentWidth / 2;
  roundedRect(x, offsetY + 62, contentWidth, 356, 14, 'rgba(0,0,0,.35)');
  for (let i = 0; i < TOP_SIZE; i++) {
    const entry = topScores[i];
    const y = offsetY + 92 + i * 34;
    const color = i == highlightRank ? YELLOW : entry ? WHITE : white(0.3);
    if (i == highlightRank) rect('rgba(255,213,74,.18)', x + 6, y - 22, contentWidth - 12, 32);
    text(`${i + 1}.`, x + 16, y, 17, color, 'left');
    text(entry ? entry.n : '---', x + 56, y, 17, color, 'left');
    const date = entry ? new Date(entry.d).toLocaleDateString('es') : '';
    text(date, x + contentWidth * 0.55, y, 14, color, 'center', 400);
    text(entry ? entry.s : '—', x + contentWidth - 16, y, 17, color, 'right');
  }
  button('Volver', offsetY + 440, () => goTo('menu'), true);
}

function saveScore() {
  const entry = { n: initials.join(''), s: score | 0, d: Date.now() };
  topScores.push(entry);
  topScores.sort((a, b) => b.s - a.s || a.d - b.d);
  topScores = topScores.slice(0, TOP_SIZE);
  highlightRank = topScores.indexOf(entry);
  save('barrilete_top', topScores);
  save('barrilete_ini', initials.join(''));
  click();
  goTo('scores');
}

function drawGameOver() {
  heading(cause, 150, min(40, width / 11));
  text(`Puntos: ${score | 0}`, centerX, offsetY + 205, 32, WHITE);
  let verdict = `Récord: ${bestScore()}`;
  if (practice) verdict = 'Práctica: no cuenta para el Top 10';
  else if (rank) verdict = `¡Entraste al Top 10, lugar ${rank}!`;
  text(verdict, centerX, offsetY + 238, 18, rank ? YELLOW : '#ddd', 'center', 600);
  if (overTime <= 0.6) return;
  let y = offsetY + 275;
  if (rank) {
    button('Guardar puntaje', y, () => {
      goTo('name');
      click();
    }, true);
    y += 58;
  }
  button('Reintentar', y, () => startGame(practice), !rank);
  button('Menú', y + 58, () => goTo('menu'));
}

function nextLetter(letter, step) {
  return String.fromCharCode(65 + ((letter.charCodeAt(0) - 65 + step + 26) % 26));
}

function drawNameEntry() {
  heading('TUS INICIALES', 100, 28);
  text(`Lugar ${rank} · ${score | 0} puntos`, centerX, offsetY + 140, 18, WHITE, 'center', 500);
  for (let i = 0; i < 3; i++) {
    const x = centerX - 100 + i * 72;
    const y = offsetY + 170;
    const changeLetter = step => {
      initials[i] = nextLetter(initials[i], step);
      click();
    };
    const options = { isStepper: true, onEnter: () => focusIndex++ };
    const focused = addItem(x, y, 64, 100, changeLetter, options);
    const fill = focused ? 'rgba(255,213,74,.25)' : white(0.12);
    roundedRect(x, y, 64, 100, 12, fill, focused && YELLOW);
    text(initials[i], x + 32, y + 66, 52, WHITE);
    text('▲', x + 32, y + 22, 16, YELLOW);
    text('▼', x + 32, y + 94, 16, YELLOW);
  }
  button('Guardar', offsetY + 300, saveScore, true);
  text('Teclea letras o usa ▲ ▼', centerX, offsetY + 372, 13, white(0.7), 'center', 400);
}

function drawPause() {
  heading('PAUSA', 140, 36);
  button('Continuar', offsetY + 200, () => goTo('play'), true);
  button('Menú', offsetY + 260, () => goTo('menu'));
}

const smooth = p => 0.5 - 0.5 * cos(2 * PI * p);
const phase = seconds => (clock % seconds) / seconds;
const bell = (value, center, spread) => exp(-(((value - center) / spread) ** 2));

function drawArrow(x1, y1, x2, y2, color) {
  const angle = atan2(y2 - y1, x2 - x1);
  line(color, 3, x1, y1, x2, y2);
  const head = [x2, y2];
  for (const side of [-0.5, 0.5]) head.push(x2 - 9 * cos(angle + side), y2 - 9 * sin(angle + side));
  polygon(head, color);
}

function drawKidAndKite(x, y, rotation, scale, wind, extra) {
  drawDoll(18, 104, 0.8, 0, -0.8);
  line(WHITE, 2, 26, 80, x - 4, y + extra);
  drawKite(x, y, rotation, scale, wind);
}

function drawGustBand(bandX, rgb, dash) {
  rect(rgba(rgb, 0.12 + 0.1 * bell(bandX, 92, 28)), bandX - 24, 6, 48, 100);
  ctx.setLineDash(dash);
  for (const y of [28, 55, 82]) line(rgba(rgb, 0.8), 2.5, bandX - 24, y, bandX + 10, y);
  ctx.setLineDash([]);
}

function drawGustDiagram(isLull) {
  const bandX = lerp(-35, 150, phase(4));
  const reach = bell(bandX, 92, 28);
  const y = isLull ? lerp(50, 74, reach) : 50;
  drawGustBand(bandX, isLull ? '122,176,255' : '255,255,255', isLull ? [6, 8] : []);
  drawKidAndKite(96, y, isLull ? 0 : reach * 0.5, 0.75, 100, 16);
  setAlpha(reach);
  text(isLull ? '¡JALA!' : '¡SUELTA!', 60, 102, 13, isLull ? GREEN : RED);
  setAlpha(1);
}

function drawControlsDiagram() {
  const on = clock % 1.6 < 0.5;
  roundedRect(11, 24, 22, 36, 10, on && YELLOW, WHITE);
  drawButtonIcon(62, 46, on);
  roundedRect(86, 38, 32, 16, 4, on && YELLOW, WHITE);
  ['Clic', 'Toque', 'Espacio'].forEach((label, i) => text(label, [20, 62, 102][i], 86, 10, WHITE));
}

function drawHoldDiagram() {
  const p = phase(4);
  const s = smooth(p);
  const on = p < 0.5;
  const color = on ? GREEN : RED;
  drawKidAndKite(lerp(100, 66, s), lerp(70, 26, s), lerp(0.3, -0.25, s), 0.75, 100, 16);
  drawButtonIcon(18, 22, on);
  text(on ? 'JALA' : 'SUELTA', 4, 52, 12, color, 'left');
  drawArrow(110, on ? 60 : 30, 110, on ? 30 : 60, color);
}

function drawTapDiagram() {
  const p = phase(3);
  const u = max(0, p - 0.25);
  const rise = u < 0.2 ? sin(((u / 0.2) * PI) / 2) : exp(-(u - 0.2) * 2.5);
  drawKidAndKite(70, 72 - 40 * rise, 0, 0.75, 100, 16);
  drawButtonIcon(18, 22, p > 0.18 && p < 0.25);
  text('TOQUE', 4, 52, 12, YELLOW, 'left');
  if (u > 0 && u < 0.5) {
    setAlpha(1 - u * 2);
    text('¡Tirón!', 92, 20, 13, WHITE);
    setAlpha(1);
  }
}

function drawTensionDiagram() {
  const p = phase(5);
  const pull = p < 0.8 ? min(1, p / 0.7) * 1.15 : 0;
  rect(white(0.25), 8, 30, 104, 16);
  rect(pull < 0.7 ? GREEN : pull < 1 ? YELLOW : RED, 8, 30, (pull / 1.2) * 104, 16);
  rect(WHITE, 8 + 0.83 * 104, 24, 3, 28);
  if (p < 0.8) {
    line(pull > 1 ? RED : pull > 0.7 ? YELLOW : WHITE, 1.5 + pull * 2.5, 10, 84, 110, 84);
    return;
  }
  line(WHITE, 1.5, 10, 84, 52, 84);
  line(WHITE, 1.5, 70, 84, 110, 84);
  if (p < 0.9) text('¡CRAC!', 61, 104, 14, RED);
}

function drawPaperDiagram() {
  const p = phase(4);
  const t = p < 0.45 ? p / 0.45 : p < 0.85 ? 1 : 1 - (p - 0.85) / 0.15;
  if (p < 0.45 || p > 0.9) {
    saveCtx();
    translate(84 + 8 * sin(clock * 2), 40 + 4 * sin(clock * 3));
    drawPaperShape('#f7b', 1);
    restoreCtx();
  }
  drawKite(lerp(26, 84, t), lerp(84, 40, t), 0, 0.6, 60);
  if (p > 0.45 && p < 0.85) {
    setAlpha(1 - (p - 0.45) / 0.4);
    text('+35', 84, 36 - (p - 0.45) * 60, 16, YELLOW);
    setAlpha(1);
  }
  drawArrow(10, 100, 10, 16, YELLOW);
  text('×2,5', 16, 22, 11, YELLOW, 'left');
  text('×1', 16, 104, 11, WHITE, 'left');
}

function drawRivalDiagram() {
  const p = phase(4);
  const rivalX = lerp(132, -10, p);
  const cutNow = p > 0.64 && p < 0.95;
  line(WHITE, 2, 14, 98, 56, 64);
  const warn = rivalX < 110 && !cutNow && p < 0.64;
  line(warn ? rgba('255,60,60', 0.6 + 0.4 * sin(clock * 16)) : '#fe7', 4, 33, 81, 56, 64);
  if (cutNow) {
    rect('#0c0618', 30, 66, 14, 22);
    text('¡Corte!', 70, 100, 13, RED);
  }
  drawKite(56, 36, 0, 0.65, 80);
  polygon([rivalX, 62, rivalX + 10, 76, rivalX, 90, rivalX - 10, 76], '#e22');
}

function drawEventsDiagram() {
  const kind = ((clock / 2.5) | 0) % 3;
  const y = 80 + (kind == 1 ? 10 : 0) + 8 * sin(clock * (kind == 2 ? 5 : 2));
  roundedRect(4, 4, 114, 24, 10, '#e85');
  text(`${WIND_EVENTS[kind][0]} ×2`, 61, 21, 11, WHITE);
  for (const lineY of [48, 62]) {
    const x = (clock * (kind ? 30 : 90) + lineY * 3) % 130;
    line(kind == 1 ? '#7bf' : WHITE, 2, x - 8, lineY, x + 12, lineY);
  }
  drawKite(61, y, 0, 0.6, 60);
  if (kind == 1 && (clock * 4) % 1 < 0.6) text('¡JALA!', 61, y - 22, 13, RED);
}

const DIAGRAMS = [
  drawControlsDiagram,
  drawHoldDiagram,
  drawTapDiagram,
  () => drawGustDiagram(false),
  () => drawGustDiagram(true),
  drawTensionDiagram,
  drawPaperDiagram,
  drawRivalDiagram,
  drawEventsDiagram,
];

const HELP_PAGES = [
  ['Cómo se juega', [
    ['UN SOLO BOTÓN', 'Clic, toque, Espacio, ↑ o W.'],
    ['MANTÉN Y SUELTA', 'Mantén: sube y acorta la cuerda. Suelta: da cuerda y baja.'],
    ['TIRÓN CORTO', 'Un toque rápido (<0,2 s) da un empujón arriba.'],
  ]],
  ['Viento y tensión', [
    ['RÁFAGA', 'Franja blanca: viento fuerte. ¡Suelta cuerda!'],
    ['CALMA', 'Franja azul: viento flojo. ¡Jala o cae!'],
    ['TENSIÓN', 'Si la barra pasa la marca blanca mucho rato, el hilo se revienta.'],
  ]],
  ['Puntos y peligros', [
    ['PAPEL DE CHINA', 'Flota con el viento. Atrápalo y haz combos hasta ×8.'],
    [
      'RIVALES',
      'Si cruzan el tramo amarillo del hilo, lo cortan. ' +
        '♥ Salvavidas: perdona 1 fallo, recarga en 45 s.',
    ],
    ['EVENTOS', 'Ventarrón, calma y torbellino avisan 3 s antes. Valen ×2.'],
  ]],
];

function turnPage(step) {
  helpPage = clamp(helpPage + step, 0, HELP_PAGES.length - 1);
  click();
}

function drawHelp() {
  const [title, cards] = HELP_PAGES[helpPage];
  const x = centerX - contentWidth / 2;
  const cardHeight = 134;
  heading(title.toUpperCase(), 30, 24);
  for (let i = 0; i < 3; i++) {
    circle(i == helpPage ? YELLOW : white(0.35), centerX + (i - 1) * 20, offsetY + 54, 5);
  }
  button('‹', offsetY + 40, () => turnPage(-1), false, 40, centerX - 90, 28);
  button('›', offsetY + 40, () => turnPage(1), false, 40, centerX + 50, 28);
  cards.forEach(([name, description], i) => {
    const y = offsetY + 78 + i * (cardHeight + 8);
    roundedRect(x, y, contentWidth, cardHeight, 14, 'rgba(0,0,0,.5)');
    saveCtx();
    ctx.beginPath();
    ctx.rect(x + 4, y + 4, 122, cardHeight - 8);
    ctx.clip();
    translate(x + 4, y + (cardHeight - 110) / 2);
    DIAGRAMS[helpPage * 3 + i]();
    restoreCtx();
    text(name, x + 134, y + 30, 16, YELLOW, 'left');
    wrapText(description, x + 134, y + 54, contentWidth - 148, 18, 14, WHITE);
  });
  const y = offsetY + 78 + 3 * (cardHeight + 8) + 2;
  const buttonWidth = (contentWidth - 8) / 2;
  button('Volver', y, () => goTo('menu'), false, buttonWidth, x);
  button('Practicar', y, () => startGame(true), true, buttonWidth, x + buttonWidth + 8);
}

const SCREENS = {
  menu: drawMenu,
  custom: drawCustomize,
  scores: drawScores,
  help: drawHelp,
  over: drawGameOver,
  name: drawNameEntry,
  pause: drawPause,
};

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(background, 0, 0);
  ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
  saveCtx();
  if (shake > 0) translate((random() - 0.5) * shake * 24, (random() - 0.5) * shake * 24);
  drawScene();
  restoreCtx();
  if (['play', 'pause', 'over', 'name'].includes(currentScreen)) drawHud();
  if (currentScreen == 'play') return;
  rect(`rgba(8,4,24,${currentScreen == 'menu' ? 0.35 : 0.82})`, 0, 0, width, height);
  menuItems = [];
  saveCtx();
  setAlpha(1 - transition);
  translate(0, transition * 16);
  SCREENS[currentScreen]();
  restoreCtx();
  if (focusIndex >= menuItems.length) focusIndex = 0;
}

const itemAt = (x, y) => {
  const inside = b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  return menuItems.findIndex(inside);
};

function releaseInputs() {
  pointers.clear();
  pressedKeys.clear();
  held = false;
  tapQueued = false;
}

function pauseGame() {
  releaseInputs();
  if (currentScreen == 'play') goTo('pause');
}

// Un toque más corto que TAP_SECONDS pide el tirón aunque dure menos que un cuadro
function updateHold() {
  const down = pointers.size + pressedKeys.size > 0;
  if (down && !held) {
    pressStart = clock;
    holdSustained = false;
  }
  if (!down && held && currentScreen == 'play' && clock - pressStart < TAP_SECONDS) {
    tapQueued = true;
  }
  held = down;
}

function activateItem(index, direction) {
  if (currentScreen == 'over' && overTime < 0.6) return;
  const item = menuItems[index];
  if (!item) return;
  focusIndex = index;
  item.action(direction);
  if (!item.isRow && !item.isStepper) click();
}

// Filas: mitad izquierda -1, derecha +1. Selectores de letra: arriba +1, abajo -1
function directionAt(item, x, y) {
  if (item.isRow) return x < item.x + item.w / 2 ? -1 : 1;
  if (item.isStepper) return y < item.y + item.h / 2 ? 1 : -1;
  return 1;
}

addEventListener('pointerdown', e => {
  if (e.pointerType == 'mouse' && e.button) return;
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch {
    // el puntero ya no existe
  }
  if (currentScreen == 'play') {
    pointers.add(e.pointerId);
    updateHold();
    return;
  }
  const x = e.clientX / viewScale;
  const y = e.clientY / viewScale;
  pointerDown = { x, y, index: itemAt(x, y) };
});

function onPointerRelease(e) {
  wakeAudio();
  if (pointers.delete(e.pointerId)) updateHold();
  if (!pointerDown || e.type != 'pointerup') {
    pointerDown = null;
    return;
  }
  const x = e.clientX / viewScale;
  const y = e.clientY / viewScale;
  const { index } = pointerDown;
  const dx = x - pointerDown.x;
  pointerDown = null;
  if (currentScreen == 'help' && abs(dx) > 50) {
    turnPage(dx < 0 ? 1 : -1);
    return;
  }
  const item = menuItems[index];
  if (item && itemAt(x, y) == index) activateItem(index, directionAt(item, x, y));
}

for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  addEventListener(type, onPointerRelease);
}

addEventListener('pointermove', e => {
  if (e.pointerType != 'mouse' || currentScreen == 'play') return;
  const index = itemAt(e.clientX / viewScale, e.clientY / viewScale);
  if (index >= 0) focusIndex = index;
});

function handleMenuKey(e) {
  const key = e.key;
  const count = menuItems.length;
  const item = menuItems[focusIndex];
  if (e.repeat && !key.startsWith('Arrow')) return;
  if (currentScreen == 'name' && /^[a-zA-Z]$/.test(key)) {
    initials[min(focusIndex, 2)] = key.toUpperCase();
    focusIndex = min(focusIndex + 1, 3);
    click();
    return;
  }
  if (currentScreen == 'name' && key == 'Backspace') {
    focusIndex = max(0, focusIndex - 1);
    return;
  }
  if (key == 'Escape') {
    e.preventDefault();
    goTo(currentScreen == 'pause' ? 'play' : 'menu');
    return;
  }
  const vertical = key == 'ArrowUp' ? 1 : key == 'ArrowDown' ? -1 : 0;
  const horizontal = key == 'ArrowLeft' ? -1 : key == 'ArrowRight' ? 1 : 0;
  const moveFocus = step => (focusIndex = (focusIndex + step + count) % count);
  if (vertical || horizontal) e.preventDefault();
  if (vertical) {
    if (item && item.isStepper) item.action(vertical);
    else moveFocus(-vertical);
  } else if (horizontal) {
    if (item && item.isRow) item.action(horizontal);
    else if (currentScreen == 'help') turnPage(horizontal);
    else moveFocus(horizontal);
  } else if (key == 'Enter' || key == ' ') {
    e.preventDefault();
    if (item && item.onEnter) item.onEnter();
    else activateItem(focusIndex, 1);
  }
}

addEventListener('keydown', e => {
  const lower = e.key.toLowerCase();
  wakeAudio();
  if (currentScreen != 'play') {
    handleMenuKey(e);
    return;
  }
  if (HOLD_KEYS.includes(lower)) {
    e.preventDefault();
    if (!e.repeat) {
      pressedKeys.add(lower);
      updateHold();
    }
  } else if (e.key == 'Escape' || lower == 'p') {
    pauseGame();
  }
});

addEventListener('keyup', e => {
  if (pressedKeys.delete(e.key.toLowerCase())) updateHold();
});
addEventListener('blur', pauseGame);
document.addEventListener('visibilitychange', () => document.hidden && pauseGame());

// Sin esto el navegador hace zoom, scroll o menú contextual al jugar con toques
const BLOCKED_EVENTS = [
  'touchstart', 'touchmove', 'gesturestart', 'dblclick', 'auxclick', 'contextmenu', 'dragstart',
];
for (const type of BLOCKED_EVENTS) {
  addEventListener(type, e => e.preventDefault(), { passive: false });
}
addEventListener('resize', resize);

let lastFrame = 0;
let accumulator = 0;

// La simulación avanza en pasos fijos para no depender de los fps
function loop(now) {
  const dt = min(0.05, (now - lastFrame) / 1000 || 0);
  lastFrame = now;
  if (currentScreen != 'pause') {
    accumulator += dt;
    while (accumulator >= STEP) {
      update(STEP);
      accumulator -= STEP;
    }
  }
  if (currentScreen == 'over') overTime += dt;
  transition = max(0, transition - dt * 4);
  shake = max(0, shake - dt * 1.6);
  draw();
  requestAnimationFrame(loop);
}

initials = [0, 1, 2].map(i => (/^[A-Z]$/.test(initials[i]) ? initials[i] : 'A'));
resize();
applyConfig();
resetGame();
requestAnimationFrame(loop);
