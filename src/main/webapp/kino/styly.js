// Karaoke kino – styly zpívání (2026-11-10, nahrazují pokoje Prostor a Ořechový salon, ty zůstávají v souborech):
//   l  Lyric video   – klip přes celou obrazovku, slova vlétají jako v lyric videu, pulzují do basů (výchozí)
//   o  Kouř a oheň   – klip jako žhnoucí deska, text se vypaluje, z hrotu zpívaného slova sypou jiskry
//   c  Čisté plátno  – tma, plátno uprostřed, text pod ním, jemné kontury v barvách klipu
//   t  Tunel         – slova přilétají z hloubky světelného tunelu, kruhy jedou do basů
//   u  Ulice         – klip přes celou obrazovku, kouř z webu, uhlíky, text sprejem s kapkami
//   g  Galerie       – klip v HUD rámečku v tmavém sále, světlo do kouřové podlahy, text na skle
// Klip hraje přes přehrávač YouTube (YtClock = čas klipu), barvy a basy jsou z eq/<id>.json, časy slov z karaoke.
// Ovládání, lobby, odchod a titulky na konci jsou ve WEB-INF/views/kino.jsp (stejně jako u pokojů).
const D = window.KDATA;
const qs = new URLSearchParams((location.search.slice(1) + '&' + location.hash.slice(1)).replace(/;/g, '&'));
const SIM = qs.has('sim') || location.protocol === 'file:';
const STYLE = window.KINO_STYLE || 'l';
const LAST_END = D.times[D.times.length - 1][1];
const PHONE = Math.min(innerWidth, innerHeight) < 600;
const STILL = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (id) => document.getElementById(id);
const VER = new URL(import.meta.url).search;
document.body.dataset.look = 'st';
document.body.classList.add('st-' + STYLE);
{ const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/kino/styly.css' + VER; document.head.appendChild(l); }

$('tagTitle').textContent = D.title;
$('tagArtist').textContent = D.artist + ' · ' + D.year;
$('lobbyTitle').textContent = D.title;
$('lobbyArtist').textContent = D.artist;
$('titleCard').querySelector('b').textContent = D.title;
$('titleCard').querySelector('span').textContent = D.artist;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// slova řádku k s časy (bez časů se čas řádku rozdělí rovnoměrně)
function words(k) {
  const ws = D.lines[k].split(/\s+/).filter(Boolean); let w = D.words[k];
  if (!w || w.length !== ws.length) { const a = D.times[k][0], d = (D.times[k][1] - a) / ws.length; w = ws.map((_, i) => [a + i * d, a + (i + 1) * d]); }
  return ws.map((t, i) => ({ t, a: w[i][0], b: w[i][1] }));
}
// řádek, který se zpívá (přepne se přesně se svým prvním slovem)
function lineAt(t) { let i = -1; for (let k = 0; k < D.times.length; k++) if (D.times[k][0] - .05 <= t) i = k; return i; }
// před rapem je dole prázdno: první řádek se ukáže až 2 s před prvním veršem (ostatní řádky podle stylu)
const FIRST_LEAD = 2;
function tooEarly(t) { return !D.times.length || t < D.times[0][0] - FIRST_LEAD; }

// ---------------- basy a barvy klipu (eq/<id>.json) ----------------
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const E = D.eq, EN = unb64(E.energy), CL = unb64(E.l), CR = unb64(E.r), CB = unb64(E.b);
let bass = 0;
const GOLD = [230, 183, 48];
const pal = { l: [40, 40, 40], r: [40, 40, 40], b: [40, 40, 40], acc: GOLD.slice() };
const avg = (arr, n, f) => { const s = [0, 0, 0]; for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) s[c] += arr[(f * n + i) * 3 + c] || 0; return s.map((v) => v / n); };
function vivid(c) {   // barva z klipu → sytá a světlá, aby svítila na černé
  const r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0; if (d) { h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  const s = Math.max(.65, d / (1 - Math.abs(mx + mn - 1) || 1)), l = .6, C = (1 - Math.abs(2 * l - 1)) * s, X = C * (1 - Math.abs((h / 60) % 2 - 1)), m = l - C / 2;
  const o = h < 60 ? [C, X, 0] : h < 120 ? [X, C, 0] : h < 180 ? [0, C, X] : h < 240 ? [0, X, C] : h < 300 ? [X, 0, C] : [C, 0, X];
  return o.map((v) => Math.round((v + m) * 255));
}
const rgb = (c) => 'rgb(' + c.map(Math.round).join(',') + ')';
const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const sat = (c) => Math.max(...c) - Math.min(...c);
const root = document.documentElement;
function sense(t, dt) {
  const f = Math.min(E.frames - 1, Math.max(0, Math.floor(t * E.fps)));
  let v = 0; for (let b = 0; b < 4; b++) v += EN[f * (E.bands || 16) + b] || 0; v /= 4 * 255;
  bass += (v - bass) * (1 - Math.exp(-dt * (v > bass ? 30 : 7)));
  const cf = Math.min((E.cframes || 1) - 1, Math.max(0, Math.floor(t * (E.cfps || 4))));
  const l = avg(CL, E.rows || 12, cf), r = avg(CR, E.rows || 12, cf), bb = avg(CB, E.cols || 16, cf);
  const k = 1 - Math.exp(-dt * 2);
  pal.l = mix(pal.l, l, k); pal.r = mix(pal.r, r, k); pal.b = mix(pal.b, bb, k);
  // barva písně z vyhlazených okrajů obrazu; skoro černobílý klip nemá z čeho brát (odstín by náhodně skákal po kruhu
  // a zprůměroval se do šedé) – pak zlatá barva kina
  const cand = [pal.l, pal.r, pal.b].sort((x, y) => sat(y) - sat(x))[0];
  pal.acc = mix(pal.acc, sat(cand) < 22 ? GOLD : vivid(cand), 1 - Math.exp(-dt * .8));
  root.style.setProperty('--bass', bass.toFixed(3));
  root.style.setProperty('--l', rgb(pal.l)); root.style.setProperty('--r', rgb(pal.r)); root.style.setProperty('--b', rgb(pal.b));
  root.style.setProperty('--acc', rgb(pal.acc));
}

// ---------------- scéna ----------------
const stage = document.createElement('div');
stage.className = 'st-stage';
document.body.prepend(stage);
const host = document.createElement('div');   // sem přijde přehrávač YouTube (každý styl ho umístí jinam)
host.className = 'st-player';
const poster = document.createElement('img'); poster.className = 'st-poster'; poster.alt = '';
poster.src = D.thumb.replace('hqdefault', 'maxresdefault'); poster.onerror = () => { poster.onerror = null; poster.src = D.thumb; };
host.appendChild(poster);
const lyr = document.createElement('div'); lyr.className = 'st-lyr'; lyr.setAttribute('aria-hidden', 'true');
const STYLES = {};

// ===== 1 · Lyric video =====
// Text stojí pořád na jednom místě: dole vlevo, každý řádek začíná na stejném bodě (oči se vrací na jedno místo,
// dá se recitovat). Celý řádek je vidět předem šedě, slova se rozsvěcují při zpěvu, pod ním menší další řádek.
// Vybráno z náhledu Skeli.cz-podklady/navrhy/karaoke-titulky (varianta B), 2026-11-15.
const LEAD = 1.2;   // o kolik sekund dřív se řádek ukáže
// Písmo a animace naskakování (Nastavení → Vzhled, tlačítko Aa v kině): window.KLOOK = { font, anim, caps }.
// Animace: délka a krok mezi písmeny; --k je zkrátí, aby řádek doběhl dřív, než zazní první slovo (rychlý rap).
const ANIM = { blur: [.7, .022, "i"], mask: [.6, .07, "wi"], type: [0, .038, "i"], glitch: [.55, .25, "r"], flip: [.7, .03, "i"], smoke: [1.2, .018, "i"], wave: [.8, .028, "i"] };
function look() { return window.KLOOK || {}; }
window.kinoApplyLook = function () {
  const L = look(), r = document.documentElement.style;
  if (L.family) r.setProperty("--kfont", "'" + L.family + "'"); else r.removeProperty("--kfont");
  r.setProperty("--kcase", L.caps === false ? "none" : "uppercase");
};
window.kinoApplyLook();
// Kdy se ukáže řádek k: nejdřív LEAD před svým začátkem, ale ne dřív, než dozní předchozí řádek
// (dřív nový řádek přepsal ten, který se ještě zpíval); vždy aspoň chvilku před prvním slovem.
function showAt(k) {
  if (!k) return D.times[0][0] - FIRST_LEAD;
  const start = D.times[k][0], prevEnd = D.times[k - 1][1];
  return Math.min(start - .15, Math.max(start - LEAD, prevEnd + .05));
}
function lineHtml(i, t) {
  const anim = ANIM[look().anim];
  const ws = words(i);
  if (!anim) return ws.map((w) => '<span class="w" data-a="' + w.a + '" data-b="' + w.b + '">' + esc(w.t) + '</span>').join(" ");
  let n = 0;
  return ws.map((w, wi) => '<span class="w" data-a="' + w.a + '" data-b="' + w.b + '" style="--wi:' + wi + '">'
    + Array.from(w.t).map((c) => '<span class="ch" style="--i:' + (n++) + ';--r:' + Math.random().toFixed(2) + ';--dx:' + (Math.random() * 2 - 1).toFixed(2) + '">' + esc(c) + '</span>').join("")
    + '</span>').join(" ");
}
STYLES.l = {
  build() {
    stage.innerHTML = '<div class="l-video"></div><div class="l-shade"></div><div class="l-sub"><span class="cur"></span><span class="nxt"></span></div>';
    stage.querySelector('.l-video').appendChild(host);
    this.key = -2; this.cur = stage.querySelector('.l-sub .cur'); this.nxt = stage.querySelector('.l-sub .nxt');
  },
  frame(t) {
    if (this.lv !== look().v) { this.lv = look().v; this.key = -2; }   // změna písma / animace = překreslit řádek
    let i = -1; for (let k = 0; k < D.times.length; k++) if (showAt(k) <= t) i = k;
    // dlouhá pauza po řádku (a další ještě není na řadě) = prázdno
    const show = i >= 0 && t > D.times[i][1] + 2.5 && (i + 1 >= D.lines.length || D.times[i + 1][0] - t > LEAD) ? -1 : i;
    if (show !== this.key) {
      this.key = show;
      const anim = ANIM[look().anim];
      this.cur.innerHTML = show < 0 ? '' : lineHtml(show, t);
      this.nxt.textContent = show >= 0 && D.lines[show + 1] ? D.lines[show + 1] : '';
      this.cur.className = 'cur';
      if (show >= 0 && anim) {
        // celá animace musí doběhnout před prvním slovem: jinak se zkrátí (u rychlého rapu)
        const steps = anim[2] === "r" ? 1 : anim[2] === "wi" ? words(show).length : this.cur.querySelectorAll(".ch").length;
        const total = anim[0] + anim[1] * steps, room = Math.max(.25, D.times[show][0] - t - .05);
        this.cur.style.setProperty("--k", Math.min(1, room / total).toFixed(3));
        void this.cur.offsetWidth; this.cur.classList.add('a-' + look().anim);
      } else { void this.cur.offsetWidth; this.cur.classList.add('swap'); }
    }
    this.cur.querySelectorAll('.w').forEach((w) => {
      const a = +w.dataset.a, b = +w.dataset.b;
      w.classList.toggle('on', t >= a - .03); w.classList.toggle('now', t >= a - .03 && t <= b + .05);
    });
    // Rubik Wet Paint: občas (asi jednou za 3 s) kápne z rozsvíceného písmene kapka barvou textu
    if (look().font === "rubikwet" && !document.documentElement.classList.contains("low-fx") && t - (this.dripAt || 0) > 2.2 + Math.random() * 2.5) {
      this.dripAt = t;
      const lit = this.cur.querySelectorAll(".w.on"); const w = lit[Math.floor(Math.random() * lit.length)];
      if (w) {
        const box = this.cur.parentNode.getBoundingClientRect(), r = w.getBoundingClientRect(), d = document.createElement("i");
        d.className = "drip"; d.style.left = (r.left - box.left + Math.random() * r.width) + "px"; d.style.top = (r.bottom - box.top - r.height * .18) + "px";
        this.cur.parentNode.appendChild(d); setTimeout(() => d.remove(), 1700);
      }
    }
  }
};

// ===== 2 · Kouř a oheň =====
STYLES.o = {
  build() {
    stage.innerHTML = '<div class="o-bg"></div><div class="o-smoke"></div><div class="o-plate"></div><canvas class="o-sparks"></canvas><div class="o-lyr"><div class="slot"></div><div class="slot"></div></div>';
    stage.querySelector('.o-plate').appendChild(host);
    this.cv = stage.querySelector('.o-sparks'); this.g = this.cv.getContext('2d'); this.shown = [null, null]; this.sparks = [];
    this.slots = [...stage.querySelectorAll('.o-lyr .slot')];
  },
  fill(slot, j) {
    if (this.shown[slot] === j) return; this.shown[slot] = j;
    const box = this.slots[slot], old = box.querySelector('.ln:not(.out)');
    if (old) { old.classList.add('out'); setTimeout(() => old.remove(), 400); }
    if (j === null || j >= D.lines.length) return;
    box.insertAdjacentHTML('beforeend', '<span class="ln in">' + words(j).map((w) => '<span class="w" data-t="' + esc(w.t) + '" data-a="' + w.a + '" data-b="' + w.b + '">' + esc(w.t) + '</span>').join(' ') + '</span>');
  },
  frame(t, dt) {
    const i = lineAt(t), n = D.lines.length;
    if (i < 0 && tooEarly(t)) { this.fill(0, null); this.fill(1, null); }
    else if (i < 0) { this.fill(0, 0); this.fill(1, n > 1 ? 1 : null); } else { this.fill(i % 2, i); this.fill((i + 1) % 2, i + 1 < n ? i + 1 : null); }
    this.slots.forEach((s, q) => s.classList.toggle('act', i >= 0 && q === i % 2));
    const cv = this.cv, g = this.g, dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const acc = rgb(pal.acc);
    stage.querySelectorAll('.o-lyr .ln:not(.out) .w').forEach((w) => {
      const a = +w.dataset.a, b = +w.dataset.b, k = Math.max(0, Math.min(1, (t - a) / Math.max(.08, b - a)));
      w.style.setProperty('--k', k); w.classList.toggle('done', t > b + .2); w.classList.toggle('gone', t > b + 1.3);
      // z hrotu zpívaného slova sypou jiskry, víc do basů
      if (!STILL && k > 0 && k < 1 && Math.random() < (.25 + bass) * dt * 60 * .5) {
        const r = w.getBoundingClientRect();
        this.sparks.push({ x: r.left + r.width * k, y: r.top + r.height * .5, vx: (Math.random() - .5) * 90, vy: -60 - Math.random() * 150 - bass * 180, life: 1 });
      }
    });
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
    this.sparks = this.sparks.filter((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 110 * dt; p.life -= dt * 1.1; return p.life > 0; });
    for (const p of this.sparks) { g.globalAlpha = p.life; g.fillStyle = p.life > .7 ? '#fff4d8' : acc; g.beginPath(); g.arc(p.x, p.y, 1.1 + p.life * 1.4, 0, 6.3); g.fill(); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
};

// ===== 3 · Čisté plátno =====
STYLES.c = {
  build() {
    stage.innerHTML = '<svg class="c-cont" viewBox="0 0 1000 1000" preserveAspectRatio="none">' + '<path/>'.repeat(8) + '</svg><div class="c-screen"></div><div class="c-lyr"><div class="cur"></div><div class="nxt"></div></div>';
    stage.querySelector('.c-screen').appendChild(host);
    this.paths = [...stage.querySelectorAll('.c-cont path')]; this.key = null; this.energy = 0;
  },
  // kontura: tenká vlnitá čára nad nebo pod plátnem; v klidu se skoro nehýbe, s energií písně se rozvlní a rozsvítí
  contour(i, t) {
    const top = i < 4, y0 = top ? 60 + i * 22 : 940 - (i - 4) * 22, amp = 6 + i % 4 * 2 + this.energy * 30, ph = t * (.05 + this.energy * .2 + (i % 4) * .015) + i;
    let d = 'M -20 ' + y0;
    for (let x = 0; x <= 1040; x += 40) d += ' L ' + x + ' ' + (y0 + Math.sin(x / (150 + i * 25) + ph) * amp + Math.sin(x / 63 + ph * 1.7) * amp * .22).toFixed(1);
    return d;
  },
  frame(t, dt) {
    this.energy += (bass - this.energy) * (1 - Math.exp(-dt * 1.2));   // pomalá energie písně (ne každý úder)
    this.paths.forEach((p, k) => {
      p.setAttribute('d', this.contour(k, t));
      p.setAttribute('stroke', k % 2 ? rgb(pal.l) : rgb(pal.acc));
      p.style.opacity = (.04 + Math.pow(this.energy, 1.5) * .55 * (1 - (k % 4) * .15)).toFixed(3);
    });
    const i = lineAt(t), early = i < 0 && tooEarly(t);
    if ((early ? -2 : i) !== this.key) {
      this.key = early ? -2 : i;
      const line = i >= 0 ? i : 0, cur = stage.querySelector('.c-lyr .cur');
      const el = document.createElement('div'); el.className = 'cur in';
      el.innerHTML = early ? '' : words(line).map((w) => '<span class="w" data-a="' + w.a + '" data-b="' + w.b + '">' + esc(w.t) + '</span>').join(' ');
      cur.replaceWith(el);
      stage.querySelector('.c-lyr .nxt').textContent = early ? '' : D.lines[line + 1] || '';   // před prvním veršem je „teď“ 1. řádek, další tedy 2. (dřív se 1. ukázal dvakrát)
    }
    stage.querySelectorAll('.c-lyr .cur .w').forEach((w) => { const a = +w.dataset.a, b = +w.dataset.b; w.classList.toggle('on', t >= a); w.classList.toggle('done', t > b + .15); });
  }
};

// ===== 4 · Tunel =====
STYLES.t = {
  build() {
    stage.innerHTML = '<div class="t-scene"><div class="t-video"></div><div class="t-words"></div></div><div class="t-hint"></div>';
    const sc = stage.querySelector('.t-scene');
    stage.querySelector('.t-video').appendChild(host);
    this.rings = [];
    for (let i = 0; i < 8; i++) { const r = document.createElement('div'); r.className = 't-ring'; sc.insertBefore(r, sc.firstChild); this.rings.push({ el: r, z: -1800 + i * 240 }); }
    this.key = null; this.fw = []; this.box = stage.querySelector('.t-words');
    if (document.fonts) document.fonts.ready.then(() => this.place());
  },
  // slova do řádků podle opravdové šířky (max. 86 % obrazovky), řádky kolem středu
  place() {
    const W = innerWidth, max = W * .72, rows = [[]], gap = 14; let rw = 0;
    this.fw.forEach((f) => { f.wd = f.el.offsetWidth; if (rows[rows.length - 1].length && rw + gap + f.wd > max) { rows.push([]); rw = 0; } rows[rows.length - 1].push(f); rw += (rw ? gap : 0) + f.wd; });
    const lh = this.fw.length ? this.fw[0].el.offsetHeight * 1.05 : 40;
    rows.forEach((r, ri) => { let x = (W - (r.reduce((s, f) => s + f.wd, 0) + gap * (r.length - 1))) / 2; r.forEach((f) => { f.x = x; f.y = (ri - (rows.length - 1) / 2) * lh - lh / 2; x += f.wd + gap; }); });
  },
  frame(t, dt) {
    for (const r of this.rings) {
      r.z += dt * (STILL ? 0 : 220 + bass * 700); if (r.z > 260) r.z -= 1920;
      const op = Math.max(0, Math.min(1, (r.z + 1800) / 700)) * Math.max(0, Math.min(1, (260 - r.z) / 260));
      r.el.style.transform = 'translateZ(' + r.z.toFixed(0) + 'px) rotate(' + (r.z / 24).toFixed(1) + 'deg)';
      r.el.style.opacity = (op * (.22 + bass * .5)).toFixed(3);
    }
    const i = lineAt(t > 0 ? t + .8 : t);   // slova přilétají předem, řádek se ukáže 0,8 s dřív
    const early = i < 0 && tooEarly(t);
    if ((early ? -2 : i) !== this.key) {
      // odzpívaná slova proletí kolem diváka ven
      this.fw.forEach((f) => { f.el.classList.add('past'); f.el.style.transform = 'translate(' + (f.x + (f.x - innerWidth / 2) * .8).toFixed(0) + 'px,' + (f.y * 1.8).toFixed(0) + 'px) translateZ(500px)'; f.el.style.opacity = '0'; setTimeout(() => f.el.remove(), 700); });
      this.key = early ? -2 : i; this.fw = [];
      if (i >= 0) {
        words(i).forEach((w) => { const el = document.createElement('span'); el.className = 'fw'; el.textContent = w.t; this.box.appendChild(el); this.fw.push({ el, a: w.a, b: w.b }); });
        this.place();
      }
      stage.querySelector('.t-hint').textContent = early ? '' : D.lines[i + 1] || '';
    }
    // slovo přilétá z hloubky a dorazí přesně ve chvíli, kdy se má zpívat
    for (const f of this.fw) {
      const u = Math.max(0, Math.min(1, (t - (f.a - .7)) / .7)), e = 1 - Math.pow(1 - u, 3), z = -900 * (1 - e);
      f.el.style.transform = 'translate(' + f.x.toFixed(0) + 'px,' + f.y.toFixed(0) + 'px) translateZ(' + z.toFixed(0) + 'px)';
      f.el.style.opacity = u.toFixed(2);
      f.el.classList.toggle('sung', t >= f.a);
    }
  }
};

// ===== Společné pro Ulici a Galerii: kouř z webu (js/smoke.js), plátno s uhlíky / světluškami, řádek s přechodem =====
// Kouř bere barvu klipu (--acc) přes --accent na body; pod kurzorem prosvítá. Bez WebGL / při omezení pohybu zůstane klidný přechod.
function smokeEdge(h) {
  const s = document.createElement('div'); s.className = 'smoke-edge b'; s.style.height = h; s.innerHTML = '<canvas></canvas>';
  stage.appendChild(s);
  if (!document.querySelector('script[src^="/js/smoke.js"]')) { const sc = document.createElement('script'); sc.src = '/js/smoke.js' + VER; document.body.appendChild(sc); }
}
// částice: 'ember' = uhlík stoupá zdola, 'fly' = světluška pluje; myš je rozfoukává jako vítr (stejně jako jiskry na webu)
let mx = -1e4, my = -1e4, mvx = 0, mvy = 0;
addEventListener('pointermove', (e) => { mvx = e.clientX - mx; mvy = e.clientY - my; mx = e.clientX; my = e.clientY; }, { passive: true });
function mkFx() { const cv = document.createElement('canvas'); cv.className = 'st-fx'; stage.appendChild(cv); return { cv, g: cv.getContext('2d'), P: [] }; }
function particles(fx, kind, n, t, dt) {
  const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight, g = fx.g, warm = kind === 'ember';
  if (fx.cv.width !== Math.round(W * dpr) || fx.cv.height !== Math.round(H * dpr)) { fx.cv.width = Math.round(W * dpr); fx.cv.height = Math.round(H * dpr); }
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  if (STILL) return;
  if (PHONE) n = Math.round(n * .55);
  while (fx.P.length < n) fx.P.push({ x: Math.random() * W, y: warm ? H * (.6 + Math.random() * .45) : Math.random() * H, r: .6 + Math.random() * 1.8, ph: Math.random() * 6.3, s: .3 + Math.random() * .7, dx: 0, dy: 0, a: .4 + Math.random() * .6 });
  g.globalCompositeOperation = 'lighter';
  const acc = rgb(pal.acc);
  for (const p of fx.P) {
    const ddx = p.x - mx, ddy = p.y - my, d2 = ddx * ddx + ddy * ddy;
    if (d2 < 14000) { const f = (1 - d2 / 14000) * .35; p.dx += mvx * f * .3 + ddx * f * .02; p.dy += mvy * f * .3 + ddy * f * .02; }
    p.dx *= .95; p.dy *= .95;
    if (warm) { p.y -= (14 + p.s * 30) * (1 + bass * 1.4) * dt; p.x += Math.sin(t * .9 + p.ph) * 12 * dt; }
    else { p.y -= p.s * 6 * dt; p.x += Math.sin(t * .4 + p.ph) * 10 * dt; }
    p.x += p.dx * dt * 10; p.y += p.dy * dt * 10;
    if (p.y < -10 || p.x < -20 || p.x > W + 20) { p.x = Math.random() * W; p.y = warm ? H + 5 : H * Math.random(); p.dx = p.dy = 0; }
    const tw = .5 + .5 * Math.sin(t * (warm ? 6 : 1.6) + p.ph);
    g.globalAlpha = p.a * tw * (warm ? Math.min(1, (p.y / H) * 1.6) : 1);
    g.fillStyle = warm ? (p.r > 1.6 ? '#ffd29a' : '#ff8a3a') : acc;
    g.shadowColor = warm ? '#ff6a1a' : acc; g.shadowBlur = warm ? 6 : 10;
    g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.3); g.fill();
  }
  g.shadowBlur = 0; g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  mvx *= .8; mvy *= .8;
}
// který řádek ukázat: stejné časování jako Lyric video (showAt), po dlouhé pauze prázdno
function lineShown(t) {
  let i = -1; for (let k = 0; k < D.times.length; k++) if (showAt(k) <= t) i = k;
  return i >= 0 && t > D.times[i][1] + 2.5 ? -1 : i;
}
// nový řádek .in, starý dostane .old a po chvíli zmizí; vrací slova s časy
function lineEl(cls, i, box) {
  const old = box.querySelector('.' + cls + ':not(.old)');
  if (old) { old.classList.add('old'); old.classList.remove('in'); setTimeout(() => old.remove(), 900); }
  const ws = []; if (i < 0) return ws;
  const el = document.createElement('div'); el.className = cls + ' in';
  words(i).forEach((w, k) => {
    const we = document.createElement('span'); we.className = 'w'; we.textContent = w.t; we.style.setProperty('--wi', k);
    el.appendChild(we); el.appendChild(document.createTextNode(' ')); ws.push({ el: we, a: w.a, b: w.b });
  });
  box.appendChild(el); return ws;
}

// ===== 5 · Ulice =====
// Klip přes celou obrazovku, zespodu se valí kouř z webu v barvě klipu a stoupají uhlíky (myš je rozfoukává).
// Text nastříkaný sprejem (Rubik Wet Paint, nebo písmo z volby Aa), zpívané slovo má barvu klipu a občas z něj steče kapka.
// Vybráno z náhledu Skeli.cz-podklady/navrhy/karaoke-styly-2/index2.html (2026-11-15).
STYLES.u = {
  build() {
    stage.innerHTML = '<div class="u-vid"></div><div class="u-shade"></div><div class="u-lyr"><div class="u-box"></div><span class="nxt"></span></div>';
    stage.querySelector('.u-vid').appendChild(host);
    smokeEdge(PHONE ? '46vh' : '58vh');
    this.fx = mkFx(); this.box = stage.querySelector('.u-box'); this.nxt = stage.querySelector('.u-lyr .nxt'); this.key = -2; this.ws = []; this.drops = [];
  },
  frame(t, dt) {
    if (this.lv !== look().v) { this.lv = look().v; this.key = -2; }
    const i = lineShown(t);
    if (i !== this.key) { this.key = i; this.ws = lineEl('u-cur', i, this.box); this.nxt.textContent = i >= 0 && D.lines[i + 1] ? D.lines[i + 1] : ''; }
    particles(this.fx, 'ember', 46, t, dt);
    const g = this.fx.g, acc = rgb(pal.acc);
    for (const w of this.ws) {
      const on = t >= w.a - .03, now = on && t <= w.b + .05;
      w.el.classList.toggle('on', on); w.el.classList.toggle('now', now);
      // jen detail: nejvýš jedna kapka a další až za 4–9 s
      if (!STILL && now && t >= (this.nextDrop || 0) && w.b - w.a > .25 && Math.random() < dt * 1.5) {
        this.nextDrop = t + 4 + Math.random() * 5;
        const r = w.el.getBoundingClientRect();
        this.drops.push({ x: r.left + r.width * (.15 + Math.random() * .7), y: r.top + r.height * .82, len: 0, v: 0, life: 1, w: 2 + Math.random() * 2.5, grow: 1 });
      }
    }
    this.drops = this.drops.filter((d) => {
      if (d.grow > 0) { d.grow -= dt * 1.4; d.len += dt * 10; } else { d.v += 120 * dt; d.y += d.v * dt; d.len = Math.min(26, d.len + d.v * dt * .4); d.life -= dt * .7; }
      g.globalAlpha = Math.max(0, d.life); g.fillStyle = acc;
      g.beginPath(); g.ellipse(d.x, d.y + d.len, d.w, d.w * 1.25, 0, 0, 6.3); g.fill();
      g.fillRect(d.x - d.w * .45, d.y, d.w * .9, d.len);
      return d.life > 0 && d.y < innerHeight;
    });
    g.globalAlpha = 1;
  }
};

// ===== 6 · Galerie =====
// Tmavý sál, klip v HUD rámečku jako na Hudbě (rohy, skenovací linky, štítek), z plátna padá světlo do kouřové podlahy,
// plují světlušky. Text na skle v barvě klipu, slovo se při zpěvu zleva naplní světlem.
STYLES.g = {
  build() {
    stage.innerHTML = '<div class="g-rays"></div><div class="g-glow"></div><div class="g-screen"><div class="g-tag">▶ <b>' + esc(D.title) + '</b> · ' + esc(D.artist) + ' · ' + esc(D.year) + '</div>'
      + '<div class="g-vid"></div><div class="g-scan"></div><div class="g-hud"><i></i><i></i><i></i><i></i></div></div><div class="g-lyr"><div class="g-box"></div><span class="nxt"></span></div>';
    stage.querySelector('.g-vid').appendChild(host);
    smokeEdge(PHONE ? '24vh' : '30vh');
    this.fx = mkFx(); this.box = stage.querySelector('.g-box'); this.nxt = stage.querySelector('.g-lyr .nxt'); this.key = -2; this.ws = [];
  },
  frame(t, dt) {
    if (this.lv !== look().v) { this.lv = look().v; this.key = -2; }
    const i = lineShown(t);
    if (i !== this.key) { this.key = i; this.ws = lineEl('g-cur', i, this.box); this.nxt.textContent = i >= 0 && D.lines[i + 1] ? D.lines[i + 1] : ''; }
    for (const w of this.ws) w.el.style.setProperty('--gk', Math.max(0, Math.min(1, (t - w.a) / Math.max(.12, w.b - w.a))).toFixed(3));
    particles(this.fx, 'fly', 34, t, dt);
  }
};

const S = STYLES[STYLE] || STYLES.l;
S.build();
addEventListener('resize', () => { if (S.place) S.place(); });

// ---------------- hodiny klipu ----------------
let clock = null, simT = parseFloat(qs.get('t') || '0'), simPlaying = false, simAt = performance.now();
const now = () => clock ? clock.time() : simT + (simPlaying ? (performance.now() - simAt) / 1000 : 0);
const playing = () => clock ? clock.playing() : simPlaying;
const duration = () => clock && clock.duration() ? clock.duration() : Math.max(LAST_END + 8, 30);
function play() { if (clock) clock.play(); else if (!simPlaying) { simAt = performance.now(); simPlaying = true; } }
function pause() { if (clock) clock.pause(); else if (simPlaying) { simT = now(); simPlaying = false; } }
function seek(t) { t = Math.max(0, Math.min(duration() - .5, t)); if (clock) clock.seek(t); else { simT = t; simAt = performance.now(); } }
const catcher = document.createElement('div'); catcher.className = 'st-catch'; host.appendChild(catcher);
function startPlayer() {
  if (SIM) { play(); return; }
  const f = document.createElement('iframe');
  f.src = 'https://www.youtube-nocookie.com/embed/' + D.yt + '?enablejsapi=1&autoplay=1&controls=0&cc_load_policy=0&disablekb=1&fs=0&rel=0&playsinline=1&iv_load_policy=3&modestbranding=1&origin=' + encodeURIComponent(location.origin);
  f.allow = 'autoplay; encrypted-media; picture-in-picture';
  f.title = D.title;
  host.insertBefore(f, catcher);
  // YouTube ukazuje automatické titulky, když je má divák zapnuté: vypnout (i později znovu)
  const noCaptions = () => ['captions', 'cc'].forEach((m) => { try { f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unloadModule', args: [m], id: 1, channel: 'widget' }), '*'); } catch (er) { /* pryč */ } });
  clock = new window.YtClock(f, noCaptions);
  [800, 2000, 4000, 8000].forEach((ms) => setTimeout(noCaptions, ms));
  catcher.onclick = () => (playing() ? pause() : play());
  // Telefon (přísné pravidlo zvuku): když se video do 3 s samo nespustí, ťuknutí jde přímo do přehrávače YouTube
  // (ze stránky ho prohlížeč pustit nedovolí, přímo v něm ano – ověřeno). Velké ▶ ukáže kam; po rozjetí zmizí.
  setTimeout(() => { if (!started) host.classList.add('st-tap'); }, 3000);
}

// ---------------- ovládání (stejné jako v pokojích) ----------------
const fmt = (s) => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); };
const bar = $('bar');
D.times.forEach((tt) => { const i = document.createElement('i'); i.className = 'tick'; i.style.left = (tt[0] / duration() * 100) + '%'; bar.appendChild(i); });
bar.onclick = (ev) => { const r = bar.getBoundingClientRect(); seek((ev.clientX - r.left) / r.width * duration()); };
$('pp').onclick = () => (playing() ? pause() : play());
$('back5').onclick = () => seek(now() - 5);
$('fwd5').onclick = () => seek(now() + 5);
$('vol').oninput = (ev) => { if (clock) clock.setVolume(+ev.target.value); };
const fsRoot = document.documentElement, fsOn = () => document.fullscreenElement || document.webkitFullscreenElement;
const fsEnter = fsRoot.requestFullscreen || fsRoot.webkitRequestFullscreen, fsExit = document.exitFullscreen || document.webkitExitFullscreen;
if (!fsEnter) $('fs').hidden = true;
$('fs').onclick = () => { try { const r = fsOn() ? fsExit.call(document) : fsEnter.call(fsRoot); if (r && r.catch) r.catch(() => {}); } catch (e) { /* teď nejde */ } };
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
let turnDismissed = false;   // telefon na výšku: požádat o otočení (Lyric video a Čisté plátno jdou i na výšku)
function askToTurn() { $('rotate').hidden = !(PHONE && entered && !turnDismissed && innerHeight > innerWidth && (STYLE === 'o' || STYLE === 't')); }
$('rotateAnyway').onclick = () => { turnDismissed = true; askToTurn(); };
addEventListener('resize', askToTurn);

// ---------------- dovnitř a ven ----------------
$('enter').onclick = () => {
  entered = true;
  $('lobby').classList.add('gone');
  document.body.classList.add('st-in');
  // přehrávač hned v tomhle kliknutí: prohlížeče pustí zvuk jen „po kliknutí“ a 600 ms později už to za kliknutí
  // nepovažovaly – video v kině vůbec nezačalo hrát (ověřeno 13. 11. 2026 v Chrome s běžným pravidlem zvuku)
  startPlayer();
  askToTurn(); wake();
};
function leave() {   // jako konec filmu: obraz ztmavne, zpátky na stránku Karaoke
  if (leave.done) return; leave.done = true;
  entered = false; pause();
  setTimeout(() => document.body.classList.add('fading'), 300);
  setTimeout(() => { try { sessionStorage.setItem('kinoOut', '1'); } catch (er) { /* bez úložiště */ } location.href = '/karaoke'; }, 1500);
}
if (qs.has('auto')) { entered = true; $('lobby').classList.add('gone'); document.body.classList.add('st-in'); play(); }

let credited = false;
function credits() {
  return '<span class="ct">' + esc(D.title) + '</span><span class="cv">' + esc(D.artist) + ' · ' + D.year + '</span>' +
    '<span class="cl">Rap a text</span><span class="cv">' + esc(D.artist) + '</span>' +
    '<span class="cl">Karaoke</span><span class="cv">SKELO SQUAD</span>' +
    '<span class="cl">A hlavně</span><span class="cv">ty – díky, že sis zazpíval/a</span><span class="cs"></span>';
}

// ---------------- každý snímek ----------------
let last = performance.now(), wasPlaying = null, started = false;
function frame(ts) {
  requestAnimationFrame(frame);
  const dt = Math.min(.1, (ts - last) / 1000); last = ts;
  const t = now(), pl = playing();
  sense(pl ? t : Math.max(0, t), dt);
  if (entered) S.frame(t, dt);
  const titleCard = $('titleCard'); titleCard.classList.toggle('gone', t > D.times[0][0] - 1.2);
  const ended = entered && started && t > Math.min(duration() - 1.5, LAST_END + 6);
  if (ended && !credited) { credited = true; $('roll').innerHTML = credits(); $('credits').hidden = false; $('credits').classList.add('run'); }
  if (!ended && credited) { credited = false; $('credits').hidden = true; $('credits').classList.remove('run'); }
  if (pl && !started && (!clock || clock.time() > .3)) { started = true; host.classList.remove('st-tap'); if (clock) poster.style.opacity = '0'; }
  $('fill').style.width = (t / duration() * 100) + '%';
  $('time').textContent = fmt(t) + ' / ' + fmt(duration());
  if (pl !== wasPlaying) { wasPlaying = pl; $('ppIcon').innerHTML = pl ? '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>' : '<path d="M8 5v14l11-7z"/>'; }
}
requestAnimationFrame(frame);
// nic těžkého se nenačítá: hotovo, jakmile jsou písma
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { if (window.kinoLoaded) window.kinoLoaded(); });
