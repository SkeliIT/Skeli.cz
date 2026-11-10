// Karaoke cinema, the room "Prostor": a looping video of a dark space with levitating rocks and golden light
// (made from the design with Seedance, looped and upscaled: prostor/prostor-1440.mp4, -720 for phones). The clip
// is bent onto the tilted black panel in it (a CSS matrix3d from the panel's corners), the words sit on the
// floor under it: the line before grey, the one being sung filling orange word by word, the next one grey.
const D = window.KDATA;
// settings: #sim;auto;t=58 (sim = no YouTube, auto = straight in, t = start time)
const qs = new URLSearchParams((location.search.slice(1) + '&' + location.hash.slice(1)).replace(/;/g, '&'));
const SIM = qs.has('sim') || location.protocol === 'file:';
const LAST_END = D.times[D.times.length - 1][1];
const PHONE = Math.min(innerWidth, innerHeight) < 600;
const $ = (id) => document.getElementById(id);
if (SIM) document.body.classList.add('sim');
document.body.dataset.look = 'p';

$('tagTitle').textContent = D.title;
$('tagArtist').textContent = D.artist + ' · ' + D.year;
$('lobbyTitle').textContent = D.title;
$('lobbyArtist').textContent = D.artist;
$('titleCard').querySelector('b').textContent = D.title;
$('titleCard').querySelector('span').textContent = D.artist;

