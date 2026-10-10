/* Karaoke on the song page: while the clip plays, the line being sung is burnt in by the laser
   (the same white-hot spot, sparks and cooling embers as the quote on the home page), the lines
   already sung glow like embers (dark scorch marks in the light theme) and the page follows the song.

   Timings: /api/karaoke?yt=<clip> = [start, end] for every non-empty line of the lyrics (made by
   tools/karaoke-align.py, corrected in the admin). They count lines of the Czech text; a translation
   with the same lines uses them too, otherwise karaoke stays off. Time: the YouTube player reports it
   by postMessage (the same messages the IFrame API uses). The "Karaoke" button turns it off. */
(function () {
  var pre = document.querySelector('.lyric-page .lyrics-text pre');
  var player = document.getElementById('ytFacade');
  var button = document.getElementById('karaokeToggle');
  if (!pre || !player || !button || pre.dataset.karaoke) return;
  pre.dataset.karaoke = '1';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var original = pre.textContent;
  var lines = [];            // the spans of the non-empty lines, in order
  var data = null, clipId = null, on = true, cur = -1;
  try { on = localStorage.getItem('karaoke') !== 'off'; } catch (e) {}

  // ---------- the lyrics as one span per line ----------
  function split() {
    pre.textContent = '';
    lines = [];
    original.split('\n').forEach(function (line, i, all) {
      if (line.trim()) {
        var s = document.createElement('span');
        s.className = 'k-line';
        s.textContent = line;
        pre.appendChild(s);
        lines.push(s);
      } else if (line) {
        pre.appendChild(document.createTextNode(line));
      }
      if (i < all.length - 1) pre.appendChild(document.createTextNode('\n'));
    });
  }
  function unsplit() { pre.textContent = original; lines = []; }

  // ---------- timings of the clip that shows ----------
  function load(id) {
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(id || '') || id === clipId) return;
    clipId = id; data = null; stop();
    button.hidden = true;
    fetch('/api/karaoke?yt=' + encodeURIComponent(id)).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || clipId !== id || !d.times) return;
      var count = original.split('\n').filter(function (l) { return l.trim(); }).length;
      if (count !== d.lines || d.times.length !== d.lines) return;   // another text than the timings were made for
      data = d;
      button.hidden = false;
      paintButton();
      if (playing && on) start();
    }).catch(function () {});
  }

  function paintButton() {
    button.setAttribute('aria-pressed', String(on));
    button.classList.toggle('on', on);
  }
  button.addEventListener('click', function () {
    on = !on;
    try { localStorage.setItem('karaoke', on ? 'on' : 'off'); } catch (e) {}
    paintButton();
    if (!on) stop();
  });

  // ---------- where the player is ----------
  var playing = false, base = 0, baseAt = 0, frame = null, hello = null;
  function watchFrame() {
    var f = player.querySelector('iframe[src]');
    if (f === frame) return;
    frame = f; playing = false; base = 0; baseAt = performance.now();
    clearInterval(hello);
    if (!frame) { stop(); return; }
    var say = function () { try { frame.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 2, channel: 'widget' }), '*'); } catch (e) {} };
    frame.addEventListener('load', say);
    hello = setInterval(say, 1000); say();
  }
  new MutationObserver(function () { watchFrame(); load(player.getAttribute('data-yt')); })
    .observe(player, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-yt'] });
  window.addEventListener('message', function (e) {
    if (!frame || e.source !== frame.contentWindow) return;
    var m; try { m = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (er) { return; }
    if (!m) return;
    clearInterval(hello);
    var info = m.info;
    if (m.event === 'onStateChange' && typeof info === 'number') { base = now(); baseAt = performance.now(); playing = info === 1; }
    if (info && typeof info === 'object') {
      if (typeof info.playerState === 'number') playing = info.playerState === 1;
      if (typeof info.currentTime === 'number') { base = info.currentTime; baseAt = performance.now(); }
    }
    if (playing && on && data) start();
  });
  function now() { return base + (playing ? (performance.now() - baseAt) / 1000 : 0); }

  // ---------- the laser: a canvas over the whole window for the hot spot and the sparks ----------
  var cv = null, g = null, spot = null, sparks = [], last = 0, running = false;
  var burning = null, letters = [];
  function canvas() {
    if (cv) return;
    cv = document.createElement('canvas');
    cv.className = 'karaoke-fx';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    g = cv.getContext('2d');
  }

  function start() {
    if (running) return;
    running = true;
    if (!lines.length) split();
    pre.classList.add('karaoke');
    canvas();
    last = performance.now();
    requestAnimationFrame(tick);
  }
  function stop() {
    running = false; spot = null; sparks = []; cur = -1; burning = null; letters = [];
    if (cv) { cv.remove(); cv = null; }
    pre.classList.remove('karaoke');
    if (lines.length) unsplit();
  }

  // the current line burns letter by letter: it is split into letters while it burns
  function burn(i) {
    if (burning) {                               // the previous line cools down to plain text
      burning.textContent = burning.textContent;
      burning.classList.remove('k-now');
    }
    burning = lines[i] || null;
    letters = [];
    if (!burning) return;
    var text = burning.textContent;
    burning.textContent = '';
    Array.from(text).forEach(function (c) {
      var s = document.createElement('span');
      s.className = 'k-ch';
      s.textContent = c;
      burning.appendChild(s);
      letters.push(s);
    });
    burning.classList.add('k-now');
  }

  var userScrolledAt = 0, ourScroll = 0;
  window.addEventListener('scroll', function () { if (performance.now() > ourScroll) userScrolledAt = performance.now(); }, { passive: true });
  function follow(el) {
    // keep the line in the upper middle of the window, unless the visitor scrolled a moment ago
    if (performance.now() - userScrolledAt < 4000) return;
    var r = el.getBoundingClientRect(), h = innerHeight;
    if (r.top > h * 0.22 && r.bottom < h * 0.7) return;
    ourScroll = performance.now() + 900;
    scrollBy({ top: r.top - h * 0.38, behavior: reduce ? 'auto' : 'smooth' });
  }

  function tick(t) {
    if (!running) return;
    if (!document.body.contains(pre)) { stop(); return; }    // the page was left (PJAX)
    if (!on || !data || !frame) { stop(); return; }
    var dt = Math.min(0.05, (t - last) / 1000); last = t;
    var time = now(), times = data.times;

    // which line is sung now: the last one that has started
    var i = -1;
    for (var k = 0; k < times.length; k++) { if (times[k][0] <= time) i = k; else break; }
    if (i !== cur) {
      cur = i;
      lines.forEach(function (l, n) { l.classList.toggle('k-past', n < i || (n === i && time >= times[n][1])); });
      burn(i);
      if (lines[i]) follow(lines[i]);
    }
    spot = null;
    if (burning && letters.length) {
      var s = times[cur][0], e = times[cur][1];
      var p = Math.max(0, Math.min(1, (time - s) / Math.max(0.3, e - s)));
      var done = Math.floor(p * letters.length);
      for (var n = 0; n < letters.length; n++) {
        var c = letters[n].classList;
        c.toggle('b', n < done);
        c.toggle('hot', n >= done - 2 && n < done);
      }
      if (p >= 1) { burning.classList.add('k-past'); }
      else if (playing && letters[done]) {
        var r = letters[done].getBoundingClientRect(), frac = p * letters.length - done;
        spot = { x: r.left + r.width * frac, y: r.top + r.height * (0.55 - 0.15 * Math.sin(t / 90)) };
      }
    }
    draw(dt);
    requestAnimationFrame(tick);
  }

  function draw(dt) {
    if (!cv) return;
    var dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    if (reduce) return;
    var light = document.body.classList.contains('light');
    g.globalCompositeOperation = light ? 'source-over' : 'lighter';
    if (spot) {
      var fl = 0.85 + 0.15 * Math.random();
      var hot = g.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, 13);
      hot.addColorStop(0, 'rgba(255,255,240,' + fl + ')');
      hot.addColorStop(0.3, 'rgba(255,180,60,' + (0.75 * fl) + ')');
      hot.addColorStop(1, 'rgba(255,60,0,0)');
      g.fillStyle = hot; g.beginPath(); g.arc(spot.x, spot.y, 13, 0, 6.283); g.fill();
      for (var k = 0; k < 2; k++) sparks.push({ x: spot.x, y: spot.y, vx: (Math.random() - 0.5) * 220, vy: -50 - Math.random() * 170, life: 0.2 + Math.random() * 0.4, age: 0 });
    }
    g.lineWidth = 1.2;
    for (var i = sparks.length - 1; i >= 0; i--) {
      var p = sparks[i]; p.age += dt;
      if (p.age > p.life) { sparks.splice(i, 1); continue; }
      var ox = p.x, oy = p.y; p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      var a = 1 - p.age / p.life;
      g.strokeStyle = 'rgba(255,' + Math.round(150 + 100 * a) + ',' + Math.round(60 * a) + ',' + a + ')';
      g.beginPath(); g.moveTo(ox, oy); g.lineTo(p.x, p.y); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
  }

  paintButton();
  watchFrame();
  load(player.getAttribute('data-yt'));
})();
