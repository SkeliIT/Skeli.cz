// Ukázky z klipů pro stránku Karaoke (/karaoke): z každého klipu vyřízne kus, ve kterém se zpívá prvních pár řádků
// (stejné řádky, jaké stránka ukazuje jako titulky), bez zvuku, 480p, s posterem. Stránka pak promítá video
// a titulky jedou podle jeho času: čas písně = from + čas ukázky.
//
//   node tools/karaoke-nahled.js <složka s klipy> [<další složka> …]
//
// Klip se hledá podle YouTube id v názvu souboru (např. YQt6qBZ2f4g.mp4); pro klip s jiným názvem jde přidat
// řádek do ALIAS. Výstup: src/main/webapp/karaoke/nahled/<id>.mp4, <id>.webp a <id>.json ({ from, to }).
// Potřebuje ffmpeg (v PATH, nebo cesta v proměnné FFMPEG).
const fs = require('fs'), path = require('path'), cp = require('child_process');

const WEB = path.join(__dirname, '..', 'src', 'main', 'webapp');
const OUT = path.join(WEB, 'karaoke', 'nahled');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const LINES = 6;                 // kolik řádků ukázka pokryje (jako window.KARAOKE ve KaraokeCinemaServlet)
const MAX = 40;                  // nejdelší ukázka v sekundách
const ALIAS = { riRijruWINY: 'Skeli - Ganja.mp4' };   // klipy, které nemají id v názvu

const dirs = process.argv.slice(2);
if (!dirs.length) { console.error('použití: node tools/karaoke-nahled.js <složka s klipy> …'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });

function findClip(id) {
  for (const d of dirs) {
    let names = [];
    try { names = fs.readdirSync(d); } catch (e) { continue; }
    for (const n of names) {
      if ((n.startsWith(id) || n === ALIAS[id]) && n.endsWith('.mp4') && fs.statSync(path.join(d, n)).size > 100000) return path.join(d, n);
    }
  }
  return null;
}

let done = 0, missing = [];
for (const f of fs.readdirSync(path.join(WEB, 'karaoke'))) {
  if (!f.endsWith('.json')) continue;
  const id = f.slice(0, -5), k = JSON.parse(fs.readFileSync(path.join(WEB, 'karaoke', f), 'utf8'));
  const times = k.times || [];
  if (!times.length) continue;
  const clip = findClip(id);
  if (!clip) { missing.push(id); continue; }
  const n = Math.min(LINES, times.length);
  const from = Math.max(0, Math.round((times[0][0] - 1.5) * 10) / 10);
  const to = Math.round(Math.min(from + MAX, times[n - 1][1] + 1.2) * 10) / 10;
  const mp4 = path.join(OUT, id + '.mp4'), webp = path.join(OUT, id + '.webp');
  // bez zvuku, výška 480 px, H.264 pro všechny prohlížeče, moov na začátku (hraje hned při stahování)
  cp.execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-ss', String(from), '-to', String(to), '-i', clip, '-an',
    '-vf', 'scale=-2:480', '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
  cp.execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-ss', String(from + 0.5), '-i', clip, '-frames:v', '1', '-vf', 'scale=-2:480', '-c:v', 'libwebp', '-q:v', '70', webp]);
  fs.writeFileSync(path.join(OUT, id + '.json'), JSON.stringify({ from, to }) + '\n');
  done++;
  console.log(id, from + '–' + to + ' s', Math.round(fs.statSync(mp4).size / 1024) + ' kB');
}
console.log('hotovo:', done, missing.length ? '| chybí klip: ' + missing.join(', ') : '');
