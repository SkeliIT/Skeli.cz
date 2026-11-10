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
      ball(null, t);
    } else {
      var ws = lyr.querySelectorAll('.kp-cur:not(.out) .kp-w');
      ws.forEach(function (w) {
        w.style.setProperty('--p', Math.max(0, Math.min(1, (t - w.dataset.a) / Math.max(0.08, w.dataset.b - w.dataset.a))));
        w.classList.toggle('done', t > +w.dataset.b + 0.25);
      });
      ball(ws, t);
    }
    loop();
  }

  // ---- bludička: žhavá kulička skáče ze slova na slovo přesně podle zpěvu ----
  // Dopadne na slovo ve chvíli, kdy se začne zpívat; skok trvá do začátku dalšího slova, takže rychlá slova =
  // krátké rychlé hopy, dlouhé slovo = vyšší pomalý oblouk. Při dopadu se zplácne, za sebou nechá slabou stopu.
  var orb = document.createElement('span'), trail = [], TRAIL = 6;
  orb.className = 'kp-orb'; orb.setAttribute('aria-hidden', 'true');
  for (var q = 0; q < TRAIL; q++) { var dot = document.createElement('i'); dot.className = 'kp-orb-trail'; lyr.appendChild(dot); trail.push({ el: dot, x: 0, y: 0 }); }
  lyr.appendChild(orb);
  var lastX = null, lastY = null;
  function spot(w) {   // horní střed slova v souřadnicích textu
    var r = w.getBoundingClientRect(), box = lyr.getBoundingClientRect();
    return { x: r.left - box.left + r.width / 2, y: r.top - box.top };
  }
  function ball(ws, t) {
    if (still || !ws || !ws.length) { orb.classList.remove('on'); trail.forEach(function (d) { d.el.style.opacity = 0; }); lastX = null; return; }
    var first = +ws[0].dataset.a, end = +ws[ws.length - 1].dataset.b;
    if (t < first - 0.6 || t > end + 0.4) { orb.classList.remove('on'); trail.forEach(function (d) { d.el.style.opacity = 0; }); lastX = null; return; }
    // slovo, na kterém kulička právě je (poslední, které už začalo), a další, kam skáče
    var j = -1;
    for (var k = 0; k < ws.length; k++) if (+ws[k].dataset.a <= t) j = k;
    var from, to, a, b;
    if (j < 0) {   // přískok na první slovo zleva
      to = spot(ws[0]); from = { x: to.x - 60, y: to.y }; a = first - 0.6; b = first;
    } else if (j < ws.length - 1) {
      from = spot(ws[j]); to = spot(ws[j + 1]); a = +ws[j].dataset.a; b = +ws[j + 1].dataset.a;
    } else {      // poslední slovo: doskočí a zůstane na něm, než řádek odejde
      from = to = spot(ws[j]); a = +ws[j].dataset.a; b = Math.max(a + 0.3, +ws[j].dataset.b);
    }
    var dur = Math.max(0.12, b - a), u = Math.max(0, Math.min(1, (t - a) / dur));
    var hop = Math.min(56, Math.max(12, dur * 34));            // delší slovo = vyšší skok
    if (from === to) hop = j === ws.length - 1 && t > b ? 0 : hop * 0.35;   // na posledním slově jen malý poskok
    var x = from.x + (to.x - from.x) * u, y = from.y + (to.y - from.y) * u - hop * 4 * u * (1 - u) - 10;
    var squash = u < 0.12 ? 1 - (0.12 - u) * 3 : 1;           // chvilku po dopadu zplácnutá
    orb.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + (2 - squash).toFixed(2) + ',' + squash.toFixed(2) + ')';
    orb.classList.add('on');
    // stopa: body jdou za kuličkou se zpožděním
    if (lastX === null) { trail.forEach(function (d) { d.x = x; d.y = y; }); }
    var px = x, py = y;
    trail.forEach(function (d, i) {
      d.x += (px - d.x) * 0.45; d.y += (py - d.y) * 0.45; px = d.x; py = d.y;
      d.el.style.transform = 'translate(' + d.x.toFixed(1) + 'px,' + d.y.toFixed(1) + 'px) scale(' + (1 - (i + 1) / (TRAIL + 2)).toFixed(2) + ')';
      d.el.style.opacity = (0.45 * (1 - i / TRAIL)).toFixed(2);
    });
    lastX = x; lastY = y;
  }
  // kreslí se jen na viditelné stránce a jen když je pódium na obrazovce
  var seen = true;
  function loop() { if (!raf && seen && !document.hidden) raf = requestAnimationFrame(frame); }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { seen = e[0].isIntersecting; loop(); }).observe(lyr);
  document.addEventListener('visibilitychange', loop);
  loop();
})();
