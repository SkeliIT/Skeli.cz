// Precomputes the data for the water-and-fire effect round a clip on the song page (js/clip-fx.js):
// the loudness of 16 frequency bands 20x a second and the colours along the left, right and bottom
// edge of the picture 4x a second (black bars cropped). Output: src/main/webapp/eq/<youtubeId>.json.
// A clip without this file still gets the effect, in a calm rhythm with its thumbnail colours.
//
// usage: node tools/clip-fx-data.js <ffmpeg> <clip.mp4> src/main/webapp/eq/<youtubeId>.json
// (download the clip first, e.g. yt-dlp -f "bv*[height<=480]+ba" --merge-output-format mp4 <url>)
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const [ffmpeg, clip, out] = process.argv.slice(2);

const RATE = 22050, FPS = 20, HOP = RATE / FPS, N = 2048, BANDS = 16;
const CFPS = 4, CW = 16, CH = 12;

// picture: crop the black bars, shrink to 16x12, read three edges
const log = spawnSync(ffmpeg, ['-hide_banner', '-i', clip, '-vf', 'cropdetect=24:2:0', '-t', '120', '-f', 'null', '-']).stderr.toString();
const counts = {};
(log.match(/crop=\d+:\d+:\d+:\d+/g) || []).forEach(c => counts[c] = (counts[c] || 0) + 1);
const crop = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
const vf = (crop ? crop + ',' : '') + `fps=${CFPS},scale=${CW}:${CH}:flags=area`;
const frames = execFileSync(ffmpeg, ['-v', 'error', '-i', clip, '-vf', vf, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 30 });
const fsz = CW * CH * 3, nf = Math.floor(frames.length / fsz);
const edges = { l: [], r: [], b: [] };
const px = (f, x, y, c) => frames[f * fsz + (y * CW + x) * 3 + c];
for (let f = 0; f < nf; f++) {
  for (let y = 0; y < CH; y++) for (let c = 0; c < 3; c++) {
    edges.l.push(Math.round((px(f, 0, y, c) + px(f, 1, y, c)) / 2));
    edges.r.push(Math.round((px(f, CW - 1, y, c) + px(f, CW - 2, y, c)) / 2));
  }
  for (let x = 0; x < CW; x++) for (let c = 0; c < 3; c++) edges.b.push(Math.round((px(f, x, CH - 1, c) + px(f, x, CH - 2, c)) / 2));
}

// sound: mono 22 kHz, FFT every 1/20 s, 16 log-spaced bands
const raw = execFileSync(ffmpeg, ['-v', 'error', '-i', clip, '-ac', '1', '-ar', String(RATE), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
const pcm = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
const win = new Float32Array(N).map((_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)));
const edgesHz = []; for (let b = 0; b <= BANDS; b++) edgesHz.push(45 * Math.pow(14000 / 45, b / BANDS));
const binOf = hz => Math.max(1, Math.round(hz * N / RATE));
function fft(re, im) {
  for (let i = 1, j = 0; i < N; i++) { let bit = N >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= N; len <<= 1) {
    const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < N; i += len) { let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) { const h = i + k + len / 2, ur = re[i + k], ui = im[i + k], vr = re[h] * cr - im[h] * ci, vi = re[h] * ci + im[h] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi; re[h] = ur - vr; im[h] = ui - vi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } }
  }
}
const nFrames = Math.floor(pcm.length / HOP);
const db = []; for (let b = 0; b < BANDS; b++) db.push(new Float32Array(nFrames));
const re = new Float64Array(N), im = new Float64Array(N);
for (let f = 0; f < nFrames; f++) {
  const s = Math.round(f * HOP) - N / 2;
  for (let i = 0; i < N; i++) { const v = pcm[s + i]; re[i] = (v === undefined ? 0 : v) * win[i]; im[i] = 0; }
  fft(re, im);
  for (let b = 0; b < BANDS; b++) {
    let sum = 0; const lo = binOf(edgesHz[b]), hi = Math.max(lo + 1, binOf(edgesHz[b + 1]));
    for (let k = lo; k < hi; k++) sum += re[k] * re[k] + im[k] * im[k];
    db[b][f] = 10 * Math.log10(sum / (hi - lo) + 1e-12);
  }
}
// each band on its own scale (quiet 10th percentile = 0, loud 99th = 1), fast up, slow down
const level = new Float32Array(BANDS), energy = [];
const scaled = db.map(arr => { const s = Array.from(arr).sort((a, b) => a - b); const lo = s[Math.floor(s.length * .10)], hi = s[Math.floor(s.length * .99)]; return arr.map(v => Math.min(1, Math.max(0, (v - lo) / Math.max(1e-6, hi - lo)))); });
for (let f = 0; f < nFrames; f++) for (let b = 0; b < BANDS; b++) {
  const v = Math.pow(scaled[b][f], 1.4);
  level[b] = v > level[b] ? v : level[b] * 0.8 + v * 0.2;
  energy.push(Math.round(level[b] * 255));
}
const b64 = a => Buffer.from(Uint8Array.from(a)).toString('base64');
fs.writeFileSync(out, JSON.stringify({ v: 2, fps: FPS, bands: BANDS, frames: nFrames, energy: b64(energy),
  cfps: CFPS, rows: CH, cols: CW, cframes: nf, l: b64(edges.l), r: b64(edges.r), b: b64(edges.b) }));
console.log(out.split(/[\\/]/).pop(), 'crop', crop, 'sound', nFrames, 'colour', nf, 'bytes', fs.statSync(out).size);
