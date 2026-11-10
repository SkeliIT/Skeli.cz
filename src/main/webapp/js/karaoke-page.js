// Stránka Karaoke (WEB-INF/views/karaoke.jsp): na „pódiu“ běží dokola prvních pár řádků vybrané písně.
// Zpívané slovo se podle opravdových časů rozžhaví do bíla a vychladne do barvy fotky, odzpívaný řádek odjede
// nahoru do kouře, před dalším řádkem odpočítávají tři tečky. Ťuknutí na píseň v Setlistu ji dá na pódium.
// Data: window.KARAOKE = [{ uuid, title, yt, lines: [{ t, a, b, w: [[od, do], …] }] }] (KaraokeCinemaServlet).
(function () {
  var K = window.KARAOKE || [], lyr = document.getElementById('kpLyr');
  if (!K.length || !lyr) return;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var now = document.getElementById('kpNow'), sing = document.getElementById('kpSing');
  var glow = document.getElementById('kpGlow'), rows = [].slice.call(document.querySelectorAll('.kp-row'));
  var cur = 0, t0 = performance.now(), key = null, raf = 0;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // časy slov; když k řádku chybí, rozdělí se čas řádku rovnoměrně
  function words(l) {
    var ws = l.t.split(/\s+/).filter(Boolean), w = l.w;
    if (!w || w.length !== ws.length) { var d = (l.b - l.a) / ws.length; w = ws.map(function (_, k) { return [l.a + k * d, l.a + (k + 1) * d]; }); }
    return ws.map(function (x, k) { return { t: x, a: w[k][0], b: w[k][1] }; });
  }

  function pick(i) {
    cur = i; t0 = performance.now(); key = null;
    var s = K[i];
    if (now) now.textContent = s.title;
    if (sing) sing.href = '/karaoke-kino/' + s.uuid;
    rows.forEach(function (r) { r.classList.toggle('sel', +r.dataset.i === i); });
    var row = rows[i];
    if (glow && row) { var im = glow.querySelector('img'); if (im) im.src = row.dataset.thumb; }
  }
  rows.forEach(function (r) {
    r.addEventListener('click', function () {
      pick(+r.dataset.i);
      var top = document.querySelector('.kp-stage');
      if (top) window.scrollTo({ top: Math.max(0, top.getBoundingClientRect().top + scrollY - 120), behavior: still ? 'auto' : 'smooth' });
    });
  });

  function frame(ms) {
    raf = 0;
    if (!lyr.isConnected) return;
    var s = K[cur], L = s.lines, n = L.length;
    if (!n) return;
    var A = L[0].a - 3.2, B = L[n - 1].b + 1.6;
    var t = A + ((ms - t0) / 1000) % (B - A), i = -1;
    for (var k = 0; k < n; k++) if (L[k].a - 0.35 <= t) i = k;
    var line = i >= 0 ? L[i] : null, next = i + 1 < n ? L[i + 1] : null;
    var gap = (!line || t > line.b + 0.8) && next && next.a - t < 3.2;
    var k2 = (gap ? 'g' : 'l') + i;
    if (k2 !== key) {
      var c = lyr.querySelector('.kp-cur:not(.out)'), nx = lyr.querySelector('.kp-nxt');
      // odzpívaný řádek odjede nahoru do kouře, místo něj nový
      if (c && c.querySelector('.kp-w') && !still) {
        c.classList.remove('in'); c.classList.add('out');
        setTimeout(function (el) { el.remove(); }.bind(null, c), 1300);
        c = document.createElement('span'); c.className = 'kp-line kp-cur'; lyr.insertBefore(c, nx);
      }
      key = k2;
      if (gap) c.innerHTML = '<span class="kp-dots"><i></i><i></i><i></i></span>';
      else if (line && t <= line.b + 0.8) c.innerHTML = words(line).map(function (w) { return '<span class="kp-w" data-t="' + esc(w.t) + '" data-a="' + w.a + '" data-b="' + w.b + '">' + esc(w.t) + '</span>'; }).join(' ');
      else c.innerHTML = '&nbsp;';
      nx.textContent = next ? next.t : '';
      c.classList.remove('in'); void c.offsetWidth; c.classList.add('in');
      nx.classList.remove('in'); void nx.offsetWidth; nx.classList.add('in');
    }
    if (gap) {
      var d = lyr.querySelectorAll('.kp-cur:not(.out) .kp-dots i'), left = next.a - t;
      for (var j = 0; j < d.length; j++) d[j].classList.toggle('off', left < 3 - j);
    } else {
      lyr.querySelectorAll('.kp-cur:not(.out) .kp-w').forEach(function (w) {
        w.style.setProperty('--p', Math.max(0, Math.min(1, (t - w.dataset.a) / Math.max(0.08, w.dataset.b - w.dataset.a))));
        w.classList.toggle('done', t > +w.dataset.b + 0.25);
      });
    }
    loop();
  }
  // kreslí se jen na viditelné stránce a jen když je pódium na obrazovce
  var seen = true;
  function loop() { if (!raf && seen && !document.hidden) raf = requestAnimationFrame(frame); }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { seen = e[0].isIntersecting; loop(); }).observe(lyr);
  document.addEventListener('visibilitychange', loop);
  loop();
})();
