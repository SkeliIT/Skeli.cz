// Chat mezi přáteli (/zpravy). Skript je uvnitř <main>, takže běží i po přechodu přes PJAX.
// Otevřený chat se každé 4 s ptá na nové zprávy (jen když je stránka vidět). Zprávy se kreslí jen jako text, odkazy nejsou klikatelné.
(function () {
  if (window.__chatTimer) { clearInterval(window.__chatTimer); window.__chatTimer = null; }
  var room = document.querySelector('.chat-room[data-with]');
  if (!room) return;
  var name = room.dataset.with, csrf = room.dataset.csrf;
  var list = room.querySelector('.chat-msgs'), form = room.querySelector('.chat-form'), input = form.querySelector('textarea');
  var closed = room.querySelector('.chat-closed'), errorBox = room.querySelector('.chat-error'), older = room.querySelector('.chat-older');
  var lastId = 0, firstId = 0, busy = false;
  var timeFmt = new Intl.DateTimeFormat(document.documentElement.lang || undefined, { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });

  function post(params) {
    return fetch('/api/chat', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-Token': csrf },
      body: new URLSearchParams(params).toString()
    });
  }
  function nearBottom() { return list.scrollHeight - list.scrollTop - list.clientHeight < 90; }
  function toBottom() { list.scrollTop = list.scrollHeight; }
  function showError(text) { errorBox.textContent = text; errorBox.hidden = !text; }

  function iconButton(cls, icon, label) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chat-act ' + cls;
    b.title = label;
    b.setAttribute('aria-label', label);
    var i = document.createElement('i');
    i.className = 'fa-solid ' + icon;
    i.setAttribute('aria-hidden', 'true');
    b.appendChild(i);
    return b;
  }
  function markDeleted(li) {
    li.classList.add('deleted');
    li.querySelector('.chat-text').textContent = room.dataset.tDeleted;
    li.querySelectorAll('.chat-act').forEach(function (b) { b.remove(); });
  }
  function bubble(m) {
    var li = document.createElement('li');
    li.className = 'chat-msg' + (m.mine ? ' mine' : '');
    li.dataset.id = m.id;
    var text = document.createElement('span');
    text.className = 'chat-text';
    text.textContent = m.body;             // jen text: žádné HTML od uživatele
    var meta = document.createElement('span');
    meta.className = 'chat-meta';
    var when = document.createElement('time');
    when.textContent = timeFmt.format(new Date(m.at));
    meta.appendChild(when);
    li.appendChild(text);
    li.appendChild(meta);
    if (m.mine) meta.appendChild(iconButton('chat-del', 'fa-trash', room.dataset.tDelete));
    else meta.appendChild(iconButton('chat-rep', 'fa-flag', room.dataset.tReport));
    if (m.deleted) markDeleted(li);
    return li;
  }

  function load(query) {
    return fetch('/api/chat?with=' + encodeURIComponent(name) + query, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; });
  }
  function apply(data) {
    if (!data) return;
    var stick = nearBottom() || !lastId;
    data.items.forEach(function (m) {
      if (list.querySelector('[data-id="' + m.id + '"]')) return;
      list.appendChild(bubble(m));
      lastId = Math.max(lastId, m.id);
      if (!firstId) firstId = m.id;
    });
    (data.deleted || []).forEach(function (id) {
      var li = list.querySelector('[data-id="' + id + '"]');
      if (li && !li.classList.contains('deleted')) markDeleted(li);
    });
    form.hidden = !data.canSend;
    closed.hidden = data.canSend;
    if (stick) toBottom();
  }
  function poll() {
    if (!document.body.contains(room)) { clearInterval(window.__chatTimer); window.__chatTimer = null; return; }
    if (document.hidden || busy) return;
    load('&after=' + lastId).then(apply).catch(function () { /* příště */ });
  }

  load('&after=0').then(function (data) {
    apply(data);
    older.hidden = !data || data.items.length < 50;
  }).catch(function () { /* příště */ });
  window.__chatTimer = setInterval(poll, 4000);

  older.addEventListener('click', function () {
    load('&before=' + firstId).then(function (data) {
      if (!data) return;
      var height = list.scrollHeight;
      data.items.slice().reverse().forEach(function (m) { list.insertBefore(bubble(m), list.firstChild); firstId = m.id; });
      list.scrollTop = list.scrollHeight - height;
      older.hidden = data.items.length < 50;
    });
  });

  function send() {
    var body = input.value.trim();
    if (!body || busy) return;
    busy = true;
    showError('');
    post({ action: 'send', with: name, body: body }).then(function (r) {
      if (r.status === 429) showError(room.dataset.tLimit);
      else if (r.status === 403) { form.hidden = true; closed.hidden = false; }
      else if (!r.ok) showError(room.dataset.tFail);
      else { input.value = ''; autosize(); }
    }).catch(function () { showError(room.dataset.tFail); }).then(function () {
      busy = false;
      load('&after=' + lastId).then(function (data) { apply(data); toBottom(); });
    });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); send(); });
  // na počítači Enter posílá (Shift+Enter = nový řádek); na telefonu je Enter nový řádek a posílá se tlačítkem
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !matchMedia('(pointer: coarse)').matches) { e.preventDefault(); send(); }
  });
  function autosize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 130) + 'px';
  }
  input.addEventListener('input', autosize);

  list.addEventListener('click', function (e) {
    var del = e.target.closest('.chat-del'), rep = e.target.closest('.chat-rep');
    if (del) {
      if (!confirm(room.dataset.tDeleteConfirm)) return;
      var li = del.closest('.chat-msg');
      post({ action: 'delete', id: li.dataset.id }).then(function (r) { if (r.ok) markDeleted(li); });
    } else if (rep) {
      var msg = rep.closest('.chat-msg');
      if (msg.querySelector('.chat-report-form')) return;
      var box = room.querySelector('.chat-report-tpl').content.cloneNode(true);
      msg.appendChild(box);
      msg.querySelector('.chat-report-form').addEventListener('submit', function (ev) {
        ev.preventDefault();
        var f = ev.target;
        post({ action: 'report', id: msg.dataset.id, reason: f.reason.value, note: f.note.value }).then(function (r) {
          var note = document.createElement('p');
          note.className = 'chat-reported';
          note.textContent = r.ok ? room.dataset.tReported : (r.status === 429 ? room.dataset.tLimit : room.dataset.tFail);
          f.replaceWith(note);
        });
      });
    }
  });

  room.querySelector('.chat-hide').addEventListener('click', function () {
    if (!confirm(room.dataset.tHideConfirm)) return;
    post({ action: 'hide', with: name }).then(function () { location.href = '/zpravy'; });
  });
})();
