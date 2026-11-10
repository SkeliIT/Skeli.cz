// Texty a Karaoke (texty.jsp): Kolotoč písní. Svislé kolo, píseň na „čáře výběru“ (horní třetina kola) se rozsvítí
// a ukáže verš a tlačítka Číst text / Zpívej, ostatní se naklánějí a mizí. Přepínač Texty | Karaoke nechá v Karaoke
// jen písně s časy (data-k) a hlavní tlačítko je Zpívej. Hledání (/api/search) a roky filtrují stejně jako dřív.
// Kolo NEMÁ vlastní posouvání: jede celá stránka (dřív se na telefonu posouvala zvlášť stránka a zvlášť kolo uvnitř
// a vypadalo to jako rozbitý web). Čára výběru je pevně v horní třetině obrazovky pod hlavičkou.
(function () {
  var wheel = document.getElementById('songGrid'), wrap = document.getElementById('wheelWrap');
  var input = document.getElementById('lyricSearch'), chips = document.getElementById('yearChips');
  var none = document.getElementById('searchNone'), sw = document.getElementById('lyricMode');
  var main = document.querySelector('main.texty-page'), rail = document.getElementById('wheelYears');
  if (!wheel || !main) return;
  var items = [].slice.call(wheel.querySelectorAll('.wheel-item'));
  var pads = wheel.querySelectorAll('.wheel-pad');
  var low = function () { return document.documentElement.classList.contains('low-fx'); };
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mode = main.classList.contains('k-mode') ? 'k' : 't';
  var year = '', hits = null, timer = 0, kevinTimer = 0, asked = '';
  var shown = items.slice(), mid = null, raf = 0;

  // ---- geometrie kola ----
  // čára výběru = kousek pod hlavičkou a lištou roků, v horní třetině toho, co zbývá z obrazovky
  function head() {
    var h = document.querySelector('.site-header'), b = h ? h.getBoundingClientRect().bottom : 64;
    return Math.max(0, b) + (rail && rail.offsetHeight && getComputedStyle(rail).position === 'sticky' && innerWidth <= 1024 ? rail.offsetHeight : 0);
  }
  function lineY() { var top = head(); return top + (innerHeight - top) * 0.32; }
  function layout() {
    var first = shown[0] || items[0];
    if (!first) return;
    var ih = first.offsetHeight;
    pads[0].style.height = '0px';
    // dole místo, aby i poslední píseň dojela na čáru výběru
    pads[1].style.height = Math.max(0, Math.round(innerHeight - lineY() - ih / 2 - 30)) + 'px';
    // přichycení stránky (html:has(main.texty-page) v pages.css): píseň se zastaví na čáře výběru
    wheel.style.setProperty('--wheel-snap', Math.round(lineY() - ih / 2) + 'px');
    update();
  }
  // kde by stránka musela být, aby píseň stála na čáře výběru
  function targetOf(el) { return wheel.getBoundingClientRect().top + scrollY + el.offsetTop + el.offsetHeight / 2 - lineY(); }
  function update() {
    raf = 0;
    if (!shown.length) return setMid(null);
    var ih = shown[0].offsetHeight, step = ih + 14, line = lineY() - wheel.getBoundingClientRect().top, best = null, bd = 1e9;
    var flat = low() || still;
    shown.forEach(function (el) {
      var d = (el.offsetTop + el.offsetHeight / 2 - line) / step, a = Math.abs(d);
      if (a < 3.5) {   // daleké písně se nepočítají (výkon) – stejně jsou skoro neviditelné
        el.style.transform = flat ? '' : 'perspective(900px) rotateX(' + (-d * 22).toFixed(1) + 'deg) scale(' + Math.max(0.74, 1 - a * 0.11).toFixed(3) + ')';
        el.style.opacity = Math.max(0.12, 1 - a * 0.42).toFixed(2);
      } else { el.style.opacity = '0.12'; }
      if (a < bd) { bd = a; best = el; }
    });
    setMid(best);
  }
  function setMid(el) {
    if (el === mid) return;
    if (mid) {
      mid.classList.remove('mid');
      mid.querySelectorAll('a').forEach(function (a) { a.tabIndex = -1; });
      var old = mid.querySelector('.kline'); if (old) { old.classList.remove('sung'); old.style.removeProperty('--k'); }
    }
    mid = el;
    if (!el) return;
    el.classList.add('mid');
    el.querySelectorAll('a').forEach(function (a) { a.tabIndex = 0; });
    if (rail) rail.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.year === el.dataset.year); });
    sing();
  }
  window.addEventListener('scroll', function () { if (!raf && wheel.isConnected) raf = requestAnimationFrame(update); }, { passive: true });
  window.addEventListener('resize', function () { requestAnimationFrame(layout); });
  function goTo(el, smooth) {
    if (!el) return;
    window.scrollTo({ top: Math.max(0, targetOf(el)), behavior: smooth && !still ? 'smooth' : 'auto' });
  }
  // ťuknutí na píseň mimo výběr = dojede na čáru výběru (odkazy v ní fungují až potom)
  // vybraná píseň: klik mimo tlačítka otevře text (jako dřív celý řádek)
  wheel.addEventListener('click', function (e) {
    var el = e.target.closest('.wheel-item');
    if (!el) return;
    if (el === mid) {
      if (!e.target.closest('a')) { var r = el.querySelector('.wbtn-read'); if (r) location.href = r.href; }
      return;
    }
    e.preventDefault();
    goTo(el, true);
  });
  items.forEach(function (el) { el.querySelectorAll('a').forEach(function (a) { a.tabIndex = -1; }); });
  // šipky ↑ ↓ (i PageUp/PageDown, Home/End), Enter otevře text vybrané písně
  wheel.addEventListener('keydown', function (e) {
    var i = shown.indexOf(mid), to = null;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') to = shown[Math.min(shown.length - 1, i + 1)];
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') to = shown[Math.max(0, i - 1)];
    else if (e.key === 'Home') to = shown[0];
    else if (e.key === 'End') to = shown[shown.length - 1];
    else if (e.key === 'Enter' && mid && e.target === wheel) {
      var a = mid.querySelector(mode === 'k' ? '.wbtn-sing' : '.wbtn-read') || mid.querySelector('.wbtn-read');
      if (a) location.href = a.href;
      return;
    }
    if (!to) return;
    e.preventDefault();
    goTo(to, true);
  });

  // ---- karaoke: verš vybrané písně se barví jako při zpěvu (jen ukázka, opravdové časy má kino) ----
  var singT = 0;
  function sing() {
    clearInterval(singT);
    if (mode !== 'k' || !mid || low() || still) return;
    var k = mid.querySelector('.kline');
    if (!k) return;
    k.classList.add('sung');
    var p = 0;
    singT = setInterval(function () {
      if (document.hidden || !k.isConnected) return;
      p = (p + 1.2) % 140;
      k.style.setProperty('--k', Math.min(100, p) + '%');
    }, 50);
  }

  // ---- roky: „Vše“ + nejnovější rok, starší se rozbalí; na PC i boční lišta ----
  function buildYears() {
    var years = [];
    items.forEach(function (c) { var y = c.dataset.year; if (y && (mode === 't' || c.dataset.k) && years.indexOf(y) < 0) years.push(y); });
    years.sort().reverse();
    if (year && years.indexOf(year) < 0) year = '';
    chips.innerHTML = '';
    var all = document.createElement('button');
    all.type = 'button'; all.className = 'chip' + (year ? '' : ' active'); all.dataset.year = ''; all.textContent = chips.dataset.all;
    chips.appendChild(all);
    years.forEach(function (y, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = (i ? 'chip older' : 'chip') + (year === y ? ' active' : ''); b.dataset.year = y; b.textContent = y;
      chips.appendChild(b);
    });
    if (years.length > 1) {
      var t = document.createElement('button');
      t.type = 'button'; t.className = 'chip chip-toggle'; t.setAttribute('aria-expanded', 'false');
      t.innerHTML = '<span></span> <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>';
      t.firstChild.textContent = chips.dataset.older;
      chips.appendChild(t);
    }
    if (rail) {
      rail.innerHTML = '';
      years.forEach(function (y) { var b = document.createElement('button'); b.type = 'button'; b.dataset.year = y; b.textContent = y; b.tabIndex = -1; rail.appendChild(b); });
    }
  }
  chips.addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b) return;
    if (b.classList.contains('chip-toggle')) {
      var open = !chips.classList.contains('open');
      chips.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open));
      return;
    }
    chips.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('active', c === b); });
    chips.classList.remove('open');
    year = b.dataset.year;
    filter(true);
  });
  // boční lišta (PC): skok na první píseň roku, filtr se nemění
  if (rail) rail.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    goTo(shown.filter(function (el) { return el.dataset.year === b.dataset.year; })[0], true);
  });

  // ---- filtr: režim, rok, hledání ----
  function filter(toStart) {
    shown = [];
    items.forEach(function (c) {
      var hit = hits && hits[c.dataset.song];
      var ok = (!hits || !!hit) && (!year || c.dataset.year === year) && (mode === 't' || !!c.dataset.k);
      c.hidden = !ok;
      var line = c.querySelector('.song-line');
      line.hidden = !(hit && hit.line);
      if (hit && hit.line) line.textContent = '„' + hit.line + '“';
      if (ok) shown.push(c);
    });
    none.textContent = hits ? none.dataset.t : (mode === 'k' ? none.dataset.k : none.dataset.t);
    none.hidden = shown.length > 0;
    wrap.hidden = !shown.length;
    setMid(null);
    layout();
    // nový filtr: když je člověk už dole v seznamu, vrátí ho na první píseň (nahoře u nadpisu ho nechá být)
    if (toStart && shown[0] && scrollY > targetOf(shown[0]) + 4) goTo(shown[0], false);
    update();
  }

  // ---- přepínač Texty | Karaoke ----
  function setMode(m, push) {
    mode = m;
    main.classList.toggle('k-mode', m === 'k');
    sw.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === m)); });
    var title = main.querySelector('.page-hero-title'), lead = main.querySelector('.page-hero-lead'), kick = main.querySelector('.hero-kicker');
    var oldTitle = title ? title.textContent : '';
    if (title) title.textContent = sw.dataset[m + 'Title'];
    if (lead) lead.textContent = sw.dataset[m + 'Lead'];
    if (kick && kick.lastChild && kick.lastChild.nodeType === 3) kick.lastChild.textContent = sw.dataset[m + 'Kicker'];
    if (oldTitle && document.title.indexOf(oldTitle) >= 0) document.title = document.title.replace(oldTitle, sw.dataset[m + 'Title']);
    if (push) {
      var u = new URL(location.href);
      if (m === 'k') u.searchParams.set('karaoke', '1'); else u.searchParams.delete('karaoke');
      history.replaceState(history.state, '', u.pathname + u.search + u.hash);
      if (window.updateActiveNav) window.updateActiveNav();   // v menu se rozsvítí Texty, nebo Karaoke
    }
    buildYears();
    filter(true);
  }
  if (sw) sw.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]');
    if (b && b.dataset.mode !== mode) setMode(b.dataset.mode, true);
  });

  // ---- hledání podle názvu i slova z textu ----
  if (input) input.addEventListener('input', function () {
    clearTimeout(timer);
    var q = input.value.trim();
    if (q.length < 2) { hits = null; asked = ''; return filter(true); }
    timer = setTimeout(function () {
      asked = q;
      fetch('/api/search?q=' + encodeURIComponent(q))
        .then(function (r) { return r.ok ? r.json() : []; })
        .catch(function () { return []; })
        .then(function (list) {
          if (asked !== q) return;   // starší odpověď, která přišla pozdě
          hits = {};
          list.forEach(function (s) { hits[s.id] = s; });
          filter(true);
          // Kevin řekne slovo, až návštěvník na chvíli přestane psát
          clearTimeout(kevinTimer);
          kevinTimer = setTimeout(function () {
            if (asked !== q) return;
            window.dispatchEvent(new CustomEvent('kevin', { detail: { search: list.length ? 'found' : 'none' } }));
            // do statistik (co lidi hledají), až když dopíše – ne každé písmeno
            window.dispatchEvent(new CustomEvent('skeli:search', { detail: { q: q, found: list.length > 0 } }));
          }, 1500);
        });
    }, 220);
  });

  setMode(mode, false);
  // písma a náhledy můžou změnit výšku: přepočítat, až je všechno načtené
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  window.addEventListener('load', layout);
})();
