// Tabulka rekordů CatSmash na webu (includes/pong-board.jspf): okno s cedulí, kterou drží Kevin. Hra se kvůli tomu
// nenačítá – data jsou z /api/pong/top (stejná jako ve hře). Volby (Skóre/Čas, Navždy/měsíc) sdílí s hrou přes
// localStorage kevinPongBoardKind a kevinPongSeason. Tlačítko „Hrát a překonat to“ otevře hru (data-play-game, js/kevin.js).
(function () {
  if (window.__pongBoard) return;                       // (stránky se mění přes PJAX – posluchač stačí jednou)
  window.__pongBoard = true;
  var box = null, seq = 0, last = null;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function safe(u) { return /^(\/[^/]|https:\/\/)/.test(u || '') ? u : '/img/avatar-default.svg'; }
  var st = { kind: store('kevinPongBoardKind') === 'time' ? 'time' : 'score', season: store('kevinPongSeason') === 'month' ? 'month' : 'all', len: 10, d: 2 };

  function open() {
    var tpl = document.getElementById('pongBoardTpl');
    if (!tpl || box) return;
    var T = tpl.dataset;
    box = tpl.content.firstElementChild.cloneNode(true);
    box.T = T;
    document.body.appendChild(box);
    document.documentElement.classList.add('pb-open');
    last = document.activeElement;
    var levels = (T.levels || '').split('|');
    box.querySelectorAll('[data-g="d"] button').forEach(function (b, i) { b.querySelector('span').textContent = levels[i] || ''; b.setAttribute('aria-label', levels[i] || ''); });
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.closest('[data-pb-close]')) { close(); return; }
      var prof = e.target.closest('a.pb-prof');                   // profil hráče: celá nová stránka (okno je mimo <main>)
      if (prof) { e.preventDefault(); location.href = prof.href; return; }
      var b = e.target.closest('[role="radio"]'), g = b && b.closest('[data-g]');
      if (!g) return;
      var key = g.dataset.g, v = b.dataset.v;
      st[key] = key === 'len' || key === 'd' ? +v : v;
      if (key === 'kind') store('kevinPongBoardKind', v);
      if (key === 'season') store('kevinPongSeason', v);
      sync(); load();
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') {                               // fokus zůstává v okně
        var f = [].filter.call(box.querySelectorAll('button, a[href]'), function (x) { return x.offsetParent; });
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    sync(); load();
    box.querySelector('.pb-x').focus({ preventScroll: true });
  }
  function close() {
    if (!box) return;
    box.remove(); box = null; seq++;
    document.documentElement.classList.remove('pb-open');
    if (last && last.focus) last.focus({ preventScroll: true });
  }
  // přepínače podle stavu, Kevin nahoře podle obtížnosti (dudlík / normální / vzteklý)
  function sync() {
    box.querySelectorAll('[data-g]').forEach(function (g) {
      g.querySelectorAll('[role="radio"]').forEach(function (b) { b.setAttribute('aria-checked', String(String(st[g.dataset.g]) === b.dataset.v)); });
    });
    box.querySelector('.pb-kevin').src = '/kevin/pong/menu/kevin-' + st.d + '.webp';
    var T = box.T, levels = (T.levels || '').split('|'), season = box.querySelector('[data-g="season"] [aria-checked="true"]');
    box.querySelector('.pb-sub').textContent = [(box.querySelector('[data-g="kind"] [aria-checked="true"]') || {}).textContent, season && season.textContent,
      (T.goals || '{n}').replace('{n}', st.len), '★★★'.slice(0, st.d) + ' ' + (levels[st.d - 1] || '')].map(function (s) { return (s || '').trim(); }).join(' · ');
  }
  function num(n) { try { return Number(n).toLocaleString(box.T.lang || 'cs'); } catch (e) { return String(n); } }
  function time(ms) { var s = ms / 1000, m = Math.floor(s / 60); return m + ':' + (s - m * 60).toFixed(1).padStart(4, '0'); }
  function load() {
    var my = ++seq, list = box.querySelector('.pb-list'), T = box.T;
    list.setAttribute('aria-busy', 'true');
    var q = st.kind === 'time' ? '?kind=time&d=' + st.d + '&len=' + st.len : '?len=' + st.len + '&d=' + st.d;
    fetch('/api/pong/top' + q + (st.season === 'month' ? '&season=month' : ''), { credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw r; return r.json(); })
      .then(function (j) {
        if (my !== seq || !box) return;
        var top = j.top || [];
        list.removeAttribute('aria-busy');
        list.innerHTML = top.length ? top.map(function (r) {
          var val = st.kind === 'time' ? time(r.ms) : (T.points || '{n}').replace('{n}', num(r.score)), av = '<img src="' + esc(safe(r.avatar)) + '" alt="" width="30" height="30" loading="lazy">';
          return '<li class="' + (r.place <= 3 ? 'p' + r.place : '') + (r.me ? ' me' : '') + '"><span class="pb-pl">' + r.place + '.</span>' +
            (r.frame ? '<span class="av-frame f-' + esc(r.frame) + '">' + av + '</span>' : av) +
            '<span class="pb-nm">' + (r.pub ? '<a class="pb-prof" href="/hrac/' + encodeURIComponent(r.name) + '">' + esc(r.name) + '</a>' : esc(r.name)) + '<small>' + (st.kind === 'time' ? st.len : r.you) + ':' + r.kevin + '</small></span><span class="pb-val">' + esc(val) + '</span></li>';
        }).join('') : '<li class="pb-empty">' + esc(T.empty) + '</li>';
        // moje místo (mimo první desítku) a kolik chybí na 3. místo
        var mine = box.querySelector('.pb-mine'), txt = '';
        if (j.me && !top.some(function (r) { return r.me; })) {
          txt = (T.mine || '').replace('{place}', j.me.place);
          if (top.length >= 3) {
            var need = st.kind === 'time' ? time(Math.max(100, j.me.ms - top[2].ms + 100)) : (T.points || '{n}').replace('{n}', num(Math.max(1, top[2].score - j.me.score + 1)));
            txt += ' ' + (T.need || '').replace('{n}', need);
          }
        }
        mine.textContent = txt; mine.hidden = !txt;
        box.querySelector('.pb-guest').hidden = !!j.signedIn;
      })
      .catch(function () { if (my === seq && box) { list.removeAttribute('aria-busy'); list.innerHTML = '<li class="pb-empty">' + esc(T.error) + '</li>'; } });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-pong-board]');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || !document.getElementById('pongBoardTpl')) return;
    e.preventDefault();
    open();
  });
})();
