/* The bell in the header (signed-in visitors): someone answered your comment, or Skeli gave it a heart.
   The count comes from /api/notifications?count=1 on every visit and every 90 s while the tab is
   visible; opening the panel loads the list and marks everything as read. The header stays across
   PJAX page swaps, so this runs once per visit. */
(function () {
  var panel = document.getElementById('notifPanel');
  if (!panel || panel.dataset.ready) return;
  panel.dataset.ready = '1';
  var list = panel.querySelector('.notif-list');
  var empty = list.innerHTML;
  var lang = document.documentElement.lang || 'cs';
  var rtf = window.Intl && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }) : null;
  var UNITS = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];

  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function ago(ms) {
    var s = (ms - Date.now()) / 1000, a = Math.abs(s);
    if (!rtf) return new Date(ms).toLocaleDateString(lang);
    for (var i = 0; i < UNITS.length; i++) if (a >= UNITS[i][1]) return rtf.format(Math.round(s / UNITS[i][1]), UNITS[i][0]);
    return rtf.format(0, 'second');
  }

  function paint(unread) {
    document.querySelectorAll('.notif-badge').forEach(function (b) {
      b.textContent = unread > 9 ? '9+' : String(unread);
      b.hidden = !unread;
    });
    var toggle = document.getElementById('menuToggle');
    if (toggle) toggle.classList.toggle('has-unread', unread > 0);
    document.querySelectorAll('.notif-btn').forEach(function (b) {
      var i = b.querySelector('i');
      if (i) i.className = (unread ? 'fa-solid' : 'fa-regular') + ' fa-bell';
    });
  }

  function count() {
    if (document.hidden) return;
    fetch('/api/notifications?count=1', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) paint(d.unread); })
      .catch(function () {});
  }

  function render(items) {
    if (!items.length) { list.innerHTML = empty; return; }
    list.innerHTML = items.map(function (n) {
      var who = n.actor == null ? panel.dataset.tDeleted : n.actor;
      var text = n.type === 'heart' ? panel.dataset.tHeart : (panel.dataset.tReply || '').replace('{name}', who);
      var where = (n.place === 'clip' ? panel.dataset.tClip : panel.dataset.tSong).replace('{0}', n.placeName || '');
      var pic = n.type === 'heart' ? '<span class="notif-icon heart"><i class="fa-solid fa-heart"></i></span>'
        : n.actorAvatar ? '<img class="notif-icon" src="' + esc(n.actorAvatar) + '" alt="">'
        : '<span class="notif-icon"><i class="fa-solid fa-reply"></i></span>';
      return '<a class="notif-item' + (n.read ? '' : ' unread') + '" href="' + esc(n.link) + '">' + pic
        + '<span class="notif-body"><span class="notif-text">' + esc(text) + '</span>'
        + '<span class="notif-snippet">„' + esc(n.snippet) + '“</span>'
        + '<span class="notif-meta">' + esc(where) + ' · ' + esc(ago(n.created)) + '</span></span></a>';
    }).join('');
  }

  function open() {
    panel.hidden = false;
    document.querySelectorAll('[data-notif-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    fetch('/api/notifications', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) return;
        render(d.items || []);
        if (d.unread) {
          fetch('/api/notifications', { method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-Token': panel.dataset.csrf || '' },
            body: 'action=read' }).then(function () { paint(0); }).catch(function () {});
        }
      })
      .catch(function () {});
    var first = panel.querySelector('.notif-close');
    if (first) first.focus({ preventScroll: true });
  }
  function close() {
    if (panel.hidden) return;
    panel.hidden = true;
    document.querySelectorAll('[data-notif-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
  }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-notif-open]');
    if (opener) { e.preventDefault(); if (panel.hidden) open(); else close(); return; }
    if (e.target.closest('[data-notif-close]')) { close(); return; }
    // a click on a line goes to the comment; anywhere outside the panel closes it
    if (e.target.closest('.notif-item')) { close(); return; }
    if (!panel.hidden && !panel.contains(e.target)) close();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  count();
  setInterval(count, 90000);
  document.addEventListener('visibilitychange', count);
})();
