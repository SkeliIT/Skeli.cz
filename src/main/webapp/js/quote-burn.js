/* The quote on the home page is burnt in letter by letter, as if by a laser we never see:
   a white-hot spot moves over each letter, sparks fly off, smoke rises, and the letters cool
   down to glowing embers (dark theme) or stay as dark scorch marks (light theme).
   The page renders the plain quote; this script only takes over when it can animate. */
(function () {
  var box = document.querySelector('.hero-quote');
  var text = box && box.querySelector('.hero-quote-text');
  if (!text || text.dataset.burnt) return;
  text.dataset.burnt = '1';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { box.classList.add('is-burnt'); return; }

  // the readable text stays for screen readers, the animated copy (quote, then the song) is only for the eyes
  var n = 0;
  function burnable(el, rows) {
    var plain = document.createElement('span');
    plain.className = 'sr-only';
    plain.textContent = rows.join(' ');
    var art = document.createElement('span');
    art.setAttribute('aria-hidden', 'true');
    art.className = 'hero-quote-art';
    rows.forEach(function (line) {
      var row = document.createElement('span');
      row.className = 'hero-quote-line';
      line.split(' ').forEach(function (word, wi) {
        if (wi) row.appendChild(document.createTextNode(' '));
        var w = document.createElement('span');
        w.className = 'qw';
        Array.from(word).forEach(function (c) {
          var ch = document.createElement('span');
          ch.className = 'qc';
          ch.style.setProperty('--i', n++);
          ch.textContent = c;
          w.appendChild(ch);
        });
        row.appendChild(w);
      });
      art.appendChild(row);
    });
    el.textContent = '';
    el.appendChild(plain);
    el.appendChild(art);
  }
  burnable(text, Array.from(text.querySelectorAll('.hero-quote-line')).map(function (l) { return l.textContent; }));
  var song = box.querySelector('.hero-quote-song');
  if (song) burnable(song, [song.textContent.trim()]);
  box.classList.add('is-burning');

  var cv = document.createElement('canvas');
  cv.className = 'hero-quote-fx';
  cv.setAttribute('aria-hidden', 'true');
  box.appendChild(cv);
  var g = cv.getContext('2d');
  var spot = null, sparks = [], smoke = [], sprites = [], last = performance.now(), done = false;

  // smoke sprites: soft wisps of turbulent noise that fade out round the edges (made once)
  (function () {
    function hash(x, y, sd) { var h = Math.sin(x * 127.1 + y * 311.7 + sd * 74.7) * 43758.5453; return h - Math.floor(h); }
    function noise(x, y, sd) {
      var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
      var a = hash(ix, iy, sd), b = hash(ix + 1, iy, sd), c = hash(ix, iy + 1, sd), d = hash(ix + 1, iy + 1, sd);
      return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
    }
    function fbm(x, y, sd) { var v = 0, amp = .5; for (var o = 0; o < 5; o++) { v += amp * noise(x, y, sd); x *= 2.03; y *= 2.03; amp *= .5; } return v; }
    var S = 96;
    for (var k = 0; k < 3; k++) {
      var sd = k * 13.7 + 1, mk = function (rgb) {
        var c = document.createElement('canvas'); c.width = c.height = S;
        var x = c.getContext('2d'), out = x.createImageData(S, S), o = out.data;
        for (var py = 0; py < S; py++) for (var px = 0; px < S; px++) {
          var u = px / S, v = py / S, dx = u - .5, dy = v - .5, r = Math.sqrt(dx * dx + dy * dy) * 2;
          var t = fbm(u * 4 + fbm(u * 3 + 5, v * 3, sd) * 1.6, v * 4 + fbm(u * 3, v * 3 + 9, sd) * 1.6, sd);
          var al = Math.min(1, Math.max(0, (t - .38) / .45)); al = al * al * (3 - 2 * al);
          var i = (py * S + px) * 4;
          o[i] = rgb[0]; o[i + 1] = rgb[1]; o[i + 2] = rgb[2];
          o[i + 3] = Math.round(255 * al * Math.pow(Math.max(0, 1 - r), 1.6));
        }
        x.putImageData(out, 0, 0); return c;
      };
      sprites.push({ onDark: mk([215, 205, 195]), onLight: mk([70, 58, 48]) });
    }
  })();

  function loop(now) {
    if (!document.body.contains(cv)) return;              // the page was left (PJAX)
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    var dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    var light = document.body.classList.contains('light');
    if (spot) {
      var fl = .85 + .15 * Math.random();
      g.globalCompositeOperation = light ? 'source-over' : 'lighter';
      var hot = g.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, 12);
      hot.addColorStop(0, 'rgba(255,255,240,' + fl + ')'); hot.addColorStop(.3, 'rgba(255,180,60,' + (.75 * fl) + ')'); hot.addColorStop(1, 'rgba(255,60,0,0)');
      g.fillStyle = hot; g.beginPath(); g.arc(spot.x, spot.y, 12, 0, 6.283); g.fill();
      for (var k = 0; k < 2; k++) sparks.push({ x: spot.x, y: spot.y, vx: (Math.random() - .5) * 220, vy: -50 - Math.random() * 170, life: .2 + Math.random() * .4, age: 0 });
      if (Math.random() < .4) smoke.push({ x: spot.x + (Math.random() - .5) * 4, y: spot.y - 4, age: 0, life: 2 + Math.random(), size: 10 + Math.random() * 8,
        grow: 22 + Math.random() * 18, rot: Math.random() * 6.283, vr: (Math.random() - .5) * .9, seed: Math.random() * 9, sp: sprites[Math.floor(Math.random() * sprites.length)] });
    }
    g.globalCompositeOperation = 'source-over';
    for (var i = smoke.length - 1; i >= 0; i--) {
      var m = smoke[i]; m.age += dt; if (m.age > m.life) { smoke.splice(i, 1); continue; }
      var age = m.age / m.life, size = m.size + m.grow * m.age;
      m.y -= (28 - 10 * age) * dt; m.x += Math.sin(m.age * 1.6 + m.seed) * 11 * dt; m.rot += m.vr * dt;
      g.globalAlpha = Math.min(1, m.age * 3) * Math.pow(1 - age, 1.4) * (light ? .5 : .45);
      g.save(); g.translate(m.x, m.y); g.rotate(m.rot); g.drawImage(light ? m.sp.onLight : m.sp.onDark, -size / 2, -size / 2, size, size); g.restore();
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = light ? 'source-over' : 'lighter';
    g.lineWidth = 1.2;
    for (i = sparks.length - 1; i >= 0; i--) {
      var p = sparks[i]; p.age += dt; if (p.age > p.life) { sparks.splice(i, 1); continue; }
      var ox = p.x, oy = p.y; p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      var a = 1 - p.age / p.life;
      g.strokeStyle = 'rgba(255,' + Math.round(150 + 100 * a) + ',' + Math.round(60 * a) + ',' + a + ')';
      g.beginPath(); g.moveTo(ox, oy); g.lineTo(p.x, p.y); g.stroke();
    }
    if (done && !sparks.length && !smoke.length) { cv.remove(); return; }   // nothing left to draw
    requestAnimationFrame(loop);
  }

  // burn the letters one after another; short pauses between words, longer after a comma, a line and before the song
  var chars = Array.from(box.querySelectorAll('.qc')), idx = 0;
  function next() {
    if (!document.body.contains(cv)) return;
    if (idx >= chars.length) {
      spot = null; done = true;
      setTimeout(function () { box.classList.remove('is-burning'); box.classList.add('is-burnt'); }, 2300);
      return;
    }
    var c = chars[idx], prev = chars[idx - 1], pause = 0;
    if (prev) {
      if (prev.parentNode !== c.parentNode) pause = 70;
      if (/[,.]/.test(prev.textContent)) pause = 220;
      if (prev.closest('.hero-quote-line') !== c.closest('.hero-quote-line')) pause = 360;
      if (!prev.closest('.hero-quote-song') && c.closest('.hero-quote-song')) pause = 650;   // a breath before the song's name
    }
    var d = 45 + c.offsetWidth * 2.6;
    setTimeout(function () {
      c.style.setProperty('--d', d + 'ms');
      c.classList.add('burning');
      var t0 = performance.now();
      (function move(now) {
        if (!document.body.contains(cv)) return;
        var k = Math.min(1, (now - t0) / d), cr = c.getBoundingClientRect(), br = cv.getBoundingClientRect();
        spot = { x: cr.left - br.left + cr.width * k, y: cr.top - br.top + cr.height * (.5 - .2 * Math.sin(k * Math.PI * 2.2)) };
        if (k < 1) requestAnimationFrame(move);
        else { c.classList.remove('burning'); c.classList.add('burnt'); idx++; next(); }
      })(t0);
    }, pause);
  }
  requestAnimationFrame(loop);
  // start once the brush font is in, otherwise the letters would jump while they burn
  (document.fonts && document.fonts.load ? document.fonts.load('40px "Comforter Brush"') : Promise.resolve()).then(function () { setTimeout(next, 500); }, function () { setTimeout(next, 500); });
})();
