// Stránka Karaoke (WEB-INF/views/karaoke.jsp): na „pódiu“ běží dokola prvních pár řádků vybrané písně.
// Jako opravdové karaoke: dva řádky nad sebou, které se střídají. Zpívané slovo se podle opravdových časů rozžhaví
// do bíla, vychladne do barvy fotky a pak se rozplyne (nepřekáží). Nad slovy skáče bludička – žhavá kulička,
// za sebou kreslí čáru svého letu, která se od konce maže. Na konci řádku skočí obloukem na začátek druhého
// řádku; ten odzpívaný se mezitím rozplyne a na jeho místě se objeví další. Ťuknutí na píseň v Setlistu ji dá
// na pódium. Data: window.KARAOKE = [{ uuid, title, yt, lines: [{ t, a, b, w: [[od, do], …] }] }].
(function () {
  var K = window.KARAOKE || [], lyr = document.getElementById('kpLyr');
  if (!K.length || !lyr) return;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var now = document.getElementById('kpNow'), sing = document.getElementById('kpSing');
  var glow = document.getElementById('kpGlow'), rows = [].slice.call(document.querySelectorAll('.kp-row'));
  var slots = [].slice.call(lyr.querySelectorAll('.kp-slot'));
  var cur = 0, t0 = performance.now(), shown = [null, null], raf = 0;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // časy slov; když k řádku chybí, rozdělí se čas řádku rovnoměrně
  function words(l) {
    var ws = l.t.split(/\s+/).filter(Boolean), w = l.w;
    if (!w || w.length !== ws.length) { var d = (l.b - l.a) / ws.length; w = ws.map(function (_, k) { return [l.a + k * d, l.a + (k + 1) * d]; }); }
    return ws.map(function (x, k) { return { t: x, a: w[k][0], b: w[k][1] }; });
  }
  // do řádku (slotu) dá řádek písně j; starý obsah se rozplyne, nový se objeví
  function fill(slot, j, L) {
    if (shown[slot] === j) return;
    shown[slot] = j;
    var box = slots[slot], old = box.querySelector('.kp-line');
    if (old) { old.classList.add('out'); setTimeout(function () { old.remove(); }, 1100); }
    if (j === null || !L[j]) return;
    var el = document.createElement('span');
    el.className = 'kp-line in';
    el.dataset.j = j;
    el.innerHTML = words(L[j]).map(function (w) { return '<span class="kp-w" data-t="' + esc(w.t) + '" data-a="' + w.a + '" data-b="' + w.b + '">' + esc(w.t) + '</span>'; }).join(' ');
    box.appendChild(el);
  }

  function pick(i) {
    cur = i; t0 = performance.now(); shown = [null, null];
    slots.forEach(function (s) { s.innerHTML = ''; });
    resetTrail();
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
    var A = L[0].a - 3, B = L[n - 1].b + 2;
    var t = A + ((ms - t0) / 1000) % (B - A), i = -1;
    if (t < A + 0.05) resetTrail();   // nové kolo ukázky
    for (var k = 0; k < n; k++) if (L[k].a - 0.35 <= t) i = k;
    // dva řádky se střídají: zpívaný v řádku i % 2, ve druhém už čeká další
    if (i < 0) { fill(0, 0, L); fill(1, n > 1 ? 1 : null, L); }
    else { fill(i % 2, i, L); fill((i + 1) % 2, i + 1 < n ? i + 1 : null, L); }
    slots.forEach(function (box, q) { box.classList.toggle('active', i >= 0 && q === i % 2); });

    var active = i >= 0 ? slots[i % 2].querySelector('.kp-line:not(.out)') : null;
    lyr.querySelectorAll('.kp-line:not(.out) .kp-w').forEach(function (w) {
      var a = +w.dataset.a, b = +w.dataset.b;
      w.style.setProperty('--kp', Math.max(0, Math.min(1, (t - a) / Math.max(0.08, b - a))));
      w.classList.toggle('done', t > b + 0.2);
      w.classList.toggle('gone', t > b + 1.3);     // vyslovené slovo se rozplyne
    });
    ball(t, i, L, active);
    loop();
  }

  // ---- bludička a čára za ní ----
  var orb = document.createElement('span'), cv = document.createElement('canvas'), g = cv.getContext('2d');
  orb.className = 'kp-orb'; orb.setAttribute('aria-hidden', 'true');
  orb.innerHTML = '<i></i><i></i>';   // plamínek: záře + jádro (css/pages.css)
  cv.className = 'kp-trail'; cv.setAttribute('aria-hidden', 'true');
  lyr.appendChild(cv); lyr.appendChild(orb);
  var path = [], TRAIL_S = 0.6, color = '#ff3b30', colorAt = 0;   // čára = let za posledních 0,75 s
  function resetTrail() { path = []; }
  function firstWord(j) { var l = lyr.querySelector('.kp-line:not(.out)[data-j="' + j + '"] .kp-w'); return l; }
  function hide() { orb.classList.remove('on'); lastX = null; }
  // Bludička letí plynule nad textem přesně tam, kde se zrovna zpívá (jako hrot pera, které text vypaluje),
  // takže drží rytmus rapu a neskáče splašeně na každé slovo. Malý hop jen v pauze mezi slovy (delší pauza =
  // vyšší), velký oblouk při přeskoku na druhý řádek. Plamínek se naklání podle toho, kam letí.
  var lastX = null, lastT = 0, tilt = 0;
  function edge(w, f) {   // bod nad slovem: f = 0 začátek slova, 1 konec
    var r = w.getBoundingClientRect(), box = lyr.getBoundingClientRect();
    return { x: r.left - box.left + r.width * f, y: r.top - box.top };
  }
  function ball(t, i, L, active) {
    if (still) return;
    var p = null, hop = 0, u = 0;
    if (i < 0) {                                       // přilétne zleva na začátek prvního slova
      var f0 = firstWord(0);
      if (!f0 || t < L[0].a - 1.2) { hide(); draw(t); return; }
      var to = edge(f0, 0); u = Math.max(0, Math.min(1, (t - (L[0].a - 1.2)) / 1.2));
      p = { x: to.x - 90 * (1 - u), y: to.y }; hop = 26 * 4 * u * (1 - u);
    } else {
      var ws = active ? [].slice.call(active.querySelectorAll('.kp-w')) : [];
      if (!ws.length) return hide();
      var j = -1;
      for (var k = 0; k < ws.length; k++) if (+ws[k].dataset.a <= t) j = k;
      if (j < 0) { p = edge(ws[0], 0); }
      else {
        var w = ws[j], a = +w.dataset.a, b = +w.dataset.b;
        if (t <= b) {                                  // zpívá se: pluje po slově
          p = edge(w, Math.max(0, Math.min(1, (t - a) / Math.max(0.08, b - a))));
        } else if (j < ws.length - 1) {                // pauza mezi slovy: přeletí, při delší pauze malý hop
          var na = +ws[j + 1].dataset.a, gap = Math.max(0.01, na - b), from = edge(w, 1), to2 = edge(ws[j + 1], 0);
          u = Math.max(0, Math.min(1, (t - b) / gap));
          p = { x: from.x + (to2.x - from.x) * u, y: from.y + (to2.y - from.y) * u };
          hop = Math.min(18, Math.max(0, (gap - 0.12) * 40)) * 4 * u * (1 - u);
        } else {
          var nf = i + 1 < L.length ? firstWord(i + 1) : null, end = edge(w, 1);
          if (!nf) { if (t > b + 0.8) { hide(); draw(t); return; } p = end; }
          else {                                       // konec řádku: oblouk na začátek druhého řádku
            var nA = L[i + 1].a, fly = Math.min(0.9, Math.max(0.3, nA - b)), st = nA - fly, dst = edge(nf, 0);
            u = Math.max(0, Math.min(1, (t - st) / fly));
            p = { x: end.x + (dst.x - end.x) * u, y: end.y + (dst.y - end.y) * u };
            hop = 40 * 4 * u * (1 - u);
          }
        }
      }
    }
    var x = p.x, y = p.y - 12 - hop;
    // náklon podle rychlosti (plamínek se táhne za pohybem), plynule
    if (lastX !== null && t > lastT) tilt += (Math.max(-30, Math.min(30, -(x - lastX) / (t - lastT) * 0.06)) - tilt) * 0.2;
    lastX = x; lastT = t;
    orb.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + tilt.toFixed(1) + 'deg)';
    orb.classList.add('on');
    path.push({ x: x, y: y, t: t });
    draw(t);
  }
  // čára letu: nejstarší část mizí jako první, u bludičky je nejsilnější
  function draw(t) {
    var r = lyr.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    var W = Math.round(r.width * dpr), H = Math.round((r.height + 120) * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    g.setTransform(dpr, 0, 0, dpr, 0, 120 * dpr);   // plátno sahá 120 px nad text (oblouky)
    g.clearRect(0, -120, r.width, r.height + 120);
    while (path.length && (t - path[0].t > TRAIL_S || t < path[0].t)) path.shift();
    if (path.length < 2) return;
    if (t - colorAt > 0.5 || t < colorAt) { color = getComputedStyle(lyr).getPropertyValue('--accent').trim() || color; colorAt = t; }
    g.lineCap = 'round'; g.strokeStyle = color; g.shadowColor = color; g.shadowBlur = 8;
    for (var k = 1; k < path.length; k++) {
      var age = (t - path[k].t) / TRAIL_S;            // 0 = u bludičky, 1 = konec čáry
      g.globalAlpha = Math.max(0, 0.75 * (1 - age));
      g.lineWidth = 0.6 + 2.6 * (1 - age);
      g.beginPath(); g.moveTo(path[k - 1].x, path[k - 1].y); g.lineTo(path[k].x, path[k].y); g.stroke();
    }
    g.globalAlpha = 1;
  }

  // kreslí se jen na viditelné stránce a jen když je pódium na obrazovce
  var seen = true;
  function loop() { if (!raf && seen && !document.hidden) raf = requestAnimationFrame(frame); }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { seen = e[0].isIntersecting; loop(); }).observe(lyr);
  document.addEventListener('visibilitychange', function () { resetTrail(); loop(); });
  loop();
})();
