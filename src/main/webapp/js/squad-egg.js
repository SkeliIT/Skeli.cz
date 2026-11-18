// Easter egg v menu na telefonu (includes/header.jsp .nav-foot): kdo 7× ťukne na smajlíka loga dole v menu, spustí
// odhalení SKELO SQUAD. Kroužek ze 7 dílků kolem smajlíka ukazuje postup. Při každém odhalení se náhodně vybere jedna ze dvou verzí:
//  • „Srdce v tunelu“ – hučí tunel, na každý úder srdce se rozsvítí obličej, srdce se zastaví, šepot, srdce se znovu rozběhne;
//  • „Harfa“ – harfa stoupá A H C D E F Gis (ke každému tónu se nad smajlíkem rozechvěje struna), basa a kytara pozpátku
//    na napjatém E dur, pak hluboký úder, akord kytary A moll, šepot a srdce bije na pulsování nápisu.
// Hlasitosti harfy nastavil Skeli v náhledu (Skeli.cz-podklady/navrhy/menu-spodek, vyber.json menu.hlasitost).
// Zvuk (Web Audio, šepot = sounds/skelosquad-sepot.mp3) jen když návštěvník nemá zvuky webu vypnuté (js/sounds.js).
(function () {
  var foot = document.querySelector('.main-nav .nav-foot');
  if (!foot || foot.dataset.ready) return;
  foot.dataset.ready = '1';
  var seal = foot.querySelector('.sq-seal'), arena = foot.querySelector('.sq-arena'), sig = foot.querySelector('.sq-sig');
  var lampBox = arena.querySelector('.sq-lamps'), lamps = [].slice.call(lampBox.querySelectorAll('.sq-lamp'));
  var sign = arena.querySelector('.sq-sign'), unlock = arena.querySelector('.sq-unlock');
  var taps = 0, face = 0, running = false, resetT = 0, mode = null;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // struny nad smajlíky (rozechvějí se při brnknutí harfy a zase zmizí)
  var strs = lamps.map(function (l, i) { var s = document.createElement('i'); s.className = 'sq-str'; s.style.setProperty('--i', i); lampBox.appendChild(s); return s; });
  // struna se objeví ~150 ms před brnknutím (animace: nejdřív se rozsvítí, pak se s tónem rozechvěje)
  function twang(i) { if (still) return; var s = strs[i]; s.classList.remove('go'); void s.offsetWidth; s.classList.add('go'); }
  // EKG: při ťukání u verze se srdcem se v prostoru, kde se pak objeví obličeje, vykreslí kousek křivky tepu a zmizí
  var ekgBox = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  ekgBox.setAttribute('class', 'sq-ekg'); ekgBox.setAttribute('viewBox', '0 0 220 44'); ekgBox.setAttribute('aria-hidden', 'true');
  ekgBox.innerHTML = '<path pathLength="100" d="M0 26 H66 q6 -7 12 0 H90 l4 6 l6 -28 l6 36 l5 -14 H128 q10 -11 20 0 H220"/>';
  foot.appendChild(ekgBox);
  function ekg() { if (still) return; ekgBox.classList.remove('go'); void ekgBox.getBoundingClientRect(); ekgBox.classList.add('go'); }

  // ---------- zvuk ----------
  var ac = null, out = null, rev = null, whisperBuf = null;
  function muted() { try { return localStorage.getItem('soundMuted') === '1'; } catch (e) { return false; } }
  function audio() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return ac; }
    var C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    ac = new C();
    out = ac.createDynamicsCompressor(); out.threshold.value = -14; out.ratio.value = 4; out.connect(ac.destination);
    var len = Math.floor(ac.sampleRate * 4), b = ac.createBuffer(2, len, ac.sampleRate);   // dozvuk velkého prostoru
    for (var ch = 0; ch < 2; ch++) { var d = b.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4); }
    rev = ac.createConvolver(); rev.buffer = b; var rg = ac.createGain(); rg.gain.value = 0.7; rev.connect(rg); rg.connect(out);
    fetch('/sounds/skelosquad-sepot.mp3').then(function (r) { return r.arrayBuffer(); }).then(function (x) { return ac.decodeAudioData(x); }).then(function (x) { whisperBuf = x; }).catch(function () {});
    return ac;
  }
  function ok() { return !muted() && audio(); }
  function at(s) { return ac.currentTime + (s || 0); }
  function send(node, wet, pan) {
    var n = node;
    if (pan && ac.createStereoPanner) { var p = ac.createStereoPanner(); p.pan.value = pan; node.connect(p); n = p; }
    n.connect(out); if (wet) { var w = ac.createGain(); w.gain.value = wet; n.connect(w); w.connect(rev); }
  }
  var NOISE = {};   // šum pro tunel se spočítá jednou (dopředu po 1. ťuknutí), ne až při odhalení
  function noiseBuf(len) { if (NOISE[len]) return NOISE[len]; var b = ac.createBuffer(1, Math.floor(ac.sampleRate * len), ac.sampleRate), d = b.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return (NOISE[len] = b); }
  // úder srdce: dva tlumené hluboké údery (lub-dub)
  function heart(v) {
    if (!ok()) return;
    [0, 0.17].forEach(function (dl, j) {
      var t = at(dl), o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 150; o.frequency.setValueAtTime(j ? 56 : 64, t); o.frequency.exponentialRampToValueAtTime(36, t + 0.16);
      g.gain.setValueAtTime((j ? 0.3 : 0.42) * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
      o.connect(lp); lp.connect(g); send(g, 0.25); o.start(t); o.stop(t + 0.27);
    });
  }
  function tunnel(len) {   // hluboké hučení tunelu: sílí až k nápisu, pak pomalu utichne
    if (!ok()) return;
    [[220, 180, 3, 0.05, 0.5, 'bandpass'], [120, 120, 0.7, 0.015, 0.3, 'lowpass']].forEach(function (p) {
      var t = at(), L = len + 3, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = noiseBuf(L); f.type = p[5]; f.Q.value = p[2]; f.frequency.setValueAtTime(p[0], t); f.frequency.exponentialRampToValueAtTime(p[1], t + L);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(p[3], t + len); g.gain.linearRampToValueAtTime(0.0001, t + L);
      s.connect(f); f.connect(g); send(g, p[4]); s.start(t);
    });
  }
  function whisper(gain, delay) {
    if (!ok() || !whisperBuf) return;
    var s = ac.createBufferSource(), g = ac.createGain(); s.buffer = whisperBuf; g.gain.value = gain; s.connect(g); send(g, 0.55); s.start(at(delay));
  }
  // struna (Karplus-Strong: šum projde smyčkou a „rozezní se“ jako struna) – harfa, kytara, basa
  var KS = {};
  function ksBuf(f, len, damp, bright) {
    var key = [f, len, damp, bright].join('|'); if (KS[key]) return KS[key];
    var sr = ac.sampleRate, n = Math.floor(sr * len), b = ac.createBuffer(1, n, sr), d = b.getChannelData(0), p = Math.max(2, Math.round(sr / f)), buf = new Float32Array(p), last = 0, idx = 0;
    for (var i = 0; i < p; i++) { last += bright * ((Math.random() * 2 - 1) - last); buf[i] = last; }
    for (var j = 0; j < n; j++) { var nx = (idx + 1) % p; d[j] = buf[idx]; buf[idx] = damp * 0.5 * (buf[idx] + buf[nx]); idx = nx; }
    return (KS[key] = b);
  }
  function revBuf(b) {   // struna pozpátku (spočítá se jednou a pamatuje si ji)
    if (b.rev) return b.rev;
    var r = ac.createBuffer(1, b.length, b.sampleRate), x = b.getChannelData(0), y = r.getChannelData(0);
    for (var i = 0; i < x.length; i++) y[i] = x[x.length - 1 - i];
    return (b.rev = r);
  }
  // Všechny struny harfy se spočítají dopředu po malých kouscích hned po 1. ťuknutí,
  // aby se výpočet nesešel s hraním (na telefonu to jinak „kousne“ a začátek zvuku se ztratí).
  function prewarm() {
    if (!ac) return;
    var list = HARP.map(function (f) { return [f, 3.5, 0.997, 0.55]; })
      .concat([[82.41, 5, 0.9995, 0.25]])
      .concat([207.65, 246.94, 329.63].map(function (f) { return [f, 1.5, 0.996, 0.4, 1]; }))
      .concat([110, 164.81, 220, 246.94, 261.63, 329.63, 440].map(function (f) { return [f, 4, 0.996, 0.4]; }));
    (function next(i) {
      if (i >= list.length) return;
      var p = list[i], b = ksBuf(p[0], p[1], p[2], p[3]); if (p[4]) revBuf(b);
      setTimeout(function () { next(i + 1); }, 40);
    })(0);
  }
  function pluck(f, delay, vol, o) {
    if (!ok()) return;
    o = o || {}; var t = at(delay), s = ac.createBufferSource(), lp = ac.createBiquadFilter(), g = ac.createGain();
    var b = ksBuf(f, o.len || 3, o.damp || 0.996, o.bright || 0.5);
    if (o.rev) b = revBuf(b);
    s.buffer = b; lp.type = 'lowpass'; lp.frequency.value = o.cut || 3000; g.gain.value = vol;
    s.connect(lp); lp.connect(g); send(g, o.wet == null ? 0.5 : o.wet, o.pan);
    if (o.echo) { var dl = ac.createDelay(1), fb = ac.createGain(), eg = ac.createGain(); dl.delayTime.value = o.echo; fb.gain.value = 0.38; eg.gain.value = 0.6; g.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(eg); send(eg, 0.4); }
    s.start(t);
  }
  function timpani(f, vol) {   // hluboký úder tympánu
    if (!ok()) return;
    var t = at(), g = ac.createGain(); g.gain.value = 1; send(g, 0.6);
    [[1, 1, 3], [1.5, 0.45, 2], [1.98, 0.3, 1.6], [2.44, 0.15, 1.2]].forEach(function (p) { var o = ac.createOscillator(), og = ac.createGain(); o.frequency.setValueAtTime(f * p[0] * 1.02, t); o.frequency.exponentialRampToValueAtTime(f * p[0], t + 0.15);
      og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(vol * p[1], t + 0.008); og.gain.exponentialRampToValueAtTime(0.0001, t + p[2]); o.connect(og); og.connect(g); o.start(t); o.stop(t + p[2] + 0.1); });
  }
  // tóny (Hz): harfa stoupá A H C D E F Gis, napětí na E dur, rozuzlení do A moll
  var HARP = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 415.3], PAN = [-0.5, 0, 0.5, -0.3, 0.2, 0.4, 0];
  // hlasitosti podle Skeliho (náhled hlasitost.html, 2026-11-18: basa a kytara pozpátku ztišené na 30 % a 50 %), už přepočtené
  var L = { harfa: 0.075, basa: 0.036, pozpatku: 0.042, uder: 0.28, akord: 0.11, sepot: 0.047, srdce: 0.6 };
  function harpNote(i, vol) { pluck(HARP[i], 0, vol, { bright: 0.55, damp: 0.997, len: 3.5, wet: 0.55, pan: PAN[i] }); }
  function steel(f, delay, vol) { pluck(f, delay, vol, { bright: 0.4, damp: 0.996, len: 4, echo: 0.36, wet: 0.4, cut: 2600 }); }

  // ---------- smajlík a kroužek ----------
  function setRing(n) { seal.style.setProperty('--p7', n); seal.dataset.p = n; }
  function nextFace() {
    face = face % 7 + 1;
    document.documentElement.style.setProperty('--nav-face', 'url("/img/faces/face-' + face + '.webp")');
    seal.classList.remove('hop'); void seal.offsetWidth; seal.classList.add('hop');
  }
  seal.addEventListener('click', function (e) {
    e.stopPropagation();
    if (running) return;
    audio();                                      // zvuk se smí zapnout jen po ťuknutí (iPhone)
    // každé odhalení náhodně jedna verze; ?egg=harfa / ?egg=tunel v adrese ji vynutí (vyzkoušení)
    var forced = (location.search.match(/[?&]egg=(harfa|tunel)/) || [])[1];
    if (taps === 0) { mode = forced || (Math.random() < 0.5 ? 'tunel' : 'harfa'); if (!muted() && ac) { if (mode === 'harfa') prewarm(); else setTimeout(function () { noiseBuf(5.45 + 3); }, 50); } }
    taps++; nextFace(); setRing(taps);
    if (mode === 'tunel') { heart(0.55 + taps * 0.06); ekg(); } else harpNote(taps - 1, L.harfa * 0.8);
    clearTimeout(resetT);
    // po 7. ťuknutí se smajlík hned zamkne: další rychlá ťuknutí už nespustí odhalení podruhé
    if (taps >= 7) { running = true; setTimeout(reveal, 600); return; }
    resetT = setTimeout(function () { taps = 0; setRing(0); }, 20000);   // kdo přestane, začne příště znovu
  });

  // ---------- odhalení (stejné časy jako schválený náhled) ----------
  function reveal() {
    running = true; arena.classList.add('show');
    var harp = mode === 'harfa', t = 400, gap = 900;
    if (harp) { pluck(82.41, 1.0, L.basa, { bright: 0.25, damp: 0.9995, len: 5, cut: 700, wet: 0.3 }); }   // basa na E (napětí)
    else tunnel(5.45);
    lamps.forEach(function (l, i) {
      if (harp) setTimeout(function () { twang(i); }, Math.max(0, t - 150));   // struna o chvilku dřív než smajlík
      setTimeout(function () {
        if (harp) harpNote(i, L.harfa); else heart(0.7 + i * 0.06);
        l.classList.add('on');
        if (!still && !harp) lamps.forEach(function (x) { if (x.classList.contains('on')) { x.classList.remove('beat'); void x.offsetWidth; x.classList.add('beat'); } });
      }, t);
      t += gap; gap = Math.max(420, gap * 0.85);
    });
    var stop = t + 900;
    if (harp) setTimeout(function () {   // kytara pozpátku nasaje akord E dur do nápisu
      [207.65, 246.94, 329.63].forEach(function (f, k) { pluck(f, k * 0.05, L.pozpatku, { rev: true, len: 1.5, bright: 0.4, damp: 0.996, wet: 0.5, cut: 2600 }); });
    }, stop - 1500);
    setTimeout(function () {
      sign.classList.add('on');
      if (harp) {
        timpani(55, L.uder);
        [110, 164.81, 220, 246.94, 261.63, 329.63].forEach(function (f, k) { steel(f, 0.04 + k * 0.03, L.akord); setTimeout(function () { twang(k); }, Math.max(0, k * 30 - 110)); });
        steel(440, 0.5, L.akord * 0.9); setTimeout(function () { twang(6); }, 350);
        whisper(L.sepot, 0.8);
        // srdce zabuší na pulsování nápisu (hned a pak 3× po 1,1 s)
        [0, 1.1, 2.2, 3.3].forEach(function (d, j) { setTimeout(function () { heart((0.7 - j * 0.1) * L.srdce); if (!still) { sign.classList.remove('beat'); void sign.offsetWidth; sign.classList.add('beat'); } }, d * 1000); });
      } else whisper(0.02, 0.2);
    }, stop);
    setTimeout(function () { unlock.classList.add('on'); sig.classList.add('kevin'); sig.textContent = 'Kevin: ' + (foot.dataset.kevin || ''); }, stop + 700);
    // srdce se znovu rozběhne a nápis SKELO SQUAD na každý úder zatepe
    if (!harp) [2.2, 3.4, 4.9].forEach(function (d, j) { setTimeout(function () { heart(0.5 - j * 0.12); if (!still) { sign.classList.remove('beat'); void sign.offsetWidth; sign.classList.add('beat'); } }, stop + d * 1000); });
    setTimeout(function () { arena.classList.remove('show'); }, stop + 5900);
    setTimeout(function () {
      lamps.forEach(function (l) { l.classList.remove('on', 'beat'); }); sign.classList.remove('on', 'beat'); unlock.classList.remove('on');
      taps = 0; setRing(0); running = false;
    }, stop + 6600);
    setTimeout(function () { sig.classList.remove('kevin'); sig.textContent = 'SKELO SQUAD'; }, stop + 8000);
  }
  // ---------- jiskry ze žáru a bublinky u zelené (spodek menu) ----------
  // Kreslí se jen při otevřeném menu (html.menu-open), ne na slabém telefonu (html.low-fx) ani při „omezit pohyb“.
  // Jiskry pomalu stoupají a vyhasínají, prst je jen jemně odfoukne. Když je barva webu zelená (fotka s mikrofonem),
  // stoupá i pár bublinek – ťuknutím prasknou (Skeliho nahraný zvuk, js/sounds.js).
  (function () {
    var cv = document.createElement('canvas'); cv.className = 'sq-fx'; foot.insertBefore(cv, foot.firstChild);
    var ctx = cv.getContext('2d'), W = 0, H = 0, P = [], B = [], D = [], raf = 0, wind = { x: -999, y: 0, vx: 0, vy: 0, t: 0 }, last = null, bubbleT = 0;
    var POP = ['/sounds/bublina-1.wav', '/sounds/bublina-2.wav', '/sounds/bublina-3.wav', '/sounds/bublina-4.wav'];
    function size() { var r = foot.getBoundingClientRect(); W = cv.width = Math.round(r.width); H = cv.height = Math.round(r.height); }
    function ember(any) { return { x: Math.random() * W, y: any ? H * (0.55 + Math.random() * 0.45) : H + 4, vx: 0, vy: -(0.22 + Math.random() * 0.38), r: 0.8 + Math.random() * 1.5, a: 0.55 + Math.random() * 0.45 }; }
    function accent() { return getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#ff3b30'; }
    function green(col) {   // zelená barva webu (odstín 80–150°) a tmavý režim
      if (document.body.classList.contains('light')) return false;
      var m = col.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/); if (!m) return false;
      var r = m[1] / 255, g = m[2] / 255, b = m[3] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn < 0.15 || mx !== g) return false;
      var h = 60 * (((b - r) / (mx - mn)) + 2); return h > 80 && h < 150;
    }
    function on() { return document.documentElement.classList.contains('menu-open') && !document.documentElement.classList.contains('low-fx') && !still && !document.hidden; }
    function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    foot.addEventListener('pointermove', function (e) { var p = pos(e); if (last) { wind.vx = p.x - last.x; wind.vy = p.y - last.y; } wind.x = p.x; wind.y = p.y; wind.t = 1; last = p; });
    foot.addEventListener('pointerleave', function () { last = null; });
    foot.addEventListener('pointerdown', function (e) {
      var p = pos(e);
      for (var i = 0; i < B.length; i++) { var b = B[i]; if (Math.hypot(p.x - b.x, p.y - b.y) < b.r + 16) { pop(b, true); B.splice(i, 1); return; } }
    });
    function pop(b, byHand) {
      if (byHand && window.SkeliSound && SkeliSound.sample) SkeliSound.sample('pop', POP, 0.5, 1.15 - b.r * 0.03);
      for (var k = 0; k < 8; k++) { var ang = k / 8 * 6.28 + Math.random() * 0.3, sp = 1 + Math.random() * 1.3; D.push({ x: b.x, y: b.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 0.6, life: 1 }); }
    }
    function frame() {
      raf = 0; if (!on()) { ctx.clearRect(0, 0, W, H); return; }
      if (!W) size();
      var col = accent(), gr = green(col);
      ctx.clearRect(0, 0, W, H); wind.t *= 0.9;
      while (P.length < 14) P.push(ember(true));
      for (var i = P.length - 1; i >= 0; i--) {
        var p = P[i], dx = p.x - wind.x, dy = p.y - wind.y, d = Math.hypot(dx, dy);
        if (wind.t > 0.05 && d < 60) { var f = (1 - d / 60) * wind.t; p.vx += (wind.vx * 0.025 + dx / (d + 1) * 0.3) * f; p.vy += (wind.vy * 0.025 + dy / (d + 1) * 0.3) * f; }
        var sp = Math.hypot(p.vx, p.vy); if (sp > 2.2) { p.vx *= 2.2 / sp; p.vy *= 2.2 / sp; }
        p.vx *= 0.95; p.vy = p.vy * 0.97 - 0.012; p.x += p.vx; p.y += p.vy;
        var top = Math.max(0, Math.min(1, (p.y - H * 0.08) / (H * 0.45))), al = p.a * top * top;   // vyhasne dřív, než dojde k okraji
        if (al < 0.02 || p.x < -8 || p.x > W + 8) { P[i] = ember(false); continue; }
        ctx.globalAlpha = al; ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 6; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      }
      ctx.shadowBlur = 0;
      if (gr && B.length < 4 && (bubbleT -= 1) <= 0) { B.push({ x: 30 + Math.random() * (W - 60), y: H + 12, r: 4 + Math.random() * 5, vy: -(0.18 + Math.random() * 0.2), ph: Math.random() * 6, vx: 0 }); bubbleT = 90 + Math.random() * 120; }
      for (var j = B.length - 1; j >= 0; j--) {
        var b = B[j]; b.ph += 0.03;
        var dx2 = b.x - wind.x, dy2 = b.y - wind.y, d2 = Math.hypot(dx2, dy2);
        if (wind.t > 0.05 && d2 < 50 && d2 > 22) b.vx += dx2 / (d2 + 1) * 0.12 * wind.t;
        b.vx *= 0.95; b.x += b.vx + Math.sin(b.ph) * 0.25; b.y += b.vy;
        var bt = Math.max(0, Math.min(1, (b.y - H * 0.08) / (H * 0.4)));
        if ((!gr && Math.random() < 0.01) || bt <= 0.02) { pop(b, false); B.splice(j, 1); continue; }
        ctx.globalAlpha = 0.12 * bt; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
        ctx.globalAlpha = 0.85 * bt; ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.globalAlpha = 0.7 * bt; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.45, 3.5, 4.6); ctx.stroke();
      }
      for (var k = D.length - 1; k >= 0; k--) { var q = D[k]; q.vy += 0.06; q.x += q.vx; q.y += q.vy; q.life -= 0.035; if (q.life <= 0) { D.splice(k, 1); continue; } ctx.globalAlpha = q.life; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(q.x, q.y, 1.3, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && on()) { size(); raf = requestAnimationFrame(frame); } }
    // menu se otevře / zavře = třída menu-open na <html>
    new MutationObserver(start).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    addEventListener('resize', function () { W = 0; });
    document.addEventListener('visibilitychange', start);
    start();
  })();
})();
