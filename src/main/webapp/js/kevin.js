// MC Kevin – the rapping gold cat of SKELO SQUAD in the bottom left corner (css/effects.css).
// The 3D model (js/kevin3d.js, Three.js) loads only after the page; with reduced motion,
// save-data or without WebGL a still image stands in. He greets, comments on the page,
// raps two lines of Skeli's lyrics (/api/kevin/bars) with a beat when clicked (sound only
// ever after a click), reacts to window 'kevin' events ({detail: {pw: 'weak'|'strong'|…}}
// or {detail: {page: 'error'}}), falls asleep when nobody moves. Hideable, remembered.
// A click opens his menu: find a song (/api/search), play a random clip (/api/kevin/random),
// rap, what's new since the last visit (/api/kevin/news), a surprise. On admin pages he
// reports the site's to-dos (/admin/kevin) instead.
(function () {
  if (window.__kevin) return;
  window.__kevin = true;
  var adminPage = /^\/admin/.test(location.pathname);
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
  // A line he hasn't said lately in this visit (the last 40 are remembered), and not food again within two
  // minutes of talking about food (he must not go on about his bowl every ten seconds).
  var FOOD = /misk|granul|konzerv|jídl|snídan|večeř|pamls|tuňák|oběd|bowl|food|kibble|treat|tuna|breakfast|dinner|lunch|\btins?\b|napf|futter|leckerli|dose|thunfisch|frühstück|essen|миск|корм|консерв|їж|снідан|вечер|смакол|тунц|обід|bát|đồ ăn|hạt|hộp|cá ngừ|bữa/i;
  function said() { try { return JSON.parse(session.get('kevinSaid')) || []; } catch (e) { return []; } }
  function pick(list) {
    if (!list || !list.length) return '';
    if (typeof list === 'string') return list;
    var recent = said(), foodLately = Date.now() - (parseInt(session.get('kevinFood'), 10) || 0) < 120000;
    var fresh = list.filter(function (l) { return recent.indexOf(l) < 0 && !(foodLately && FOOD.test(l)); });
    if (!fresh.length) fresh = list.filter(function (l) { return recent.indexOf(l) < 0; });
    if (!fresh.length) fresh = list;
    return fresh[Math.floor(Math.random() * fresh.length)];
  }
  function remember(line) {
    var recent = said().filter(function (l) { return l !== line; });
    recent.push(line);
    session.set('kevinSaid', JSON.stringify(recent.slice(-40)));
    if (FOOD.test(line)) session.set('kevinFood', String(Date.now()));
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // ---------- DOM ----------
  var root = document.createElement('div');
  root.className = 'kevin';
  root.innerHTML =
    '<div class="kevin-bubble" role="status" aria-live="polite" hidden><p class="kevin-text"></p><a class="kevin-link" hidden></a><div class="kevin-extra" hidden></div>'
    // the comic tail (css/effects.css): down from the bubble, or out of its side when he is under the bar
    + '<svg class="kevin-tail down" viewBox="0 0 44 34" aria-hidden="true"><path class="fill" d="M4 0C12 14 20 25 41 32C27 22 24 12 24 0Z"/><path class="ink" d="M4 0C12 14 20 25 41 32C27 22 24 12 24 0"/></svg>'
    + '<svg class="kevin-tail side" viewBox="0 0 36 34" aria-hidden="true"><path class="fill" d="M0 2C12 6 22 14 34 30C21 26 10 23 0 21Z"/><path class="ink" d="M0 2C12 6 22 14 34 30C21 26 10 23 0 21"/></svg></div>'
    + '<button type="button" class="kevin-body" aria-label="' + esc(L.ui.call) + '" title="' + esc(L.ui.call) + '">'
    + '<canvas class="kevin-canvas" aria-hidden="true"></canvas><img class="kevin-still" src="/img/kevin.webp' + (version ? '?' + version : '') + '" alt="" hidden></button>'
    + '<div class="kevin-tools">'
    + '<button type="button" class="kevin-sound" aria-pressed="true" title="' + esc(L.ui.sound) + '" aria-label="' + esc(L.ui.sound) + '"><i class="fa-solid fa-volume-high"></i></button>'
    + '<button type="button" class="kevin-hide" title="' + esc(L.ui.hide) + '" aria-label="' + esc(L.ui.hide) + '"><i class="fa-solid fa-xmark"></i></button>'
    + '</div>';
  var paw = document.createElement('button');
  paw.type = 'button';
  paw.className = 'kevin-paw';
  paw.title = L.ui.show;
  paw.setAttribute('aria-label', L.ui.show);
  // kroužek, který se při příchodu „nabije“, a jiskry, které při „puf“ odletí (css/effects.css: paw-arrive)
  paw.innerHTML = '<span class="paw-charge" aria-hidden="true"></span>'
    + [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return '<span class="paw-spark" style="--i:' + i + '" aria-hidden="true"></span>'; }).join('')
    + '<i class="fa-solid fa-paw"></i>';
  paw.hidden = true;
  // The paw lives in the header bar, never over the page: on a PC among the round buttons on the
  // right, on phones and tablets next to Menu. (Only a page without the header gets it floating.)
  var wideMq = window.matchMedia('(min-width: 1025px)');
  function placePaw() {
    var controls = document.querySelector('.site-header .top-controls');
    var toggle = document.getElementById('menuToggle');
    var where = wideMq.matches ? controls : toggle;
    if (!where) { paw.classList.remove('in-header'); root.classList.remove('from-header'); if (paw.parentNode !== document.body) document.body.appendChild(paw); return; }
    paw.classList.add('in-header');
    root.classList.add('from-header');
    if (wideMq.matches) controls.insertBefore(paw, controls.firstChild);
    else toggle.parentNode.insertBefore(paw, toggle);
  }

  // a short line by his head while he does something on his own (LIFE); never a whole bubble
  var emoteEl = el('div', 'kevin-emote');
  emoteEl.hidden = true;
  root.appendChild(emoteEl);
  var bubble = root.querySelector('.kevin-bubble'), text = root.querySelector('.kevin-text'), link = root.querySelector('.kevin-link');
  var extra = root.querySelector('.kevin-extra');
  // his canvas is this many times his box on each axis (.kevin-canvas inset in effects.css: -40 % = 1.8)
  var KEVIN_OVERSCAN = 1.8;
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
  var fake = { setPose: function () {}, setTalking: function () {}, spin: function () {}, look: function () {}, setLight: function () {}, setPaused: function () {}, act: function () { return 0; } };
  function model() { return k || fake; }
  function useStill() { canvas.hidden = true; still.hidden = false; }
  // The model is built only the first time he comes out (he mostly waits in the paw): building it is the
  // heaviest thing on a phone, so a visit that never calls him costs nothing. Until it is ready, the still.
  var modelAsked = false;
  function ensureModel() {
    if (modelAsked) return;
    modelAsked = true;
    canvas.hidden = true; still.hidden = false;
    load3d();
  }
  function load3d() {
    var gl = null;
    try { gl = document.createElement('canvas').getContext('webgl2'); } catch (e) { gl = null; }
    // localStorage.kevinLite = '1': just the picture (slow devices; the tests, whose software WebGL can't keep up)
    if (reduced || saveData || !gl || store.get('kevinLite') === '1' || session.get('kevinNo3d') === '1') return useStill();
    // the ginger cat (js/kevin-model.js, about 5 MB with all his moves): the still image stays until he is on screen
    import('/js/kevin-model.js' + (version ? '?' + version : '')).then(function (m) {
      k = m.createKevin(canvas, {
        light: document.body.classList.contains('light'),
        src: '/kevin/kevin.glb' + (version ? '?' + version : ''),
        overscan: KEVIN_OVERSCAN,   // his canvas reaches past his box (effects.css): big moves are never cut off
        onReady: function () { canvas.hidden = false; still.hidden = true; },
        // the model failed or the phone took the 3D away: the picture, and for the rest of the visit no new try
        onError: function () { useStill(); session.set('kevinNo3d', '1'); }
      });
      k.setPaused(root.hidden);
      new MutationObserver(function () { k.setLight(document.body.classList.contains('light')); })
        .observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }).catch(useStill);
  }

  // ---------- speech ----------
  var hideTimer = 0, busy = false, autoCount = 0, lastAuto = 0, hideAfter = 'idle', hideMs = 0;
  // out of the paw because the visitor called him: once the bubble is gone he stays and lives his cat life (LIFE)
  var living = false, lifeTimer = 0;
  // opts: pose, after (pose when the bubble goes), ms, extra (a node under the text: buttons,
  // a search field, results), href + linkText (a link under the text)
  var pending = null;   // what he wanted to say while in the paw (said when the paw is tapped)
  function show(msg, opts) {
    opts = opts || {};
    if (root.hidden) {
      // in the paw he never comes out on his own: the message waits, the paw gets a gold dot
      if (canPop()) { pending = [msg, opts]; paw.classList.add('has-news'); }
      return;
    }
    clearTimeout(hideTimer);
    text.textContent = msg;
    remember(msg);
    link.hidden = !opts.href;
    if (opts.href) { link.href = opts.href; link.textContent = opts.linkText || ''; }
    extra.innerHTML = '';
    extra.hidden = !opts.extra;
    if (opts.extra) extra.appendChild(opts.extra);
    bubble.hidden = false;
    root.classList.add('talking');
    model().setTalking(true);
    if (opts.pose) model().setPose(opts.pose);
    hideAfter = opts.after || 'idle';
    // long enough to read in peace (the user found the old timing too quick)
    hideMs = opts.ms || (opts.extra ? 20000 : Math.min(16000, 4500 + msg.length * 85));
    setTimeout(function () { model().setTalking(false); }, Math.min(hideMs, 1200 + msg.length * 40));
    hideTimer = setTimeout(function () { hideBubble(hideAfter); }, hideMs);
  }
  function hideBubble(pose) {
    endPeek();
    if (stopBeat) { stopBeat(); stopBeat = null; }   // the beat ends with his words
    clearTimeout(rapTimer);                           // and a rap stops for good
    busy = false;
    bubble.hidden = true;
    extra.innerHTML = '';
    root.classList.remove('talking');
    model().setTalking(false);
    model().setPose(pose || 'idle');
    scheduleTuck();
  }
  // the bubble stays while the visitor points at it or types in it
  function holdBubble() { clearTimeout(hideTimer); }
  function releaseBubble() {
    // not while he raps (the mouse leaving the bubble after the click on "Rap" closed it after three words)
    if (busy || bubble.hidden || bubble.contains(document.activeElement)) return;
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () { hideBubble(hideAfter); }, 6000);
  }
  bubble.addEventListener('pointerenter', holdBubble);
  bubble.addEventListener('focusin', holdBubble);
  bubble.addEventListener('pointerleave', releaseBubble);
  bubble.addEventListener('focusout', function () { setTimeout(releaseBubble, 0); });
  // "{n} songs" with the plural form for n: [1, 2–4, 5+] in Czech, [1, more] elsewhere
  function say(forms, n, t) {
    var f = typeof forms === 'string' ? forms
      : forms.length > 2 ? forms[n === 1 ? 0 : n >= 2 && n <= 4 ? 1 : 2] : forms[n === 1 ? 0 : 1];
    return f.replace('{n}', n).replace('{t}', t == null ? '' : t);
  }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function getJson(url) {
    return fetch(url, { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.status === 200 ? r.json() : null; })
      .catch(function () { return null; });
  }
  // lines the visitor did not ask for: at most one in 40 s and six per page
  // Something he says on his own. In the paw he peeks out from the side of the screen to say it, but
  // only where that edge is free (nothing of the page under him and his bubble); with no free edge the
  // paw gets a gold dot instead. Closed with the cross, he still gives a tip now and then, only that way.
  function auto(msg, pose, peekChance, isTip) {
    var now = Date.now();
    if (busy || autoCount >= 6 || now - lastAuto < 40000 || !bubble.hidden) return;
    if (root.hidden && userHidden && !isTip) return;
    if (root.hidden && !pocket()) return;
    autoCount++;
    lastAuto = now;
    onOwn(msg, { pose: pose || 'point' }, isTip, peekChance);
  }
  function onOwn(msg, opts, isTip, peekChance) {
    if (!root.hidden) {   // he is out (the visitor called him): he just says it
      if (Math.random() < (peekChance == null ? 0.5 : peekChance)) startPeek(findPeekSpot());
      return show(msg, opts);
    }
    var spot = findPeekSpot();
    if (spot && (!userHidden || isTip)) {
      place(true);
      startPeek(spot);
      return show(msg, opts);
    }
    if (!userHidden) { pending = [msg, opts]; paw.classList.add('has-news'); }
  }

  // ---------- now and then he peeks out from the side of the screen ----------
  var peeking = false;
  // a free edge: every probe point in the box he would take hits only the background of the page
  function isBackground(el) {
    if (!el || el === document.documentElement || el === document.body) return true;
    if (el.closest('.kevin, .kevin-paw, .bg-slides')) return true;   // the background photos are background
    return !el.closest('a, button, input, select, textarea, label, img, picture, video, iframe, canvas, svg, '
      + 'p, h1, h2, h3, h4, h5, li, pre, blockquote, figure, table, header, footer, nav, form, aside, article, section, '
      + '.card, .tape, .photo-band, .cookie-bar, [class*="spotify"], .sp-bar, .sp-minbar, #sp-min, .notif-panel');
  }
  function boxFree(x0, w, y0, h) {
    for (var gx = 0; gx <= 5; gx++) {
      for (var gy = 0; gy <= 6; gy++) {
        var x = x0 + 4 + (w - 8) * gx / 5, y = y0 + 4 + (h - 8) * gy / 6;
        if (y < 0 || y > innerHeight || x < 0 || x > innerWidth) return false;
        if (!isBackground(document.elementFromPoint(x, y))) return false;
      }
    }
    return true;
  }
  // Two shapes: a wide free edge takes him with the bubble beside him (340 px); a narrower one (190 px)
  // takes him with the bubble above his head, as wide as the edge allows.
  function findPeekSpot() {
    if (reduced || tv || root.classList.contains('ducked') || innerWidth < 700) return null;
    var sides = Math.random() < 0.5 ? [true, false] : [false, true];
    for (var t = 0; t < 4; t++) {
      var y = Math.round(innerHeight * (0.34 + Math.random() * 0.26));
      for (var s = 0; s < 2; s++) {
        var right = sides[s];
        if (boxFree(right ? innerWidth - 340 : 0, 340, y - 70, 242)) return { right: right, y: y, stack: 0 };
        for (var w = 280; w >= 190; w -= 30) {
          if (boxFree(right ? innerWidth - w : 0, w, y - 150, 322)) return { right: right, y: y, stack: w };
        }
      }
    }
    return null;
  }
  function startPeek(spot) {
    if (peeking || !spot) return;
    peeking = true;
    root.style.setProperty('--peek-y', spot.y + 'px');
    root.style.setProperty('--peek-bubble-w', (spot.stack ? spot.stack - 24 : 236) + 'px');
    root.classList.toggle('peek-stack', !!spot.stack);
    root.classList.remove('kevin-in', 'peek-out', 'from-header');   // the side of the screen, not under the bar
    root.classList.add('peek', spot.right ? 'peek-right' : 'peek-left');
    model().look(spot.right ? -0.9 : 0.9, 0.1);   // he looks into the page
  }
  function endPeek() {
    if (!peeking) return;
    peeking = false;
    root.classList.add('peek-out');
    setTimeout(function () {
      if (peeking) return;   // a new peek started meanwhile
      root.classList.remove('peek', 'peek-left', 'peek-right', 'peek-out', 'peek-stack');
      if (pocket()) { root.classList.add('from-header'); if (bubble.hidden) { if (living) startLife(); else place(false); } }
      else root.classList.add('kevin-in');   // pops back up in his corner
    }, 550);
  }
  // a tip or a joke every minute and a half or so, while someone is on the page
  function scheduleTip() {
    setTimeout(function () {
      if (!document.hidden && !asleep) {
        var tip = Math.random() < 0.6;
        var own = window.innerWidth <= 767 && L.mobile ? L.idle.concat(L.mobile) : L.idle;   // on a phone also his size joke
        auto(pick(tip ? (L.tips || L.idle) : own), 'point', 0.8, tip);
      }
      scheduleTip();
    }, 75000 + Math.random() * 45000);
  }

  // ---------- the beat (Web Audio, only ever after a click) ----------
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
    if (!soundOn) return function () {};
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

  // a short meow or a purr (only from "Do something", so always after a click), synthesised
  function sfx(kind) {
    if (!soundOn) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
    } catch (e) { return; }
    var ctx = audio, t = ctx.currentTime + 0.03, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.connect(f); f.connect(g); g.connect(ctx.destination);
    if (kind === 'meow') {
      // a voice gliding up and down through a mouth-like band
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(420, t);
      o.frequency.linearRampToValueAtTime(760, t + 0.22);
      o.frequency.linearRampToValueAtTime(380, t + 0.7);
      f.type = 'bandpass'; f.Q.value = 3;
      f.frequency.setValueAtTime(900, t);
      f.frequency.linearRampToValueAtTime(1700, t + 0.25);
      f.frequency.linearRampToValueAtTime(800, t + 0.7);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
      o.start(t); o.stop(t + 0.8);
    } else {
      // a low rumble, breathing in and out twice
      o.type = 'sawtooth';
      o.frequency.value = 26;
      f.type = 'lowpass'; f.frequency.value = 260;
      g.gain.setValueAtTime(0.0001, t);
      [0, 1.4].forEach(function (s) {
        g.gain.exponentialRampToValueAtTime(0.35, t + s + 0.5);
        g.gain.exponentialRampToValueAtTime(0.05, t + s + 1.3);
      });
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
      o.start(t); o.stop(t + 3.05);
    }
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
        if (!bars || !bars.lines || !bars.lines.length) { busy = false; return show(pick(L.rap.fail), { pose: 'sulk', after: 'idle' }); }
        // a random style; his words follow its flow (one word an eighth, a breath after a comma). Before the bars:
        // which song they are from and which beat plays (so the user can say which beats to keep)
        var style = chooseStyle(), eighth = 60000 / style.flow / 2;
        var words = (pick(L.rap.intro) + ' / ♪ ' + (bars.song || '') + ' (' + style.label + ') / ' + bars.lines.join(' / ')).split(/\s+/);
        stopBeat = beat(style, ((words.length + 12) * eighth) / 1000 + 1);
        clearTimeout(hideTimer);
        bubble.hidden = false;
        link.hidden = true;
        extra.innerHTML = '';
        extra.hidden = true;
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
            // time to read it all in peace (the user found 8 s too short); pointing at the bubble keeps it
            busy = false;
            hideAfter = 'idle';
            clearTimeout(hideTimer);
            hideTimer = setTimeout(function () { hideBubble('idle'); }, Math.max(12000, words.length * 500));
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

  // ---------- a click opens the menu ----------
  var acted = false;   // the visitor clicked him: no greeting may cut in any more
  function menu() {
    acted = true;
    if (root.hidden) popOut();
    if (busy) return endRap();
    wake();
    if (!bubble.hidden && extra.querySelector('.kevin-menu')) return hideBubble('idle');
    var box = el('div', 'kevin-menu');
    var items = adminPage
      ? [['status', 'fa-clipboard-check', L.admin.status], ['find', 'fa-magnifying-glass', L.menu.find], ['play', 'fa-play', L.menu.play]]
      : [['find', 'fa-magnifying-glass', L.menu.find], ['play', 'fa-play', L.menu.play],   // (Zarapuj is off for now: kevin-napady.md)
         ['news', 'fa-bolt', L.menu.news], ['fun', 'fa-wand-magic-sparkles', L.menu.fun], ['report', 'fa-triangle-exclamation', L.menu.report]];
    items.forEach(function (it) {
      var b = el('button', 'kevin-chip');
      b.type = 'button';
      b.innerHTML = '<i class="fa-solid ' + it[1] + '" aria-hidden="true"></i> ';
      b.appendChild(document.createTextNode(it[2]));
      b.addEventListener('click', function () {
        ({ status: adminStatus, find: find, play: play, rap: rap, news: function () { news(true); }, fun: surprise, report: report })[it[0]]();
      });
      box.appendChild(b);
    });
    living = true;
    // the menu goes after a while when nobody touches it (pointing at it or typing keeps it), he stays
    show(L.menu.hint, { pose: 'point', extra: box, ms: 9000 });
  }

  // 1) find a song by its name or a line of its lyrics
  // "Nahlásit problém" (issue #28): the visitor tells him what is wrong on this page; it goes to the admin
  // (Hodnocení webu → Nahlášené problémy) with the page's address. The CSRF token is asked only now (GET /api/report).
  function report() {
    var box = el('div', 'kevin-find kevin-report');
    var area = el('textarea');
    area.rows = 3;
    area.maxLength = 1000;
    area.placeholder = L.report.placeholder;
    area.setAttribute('aria-label', L.menu.report);
    var send = el('button', 'kevin-chip', L.report.send);
    send.type = 'button';
    box.appendChild(area);
    box.appendChild(send);
    show(pick(L.report.prompt), { pose: 'idle', extra: box, ms: 90000 });
    setTimeout(function () { area.focus(); }, 50);
    send.addEventListener('click', function () {
      var message = area.value.trim();
      if (message.length < 3) { text.textContent = L.report.empty; area.focus(); return; }
      send.disabled = true;
      fetch('/api/report', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (tok) {
        var body = new URLSearchParams();
        body.set('message', message);
        body.set('page', location.pathname + location.search);
        return fetch('/api/report', { method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-Token': tok.csrf }, body: body.toString() });
      }).then(function (r) {
        if (r.status === 429) throw new Error('limit');
        if (!r.ok) throw new Error('fail');
        show(pick(L.report.thanks), { pose: 'cool' });
      }).catch(function (e) {
        text.textContent = e && e.message === 'limit' ? L.report.limit : L.report.fail;
        send.disabled = false;
      });
    });
  }
  function find() {
    var box = el('div', 'kevin-find');
    var input = el('input');
    input.type = 'search';
    input.placeholder = L.find.placeholder;
    input.setAttribute('aria-label', L.menu.find);
    input.maxLength = 60;
    var list = el('ul', 'kevin-results');
    box.appendChild(input);
    box.appendChild(list);
    show(pick(L.find.prompt), { pose: 'idle', extra: box, ms: 30000 });
    setTimeout(function () { input.focus(); }, 50);
    var timer = 0, asked = '';
    input.addEventListener('input', function () {
      clearTimeout(timer);
      var q = input.value.trim();
      if (q.length < 2) { list.innerHTML = ''; return; }
      timer = setTimeout(function () {
        asked = q;
        getJson('/api/search?q=' + encodeURIComponent(q)).then(function (found) {
          if (asked !== q) return;
          list.innerHTML = '';
          found = found || [];
          text.textContent = pick(found.length ? L.find.found : L.find.none);
          remember(text.textContent);
          model().setPose(found.length ? 'cool' : 'sulk');
          found.slice(0, 5).forEach(function (s) {
            var li = el('li'), a = el('a');
            a.href = s.href;
            a.appendChild(el('b', null, s.name));
            if (s.line) a.appendChild(el('span', null, '„' + s.line + '“'));
            li.appendChild(a);
            list.appendChild(li);
          });
        });
      }, 250);
    });
    input.addEventListener('keydown', function (e) {
      var first = list.querySelector('a');
      if (e.key === 'Enter' && first) location.href = first.href;
      else if (e.key === 'Enter' && input.value.trim().length < 2) text.textContent = pick(L.find.empty);
    });
  }

  // 5) play a random clip in a small TV next to him
  var tv = null;
  function closeTv() {
    if (!tv) return;
    tv.remove();
    tv = null;
    root.classList.remove('has-tv');
  }
  function play() {
    // first a word about the job, then (after a breath) what he picked
    show(pick(L.play.intro), { pose: 'point' });
    var asked = Date.now();
    getJson('/api/kevin/random').then(function (c) {
      return new Promise(function (done) { setTimeout(function () { done(c); }, Math.max(0, 1800 - (Date.now() - asked))); });
    }).then(function (c) {
      if (!c || !/^[\w-]{6,20}$/.test(c.youtubeId)) return show(pick(L.clip.fail), { pose: 'sulk' });
      closeTv();
      tv = el('div', 'kevin-tv');
      var frame = el('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + c.youtubeId + '?autoplay=1&rel=0';
      frame.title = c.title;
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      var x = el('button', 'kevin-tv-close');
      x.type = 'button';
      x.setAttribute('aria-label', L.play.close);
      x.title = L.play.close;
      x.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      x.addEventListener('click', closeTv);
      tv.appendChild(frame);
      tv.appendChild(x);
      window.dispatchEvent(new CustomEvent('skeli:play', { detail: { yt: c.youtubeId } }));   // the admin's play counts
      document.body.appendChild(tv);
      root.classList.add('has-tv');
      show(say(pick(L.play.pick), 0, c.title), { pose: 'cool', href: c.href, linkText: L.play.song, ms: 8000 });
    });
  }

  // 2) what's new since the last visit (the visit before this browser session)
  // asked = from his menu; otherwise he says it himself when the visitor is back after a while
  function news(asked, onEmpty) {
    var prev = session.get('kevinPrevVisit');
    if (!prev) { if (asked) show(pick(L.news.first), { pose: 'point', href: '/music.jsp', linkText: L.news.link }); return; }
    getJson('/api/kevin/news?since=' + encodeURIComponent(prev)).then(function (n) {
      var parts = [];
      if (n && n.clips && n.clips.length === 1) parts.push(say(L.news.clip, 1, n.clips[0].title));
      if (n && n.clips && n.clips.length > 1) parts.push(say(L.news.clips, n.clips.length, n.clips[0].title));
      if (n && n.posts) parts.push(say(L.news.posts, n.posts));
      if (!parts.length) { if (asked) show(pick(L.news.none), { pose: 'sulk', after: 'idle' }); else if (onEmpty) onEmpty(); return; }
      if (!asked && acted) return;
      var href = n.clips && n.clips.length ? n.clips[0].href : '/aktuality.jsp';
      lastAuto = Date.now();
      var lead = pick(asked ? L.news.some : L.back.news);
      show(lead + ' ' + L.news.lead + ' ' + parts.join(', ') + '.', { pose: 'point', href: href, linkText: L.news.link, ms: 16000 });
    });
  }

  // 7) admin pages: the site's to-dos
  function adminStatus() {
    getJson('/admin/kevin').then(function (s) {
      if (!s) return;
      var parts = [], href = null, linkText = null;
      if (s.reports) { parts.push(say(L.admin.reports, s.reports)); href = '/admin/comments#reports'; linkText = L.admin.toReports; }
      if (s.clipsWithoutSong) parts.push(say(L.admin.clips, s.clipsWithoutSong, s.newestClipWithoutSong || ''));
      if (s.songsWithoutLyrics) parts.push(say(L.admin.lyrics, s.songsWithoutLyrics));
      if (!href && parts.length) { href = '/admin/lyrics'; linkText = L.admin.toLyrics; }
      if (!parts.length) return show(pick(L.admin.clean), { pose: 'cool' });
      // by name (both Skeli and his brother are admins); "missing details" only when something is missing
      var hello = L.admin.hello.filter(function (l) { return s.name || l.indexOf('{name}') < 0; });
      if (s.clipsWithoutSong || s.songsWithoutLyrics) hello = hello.concat(L.admin.missing || []);
      var lead = pick(hello).replace('{name}', s.name || '');
      parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      show(lead + ' ' + parts.join('. ') + '.', { pose: 'point', href: href, linkText: linkText, ms: 16000 });
    });
  }

  // "Do something": a shuffled deck of everything in L.surprise, none again until all of them have been
  // (the deck lives in the browser session, so a new page does not start it over)
  var BIG_SURPRISES = ['beatbox', 'rhyme', 'dance', 'dance2', 'dance3', 'robot', 'silly', 'breakdance', 'flair', 'kick', 'dive', 'cheer', 'jump'];
  function nextSurprise() {
    // only what this model can show (the ginger cat has no sunglasses and no moving tail)
    var all = Object.keys(L.surprise || {}).filter(function (id) { return !model().can || model().can(id); }), deck;
    try { deck = JSON.parse(session.get('kevinDeck')) || []; } catch (e) { deck = []; }
    deck = deck.filter(function (id) { return all.indexOf(id) >= 0; });
    if (!deck.length) {
      // shuffled, the big moves (dances, acrobatics, the beat) taking turns with the small ones, a big one first
      var last = session.get('kevinLastSurprise');
      var shuffle = function (a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; };
      var big = shuffle(all.filter(function (id) { return BIG_SURPRISES.indexOf(id) >= 0; }));
      var small = shuffle(all.filter(function (id) { return BIG_SURPRISES.indexOf(id) < 0; }));
      deck = [];
      while (big.length || small.length) { if (big.length) deck.push(big.shift()); if (small.length) deck.push(small.shift()); }
      if (deck[0] === last && deck.length > 1) deck.push(deck.shift());
    }
    var id = deck.shift();
    session.set('kevinDeck', JSON.stringify(deck));
    session.set('kevinLastSurprise', id);
    return id;
  }
  function surprise() {
    var id = nextSurprise(), line = L.surprise[id];
    if (id === 'beatbox' || id === 'rhyme') {
      // a dance to a beat, or his own little rhyme over it
      var long = id === 'rhyme' ? 8000 : 7000;
      busy = true;
      stopBeat = beat(chooseStyle(), long / 1000);
      model().act(id);
      show(line, { pose: 'idle', ms: long });
      setTimeout(function () { busy = false; stopBeat = null; }, long);
      return;
    }
    var ms = model().act(id);
    show(line, { pose: 'idle', ms: Math.max(4200, ms + 800) });
  }

  // ---------- sleep when nobody moves ----------
  var asleep = false, idleTimer = 0;
  function wake() {
    clearTimeout(idleTimer);
    // living on a phone he naps sooner (and then goes back into the paw), so he isn't in the way for long
    idleTimer = setTimeout(sleep, living && innerWidth <= 767 ? 35000 : 60000);
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
    extra.innerHTML = '';
    extra.hidden = true;
    bubble.hidden = false;
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () { bubble.hidden = true; }, 5000);
    emoteOff();
    // a nap after his life out of the paw: a while later he curls up back in it
    if (living && pocket()) {
      clearTimeout(tuckTimer);
      tuckTimer = setTimeout(function () { if (asleep && living && bubble.hidden && !busy && !tv) place(false); }, 25000);
    }
  }

  // ---------- his own cat life (after his menu has gone) ----------
  // every few seconds something cat-like with a short line by his head (L.life); act = a move of the model,
  // pose = a pose held for ms. Never the same twice in a row; nothing while he talks, raps, sleeps or shows the TV.
  var LIFE = {
    stretch: { act: 'stretchArms', icon: '🙆' }, knead: { act: 'typing', icon: '🐾' }, look: { act: 'lookAround', icon: '👀' },
    fly: { act: 'jump', icon: '🪰' }, neck: { act: 'neck', icon: '😼' }, startle: { act: 'nervous', icon: '❗' },
    shrug: { act: 'shrug', icon: '🐟' }, dance: { act: 'dance2', icon: '🎵' },
    bored: { pose: 'cool', ms: 6000, icon: '🧶' }   // (no nap: the lying clip sticks his tail up into the air)
  };
  var lastLife = '', emoteTimer = 0;
  function startLife() {
    clearTimeout(lifeTimer);
    lifeTimer = setTimeout(lifeStep, 2500 + Math.random() * 2500);
  }
  function lifeStep() {
    if (!living || root.hidden) return;
    if (busy || asleep || !bubble.hidden || tv) return startLife();
    var keys = Object.keys(LIFE).filter(function (k) { return k !== lastLife && (!LIFE[k].act || model().can(LIFE[k].act)); });
    var k = keys[Math.floor(Math.random() * keys.length)], d = LIFE[k], ms = 0;
    lastLife = k;
    if (d.act) ms = model().act(d.act);
    if (d.pose) {
      model().setPose(d.pose);
      ms = d.ms;
      setTimeout(function () { if (living && !asleep && bubble.hidden) model().setPose('idle'); }, d.ms);
    }
    ms = ms || 3000;
    var lines = L.life && L.life[k];
    // a caption only now and then (more of them felt made up); the move itself every few seconds
    if (Math.random() < 0.4) emote(d.icon, lines ? pick(lines) : '', Math.max(2800, Math.min(ms, 5200)));
    lifeTimer = setTimeout(lifeStep, ms + 1500 + Math.random() * 3000);
  }
  function emote(icon, line, ms) {
    clearTimeout(emoteTimer);
    emoteEl.innerHTML = '';
    emoteEl.appendChild(el('span', 'kevin-emote-icon', icon));
    if (line) emoteEl.appendChild(el('span', 'kevin-emote-text', line));
    emoteEl.hidden = false;
    emoteEl.style.animationDuration = ms + 'ms';   // fades in, stays, fades out within its time
    emoteEl.classList.remove('on');
    void emoteEl.offsetWidth;
    emoteEl.classList.add('on');
    emoteTimer = setTimeout(emoteOff, ms);
  }
  function emoteOff() { clearTimeout(emoteTimer); emoteEl.hidden = true; emoteEl.classList.remove('on'); }

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
  // the first page of a visit remembers when the previous visit was (for "what's new")
  function noteVisit() {
    if (session.get('kevinVisit')) return;
    session.set('kevinVisit', '1');
    var prev = parseInt(store.get('kevinLastVisit'), 10);
    if (prev > 0) session.set('kevinPrevVisit', String(prev));
    store.set('kevinLastVisit', String(Date.now()));
  }
  function greet() {
    if (adminPage) {
      // the admin dashboard: the to-do list once per visit
      if (/^\/admin(\.jsp)?$/.test(location.pathname) && !session.get('kevinAdmin')) {
        session.set('kevinAdmin', '1');
        setTimeout(function () { if (!acted) adminStatus(); }, 900);
      }
      return;
    }
    // something the visitor has just done (signed in, saved a password…) beats any greeting
    var done = loadReaction();
    if (done) {
      session.set('kevinHello', '1');
      return setTimeout(function () { if (!acted) react(done[0], done[1], done[2]); }, 900);
    }
    // píseň, které chybí kus textu (karta „pomoz nám“): Kevin se zeptá jednou u každé písně, ještě před pozdravem
    var helpCard = document.getElementById('lyric-help');
    if (helpCard && L.help && !store.get('kevinHelp' + helpCard.dataset.song)) {
      store.set('kevinHelp' + helpCard.dataset.song, '1');
      session.set('kevinHello', '1');
      return setTimeout(function () {
        if (acted) return;
        onOwn(pick(L.help.say).replace('{lang}', helpCard.dataset.lang || ''),
          { pose: 'point', after: 'idle', href: '#lyric-help', linkText: L.help.link }, false, 0.5);
        lastAuto = Date.now();
      }, 1500);
    }
    var prev = parseInt(session.get('kevinPrevVisit'), 10);
    if (!session.get('kevinHello')) {
      session.set('kevinHello', '1');
      var d = new Date(), h = d.getHours(), time = h + ':' + String(d.getMinutes()).padStart(2, '0');
      var say1 = function (list) { onOwn(pick(list).replace('{time}', time), { pose: 'point', after: 'idle' }, false, 0); lastAuto = Date.now(); };
      // the very first visit: he sniffs the newcomer; at three in the morning his own line now and then
      var hello = function () { say1(!(prev > 0) && L.first ? L.first : h === 3 && L.greet.three && Math.random() < 0.5 ? L.greet.three : L.greet[dayPart()]); };
      // back after a while: what came out since, otherwise a "back again"
      return setTimeout(function () {
        if (acted) return;
        if (prev > 0 && Date.now() - prev > 30 * 60000) news(false, function () { if (!acted) say1(L.back.plain); }); else hello();
      }, 900);
    }
    var key = pageKey(), lines = L.page[key];
    if (key === 'login' && prev > 0) lines = lines.concat(L.page.loginBack || []);
    // a song he has his own memories of (by the clip on the page; L.songs is keyed by YouTube id)
    var clip = key === 'song' && document.querySelector('main [data-yt]');
    var own = clip && L.songs && L.songs[clip.getAttribute('data-yt')];
    if (own && Math.random() < 0.6) lines = own;
    if (lines && Math.random() < (key === 'error' ? 1 : 0.4)) setTimeout(function () { auto(pick(lines)); }, 1500);
  }

  // What the page says the visitor has just done: [what, lines, pose]. Signing in and out shows as the
  // logout form in the header appearing or going since the last page (remembered in the session).
  function loadReaction() {
    var q = new URLSearchParams(location.search);
    var signedIn = !!document.querySelector('form.logout-form'), before = session.get('kevinAuth');
    session.set('kevinAuth', signedIn ? '1' : '0');
    if (q.get('password_changed') === 'true' || q.get('reset') === '1') return ['pw', L.pw.changed, 'cool'];
    if (q.get('saved') === 'true' && /uzivatel/.test(location.pathname)) return ['profile', L.profile, 'cool'];
    if (pageKey() === 'login' && document.querySelector('.form-alert')) return ['auth', L.auth.fail, 'sulk'];
    if (q.get('welcome') && signedIn) return ['auth', L.auth.welcome || L.auth.in, 'cool'];   // just signed up
    if (before === '0' && signedIn) return ['auth', L.auth.in, 'point'];
    if (before === '1' && !signedIn) return ['auth', L.auth.out, 'idle'];
    return null;
  }

  // An answer to something the visitor did: at most once in 45 s for each kind, never when he was closed
  // with the cross (then he only gives tips). In the paw he peeks out to say it, or the paw gets a dot.
  var reactedAt = {};
  function react(what, lines, pose) {
    if (!lines || (root.hidden && !canPop())) return;
    var now = Date.now();
    if (reactedAt[what] && now - reactedAt[what] < 45000) return;
    reactedAt[what] = now;
    lastAuto = now;
    onOwn(pick(lines), { pose: pose || 'point', after: 'idle' }, false, 0.5);
  }

  // ---------- show / hide ----------
  // He never stands over the page: he waits as the gold paw in the header bar (pocket). Something to
  // say = a gold dot on the paw; a tap on the paw brings him out under the bar to say it (or with his
  // menu), then he goes back. The cross = the visitor wants peace: no dots either (remembered).
  var userHidden = store.get('kevin') === 'hidden';
  function pocket() { return paw.classList.contains('in-header'); }
  function canPop() { return pocket() && !userHidden; }
  function place(out) {
    if (out) ensureModel();
    root.hidden = !out;
    // in the header the paw stays put (nothing in the bar jumps); it shows he is out and takes him back
    paw.hidden = out && !pocket();
    paw.classList.toggle('is-out', out);
    paw.setAttribute('aria-expanded', String(out));
    model().setPaused(!out);
    if (!out) { endRap(); clearTimeout(idleTimer); living = false; clearTimeout(lifeTimer); emoteOff(); }
  }
  // out of the paw he stands just under the header bar – measured, since the big sign above the menu makes
  // the bar taller at the top of the page than --header-h says (he stood over the buttons there)
  var alignRaf = 0;
  function alignUnderHeader() {
    alignRaf = 0;
    var bar = document.getElementById('siteHeader');
    if (!bar || root.hidden) return;
    root.style.setProperty('--kevin-top', Math.max(0, Math.round(bar.getBoundingClientRect().bottom)) + 4 + 'px');
  }
  addEventListener('scroll', function () { if (!alignRaf && !root.hidden) alignRaf = requestAnimationFrame(alignUnderHeader); }, { passive: true });
  addEventListener('resize', function () { if (!alignRaf && !root.hidden) alignRaf = requestAnimationFrame(alignUnderHeader); });
  function popOut() {
    place(true);
    alignUnderHeader();
    root.classList.remove('kevin-in');
    void root.offsetWidth;   // restart the jump-in animation
    root.classList.add('kevin-in');
  }
  var tuckTimer = 0;
  function scheduleTuck() {
    clearTimeout(tuckTimer);
    if (living && !root.hidden) return startLife();   // called out by the visitor: he stays and lives
    if (!pocket()) return;
    tuckTimer = setTimeout(function () {
      if (pocket() && !root.hidden && !busy && !tv && bubble.hidden) place(false);
    }, 900);
  }
  function setHidden(h) {
    userHidden = h;
    if (h) { pending = null; paw.classList.remove('has-news'); }
    store.set('kevin', h ? 'hidden' : 'shown');
    place(!h);
    if (!h) wake();
  }

  // ---------- now and then he takes a walk along the bottom edge of the window ----------
  // A second, small Kevin (his own canvas; the model comes from the browser's cache) jumps up onto the top edge of a card
  // low in the window and walks along it (or, with no card there, along the bottom edge of the window), sometimes
  // stops to look round or wave, and walks out on the other. PC only (no room on a phone), never while the visitor
  // types, while Kevin is out talking, in the admin, when he was sent away with the cross, with reduced motion or
  // save-data. A click on him opens his menu.
  var walker = null, walkK = null, walking = false;
  // what he dances when he stops on his walk
  var WALK_DANCES = ['dance', 'dance2', 'dance3', 'robot', 'silly', 'breakdance', 'flair', 'cheer', 'fistPump'];
  // where his feet are in his picture (the walker's camera: view below), as a share of its height
  var WALK_FEET = (1 + 1 / (5.0 * Math.tan(15 * Math.PI / 180))) / 2;
  // the surfaces he can walk on: cards and panels of the page, the footer
  var SURFACES = '.card, .admin-card, .prose-card, .side-card, .about-card, .card-gold, .acct-card, .auth-card, .feature-card, '
    + '.song-row, .disco-card, .news-card, .quote-card, .donate-card, .feedback-card, .site-footer, footer';
  // the lowest top edge in the window (not under the header bar) with a free stretch above it, where he covers
  // nothing: columns every 20 px are probed every 12 px up to his height over the edge (Kevin never covers content); he walks
  // only along the longest free run
  // free for a walk: empty space, also inside a section or column that only holds the cards (the gap between them);
  // another card, text, a picture, a control, the header or the tapes are not
  function walkFree(el) {
    if (!el || el === document.documentElement || el === document.body) return true;
    if (el.closest('.kevin, .kevin-paw, .bg-slides')) return true;
    return !el.closest(SURFACES + ', a, button, input, select, textarea, label, img, picture, video, iframe, canvas, svg, '
      + 'p, h1, h2, h3, h4, h5, li, pre, blockquote, figure, table, .site-header, nav, form, .tape, .photo-band, '
      + '.cookie-bar, [class*="spotify"], .sp-bar, .sp-minbar, #sp-min, .notif-panel');
  }
  // the longest free stretch over a horizontal edge at y (window coordinates) between from and to, 260 px at least
  function freeRun(y, from, to) {
    var run = null, cur = null;
    for (var x = from + 10; x <= to - 10; x += 20) {
      var free = [6, 18, 30, 42, 54, 66, 78, 90, 102, 114, 124].every(function (dy) { return walkFree(document.elementFromPoint(x, y - dy)); });
      if (free) { if (!cur) cur = { left: x - 10 }; cur.right = x + 10; if (!run || cur.right - cur.left > run.right - run.left) run = { left: cur.left, right: cur.right }; }
      else cur = null;
    }
    return run && run.right - run.left >= 260 ? run : null;
  }
  // { el, r: {top, left, right} }: a card's edge (el) or the window's bottom edge (el null), null = no free ground now
  function findSurface() {
    var best = null, H = window.innerHeight, W = window.innerWidth, top = (document.querySelector('.site-header') || { getBoundingClientRect: function () { return { bottom: 0 }; } }).getBoundingClientRect().bottom;
    document.querySelectorAll(SURFACES).forEach(function (el) {
      if (root.contains(el) || !el.offsetParent) return;
      var b = el.getBoundingClientRect();
      if (b.top < top + 150 || b.top > H - 30 || (best && b.top <= best.r.top)) return;
      // only the part of the edge inside the window (a card in a carousel may stick out)
      var run = freeRun(b.top, Math.max(b.left, 8), Math.min(b.right, W - 8));
      if (run) best = { el: el, r: { top: b.top, left: run.left, right: run.right } };
    });
    if (best) return best;
    var low = freeRun(H, 0, W);
    return low ? { el: null, r: { top: H, left: low.left, right: low.right } } : null;
  }
  function canWalk() {
    return !adminPage && !userHidden && !reduced && !saveData && wideMq.matches && !document.hidden
      && root.hidden && !busy && !isField(document.activeElement) && store.get('kevinLite') !== '1';
  }
  function scheduleWalk() {
    setTimeout(function () { if (canWalk()) walk(); else scheduleWalk(); }, 90000 + Math.random() * 90000);
  }
  function walk() {
    var gl = null;
    try { gl = document.createElement('canvas').getContext('webgl2'); } catch (e) { gl = null; }
    if (!gl) return;
    if (!walker) {
      walker = document.createElement('button');
      walker.type = 'button';
      walker.className = 'kevin-walker';
      walker.hidden = true;
      walker.setAttribute('aria-label', L.ui.call);
      walker.innerHTML = '<canvas aria-hidden="true"></canvas>';
      walker.addEventListener('click', function () { endWalk(); paw.click(); });
      document.body.appendChild(walker);
    }
    var go = function () {
      walking = true;
      // the ground: the top edge of a card or panel low in the window (he walks on it and moves with the page), or
      // else the bottom edge of the window itself; the feet stand exactly on it (WALK_FEET = where they are in his picture)
      // (looked for while he is still hidden: he isn't in the way). Nowhere free: no walk this time.
      var s = findSurface(), x0, x1, ground = null, sy = window.scrollY, fromSide = false, toSide = false;
      if (!s) { walking = false; return scheduleWalk(); }
      walker.hidden = false;
      var w = walker.offsetWidth || 130, h = walker.offsetHeight || 150, c = walker.querySelector('canvas');
      x0 = s.r.left - w * 0.3;
      x1 = s.r.right - w * 0.7;
      if (s.el) {
        x0 += window.scrollX;
        x1 += window.scrollX;
        ground = s.r.top + window.scrollY;
        Object.assign(walker.style, { position: 'absolute', top: (ground - WALK_FEET * h + 1) + 'px', bottom: 'auto' });
      } else {
        // the window's edge: where the free stretch reaches the side of the window he walks in or out from there
        if (s.r.left < 20) { x0 = -w; fromSide = true; }
        if (s.r.right > window.innerWidth - 20) { x1 = window.innerWidth; toSide = true; }
        Object.assign(walker.style, { position: 'fixed', top: 'auto', bottom: (-(1 - WALK_FEET) * h) + 'px' });
      }
      var dir = Math.random() < 0.5 ? 1 : -1, x = dir > 0 ? x0 : x1;
      var inFromSide = dir > 0 ? fromSide : toSide, outToSide = dir > 0 ? toSide : fromSide;
      var stopAt = x0 + w / 2 + (x1 - x0) * (0.25 + Math.random() * 0.5), last = performance.now();
      // the box (160 px) must stand whole on the free stretch
      var rl = s.r.left + (s.el ? window.scrollX : 0), rr = s.r.right + (s.el ? window.scrollX : 0);
      stopAt = Math.min(Math.max(stopAt, rl + 85), rr - 85);
      // a cardboard box on the way now and then (cats and boxes), on the same ground
      var box = boxNext && x1 - x0 > 320 ? cardboardBox(stopAt, ground) : null;   // only on request (tests) until the box has a real look
      boxNext = false;
      // where he stops on the way (in the order he reaches them): one stop, two on a long stretch – mostly to dance
      var stops = !box && x1 - x0 > 700
        ? [x0 + w / 2 + (x1 - x0) * (0.22 + Math.random() * 0.15), x0 + w / 2 + (x1 - x0) * (0.6 + Math.random() * 0.15)]
        : [stopAt];
      if (dir < 0) stops.reverse();
      // his pace: as fast as the floor runs under his planted foot in the walk, so the feet don't skate
      var speed = walkK.walkPxPerSec() || 95;
      walker.dataset.speed = Math.round(speed);   // (for the tests)
      walker.style.transform = 'translateX(' + x + 'px)';
      walkK.setPaused(false);
      var goOn = function () { if (!walking) return; walkK.turn(dir * Math.PI / 2); walkK.hold('walk'); last = performance.now(); requestAnimationFrame(step); };
      // he jumps up onto his ground at one end (or walks in from the side of the window)
      if (!inFromSide) {
        walkK.turn(dir * Math.PI / 2);
        walkK.once('jump');
        walker.classList.add('airborne');
        c.animate([{ transform: 'translateY(' + h * 0.5 + 'px)', opacity: 0 }, { transform: 'translateY(' + -h * 0.22 + 'px)', opacity: 1, offset: 0.55 }, { transform: 'translateY(0)', opacity: 1 }],
          { duration: 900, easing: 'ease-out', fill: 'forwards' });
        setTimeout(function () { walker.classList.remove('airborne'); goOn(); }, 900);
      } else { walker.classList.remove('airborne'); goOn(); }
      // at the far end he jumps off the card and is gone
      function jumpOff() {
        walkK.once('jump');
        walker.classList.add('airborne');
        c.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(' + -h * 0.22 + 'px)', opacity: 1, offset: 0.4 }, { transform: 'translateY(' + h * 0.6 + 'px)', opacity: 0 }],
          { duration: 900, easing: 'ease-in', fill: 'forwards' }).onfinish = endWalk;
      }
      // the card stays his ground: it moved (an image loaded above it) → he moves with it; it is gone (another
      // page) or scrolled far out of sight → the walk is over. On the window's edge the page must not scroll under
      // him (he would cover it).
      function onGround() {
        if (ground == null) return Math.abs(window.scrollY - sy) < 30;
        if (!s.el.isConnected) return false;
        var top = s.el.getBoundingClientRect().top;
        if (top < -200 || top > window.innerHeight + 200) return false;
        if (Math.abs(top + window.scrollY - ground) > 0.5) {
          ground = top + window.scrollY;
          walker.style.top = (ground - WALK_FEET * h + 1) + 'px';
          if (box) box.moveTo(ground);
        }
        return true;
      }
      function step(now) {
        if (!walking) return;
        if (!onGround()) return ground != null && !s.el.isConnected ? endWalk() : jumpOff();
        var dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        var there = stops.length && (dir > 0 ? x + w / 2 >= stops[0] : x + w / 2 <= stops[0]);
        if (there) {
          stops.shift();
          walker.style.transform = 'translateX(' + x + 'px)';
          // the box: he jumps in, peeks out over its edge for a while, jumps out and goes on
          if (box) return intoTheBox(box, goOn);
          walkK.turn(0);
          // mostly a dance (5–7 s), else a wave or a look round – then on his way
          var moves = WALK_DANCES.filter(function (d) { return walkK.has(d); });
          if (moves.length && Math.random() < 0.65) {
            walkK.hold(moves[Math.floor(Math.random() * moves.length)]);
            return setTimeout(goOn, 5000 + Math.random() * 2000);
          }
          return setTimeout(goOn, walkK.once(Math.random() < 0.5 ? 'wave' : 'lookAround') || 2500);
        }
        x += dir * speed * dt;
        walker.style.transform = 'translateX(' + x + 'px)';
        if ((dir > 0 && x >= x1) || (dir < 0 && x <= x0)) return outToSide ? endWalk() : jumpOff();
        requestAnimationFrame(step);
      }
    };
    if (walkK) return go();
    import('/js/kevin-model.js' + (version ? '?' + version : '')).then(function (m) {
      walkK = m.createKevin(walker.querySelector('canvas'), {
        light: document.body.classList.contains('light'),
        src: '/kevin/kevin.glb' + (version ? '?' + version : ''),
        view: { y: 1.0, z: 5.0, look: 1.0 },
        overscan: 1.8,   // the canvas reaches 40 % past his box (effects.css): a dance never gets cut off
        onReady: function () {
          new MutationObserver(function () { walkK.setLight(document.body.classList.contains('light')); })
            .observe(document.body, { attributes: true, attributeFilter: ['class'] });
          go();
        },
        onError: function () { walker.remove(); walker = null; }
      });
    }).catch(function () { /* no walk this time */ });
  }
  // a cardboard box on his ground (a card's top edge in the page at `ground`, or null = the window's bottom edge),
  // its middle at x: the back (inside and back flaps) behind Kevin, the front panel in front of him, so in the box
  // only his head shows over its edge
  var boxNext = false;
  function cardboardBox(x, ground) {
    var back = document.createElement('div'), front = document.createElement('div');
    back.className = 'kevin-box kevin-box-back';
    front.className = 'kevin-box kevin-box-front';
    back.setAttribute('aria-hidden', 'true');
    front.setAttribute('aria-hidden', 'true');
    back.innerHTML = '<svg viewBox="0 0 160 120"><path d="M14 52 L30 22 L130 22 L146 52 Z" fill="#6e4a24"/>'
      + '<path d="M30 22 L18 4 L74 10 L80 22 Z" fill="#c69a63"/><path d="M130 22 L142 6 L88 10 L80 22 Z" fill="#b8884f"/></svg>';
    front.innerHTML = '<svg viewBox="0 0 160 120"><path d="M14 52 L146 52 L146 118 L14 118 Z" fill="#b98a52"/>'
      + '<path d="M14 52 L146 52 L146 60 L14 60 Z" fill="#a2743f"/><path d="M14 52 L4 74 L60 70 L72 52 Z" fill="#d3a56b"/>'
      + '<path d="M146 52 L156 74 L100 70 L88 52 Z" fill="#c99b60"/><rect x="72" y="52" width="16" height="66" fill="#d9c08f" opacity=".75"/>'
      + '<text x="80" y="98" text-anchor="middle" font-size="11" font-family="Arial Black, sans-serif" fill="#5a3a18" opacity=".7" transform="rotate(-4 80 98)">SKELO SQUAD</text></svg>';
    // its bottom (y 118 of 120 in the picture) stands on the edge
    var moveTo = function (g) { [back, front].forEach(function (el) { el.style.top = (g - 118) + 'px'; }); };
    [back, front].forEach(function (el) {
      el.style.left = (x - 80) + 'px';
      if (ground != null) el.classList.add('on-card');
      document.body.appendChild(el);
    });
    if (ground != null) moveTo(ground);
    return { back: back, front: front, moveTo: moveTo, remove: function () { [back, front].forEach(function (el) { el.classList.add('gone'); setTimeout(function () { el.remove(); }, 900); }); } };
  }
  // up, then down into the box (only the head over its edge), a look round, up and out again
  function intoTheBox(box, then) {
    var c = walker.querySelector('canvas');
    walkK.turn(0);
    walkK.once('jump');
    c.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-60px)', offset: 0.45 }, { transform: 'translateY(12px)' }],
      { duration: 1100, easing: 'ease-in-out', fill: 'forwards' });
    setTimeout(function () {
      if (!walking) return;
      // he stands in it and only turns his head: left, right, at you (the lookAround clip bends him down out of sight)
      walkK.hold('idle');
      [[-0.9, 0.1, 0], [0.9, 0.1, 1100], [0, 0.25, 2300]].forEach(function (l) { setTimeout(function () { if (walking) walkK.look(l[0], l[1]); }, l[2]); });
      setTimeout(function () {
        if (!walking) return;
        walkK.once('jump');
        c.animate([{ transform: 'translateY(12px)' }, { transform: 'translateY(-60px)', offset: 0.5 }, { transform: 'translateY(0)' }],
          { duration: 1100, easing: 'ease-in-out', fill: 'forwards' });
        setTimeout(function () { box.remove(); then(); }, 1100);
      }, 3600);
    }, 1100);
  }
  function endWalk() {
    walking = false;
    document.querySelectorAll('.kevin-box').forEach(function (el) { el.remove(); });
    if (walker) { walker.hidden = true; walker.querySelector('canvas').getAnimations().forEach(function (a) { a.cancel(); }); }
    if (walkK) { walkK.hold(null); walkK.setPaused(true); }
    scheduleWalk();
  }

  function start() {
    document.body.appendChild(root);
    placePaw();
    wideMq.addEventListener('change', placePaw);
    noteVisit();
    root.classList.add('kevin-in');
    root.addEventListener('animationend', function done(e) {
      if (e.target !== root) return;
      root.removeEventListener('animationend', done);
      root.classList.remove('kevin-in');
    });
    if (userHidden) { place(false); if (!adminPage) scheduleTip(); return; }
    if (pocket()) { place(false); introPaw(); }   // in the paw until he has something to say (greet below)
    else ensureModel();          // a page without the header bar: he stands there from the start
    wake();
    greet();
    if (!adminPage) { scheduleTip(); scheduleWalk(); }
  }

  // Easter egg: click him over and over (each click within 2.5 s of the last) and at 5, 10 and 20 he
  // has had enough; at 20 he gives up and lies down
  var clicks = 0, lastClick = 0;
  body.addEventListener('click', function () {
    var now = Date.now();
    clicks = now - lastClick < 2500 ? clicks + 1 : 1;
    lastClick = now;
    var lines = L.clicks || [];
    var at = clicks === 5 ? 0 : clicks === 10 ? 1 : clicks === 20 ? 2 : -1;
    if (at < 0 || !lines[at]) return menu();
    acted = true;
    if (busy) endRap();
    show(lines[at], at === 2 ? { pose: 'sleep', ms: 6000 } : { pose: 'sulk', ms: 4200, after: 'idle' });
    if (at === 2) { model().act('roll'); clicks = 0; }
  });
  // a click elsewhere closes the menu (not the rap or a message)
  document.addEventListener('pointerdown', function (e) {
    if (!bubble.hidden && !extra.hidden && !root.contains(e.target)) hideBubble('idle');
  });
  soundBtn.addEventListener('click', function () {
    soundOn = !soundOn;
    store.set('kevinSound', soundOn ? 'on' : 'off');
    syncSound();
    if (!soundOn && stopBeat) { stopBeat(); stopBeat = null; }
  });
  root.querySelector('.kevin-hide').addEventListener('click', function () { setHidden(true); });
  // the paw: on a phone straight to his menu (that is why it was tapped), elsewhere a hello
  // ---------- příchod pacičky do lišty ----------
  // Kevin naskočí až po načtení stránky, tak z toho děláme efekt: kroužek se nabije, puf, jiskry a pacička.
  // Celé jen na první stránce návštěvy, na dalších krátké „hop“. Dokud na ni člověk nikdy neklikl,
  // jednou za čas se pacička zavrtí a zazáří, ať je vidět, že se za ní něco skrývá.
  var pawUsed = store.get('kevinPawUsed') === '1', nudgeTimer = 0;
  function introPaw() {
    if (paw.hidden) return;
    var first = !session.get('kevinPawIntro');
    session.set('kevinPawIntro', '1');
    paw.classList.add(first ? 'paw-arrive' : 'paw-quick');
    setTimeout(function () { paw.classList.remove('paw-arrive', 'paw-quick'); }, first ? 3600 : 900);
    if (!pawUsed && !nudgeTimer) nudgeTimer = setInterval(function () {
      if (document.hidden || paw.hidden || !root.hidden) return;
      paw.classList.remove('paw-nudge');
      void paw.offsetWidth;   // znovu spustit animaci
      paw.classList.add('paw-nudge');
    }, 24000);
  }
  paw.addEventListener('click', function () {
    if (!pawUsed) { pawUsed = true; store.set('kevinPawUsed', '1'); clearInterval(nudgeTimer); paw.classList.remove('paw-nudge'); }
    if (walking) endWalk();   // only one Kevin at a time
    if (!root.hidden) { endRap(); hideBubble('idle'); place(false); return; }   // a second tap: back in
    var said = pending;
    pending = null;
    paw.classList.remove('has-news');
    setHidden(false);
    living = true;   // pulled out by the visitor: after what he says he stays a while and lives
    popOut();
    if (said) show(said[0], said[1]); else if (pocket()) menu(); else show(pick(L.wake), { pose: 'point' });
  });

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
  document.addEventListener('focusin', function (e) {
    if (!isField(e.target)) return;
    if (walking) endWalk();   // the visitor types: no walk across the page
    if (covers(e.target)) root.classList.add('ducked');
  });
  document.addEventListener('focusout', function () {
    setTimeout(function () { if (!isField(document.activeElement)) root.classList.remove('ducked'); }, 150);
  });

  // hooks from the rest of the site
  window.addEventListener('kevin', function (e) {
    var d = e.detail || {};
    if (root.hidden && !canPop()) return;
    if (d.pw && L.pw[d.pw]) {
      lastAuto = 0;   // the visitor is typing: answering is fine
      show(pick(L.pw[d.pw]), { pose: d.pw === 'strong' ? 'cool' : d.pw === 'weak' ? 'sulk' : 'idle', after: 'idle' });
    } else if (d.page && L.page[d.page]) {
      auto(pick(L.page[d.page]));
    } else if (d.avatar) {
      react('profile', L.profile, 'cool');
    } else if (d.comment && L.comment[d.comment]) {
      react('comment', L.comment[d.comment], d.comment === 'added' ? 'cool' : 'idle');
    } else if (d.heart && L.heart[d.heart]) {
      react('heart', L.heart[d.heart], d.heart === 'on' ? 'cool' : 'sulk');
    } else if (d.search && L.search[d.search]) {
      if (Math.random() < 0.5) react('search', L.search[d.search], d.search === 'found' ? 'point' : 'sulk');
    } else if (d.clip && L.clip[d.clip]) {
      if (d.clip !== 'ok' || Math.random() < 0.5) react('clip', L.clip[d.clip], d.clip === 'ok' ? 'cool' : 'sulk');
    } else if (d.walk) {
      // a walk now (also used by the tests); {walk: 'box'} = with the cardboard box
      if (!walking && wideMq.matches && !reduced) { boxNext = d.walk === 'box'; walk(); }
    } else if (d.tip) {
      // another script wants a tip now (also used by the tests): he peeks out to say it
      lastAuto = 0;
      auto(pick(L.tips || L.idle), 'point', 1, true);
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