// ---------------- the space (a video) ----------------
const VID_ASPECT = 16 / 9;
// the panel in the video (its whole golden frame, not only the black part at the top): its corners (TL, TR, BR,
// BL) as a share of the video's width / height
const QUAD = [[.2922, .1910], [.6828, .1618], [.6828, .5590], [.2922, .5556]];
const WIN = { x0: QUAD[0][0], y0: Math.min(QUAD[0][1], QUAD[1][1]), x1: QUAD[1][0], y1: Math.max(QUAD[2][1], QUAD[3][1]) };
const bg = document.createElement('video');
bg.className = 'space';
bg.muted = true; bg.loop = true; bg.playsInline = true; bg.autoplay = true; bg.preload = 'auto';
bg.src = '/kino/prostor/prostor-' + (PHONE || Math.max(innerWidth, innerHeight) * (devicePixelRatio || 1) < 1600 ? '720' : '1440') + '.mp4';
document.body.prepend(bg);
// embers flying through the space towards us: they come out of the depth behind the panel (where the golden beams
// meet), spread out and grow as they come nearer – tiny far away, a few pixels close by. Some are cold blue, more so
// on the right (the light there). Behind the clip, over the video. On the bass they speed up and leave a short trail
// (embers(dt, push) is called every frame with the beat; view = where the depth is, set by fit()).
const view = { x: innerWidth / 2, y: innerHeight * .35, s: innerWidth * .6 };
const embers = (() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const cv = document.createElement('canvas'); cv.className = 'space-embers'; cv.setAttribute('aria-hidden', 'true');
  bg.after(cv);
  const g = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1);
  const sprite = (core, mid, glow) => {   // a soft dot with a halo, drawn once
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    let gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, glow); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    gr = x.createRadialGradient(32, 32, 0, 32, 32, 12); gr.addColorStop(0, core); gr.addColorStop(.55, mid); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    return c;
  };
  const warm = sprite('#ffe2a0', '#ff7a2b', 'rgba(255,120,40,.3)'), cold = sprite('#eef7ff', '#7cbcff', 'rgba(90,170,255,.28)');
  const COLD = ['rgba(150,200,255,', ')'], WARM = ['rgba(255,190,110,', ')'];
  let W = 0, H = 0;
  const list = [];
  const spawn = (p, anywhere) => {   // x, y: a spot in the space (the depth is at 0, 0), z: 1 = far, 0.08 = by the viewer
    const a = Math.random() * 6.28, r = .08 + Math.pow(Math.random(), .7) * .9;
    p.x = Math.cos(a) * r; p.y = Math.sin(a) * r * .75; p.z = anywhere ? .1 + Math.random() * .95 : 1 + Math.random() * .15;
    p.v = .1 + Math.random() * .08;   // depth per second
    p.cold = Math.random() < (p.x > .15 ? .45 : .12); p.px = null;
  };
  for (let i = 0, n = PHONE ? 45 : 110; i < n; i++) { const p = {}; spawn(p, true); list.push(p); }
  let lift = 0, glowK = 0;
  return (dt, push) => {
    if (cv.width !== Math.round(innerWidth * dpr) || cv.height !== Math.round(innerHeight * dpr)) { W = innerWidth; H = innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    lift += (push - lift) * (1 - Math.exp(-dt * (push > lift ? 14 : 3)));   // quick to speed up with a thump, slow to calm down
    glowK += (push - glowK) * (1 - Math.exp(-dt * (push > glowK ? 20 : 5)));
    const speed = 1 + lift * 3.5;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (const p of list) {
      p.z -= p.v * speed * dt * Math.max(.35, p.z);   // slower far away, faster as they come near (as things do)
      const sx = view.x + p.x / p.z * view.s, sy = view.y + p.y / p.z * view.s;
      if (p.z < .08 || sx < -40 || sx > W + 40 || sy < -40 || sy > H + 40) { spawn(p, false); continue; }
      const near = Math.min(1, (1.05 - p.z) / .95);                 // 0 far … 1 near
      const r = Math.min(5, .35 + 1.6 * near * near + .5 / p.z * .3) * (1 + glowK * .35);   // the dot's radius in px
      const a = Math.min(1, (1.15 - p.z) * 2.2) * (.5 + .5 * glowK);
      if (p.px !== null && lift > .15) {   // a short trail on the bass
        const c = p.cold ? COLD : WARM; g.globalAlpha = Math.min(1, a * lift * .9);
        g.strokeStyle = c[0] + (.55 * near + .15) + c[1]; g.lineWidth = Math.max(.6, r * .7);
        g.beginPath(); g.moveTo(p.px - (sx - p.px) * 2, p.py - (sy - p.py) * 2); g.lineTo(sx, sy); g.stroke();
      }
      g.globalAlpha = Math.max(0, Math.min(1, a));
      const s = r * 5.3; g.drawImage(p.cold ? cold : warm, sx - s / 2, sy - s / 2, s, s);
      p.px = sx; p.py = sy;
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  };
})();
// the video has a short flaw in its first second (smeared streaks above a rock, right of the panel): a soft blur
// covers that spot only then, fading in and out with the loop
const GLITCH = { x0: .684, y0: .186, x1: .752, y1: .272 };
const glitch = document.createElement('div'); glitch.className = 'space-glitch'; bg.after(glitch);
const kick = () => bg.play().catch(() => {});
kick(); addEventListener('pointerdown', kick, { once: true });
// more life in the space (space-fx.js: nebulae in the clip's colours, comets, hyperspace in the chorus, gold dust,
// fireworks), with this file's version
const VER = new URL(import.meta.url).search;
let sfx = null;
import('./space-fx.js' + VER).then((m) => { sfx = m.spaceFx(glitch, view, coloursAt); }).catch(() => {});
// the chorus: lines that come more than once
const seenLine = {}, lineKeys = D.lines.map((l) => { const k = l.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ''); seenLine[k] = (seenLine[k] || 0) + 1; return k; });
const isChorus = lineKeys.map((k) => k && seenLine[k] > 1);

