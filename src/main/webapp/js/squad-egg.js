// Easter egg v menu na telefonu (includes/header.jsp .nav-foot): kdo 7× ťukne na smajlíka loga dole v menu, spustí
// „Srdce v tunelu“ – ve tmě hučí tunel, na každý úder srdce se rozsvítí jeden obličej, srdce zrychluje, pak se zastaví,
// v tichu zazní Skeliho šepot „Skelo Squad“, rozžhaví se nápis SKELO SQUAD a SQUAD UNLOCKED, Kevin něco řekne
// a srdce se pomalu znovu rozběhne. Kroužek ze 7 dílků kolem smajlíka ukazuje, kolik zbývá.
// Zvuk (Web Audio, šepot = sounds/skelosquad-sepot.mp3) jen když návštěvník nemá zvuky webu vypnuté (js/sounds.js).
(function () {
  var foot = document.querySelector('.main-nav .nav-foot');
  if (!foot || foot.dataset.ready) return;
  foot.dataset.ready = '1';
  var seal = foot.querySelector('.sq-seal'), arena = foot.querySelector('.sq-arena'), sig = foot.querySelector('.sq-sig');
  var lamps = [].slice.call(arena.querySelectorAll('.sq-lamp')), sign = arena.querySelector('.sq-sign'), unlock = arena.querySelector('.sq-unlock');
  var taps = 0, face = 0, running = false, resetT = 0;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- zvuk ----------
  var ac = null, out = null, rev = null, whisper = null;
  function muted() { try { return localStorage.getItem('soundMuted') === '1'; } catch (e) { return false; } }
  function audio() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return ac; }
    var C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    ac = new C();
    out = ac.createDynamicsCompressor(); out.threshold.value = -14; out.ratio.value = 4; out.connect(ac.destination);
    // dozvuk velkého prostoru (doznívající šum)
    var len = Math.floor(ac.sampleRate * 4), b = ac.createBuffer(2, len, ac.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var d = b.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4); }
    rev = ac.createConvolver(); rev.buffer = b; var rg = ac.createGain(); rg.gain.value = 0.7; rev.connect(rg); rg.connect(out);
    fetch('/sounds/skelosquad-sepot.mp3').then(function (r) { return r.arrayBuffer(); }).then(function (x) { return ac.decodeAudioData(x); }).then(function (x) { whisper = x; }).catch(function () {});
    return ac;
  }
  function send(node, wet) { node.connect(out); if (wet) { var w = ac.createGain(); w.gain.value = wet; node.connect(w); w.connect(rev); } }
  function noiseBuf(len) { var b = ac.createBuffer(1, Math.floor(ac.sampleRate * len), ac.sampleRate), d = b.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
  // úder srdce: dva tlumené hluboké údery (lub-dub)
  function heart(v) {
    if (muted() || !audio()) return;
    [0, 0.17].forEach(function (dl, j) {
      var t = ac.currentTime + dl, o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 150; o.frequency.setValueAtTime(j ? 56 : 64, t); o.frequency.exponentialRampToValueAtTime(36, t + 0.16);
      g.gain.setValueAtTime((j ? 0.3 : 0.42) * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
      o.connect(lp); lp.connect(g); send(g, 0.25); o.start(t); o.stop(t + 0.27);
    });
  }
  // hluboké hučení tunelu: sílí až k nápisu, pak pomalu utichne
  function tunnel(len) {
    if (muted() || !audio()) return;
    [[220, 180, 3, 0.05, 0.5], [120, 120, 0.7, 0.015, 0.3]].forEach(function (p) {
      var t = ac.currentTime, L = len + 3, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = noiseBuf(L); f.type = p[0] === 120 ? 'lowpass' : 'bandpass'; f.Q.value = p[2]; f.frequency.setValueAtTime(p[0], t); f.frequency.exponentialRampToValueAtTime(p[1], t + L);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(p[3], t + len); g.gain.linearRampToValueAtTime(0.0001, t + L);
      s.connect(f); f.connect(g); send(g, p[4]); s.start(t);
    });
  }
  function sayWhisper() {
    if (muted() || !audio() || !whisper) return;
    var s = ac.createBufferSource(), g = ac.createGain(); s.buffer = whisper; g.gain.value = 0.02; s.connect(g); send(g, 0.6); s.start(ac.currentTime + 0.2);
  }

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
    taps++; nextFace(); setRing(taps); heart(0.55 + taps * 0.06);
    clearTimeout(resetT);
    if (taps >= 7) { setTimeout(reveal, 600); return; }
    resetT = setTimeout(function () { taps = 0; setRing(0); }, 20000);   // kdo přestane, začne příště znovu
  });

  // ---------- odhalení (stejné časy jako schválený náhled) ----------
  function reveal() {
    running = true; arena.classList.add('show'); tunnel(5.45);
    var t = 400, gap = 900;
    lamps.forEach(function (l, i) {
      setTimeout(function () {
        heart(0.7 + i * 0.06); l.classList.add('on');
        if (!still) lamps.forEach(function (x) { if (x.classList.contains('on')) { x.classList.remove('beat'); void x.offsetWidth; x.classList.add('beat'); } });
      }, t);
      t += gap; gap = Math.max(420, gap * 0.85);
    });
    var stop = t + 900;                           // srdce se zastaví – ticho, šepot, nápis
    setTimeout(function () { sayWhisper(); sign.classList.add('on'); }, stop);
    setTimeout(function () { unlock.classList.add('on'); sig.classList.add('kevin'); sig.textContent = 'Kevin: ' + (foot.dataset.kevin || ''); }, stop + 700);
    [2.2, 3.4, 4.9].forEach(function (d, j) { setTimeout(function () { heart(0.5 - j * 0.12); }, stop + d * 1000); });   // srdce se znovu rozběhne
    setTimeout(function () { arena.classList.remove('show'); }, stop + 5900);
    setTimeout(function () {
      lamps.forEach(function (l) { l.classList.remove('on', 'beat'); }); sign.classList.remove('on'); unlock.classList.remove('on');
      taps = 0; setRing(0); running = false;
    }, stop + 6600);
    setTimeout(function () { sig.classList.remove('kevin'); sig.textContent = 'SKELO SQUAD'; }, stop + 8000);
  }
})();
