// CatSmash – zvuky stroje (Web Audio, nic se nestahuje). Hrají, jen když má hráč v ⚙ zapnutý zvuk.
// Použití (js/catsmash/hra.js): var Z = CatSmash.zvuky(getVol, onPlay) → Z.sfx.pad(), Z.tone(…), Z.buzzStart(), Z.close().
// getVol() = hlasitost 0–1 (0 = ticho), onPlay(síla) = každé zahrání (i potichu) – pulz pro ekvalizér pálky.
(function () {
  var C = window.CatSmash = window.CatSmash || {};
  C.zvuky = function (getVol, onPlay) {
    var ac = null, master = null, noiseBuf = null;
    function audio() {
      var vol = getVol();
      if (!vol) return null;
      if (!ac) {
        var C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        ac = new C(); master = ac.createGain(); master.connect(ac.destination);
        noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        var d = noiseBuf.getChannelData(0);
        for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ac.state === 'suspended') ac.resume();
      master.gain.value = vol * 0.6;
      return ac;
    }
    // at = za kolik sekund zazní (odstřel: náboj teď, rána až po zastavení času)
    function tone(f, dur, type, gain, f2, at) {
      var a = audio();
      if (!a) return;
      var t = a.currentTime + (at || 0), o = a.createOscillator(), g = a.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      g.gain.setValueAtTime(gain || 0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
    }
    function noise(dur, freq, gain, q, type, at, f2) {
      var a = audio();
      if (!a) return;
      var t = a.currentTime + (at || 0), s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      s.buffer = noiseBuf; f.type = type || 'bandpass'; f.frequency.setValueAtTime(freq, t); f.Q.value = q || 1;
      if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur);
      g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
    }
    var sfx = {
      pad: function (kevinSide) { tone(kevinSide ? 330 : 440, 0.09, 'triangle', 0.35, kevinSide ? 260 : 360); noise(0.04, 1800, 0.12); },   // bonk
      wall: function () { tone(880, 0.04, 'sine', 0.08); },
      // odstřel (vybral uživatel, varianta 27): elektrický náboj po dobu zastavení času, pak prásknutí jiskry,
      // suchý úder a hopík slyšitelně odsviští pryč; bez náboje (obyčejný odstřel) jen kratší rána
      shot: function (charge) {
        if (charge) zap(charge);
        var c = charge || 0;
        noise(0.03, 5000, charge ? 0.9 : 0.6, 0.7, 'highpass', c); tone(2600, 0.04, 'square', 0.12, 500, c);            // prásknutí
        tone(180, 0.09, 'sine', 1, 60, c); noise(0.03, 1800, 0.6, 1, 'bandpass', c); noise(0.06, 600, 0.5, 0.7, 'lowpass', c);   // úder
        noise(charge ? 0.45 : 0.25, 3000, 0.45, 2.5, 'bandpass', c + 0.02, 400);                                      // svist pryč
      },
      miss: function () { tone(220, 0.25, 'square', 0.1, 110); },
      goal: function (mine) { tone(mine ? 523 : 392, 0.14, 'triangle', 0.25); setTimeout(function () { tone(mine ? 784 : 262, 0.22, 'triangle', 0.25); }, 130); },
      click: function () { noise(0.015, 3200, 0.05, 6); },     // cvaknutí zubu
      hiss: function () { noise(1.6, 5000, 0.18, 0.4); }       // syčení přehřátých kol
    };
    var EQ_HIT = { pad: 0.55, wall: 0.25, shot: 1, miss: 0.5, goal: 0.9, click: 0.04, hiss: 0.3 };
    Object.keys(sfx).forEach(function (k) {
      var f = sfx[k];
      sfx[k] = function () { if (onPlay) onPlay(EQ_HIT[k] || 0.2); return f.apply(this, arguments); };
    });
    // elektrický náboj: pila stoupá a chvěje se čím dál rychleji
    function zap(dur) {
      var a = audio();
      if (!a) return;
      var t = a.currentTime, o = a.createOscillator(), lfo = a.createOscillator(), lg = a.createGain(), trem = a.createGain(), g = a.createGain(), f = a.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(1600, t + dur);
      lfo.frequency.setValueAtTime(12, t); lfo.frequency.exponentialRampToValueAtTime(70, t + dur); lg.gain.value = 0.5; trem.gain.value = 0.5;
      f.type = 'lowpass'; f.frequency.setValueAtTime(600, t); f.frequency.exponentialRampToValueAtTime(6000, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + dur * 0.95); g.gain.linearRampToValueAtTime(0.0001, t + dur);
      lfo.connect(lg); lg.connect(trem.gain);
      o.connect(f); f.connect(trem); trem.connect(g); g.connect(master); o.start(t); lfo.start(t); o.stop(t + dur + 0.02); lfo.stop(t + dur + 0.02);
    }
    // bzučení komára: pila se chvěním, dokud ho Kevin netrefí
    function buzzStart() {
      var a = audio();
      if (!a) return null;
      var o = a.createOscillator(), l = a.createOscillator(), lg = a.createGain(), g = a.createGain();
      o.type = 'sawtooth'; o.frequency.value = 620; l.frequency.value = 7; lg.gain.value = 40; g.gain.value = 0.04;
      l.connect(lg); lg.connect(o.frequency); o.connect(g); g.connect(master); o.start(); l.start();
      return { stop: function () { try { g.gain.setTargetAtTime(0, a.currentTime, 0.05); o.stop(a.currentTime + 0.3); l.stop(a.currentTime + 0.3); } catch (e) { /* už stojí */ } } };
    }

    return { sfx: sfx, tone: tone, buzzStart: buzzStart, close: function () { if (ac) try { ac.close(); } catch (e) { /* nevadí */ } } };
  };
})();