// ---------------- the clip, bent onto the panel ----------------
const clipEl = document.createElement('div');
clipEl.className = 'clip';
// the big thumbnail (1280x720) on the large panel; not every clip has one, then the usual one
clipEl.innerHTML = '<img class="poster" alt=""><div class="player"></div><div class="catch" hidden></div><button class="big-play" hidden aria-label="Přehrát"></button><div class="power"></div>';
$('css3d').appendChild(clipEl);
const poster = clipEl.querySelector('.poster'), catcher = clipEl.querySelector('.catch'), bigPlay = clipEl.querySelector('.big-play'), powerEl = clipEl.querySelector('.power');
poster.onerror = () => { poster.onerror = null; poster.src = D.thumb; };
// a golden rim round the clip, like the light lines in the space: its colours flow slowly, a spark runs round
// it and it flares with the song's bass (eq/<id>.json)
const rimEl = document.createElement('div');
rimEl.className = 'clip-rim';
$('css3d').appendChild(rimEl);
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const E = D.eq, energy = unb64(E.energy);
function bassAt(t) {
  const f = Math.floor(t * E.fps), o = f * E.bands;
  if (f < 0 || o + 3 > energy.length) return 0;
  return (energy[o] + energy[o + 1] + energy[o + 2]) / 765;
}
let beat = 0, bassAvg = 0;
poster.src = D.thumb.replace('hqdefault', 'maxresdefault');
// the clip's colours at its left and right edge (4 times a second, eq/<id>.json): the nebulae take them up
const EDGE_L = unb64(E.l), EDGE_R = unb64(E.r);
function coloursAt(t) {
  const f = Math.max(0, Math.min((E.cframes || 1) - 1, Math.floor(t * (E.cfps || 4)))), n = E.rows || 12;
  const avg = (buf) => { const o = f * n * 3, c = [0, 0, 0]; for (let y = 0; y < n; y++) for (let k = 0; k < 3; k++) c[k] += buf[o + y * 3 + k] || 0; return c.map((v) => v / n); };
  return { l: avg(EDGE_L), r: avg(EDGE_R) };
}
let panel = null;   // the panel's corners on screen (fit())

// the clip is laid out at 1920x1080 and bent onto the panel: YouTube then sends a sharper picture than at 720p
const CW = 1920, CH = 1080;
// the CSS matrix3d that maps a w x h box onto the corners p (TL, TR, BR, BL)
function quadMatrix(w, h, p) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = p;
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3, den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den, k = (dx1 * sy - sx * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3, d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
  return [a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, x0, y0, 0, 1];
}
// the video covers the screen (a phone upright: the panel nearly as wide as the screen, the sides cut off);
// the clip and the words follow the panel
function fit() {
  const W = innerWidth, H = innerHeight, a = W / H;
  let vw, vh, ox, oy;
  if (H > W * 1.1) {
    vw = W * .96 / (WIN.x1 - WIN.x0); vh = vw / VID_ASPECT;
    ox = W / 2 - (WIN.x0 + WIN.x1) / 2 * vw; oy = H * .18 - WIN.y0 * vh;
  } else {
    if (a > VID_ASPECT) { vw = W; vh = W / VID_ASPECT; } else { vh = H; vw = H * VID_ASPECT; }
    ox = (W - vw) / 2; oy = (H - vh) / 2;
  }
  Object.assign(bg.style, { left: ox + 'px', top: oy + 'px', width: vw + 'px', height: vh + 'px' });
  Object.assign(glitch.style, { left: (ox + GLITCH.x0 * vw) + 'px', top: (oy + GLITCH.y0 * vh) + 'px', width: ((GLITCH.x1 - GLITCH.x0) * vw) + 'px', height: ((GLITCH.y1 - GLITCH.y0) * vh) + 'px' });
  bg.classList.toggle('upright', H > W * 1.1);
  const p = QUAD.map(([u, v]) => [ox + u * vw, oy + v * vh]);
  panel = p;
  clipEl.style.transform = rimEl.style.transform = 'matrix3d(' + quadMatrix(CW, CH, p).join(',') + ')';
  // the depth the embers come out of: a little above the middle of the panel, where the beams meet
  view.x = (p[0][0] + p[1][0] + p[2][0] + p[3][0]) / 4; view.y = (p[0][1] + p[1][1]) / 2 * .5 + (p[2][1] + p[3][1]) / 2 * .5 - (p[3][1] - p[0][1]) * .1; view.s = Math.max(W, H) * .55;
  lyricsEl.style.setProperty('--fs', Math.max(16, Math.min(34, vw * .0145)) + 'px');
  lyricsEl.style.top = (oy + vh * .615) + 'px';
}

