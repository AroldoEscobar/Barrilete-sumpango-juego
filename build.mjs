// Genera index.html (todo inline) desde src/. Terser es solo de desarrollo y no va en el build.
// node build.mjs         -> index.html minificado (el que se publica)
// node build.mjs --dev   -> index.dev.html con nombres legibles (para pruebas, no se publica)
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const dev=process.argv.includes('--dev'),
  tpl=readFileSync('src/index.html','utf8').replace(/>\s+</g,'><').trim();
let out=readFileSync('src/game.js','utf8');
try{out=execFileSync('npx',['--yes','terser','src/game.js','-c','passes=3,unsafe=true,pure_getters=true,unsafe_math=true,unsafe_arrows=true,keep_fargs=false','--ecma','2020','-m',...(dev?[]:['--toplevel']),'--comments','false'],{encoding:'utf8',maxBuffer:1<<24}).trim()}
catch{console.warn('terser no disponible: se usa la fuente sin minificar')}
const html=tpl.replace('/*JS*/',()=>out),file=dev?'index.dev.html':'index.html';
writeFileSync(file,html);
console.log(file+':',Buffer.byteLength(html),'bytes');
