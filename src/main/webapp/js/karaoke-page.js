// Stránka Karaoke (WEB-INF/views/karaoke.jsp): nahoře se promítá ukázka z klipu vybrané písně (bez zvuku, okraje
// se rozplývají do tmy) a pod ní běží titulky přesně z té promítané části: čas písně = from + čas ukázky
// (ukázky vyrábí tools/karaoke-nahled.js). Bez ukázky (nebo při omezení pohybu) jedou titulky podle hodin.
// Jako opravdové karaoke: dva řádky nad sebou se střídají, zpívané slovo se rozžhaví do bíla, vychladne do barvy
// fotky a rozplyne se. Nad slovy letí bludička: na každé slovo malinko přeskočí, za sebou kreslí vlnku, která se
// od konce maže; na konci řádku obloukem přeletí na začátek druhého řádku (bez čáry).
// Data: window.KARAOKE = [{ uuid, title, yt, clip, poster, from, lines: [{ t, a, b, w: [[od, do], …] }] }].
(function () {
  var K = window.KARAOKE || [], lyr = document.getElementById('kpLyr');
  if (!K.length || !lyr) return;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var now = document.getElementById('kpNow'), sing = document.getElementById('kpSing');
  var film = document.getElementById('kpFilm'), rows = [].slice.call(document.querySelectorAll('.kp-row'));
  var slots = [].slice.call(lyr.querySelectorAll('.kp-slot'));
  var cur = 0, t0 = performance.now(), shown = [null, null], raf = 0;

  var FLY_MIN = 0.25;   // nejkratší let bludičky z konce řádku na další řádek (s)
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // časy slov; když k řádku chybí, rozdělí se čas řádku rovnoměrně
  function words(l) {
    var ws = l.t.split(/\s+/).filter(Boolean), w = l.w;
    if (!w || w.length !== ws.length) { var d = (l.b - l.a) / ws.length; w = ws.map(function (_, k) { return [l.a + k * d, l.a + (k + 1) * d]; }); }
    return ws.map(function (x, k) { return { t: x, a: w[k][0], b: w[k][1] }; });
  }
  // do řádku (slotu) dá řádek písně j; starý rychle zmizí, nový přijde po něm
  function fill(slot, j, L) {
    if (shown[slot] === j) return;
    shown[slot] = j;
    var box = slots[slot], old = box.querySelector('.kp-line:not(.out)');
    if (old) { old.classList.add('out'); setTimeout(function () { old.remove(); }, 400); }
    if (j === null || !L[j]) return;
    var el = document.createElement('span');
    el.className = 'kp-line in';
    el.dataset.j = j;
    // Poslední slovo řádku se musí dobarvit dřív, než bludička odletí na další řádek (aspoň FLY_MIN s před ním).
    // Dřív, když další řádek začínal hned (nebo podle časů dokonce dřív), bludička už byla dole, zatímco se
    // slovo, ze kterého odskočila, teprve barvilo – oko sleduje bludičku a bylo to matoucí.
    var ws = words(L[j]), next = L[j + 1];
    if (next && ws.length) {
      var lw = ws[ws.length - 1];
      lw.b = Math.max(lw.a + 0.08, Math.min(lw.b, next.a - FLY_MIN));
    }
    el.innerHTML = ws.map(function (w) { return '<span class="kp-w" data-t="' + esc(w.t) + '" data-a="' + w.a + '" data-b="' + w.b + '">' + esc(w.t) + '</span>'; }).join(' ');
    box.appendChild(el);
    fitLine(el, box);
  }
  // po načtení písma a při změně velikosti okna znovu změřit (písmo mění šířku textu)
  function refit() { slots.forEach(function (b) { var l = b.querySelector('.kp-line:not(.out)'); if (l) fitLine(l, b); }); }
  if (document.fonts) document.fonts.ready.then(refit);
  addEventListener('resize', refit);
  // okno s textem má pevnou výšku na 2 řádky (css .kp-slot); delší verš se zmenší, aby se vešel a nic neskákalo
  function fitLine(el, box) {
    var max = box.clientHeight, size = 1;
    el.style.fontSize = '';
    while (el.scrollHeight > max + 2 && size > 0.6) { size -= 0.05; el.style.fontSize = size.toFixed(2) + 'em'; }
  }

  // ---- promítaná ukázka ----
  var video = film ? film.querySelector('video') : null;
  // naklání se pod myší i prstem jako dlaždice webu (k základnímu natočení z CSS se přičte --rx/--ry)
  if (film && !still) {
    film.addEventListener('pointermove', function (e) {
      var r = film.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      film.classList.add('tilting');
      film.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg');
      film.style.setProperty('--ry', (x * 14).toFixed(2) + 'deg');
    });
    ['pointerleave', 'pointercancel', 'pointerup'].forEach(function (ev) {
      film.addEventListener(ev, function (e) {
        if (ev === 'pointerup' && e.pointerType === 'mouse') return;
        film.classList.remove('tilting'); film.style.removeProperty('--rx'); film.style.removeProperty('--ry');
      });
    });
  }
  function load(s) {
    if (!video) return;
    film.classList.toggle('none', !s.clip);
    if (!s.clip) { video.removeAttribute('src'); video.load(); return; }
    video.poster = s.poster || '';
    video.src = s.clip;
    if (!still && !(navigator.connection && navigator.connection.saveData)) { var p = video.play(); if (p && p.catch) p.catch(function () { }); }
  }
  // čas písně: z ukázky (když hraje), jinak dokola podle hodin
  function songTime(s, ms) {
    if (video && s.clip && video.readyState >= 2 && !video.paused) return s.from + video.currentTime;
    var L = s.lines, A = L[0].a - 3, B = L[L.length - 1].b + 2;
    return A + ((ms - t0) / 1000) % (B - A);
  }

  function pick(i) {
    cur = i; t0 = performance.now(); shown = [null, null];
    slots.forEach(function (s) { s.innerHTML = ''; });
    resetTrail();
    var s = K[i];
    if (now) now.textContent = s.title;
    if (sing) sing.href = '/karaoke-kino/' + s.uuid;
    rows.forEach(function (r) { r.classList.toggle('sel', +r.dataset.i === i); });
    load(s);
  }
  rows.forEach(function (r) {
    r.addEventListener('click', function () {
      pick(+r.dataset.i);
      var top = document.querySelector('.kp-stage');
      if (top) window.scrollTo({ top: Math.max(0, top.getBoundingClientRect().top + scrollY - 90), behavior: still ? 'auto' : 'smooth' });
    });
  });

  var lastSongT = -1;
  function frame(ms) {
    raf = 0;
    if (!lyr.isConnected) return;
    var s = K[cur], L = s.lines, n = L.length;
    if (!n) return;
    var t = songTime(s, ms), i = -1;
    if (t < lastSongT - 1) { resetTrail(); shown = [null, null]; slots.forEach(function (b) { b.innerHTML = ''; }); }   // ukázka začala znovu
    lastSongT = t;
    // řádek se přepne přesně ve chvíli, kdy začne – do té doby na něj bludička letí (a čeká v druhém řádku)
    for (var k = 0; k < n; k++) if (L[k].a <= t) i = k;
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

  // ---- bludička a vlnka za ní ----
  var orb = document.createElement('span'), cv = document.createElement('canvas'), g = cv.getContext('2d');
  orb.className = 'kp-orb'; orb.setAttribute('aria-hidden', 'true');
  orb.innerHTML = '<i></i><i></i>';   // plamínek: záře + jádro (css/pages.css)
  cv.className = 'kp-trail'; cv.setAttribute('aria-hidden', 'true');
  lyr.appendChild(cv); lyr.appendChild(orb);
  var path = [], TRAIL_S = 0.6, color = '#ff3b30', colorAt = 0;   // vlnka = let za posledních 0,6 s
  function resetTrail() { path = []; }
  function firstWord(j) { return lyr.querySelector('.kp-line:not(.out)[data-j="' + j + '"] .kp-w'); }
  var lastX = null, lastT = 0, tilt = 0;
  function hide() { orb.classList.remove('on'); lastX = null; }
  function edge(w, f) {   // bod nad slovem: f = 0 začátek slova, 1 konec
    var r = w.getBoundingClientRect(), box = lyr.getBoundingClientRect();
    return { x: r.left - box.left + r.width * f, y: r.top - box.top };
  }
  function small(d) { return Math.max(6, Math.min(16, 5 + d * 12)); }   // malý hop přes slovo (delší slovo = o kousek vyšší)
  function ball(t, i, L, active) {
    if (still) return;
    var from, to, u = 0, hop = 0, jump = false;
    if (i < 0) {                                       // přilétne zleva na začátek prvního slova
      var f0 = firstWord(0);
      if (!f0 || t < L[0].a - 1.2) { hide(); draw(t); return; }
      to = edge(f0, 0); from = { x: to.x - 90, y: to.y }; u = (t - (L[0].a - 1.2)) / 1.2; hop = 26;
    } else {
      var ws = active ? [].slice.call(active.querySelectorAll('.kp-w')) : [];
      if (!ws.length) return hide();
      var j = -1;
      for (var k = 0; k < ws.length; k++) if (+ws[k].dataset.a <= t) j = k;
      if (j < 0) { from = to = edge(ws[0], 0); }
      else {
        var w = ws[j], a = +w.dataset.a, b = +w.dataset.b;
        if (j < ws.length - 1) {                       // ze začátku slova na začátek dalšího: malý hop přes slovo
          var na = +ws[j + 1].dataset.a;
          from = edge(w, 0); to = edge(ws[j + 1], 0); u = (t - a) / Math.max(0.08, na - a); hop = small(na - a);
        } else if (t <= b) {                           // poslední slovo řádku: hop na jeho konec
          from = edge(w, 0); to = edge(w, 1); u = (t - a) / Math.max(0.08, b - a); hop = small(b - a);
        } else {
          var nf = i + 1 < L.length ? firstWord(i + 1) : null, end = edge(w, 1);
          if (!nf) { if (t > b + 0.8) { hide(); draw(t); return; } from = to = end; }
          else {                                       // konec řádku: oblouk na začátek druhého řádku, bez čáry
            // odlétá až po dobarvení slova (b), nejdřív 0,9 s před dalším řádkem – nikdy uprostřed oblouku
            var nA = L[i + 1].a, st = Math.max(b, nA - 0.9), fly = Math.max(0.08, nA - st);
            from = end; to = edge(nf, 0); u = (t - st) / fly; hop = 40; jump = t >= st;
          }
        }
      }
    }
    u = Math.max(0, Math.min(1, u));
    var x = from.x + (to.x - from.x) * u, y = from.y + (to.y - from.y) * u - 12 - hop * 4 * u * (1 - u);
    // náklon podle rychlosti (plamínek se táhne za pohybem), plynule
    if (lastX !== null && t > lastT) tilt += (Math.max(-30, Math.min(30, -(x - lastX) / (t - lastT) * 0.06)) - tilt) * 0.2;
    lastX = x; lastT = t;
    orb.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + tilt.toFixed(1) + 'deg)';
    orb.classList.add('on');
    if (jump) path = []; else path.push({ x: x, y: y, t: t });   // vlnka začne znovu až na novém řádku
    draw(t);
  }
  // vlnka: nejstarší část mizí jako první, u bludičky je nejsilnější
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
      var age = (t - path[k].t) / TRAIL_S;            // 0 = u bludičky, 1 = konec vlnky
      g.globalAlpha = Math.max(0, 0.75 * (1 - age));
      g.lineWidth = 0.6 + 2.6 * (1 - age);
      g.beginPath(); g.moveTo(path[k - 1].x, path[k - 1].y); g.lineTo(path[k].x, path[k].y); g.stroke();
    }
    g.globalAlpha = 1;
  }

  // kreslí se jen na viditelné stránce a jen když je pódium na obrazovce; ukázka mimo obrazovku stojí
  var seen = true;
  function loop() { if (!raf && seen && !document.hidden) raf = requestAnimationFrame(frame); }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) {
    seen = e[0].isIntersecting;
    if (video && video.src && !still) { if (seen) { var p = video.play(); if (p && p.catch) p.catch(function () { }); } else video.pause(); }
    loop();
  }).observe(lyr);
  document.addEventListener('visibilitychange', function () { resetTrail(); loop(); });
  pick(0);
  loop();
})();