// ---------------- the clock ----------------
let clock = null, simT = qs.has('end') ? LAST_END + 7 : parseFloat(qs.get('t') || '0'), simPlaying = false, simAt = performance.now();
const now = () => clock ? clock.time() : simT + (simPlaying ? (performance.now() - simAt) / 1000 : 0);
const playing = () => clock ? clock.playing() : simPlaying;
const duration = () => clock && clock.duration() ? clock.duration() : Math.max(LAST_END + 8, 30);
function play() { if (clock) clock.play(); else if (!simPlaying) { simAt = performance.now(); simPlaying = true; } }
function pause() { if (clock) clock.pause(); else if (simPlaying) { simT = now(); simPlaying = false; } }
function seek(t) { t = Math.max(0, Math.min(duration() - .5, t)); if (clock) clock.seek(t); else { simT = t; simAt = performance.now(); } }
function startPlayer() {
  if (SIM) { play(); return; }
  const f = document.createElement('iframe');
  f.src = 'https://www.youtube-nocookie.com/embed/' + D.yt + '?enablejsapi=1&autoplay=1&controls=0&cc_load_policy=0&disablekb=1&fs=0&rel=0&playsinline=1&iv_load_policy=3&modestbranding=1&origin=' + encodeURIComponent(location.origin);
  f.allow = 'autoplay; encrypted-media; picture-in-picture';
  f.title = D.title;
  clipEl.querySelector('.player').appendChild(f);
  // YouTube shows its automatic subtitles when the viewer has them on: switch the module off (again later)
  const noCaptions = () => ['captions', 'cc'].forEach((m) => { try { f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unloadModule', args: [m], id: 1, channel: 'widget' }), '*'); } catch (er) { /* gone */ } });
  clock = new window.YtClock(f, noCaptions);
  [800, 2000, 4000, 8000].forEach((ms) => setTimeout(noCaptions, ms));
  catcher.hidden = false;
  catcher.onclick = () => (playing() ? pause() : play());
  setTimeout(() => { if (!playing()) bigPlay.hidden = false; }, 3500);
}
bigPlay.onclick = () => { bigPlay.hidden = true; play(); };

// ---------------- the words: the line being sung and the next one, out of smoke ----------------
// The line being sung is on top (each word turns gold when it is sung), the next one under it, dimmer, so it can be
// read ahead; room for both even when each wraps onto two rows. When the top line is done it drifts up into smoke,
// the next one slides up into its place and the one after comes out of smoke below (its words one after another
// within half a second). In a long pause the lines go up in smoke a while after the last word; the next pair comes
// out of smoke well before it is sung.
const AHEAD = 1.6, STAGGER = .07, HOLD = 2.6, lyricsEl = $('lyrics'), titleCard = $('titleCard'), dotsEl = $('dots');
const firstWord = (k) => (D.words[k] && D.words[k][0] ? D.words[k][0][0] : D.times[k][0]);
const lastWord = (k) => { const w = D.words[k]; return w && w.length ? w[w.length - 1][1] : D.times[k][1]; };
const lastWordStart = (k) => { const w = D.words[k]; return w && w.length ? w[w.length - 1][0] : D.times[k][1] - .3; };
// the line before leaves when its last word starts (it drifts up still showing it), so even back-to-back rap lines
// can be read ahead
const showAt = (k) => Math.max(firstWord(k) - AHEAD, k > 0 ? lastWordStart(k - 1) : -1e9);
function lineAt(t) { let i = -1; for (let k = 0; k < D.times.length; k++) { if (showAt(k) <= t) i = k; else break; } return i; }
if (!qs.has('auto')) lyricsEl.style.visibility = 'hidden';   // not under the lobby
// smoke: soft wisps of turbulent noise, drawn on the #fx canvas
const fx = $('fx'), fg = fx.getContext('2d'), FXR = Math.min(2, devicePixelRatio || 1);
const smokeSprites = [1, 2, 3].map((sd) => {
  const S = 96, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), img = x.createImageData(S, S), o = img.data;
  const h = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7 + sd * 74.7) * 43758.5453; return v - Math.floor(v); };
  const n = (a, b) => { const i = Math.floor(a), k = Math.floor(b), f = a - i, e = b - k, u = f * f * (3 - 2 * f), w = e * e * (3 - 2 * e);
    return h(i, k) + (h(i + 1, k) - h(i, k)) * u + (h(i, k + 1) - h(i, k)) * w + (h(i, k) - h(i + 1, k) - h(i, k + 1) + h(i + 1, k + 1)) * u * w; };
  const fbm = (a, b) => { let v = 0, m = .5; for (let k = 0; k < 4; k++) { v += m * n(a, b); a *= 2.03; b *= 2.03; m *= .5; } return v; };
  for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
    const u = px / S, v = py / S, r = Math.hypot(u - .5, v - .5) * 2, tt = fbm(u * 4 + fbm(u * 3 + 5, v * 3) * 1.6, v * 4 + fbm(u * 3, v * 3 + 9) * 1.6);
    let al = Math.min(1, Math.max(0, (tt - .38) / .45)); al = al * al * (3 - 2 * al);
    const i = (py * S + px) * 4; o[i] = 210; o[i + 1] = 212; o[i + 2] = 222; o[i + 3] = Math.round(255 * al * Math.pow(Math.max(0, 1 - r), 1.6));
  }
  x.putImageData(img, 0, 0); return c;
});
let smoke = [];
const puff = (x, y, size, grow, life, alpha) => smoke.push({ x, y, age: 0, life, size, grow, rot: Math.random() * 6.28, vr: (Math.random() - .5) * .9, seed: Math.random() * 9, a: alpha, sp: smokeSprites[Math.floor(Math.random() * 3)] });
function drawSmoke(dt) {
  const W = innerWidth, H = innerHeight;
  if (fx.width !== Math.round(W * FXR) || fx.height !== Math.round(H * FXR)) { fx.width = Math.round(W * FXR); fx.height = Math.round(H * FXR); }
  fg.setTransform(FXR, 0, 0, FXR, 0, 0); fg.clearRect(0, 0, W, H);
  smoke = smoke.filter((m) => {
    m.age += dt; if (m.age > m.life) return false;
    const f = m.age / m.life, s = m.size + m.grow * m.age;
    m.y -= (26 - 10 * f) * dt; m.x += Math.sin(m.age * 1.6 + m.seed) * 12 * dt; m.rot += m.vr * dt;
    fg.globalAlpha = Math.min(1, m.age * 3) * Math.pow(1 - f, 1.4) * m.a;
    fg.save(); fg.translate(m.x, m.y); fg.rotate(m.rot); fg.drawImage(m.sp, -s / 2, -s / 2, s, s); fg.restore();
    return true;
  });
  fg.globalAlpha = 1;
}
const stack = document.createElement('div'); stack.className = 'pstack'; lyricsEl.appendChild(stack);
function makeLine(k, role, t) {
  const el = document.createElement('div'); el.className = 'pline ' + role; el._i = k; el._at = t;
  const times = D.words[k] || [];
  el._w = D.lines[k].split(/\s+/).map((tok, n) => { const s = document.createElement('span'); s.className = 'w'; s.textContent = tok; el.appendChild(s); el.appendChild(document.createTextNode(' ')); return { el: s, t: times[n] || D.times[k] }; });
  stack.appendChild(el);
  return el;
}
function leaveLine(el, quiet) {
  if (!quiet && sfx && el.classList.contains('cur')) sfx.dust(el.getBoundingClientRect());   // gold dust from a sung line
  if (!quiet) el.querySelectorAll('.w.in').forEach((w) => { const r = w.getBoundingClientRect(); puff(r.left + r.width / 2, r.top + r.height * .5, r.height * 1.2, r.height * 1.6, 2, .35); });
  if (!quiet) el.querySelectorAll('.w').forEach((w) => w.classList.add('sung'));   // it leaves as its last word starts
  el.style.top = el.offsetTop + 'px'; el.classList.add('out');   // out of the flow, where it stood, then up
  setTimeout(() => el.remove(), 1700);
}
let shown = -2, line = null, next = null, lastT = 0;
const nextShown = (k) => D.times[k + 1] && firstWord(k + 1) - lastWord(k) < HOLD + 1.5;   // not across a long pause
function slideUp(el, r0) {   // FLIP: from where it stood (r0, measured before the line above left) to its new place
  el.classList.remove('next'); el.classList.add('cur');
  const r1 = el.getBoundingClientRect().top;
  el.style.transition = 'none'; el.style.transform = 'translateY(' + (r0 - r1) + 'px)';
  void el.offsetWidth; el.style.transition = ''; el.style.transform = '';
}
function words(t) {
  const jumped = Math.abs(t - lastT) > 1.2; lastT = t;   // a seek: build the lines at once, without smoke
  let i = lineAt(t);
  if (i >= 0 && t > lastWord(i) + HOLD && !(D.times[i + 1] && showAt(i + 1) - t < .3)) i = -1;   // a long pause: clear
  if (i !== shown || (jumped && line)) {
    if (jumped || i < 0 || i !== shown + 1) {   // start again: a jump, a pause, or the first line
      if (line) leaveLine(line, jumped); if (next) leaveLine(next, jumped);
      line = next = null;
      if (i >= 0) { line = makeLine(i, 'cur', jumped ? -1e9 : t); if (nextShown(i)) next = makeLine(i + 1, 'next', jumped ? -1e9 : t + .25); }
    } else {                                     // the usual step: the top line leaves, the next one moves up
      const r0 = next ? next.getBoundingClientRect().top : 0;
      if (line) leaveLine(line, false);
      if (next && next._i === i) { line = next; slideUp(line, r0); } else { if (next) leaveLine(next, false); line = makeLine(i, 'cur', t); }
      next = nextShown(i) ? makeLine(i + 1, 'next', t + .3) : null;
    }
    shown = i;
    [line, next].forEach((l) => { if (l && jumped) l.classList.add('instant'); });
  }
  for (const l of [line, next]) if (l) l._w.forEach((w, n) => {
    const on = t >= l._at + n * STAGGER, sung = l === line && t >= w.t[0] - .04;
    if (on !== w.on) {
      w.on = on; w.el.classList.toggle('in', on);
      if (on && !l.classList.contains('instant')) { const r = w.el.getBoundingClientRect(); for (let k = 0; k < 3; k++) puff(r.left + r.width * (.15 + .7 * Math.random()), r.top + r.height * .6, r.height * (.8 + Math.random() * .5), r.height * 1.3, 1.4 + Math.random() * .6, .3); }
    }
    if (sung !== w.sung) { w.sung = sung; w.el.classList.toggle('sung', sung); }
  });
  titleCard.classList.toggle('gone', t > D.times[0][0] - 1.2);
  let sung = -1; for (let s = 0; s < D.times.length && D.times[s][0] <= t; s++) sung = s;
  const nx = D.times[sung + 1], prevEnd = sung >= 0 ? D.times[sung][1] : 0;
  const wait = nx ? nx[0] - .5 - t : 99, gap = nx ? nx[0] - prevEnd : 0;
  const showDots = nx && sung >= 0 && gap > 5 && wait > 0 && wait < 3.2;
  dotsEl.classList.toggle('show', !!showDots);
  if (showDots) [...dotsEl.children].forEach((d, n) => d.classList.toggle('out', wait < 3 - n));
}

