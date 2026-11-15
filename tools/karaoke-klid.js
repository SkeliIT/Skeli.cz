// Mapa klidu pro karaoke styl Lyric video: kde se v obraze videa v kterou chvíli nejmíň děje.
// Video se zmenší na 64×36 šedých bodů, 2 snímky za sekundu, a pro každou buňku mřížky 8×6 se spočítá
// „ruch“ = pohyb (rozdíl proti minulému snímku) + kresba (hrany, obličej, nápisy) + jas (bílý text na světlém
// místě není čitelný). Kino pak každý řádek textu položí tam, kde je v době zpěvu ruch nejmenší (nikdy doprostřed).
// YouTube přehrávač v prohlížeči nejde číst (cizí původ), proto se to počítá předem jako eq/<id>.json.
//
//   node tools/karaoke-klid.js <složka s klipy> [<další složka> …]
//
// Klip se hledá podle YouTube id v názvu souboru (jako v karaoke-nahled.js). Bere jen klipy, které mají
// karaoke časy (src/main/webapp/karaoke/<id>.json). Výstup: src/main/webapp/karaoke/klid/<id>.json
//   { fps, cols, rows, ar (šířka ÷ výška videa), frames, a (base64, frames × rows × cols bajtů 0–255) }
// Potřebuje ffmpeg (v PATH, nebo cesta v proměnné FFMPEG).
const fs = require('fs'), path = require('path'), cp = require('child_process');

const WEB = path.join(__dirname, '..', 'src', 'main', 'webapp');
const OUT = path.join(WEB, 'karaoke', 'klid');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const W = 64, H = 36, COLS = 8, ROWS = 6, FPS = 2;
const ALIAS = { riRijruWINY: 'Skeli - Ganja.mp4' };   // klipy, které nemají id v názvu

const dirs = process.argv.slice(2);
if (!dirs.length) { console.error('použití: node tools/karaoke-klid.js <složka s klipy> …'); process.exit(1); }
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

// poměr stran videa z výpisu ffmpeg („Video: h264 …, 854x480 [SAR 1:1 DAR 427:240]“)
function aspect(clip) {
  const r = cp.spawnSync(FFMPEG, ['-hide_banner', '-i', clip], { encoding: 'utf8' });
  const line = (r.stderr || '').split('\n').find((l) => /Stream.*Video:/.test(l)) || '';
  const dar = line.match(/DAR (\d+):(\d+)/), wh = line.match(/, (\d{2,5})x(\d{2,5})/);
  if (dar && +dar[2]) return +dar[1] / +dar[2];
  return wh ? +wh[1] / +wh[2] : 16 / 9;
}

let done = 0, missing = [];
for (const f of fs.readdirSync(path.join(WEB, 'karaoke'))) {
  if (!f.endsWith('.json')) continue;
  const id = f.slice(0, -5), clip = findClip(id);
  if (!clip) { missing.push(id); continue; }
  const raw = cp.execFileSync(FFMPEG, ['-loglevel', 'error', '-i', clip, '-an',
    '-vf', 'fps=' + FPS + ',scale=' + W + ':' + H + ':flags=area,format=gray', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 28 });
  const n = Math.floor(raw.length / (W * H)), cw = W / COLS, ch = H / ROWS;
  const score = new Float32Array(n * ROWS * COLS);
  for (let fi = 0; fi < n; fi++) {
    const o = fi * W * H, p = fi ? o - W * H : o;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      let mot = 0, det = 0, lum = 0;
      for (let y = r * ch; y < (r + 1) * ch; y++) for (let x = c * cw; x < (c + 1) * cw; x++) {
        const i = o + y * W + x, v = raw[i];
        mot += Math.abs(v - raw[p + y * W + x]);
        det += (x + 1 < W ? Math.abs(v - raw[i + 1]) : 0) + (y + 1 < H ? Math.abs(v - raw[i + W]) : 0);
        lum += v;
      }
      const k = cw * ch;
      // pohyb váží nejvíc, kresba míň, jas jen nad střední šedou (tmavé místo je pro bílý text ideální)
      score[(fi * ROWS + r) * COLS + c] = 2.2 * mot / k + 1.0 * det / k + 0.35 * Math.max(0, lum / k - 90);
    }
  }
  // na bajty podle 95. percentilu klipu (jinak by jeden záblesk stáhl všechno ostatní k nule)
  const sorted = Float32Array.from(score).sort(), top = sorted[Math.floor(sorted.length * .95)] || 1;
  const bytes = Buffer.alloc(score.length);
  for (let i = 0; i < score.length; i++) bytes[i] = Math.min(255, Math.round(score[i] / top * 200));
  const ar = Math.round(aspect(clip) * 1000) / 1000;
  fs.writeFileSync(path.join(OUT, id + '.json'), JSON.stringify({ fps: FPS, cols: COLS, rows: ROWS, ar, frames: n, a: bytes.toString('base64') }) + '\n');
  done++;
  console.log(id, n + ' snímků', 'poměr ' + ar, Math.round(fs.statSync(path.join(OUT, id + '.json')).size / 1024) + ' kB');
}
console.log('hotovo:', done, missing.length ? '| chybí klip: ' + missing.join(', ') : '');
