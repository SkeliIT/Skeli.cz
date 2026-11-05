// Chat mezi přáteli (/zpravy). Skript je uvnitř <main>, takže běží i po přechodu přes PJAX.
// Otevřený chat se každé 4 s ptá na posledních 30 zpráv (jen když je stránka vidět): nové přidá, u známých srovná text, reakce a smazání.
// Zprávy se kreslí jen jako text, odkazy nejsou klikatelné.
(function () {
  if (window.__chatTimer) { clearInterval(window.__chatTimer); window.__chatTimer = null; }

  // nastavení (kolečko): stav, barvy, písmo a velikost; platí hned a hned se uloží
  var page = document.querySelector('.chat-page'), dialog = page && page.querySelector('.chat-settings');
  if (dialog) {
    page.querySelectorAll('.chat-gear').forEach(function (b) { b.addEventListener('click', function () { dialog.showModal(); }); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });   // klik mimo okno ho zavře
    // záložky Stav, Vzhled, Zvuky; šipky přepínají jako u každých záložek
    var tabs = Array.prototype.slice.call(dialog.querySelectorAll('.chat-tabs [role=tab]'));
    function showTab(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        dialog.querySelector('[data-panel="' + t.dataset.tab + '"]').hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { showTab(tab); });
      tab.addEventListener('keydown', function (e) {
        var step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        showTab(tabs[(i + step + tabs.length) % tabs.length], true);
      });
    });
    dialog.addEventListener('change', function (e) {
      var name = e.target.name, value = e.target.value;
      if (!name) return;   // zvuky si hlídá js/sounds.js
      if (name === 'theme') page.dataset.chatTheme = value;
      if (name === 'font') page.dataset.chatFont = value;
      if (name === 'size') page.dataset.chatSize = value;
      var body = { action: 'prefs', receipts: dialog.querySelector('input[name=receipts]').checked ? '1' : '0' };
      ['status', 'theme', 'font', 'size'].forEach(function (k) { body[k] = dialog.querySelector('input[name=' + k + ']:checked').value; });
      fetch('/api/chat', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-Token': page.dataset.csrf },
        body: new URLSearchParams(body).toString()
      }).catch(function () { /* platí aspoň do znovunačtení */ });
    });
  }

  var room = document.querySelector('.chat-room[data-with]');
  if (!room) return;
  var name = room.dataset.with, csrf = room.dataset.csrf, T = room.dataset;
  var list = room.querySelector('.chat-msgs'), form = room.querySelector('.chat-form'), input = form.querySelector('textarea');
  var closed = room.querySelector('.chat-closed'), errorBox = room.querySelector('.chat-error'), older = room.querySelector('.chat-older');
  var bar = room.querySelector('.chat-compose-bar'), barText = bar.querySelector('span'), muteBtn = room.querySelector('.chat-mute');
  var lang = document.documentElement.lang || undefined;
  var EDIT_WINDOW = 15 * 60000, REACTIONS = ['❤️', '😂', '👍', '🔥', '😮', '😢'];
  var firstId = 0, busy = false, replyTo = 0, editId = 0, muted = false, loaded = false;
  var timeFmt = new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit' });
  var dayFmt = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric' });
  var relFmt = Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }) : null;

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
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;     // jen text: žádné HTML od uživatele
    return n;
  }
  function iconButton(cls, icon, label) {
    var b = el('button', 'chat-act ' + cls);
    b.type = 'button';
    b.title = label;
    b.setAttribute('aria-label', label);
    var i = el('i', 'fa-solid ' + icon);
    i.setAttribute('aria-hidden', 'true');
    b.appendChild(i);
    return b;
  }

  // Karta u známého odkazu (server poslal jen ověřenou část odkazu, service/MusicLinks).
  // Přehrávač se načte až po kliknutí: do té doby cizí služba o nikom neví. Náhled videa jde přes náš server (/yt-thumb/).
  var EMBEDS = {
    youtube: { label: 'YouTube', icon: 'fab fa-youtube', height: 0,
      open: function (id) { return 'https://www.youtube.com/watch?v=' + id; },
      player: function (id) { return 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0'; } },
    spotify: { label: 'Spotify', icon: 'fab fa-spotify', height: 152,
      open: function (id) { return 'https://open.spotify.com/' + id; },
      player: function (id) { return 'https://open.spotify.com/embed/' + id; } },
    apple: { label: 'Apple Music', icon: 'fab fa-apple', height: 175,
      open: function (id) { return 'https://music.apple.com/' + id; },
      player: function (id) { return 'https://embed.music.apple.com/' + id; } },
    soundcloud: { label: 'SoundCloud', icon: 'fab fa-soundcloud', height: 166,
      open: function (id) { return 'https://soundcloud.com/' + id; },
      player: function (id) { return 'https://w.soundcloud.com/player/?auto_play=true&url=' + encodeURIComponent('https://soundcloud.com/' + id); } }
  };
  function embedCard(m) {
    var kind = EMBEDS[m.embedKind], box = el('div', 'chat-embed');
    box.dataset.key = m.embedKind + ':' + m.embedId;
    if (!kind) return box;
    var play = el('button', 'chat-embed-play');
    play.type = 'button';
    play.setAttribute('aria-label', T.tPlay + ': ' + kind.label);
    if (m.embedKind === 'youtube') {
      var img = el('img');
      img.src = '/yt-thumb/' + encodeURIComponent(m.embedId) + '/mqdefault.jpg';
      img.alt = '';
      img.loading = 'lazy';
      play.appendChild(img);
    }
    var icon = el('span', 'chat-embed-icon'), mark = el('i', m.embedKind === 'youtube' ? 'fa-solid fa-play' : kind.icon);
    mark.setAttribute('aria-hidden', 'true');
    icon.appendChild(mark);
    play.appendChild(icon);
    play.addEventListener('click', function () {
      var frame = el('iframe');
      frame.src = kind.player(m.embedId);
      frame.title = kind.label;
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      if (kind.height) frame.height = kind.height; else frame.style.aspectRatio = '16 / 9';
      play.replaceWith(frame);
    });
    var open = el('a', 'chat-embed-open', T.tOpen + ' ' + kind.label);
    open.href = kind.open(m.embedId);
    open.target = '_blank';
    open.rel = 'noopener nofollow ugc';
    box.appendChild(play);
    box.appendChild(open);
    return box;
  }

  // jen 1 až 3 smajlíky: velké a bez bubliny
  function emojiOnly(text) {
    if (!text) return false;
    var found = text.match(/\p{Extended_Pictographic}/gu);
    if (!found || found.length > 3) return false;
    return text.replace(/[\p{Extended_Pictographic}\p{Emoji_Modifier}‍️\s]/gu, '') === '';
  }

  function paintReactions(li, m) {
    var box = li.querySelector('.chat-reactions');
    box.textContent = '';
    (m.reactions || []).forEach(function (r) {
      var b = el('button', 'chat-reaction' + (r.mine ? ' mine' : ''), r.e + (r.n > 1 ? ' ' + r.n : ''));
      b.type = 'button';
      b.dataset.emoji = r.e;
      box.appendChild(b);
    });
    box.hidden = !m.reactions || !m.reactions.length;
  }

  // změny u zprávy, která už na stránce je; přehrávač v kartě zůstává hrát, pokud se odkaz nezměnil
  function paint(li, m) {
    li._m = m;
    li.classList.toggle('deleted', m.deleted);
    li.classList.toggle('emoji-only', !m.deleted && emojiOnly(m.body));
    li.querySelector('.chat-text').textContent = m.deleted ? T.tDeleted : m.body;
    var quote = li.querySelector('.chat-quote');
    quote.hidden = !m.replyTo;
    if (m.replyTo) {
      quote.dataset.to = m.replyTo;
      quote.textContent = m.replyBody || T.tDeleted;
    }
    var card = li.querySelector('.chat-embed'), key = m.embedKind && !m.deleted ? m.embedKind + ':' + m.embedId : '';
    if (card && card.dataset.key !== key) { card.remove(); card = null; }
    if (key && !card) li.querySelector('.chat-text').after(embedCard(m));
    li.querySelector('.chat-edited').hidden = !m.edited || m.deleted;
    li.querySelector('.chat-more').hidden = m.deleted;
    if (m.deleted) li.querySelector('.chat-actions').hidden = true;
    paintReactions(li, m);
  }

  function bubble(m) {
    var li = el('li', 'chat-msg' + (m.mine ? ' mine' : ''));
    li.dataset.id = m.id;
    li.dataset.at = m.at;
    var quote = el('button', 'chat-quote');
    quote.type = 'button';
    var meta = el('span', 'chat-meta');
    var edited = el('span', 'chat-edited', T.tEdited);
    var when = el('time', null, timeFmt.format(new Date(m.at)));
    var more = iconButton('chat-more', 'fa-ellipsis', T.tMore);
    meta.appendChild(edited);
    meta.appendChild(when);
    meta.appendChild(more);
    var actions = el('div', 'chat-actions');
    actions.hidden = true;
    REACTIONS.forEach(function (e) {
      var b = el('button', 'chat-react-pick', e);
      b.type = 'button';
      b.dataset.emoji = e;
      b.setAttribute('aria-label', e);
      actions.appendChild(b);
    });
    actions.appendChild(iconButton('chat-reply', 'fa-reply', T.tReply));
    if (m.mine) {
      actions.appendChild(iconButton('chat-edit', 'fa-pen', T.tEdit));
      actions.appendChild(iconButton('chat-del', 'fa-trash', T.tDelete));
    } else {
      actions.appendChild(iconButton('chat-rep', 'fa-flag', T.tReport));
    }
    li.appendChild(quote);
    li.appendChild(el('span', 'chat-text'));
    var reactions = el('div', 'chat-reactions');
    li.appendChild(reactions);
    li.appendChild(meta);
    li.appendChild(actions);
    paint(li, m);
    return li;
  }

  // oddělení po dnech: Dnes, Včera, jinak datum
  function dayLabel(at) {
    var d = new Date(at), now = new Date();
    var days = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
    if (relFmt && days <= 1) {
      var text = relFmt.format(-days, 'day');
      return text.charAt(0).toUpperCase() + text.slice(1);
    }
    return dayFmt.format(d);
  }
  function markDays() {
    list.querySelectorAll('.chat-day').forEach(function (n) { n.remove(); });
    var last = '';
    list.querySelectorAll('.chat-msg').forEach(function (li) {
      var day = new Date(+li.dataset.at).toDateString();
      if (day !== last) li.before(el('li', 'chat-day', dayLabel(+li.dataset.at)));
      last = day;
    });
  }
  function markSeen(id) {
    var old = list.querySelector('.chat-seen');
    if (old) old.remove();
    var li = id && list.querySelector('.chat-msg[data-id="' + id + '"]');
    if (li) li.after(el('li', 'chat-seen', T.tSeen));
  }

  function load(query) {
    return fetch('/api/chat?with=' + encodeURIComponent(name) + query, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; });
  }
  function setMuted(on) {
    muted = on;
    muteBtn.classList.toggle('on', on);
    muteBtn.title = on ? T.tUnmute : T.tMute;
    muteBtn.setAttribute('aria-label', muteBtn.title);
    muteBtn.setAttribute('aria-pressed', String(on));
    muteBtn.querySelector('i').className = 'fa-solid ' + (on ? 'fa-bell-slash' : 'fa-bell');
  }
  function apply(data) {
    if (!data) return;
    var stick = nearBottom() || !loaded, added = false;
    data.items.forEach(function (m) {
      var li = list.querySelector('.chat-msg[data-id="' + m.id + '"]');
      if (li) { paint(li, m); return; }
      list.appendChild(bubble(m));
      added = true;
      if (!firstId || m.id < firstId) firstId = m.id;
    });
    if (added) markDays();
    markSeen(data.seenId);
    loaded = true;
    form.hidden = !data.canSend;
    closed.hidden = data.canSend;
    setMuted(data.muted);
    // stav přítele v hlavičce (offline a cizí se neukazuje)
    var stateBox = room.querySelector('.chat-who-state');
    var label = data.state && stateBox.dataset['t' + data.state[0].toUpperCase() + data.state.slice(1)];
    stateBox.hidden = !label;
    stateBox.textContent = label || '';
    stateBox.className = 'chat-who-state' + (label ? ' s-' + data.state : '');
    if (stick) toBottom();
  }
  // kdo si píše v malém okně, je pro web v rámečku: tahle stránka proto sama hlásí, že tu člověk je (stav Nečinný)
  var lastInput = Date.now(), lastSent = 0;
  ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(function (type) {
    window.addEventListener(type, function () { lastInput = Date.now(); }, { passive: true, capture: true });
  });
  function refresh() {
    var active = lastInput > lastSent;
    lastSent = Date.now();
    return load('&recent=1' + (active ? '&active=1' : '')).then(apply).catch(function () { /* příště */ });
  }
  function poll() {
    if (!document.body.contains(room)) { clearInterval(window.__chatTimer); window.__chatTimer = null; return; }
    if (document.hidden || busy) return;
    refresh();
  }

  load('').then(function (data) {
    apply(data);
    older.hidden = !data || data.items.length < 50;
  }).catch(function () { /* příště */ });
  window.__chatTimer = setInterval(poll, 4000);

  older.addEventListener('click', function () {
    load('&before=' + firstId).then(function (data) {
      if (!data) return;
      var height = list.scrollHeight;
      data.items.slice().reverse().forEach(function (m) { list.insertBefore(bubble(m), list.firstChild); firstId = m.id; });
      markDays();
      list.scrollTop = list.scrollHeight - height;
      older.hidden = data.items.length < 50;
    });
  });

  // odpověď a úprava: pruh nad políčkem říká, co se právě dělá
  function composeMode(mode, text) {
    bar.hidden = !mode;
    barText.textContent = mode ? mode + ': ' + text.slice(0, 80) : '';
  }
  function cancelCompose() {
    if (editId) input.value = '';
    replyTo = 0;
    editId = 0;
    composeMode('');
    autosize();
  }
  bar.querySelector('button').addEventListener('click', cancelCompose);

  // upozornění před odesláním (js/chat-warn.js): člověk se rozhodne sám, nikam se nic nehlásí
  var warnBox = room.querySelector('.chat-warn'), warnedText = null;
  warnBox.querySelector('.chat-warn-edit').addEventListener('click', function () { warnBox.hidden = true; input.focus(); });
  warnBox.querySelector('.chat-warn-send').addEventListener('click', function () { warnBox.hidden = true; warnedText = input.value.trim(); send(); });
  input.addEventListener('input', function () { warnBox.hidden = true; });

  function send() {
    var body = input.value.trim();
    if (!body || busy) return;
    if (body !== warnedText && window.chatWarn && window.chatWarn(body)) { warnBox.hidden = false; return; }
    warnedText = null;
    busy = true;
    showError('');
    var request = editId ? { action: 'edit', id: editId, body: body } : { action: 'send', with: name, body: body, replyTo: replyTo };
    post(request).then(function (r) {
      if (r.status === 429) showError(T.tLimit);
      else if (r.status === 403) { form.hidden = true; closed.hidden = false; }
      else if (!r.ok) showError(T.tFail);
      else { input.value = ''; replyTo = 0; editId = 0; composeMode(''); autosize(); toggleEmoji(false); }
    }).catch(function () { showError(T.tFail); }).then(function () {
      busy = false;
      refresh().then(toBottom);
    });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); send(); });
  // na počítači Enter posílá (Shift+Enter = nový řádek); na telefonu je Enter nový řádek a posílá se tlačítkem
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !matchMedia('(pointer: coarse)').matches) { e.preventDefault(); send(); }
    if (e.key === 'Escape' && (replyTo || editId)) cancelCompose();
  });
  function autosize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 130) + 'px';
  }
  input.addEventListener('input', autosize);

  // smajlíky: stejná sada jako u komentářů (js/comments.js), vloží se tam, kde je kurzor
  var EMOJI = ['🔥', '💯', '🦖', '🎤', '🎧', '🎶', '👑', '💪', '👏', '🙌', '🤘', '✌️', '👊', '🫡', '😎', '😂',
    '🤣', '😍', '🥹', '😮', '🤯', '🥶', '😢', '😤', '🙏', '❤️', '🖤', '💛', '💀', '⚡', '🚀', '🌙', '✨', '👀', '🤝', '🍀'];
  var emojiBtn = form.querySelector('.chat-emoji-btn'), emojiBox = form.querySelector('.chat-emoji');
  EMOJI.forEach(function (e) {
    var b = el('button', null, e);
    b.type = 'button';
    b.setAttribute('aria-label', e);
    emojiBox.appendChild(b);
  });
  function toggleEmoji(show) {
    emojiBox.hidden = !show;
    emojiBtn.setAttribute('aria-expanded', String(show));
  }
  emojiBtn.addEventListener('click', function () { toggleEmoji(emojiBox.hidden); });
  emojiBox.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    var from = input.selectionStart, to = input.selectionEnd;
    input.value = input.value.slice(0, from) + b.textContent + input.value.slice(to);
    input.selectionStart = input.selectionEnd = from + b.textContent.length;
    autosize();
    if (!matchMedia('(pointer: coarse)').matches) input.focus();   // na telefonu by vyskočila klávesnice přes smajlíky
  });
  document.addEventListener('click', function (e) { if (!form.contains(e.target) && document.body.contains(form)) toggleEmoji(false); });

  list.addEventListener('click', function (e) {
    var li = e.target.closest('.chat-msg');
    if (!li) return;
    var m = li._m;
    var quote = e.target.closest('.chat-quote');
    if (quote) {
      var target = list.querySelector('.chat-msg[data-id="' + quote.dataset.to + '"]');
      if (target) target.scrollIntoView({ block: 'center' });
      return;
    }
    if (e.target.closest('.chat-more')) {
      var actions = li.querySelector('.chat-actions'), show = actions.hidden;
      list.querySelectorAll('.chat-actions').forEach(function (a) { a.hidden = true; });
      actions.hidden = !show;
      var editBtn = li.querySelector('.chat-edit');
      if (editBtn) editBtn.hidden = Date.now() - m.at > EDIT_WINDOW;
      return;
    }
    var pick = e.target.closest('[data-emoji]');
    if (pick) {
      li.querySelector('.chat-actions').hidden = true;
      post({ action: 'react', id: m.id, emoji: pick.dataset.emoji }).then(refresh);
      return;
    }
    if (e.target.closest('.chat-reply')) {
      li.querySelector('.chat-actions').hidden = true;
      if (editId) cancelCompose();
      replyTo = m.id;
      composeMode(T.tReplyTo, m.body);
      input.focus();
      return;
    }
    if (e.target.closest('.chat-edit')) {
      li.querySelector('.chat-actions').hidden = true;
      replyTo = 0;
      editId = m.id;
      input.value = m.body;
      composeMode(T.tEditing, m.body);
      autosize();
      input.focus();
      return;
    }
    if (e.target.closest('.chat-del')) {
      if (!confirm(T.tDeleteConfirm)) return;
      post({ action: 'delete', id: m.id }).then(refresh);
      return;
    }
    if (e.target.closest('.chat-rep')) {
      if (li.querySelector('.chat-report-form')) return;
      li.appendChild(room.querySelector('.chat-report-tpl').content.cloneNode(true));
      li.querySelector('.chat-report-form').addEventListener('submit', function (ev) {
        ev.preventDefault();
        var f = ev.target;
        post({ action: 'report', id: m.id, reason: f.reason.value, note: f.note.value }).then(function (r) {
          f.replaceWith(el('p', 'chat-reported', r.ok ? T.tReported : (r.status === 429 ? T.tLimit : T.tFail)));
        });
      });
    }
  });

  muteBtn.addEventListener('click', function () {
    var on = !muted;
    setMuted(on);
    post({ action: 'mute', with: name, on: on ? '1' : '0' });
  });
  room.querySelector('.chat-hide').addEventListener('click', function () {
    if (!confirm(T.tHideConfirm)) return;
    post({ action: 'hide', with: name }).then(function () { location.href = room.dataset.base; });
  });
})();
