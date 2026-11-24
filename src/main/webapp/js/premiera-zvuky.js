// Zvuky kinosálu premiéry (Skeli vybral 24. 11. v navrhy/premiera/zvuky-kina – „vážná, ponurá atmosféra“, klip je
// o domácím násilí). Soubory v /sounds/premiera/ jsou z Mixkitu (Sound Effects Free License: zdarma, bez uvádění autora,
// smí být součástí webu), část ztemnělá ve ffmpeg (níž, tlumeně, s dozvukem).
//  • atmosféra (smyčky, potichu): hovor lidí v dálce (sílí podle počtu lidí v sále), ticho kina, hřmění s deštěm, hukot
//  • kvíz: při otázce pomalé stoupání napětí, 4,6 s před koncem hlasování bubnový vír, při odhalení tajemný úder
//  • mexická vlna: vzdálený temný jásot
//  • finále (posledních 15 s): stoupání skončí přesně ve 0, roztočí se projektor, atmosféra utichne, od zhasnutí táhlý tón
//  • klip: všechno ztichne (hraje jen klip)
// Hraje jen po ťuknutí (prohlížeč jinak zvuk nepustí) a jen když návštěvník nemá zvuky webu vypnuté (stejný vypínač jako
// js/sounds.js: localStorage soundMuted). Soubory se stáhnou až při prvním zapnutí. Ve schované záložce je kontext uspaný.
// Ovládá ho js/premiera-sal.js přes window.PmZvuky.
(function () {
  var C = window.AudioContext || window.webkitAudioContext;
  if (!C || !window.fetch) return;
  var CESTA = '/sounds/premiera/', VERZE = '1';
  var ATMO = { 'atmo-hovor': 0, 'atmo-ticho': 0.22, 'atmo-dest': 0.16, 'atmo-hukot': 0.2 };   // hlasitost (hovor podle lidí)
  var OSTATNI = ['kviz-napeti', 'kviz-vir', 'kviz-uder', 'vlna', 'finale-stoupani', 'finale-projektor', 'finale-ton'];
  var ac = null, master = null, buf = {}, nacita = {}, smycky = {}, lidi = 1, zapnuto = false, vFinale = false, vir = null, napeti = null;

  function vypnuto() { try { return localStorage.getItem('soundMuted') === '1'; } catch (e) { return false; } }
  function kontext() {
    if (!ac) {
      ac = new C();
      master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function nacti(k) {
    if (buf[k]) return Promise.resolve(buf[k]);
    if (!nacita[k]) {
      nacita[k] = fetch(CESTA + k + '.mp3?v=' + VERZE).then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then(function (x) { return new Promise(function (ok, ko) { ac.decodeAudioData(x, ok, ko); }); })   // tvar s callbackem kvůli starému Safari
        .then(function (b) { buf[k] = b; return b; });
      nacita[k].catch(function () { delete nacita[k]; });                 // příště zkusit znovu
    }
    return nacita[k];
  }
  // přehraje zvuk; vrátí {g: hlasitost, s: zdroj}, nebo null (není načtený / vypnuto)
  function hraj(k, hlasitost, o) {
    o = o || {};
    if (!zapnuto || !buf[k]) return null;
    var s = ac.createBufferSource(), g = ac.createGain(), t = ac.currentTime + (o.za || 0);
    s.buffer = buf[k];
    if (o.smycka) { s.loop = true; s.loopStart = 0.06; s.loopEnd = Math.max(0.1, buf[k].duration - 0.06); }   // bez mezery mp3 na okrajích
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(hlasitost, t + (o.nabeh || 0.05));
    s.connect(g); g.connect(master);
    s.start(t, Math.min(o.od || 0, Math.max(0, buf[k].duration - 0.1)));
    var z = { g: g, s: s };
    s.onended = function () { try { g.disconnect(); } catch (e) { /* už odpojeno */ } };
    return z;
  }
  function ztlum(z, za, delka) {                                   // plynule do ticha a zastavit
    if (!z || !ac) return;
    var t = ac.currentTime + (za || 0), d = delka || 0.5;
    try {
      z.g.gain.cancelScheduledValues(t); z.g.gain.setValueAtTime(z.g.gain.value, t);
      z.g.gain.linearRampToValueAtTime(0.0001, t + d); z.s.stop(t + d + 0.05);
    } catch (e) { /* už skončil */ }
  }
  function hovorHlasitost() { return 0.05 + 0.3 * Math.min(1, Math.max(0, lidi - 1) / 30); }
  function atmoStart() {
    Object.keys(ATMO).forEach(function (k) {
      if (smycky[k]) return;
      nacti(k).then(function () {
        if (!zapnuto || vFinale || smycky[k]) return;
        smycky[k] = hraj(k, k === 'atmo-hovor' ? hovorHlasitost() : ATMO[k], { smycka: true, nabeh: 4 });
      }).catch(function () { /* bez zvuku */ });
    });
  }
  function atmoStop(delka) { Object.keys(smycky).forEach(function (k) { ztlum(smycky[k], 0, delka); delete smycky[k]; }); }

  window.PmZvuky = {
    vypnuto: vypnuto,
    // zapnout (jen při ťuknutí, nebo když už prohlížeč zvuk povolil); doPremiery = ms do startu klipu
    start: function (doPremiery) {
      if (vypnuto()) return false;
      kontext(); zapnuto = true;
      if (doPremiery > 0 && !vFinale) atmoStart();
      OSTATNI.forEach(function (k) { nacti(k).catch(function () { /* bez zvuku */ }); });
      return true;
    },
    lidi: function (n) {
      lidi = n;
      var z = smycky['atmo-hovor'];
      if (z && ac) z.g.gain.setTargetAtTime(hovorHlasitost(), ac.currentTime, 2);   // příchody lidí plynule
    },
    // faze 'otazka' (zbyva = ms do konce hlasování) / 'vysledek'
    kviz: function (faze, zbyva) {
      if (!zapnuto || vFinale) return;
      if (faze === 'otazka') {
        ztlum(napeti, 0, 0.3); ztlum(vir, 0, 0.2);
        napeti = zbyva > 3000 ? hraj('kviz-napeti', 0.32, { nabeh: 1.5 }) : null;
        vir = zbyva > 1500 ? hraj('kviz-vir', 0.4, { za: Math.max(0, zbyva / 1000 - 4.6), nabeh: 0.4 }) : null;
      } else if (faze === 'vysledek') {
        ztlum(napeti, 0, 0.4); ztlum(vir, 0, 0.15); napeti = vir = null;
        hraj('kviz-uder', 0.55);
      }
    },
    vlna: function () { if (!vFinale) hraj('vlna', 0.5, { nabeh: 0.3 }); },
    // posledních 15 s: zbyva = ms do startu klipu
    finale: function (zbyva) {
      if (!zapnuto || vFinale) return;
      vFinale = true;
      var s = zbyva / 1000;
      ztlum(napeti, 0, 0.5); ztlum(vir, 0, 0.3);
      atmoStop(Math.max(1, s - 1.5));                                 // atmosféra utichne do tmy
      if (buf['finale-stoupani']) { var st = hraj('finale-stoupani', 0.5, { od: Math.max(0, 15 - s), nabeh: 1.5 }); ztlum(st, s - 0.4, 0.4); }
      if (buf['finale-projektor']) { var pr = hraj('finale-projektor', 0.3, { od: Math.max(0, 15 - s), nabeh: 2.5 }); ztlum(pr, Math.max(0, s - 2), 1.8); }
      if (buf['finale-ton'] && s > 7.5) { var tn = hraj('finale-ton', 0.4, { za: s - 7.5, nabeh: 1 }); ztlum(tn, s - 0.3, 0.3); }   // od zhasnutí sálu
    },
    klip: function () { vFinale = true; atmoStop(0.6); ztlum(napeti, 0, 0.3); ztlum(vir, 0, 0.3); },
    schovej: function (ano) { if (!ac) return; if (ano) ac.suspend(); else if (zapnuto) ac.resume(); },
    vypni: function () {
      try { localStorage.setItem('soundMuted', '1'); } catch (e) { /* jen pro tuto stránku */ }
      zapnuto = false; atmoStop(0.4); ztlum(napeti, 0, 0.2); ztlum(vir, 0, 0.2);
    },
    zapni: function (doPremiery) {
      try { localStorage.removeItem('soundMuted'); } catch (e) { /* nevadí */ }
      return this.start(doPremiery);
    },
    bezi: function () { return zapnuto; }
  };
})();
