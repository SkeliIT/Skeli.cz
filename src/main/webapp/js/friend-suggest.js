// Našeptávač v hledání přátel: po dvou písmenech ukáže lidi s fotkou a tlačítkem Přidat. Bez JavaScriptu funguje obyčejné hledání.
// Skript je uvnitř <main>, takže běží i po přechodu přes PJAX. Jména kreslí jen jako text.
(function () {
  var form = document.querySelector('.friend-search[data-suggest]');
  if (!form || form.dataset.ready) return;
  form.dataset.ready = '1';
  var input = form.querySelector('input[name=fq]'), list = form.querySelector('.friend-suggest'), status = form.querySelector('.friend-suggest-status');
  var T = form.dataset, timer = null, lastQuery = '', active = -1, asked = 0;

  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', list.id);
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('autocomplete', 'off');

  function close() {
    list.hidden = true;
    list.textContent = '';
    active = -1;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }
  function profileUrl(p) { return '/hrac/' + encodeURIComponent(p.name); }

  function add(p, cell) {
    var button = cell.querySelector('button');
    button.disabled = true;
    var body = new URLSearchParams({ action: p.rel === 'RECEIVED' ? 'accept' : 'request', name: p.name, back: '/uzivatel.jsp' });
    fetch('/profile/friends', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-Token': T.csrf }, body: body.toString()
    }).then(function (r) {
      var result = (/[?&]friend=([a-z]+)/.exec(r.url) || [])[1] || 'ok';
      if (result === 'ok') {
        cell.textContent = p.rel === 'RECEIVED' ? T.tFriends : T.tSent;
        if (p.rel !== 'RECEIVED') window.dispatchEvent(new CustomEvent('kevin', { detail: { friend: 'sent' } }));
      } else {
        button.disabled = false;
        status.textContent = T['t' + result[0].toUpperCase() + result.slice(1)] || T.tFail;
        status.hidden = false;
      }
    }).catch(function () { button.disabled = false; status.textContent = T.tFail; status.hidden = false; });
  }

  function row(p, i) {
    var li = document.createElement('li');
    li.className = 'friend-suggest-row';
    li.id = list.id + '-' + i;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    var who = document.createElement(p.pub ? 'a' : 'span');
    who.className = 'friend-suggest-who';
    if (p.pub) who.href = profileUrl(p);
    var img = document.createElement('img');
    img.src = p.avatar;
    img.alt = '';
    img.width = img.height = 36;
    img.referrerPolicy = 'no-referrer';
    var name = document.createElement('span');
    name.textContent = p.name;
    who.appendChild(img);
    who.appendChild(name);
    li.appendChild(who);
    var cell = document.createElement('span');
    cell.className = 'friend-suggest-act';
    if (p.rel === 'NONE' || p.rel === 'RECEIVED') {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn-primary friend-btn';
      b.textContent = p.rel === 'RECEIVED' ? T.tAccept : T.tAdd;
      b.addEventListener('click', function (e) { e.stopPropagation(); add(p, cell); });
      cell.appendChild(b);
    } else {
      cell.textContent = p.rel === 'FRIENDS' ? T.tFriends : p.rel === 'SENT' ? T.tSent : '';
    }
    li.appendChild(cell);
    return li;
  }

  function ask(q) {
    var mine = ++asked;
    fetch('/api/people?q=' + encodeURIComponent(q), { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : []; }).then(function (people) {
      if (mine !== asked || input.value.trim() !== q) return;
      list.textContent = '';
      active = -1;
      status.hidden = true;
      if (!people.length) {
        var none = document.createElement('li');
        none.className = 'friend-suggest-none';
        none.textContent = T.tNone;
        list.appendChild(none);
      } else {
        people.forEach(function (p, i) { list.appendChild(row(p, i)); });
      }
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }).catch(function () { /* obyčejné hledání funguje dál */ });
  }

  input.addEventListener('input', function () {
    var q = input.value.trim();
    clearTimeout(timer);
    if (q.length < 2) { lastQuery = ''; close(); return; }
    if (q === lastQuery) return;
    lastQuery = q;
    timer = setTimeout(function () { ask(q); }, 200);
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { close(); return; }
    var rows = list.querySelectorAll('.friend-suggest-row');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!rows.length) return;
      e.preventDefault();
      if (active >= 0) rows[active].setAttribute('aria-selected', 'false');
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length;
      rows[active].setAttribute('aria-selected', 'true');
      rows[active].scrollIntoView({ block: 'nearest' });
      input.setAttribute('aria-activedescendant', rows[active].id);
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      var link = rows[active].querySelector('a.friend-suggest-who'), button = rows[active].querySelector('button');
      if (link) location.href = link.href; else if (button) button.click();
    }
  });
  document.addEventListener('click', function (e) { if (!form.contains(e.target)) close(); });
})();
