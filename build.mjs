// Junta src/index.html y src/game.js en un solo archivo, sin dependencias en tiempo de ejecución.
//   node build.mjs        -> index.html minificado (el que se entrega)
//   node build.mjs --dev  -> index.dev.html con nombres globales legibles, para las pruebas
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const isDev = process.argv.includes('--dev');

const COMPRESS = [
  'passes=3',
  'unsafe=true',
  'pure_getters=true',
  'unsafe_math=true',
  'unsafe_arrows=true',
  'keep_fargs=false',
].join(',');

// Terser solo se usa al construir; si no está disponible se publica el código sin minificar
function minifyScript(source) {
  const args = ['--yes', 'terser', 'src/game.js', '-c', COMPRESS, '--ecma', '2020', '-m'];
  if (!isDev) args.push('--toplevel');
  args.push('--comments', 'false');
  try {
    return execFileSync('npx', args, { encoding: 'utf8', maxBuffer: 1 << 24 }).trim();
  } catch {
    console.warn('terser no disponible: se usa el código sin minificar');
    return source;
  }
}

// Quita sangrías y las etiquetas opcionales head/body, que HTML5 permite omitir.
// Se aplica a la plantilla antes de insertar el script, así que no toca el código.
function minifyHtml(html) {
  return html
    .replace(/<\/?(head|body)>|<\/html>/g, '')
    .replace(/\s*\n\s*/g, '')
    .replace(/\s*([{};:,])\s*/g, '$1')
    .trim();
}

const script = minifyScript(readFileSync('src/game.js', 'utf8'));
const template = readFileSync('src/index.html', 'utf8');
const html = minifyHtml(template).replace('/*JS*/', () => script);
const file = isDev ? 'index.dev.html' : 'index.html';
writeFileSync(file, html);
console.log(`${file}: ${Buffer.byteLength(html)} bytes`);
