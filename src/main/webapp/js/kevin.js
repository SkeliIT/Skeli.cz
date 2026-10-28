// Kevin – rapující kocour SKELO SQUAD: čeká jako zlatá tlapka v liště a vylézá z ní (css/effects.css).
// 3D model (js/kevin-model.js, Three.js) se načte až po stránce; s omezeným pohybem,
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
  // jiskry, které odletí, když pacička vyskočí (css/effects.css: paw-arrive)
  paw.innerHTML = ''
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
  var k = null;   // ovladač modelu z js/kevin-model.js
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
  var hideTimer = 0, busy = false, autoCount = 0, lastAuto = 0, hideAfter = 'idle', hideMs = 0, hideAt = 0;
  // out of the paw because the visitor called him: once the bubble is gone he stays and lives his cat life (LIFE)
  var living = false, lifeTimer = 0;
  // opts: pose, after (pose when the bubble goes), ms, extra (a node under the text: buttons,
  // a search field, results), href + linkText (a link under the text)
  var pending = null;   // what he wanted to say while in the paw (said when the paw is tapped)
  // Klik na bublinu s tipem nebo hláškou ke stránce vede tam, o čem mluví: opts.go =
  // '/cesta' (jiná stránka; když už na ní jsi, sjede k její hlavní části), '.selektor' (část této stránky
  // – sjede k ní a rozbliká ji), 'btn:#id' (tlačítko – rozbliká ho), 'menu:play' (pustí něco), 'login'
  // (přihlášení, přihlášenému Texty). Tipy L.tips jsou ve všech jazycích ve stejném pořadí → TIP_GO.
  var TIP_GO = ['/texty.jsp', 'btn:#themeToggle', 'login', '/texty.jsp', 'menu:play', '/texty.jsp'];
  var PAGE_GO = {
    home: '.hero', music: '[data-clip-player]', lyrics: '.song-list', song: '[data-clip-player]', about: '.about-intro',
    news: '.news-grid', register: '.auth-card', login: '.auth-card', donate: '.donate-card', error: '.error-page .btn-primary'
  };
  var PAGE_PATHS = { '/texty.jsp': 'lyrics', '/music.jsp': 'music', '/about.jsp': 'about', '/aktuality.jsp': 'news', '/donate.jsp': 'donate', '/login.jsp': 'login' };
  var currentGo = null;
  function highlight(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    el.classList.remove('kevin-target'); void el.offsetWidth; el.classList.add('kevin-target');
    setTimeout(function () { el.classList.remove('kevin-target'); }, 2600);
  }
  function goTo(go) {
    if (!go) return;
    hideBubble('point');
    if (go === 'menu:play') return play();
    if (go === 'menu:news') return news(true);
    if (go === 'menu:pong') return pong();
    if (go === 'login') go = document.querySelector('form.logout-form') ? '/texty.jsp' : '/login.jsp';
    if (go.indexOf('btn:') === 0) return highlight(document.querySelector(go.slice(4)));
    if (go.charAt(0) !== '/') return highlight(document.querySelector(go));
    if (PAGE_PATHS[go] && PAGE_PATHS[go] === pageKey()) return highlight(document.querySelector(PAGE_GO[PAGE_PATHS[go]]));
    var a = document.createElement('a');   // přes odkaz, ať ho chytí PJAX (Kevin zůstane, stránka se vymění)
    a.href = go; a.hidden = true;
    document.body.appendChild(a); a.click(); a.remove();
  }
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
    currentGo = opts.go || null;
    bubble.classList.toggle('has-go', !!currentGo);
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
    // opts.read = delší čtení (novinky): čas podle délky textu bez stropu, i pro pomalejší čtenáře
    hideMs = opts.ms || (opts.read ? Math.max(9000, 5000 + msg.length * 110) : opts.extra ? 20000 : Math.min(16000, 4500 + msg.length * 85));
    hideAt = Date.now() + hideMs;
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
    // po odjetí myši zůstane aspoň tolik, kolik ještě zbývalo (nejméně 6 s)
    hideTimer = setTimeout(function () { hideBubble(hideAfter); }, Math.max(6000, hideAt - Date.now()));
  }
  text.addEventListener('click', function () { if (currentGo) goTo(currentGo); });
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
  function auto(msg, pose, peekChance, isTip, go) {
    var now = Date.now();
    if (busy || autoCount >= 6 || now - lastAuto < 40000 || !bubble.hidden) return;
    if (root.hidden && userHidden && !isTip) return;
    if (root.hidden && !pocket()) return;
    autoCount++;
    lastAuto = now;
    onOwn(msg, { pose: pose || 'point', go: go }, isTip, peekChance);
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
    if (el.closest('.kevin, .kevin-paw, .kevin-walker, .bg-slides, .texty-bg')) return true;   // the background photos are background
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
        if (tip && L.pongInvite && !session.get('kevinInvite') && Math.random() < 0.25) {
          session.set('kevinInvite', '1');
          auto(pick(L.pongInvite), 'point', 0.8, true, 'menu:pong');
        } else if (tip && L.tips) { var i = Math.floor(Math.random() * L.tips.length); auto(L.tips[i], 'point', 0.8, true, TIP_GO[i]); }
        else auto(pick(own), 'point', 0.8, false);
      }
      scheduleTip();
    }, 75000 + Math.random() * 45000);
  }

  // ---------- beat (js/kevin/beat.js) – stáhne se až při prvním rapu / beatboxu ----------
  var beatMod = null;
  function loadBeat() {
    if (beatMod) return Promise.resolve(beatMod);
    return new Promise(function (resolve) {
      var sc = document.createElement('script');
      sc.src = '/js/kevin/beat.js' + (version ? '?' + version : '');
      sc.onload = function () { beatMod = window.KevinBeat({ soundOn: function () { return soundOn; } }); resolve(beatMod); };
      // bez beatu (síť, blokovaný skript): rapuje se dál potichu
      sc.onerror = function () { resolve({ beat: function () { return function () {}; }, chooseStyle: function () { return { flow: 90, label: 'beat' }; } }); };
      document.head.appendChild(sc);
    });
  }

  // ---------- rap: the words appear on the beat ----------
  var stopBeat = null, rapTimer = 0;
  function rap() {
    busy = true;
    clearTimeout(hideTimer);
    model().setPose('rap');
    Promise.all([fetch('/api/kevin/bars', { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.status === 200 ? r.json() : null; })
      .catch(function () { return null; }), loadBeat()])
      .then(function (res) {
        var bars = res[0], B = res[1];
        if (!bars || !bars.lines || !bars.lines.length) { busy = false; return show(pick(L.rap.fail), { pose: 'sulk', after: 'idle' }); }
        // a random style; his words follow its flow (one word an eighth, a breath after a comma). Before the bars:
        // which song they are from and which beat plays (so the user can say which beats to keep)
        var style = B.chooseStyle(), eighth = 60000 / style.flow / 2;
        var words = (pick(L.rap.intro) + ' / ♪ ' + (bars.song || '') + ' (' + style.label + ') / ' + bars.lines.join(' / ')).split(/\s+/);
        stopBeat = B.beat(style, ((words.length + 12) * eighth) / 1000 + 1);
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
      // pořadí = rozložení: mřížka 2×2 (hledat, pustit, novinky, něco udělej), pod ní hra přes celou šířku,
      // dole nenápadně nahlášení problému (Zarapuj je zatím vypnuté: kevin-napady.md)
      : [['find', 'fa-magnifying-glass', L.menu.find], ['play', 'fa-play', L.menu.play],
         ['news', 'fa-bolt', L.menu.news], ['fun', 'fa-wand-magic-sparkles', L.menu.fun],
         ['pong', 'fa-table-tennis-paddle-ball', L.menu.pong || 'Pong'], ['report', 'fa-triangle-exclamation', L.menu.report]];
    items.forEach(function (it) {
      var b = el('button', 'kevin-chip' + (it[0] === 'pong' ? ' is-game' : it[0] === 'report' ? ' is-quiet' : ''));
      b.type = 'button';
      b.dataset.act = it[0];
      b.innerHTML = '<i class="fa-solid ' + it[1] + '" aria-hidden="true"></i> ';
      b.appendChild(document.createTextNode(it[2]));
      b.addEventListener('click', function () {
        ({ status: adminStatus, find: find, play: play, rap: rap, pong: pong, news: function () { news(true); }, fun: surprise, report: report })[it[0]]();
      });
      box.appendChild(b);
    });
    living = true;
    // the menu goes after a while when nobody touches it (pointing at it or typing keeps it), he stays
    show(L.menu.hint, { pose: 'point', extra: box, ms: 9000 });
  }

  // CatSmash: hra přes celou obrazovku (složka js/catsmash/ se načte až teď); Kevin v rohu se zatím schová
  function pong() {
    hideBubble('idle');
    var go = function () {
      var css = document.querySelector('link[data-catsmash]');
      if (!css || css.sheet) return window.KevinPong.open({ version: version });
      var once = function () { css.removeEventListener('load', once); css.removeEventListener('error', once); window.KevinPong.open({ version: version }); };
      css.addEventListener('load', once); css.addEventListener('error', once);
    };
    if (window.KevinPong) return go();
    // po sobě: texty hry v jazyce stránky, Kevinovy hlášky do zápasu, pevná data, zvuky a nakonec hra
    // (js/catsmash/hra.js potřebuje data a zvuky); hlášky a texty můžou chybět, hraje se i tak
    var v = version ? '?' + version : '';
    var parts = ['/js/lines/catsmash-' + lang + '.js', '/js/catsmash/hlasky.js', '/js/catsmash/data.js', '/js/catsmash/zvuky.js', '/js/catsmash/hra.js'];
    var load = function (src, done) { var sc = document.createElement('script'); sc.src = src; sc.onload = done; sc.onerror = done; document.head.appendChild(sc); };
    // styly hry (css/catsmash.css) – na ostatních stránkách se nestahují; hra začne až s nimi, ať neproblikne bez vzhledu
    if (!document.querySelector('link[data-catsmash]')) {
      var css = document.createElement('link');
      css.rel = 'stylesheet'; css.href = '/css/catsmash.css' + v; css.setAttribute('data-catsmash', '');
      document.head.appendChild(css);
    }
    (function next(i) { if (i < parts.length) load(parts[i] + v, function () { next(i + 1); }); else if (window.KevinPong) go(); })(0);
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
  // Web je ve výstavbě: dokud ho nevyhlásíme za hotový (UNDER_CONSTRUCTION = false), Kevin to řekne každému
  // jednou za návštěvu – i tomu, kdo ho zavřel (jako tip); klik na bublinu = Co je nového. Když zrovna nejde
  // mluvit (bublina, odstup mezi hláškami), zkusí to znovu za 5 s.
  var UNDER_CONSTRUCTION = true;
  function buildingNotice() {
    if (!UNDER_CONSTRUCTION || !L.building || session.get('kevinBuilding')) return;
    var tries = 0;
    (function attempt() {
      if (session.get('kevinBuilding') || ++tries > 12) return;
      var before = autoCount;
      if (bubble.hidden && !busy) lastAuto = 0;      // výjimka z odstupu 40 s mezi hláškami
      auto(pick(L.building), 'point', 0.9, true, 'menu:news');
      if (autoCount > before) session.set('kevinBuilding', '1');
      else setTimeout(attempt, 5000);
    })();
  }

  // Novinky webu (kevin/novinky.json, nejnovější první): krátké lidské věty o tom, co jsme na webu změnili,
  // v 5 jazycích, s odkazem; přibývají při nasazení. „Co je nového“ = nové klipy a příspěvky + změny webu od
  // minulé návštěvy; když od minula nic, aspoň poslední novinka z dílny.
  var siteNews = null;
  function loadSiteNews() {
    if (siteNews) return Promise.resolve(siteNews);
    return getJson('/kevin/novinky.json' + (version ? '?' + version : '')).then(function (j) { siteNews = Array.isArray(j) ? j : []; return siteNews; });
  }
  function siteText(list) { return list.map(function (e) { return e[lang] || e.en || e.cs; }).join(' '); }
  function news(asked, onEmpty) {
    var prev = +session.get('kevinPrevVisit') || 0;
    Promise.all([prev ? getJson('/api/kevin/news?since=' + encodeURIComponent(prev)) : Promise.resolve(null), loadSiteNews()]).then(function (r) {
      var n = r[0], site = r[1] || [], parts = [];
      if (n && n.clips && n.clips.length === 1) parts.push(say(L.news.clip, 1, n.clips[0].title));
      if (n && n.clips && n.clips.length > 1) parts.push(say(L.news.clips, n.clips.length, n.clips[0].title));
      if (n && n.posts) parts.push(say(L.news.posts, n.posts));
      // změny webu od minulé návštěvy (datum je den nasazení – počítá se celý ten den), nejvýš dvě
      var fresh = prev ? site.filter(function (e) { return Date.parse(e.d) + 86400000 > prev; }).slice(0, 2) : [];
      if (!parts.length && !fresh.length) {
        if (!asked) { if (onEmpty) onEmpty(); return; }
        if (site.length) return show(pick(L.news.webLast) + ' ' + siteText(site.slice(0, 1)), { pose: 'point', href: site[0].href, linkText: L.news.link, read: true, extra: newsHistory(site) });
        if (!prev) return show(pick(L.news.first), { pose: 'point', href: '/music.jsp', linkText: L.news.link });
        return show(pick(L.news.none), { pose: 'sulk', after: 'idle' });
      }
      if (!asked && acted) return;
      var href = n && n.clips && n.clips.length ? n.clips[0].href : fresh.length ? fresh[0].href : '/aktuality.jsp';
      lastAuto = Date.now();
      // Kevin řekne jen to nejnovější; posledních 5 novinek webu je pod šipkou v bublině
      var text = pick(asked ? L.news.some : L.back.news)
        + (parts.length ? ' ' + L.news.lead + ' ' + parts.join(', ') + '.' : '')
        + (fresh.length ? ' ' + pick(L.news.web) + ' ' + siteText(fresh.slice(0, 1)) : '');
      show(text, { pose: 'point', href: href, linkText: L.news.link, read: true, extra: newsHistory(site) });
    });
  }
  // rozbalovací seznam posledních novinek webu (datum, věta, odkaz)
  function newsHistory(site) {
    if (!site || site.length < 2) return null;
    var box = document.createElement('details');
    box.className = 'kevin-history';
    var sum = document.createElement('summary');
    sum.textContent = L.news.history || '…';
    box.appendChild(sum);
    var ol = document.createElement('ol');
    site.slice(0, 5).forEach(function (e) {
      var li = document.createElement('li'), t = document.createElement('time'), d = new Date(e.d + 'T12:00:00');
      t.dateTime = e.d;
      t.textContent = isNaN(d) ? e.d : d.toLocaleDateString(lang, { day: 'numeric', month: 'numeric' });
      li.appendChild(t);
      var a = document.createElement(e.href ? 'a' : 'span');
      if (e.href) a.href = e.href;
      a.textContent = e[lang] || e.en || e.cs;
      li.appendChild(a);
      ol.appendChild(li);
    });
    box.appendChild(ol);
    return box;
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
  var BIG_SURPRISES = ['beatbox', 'rhyme', 'dance', 'dance2', 'dance3', 'robot', 'silly', 'breakdance', 'flair', 'dive', 'cheer', 'jump'];
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
      loadBeat().then(function (B) { if (busy && !stopBeat) stopBeat = B.beat(B.chooseStyle(), long / 1000); });   // beat přijde, jakmile je stažený
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
    stretch: { act: 'stretchArms', icon: '🙆' }, robot: { act: 'robot', icon: '🤖' }, look: { act: 'lookAround', icon: '👀' },
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
    // odkaz jen tam, kde hláška k něčemu vede (podpora → možnosti podpory, chyba → tlačítko zpět); obecné poznámky ke stránce nejsou odkazy
    var linked = key === 'donate' || key === 'error' ? PAGE_GO[key] : null;
    if (lines && Math.random() < (key === 'error' ? 1 : 0.4)) setTimeout(function () { auto(pick(lines), null, null, false, linked); }, 1500);
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

  // ---------- procházky (js/kevin/prochazky.js) – jen na širokých obrazovkách, načtou se až když jsou potřeba ----------
  var W = null, walkLoading = false;
  function loadWalk(then) {
    if (W) { if (then) then(); return; }
    if (walkLoading || !wideMq.matches || reduced || adminPage) return;
    walkLoading = true;
    var sc = document.createElement('script');
    sc.src = '/js/kevin/prochazky.js' + (version ? '?' + version : '');
    sc.onload = function () {
      W = window.KevinWalk({ root: root, paw: paw, store: store, L: L, version: version, wideMq: wideMq, reduced: reduced,
        saveData: saveData, adminPage: adminPage, isField: isField,
        busy: function () { return busy; }, userHidden: function () { return userHidden; } });
      if (then) then();
    };
    document.head.appendChild(sc);
  }
  function walking() { return !!(W && W.isWalking()); }
  function endWalk() { if (W) W.end(); }

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
    if (!adminPage) setTimeout(buildingNotice, 9000);
    if (userHidden) { place(false); introPaw(); if (!adminPage) scheduleTip(); return; }   // pacička se vylíhne i tomu, kdo Kevina zavřel
    if (pocket()) { place(false); introPaw(); }   // in the paw until he has something to say (greet below)
    else ensureModel();          // a page without the header bar: he stands there from the start
    wake();
    greet();
    if (!adminPage) { scheduleTip(); loadWalk(function () { W.schedule(); }); }
    // ukázka kousku hned: adresa ?kevin=drop | sit | run | walk | all (všechno najednou; dokola na /kevin-ukazka.jsp) (na zkoušku, jinak chodí sám jednou za čas)
    var show = new URLSearchParams(location.search).get('kevin');
    if (show === 'pong') setTimeout(pong, 1200);   // ?kevin=pong = rovnou hra (odkaz z menu, testy)
    if (/^(drop|sit|run|walk|climb|all)$/.test(show || '')) setTimeout(function () { window.dispatchEvent(new CustomEvent('kevin', { detail: { walk: show } })); }, 2500);
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
  // Kevin naskočí až po načtení stránky, tak z toho děláme efekt líhnutí: tlačítko se cuká, praskne a vyskočí pacička.
  // Celé jen na první stránce návštěvy, na dalších krátké „hop“. Dokud na ni člověk nikdy neklikl,
  // jednou za čas se pacička zavrtí a zazáří, ať je vidět, že se za ní něco skrývá.
  var pawUsed = store.get('kevinPawUsed') === '1', nudgeTimer = 0;
  function introPaw() {
    if (paw.hidden) return;
    var first = !session.get('kevinPawIntro');
    session.set('kevinPawIntro', '1');
    paw.classList.add(first ? 'paw-arrive' : 'paw-quick');
    // líhnutí: levý konec lišty s tlačítky (kulaté místo pacičky) se pocuká, přeběhne po něm prasklina, šup
    var shell = first ? paw : null, crack = null;
    if (shell) {
      shell.classList.add('paw-hatch');
      crack = document.createElement('span');
      crack.className = 'paw-hatch-crack';
      crack.setAttribute('aria-hidden', 'true');
      crack.innerHTML = '<svg viewBox="0 0 100 20" preserveAspectRatio="none"><polyline points="0,8 18,14 34,5 52,15 68,6 84,13 100,9"/></svg>';
      shell.appendChild(crack);
    }
    setTimeout(function () {
      paw.classList.remove('paw-arrive', 'paw-quick');
      if (shell) shell.classList.remove('paw-hatch');
      if (crack) crack.remove();
    }, first ? 4200 : 900);
    if (!pawUsed && !nudgeTimer) nudgeTimer = setInterval(function () {
      if (document.hidden || paw.hidden || !root.hidden) return;
      paw.classList.remove('paw-nudge');
      void paw.offsetWidth;   // znovu spustit animaci
      paw.classList.add('paw-nudge');
    }, 24000);
  }
  paw.addEventListener('click', function () {
    if (!pawUsed) { pawUsed = true; store.set('kevinPawUsed', '1'); clearInterval(nudgeTimer); paw.classList.remove('paw-nudge'); }
    if (walking()) endWalk();   // only one Kevin at a time
    // Kevin je venku (třeba zrovna něco říká): ťuknutí na tlapku otevře jeho menu – dřív ho jen zavřelo, což
    // mátlo (lidi si mysleli, že tlapka nic nedělá). Zpátky do tlapky až druhé ťuknutí při otevřeném menu.
    if (!root.hidden) {
      if (!bubble.hidden && extra.querySelector('.kevin-menu')) { hideBubble('idle'); place(false); return; }
      endRap();
      menu();
      return;
    }
    var said = pending;
    pending = null;
    paw.classList.remove('has-news');
    setHidden(false);
    living = true;   // pulled out by the visitor: after what he says he stays a while and lives
    popOut();
    // čekající zpráva (tečka na tlapce) má přednost, jinak rovnou menu – tlapka = „co pro tebe můžu udělat“
    if (said) show(said[0], said[1]); else menu();
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
    if (walking()) endWalk();   // the visitor types: no walk across the page
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
      if (!walking() && wideMq.matches && !reduced) loadWalk(function () { W.force(d.walk); });   // 'drop', 'sit', 'run' = vynutit (testy, ukázky)
    } else if (d.say) {
      // hláška zvenku (hra: odchod uprostřed zápasu) – řekne ji, i když je v tlapce (zlatá tečka)
      onOwn(d.say, { pose: 'point' }, true, 0.9);
    } else if (d.tip) {
      // another script wants a tip now (also used by the tests): he peeks out to say it
      lastAuto = 0;
      var ti = Math.floor(Math.random() * L.tips.length);
      auto(L.tips[ti], 'point', 1, true, TIP_GO[ti]);
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