// ---------------- controls ----------------
const fmt = (s) => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); };
const bar = $('bar');
D.times.forEach((tt) => { const i = document.createElement('i'); i.className = 'tick'; i.style.left = (tt[0] / duration() * 100) + '%'; bar.appendChild(i); });
bar.onclick = (ev) => { const r = bar.getBoundingClientRect(); seek((ev.clientX - r.left) / r.width * duration()); };
$('pp').onclick = () => (playing() ? pause() : play());
$('back5').onclick = () => seek(now() - 5);
$('fwd5').onclick = () => seek(now() + 5);
$('vol').oninput = (ev) => { if (clock) clock.setVolume(+ev.target.value); };
// the whole screen where the browser can (an iPhone's Safari can't for a page, only for a video: then no button)
const fsRoot = document.documentElement, fsOn = () => document.fullscreenElement || document.webkitFullscreenElement;
const fsEnter = fsRoot.requestFullscreen || fsRoot.webkitRequestFullscreen, fsExit = document.exitFullscreen || document.webkitExitFullscreen;
if (!fsEnter) $('fs').hidden = true;
$('fs').onclick = () => { try { const r = fsOn() ? fsExit.call(document) : fsEnter.call(fsRoot); if (r && r.catch) r.catch(() => {}); } catch (e) { /* not allowed now */ } };
$('exit').onclick = leave;
let entered = false, idleTimer = 0;
addEventListener('keydown', (ev) => {
  if (!entered) return;
  if (ev.key === ' ') { ev.preventDefault(); playing() ? pause() : play(); }
  else if (ev.key === 'ArrowLeft') seek(now() - 5);
  else if (ev.key === 'ArrowRight') seek(now() + 5);
  else if (ev.key === 'Escape' && !fsOn()) leave();
  else if (ev.key === 'f' || ev.key === 'F') $('fs').click();
  wake();
});
function wake() { document.body.classList.remove('idle'); clearTimeout(idleTimer); idleTimer = setTimeout(() => { if (playing()) document.body.classList.add('idle'); }, 2800); }
addEventListener('pointermove', wake); addEventListener('pointerdown', wake);
let turnDismissed = false;   // a phone held upright: ask to turn it (once dismissed, not again)
function askToTurn() { $('rotate').hidden = !(PHONE && entered && !turnDismissed && innerHeight > innerWidth); }
$('rotateAnyway').onclick = () => { turnDismissed = true; askToTurn(); };
addEventListener('resize', () => { fit(); askToTurn(); });

