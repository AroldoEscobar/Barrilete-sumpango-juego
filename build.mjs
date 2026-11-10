// Junta src/ en un solo index.html sin dependencias en tiempo de ejecución.
//   node build.mjs        -> index.html minificado (el que se entrega)
//   node build.mjs --dev  -> index.dev.html legible, con el estado y las funciones en window.__game
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';
import { minify } from 'terser';

const isDev = process.argv.includes('--dev');
const SRC = 'src';

// Los campos del estado compartido (run.kite, view.groundY...) se acortan como las variables;
// width y height se quedan igual porque también son propiedades del DOM y del canvas
function stateFieldPattern() {
  const state = readFileSync(join(SRC, 'core', 'state.js'), 'utf8');
  const names = [...state.matchAll(/^ {2}(\w+):/gm)].map(match => match[1]);
  return new RegExp(`^(${names.filter(name => !['width', 'height'].includes(name)).join('|')})$`);
}

const terserOptions = () => ({
  ecma: 2020,
  compress: {
    passes: 3,
    unsafe: true,
    pure_getters: true,
    unsafe_math: true,
    unsafe_arrows: true,
    keep_fargs: false,
  },
  mangle: { toplevel: true, properties: { regex: stateFieldPattern() } },
  format: { comments: false },
});

function listModules(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listModules(path);
    return path.endsWith('.js') ? [path] : [];
  });
}

// Solo para las pruebas: cada módulo cuelga de window.__game y el estado
// también queda como globales (kite, held...) con getters y setters
function devEntry() {
  const modules = listModules(SRC).filter(path => path != join(SRC, 'main.js'));
  const imports = modules.map((path, i) => `import * as m${i} from './${path.slice(SRC.length + 1)}';`);
  return `
    ${imports.join('\n')}
    import './main.js';
    const api = Object.assign({}, ${modules.map((_, i) => `m${i}`).join(', ')});
    window.__game = api;
    for (const group of [api.run, api.view, api.ui, api.input, api.profile]) {
      for (const key of Object.keys(group)) {
        Object.defineProperty(window, key, {
          get: () => group[key],
          set: value => (group[key] = value),
          configurable: true,
        });
      }
    }
    for (const [name, value] of Object.entries(api)) {
      if (!(name in window)) window[name] = value;
    }
  `;
}

async function bundle() {
  const result = await build({
    ...(isDev
      ? { stdin: { contents: devEntry(), resolveDir: SRC, sourcefile: 'dev-entry.js' } }
      : { entryPoints: [join(SRC, 'main.js')] }),
    bundle: true,
    format: 'iife',
    target: 'es2020',
    legalComments: 'none',
    write: false,
  });
  return result.outputFiles[0].text;
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

const source = await bundle();
const script = isDev ? source : (await minify(source, terserOptions())).code;
const template = readFileSync(join(SRC, 'index.html'), 'utf8');
const html = minifyHtml(template).replace('/*JS*/', () => script);
const file = isDev ? 'index.dev.html' : 'index.html';
writeFileSync(file, html);
console.log(`${file}: ${Buffer.byteLength(html)} bytes`);
