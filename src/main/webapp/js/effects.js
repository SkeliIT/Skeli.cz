// Redesign 2026 effects (css/effects.css): embers / snow in the home hero, the song
// marquee and the 3D tilt of cards. Nothing runs when
// the visitor asked for less motion; PJAX page swaps re-run the per-page parts.
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  // lehký režim pro slabé telefony (hlavička stránky, css/effects.css)
  function low() { return document.documentElement.classList.contains('low-fx'); }

  // embers rising in the smoke (snow in the light theme: same elements, other animation)
  function particles(root) {
    if (reduced || low()) return;
    root.querySelectorAll('.hero-particles:not([data-done])').forEach(function (box) {
      box.dataset.done = '1';
      var count = window.innerWidth < 700 ? 22 : 42;
      for (var i = 0; i < count; i++) {
        var s = document.createElement('span');
        s.style.left = (Math.random() * 100) + '%';
        s.style.setProperty('--s', (2 + Math.random() * 4).toFixed(1) + 'px');
        s.style.setProperty('--t', (9 + Math.random() * 12).toFixed(1) + 's');
        s.style.setProperty('--delay', (-Math.random() * 20).toFixed(1) + 's');
        s.style.setProperty('--dx', ((Math.random() - 0.5) * 160).toFixed(0) + 'px');
        box.appendChild(s);
      }
    });
  }

  // poryv větru: jiskry (a ve světlém režimu sníh) u myši nebo prstu odletí ve směru pohybu, pak se pomalu vrátí
  // do své dráhy. Letí dál svou animací z CSS (transform), vítr k tomu přičítá vlastní posun (translate).
  // Smyčka běží, jen když se něco hýbe; rychlejší švihnutí = silnější poryv.
  var WIND = { REACH: 170, PUSH: 480, MAX_SPEED: 2.5, MAX_V: 500, EASE: 7, DRAG: 1.8, BACK: 0.35 };
  var gust = null, windRaf = 0, windLast = 0, lastX = null, lastY = 0, lastT = 0, windParts = [], windBox = null;
  function windMove(x, y) {
    var t = performance.now(), dt = t - lastT, x0 = lastX, y0 = lastY;
    lastX = x; lastY = y; lastT = t;
    if (x0 === null || dt > 150 || dt <= 0) return;      // první dotyk nebo dlouhá pauza: žádný poryv
    if (x === x0 && y === y0) return;
    if (document.documentElement.classList.contains('kpong-open')) return;
    var box = document.querySelector('.hero-particles');
    if (!box) return;
    if (box !== windBox) {
      windBox = box;
      windParts = [].map.call(box.children, function (el) { return { el: el, x: 0, y: 0, vx: 0, vy: 0, gx: 0, gy: 0, swirl: Math.random() - 0.5 }; });
    }
    var speed = Math.min(WIND.MAX_SPEED, Math.hypot(x - x0, y - y0) / dt);
    // víc pohybů do jednoho snímku: platí poslední úsek, síla ta největší
    gust = { x0: x0, y0: y0, x1: x, y1: y, speed: gust ? Math.max(gust.speed, speed) : speed };
    if (!windRaf) { windLast = t; windRaf = requestAnimationFrame(windTick); }
  }
  function blow(g) {
    var dx = g.x1 - g.x0, dy = g.y1 - g.y0, len = Math.hypot(dx, dy) || 1, nx = dx / len, ny = dy / len;
    var reach = window.innerWidth < 700 ? WIND.REACH * 0.8 : WIND.REACH;
    windParts.forEach(function (p) {
      var r = p.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      // vzdálenost jiskry od úseku, kudy prst nebo myš jely
      var k = Math.max(0, Math.min(1, ((cx - g.x0) * dx + (cy - g.y0) * dy) / (len * len)));
      var d = Math.hypot(cx - (g.x0 + dx * k), cy - (g.y0 + dy * k));
      if (d >= reach) return;
      var force = Math.pow(1 - d / reach, 2) * g.speed * WIND.PUSH;
      p.gx += (nx - ny * p.swirl) * force;               // swirl = každá jiskra se stočí trochu jinam, jako ve vzduchu
      p.gy += (ny + nx * p.swirl) * force;
    });
  }
  function windTick(now) {
    windRaf = 0;
    var dt = Math.min(0.05, (now - windLast) / 1000), moving = false;
    windLast = now;
    if (!windBox || !windBox.isConnected) { windBox = null; windParts = []; gust = null; return; }
    if (gust) { blow(gust); gust = null; }
    var drag = Math.exp(-WIND.DRAG * dt), back = Math.exp(-WIND.BACK * dt), take = 1 - Math.exp(-WIND.EASE * dt);
    windParts.forEach(function (p) {
      // poryv se do rychlosti přelévá postupně: jiskra se rozjede plynule, ne skokem
      p.vx += p.gx * take; p.vy += p.gy * take;
      p.gx -= p.gx * take; p.gy -= p.gy * take;
      p.vx *= drag; p.vy *= drag;
      var v = Math.hypot(p.vx, p.vy);                    // ani divoké mávání je nerozstřelí přes celou obrazovku
      if (v > WIND.MAX_V) { p.vx *= WIND.MAX_V / v; p.vy *= WIND.MAX_V / v; p.gx = p.gy = 0; }
      p.x = (p.x + p.vx * dt) * back; p.y = (p.y + p.vy * dt) * back;
      if (Math.abs(p.gx) + Math.abs(p.gy) + Math.abs(p.vx) + Math.abs(p.vy) > 2 || Math.abs(p.x) + Math.abs(p.y) > 1) {
        moving = true;
        p.el.style.translate = p.x.toFixed(1) + 'px ' + p.y.toFixed(1) + 'px';
      } else if (p.el.style.translate) {
        p.x = p.y = p.vx = p.vy = p.gx = p.gy = 0;
        p.el.style.translate = '';
      }
    });
    if (moving) windRaf = requestAnimationFrame(windTick);
  }
  if (!reduced) {
    // myš; prst přes touchmove, ten chodí i během posouvání stránky
    window.addEventListener('pointermove', function (e) { if (e.pointerType !== 'touch') windMove(e.clientX, e.clientY); }, { passive: true });
    window.addEventListener('touchmove', function (e) { var t = e.touches[0]; if (t) windMove(t.clientX, t.clientY); }, { passive: true });
    window.addEventListener('touchend', function () { lastX = null; }, { passive: true });
  }

  // the marquee scrolls by half its width, so its content is doubled to loop seamlessly
  function marquee(root) {
    root.querySelectorAll('.marquee-track:not([data-done])').forEach(function (track) {
      track.dataset.done = '1';
      Array.prototype.slice.call(track.children).forEach(function (el) {
        var copy = el.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        if (copy.tagName === 'A') copy.tabIndex = -1;
        track.appendChild(copy);
      });
    });
  }

  // cards lean slightly towards the mouse
  var TILT = '.feature-card, .video, .song-card, .disco-card, [data-tilt], .home-page .side-card:not(:has(form))';   // karty bez formuláře (při psaní by se kývaly)
  function tilt(root) {
    if (reduced || !finePointer) return;
    root.querySelectorAll(TILT).forEach(function (el) {
      if (el.dataset.tiltBound) return;
      el.dataset.tiltBound = '1';
      el.setAttribute('data-tilt', '');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.classList.add('tilting');
        el.style.setProperty('--rx', (-y * 5).toFixed(2) + 'deg');
        el.style.setProperty('--ry', (x * 6).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('tilting');
        el.style.removeProperty('--rx');
        el.style.removeProperty('--ry');
      });
    });
  }

  // The background of every page: Skeli's photos cross-fade over the usual one, then back to it.
  // The layer is outside <main> (includes/header.jsp), so a PJAX page swap leaves it running, and
  // sessionStorage keeps the turn across full page loads: the next page starts on the same photo
  // and the next one comes when it would have anyway.
  // data-dark / data-light = "name:position[:wide],…" of img/photos/<name>-lg|md.webp; a portrait
  // photo marked wide has <name>-wide.webp (whole photo on a 16:9 canvas) for landscape screens
  var SLIDE_MS = 12000, SLIDE_KEY = 'bgSlide';   // každá fotka 12 s, prolnutí i přebarvení 4 s

  // Barva webu podle fotky v pozadí: [hlavní, druhá]. „base“ = obvyklé pozadí (tmavý: rudá fotka IMG_0090,
  // světlý: sníh lightnaweb). Světlé barvy jsou tmavší, aby byly na světlém podkladu čitelné.
  // Admin má klidný vzhled – tam zůstává zlatá (OWN níž).
  var PALETTE = {
    dark: { base: ['#ff3b30', '#ff8a3d'], skull: ['#ff3d8b', '#ff7ab8'], mic: ['#7dff3a', '#d4ff1f'],
            square: ['#ffad42', '#ff6a1f'], walker: ['#3fb4ff', '#7cf3ff'] },
    light: { base: ['#1f6fc4', '#4aa3ea'], field: ['#c4521a', '#e8892a'], point: ['#a87400', '#d6a019'], rocks: ['#4e7a1c', '#86a83a'] }
  };
  // Admin má vlastní klidnou zlatou (stejná jako v base.css) – nastaví se stejnou cestou, ať se přelije i ona.
  // Texty se přebarvují s fotkami jako zbytek webu (video pozadí přebarví js/texty-bg.js).
  var OWN = { dark: ['#ffd23f', '#ff8a3d'], light: ['#a37b00', '#2f7fd6'] };
  var painted = 'base', songColor = null;   // songColor = barva písně z náhledu jejího klipu (stránka písně)
  var lastHue = {};                          // poslední nastavený odstín: nový se volí kratší cestou po kruhu
  // #rrggbb → [odstín 0–360, sytost %, světlost %]
  function toHsl(hex) {
    var r = parseInt(hex.substr(1, 2), 16) / 255, g = parseInt(hex.substr(3, 2), 16) / 255, bl = parseInt(hex.substr(5, 2), 16) / 255;
    var mx = Math.max(r, g, bl), mn = Math.min(r, g, bl), l = (mx + mn) / 2, d = mx - mn, h = 0, s = 0;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      h = mx === r ? 60 * (((g - bl) / d) % 6) : mx === g ? 60 * ((bl - r) / d + 2) : 60 * ((r - g) / d + 4);
      if (h < 0) h += 360;
    }
    return [h, s * 100, l * 100];
  }
  // n = 1 (--accent) nebo 2 (--accent-2); přelévá se odstín po kruhu, ne barva přes šedou (viz base.css)
  // Telefon (dotyk): přelití barvy přes CSS by 4 s v každém snímku překreslovalo celý web (vše, co má barvu fotky)
  // a sekalo to – tam se barva přelije v STEPS krocích z JS (body.paint-steps vypne CSS přechod).
  var STEPPED = matchMedia('(pointer: coarse)').matches, STEPS = 8, curVal = {}, stepT = 0;
  if (STEPPED) document.body.classList.add('paint-steps');
  function applyAccent(b, n, v) {
    var p = '--a' + n;
    curVal[n] = v;
    b.style.setProperty(p + 'h', v[0].toFixed(2));
    b.style.setProperty(p + 's', v[1].toFixed(2) + '%');
    b.style.setProperty(p + 'l', v[2].toFixed(2) + '%');
    b.style.setProperty(n === 1 ? '--accent' : '--accent-2', 'hsl(var(' + p + 'h) var(' + p + 's) var(' + p + 'l))');
  }
  function accentTarget(n, hex) {
    var v = toHsl(hex), h = v[0];
    if (lastHue[n] != null) h += 360 * Math.round((lastHue[n] - h) / 360);
    lastHue[n] = h;
    return [h, v[1], v[2]];
  }
  function setAccents(b, c, instant) {
    var to = [null, accentTarget(1, c[0]), accentTarget(2, c[1])];
    clearInterval(stepT);
    if (!STEPPED || instant || !curVal[1]) { applyAccent(b, 1, to[1]); applyAccent(b, 2, to[2]); return; }
    var from = [null, curVal[1], curVal[2]], k = 0;
    stepT = setInterval(function () {
      k++;
      var u = k / STEPS, e = u * u * (3 - 2 * u);   // plynulý náběh i dojezd
      [1, 2].forEach(function (n) { applyAccent(b, n, from[n].map(function (x, i) { return x + (to[n][i] - x) * e; })); });
      if (k >= STEPS) clearInterval(stepT);
    }, 4000 / STEPS);
  }
  // instant = bez přelévání (načtení stránky, nová stránka navazuje na fotku té předchozí)
  function paint(name, instant) {
    if (name) painted = name;
    var b = document.body, own = b.classList.contains('is-admin');
    if (instant) {
      b.style.transition = 'none';
      requestAnimationFrame(function () { requestAnimationFrame(function () { b.style.removeProperty('transition'); }); });
    }
    var mode = b.classList.contains('light') ? 'light' : 'dark';
    var c = own ? OWN[mode] : (songColor ? songColor[mode === 'light' ? 1 : 0] : PALETTE[mode][painted]);
    if (c) setAccents(b, c, instant);
    else { clearInterval(stepT); curVal = {}; b.style.removeProperty('--accent'); b.style.removeProperty('--accent-2'); }
    // sníh ve světlém režimu: bílý jen u sněhové fotky, jinak v barvě fotky
    if (b.classList.contains('light') && painted !== 'base' && c && !own) b.style.setProperty('--flake', c[1]); else b.style.removeProperty('--flake');
  }
  paint('base', true);
  // přepnutí světlého a tmavého režimu = barvy druhé sady (i když se fotky nestřídají)
  new MutationObserver(function () { paint(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // Fotky mají omezené rozlišení: na velkém monitoru by je „cover“ nafoukl (pole 1920×819 na 2560 px skoro 2×)
  // a byly by rozmazané. Od šířky 1025 px se vrstva s fotkou zmenší tak, aby fotka nebyla zvětšená víc než FIT_MAX ×,
  // a strany, které nedosáhnou na kraj obrazovky, se ztratí do barvy stránky (css/effects.css, třída .fit).
  // Telefon beze změny. BASE_SIZE = rozměry obvyklého pozadí (IMG_0090, lightnaweb) pro body::before.
  var FIT_MAX = 1.1, BASE_SIZE = { dark: [2560, 1707], light: [1538, 1022] };
  function fitBox(nw, nh) {
    var W = window.innerWidth, H = window.innerHeight;
    if (!nw || !nh || W < 1025) return null;
    var w = Math.min(W, Math.round(nw * FIT_MAX)), h = Math.min(H, Math.round(nh * FIT_MAX));
    if (w >= W && h >= H) return null;
    return { w: w, h: h, fx: w < W ? Math.round(w * 0.16) : 0, fy: h < H ? Math.round(h * 0.16) : 0 };
  }
  function fitSet(el, cls, f, p) {
    el.classList.toggle(cls, !!f);
    if (!f) { ['w', 'h', 'fx', 'fy'].forEach(function (k) { el.style.removeProperty('--' + p + k); }); return; }
    el.style.setProperty('--' + p + 'w', f.w + 'px'); el.style.setProperty('--' + p + 'h', f.h + 'px');
    el.style.setProperty('--' + p + 'fx', f.fx + 'px'); el.style.setProperty('--' + p + 'fy', f.fy + 'px');
  }
  function fitLayer(el) { fitSet(el, 'fit', fitBox(+el.dataset.nw, +el.dataset.nh), 'b'); }
  function fitBase() {
    var s = BASE_SIZE[document.body.classList.contains('light') ? 'light' : 'dark'];
    fitSet(document.body, 'bg-fit', fitBox(s[0], s[1]), 'bb');
  }
  fitBase();
  var fitLight = document.body.classList.contains('light'), fitRaf = 0;
  new MutationObserver(function () {
    var l = document.body.classList.contains('light');
    if (l !== fitLight) { fitLight = l; fitBase(); }
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', function () {
    if (fitRaf) return;
    fitRaf = requestAnimationFrame(function () {
      fitRaf = 0;
      fitBase();
      document.querySelectorAll('.bg-slides > div[data-nw]').forEach(fitLayer);
    });
  });

  function slides() {
    var box = document.querySelector('.bg-slides');
    if (!box || reduced) return;   // i v lehkém režimu: prolnutí fotek je levné a nese barvu webu
    var step = 0, wait = 0, every = 0;   // step 0 = the usual background, 1..n = the photos
    var topZ = 1;                        // poslední ukázaná fotka leží vždy nahoře
    function theme() { return document.body.classList.contains('light') ? 'light' : 'dark'; }
    function build() {
      var size = window.innerWidth * (window.devicePixelRatio || 1) > 1400 ? 'lg' : 'md';
      var landscape = window.innerWidth > window.innerHeight;
      box.innerHTML = '';
      (box.getAttribute(theme() === 'light' ? 'data-light' : 'data-dark') || '').split(',').forEach(function (item) {
        var parts = item.split(':');
        if (!parts[0]) return;
        var layer = document.createElement('div');
        layer.dataset.name = parts[0].trim();   // podle jména se vybere barva webu (PALETTE)
        layer.dataset.src = '/img/photos/' + parts[0].trim() + '-' + (parts[2] === 'wide' && landscape ? 'wide' : size) + '.webp';
        layer.style.setProperty('--pos', parts[1] || 'center');
        box.appendChild(layer);
      });
    }
    // fotka se stáhne a rozbalí dopředu (prep), aby se při výměně nemusela stahovat zároveň s prolínáním
    function prep(layer, done) {
      if (!layer) { if (done) done(); return; }
      if (layer.style.getPropertyValue('--slide')) { if (done) done(); return; }
      if (layer._prep) { if (done) layer._prep.push(done); return; }
      layer._prep = done ? [done] : [];
      var img = new Image();
      function ready() {
        layer.dataset.nw = img.naturalWidth; layer.dataset.nh = img.naturalHeight; fitLayer(layer);
        layer.style.setProperty('--slide', 'url("' + layer.dataset.src + '")');
        var q = layer._prep; layer._prep = null; q.forEach(function (f) { f(); });
      }
      img.onload = function () { if (img.decode) img.decode().then(ready, ready); else ready(); };
      img.src = layer.dataset.src;
    }
    // další fotka v pořadí (krok step + 1; po poslední přijde obvyklé pozadí = nic)
    function prepNext() { var nx = box.children[step]; if (nx) setTimeout(function () { prep(nx); }, 4500); }
    function show(instant) {
      var layers = box.children, cur = layers[step - 1];
      function swap() {
        for (var i = 0; i < layers.length; i++) {
          layers[i].classList.toggle('instant', !!instant);
          layers[i].classList.toggle('on', layers[i] === cur);
        }
        // nová fotka se prolíná nahoře; obvyklé pozadí (body::before) pod ní zmizí, jinak by u zmenšené fotky
        // na velkém monitoru prosvítalo jejími průhlednými okraji (vypadalo to jako dvě zaseknuté fotky)
        if (cur) cur.style.zIndex = ++topZ;
        document.body.classList.toggle('slide-instant', !!instant);
        document.body.classList.toggle('slide-on', !!cur);
        paint(cur ? cur.dataset.name : 'base', instant);   // web se přebarví spolu s fotkou

        if (instant) requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            for (var i = 0; i < layers.length; i++) layers[i].classList.remove('instant');
            document.body.classList.remove('slide-instant');
          });
        });
      }
      prep(cur, function () { swap(); prepNext(); });
    }
    function save() {
      try { sessionStorage.setItem(SLIDE_KEY, JSON.stringify({ step: step, at: Date.now(), theme: theme() })); } catch (e) { }
    }
    function next() {
      if (document.hidden || document.documentElement.classList.contains('kpong-open')) return;   // pod hrou se fotky nestřídají
      step = (step + 1) % (box.children.length + 1);
      save();
      show(false);
    }
    function start() {
      clearTimeout(wait);
      clearInterval(every);
      build();
      document.body.classList.remove('slide-on');   // nová sada fotek začíná na obvyklém pozadí
      // kontrola fotek: ?bgshow=<jméno fotky> (např. skull) ukáže jen tu jednu a nestřídá se
      var only = new URLSearchParams(location.search).get('bgshow');
      if (only) {
        for (var oi = 0; oi < box.children.length; oi++) if (box.children[oi].dataset.name === only) { step = oi + 1; show(true); }
        return;
      }
      var saved = null, delay = SLIDE_MS;
      try { saved = JSON.parse(sessionStorage.getItem(SLIDE_KEY)); } catch (e) { }
      var age = saved ? Date.now() - saved.at : -1;
      if (saved && saved.theme === theme() && saved.step <= box.children.length && age >= 0 && age < 10 * 60000) {
        step = saved.step;                       // carry on with the photo the last page showed
        show(true);
        delay = Math.max(400, SLIDE_MS - age);
      } else {
        step = 0;
        save();
        prepNext();
      }
      wait = setTimeout(function () { next(); every = setInterval(next, SLIDE_MS); }, delay);
    }
    start();
    // the theme switch brings the other set of photos
    var lastTheme = theme();
    new MutationObserver(function () { if (theme() !== lastTheme) { lastTheme = theme(); start(); } })
      .observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  // the photo band drifts a little slower than the page
  var bands = [];
  function parallax(root) {
    if (reduced) return;
    root.querySelectorAll('[data-parallax]').forEach(function (el) { if (bands.indexOf(el) < 0) bands.push(el); });
  }
  var pRaf = 0;
  window.addEventListener('scroll', function () {
    if (pRaf || !bands.length) return;
    pRaf = requestAnimationFrame(function () {
      pRaf = 0;
      bands = bands.filter(function (el) { return el.isConnected; });
      bands.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        var mid = r.top + r.height / 2 - window.innerHeight / 2;
        // at most 60px either way: the photo layer is 60px taller on each side
        el.style.setProperty('--py', Math.max(-60, Math.min(60, mid * -0.12)).toFixed(1) + 'px');
      });
    });
  }, { passive: true });

  // photos with data-lightbox open full screen; arrows / swipe / Esc
  var lb = null, lbItems = [], lbIndex = 0;
  function lightboxOpen(items, i) {
    if (!lb) {
      lb = document.createElement('div');
      lb.className = 'lightbox';
      lb.setAttribute('role', 'dialog');
      lb.setAttribute('aria-modal', 'true');
      var L = { cs: ['Zavřít', 'Předchozí', 'Další'], en: ['Close', 'Previous', 'Next'], de: ['Schließen', 'Zurück', 'Weiter'],
                uk: ['Закрити', 'Назад', 'Далі'], vi: ['Đóng', 'Trước', 'Sau'] }[document.documentElement.lang] || ['Zavřít', 'Předchozí', 'Další'];
      lb.innerHTML = '<img alt=""><button type="button" class="lb-close" aria-label="' + L[0] + '">✕</button>'
        + '<button type="button" class="lb-prev" aria-label="' + L[1] + '">‹</button><button type="button" class="lb-next" aria-label="' + L[2] + '">›</button>';
      document.body.appendChild(lb);
      lb.querySelector('.lb-close').addEventListener('click', lightboxClose);
      lb.querySelector('.lb-prev').addEventListener('click', function () { lightboxShow(lbIndex - 1); });
      lb.querySelector('.lb-next').addEventListener('click', function () { lightboxShow(lbIndex + 1); });
      lb.addEventListener('click', function (e) { if (e.target === lb) lightboxClose(); });
      var x0 = null;
      lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      lb.addEventListener('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 50) lightboxShow(lbIndex + (dx < 0 ? 1 : -1));
        x0 = null;
      });
      document.addEventListener('keydown', function (e) {
        if (!lb.classList.contains('open')) return;
        if (e.key === 'Escape') lightboxClose();
        if (e.key === 'ArrowLeft') lightboxShow(lbIndex - 1);
        if (e.key === 'ArrowRight') lightboxShow(lbIndex + 1);
      });
    }
    lbItems = items;
    lb.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
    lightboxShow(i);
    lb.querySelector('.lb-close').focus();
  }
  function lightboxShow(i) {
    lbIndex = (i + lbItems.length) % lbItems.length;
    var a = lbItems[lbIndex];
    var img = lb.querySelector('img');
    img.src = window.innerWidth < 900 ? a.href.replace('-lg.', '-md.') : a.href;
    img.alt = (a.querySelector('img') || {}).alt || a.dataset.alt || '';
    // tajné fotky Kevina: u každé fotky se ozve (js/kevin.js)
    if (a.dataset.kevinSay) window.dispatchEvent(new CustomEvent('kevin', { detail: { photos: a.dataset.kevinSay } }));
  }
  function lightboxClose() {
    lb.classList.remove('open');
    if (lbItems[lbIndex] && lbItems[lbIndex].dataset.kevinSay) window.dispatchEvent(new CustomEvent('kevin', { detail: { photos: '' } }));
    document.documentElement.style.overflow = '';
    if (lbItems[lbIndex]) lbItems[lbIndex].focus();
  }
  document.addEventListener('click', function (e) {
    // tlačítko, které otevře skupinu fotek odjinud (kocour za větou na O mně)
    var opener = e.target.closest('[data-lightbox-open]');
    if (opener) {
      var firstOne = document.querySelector('a[data-lightbox="' + opener.dataset.lightboxOpen + '"]');
      if (firstOne) firstOne.click();
      return;
    }
    var a = e.target.closest('a[data-lightbox]');
    if (!a) return;
    e.preventDefault();
    var group = Array.prototype.slice.call(document.querySelectorAll('a[data-lightbox="' + a.dataset.lightbox + '"]'));
    lightboxOpen(group, group.indexOf(a));
  });

  // Podstránky ve vzhledu „Ulice“: pod úvodním pásem s kouřem (pageHero.tag) leží plná barva stránky.
  // Hranici (kde pás končí) dostane CSS jako --floor-top na <main> (css/effects.css, main.has-floor).
  var floorObs = null;
  function floor() {
    var main = document.querySelector('main'), hero = main && main.querySelector('.page-hero.with-smoke');
    if (floorObs) { floorObs.disconnect(); floorObs = null; }
    if (!hero) { if (main) main.classList.remove('has-floor'); return; }
    function set() { main.style.setProperty('--floor-top', Math.round(hero.getBoundingClientRect().bottom - main.getBoundingClientRect().top) + 'px'); }
    main.classList.add('has-floor'); set();
    if (window.ResizeObserver) { floorObs = new ResizeObserver(set); floorObs.observe(hero); floorObs.observe(main); }
  }

  // BARVA PÍSNĚ: stránka písně se přebarví podle náhledu svého klipu (.lyric-ambient, --amb). Z malé kopie obrázku se
  // vezme nejsytější barva (vážený průměr sytých pixelů), pak se upraví jas: tmavý režim světlejší, světlý tmavší.
  function hsl(h, s, l) {
    function f(n) { var k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); }
    return '#' + [f(0), f(8), f(4)].map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('');
  }
  function songPaint(url) {
    var amb = document.querySelector('main.lyric-page .lyric-ambient');
    var m = amb && /url\(['"]?([^'")]+)/.exec(amb.getAttribute('style') || '');
    // Hudba: přehrávač už má vybrané video dřív, než se tenhle skript načte – vezme se z něj
    var cp = !url && document.querySelector('[data-clip-player][data-yt]');
    if (cp) url = '/yt-thumb/' + cp.dataset.yt + '/mqdefault.jpg';
    document.body.classList.toggle('clip-on', !!url);
    if (url) m = [0, url];
    if (!m) { if (songColor) { songColor = null; paint(); } return; }
    var img = new Image();
    img.onload = function () {
      try {
        var c = document.createElement('canvas'); c.width = 32; c.height = 18;
        var x = c.getContext('2d'); x.drawImage(img, 0, 0, 32, 18);
        var d = x.getImageData(0, 0, 32, 18).data, sr = 0, sg = 0, sb = 0, sw = 0;
        for (var i = 0; i < d.length; i += 4) {
          var r = d[i] / 255, g = d[i + 1] / 255, bl = d[i + 2] / 255, mx = Math.max(r, g, bl), mn = Math.min(r, g, bl);
          var w = Math.pow(mx - mn, 2) * mx;   // syté a jasné pixely váží víc, šedé a černé skoro nic
          sr += r * w; sg += g * w; sb += bl * w; sw += w;
        }
        if (sw < 0.5) { songColor = null; paint(); return; }   // černobílý náhled: zůstává barva fotky v pozadí
        var R = sr / sw, G = sg / sw, B = sb / sw, M = Math.max(R, G, B), N = Math.min(R, G, B), h = 0;
        if (M !== N) h = M === R ? 60 * (((G - B) / (M - N)) % 6) : M === G ? 60 * ((B - R) / (M - N) + 2) : 60 * ((R - G) / (M - N) + 4);
        if (h < 0) h += 360;
        songColor = [[hsl(h, 0.9, 0.6), hsl((h + 28) % 360, 0.95, 0.66)], [hsl(h, 0.75, 0.36), hsl((h + 28) % 360, 0.8, 0.45)]];
        paint(null, !url);   // video na Hudbě: barva se přelije, stránka písně: hned
      } catch (e) { /* obrázek z jiného webu nejde přečíst – zůstává barva fotky */ }
    };
    img.src = m[1];
  }
  // Hudba: vybrané video (EllipticPlayerServlet) určí barvu stránky a fotky v pozadí se ztlumí
  window.addEventListener('skeli:clip', function (e) {
    if (!e.detail || !e.detail.thumb) return;
    document.body.classList.add('clip-on');
    songPaint(e.detail.thumb);
  });

  function init(root) { particles(root); marquee(root); tilt(root); parallax(root); paint(); floor(); songPaint(); }   // paint: admin má vlastní barvu
  init(document);
  // Hlídač plynulosti: po načtení 3 s počítá snímky. Když telefon nestíhá, přepne se na lehký režim hned a po druhém
  // takovém měření natrvalo. Testy (webdriver) mají softwarové kreslení, u nich neměří.
  function watchSmooth() {
    if (low() || reduced || navigator.webdriver) return;
    setTimeout(function () {
      if (document.hidden) return;
      var frames = 0, t0 = performance.now();
      requestAnimationFrame(function tick(now) {
        frames++;
        if (now - t0 < 3000) { requestAnimationFrame(tick); return; }
        if (document.hidden) return;
        if (frames / 3 >= 20) { try { localStorage.setItem('fxSlow', 0); } catch (e) { } return; }   // stíhá = počítadlo od nuly
        document.documentElement.classList.add('low-fx');
        try {
          sessionStorage.setItem('fxLowNow', '1');
          // třetí pomalé měření = lehký režim na 7 dní (fxAuto, hlavička stránky), pak se měří znovu
          var strikes = (+localStorage.getItem('fxSlow') || 0) + 1;
          localStorage.setItem('fxSlow', strikes >= 3 ? 0 : strikes);
          if (strikes >= 3 && localStorage.getItem('fxLow') !== '0') localStorage.setItem('fxAuto', Date.now());
        } catch (e) { /* bez úložiště to platí jen pro tuhle stránku */ }
      });
    }, 1500);
  }
  if (document.readyState === 'complete') watchSmooth(); else window.addEventListener('load', watchSmooth);

  // SVĚTLUŠKY přes celou stránku (vzhled „Ulice“): měkké svítící body v barvě fotky stoupají, pomalu pomrkávají,
  // myš nebo prst do nich fouká. Většina létá za obsahem, asi každá desátá i přes něj (slabší).
  // Ve světlém režimu padá sníh – bílý u sněhové fotky, jinak v barvě fotky. Dvě plátna přes celou obrazovku
  // (ne přes celou stránku), kreslí se jen na viditelné stránce. Ne na slabém telefonu, v adminu a pod hrou.
  function fireflies() {
    if (reduced || document.body.classList.contains('is-admin')) return;   // v lehkém režimu méně a pomaleji (níž)
    var back = document.createElement('canvas'), front = document.createElement('canvas');
    back.className = 'ff-layer'; front.className = 'ff-layer ff-front';
    back.setAttribute('aria-hidden', 'true'); front.setAttribute('aria-hidden', 'true');
    document.body.appendChild(back); document.body.appendChild(front);
    var gb = back.getContext('2d'), gf = front.getContext('2d'), W = 0, H = 0, P = [], t = 0;
    var skip = false, mx = -1e4, my = -1e4, vx = 0, vy = 0, col = '#ff3b30', col2 = '#ff8a3d', flake = '#ffffff';
    function mk(y) {
      return { front: Math.random() < 0.1, x: Math.random() * W, y: y, r: 0.6 + Math.random() * 1.6, s: 0.2 + Math.random() * 0.55,
               ph: Math.random() * 6.3, dx: 0, dy: 0, a: 0.35 + Math.random() * 0.55 };
    }
    function size() {
      W = back.width = front.width = innerWidth; H = back.height = front.height = innerHeight;
      var n = Math.min(innerWidth < 700 ? 34 : 70, Math.round(W * H / 16000));
      if (low()) n = Math.round(n * 0.55);
      P = []; for (var i = 0; i < n; i++) P.push(mk(Math.random() * H));
    }
    function colors() {
      var cs = getComputedStyle(document.body);
      col = cs.getPropertyValue('--accent').trim() || col; col2 = cs.getPropertyValue('--accent-2').trim() || col2;
      flake = cs.getPropertyValue('--flake').trim() || '#ffffff';
    }
    // úvod: pod hlavičkou leží plná barva stránky (.home-below), ta by zadní vrstvu zakryla – dostane vlastní plátno
    // (lepí se k obrazovce, za kartami); kreslí se do něj totéž co do zadní vrstvy
    var local = null, gl2 = null;
    // podstránky: totéž pod úvodním pásem s kouřem (main.has-floor) – plátno hned za pásem
    function findLocal() {
      var box = document.querySelector('.home-below'), hero = !box && document.querySelector('main .page-hero.with-smoke');
      local = box ? box.querySelector(':scope > .ff-local') : hero && hero.nextElementSibling && hero.nextElementSibling.classList.contains('ff-local') ? hero.nextElementSibling : null;
      if ((box || hero) && !local) {
        local = document.createElement('canvas'); local.className = 'ff-local'; local.setAttribute('aria-hidden', 'true');
        if (box) box.insertBefore(local, box.firstChild); else hero.after(local);
      }
      if (local) { local.width = W; local.height = H; gl2 = local.getContext('2d'); } else gl2 = null;
    }
    size(); colors(); findLocal();
    addEventListener('resize', function () { size(); findLocal(); });
    document.addEventListener('pjax:done', findLocal);
    addEventListener('pointermove', function (e) { if (mx > -1e4) { vx = e.clientX - mx; vy = e.clientY - my; } mx = e.clientX; my = e.clientY; }, { passive: true });
    addEventListener('touchmove', function (e) { var p = e.touches[0]; if (!p) return; if (mx > -1e4) { vx = p.clientX - mx; vy = p.clientY - my; } mx = p.clientX; my = p.clientY; }, { passive: true });
    (function loop() {
      requestAnimationFrame(loop);
      if (document.hidden || document.documentElement.classList.contains('kpong-open')) { gb.clearRect(0, 0, W, H); gf.clearRect(0, 0, W, H); return; }
      if (low() && (skip = !skip)) return;   // lehký režim: každý druhý snímek
      t++;
      if (t % 20 === 0) colors();   // barva se mění s fotkou (přelévá se 4 s), stačí ji číst občas
      var snow = document.body.classList.contains('light');
      gb.clearRect(0, 0, W, H); gf.clearRect(0, 0, W, H);
      var lr = null;
      if (gl2 && local.isConnected) {
        lr = local.getBoundingClientRect();
        gl2.setTransform(1, 0, 0, 1, 0, 0); gl2.clearRect(0, 0, W, H);
        if (lr.bottom > 0 && lr.top < H) gl2.setTransform(1, 0, 0, 1, -lr.left, -lr.top); else lr = null;   // kreslí se v souřadnicích obrazovky
      }
      for (var i = 0; i < P.length; i++) {
        var p = P[i], ddx = p.x - mx, ddy = p.y - my, d2 = ddx * ddx + ddy * ddy;
        if (d2 < 140 * 140) { var f = (1 - Math.sqrt(d2) / 140) * 0.06; p.dx += vx * f + ddx * 0.002; p.dy += vy * f + ddy * 0.002; }
        p.dx *= 0.95; p.dy *= 0.95;
        p.x += Math.sin(t * (snow ? 0.02 : 0.01) + p.ph) * (snow ? 0.6 : 0.3) + p.dx;
        p.y += snow ? p.s * 0.9 + p.dy : -(p.s - p.dy);
        if (!snow && p.y < -10) { P[i] = mk(H + 10); continue; }
        if (snow && p.y > H + 10) { P[i] = mk(-10); continue; }
        if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
        var g = p.front ? gf : gb;
        if (snow) {
          g.globalAlpha = (0.6 + p.a * 0.4) * (p.front ? 0.65 : 1); g.fillStyle = flake;
          g.beginPath(); g.arc(p.x, p.y, p.r * 0.85, 0, 6.283); g.fill();
          if (lr && !p.front) { gl2.globalAlpha = g.globalAlpha; gl2.fillStyle = flake; gl2.beginPath(); gl2.arc(p.x, p.y, p.r * 0.85, 0, 6.283); gl2.fill(); }
          continue;
        }
        var tw = 0.7 + 0.3 * Math.sin(t * 0.022 + p.ph * 3), R = p.r * 1.6;
        var gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
        gr.addColorStop(0, 'rgba(255,245,225,.95)'); gr.addColorStop(0.25, col2); gr.addColorStop(0.55, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.globalAlpha = p.a * tw * (p.front ? 0.65 : 1); g.fillStyle = gr;
        g.beginPath(); g.arc(p.x, p.y, R, 0, 6.283); g.fill();
        if (lr && !p.front) { gl2.globalAlpha = g.globalAlpha; gl2.fillStyle = gr; gl2.beginPath(); gl2.arc(p.x, p.y, R, 0, 6.283); gl2.fill(); }
      }
      vx *= 0.8; vy *= 0.8;
    })();
  }
  fireflies();

  // Kyselinové bublinky (nápad uživatele): když je web v kyselinově zelené (fotka s mikrofonem, tmavý režim),
  // zespodu pomalu stoupá pár bublin a dají se praskat (klik / ťuknutí) – rozstříknou se na kapičky.
  // ?bubliny=1 v adrese je pustí pořád (na zkoušku). Ne v lehkém režimu, při omezení pohybu, v adminu a pod hrou.
  function bubbles() {
    if (reduced || document.body.classList.contains('is-admin')) return;
    var always = /[?&]bubliny=1/.test(location.search), box = document.createElement('div'), count = 0;
    box.className = 'acid-bubbles'; box.setAttribute('aria-hidden', 'true');
    document.body.appendChild(box);
    function green() { return always || (painted === 'mic' && !document.body.classList.contains('light')); }
    function spawn() {
      var b = document.createElement('div'), s = 26 + Math.random() * 38;
      b.className = 'acid-b';
      b.style.setProperty('--s', s.toFixed(0) + 'px');
      b.style.setProperty('--x', (4 + Math.random() * 92).toFixed(1) + 'vw');
      b.style.setProperty('--dur', (11 + Math.random() * 8).toFixed(1) + 's');
      b.style.setProperty('--sway', (2.4 + Math.random() * 2).toFixed(1) + 's');
      b.innerHTML = '<i></i>';
      b.addEventListener('animationend', function (e) { if (e.target === b) { b.remove(); count--; } });
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); pop(b); });
      box.appendChild(b); count++;
    }
    function pop(b) {
        if (b.classList.contains('pop') || !b.isConnected) return;
        // prásk: bublina se nafoukne a zmizí, kolem se rozletí kapičky
        var r = b.getBoundingClientRect(), splash = document.createElement('div');
        splash.className = 'acid-splash';
        splash.style.left = (r.left + r.width / 2) + 'px'; splash.style.top = (r.top + r.height / 2) + 'px';
        splash.style.setProperty('--s', r.width + 'px');
        for (var k = 0; k < 9; k++) {
          var d = document.createElement('i'), a = k / 9 * 6.283 + Math.random() * 0.5, dist = r.width * (0.7 + Math.random() * 0.6);
          d.style.setProperty('--dx', (Math.cos(a) * dist).toFixed(0) + 'px'); d.style.setProperty('--dy', (Math.sin(a) * dist).toFixed(0) + 'px');
          splash.appendChild(d);
        }
        box.appendChild(splash);
        setTimeout(function () { splash.remove(); }, 650);
        b.classList.add('pop');
        setTimeout(function () { if (b.isConnected) { b.remove(); count--; } }, 260);
    }
    (function tick() {
      setTimeout(tick, 1400 + Math.random() * 1800);
      if (document.hidden || low() || document.documentElement.classList.contains('kpong-open')) return;
      if (!green()) {
        // barva se přepnula pryč ze zelené: zbylé bublinky ještě kousek letí a pak každá sama praskne
        box.querySelectorAll('.acid-b:not(.leaving)').forEach(function (b) {
          b.classList.add('leaving');
          setTimeout(function () { pop(b); }, 500 + Math.random() * 2500);
        });
        return;
      }
      if (count < (innerWidth < 700 ? 5 : 8)) spawn();
    })();
  }
  bubbles();

  // Diskografie: na dotykové obrazovce se karta otočí ťuknutím (odkazy vzadu fungují normálně), další ťuknutí ji vrátí
  document.addEventListener('click', function (e) {
    var card = e.target.closest('.flip-card');
    if (!card || e.target.closest('a, summary, details') || window.matchMedia('(hover: hover)').matches) return;
    document.querySelectorAll('.flip-card.open').forEach(function (c) { if (c !== card) c.classList.remove('open'); });
    card.classList.toggle('open');
  });

  slides();   // once: the layer is not part of the page that PJAX swaps
  document.addEventListener('pjax:done', function () { init(document.querySelector('main') || document); });
})();