// ---------------- in and out ----------------
let on = 0, onTo = 0;
$('enter').onclick = () => {
  entered = true;
  lyricsEl.style.visibility = '';
  $('lobby').classList.add('gone');
  setTimeout(() => { onTo = 1; }, 500);
  setTimeout(startPlayer, 900);
  askToTurn();
  wake();
};
function leave() {   // like the end of a film: the picture fades to black, back to the karaoke list
  if (leave.done) return; leave.done = true;
  entered = false; pause(); onTo = 0;
  setTimeout(() => document.body.classList.add('fading'), 500);
  setTimeout(() => { try { sessionStorage.setItem('kinoOut', '1'); } catch (er) { /* no storage */ } location.href = '/karaoke'; }, 1900);
}
if (qs.has('auto')) { entered = true; $('lobby').classList.add('gone'); on = onTo = 1; play(); }

let credited = false;
function credits() {
  return '<span class="ct">' + D.title + '</span><span class="cv">' + D.artist + ' · ' + D.year + '</span>' +
    '<span class="cl">Rap a text</span><span class="cv">' + D.artist + '</span>' +
    '<span class="cl">Karaoke</span><span class="cv">SKELO SQUAD</span>' +
    '<span class="cl">A hlavně</span><span class="cv">ty – díky, že sis zazpíval/a</span><span class="cs"></span>';
}

