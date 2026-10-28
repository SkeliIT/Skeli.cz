// Kevinův beat: boom-bap, lo-fi, trap, drill, old-school – syntezátor ve Web Audio, nic se nestahuje. Hraje jen
// po kliknutí (rap, beatbox, rýmovačka). Načte ho js/kevin.js až při prvním použití (loadBeat).
// K.soundOn() = má Kevin zapnutý zvuk (tlačítko u Kevina). Vrací { beat(style, sekund) → stop(), chooseStyle() }.
window.KevinBeat = function (K) {
  var audio = null;
  // Five styles, picked at random: drums, bass and chords on a 16-step bar. bpm = the drum tempo,
  // flow = the tempo his words follow (half of it for trap and drill), swing = how late the off-beat 16ths are.
  // The key and the chord progression are random too, so the melody is never quite the same.
  var STYLES = [
    { name: 'boombap', label: 'boom-bap beat', bpm: 90, flow: 90, swing: 0.1, kick: [0, 7, 10], snare: [4, 12], hats: 2, open: [14],
      bass: 'kick', keys: 'stab', progs: [[0, 8, 3, 10], [0, 5, 8, 7], [0, 3, 8, 7]], minor: true },
    { name: 'lofi', label: 'lo-fi beat', bpm: 78, flow: 78, swing: 0.18, kick: [0, 7, 9], snare: [4, 12], hats: 2, soft: true, crackle: true,
      bass: 'root', keys: 'pad', progs: [[5, 4, 2, 0], [0, 9, 5, 7], [2, 7, 0, 9]], minor: false },
    { name: 'trap', label: 'trap beat', bpm: 140, flow: 70, swing: 0, kick: [0, 3, 10], snare: [8], clap: true, hats: 1, rolls: true,
      bass: '808', keys: 'dark', progs: [[0, 8, 3, 10], [0, 1, 0, 8]], minor: true },
    { name: 'drill', label: 'drill beat', bpm: 142, flow: 71, swing: 0.06, kick: [0, 6, 11], snare: [8, 14], hats: [0, 3, 6, 8, 10, 13], slide: true,
      bass: '808', keys: 'bell', progs: [[0, 1, 0, 8], [0, 8, 1, 0]], minor: true },
    { name: 'oldschool', label: 'old-school beat', bpm: 96, flow: 96, swing: 0.12, kick: [0, 3, 8, 10], snare: [4, 12], clap: true, hats: 2, open: [6, 14],
      bass: 'funk', keys: 'stab', progs: [[0, 5, 0, 7], [0, 3, 5, 3]], minor: true }
  ];
  var lastStyle = '';
  function chooseStyle() {
    var options = STYLES.filter(function (s) { return s.name !== lastStyle; });
    var s = options[Math.floor(Math.random() * options.length)];
    lastStyle = s.name;
    return s;
  }
  // plays a style for about `seconds`; returns stop()
  function beat(style, seconds) {
    if (!K.soundOn()) return function () {};
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
    } catch (e) { return function () {}; }
    var ctx = audio, out = ctx.createGain(), lp = ctx.createBiquadFilter();
    out.gain.value = style.soft ? 0.26 : 0.3;
    lp.type = 'lowpass';
    lp.frequency.value = style.soft ? 5200 : 9500;
    out.connect(lp);
    lp.connect(ctx.destination);
    var noise = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate), nd = noise.getChannelData(0);
    for (var i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    var nodes = [], t0 = ctx.currentTime + 0.06, sixteenth = 60 / style.bpm / 4, bar = sixteenth * 16;
    var bars = Math.max(1, Math.ceil(seconds / bar));
    var root = 33 + Math.floor(Math.random() * 7);   // A1 … D#2: a random key every time
    var prog = style.progs[Math.floor(Math.random() * style.progs.length)];
    function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function env(g, t, peak, attack, len) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    }
    function osc(type, f, t, len, peak, attack, dest, filterHz) {
      var o = ctx.createOscillator(), g = ctx.createGain(), node = g;
      o.type = type; o.frequency.setValueAtTime(f, t);
      env(g, t, peak, attack, len);
      o.connect(g);
      if (filterHz) { var f2 = ctx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = filterHz; g.connect(f2); node = f2; }
      node.connect(dest || out);
      o.start(t); o.stop(t + len + 0.05); nodes.push(o);
      return o;
    }
    function noiseHit(t, freq, type, peak, len) {
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noise; f.type = type; f.frequency.value = freq;
      g.gain.setValueAtTime(peak, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + len + 0.02); nodes.push(s);
    }
    function kick(t) {
      var o = osc('sine', 150, t, 0.42, style.soft ? 0.8 : 1, 0.004);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.13);
    }
    function snare(t, peak) {
      noiseHit(t, 1900, 'bandpass', peak, 0.2);
      osc('triangle', 185, t, 0.1, peak * 0.5, 0.002);
    }
    function clap(t) { [0, 0.011, 0.023].forEach(function (d) { noiseHit(t + d, 1250, 'bandpass', 0.55, 0.12); }); }
    function hat(t, peak, open) { noiseHit(t, 8200, 'highpass', peak, open ? 0.28 : 0.045); }
    function sub(t, m, len, glideTo) {
      var o = osc('sine', hz(m), t, len, 0.75, 0.006);
      if (glideTo != null) o.frequency.exponentialRampToValueAtTime(hz(glideTo), t + Math.min(len, 0.25));
    }
    // chords: minor or major sevenths on the progression's degree
    function chordNotes(degree) {
      var base = root + 24 + degree, third = style.minor ? 3 : 4;
      return [base, base + third, base + 7, base + (style.minor ? 10 : 11)];
    }
    function keys(t, degree, kind) {
      var ns = chordNotes(degree);
      if (kind === 'pad') ns.forEach(function (m) { osc('triangle', hz(m), t, bar * 0.95, 0.05, 0.08, null, 1600); osc('sine', hz(m) * 1.003, t, bar * 0.95, 0.03, 0.08); });
      if (kind === 'dark') ns.forEach(function (m) { osc('sawtooth', hz(m - 12), t, bar * 0.95, 0.025, 0.2, null, 700); });
      if (kind === 'stab') [0, 6].forEach(function (s) { ns.forEach(function (m) { osc('square', hz(m), t + s * sixteenth, sixteenth * 1.6, 0.018, 0.005, null, 2200); }); });
      if (kind === 'bell') [0, 3, 7, 10, 12].forEach(function (s, k) { osc('sine', hz(ns[k % 3] + 12), t + s * sixteenth, 0.5, 0.05, 0.003); });
    }
    // a little vinyl crackle under lo-fi
    if (style.crackle) {
      var len = bars * bar, cb = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * len), ctx.sampleRate), cd = cb.getChannelData(0);
      for (var c = 0; c < cd.length; c++) cd[c] = Math.random() < 0.0009 ? (Math.random() * 2 - 1) * 0.6 : (Math.random() * 2 - 1) * 0.004;
      var cs = ctx.createBufferSource(), cg = ctx.createGain();
      cs.buffer = cb; cg.gain.value = 0.5; cs.connect(cg); cg.connect(out); cs.start(t0); nodes.push(cs);
    }
    for (var b = 0; b < bars; b++) {
      var degree = prog[b % prog.length], bt = t0 + b * bar;
      keys(bt, degree, style.keys);
      for (var s = 0; s < 16; s++) {
        var t = bt + s * sixteenth + (s % 2 ? style.swing * sixteenth : 0);
        var isKick = style.kick.indexOf(s) >= 0;
        if (isKick) kick(t);
        if (style.snare.indexOf(s) >= 0) { snare(t, style.soft ? 0.45 : 0.7); if (style.clap) clap(t); }
        var hatOn = Array.isArray(style.hats) ? style.hats.indexOf(s) >= 0 : s % style.hats === 0;
        if (hatOn) hat(t, (s % 4 === 0 ? 0.2 : 0.12) * (style.soft ? 0.7 : 1), style.open && style.open.indexOf(s) >= 0);
        // trap hi-hat rolls: now and then a quick triplet run
        if (style.rolls && s % 4 === 2 && Math.random() < 0.3) for (var r = 1; r < 3; r++) hat(t + r * sixteenth / 3, 0.09);
        // bass
        if (style.bass === '808' && isKick) sub(t, root + degree, sixteenth * 5, style.slide && Math.random() < 0.35 ? root + degree + (Math.random() < 0.5 ? 5 : -2) : null);
        if (style.bass === 'kick' && isKick) osc('triangle', hz(root + 12 + degree), t, sixteenth * 2.5, 0.22, 0.01, null, 500);
        if (style.bass === 'root' && (s === 0 || s === 8)) osc('triangle', hz(root + 12 + degree), t, sixteenth * 6, 0.2, 0.02, null, 450);
        if (style.bass === 'funk' && [0, 3, 6, 10, 13].indexOf(s) >= 0) osc('sawtooth', hz(root + 12 + degree + (s === 13 ? 7 : s === 6 ? 12 : 0)), t, sixteenth * 1.4, 0.12, 0.005, null, 600);
      }
    }
    return function stop() {
      out.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      nodes.forEach(function (n) { try { n.stop(ctx.currentTime + 0.2); } catch (err) { /* already stopped */ } });
    };
  }


  return { beat: beat, chooseStyle: chooseStyle };
};
