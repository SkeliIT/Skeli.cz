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
  function twang(i) { if (still) return; var s = strs[i]; s.classList.remove('go'); void s.offsetWidth; s.classList.add('go'); }

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
  function noiseBuf(len) { var b = ac.createBuffer(1, Math.floor(ac.sampleRate * len), ac.sampleRate), d = b.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
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
  function pluck(f, delay, vol, o) {
    if (!ok()) return;
    o = o || {}; var t = at(delay), s = ac.createBufferSource(), lp = ac.createBiquadFilter(), g = ac.createGain();
    var b = ksBuf(f, o.len || 3, o.damp || 0.996, o.bright || 0.5);
    if (o.rev) { var r = ac.createBuffer(1, b.length, b.sampleRate), x = b.getChannelData(0), y = r.getChannelData(0); for (var i = 0; i < x.length; i++) y[i] = x[x.length - 1 - i]; b = r; }
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
  function harpNote(i, vol) { pluck(HARP[i], 0, vol, { bright: 0.55, damp: 0.997, len: 3.5, wet: 0.55, pan: PAN[i] }); twang(i); }
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
    if (taps === 0) mode = forced || (Math.random() < 0.5 ? 'tunel' : 'harfa');
    taps++; nextFace(); setRing(taps);
    if (mode === 'tunel') heart(0.55 + taps * 0.06); else harpNote(taps - 1, L.harfa * 0.8);
    clearTimeout(resetT);
    if (taps >= 7) { setTimeout(reveal, 600); return; }
    resetT = setTimeout(function () { taps = 0; setRing(0); }, 20000);   // kdo přestane, začne příště znovu
  });

  // ---------- odhalení (stejné časy jako schválený náhled) ----------
  function reveal() {
    running = true; arena.classList.add('show');
    var harp = mode === 'harfa', t = 400, gap = 900;
    if (harp) { pluck(82.41, 1.0, L.basa, { bright: 0.25, damp: 0.9995, len: 5, cut: 700, wet: 0.3 }); }   // basa na E (napětí)
    else tunnel(5.45);
    lamps.forEach(function (l, i) {
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
        [110, 164.81, 220, 246.94, 261.63, 329.63].forEach(function (f, k) { steel(f, 0.04 + k * 0.03, L.akord); setTimeout(function () { twang(k); }, 40 + k * 30); });
        steel(440, 0.5, L.akord * 0.9); setTimeout(function () { twang(6); }, 500);
        whisper(L.sepot, 0.8);
        // srdce zabuší na pulsování nápisu (hned a pak 3× po 1,1 s)
        [0, 1.1, 2.2, 3.3].forEach(function (d, j) { setTimeout(function () { heart((0.7 - j * 0.1) * L.srdce); if (!still) { sign.classList.remove('beat'); void sign.offsetWidth; sign.classList.add('beat'); } }, d * 1000); });
      } else whisper(0.02, 0.2);
    }, stop);
    setTimeout(function () { unlock.classList.add('on'); sig.classList.add('kevin'); sig.textContent = 'Kevin: ' + (foot.dataset.kevin || ''); }, stop + 700);
    if (!harp) [2.2, 3.4, 4.9].forEach(function (d, j) { setTimeout(function () { heart(0.5 - j * 0.12); }, stop + d * 1000); });   // srdce se znovu rozběhne
    setTimeout(function () { arena.classList.remove('show'); }, stop + 5900);
    setTimeout(function () {
      lamps.forEach(function (l) { l.classList.remove('on', 'beat'); }); sign.classList.remove('on', 'beat'); unlock.classList.remove('on');
      taps = 0; setRing(0); running = false;
    }, stop + 6600);
    setTimeout(function () { sig.classList.remove('kevin'); sig.textContent = 'SKELO SQUAD'; }, stop + 8000);
  }
})();
