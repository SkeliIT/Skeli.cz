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
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // ---------- DOM ----------
  var root = document.createElement('div');
  root.className = 'kevin';
  root.innerHTML =
    '<div class="kevin-bubble" role="status" aria-live="polite" hidden><p class="kevin-text"></p><a class="kevin-link" hidden></a><div class="kevin-extra" hidden></div></div>'
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
  var extra = root.querySelector('.kevin-extra');
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
  var hideTimer = 0, busy = false, autoCount = 0, lastAuto = 0, hideAfter = 'idle', hideMs = 0;
  // opts: pose, after (pose when the bubble goes), ms, extra (a node under the text: buttons,
  // a search field, results), href + linkText (a link under the text)
  function show(msg, opts) {
    opts = opts || {};
    clearTimeout(hideTimer);
    text.textContent = msg;
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
    bubble.hidden = true;
    extra.innerHTML = '';
    root.classList.remove('talking');
    model().setTalking(false);
    model().setPose(pose || 'idle');
  }
  // the bubble stays while the visitor points at it or types in it
  function holdBubble() { clearTimeout(hideTimer); }
  function releaseBubble() {
    if (bubble.hidden || bubble.contains(document.activeElement)) return;
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
  function auto(msg, pose, peekChance) {
    var now = Date.now();
    if (busy || root.hidden || autoCount >= 6 || now - lastAuto < 40000 || !bubble.hidden) return;
    autoCount++;
    lastAuto = now;
    if (Math.random() < (peekChance == null ? 0.5 : peekChance)) startPeek();
    show(msg, { pose: pose || 'point' });
  }

  // ---------- now and then he peeks out from the side of the screen, halfway down ----------
  var peeking = false;
  function canPeek() {
    return window.innerWidth > 1024 && !reduced && !root.classList.contains('ducked') && !tv;
  }
  function startPeek() {
    if (peeking || !canPeek()) return;
    peeking = true;
    var right = Math.random() < 0.5;
    root.style.setProperty('--peek-y', Math.round(window.innerHeight * (0.28 + Math.random() * 0.3)) + 'px');
    root.classList.remove('kevin-in', 'peek-out');
    root.classList.add('peek', right ? 'peek-right' : 'peek-left');
    model().look(right ? -0.9 : 0.9, 0.1);   // he looks into the page
  }
  function endPeek() {
    if (!peeking) return;
    peeking = false;
    root.classList.add('peek-out');
    setTimeout(function () {
      if (peeking) return;   // a new peek started meanwhile
      root.classList.remove('peek', 'peek-left', 'peek-right', 'peek-out');
      root.classList.add('kevin-in');   // pops back up in his corner
    }, 550);
  }
  // a tip or a joke every minute and a half or so, while someone is on the page
  function scheduleTip() {
    setTimeout(function () {
      if (!document.hidden && !asleep) auto(pick(Math.random() < 0.6 ? (L.tips || L.idle) : L.idle), 'point', 0.8);
      scheduleTip();
    }, 75000 + Math.random() * 45000);
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
            rapTimer = setTimeout(endRap, 8000);
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
    if (busy) return endRap();
    wake();
    if (!bubble.hidden && extra.querySelector('.kevin-menu')) return hideBubble('idle');
    var box = el('div', 'kevin-menu');
    var items = adminPage
      ? [['status', 'fa-clipboard-check', L.admin.status], ['find', 'fa-magnifying-glass', L.menu.find], ['play', 'fa-play', L.menu.play]]
      : [['find', 'fa-magnifying-glass', L.menu.find], ['play', 'fa-play', L.menu.play], ['rap', 'fa-microphone', L.menu.rap],
         ['news', 'fa-bolt', L.menu.news], ['fun', 'fa-wand-magic-sparkles', L.menu.fun]];
    items.forEach(function (it) {
      var b = el('button', 'kevin-chip');
      b.type = 'button';
      b.innerHTML = '<i class="fa-solid ' + it[1] + '" aria-hidden="true"></i> ';
      b.appendChild(document.createTextNode(it[2]));
      b.addEventListener('click', function () {
        ({ status: adminStatus, find: find, play: play, rap: rap, news: function () { news(true); }, fun: surprise })[it[0]]();
      });
      box.appendChild(b);
    });
    show(L.menu.hint, { pose: 'point', extra: box });
  }

  // 1) find a song by its name or a line of its lyrics
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
    show(L.find.prompt, { pose: 'idle', extra: box, ms: 30000 });
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
          text.textContent = found.length ? say(L.find.found, found.length) : L.find.none;
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
    getJson('/api/kevin/random').then(function (c) {
      if (!c || !/^[\w-]{6,20}$/.test(c.youtubeId)) return show(L.play.fail, { pose: 'sulk' });
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
      document.body.appendChild(tv);
      root.classList.add('has-tv');
      show(say(pick(L.play.intro), 0, c.title), { pose: 'cool', href: c.href, linkText: L.play.song, ms: 8000 });
    });
  }

  // 2) what's new since the last visit (the visit before this browser session)
  function news(asked, onEmpty) {
    var prev = session.get('kevinPrevVisit');
    if (!prev) { if (asked) show(L.news.first, { pose: 'point', href: '/music.jsp', linkText: L.news.link }); return; }
    getJson('/api/kevin/news?since=' + encodeURIComponent(prev)).then(function (n) {
      var parts = [];
      if (n && n.clips && n.clips.length === 1) parts.push(say(L.news.clip, 1, n.clips[0].title));
      if (n && n.clips && n.clips.length > 1) parts.push(say(L.news.clips, n.clips.length, n.clips[0].title));
      if (n && n.posts) parts.push(say(L.news.posts, n.posts));
      if (!parts.length) { if (asked) show(L.news.none, { pose: 'sulk', after: 'idle' }); else if (onEmpty) onEmpty(); return; }
      if (!asked && acted) return;
      var href = n.clips && n.clips.length ? n.clips[0].href : '/aktuality.jsp';
      lastAuto = Date.now();
      show(L.news.intro + ' ' + parts.join(', ') + '.', { pose: 'point', href: href, linkText: L.news.link, ms: 16000 });
    });
  }

  // 7) admin pages: the site's to-dos
  function adminStatus() {
    getJson('/admin/kevin').then(function (s) {
      if (!s) return;
      var parts = [], href = null, linkText = null;
      if (s.reports) { parts.push(say(L.admin.reports, s.reports)); href = '/admin.jsp#reports'; linkText = L.admin.toReports; }
      if (s.clipsWithoutSong) parts.push(say(L.admin.clips, s.clipsWithoutSong, s.newestClipWithoutSong || ''));
      if (s.songsWithoutLyrics) parts.push(say(L.admin.lyrics, s.songsWithoutLyrics));
      if (!href && parts.length) { href = '/admin/lyrics'; linkText = L.admin.toLyrics; }
      if (!parts.length) return show(L.admin.clean, { pose: 'cool' });
      show(L.admin.hello + ' ' + parts.join('; ') + '.', { pose: 'point', href: href, linkText: linkText, ms: 14000 });
    });
  }

  // the old surprises: never the same one twice in a row
  var lastReaction = '';
  function surprise() {
    var options = ['beatbox', 'spin', 'cool', 'sulk'].filter(function (r) { return r !== lastReaction; });
    var r = pick(options);
    lastReaction = r;
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
    extra.innerHTML = '';
    extra.hidden = true;
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
    if (!session.get('kevinHello')) {
      session.set('kevinHello', '1');
      var hello = function () { show(pick(L.greet[dayPart()]), { pose: 'point', after: 'idle' }); lastAuto = Date.now(); };
      // back after a while: what came out since, otherwise the usual hello
      var prev = parseInt(session.get('kevinPrevVisit'), 10);
      return setTimeout(function () {
        if (acted) return;
        if (prev > 0 && Date.now() - prev > 30 * 60000) news(false, function () { if (!acted) hello(); }); else hello();
      }, 900);
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
    noteVisit();
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
    if (!adminPage) scheduleTip();
  }

  body.addEventListener('click', menu);
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
    } else if (d.tip) {
      // another script wants a tip now (also used by the tests): he peeks out to say it
      lastAuto = 0;
      auto(pick(L.tips || L.idle), 'point', 1);
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
