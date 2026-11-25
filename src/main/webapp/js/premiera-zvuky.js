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
  var CESTA = '/sounds/premiera/', VERZE = '6';
  var ATMO = { 'atmo-hovor': 0, 'atmo-ticho': 0.22, 'atmo-dest': 0.16, 'atmo-hukot': 0.2 };   // hlasitost (hovor podle lidí)
  var OSTATNI = ['kviz-napeti', 'kviz-vir', 'kviz-uder', 'vlna', 'finale-stoupani', 'finale-projektor', 'finale-ton',
    'joint-1', 'joint-2', 'joint-3', 'joint-4', 'finale-uvod', 'finale-start'];   // joint = Skeliho nahrávka: cvaknutí zapalovače a nahulení (4 varianty)
  var ac = null, master = null, buf = {}, nacita = {}, smycky = {}, lidi = 1, zapnuto = false, vFinale = false, vir = null, napeti = null;

  // ---------- PROGRAM ODPOČTU (Skeli 24. 11.): hudba z Mixkitu (Stock Music Free License – smí na web, ne jako samostatná
  // skladba) se střídá s chvílemi bez hudby; hovor lidí jen v některých úsecích a až od HOVOR_OD lidí v sále (čím víc lidí,
  // tím víc hovoru). Řídí se časem serveru – všichni slyší totéž, kdo přijde pozdě, naskočí doprostřed skladby.
  // [od (s do startu klipu), do, hudba ('' = bez hudby), hovor ano/ne]; v 18:56 pozdrav (vlastní podkres, POZDRAV_OD) –
  // Skeli 24. 11.: až bude v sále nejvíc lidí (kvíz končí 18:54:41)
  var PLAN = [
    [1800, 1655, '', true],            // příchod: jen hovor a sál
    [1655, 1415, 'hudba-1', true],     // Fallen (Asper) – Eugenio Mininni
    [1415, 1365, '', true],
    [1365, 1139, 'hudba-2', false],    // Echoes – jen hudba
    [1139, 1089, '', true],
    [1089, 896, 'hudba-3', true],      // Selpan – Eugenio Mininni
    [896, 856, '', false],             // chvíle ticha
    [856, 616, 'hudba-4', true],       // Delirium – Eugenio Mininni
    [616, 566, '', true],
    [566, 326, 'hudba-5', false],      // Fallen (Asper), druhá část – jen hudba
    [326, 70, '', true],               // posledních 5 min bez hudby, jen sál…
    [70, 0, '', false]                 // …70 s předem sál ztichne: hluboký dech (68–52 s), pozdrav od Skeliho (klavír 51 s, hlas 48–31 s,
                                       // klavír po něm ~12 s dohraje frázi a sám se rozplyne do 17 s), 2 s ticho, v 15 s start kamery
  ];
  // PŘED ODPOČTEM (Skeli 25. 11.): sál je otevřený celý den a hraje v něm pořád náš výběr filmových melodií dokola,
  // mezi skladbami náhodná pauza 5/8/12/24 s, kdy je slyšet jen ambient sálu. Každý prohlížeč má svůj sled (začne náhodnou
  // skladbou). Od 18:30 hraje program premiéry (PLAN) pro všechny stejně.
  // Mixkit, Stock Music Free License (navrhy/premiera/hudba-pred, Skeliho výběr ve vyber.json hudbaPred 25. 11.).
  var PRED = ['pred-577', 'pred-606', 'pred-615', 'pred-545', 'pred-546', 'pred-714'], PAUZY = [5, 8, 12, 24];
  var pred = null;                                         // {i: skladba, od: z (s do startu), kdy začne / začala}
  var HOVOR_OD = 5, HUDBA_HL = 0.2, POZDRAV_OD = 48;     // pozdrav = hlas v 18:59:12, podkres 3 s předem; po hlase klavír dohraje frázi (soubor 34 s, sám dozní)
  var docasne = [];                                        // jednorázové zvuky (pozdrav, finále) – jen kvůli posuvníku zkoušky
  var predfinale = false, hovorSmi = false, hudba = null, kvizTise = false, posledniZ = 1e9, pozdravBezi = false;

  function vypnuto() { try { return localStorage.getItem('soundMuted') === '1'; } catch (e) { return false; } }
  function kontext() {
    if (!ac) {
      // iPhone v tichém režimu (přepínač na boku) Web Audio ztlumí – „přehrávání“ hraje i tak, jako video (iOS 17+, Skeli 26. 11.)
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* starší prohlížeč */ }
      ac = new C();
      master = ac.createGain(); master.gain.value = MASTER; master.connect(ac.destination);
      ztlumPodVideem();
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  // UPOUTÁVKA (Skeli 25. 11.): když na stránce hraje video se zvukem (upoutávka na plátně v sále – js/premiera-sal.js, nebo
  // okénko upoutávky – js/upoutavka.js), hudba i sál se plynule ztiší skoro do ticha a po upoutávce se zase vrátí.
  // Události videa nebublají, proto se poslouchá v zachytávací fázi na celém dokumentu.
  // Zavřená upoutávka zmizí ze stránky dřív, než dorazí její „pause“ → stav hlídá i tik (4× za s), hlasitost se mění jen při změně.
  var MASTER = 0.9, POD_VIDEEM = 0.06, podVideem = false;
  function ztlumPodVideem() {
    if (!master || !ac) return;
    var hraje = Array.prototype.some.call(document.querySelectorAll('video'), function (v) { return !v.paused && !v.ended && !v.muted && v.volume > 0; });
    if (hraje === podVideem) return;
    podVideem = hraje;
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setTargetAtTime(hraje ? MASTER * POD_VIDEEM : MASTER, ac.currentTime, hraje ? 0.15 : 0.6);
  }
  ['play', 'playing', 'pause', 'ended', 'volumechange', 'emptied'].forEach(function (u) {
    document.addEventListener(u, function (e) { if (e.target && e.target.tagName === 'VIDEO') setTimeout(ztlumPodVideem, 0); }, true);
  });
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
    var z = { g: g, s: s, v: hlasitost };                            // v = hlasitost, ze které se později ztišuje
    s.onended = function () { try { g.disconnect(); } catch (e) { /* už odpojeno */ } };
    return z;
  }
  function ztlum(z, za, delka) {                                   // plynule do ticha a zastavit
    if (!z || !ac) return;
    var t = ac.currentTime + (za || 0), d = delka || 0.5;
    // POZOR: gain.value hned po vytvoření ukazuje výchozí 1 (plná hlasitost), ne naplánovanou – ztišení naplánované
    // dopředu by zvuk nejdřív skokem zesílilo (Skeli 24. 11.: projektor 2 s před startem zesílil). Proto z vlastní hlasitosti.
    var od = za > 0 ? z.v : Math.min(z.v, z.g.gain.value);
    try {
      z.g.gain.cancelScheduledValues(t); z.g.gain.setValueAtTime(od, t);
      z.g.gain.linearRampToValueAtTime(0.0001, t + d); z.s.stop(t + d + 0.05);
    } catch (e) { /* už skončil */ }
  }
  // hovor jen v úsecích s hovorem a až od HOVOR_OD lidí; čím víc lidí, tím hlasitější
  function hovorHlasitost() { return hovorSmi && lidi >= HOVOR_OD ? 0.05 + 0.25 * Math.min(1, (lidi - HOVOR_OD) / 25) : 0; }

  // ---------- hudba odpočtu: jedna skladba naráz, po skončení úseku se uvolní z paměti ----------
  function hudbaStop(delka) {
    if (!hudba) return;
    var h = hudba; hudba = null;
    if (h.z) ztlum(h.z, 0, delka || 3);
    setTimeout(function () { if (!hudba || hudba.k !== h.k) { delete buf[h.k]; delete nacita[h.k]; } }, ((delka || 3) + 1) * 1000);
  }
  function hudbaStart(k, segOd) {
    hudba = { k: k, od: segOd, z: null };
    var moje = hudba;
    nacti(k).then(function () {
      if (hudba !== moje || !zapnuto || vFinale) return;
      var od = Math.max(0, segOd - posledniZ);                      // kolik z úseku už uplynulo (pozdní příchod)
      if (od > buf[k].duration - 2) return;
      moje.z = hraj(k, kvizTise ? HUDBA_HL * 0.5 : HUDBA_HL, { od: od, nabeh: od < 1 ? 3 : 2 });
    }).catch(function () { /* bez hudby */ });
  }
  function hudbaHlasitost() { if (hudba && hudba.z && ac) { hudba.z.v = kvizTise ? HUDBA_HL * 0.5 : HUDBA_HL; hudba.z.g.gain.setTargetAtTime(hudba.z.v, ac.currentTime, 0.6); } }

  // ---------- pozdrav od Skeliho (nastavení z pultu navrhy/premiera/pozdrav, vyber.json pozdravMix 24. 11.):
  // hlas beze změny + prostor sálu (dozvuk 2,2 s, 16 %), podkres „Staring at the Night Sky“ (Mixkit) 37 %, pod hlasem o 40 % tišší
  var odezvaBuf = null;
  function odezva(sekund) {                                       // odezva velkého sálu: doznívající šum s tlumenými výškami
    if (odezvaBuf) return odezvaBuf;
    var len = Math.floor(ac.sampleRate * sekund), b = ac.createBuffer(2, len, ac.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var d = b.getChannelData(ch), lp = 0;
      for (var i = 0; i < len; i++) { lp += (Math.random() * 2 - 1 - lp) * (0.35 - 0.25 * i / len); d[i] = lp * Math.pow(1 - i / len, 3) * (i < ac.sampleRate * 0.02 ? i / (ac.sampleRate * 0.02) : 1); } }
    return (odezvaBuf = b);
  }
  function pozdrav() {
    pozdravBezi = true;
    Promise.all([nacti('pozdrav-hlas'), nacti('pozdrav-podkres')]).then(function () {
      if (!zapnuto || vFinale) return;
      var uz = POZDRAV_OD + 3 - posledniZ;                          // s od začátku podkresu
      if (uz > 21) return;                                         // pozdě: hlas by už skoro skončil
      var t = ac.currentTime, PH = 0.22, POD = PH * 0.6;
      var p = hraj('pozdrav-podkres', PH, { od: Math.max(0, uz), nabeh: uz < 1 ? 2 : 0.5 });
      if (p) {
        docasne.push(p);                                                     // pod hlasem (3 s → 19,6 s podkresu) ztišit
        var g = p.g.gain, a = t + Math.max(0.6, 3 - uz), b = t + Math.max(0.7, 19.6 - uz);
        g.setValueAtTime(PH, a - 0.4); g.linearRampToValueAtTime(POD, a + 0.3);
        g.setValueAtTime(POD, b - 0.2); g.linearRampToValueAtTime(PH * 1.15, b + 2.5);   // po posledním slově hudba zase naplno, fráze dohraje sama (dozní v souboru)
      }
      var hlasOd = Math.max(0, uz - 3);
      if (hlasOd < 16) {
        var s = ac.createBufferSource(), dry = ac.createGain(), pre = ac.createDelay(), conv = ac.createConvolver(), wet = ac.createGain();
        s.buffer = buf['pozdrav-hlas']; dry.gain.value = 1;
        conv.buffer = odezva(2.2); pre.delayTime.value = 0.025; wet.gain.value = 0.16 * 1.4;
        s.connect(dry); dry.connect(master); s.connect(pre); pre.connect(conv); conv.connect(wet); wet.connect(master);
        s.start(t + Math.max(0, 3 - uz), hlasOd);
        docasne.push({ g: dry, s: s, v: 1 });
      }
    }).catch(function () { /* bez pozdravu */ });
  }
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

  // ---------- ZVUČKY ŤUKNUTÍ NA SMAJLÍKY (Skeli 24. 11.: „ať je zábavné tam klikat“) – syntéza v prohlížeči, nic se nestahuje
  // kromě Skeliho vlastních nahraných „prasknutí bublinky“ (sounds/bublina-1..4.wav, pár kB). Obličeje SQUADu = tóny
  // D moll pentatoniky (víc ťuknutí za sebou = melodie), smajlíci každý svůj krátký zvuk; vše s jemným dozvukem sálu.
  var NOTY = [146.83, 174.61, 196, 220, 261.63, 293.66, 349.23], kDozvuk = null;   // o oktávu níž – temné, ne veselé (Skeli 24. 11.)
  function dozvuk() {
    if (!kDozvuk) { var c = ac.createConvolver(), w = ac.createGain(); c.buffer = odezva(2.2); w.gain.value = 0.45; c.connect(w); w.connect(master); kDozvuk = c; }
    return kDozvuk;
  }
  function ton(f, za, hl, delka, typ) {                           // měkký úder paličky: sinus + o oktávu výš tišeji
    var t = ac.currentTime + (za || 0), g = ac.createGain(), o = ac.createOscillator(), o2 = ac.createOscillator(), g2 = ac.createGain();
    o.type = typ || 'sine'; o.frequency.value = f; o2.type = 'triangle'; o2.frequency.value = f * 2; g2.gain.value = 0.22;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(hl, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + delka);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(master); g.connect(dozvuk());
    o.start(t); o2.start(t); o.stop(t + delka + 0.05); o2.stop(t + delka + 0.05);
  }
  function sum(za, delka, hl, filtr, f1, f2) {                     // šum přes filtr (švihnutí, tlesknutí, vydechnutí)
    if (!sumBuf) { sumBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); var d = sumBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    var t = ac.currentTime + (za || 0), s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = sumBuf; fl.type = filtr; fl.frequency.setValueAtTime(f1, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + delka);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(hl, t + Math.min(0.02, delka / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + delka);
    s.connect(fl); fl.connect(g); g.connect(master); g.connect(dozvuk()); s.start(t); s.stop(t + delka + 0.05);
  }
  function bublina(rychlost, hl) {
    var b = bubliny[Math.floor(Math.random() * bubliny.length)]; if (!b) return;
    var s = ac.createBufferSource(), g = ac.createGain(); s.buffer = b; s.playbackRate.value = rychlost; g.gain.value = hl;
    s.connect(g); g.connect(master); s.start();
  }
  var sumBuf = null, bubliny = [], strunaBuf = {};
  // drnkací struna (Skeli vybral 24. 11. v navrhy/premiera/zvuky-kina/smajlici.html): fyzikální model drnknutí (Karplus-Strong) –
  // krátký šum ve smyčce dlouhé jako perioda tónu zní jako harfa/kytara. Každý tón se spočítá jen jednou (slabé telefony).
  function struna(f, hl) {
    var sr = ac.sampleRate, klic = Math.round(f);
    if (!strunaBuf[klic]) {
      var n = Math.floor(sr * 2.6), b = ac.createBuffer(1, n, sr), d = b.getChannelData(0), p = Math.round(sr / f), ring = new Float32Array(p), ix = 0, prev = 0;
      for (var i = 0; i < p; i++) ring[i] = (Math.random() * 2 - 1) * 0.9;
      for (var j = 0; j < n; j++) { var v = ring[ix]; ring[ix] = 0.996 * 0.5 * (v + prev); prev = v; d[j] = v; ix = (ix + 1) % p; }
      strunaBuf[klic] = b;
    }
    var s = ac.createBufferSource(), lp = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = strunaBuf[klic]; lp.type = 'lowpass'; lp.frequency.value = f * 6; g.gain.value = hl;
    s.connect(lp); lp.connect(g); g.connect(master); g.connect(dozvuk()); s.start();
  }
  function nactiBubliny() {
    if (bubliny.length) return;
    [1, 2, 3, 4].forEach(function (n) {
      fetch('/sounds/bublina-' + n + '.wav').then(function (r) { return r.arrayBuffer(); })
        .then(function (x) { return new Promise(function (ok, ko) { ac.decodeAudioData(x, ok, ko); }); })
        .then(function (b) { bubliny.push(b); }).catch(function () { /* bez bublinek */ });
    });
  }

  window.PmZvuky = {
    klik: function (k) {
      if (!zapnuto || !ac) return;
      nactiBubliny();
      if (k.charAt(0) === 'f') { var n = +k.slice(1) - 1; struna(NOTY[n] || 220, 0.5); return; }   // obličeje SQUADu: drnknutí struny (harfa)
      switch (k) {
        case 'srdce': ton(110, 0, 0.16, 0.35); ton(98, 0.17, 0.12, 0.45); break;                     // lub-dub
        case 'ohen': sum(0, 0.55, 0.08, 'bandpass', 250, 1100); break;                              // tlumené švihnutí
        case 'smich': ton(220, 0, 0.08, 0.5); ton(174.61, 0.14, 0.07, 0.8); break;                    // dva klesající tlumené tóny
        case 'wow': (function () { var t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(330, t); o.frequency.exponentialRampToValueAtTime(196, t + 0.5);   // hluboké „ůů“ dolů
          g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); o.connect(g); g.connect(master); g.connect(dozvuk()); o.start(t); o.stop(t + 0.65); })(); break;
        case 'tlesk': sum(0, 0.07, 0.14, 'bandpass', 900); sum(0.12, 0.07, 0.1, 'bandpass', 1000); break;   // tlumeně, jako ze zadních řad
        case 'oslava': ton(146.83, 0, 0.07, 2.2, 'triangle'); ton(220, 0.02, 0.05, 2.0); ton(293.66, 0.04, 0.04, 1.8); break;   // temný zvon
        case 'joint': (function () {                                                              // Skeliho nahrávka, náhodná varianta
          var j = 'joint-' + (1 + Math.floor(Math.random() * 4));
          if (buf[j]) hraj(j, 0.7, { nabeh: 0.005 }); else { nacti(j).catch(function () {}); sum(0, 0.7, 0.05, 'lowpass', 900, 300); }
        })(); break;
        default: sum(0, 0.09, 0.06, 'lowpass', 160);
      }
    },
    vypnuto: vypnuto,
    // zapnout (jen při ťuknutí, nebo když už prohlížeč zvuk povolil); doPremiery = ms do startu klipu
    start: function (doPremiery) {
      if (vypnuto()) return false;
      kontext(); zapnuto = true;
      if (doPremiery > 0 && !vFinale) atmoStart();
      OSTATNI.forEach(function (k) { nacti(k).catch(function () { /* bez zvuku */ }); });
      return true;
    },
    // každou čtvrtvteřinu ze sálu (js/premiera-sal.js tik): podle programu přepne hudbu, hovor a pustí pozdrav
    tik: function (zbyva, ted) {
      ztlumPodVideem();
      if (!zapnuto || vFinale || !ac) return;
      var z = zbyva / 1000, seg = null;
      posledniZ = z;
      for (var i = 0; i < PLAN.length; i++) if (z <= PLAN[i][0] && z > PLAN[i][1]) { seg = PLAN[i]; break; }
      if (!seg && z > PLAN[0][0] && PRED.length) {                 // před odpočtem: náš výběr dokola s pauzami
        if (!pred) pred = { i: Math.floor(Math.random() * PRED.length), od: z };
        var k0 = PRED[pred.i % PRED.length];
        if (buf[k0] && pred.od - z > buf[k0].duration + 0.5) {       // dohrála: pauza, pak další
          pred.i++; pred.od = z - PAUZY[Math.floor(Math.random() * PAUZY.length)]; k0 = PRED[pred.i % PRED.length];
        }
        if (z > pred.od) { seg = [pred.od, 0, '', false]; nacti(k0).catch(function () {}); }   // pauza: jen ambient, další se načte
        else seg = [pred.od, 0, k0, false];
      } else if (pred && z <= PLAN[0][0]) pred = null;              // začal odpočet: dál program premiéry
      var smi = !!(seg && seg[3]);
      if (smi !== hovorSmi) { hovorSmi = smi; this.lidi(lidi); }
      var chci = seg && seg[2] ? seg[2] + '@' + seg[0] : '', mam = hudba ? hudba.k + '@' + hudba.od : '';
      if (chci !== mam) { hudbaStop(3); if (chci) hudbaStart(seg[2], seg[0]); }
      if (seg && i + 1 < PLAN.length && PLAN[i + 1][2] && z - PLAN[i + 1][0] < 40) nacti(PLAN[i + 1][2]).catch(function () {});   // další skladbu dopředu
      if (!pozdravBezi && z <= POZDRAV_OD + 3 && z > POZDRAV_OD - 15) pozdrav();
      // 30 s předem: „už se něco děje“ – hluboký dech dechů graduje a v 15 s předá startu kamery
      if (!predfinale && z <= 68 && z > 52.5 && buf['finale-uvod']) {   // 70 s předem: hluboký dech graduje a předá klavíru pozdravu
        predfinale = true;
        var u = hraj('finale-uvod', 0.34, { od: Math.max(0, 68 - z), nabeh: 2 });
        if (u) { docasne.push(u); ztlum(u, Math.max(0, z - 52.3), 1.6); }
      }
    },
    lidi: function (n) {
      lidi = n;
      var z = smycky['atmo-hovor'];
      if (z && ac) { z.v = hovorHlasitost(); z.g.gain.setTargetAtTime(z.v, ac.currentTime, 2); }   // příchody lidí plynule
    },
    // faze 'otazka' (zbyva = ms do konce hlasování) / 'vysledek'
    kviz: function (faze, zbyva) {
      if (!zapnuto || vFinale) return;
      if (faze === 'otazka') {
        kvizTise = true; hudbaHlasitost();                            // při otázce hudba na polovinu
        ztlum(napeti, 0, 0.3); ztlum(vir, 0, 0.2);
        napeti = zbyva > 3000 ? hraj('kviz-napeti', 0.32, { nabeh: 1.5 }) : null;
        vir = zbyva > 1500 ? hraj('kviz-vir', 0.4, { za: Math.max(0, zbyva / 1000 - 4.6), nabeh: 0.4 }) : null;
      } else if (faze === 'vysledek') {
        kvizTise = false; hudbaHlasitost();
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
      if (buf['finale-start'] && s > 13) docasne.push(hraj('finale-start', 0.5, { nabeh: 0.01 }));   // start kamery: hluboký švih s úderem
      ztlum(napeti, 0, 0.5); ztlum(vir, 0, 0.3); hudbaStop(1.5);
      atmoStop(Math.max(1, s - 1.5));                                 // atmosféra utichne do tmy
      if (buf['finale-stoupani']) { var st = hraj('finale-stoupani', 0.5,   /* „Tep a tajemno“ (Mixkit), Skeli 24. 11. místo pištivých houslí */ { od: Math.max(0, 15 - s), nabeh: 1.5 }); ztlum(st, s - 0.4, 0.4); docasne.push(st); }
      if (buf['finale-projektor']) { var pr = hraj('finale-projektor', 0.3, { od: Math.max(0, 15 - s), nabeh: 2.5 }); ztlum(pr, Math.max(0, s - 2), 1.8); docasne.push(pr); }
      // tón až po posledním úderu srdce (5 s): od 7,5 s přehlušoval poslední tři údery – stejně hluboké frekvence (Skeli 25. 11.)
      if (buf['finale-ton'] && s > 4.6) { var tn = hraj('finale-ton', 0.4, { za: s - 4.6, nabeh: 0.8 }); ztlum(tn, s - 0.3, 0.3); docasne.push(tn); }
    },
    klip: function () { vFinale = true; atmoStop(0.6); hudbaStop(0.6); ztlum(napeti, 0, 0.3); ztlum(vir, 0, 0.3); },
    schovej: function (ano) { if (!ac) return; if (ano) ac.suspend(); else if (zapnuto) ac.resume(); },
    vypni: function () {
      try { localStorage.setItem('soundMuted', '1'); } catch (e) { /* jen pro tuto stránku */ }
      zapnuto = false; pred = null; atmoStop(0.4); hudbaStop(0.4); ztlum(napeti, 0, 0.2); ztlum(vir, 0, 0.2);
    },
    zapni: function (doPremiery) {
      try { localStorage.removeItem('soundMuted'); } catch (e) { /* nevadí */ }
      return this.start(doPremiery);
    },
    bezi: function () { return zapnuto; },
    // jen zkouška (?pmSim, posuvník času v sále): všechno rychle ztišit a začít znovu podle nového času (doPremiery v ms)
    skok: function (doPremiery) {
      if (!ac) return;
      atmoStop(0.2); hudbaStop(0.2); ztlum(napeti, 0, 0.1); ztlum(vir, 0, 0.1); napeti = vir = null;
      docasne.forEach(function (z) { ztlum(z, 0, 0.2); }); docasne = [];
      vFinale = false; predfinale = false; pred = null; pozdravBezi = false; kvizTise = false; hovorSmi = false; posledniZ = doPremiery / 1000;
      if (zapnuto && doPremiery > 0) atmoStart();
    }
  };
})();
