// Přemístitelné widgety na stránce Statistiky v adminu (WEB-INF/views/admin/stats.jsp).
// „Upravit rozložení“: widget se přetáhne za úchyt (myš i prst), nebo posune šipkami; šířka S/M/L/XL
// (4/6/8/12 sloupců ze 12), schovat a vrátit. Rozložení si pamatuje prohlížeč (localStorage adminStatsLayout),
// je jen pro pohodlí – bez něj se ukáže výchozí. Na telefonu jsou všechny widgety přes celou šířku, platí jen pořadí.
(function () {
  var grid = document.querySelector('[data-widgets]');
  if (!grid || grid.dataset.ready) return;
  grid.dataset.ready = '1';
  var KEY = 'adminStatsLayout', SIZES = ['s', 'm', 'l', 'xl'], SIZE_NAME = { s: 'úzký', m: 'poloviční', l: 'široký', xl: 'celá šířka' };
  var bar = document.querySelector('.st-editbar'), hiddenList = document.querySelector('.st-hidden-list');
  var defaults = [].map.call(grid.querySelectorAll('.w'), function (w) { return { id: w.dataset.w, size: w.dataset.size }; });
  function widgets() { return [].slice.call(grid.querySelectorAll('.w')); }
  function byId(id) { return grid.querySelector('.w[data-w="' + id + '"]'); }

  function load() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { s = null; }
    if (!s || !Array.isArray(s.order)) return;
    s.order.forEach(function (id) { var w = byId(id); if (w) grid.appendChild(w); });   // neznámé (nové) widgety zůstanou na konci
    Object.keys(s.size || {}).forEach(function (id) { var w = byId(id); if (w && SIZES.indexOf(s.size[id]) >= 0) w.dataset.size = s.size[id]; });
    (s.hidden || []).forEach(function (id) { var w = byId(id); if (w) w.hidden = true; });
  }
  function save() {
    var s = { order: [], size: {}, hidden: [] };
    widgets().forEach(function (w) { s.order.push(w.dataset.w); s.size[w.dataset.w] = w.dataset.size; if (w.hidden) s.hidden.push(w.dataset.w); });
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* bez úložiště jen do zavření stránky */ }
  }

  // nástroje widgetu v režimu úprav
  function tools(w) {
    var t = document.createElement('div');
    t.className = 'w-tools';
    t.innerHTML = '<button type="button" class="w-grip" title="Přetáhni" aria-label="Přetáhnout"><i class="fa-solid fa-grip-vertical" aria-hidden="true"></i></button>' +
      '<button type="button" data-a="up" title="O místo dřív" aria-label="O místo dřív"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i></button>' +
      '<button type="button" data-a="down" title="O místo dál" aria-label="O místo dál"><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>' +
      '<button type="button" data-a="size" title="Změnit šířku" aria-label="Změnit šířku"><i class="fa-solid fa-left-right" aria-hidden="true"></i> <span></span></button>' +
      '<button type="button" data-a="hide" title="Schovat" aria-label="Schovat"><i class="fa-solid fa-eye-slash" aria-hidden="true"></i></button>';
    t.querySelector('[data-a="size"] span').textContent = SIZE_NAME[w.dataset.size] || '';
    w.prepend(t);
  }
  function refreshHidden() {
    var hid = widgets().filter(function (w) { return w.hidden; });
    hiddenList.innerHTML = hid.length ? '<span>Schované:</span> ' + hid.map(function (w) {
      return '<button type="button" class="kp-fullbtn" data-show="' + w.dataset.w + '"><i class="fa-solid fa-plus" aria-hidden="true"></i> ' + w.dataset.title + '</button>';
    }).join(' ') : '';
  }
  function setEdit(on) {
    document.body.classList.toggle('st-editing', on);
    bar.hidden = !on;
    document.querySelectorAll('[data-edit-layout]').forEach(function (b) { b.setAttribute('aria-pressed', String(on)); });
    widgets().forEach(function (w) { var t = w.querySelector('.w-tools'); if (t) t.remove(); if (on) tools(w); });
    if (on) refreshHidden(); else save();
  }

  grid.addEventListener('click', function (e) {
    var b = e.target.closest('.w-tools button[data-a]');
    if (!b) return;
    var w = b.closest('.w'), a = b.dataset.a;
    if (a === 'up' && w.previousElementSibling) grid.insertBefore(w, w.previousElementSibling);
    else if (a === 'down' && w.nextElementSibling) grid.insertBefore(w.nextElementSibling, w);
    else if (a === 'size') { w.dataset.size = SIZES[(SIZES.indexOf(w.dataset.size) + 1) % SIZES.length]; b.querySelector('span').textContent = SIZE_NAME[w.dataset.size]; }
    else if (a === 'hide') { w.hidden = true; refreshHidden(); }
    save();
  });
  hiddenList.addEventListener('click', function (e) {
    var b = e.target.closest('[data-show]');
    if (!b) return;
    byId(b.dataset.show).hidden = false; refreshHidden(); save();
  });
  document.querySelectorAll('[data-edit-layout]').forEach(function (b) {
    b.addEventListener('click', function () { setEdit(!document.body.classList.contains('st-editing')); });
  });
  document.querySelector('[data-layout-reset]').addEventListener('click', function () {
    try { localStorage.removeItem(KEY); } catch (e) { /* nevadí */ }
    defaults.forEach(function (x) { var w = byId(x.id); w.dataset.size = x.size; w.hidden = false; grid.appendChild(w); });
    setEdit(true);
  });

  // přetahování za úchyt: widget jde za prstem/myší, ostatní uhýbají podle toho, nad kterým je
  grid.addEventListener('pointerdown', function (e) {
    var g = e.target.closest('.w-grip');
    if (!g) return;
    e.preventDefault();
    var w = g.closest('.w'), id = e.pointerId;
    w.classList.add('dragging');
    try { g.setPointerCapture(id); } catch (x) { /* nevadí */ }
    function move(ev) {
      if (ev.pointerId !== id) return;
      var el = document.elementFromPoint(ev.clientX, ev.clientY), over = el && el.closest('.w');
      if (!over || over === w || over.parentNode !== grid) return;
      var r = over.getBoundingClientRect();
      var after = (r.width > innerWidth * 0.7) ? ev.clientY > r.top + r.height / 2 : ev.clientX > r.left + r.width / 2;
      grid.insertBefore(w, after ? over.nextSibling : over);
    }
    function up(ev) {
      if (ev.pointerId !== id) return;
      w.classList.remove('dragging');
      g.removeEventListener('pointermove', move); g.removeEventListener('pointerup', up); g.removeEventListener('pointercancel', up);
      save();
    }
    g.addEventListener('pointermove', move); g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
  });

  load();
})();
