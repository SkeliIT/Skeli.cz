// MC Kevin – the rapping gold cat of SKELO SQUAD in the bottom left corner (css/effects.css).
// The 3D model (js/kevin3d.js, Three.js) loads only after the page; with reduced motion,
// save-data or without WebGL a still image stands in. He greets, comments on the page,
// raps two lines of Skeli's lyrics (/api/kevin/bars) with a beat when clicked (sound only
// ever after a click), reacts to window 'kevin' events ({detail: {pw: 'weak'|'strong'|…}}
// or {detail: {page: 'error'}}), falls asleep when nobody moves. Hideable, remembered.
(function () {
  if (window.__kevin || /^\/admin/.test(location.pathname)) return;
  window.__kevin = true;
  // the same ?v= as this script, so a new release also reloads the 3D model
  var version = ((document.currentScript && document.currentScript.src) || '').split('?')[1] || '';

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };
  var session = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };
  var lang = (document.documentElement.lang || 'cs').slice(0, 2);
  var L = (window.KEVIN_LINES || {})[lang] || (window.KEVIN_LINES || {}).en || (window.KEVIN_LINES || {}).cs;
  if (!L) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = navigator.connection && navigator.connection.saveData;
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // ---------- DOM ----------
  var root = document.createElement('div');
  root.className = 'kevin';
  root.innerHTML =
    '<div class="kevin-bubble" role="status" aria-live="polite" hidden><p class="kevin-text"></p><a class="kevin-link" hidden></a></div>'
    + '<button type="button" class="kevin-body" aria-label="' + esc(L.ui.call) + '" title="' + esc(L.ui.call) + '">'
    + '<canvas class="kevin-canvas" aria-hidden="true"></canvas><img class="kevin-still" src="/img/kevin.webp" alt="" hidden></button>'
    + '<div class="kevin-tools">'
    + '<button type="button" class="kevin-sound" aria-pressed="true" title="' + esc(L.ui.sound) + '" aria-label="' + esc(L.ui.sound) + '"><i class="fa-solid fa-volume-high"></i></button>'
    + '<button type="button" class="kevin-hide" title="' + esc(L.ui.hide) + '" aria-label="' + esc(L.ui.hide) + '"><i class="fa-solid fa-xmark"></i></button>'
    + '</div>';
  var paw = document.createElement('button');
  paw.type = 'button';
  paw.className = 'kevin-paw';
  paw.title = L.ui.show;
  paw.setAttribute('aria-label', L.ui.show);
  paw.innerHTML = '<i class="fa-solid fa-paw"></i>';
  paw.hidden = true;

  var bubble = root.querySelector('.kevin-bubble'), text = root.querySelector('.kevin-text'), link = root.querySelector('.kevin-link');
  var body = root.querySelector('.kevin-body'), canvas = root.querySelector('.kevin-canvas'), still = root.querySelector('.kevin-still');
  var soundBtn = root.querySelector('.kevin-sound');
  var soundOn = store.get('kevinSound') !== 'off';
  function syncSound() {
    soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
    soundBtn.querySelector('i').className = 'fa-solid ' + (soundOn ? 'fa-volume-high' : 'fa-volume-xmark');
  }
  syncSound();

  // ---------- the 3D model (or the still image) ----------
  var k = null;   // controller from kevin3d.js
  var fake = { setPose: function () {}, setTalking: function () {}, spin: function () {}, look: function () {}, setLight: function () {}, setPaused: function () {} };
  function model() { return k || fake; }
  function useStill() { canvas.hidden = true; still.hidden = false; }
  function load3d() {
    var gl = null;
    try { gl = document.createElement('canvas').getContext('webgl2'); } catch (e) { gl = null; }
    if (reduced || saveData || !gl) return useStill();
    import('/js/kevin3d.js' + (version ? '?' + version : '')).then(function (m) {
      k = m.createKevin(canvas, { light: document.body.classList.contains('light') });
      new MutationObserver(function () { k.setLight(document.body.classList.contains('light')); })
        .observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }).catch(useStill);
  }

  // ---------- speech ----------
  var hideTimer = 0, busy = false, autoCount = 0, lastAuto = 0;
  function show(msg, opts) {
    opts = opts || {};
    clearTimeout(hideTimer);
    text.textContent = msg;
    link.hidden = true;
    bubble.hidden = false;
    root.classList.add('talking');
    model().setTalking(true);
    if (opts.pose) model().setPose(opts.pose);
    var ms = opts.ms || Math.min(9000, 2600 + msg.length * 55);
    setTimeout(function () { model().setTalking(false); }, Math.min(ms, 1200 + msg.length * 40));
    hideTimer = setTimeout(function () { hideBubble(opts.after || 'idle'); }, ms);
  }
  function hideBubble(pose) {
    bubble.hidden = true;
    root.classList.remove('talking');
    model().setTalking(false);
    model().setPose(pose || 'idle');
  }
  // lines the visitor did not ask for: at most one in 40 s and six per page
  function auto(msg, pose) {
    var now = Date.now();
    if (busy || root.hidden || autoCount >= 6 || now - lastAuto < 40000) return;
    autoCount++;
    lastAuto = now;
    show(msg, { pose: pose });
  }

  // ---------- the beat (Web Audio, only ever after a click) ----------
  var audio = null;
  function beat(bars, bpm) {
    if (!soundOn) return function () {};
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
    } catch (e) { return function () {}; }
    var ctx = audio, out = ctx.createGain(), lp = ctx.createBiquadFilter();
    out.gain.value = 0.32;
    lp.type = 'lowpass';
    lp.frequency.value = 9000;
    out.connect(lp);
    lp.connect(ctx.destination);
    var noise = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate), nd = noise.getChannelData(0);
    for (var i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    var t0 = ctx.currentTime + 0.05, step = 60 / bpm / 2, nodes = [];
    function kick(t) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(130, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      g.gain.setValueAtTime(1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.42); nodes.push(o);
    }
    function hit(t, freq, type, gain, len) {
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noise; f.type = type; f.frequency.value = freq;
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + len);
      s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + len + 0.02); nodes.push(s);
    }
    // boom-bap: kick on 1 and the "and" of 3, snare on 2 and 4, hats on every eighth
    for (var b = 0; b < bars; b++) for (var e = 0; e < 8; e++) {
      var t = t0 + (b * 8 + e) * step;
      if (e === 0 || e === 5) kick(t);
      if (e === 2 || e === 6) hit(t, 1800, 'bandpass', 0.7, 0.18);
      hit(t, 7500, 'highpass', e % 2 ? 0.12 : 0.2, 0.05);
    }
    return function stop() {
      out.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      nodes.forEach(function (n) { try { n.stop(ctx.currentTime + 0.2); } catch (err) { /* already stopped */ } });
    };
  }

  // ---------- rap: the words appear on the beat ----------
  var stopBeat = null, rapTimer = 0;
  function rap() {
    busy = true;
    clearTimeout(hideTimer);
    model().setPose('rap');
    fetch('/api/kevin/bars', { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.status === 200 ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (bars) {
        if (!bars || !bars.lines || !bars.lines.length) { busy = false; return show(pick(L.rapFail), { pose: 'sulk', after: 'idle' }); }
        var words = (pick(L.rapIntro) + ' / ' + bars.lines.join(' / ')).split(/\s+/);
        var bpm = 90, eighth = 60000 / bpm / 2, bars8 = Math.ceil(words.length / 8) + 2;
        stopBeat = beat(bars8, bpm);
        bubble.hidden = false;
        link.hidden = true;
        root.classList.add('talking');
        model().setTalking(true);
        text.innerHTML = '';
        var i = 0;
        function next() {
          if (i >= words.length) {
            model().setTalking(false);
            link.textContent = (bars.song ? bars.song + ' · ' : '') + L.ui.fullLyrics;
            link.href = bars.href;
            link.hidden = false;
            rapTimer = setTimeout(endRap, 5200);
            return;
          }
          var w = words[i++];
          if (w === '/') { text.appendChild(document.createElement('br')); return next(); }
          var span = document.createElement('span');
          span.className = 'kevin-word';
          span.textContent = w + ' ';
          text.appendChild(span);
          rapTimer = setTimeout(next, eighth * (/[,.!?]$/.test(w) ? 2 : 1));
        }
        rapTimer = setTimeout(next, eighth * 8);   // one bar of beat first
      });
  }
  function endRap() {
    clearTimeout(rapTimer);
    if (stopBeat) { stopBeat(); stopBeat = null; }
    busy = false;
    hideBubble('idle');
  }

  // ---------- clicks: never the same reaction twice in a row ----------
  var lastReaction = '';
  function react() {
    if (busy) return endRap();
    wake();
    var options = ['rap', 'rap', 'rap', 'beatbox', 'spin', 'cool', 'sulk'].filter(function (r) { return r !== lastReaction; });
    var r = pick(options);
    lastReaction = r;
    if (r === 'rap') return rap();
    if (r === 'beatbox') {
      busy = true;
      stopBeat = beat(2, 90);
      show(pick(L.beatbox), { pose: 'beatbox', ms: 5400 });
      setTimeout(function () { busy = false; stopBeat = null; }, 5400);
      return;
    }
    if (r === 'spin') { model().spin(); return show(pick(L.spin)); }
    if (r === 'cool') return show(pick(L.cool), { pose: 'cool', ms: 5200 });
    show(pick(L.sulk), { pose: 'sulk', ms: 3800, after: 'sulk' });
    setTimeout(function () { if (!busy) show(pick(L.unsulk), { pose: 'idle' }); }, 4000);
  }

  // ---------- sleep when nobody moves ----------
  var asleep = false, idleTimer = 0;
  function wake() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(sleep, 60000);
    if (!asleep) return;
    asleep = false;
    show(pick(L.wake), { pose: 'idle' });
  }
  function sleep() {
    if (busy || root.hidden) return;
    asleep = true;
    model().setPose('sleep');
    text.textContent = pick(L.sleep);
    link.hidden = true;
    bubble.hidden = false;
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () { bubble.hidden = true; }, 5000);
  }

  // ---------- what the page is about ----------
  function pageKey() {
    var p = location.pathname;
    if (document.querySelector('.error-page')) return 'error';
    if (p === '/' || /index\.jsp$/.test(p)) return 'home';
    if (/music/.test(p)) return 'music';
    if (/\/song\/|\/lyrics\//.test(p)) return 'song';
    if (/texty/.test(p)) return 'lyrics';
    if (/about|bio/.test(p)) return 'about';
    if (/aktuality/.test(p)) return 'news';
    if (/register/.test(p)) return 'register';
    if (/login/.test(p)) return 'login';
    if (/donate/.test(p)) return 'donate';
    return '';
  }
  function dayPart() {
    var h = new Date().getHours();
    return h >= 5 && h < 10 ? 'morning' : h < 17 && h >= 10 ? 'day' : h >= 17 && h < 22 ? 'evening' : 'night';
  }
  function greet() {
    if (!session.get('kevinHello')) {
      session.set('kevinHello', '1');
      return setTimeout(function () { show(pick(L.greet[dayPart()]), { pose: 'point', after: 'idle' }); lastAuto = Date.now(); }, 900);
    }
    var key = pageKey();
    if (key && L.page[key] && Math.random() < (key === 'error' ? 1 : 0.4)) setTimeout(function () { auto(pick(L.page[key])); }, 1500);
  }

  // ---------- show / hide ----------
  function setHidden(h) {
    root.hidden = h;
    paw.hidden = !h;
    store.set('kevin', h ? 'hidden' : 'shown');
    model().setPaused(h);
    if (h) { endRap(); clearTimeout(idleTimer); } else { wake(); }
  }
  function start() {
    document.body.appendChild(root);
    document.body.appendChild(paw);
    root.classList.add('kevin-in');
    root.addEventListener('animationend', function done(e) {
      if (e.target !== root) return;
      root.removeEventListener('animationend', done);
      root.classList.remove('kevin-in');
    });
    load3d();
    if (store.get('kevin') === 'hidden') { setHidden(true); return; }
    wake();
    greet();
  }

  body.addEventListener('click', react);
  soundBtn.addEventListener('click', function () {
    soundOn = !soundOn;
    store.set('kevinSound', soundOn ? 'on' : 'off');
    syncSound();
    if (!soundOn && stopBeat) { stopBeat(); stopBeat = null; }
  });
  root.querySelector('.kevin-hide').addEventListener('click', function () { setHidden(true); });
  paw.addEventListener('click', function () { setHidden(false); show(pick(L.wake), { pose: 'point' }); });

  // he looks at the mouse
  var raf = 0, mx = 0, my = 0;
  window.addEventListener('pointermove', function (e) {
    mx = e.clientX; my = e.clientY;
    if (asleep && Math.hypot(mx, window.innerHeight - my) < 260) wake();
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      var r = body.getBoundingClientRect();
      if (!r.width) return;
      model().look((mx - (r.left + r.width / 2)) / (window.innerWidth / 2), (my - (r.top + r.height / 3)) / (window.innerHeight / 2));
    });
  }, { passive: true });
  ['scroll', 'keydown'].forEach(function (ev) { window.addEventListener(ev, function () { if (!asleep) wake(); }, { passive: true }); });

  // he ducks while the visitor types into a field he covers (phones: the keyboard pushes the form down to him)
  function isField(el) { return el && el.matches && el.matches('input, textarea, select, [contenteditable]') && !root.contains(el); }
  function covers(el) {
    var a = el.getBoundingClientRect(), b = root.getBoundingClientRect();
    return window.innerWidth <= 1024 || (a.left < b.right + 20 && a.right > b.left - 20 && a.bottom > b.top - 20);
  }
  document.addEventListener('focusin', function (e) { if (isField(e.target) && covers(e.target)) root.classList.add('ducked'); });
  document.addEventListener('focusout', function () {
    setTimeout(function () { if (!isField(document.activeElement)) root.classList.remove('ducked'); }, 150);
  });

  // hooks from the rest of the site
  window.addEventListener('kevin', function (e) {
    var d = e.detail || {};
    if (root.hidden) return;
    if (d.pw && L.pw[d.pw]) {
      lastAuto = 0;   // the visitor is typing: answering is fine
      show(pick(L.pw[d.pw]), { pose: d.pw === 'strong' ? 'cool' : d.pw === 'weak' ? 'sulk' : 'idle', after: 'idle' });
    } else if (d.page && L.page[d.page]) {
      auto(pick(L.page[d.page]));
    }
  });
  document.addEventListener('pjax:done', function () { autoCount = 0; greet(); });

  // first the cookie bar is answered, then Kevin comes (they share the corner)
  function begin() { setTimeout(start, 1200); }
  function whenReady() {
    if (store.get('cookieConsent') !== null) return begin();
    var bar = document.getElementById('cookieBar');
    if (!bar) return begin();
    bar.addEventListener('click', function onAnswer(e) {
      if (!e.target.closest('button')) return;
      bar.removeEventListener('click', onAnswer);
      begin();
    });
  }
  if (document.readyState === 'complete') whenReady(); else window.addEventListener('load', whenReady);
})();