// ---------------- every frame ----------------
let last = performance.now(), wasPlaying = null, started = false;
fit();
function frame(ts) {
  requestAnimationFrame(frame);
  const dt = Math.min(.1, (ts - last) / 1000); last = ts;
  const t = now(), pl = playing();
  on += (onTo - on) * (1 - Math.exp(-dt * 2.5));
  if (pl) { const b = bassAt(t); bassAvg += (b - bassAvg) * (1 - Math.exp(-dt / .7)); beat = Math.max(beat * Math.exp(-dt / .2), Math.min(1, Math.max(0, b - bassAvg * 1.08) * 4.5)); }
  else beat *= Math.exp(-dt / .3);
  embers(dt, pl ? Math.min(1, beat * 1.2 + Math.max(0, bassAvg - .25) * .8) : 0);
  rimEl.style.setProperty('--k', (beat * on).toFixed(3)); rimEl.style.opacity = (.35 + .65 * on).toFixed(3);
  powerEl.style.opacity = (1 - on).toFixed(3);
  const ended = entered && started && t > Math.min(duration() - 1.5, LAST_END + 6);
  if (ended && !credited) {
    credited = true; onTo = .15; $('roll').innerHTML = credits(); $('credits').hidden = false; $('credits').classList.add('run');
    if (sfx && panel) sfx.finale([panel[0], panel[1], [(panel[0][0] + panel[1][0]) / 2, panel[0][1] - 20], panel[3], panel[2]]);
  }
  // where in the song we are: the chorus (hyperspace)
  let si = -1; for (let s = 0; s < D.times.length && D.times[s][0] <= t; s++) si = s;
  const chorus = pl && si >= 0 && isChorus[si] && t <= D.times[si][1] + 2;
  if (sfx) sfx.frame(dt, { t, playing: pl, energy: Math.min(1, bassAvg * 1.6), chorus });
  if (!ended && credited) { credited = false; onTo = 1; $('credits').hidden = true; $('credits').classList.remove('run'); }
  { const ct = bg.currentTime, du = bg.duration || 9; glitch.style.opacity = (ct < 1.1 ? 1 : ct < 1.4 ? 1 - (ct - 1.1) / .3 : ct > du - .2 ? (ct - du + .2) / .2 : 0).toFixed(3); }
  if (entered) words(t);
  drawSmoke(dt);
  if (pl && !started && (!clock || clock.time() > .3)) { started = true; if (clock) poster.style.display = 'none'; }
  if (clock && clock.time() > .3) catcher.classList.toggle('paused', !pl);
  $('fill').style.width = (t / duration() * 100) + '%';
  $('time').textContent = fmt(t) + ' / ' + fmt(duration());
  if (pl !== wasPlaying) { wasPlaying = pl; $('ppIcon').innerHTML = pl ? '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>' : '<path d="M8 5v14l11-7z"/>'; }
}
requestAnimationFrame(frame);

// the loading screen stays up until the space video can play (at most 12 s)
let ready = false;
const done = () => { if (ready) return; ready = true; if (window.kinoLoaded) window.kinoLoaded(); };
bg.addEventListener('canplaythrough', done, { once: true });
bg.addEventListener('loadeddata', () => setTimeout(done, 400), { once: true });
setTimeout(done, 12000);
if (window.kinoProgress) bg.addEventListener('progress', () => { try { const b = bg.buffered; if (b.length && bg.duration) window.kinoProgress(b.end(b.length - 1) / bg.duration); } catch (er) { /* not yet */ } });
