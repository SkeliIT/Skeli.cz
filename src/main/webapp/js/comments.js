/* Comments like on YouTube, the same under a song (kind=lyric) and under the clip on Music (kind=video).
   includes/comments.jspf gives the box [data-comments] with data-kind, data-target (lyric id or YouTube id;
   the Music player changes it when another clip plays), data-csrf and the texts in data-t.
   Everything comes from /api/comments: 👍 / 👎 (the same thumb again takes it back), replies one level
   deep hidden under "▾ 3 replies", emoji, Top / Newest, a pinned comment and a heart from Skeli. */
(function () {
  var EMOJI = ['🔥', '💯', '🦖', '🎤', '🎧', '🎶', '👑', '💪', '👏', '🙌', '🤘', '✌️', '👊', '🫡', '😎', '😂',
    '🤣', '😍', '🥹', '😮', '🤯', '🥶', '😢', '😤', '🙏', '❤️', '🖤', '💛', '💀', '⚡', '🚀', '🌙', '✨', '👀', '🤝', '🍀'];

  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function mount(root) {
    if (!root || root.dataset.ready) return;
    root.dataset.ready = '1';
    var T = {};
    try { T = JSON.parse(root.dataset.t || '{}'); } catch (e) {}
    var kind = root.dataset.kind, csrf = root.dataset.csrf || '';
    var lang = document.documentElement.lang || 'cs';
    var list = root.querySelector('.cmts-list');
    var slot = root.querySelector('.cmts-composer-slot');
    var countEl = root.querySelector('[data-cmts-count]');
    var note = root.querySelector('.cmts-note');
    var sortBox = root.querySelector('.cmts-sort');
    var sort = 'top';
    try { sort = localStorage.getItem('cmtSort') === 'new' ? 'new' : 'top'; } catch (e) {}
    var data = null, open = {}, loadedFor = null, firstLoad = true, noteTimer, loadSeq = 0;
    // on Music the player may have started before this box existed: take the clip it shows
    if (!root.dataset.target && kind === 'video') {
      var pl = document.querySelector('[data-clip-player][data-yt]');
      if (pl) root.dataset.target = pl.dataset.yt;
    }
    var loginUrl = '/login.jsp?next=' + encodeURIComponent(location.pathname);
    root.querySelectorAll('a[data-login]').forEach(function (a) { a.href = loginUrl; });

    // ---------- small helpers ----------
    var rtf = window.Intl && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }) : null;
    var plural = window.Intl && Intl.PluralRules ? new Intl.PluralRules(lang) : null;
    var UNITS = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    function ago(ms) {
      var s = (ms - Date.now()) / 1000, a = Math.abs(s);
      if (!rtf) return new Date(ms).toLocaleDateString(lang);
      for (var i = 0; i < UNITS.length; i++) if (a >= UNITS[i][1]) return rtf.format(Math.round(s / UNITS[i][1]), UNITS[i][0]);
      return rtf.format(0, 'second');
    }
    function full(ms) { return new Date(ms).toLocaleString(lang); }
    function repliesLabel(n) {
      var cat = plural ? plural.select(n) : 'other';
      return (T['cmt.replies.' + cat] || T['cmt.replies.other'] || '{n}').replace('{n}', n);
    }
    function say(text) {
      if (!note) return;
      note.textContent = text;
      note.hidden = false;
      clearTimeout(noteTimer);
      noteTimer = setTimeout(function () { note.hidden = true; }, 6000);
    }
    function avatar(src, cls) {
      return src ? '<img class="cmt-avatar' + (cls || '') + '" src="' + esc(src) + '" alt="" loading="lazy">'
        : '<span class="cmt-avatar cmt-avatar-empty' + (cls || '') + '" aria-hidden="true"><i class="fa-solid fa-user"></i></span>';
    }
    function post(params) {
      var body = new URLSearchParams(params);
      body.set('kind', kind);
      return fetch('/api/comments', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-Token': csrf }, body: body.toString()
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; });
      }).catch(function () { return { status: 0, body: {} }; });
    }
    // what went wrong, in words; true when it went fine
    function fine(res) {
      if (res.status === 200) return true;
      if (res.status === 401) location.href = loginUrl;
      else if (res.status === 403 && res.body && res.body.error === 'verify') say(T['verify.notice']);
      else if (res.status === 429) say(T['flash.commentLimit']);
      else say(T['cmt.error']);
      return false;
    }

    // ---------- drawing ----------
    function find(id) {
      if (!data) return null;
      for (var i = 0; i < data.items.length; i++) {
        var c = data.items[i];
        if (c.id === id) return c;
        for (var j = 0; j < c.replies.length; j++) if (c.replies[j].id === id) return c.replies[j];
      }
      return null;
    }

    function heartHtml(c) {
      var pic = data.artistAvatar ? '<img src="' + esc(data.artistAvatar) + '" alt="">' : '<i class="fa-solid fa-user"></i>';
      if (c.hearted) {
        var inner = '<span class="cmt-heart-pic">' + pic + '</span><i class="fa-solid fa-heart"></i>';
        return c.canHeart
          ? '<button type="button" class="cmt-heart on" data-act="heart" title="' + esc(T['cmt.unheart']) + '" aria-label="' + esc(T['cmt.unheart']) + '">' + inner + '</button>'
          : '<span class="cmt-heart on" title="' + esc(T['cmt.hearted']) + '" role="img" aria-label="' + esc(T['cmt.hearted']) + '">' + inner + '</span>';
      }
      return c.canHeart
        ? '<button type="button" class="cmt-heart" data-act="heart" title="' + esc(T['cmt.heart']) + '" aria-label="' + esc(T['cmt.heart']) + '"><i class="fa-regular fa-heart"></i></button>'
        : '';
    }

    function menuHtml(c) {
      var items = '';
      if (c.canPin) items += '<button type="button" data-act="pin"><i class="fa-solid fa-thumbtack"></i> ' + esc(c.pinned ? T['cmt.unpin'] : T['cmt.pin']) + '</button>';
      if (c.canEdit) items += '<button type="button" class="cmt-edit" data-act="edit"><i class="fa-solid fa-pen"></i> ' + esc(T['common.edit']) + '</button>'
        + '<button type="button" class="cmt-delete" data-act="delete"><i class="fa-solid fa-trash-can"></i> ' + esc(T['common.delete']) + '</button>';
      if (c.canReport) items += '<button type="button" class="cmt-report" data-act="report"><i class="fa-solid fa-flag"></i> ' + esc(T['comment.report']) + '</button>';
      if (!items) return '';
      return '<details class="cmt-menu"><summary title="' + esc(T['cmt.more']) + '" aria-label="' + esc(T['cmt.more']) + '">'
        + '<i class="fa-solid fa-ellipsis-vertical"></i></summary><div class="cmt-menu-list">' + items + '</div></details>';
    }

    function commentHtml(c, isReply) {
      var name = c.user == null ? '<span class="cmt-name is-gone">' + esc(T['account.deleted']) + '</span>'
        : '<span class="cmt-name' + (c.artist ? ' is-artist" title="' + esc(T['cmt.artist']) : '') + '">' + esc(c.user)
          + (c.artist ? ' <i class="fa-solid fa-circle-check" aria-hidden="true"></i>' : '') + '</span>';
      var me = data.me;
      return '<article class="cmt' + (isReply ? ' cmt-reply' : '') + (c.pinned ? ' is-pinned' : '') + '" id="comment-' + c.id
        + '" data-id="' + c.id + '" data-root="' + (c.parentId || c.id) + '">'
        + avatar(c.avatar)
        + '<div class="cmt-body">'
        + (c.pinned ? '<div class="cmt-pinned"><i class="fa-solid fa-thumbtack"></i> ' + esc(T['cmt.pinned']) + '</div>' : '')
        + '<div class="cmt-head">' + name
        + '<time class="cmt-time" datetime="' + new Date(c.created).toISOString() + '" title="' + esc(full(c.created)) + '">' + esc(ago(c.created)) + '</time>'
        + (c.edited ? '<span class="cmt-edited" title="' + esc(full(c.edited)) + '">(' + esc(T['comment.edited']) + ')</span>' : '')
        + '</div>'
        + '<div class="cmt-text">' + esc(c.content) + '</div>'
        + '<div class="cmt-bar">'
        + '<button type="button" class="cmt-vote up' + (c.my === 1 ? ' on' : '') + '" data-act="vote" data-v="1" aria-pressed="' + (c.my === 1)
        + '" title="' + esc(me.authed ? T['vote.like'] : T['vote.loginToVote']) + '"><i class="fa-' + (c.my === 1 ? 'solid' : 'regular') + ' fa-thumbs-up"></i>'
        + '<span class="n">' + (c.up || '') + '</span></button>'
        + '<button type="button" class="cmt-vote down' + (c.my === -1 ? ' on' : '') + '" data-act="vote" data-v="-1" aria-pressed="' + (c.my === -1)
        + '" title="' + esc(me.authed ? T['vote.dislike'] : T['vote.loginToVote']) + '"><i class="fa-' + (c.my === -1 ? 'solid' : 'regular') + ' fa-thumbs-down"></i></button>'
        + heartHtml(c)
        + (me.canPost ? '<button type="button" class="cmt-reply-btn" data-act="reply">' + esc(T['comment.reply']) + '</button>' : '')
        + menuHtml(c)
        + '</div>'
        + '<div class="cmt-slot"></div>'
        + '</div></article>';
    }

    function threadHtml(c) {
      var n = c.replies.length, isOpen = !!open[c.id];
      var html = '<div class="cmt-thread" data-thread="' + c.id + '">' + commentHtml(c, false);
      if (n) {
        html += '<button type="button" class="cmt-replies-toggle" data-act="toggle" data-thread="' + c.id + '" aria-expanded="' + isOpen + '">'
          + '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i> <span>' + esc(isOpen ? T['cmt.hideReplies'] : repliesLabel(n)) + '</span></button>'
          + '<div class="cmt-replies"' + (isOpen ? '' : ' hidden') + '>' + c.replies.map(function (r) { return commentHtml(r, true); }).join('') + '</div>';
      }
      return html + '</div>';
    }

    function render() {
      if (countEl) countEl.textContent = data ? data.total : 0;
      if (!data) { list.innerHTML = ''; return; }
      list.innerHTML = data.items.length ? data.items.map(threadHtml).join('')
        : '<p class="cmts-empty">' + esc(T['cmt.empty']) + '</p>';
      if (data.me.canPost && !slot.firstChild) slot.appendChild(composer({ mode: 'new' }));
    }

    function paintSort() {
      if (!sortBox) return;
      sortBox.querySelectorAll('button[data-sort]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.sort === sort)); });
      var cur = sortBox.querySelector('.cmts-sort-current');
      if (cur) cur.textContent = T['cmt.sort.' + sort] || '';
    }

    // ---------- the box to write in (new comment, reply, edit) ----------
    function composer(o) {
      var f = document.createElement('form');
      f.className = 'cmt-composer is-' + o.mode;
      f.noValidate = true;
      var label = o.mode === 'reply' ? T['comment.reply'] : o.mode === 'edit' ? T['common.save'] : T['common.send'];
      f.innerHTML = (o.mode === 'edit' ? '' : avatar(data.me.avatar, ' cmt-avatar-sm'))
        + '<div class="cmt-composer-main">'
        + '<div class="hp-field" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>'
        + '<textarea name="content" rows="1" maxlength="1000" placeholder="' + esc(o.mode === 'reply' ? T['comment.replyPlaceholder'] : T['comment.placeholder'])
        + '" aria-label="' + esc(T['comment.placeholder']) + '"></textarea>'
        + '<div class="cmt-composer-bar"' + (o.mode === 'new' ? ' hidden' : '') + '>'
        + '<button type="button" class="cmt-emoji-btn" aria-expanded="false" title="' + esc(T['cmt.emoji']) + '" aria-label="' + esc(T['cmt.emoji']) + '">'
        + '<i class="fa-regular fa-face-smile"></i></button>'
        + '<span class="cmt-counter" aria-hidden="true"></span>'
        + '<button type="button" class="cmt-cancel">' + esc(T['common.cancel']) + '</button>'
        + '<button type="submit" class="cmt-send" disabled>' + esc(label) + '</button>'
        + '</div>'
        + '<div class="cmt-emoji" hidden>' + EMOJI.map(function (e) { return '<button type="button" data-emoji="' + e + '">' + e + '</button>'; }).join('') + '</div>'
        + '</div>';
      var ta = f.querySelector('textarea'), bar = f.querySelector('.cmt-composer-bar'), send = f.querySelector('.cmt-send');
      var counter = f.querySelector('.cmt-counter'), pick = f.querySelector('.cmt-emoji'), pickBtn = f.querySelector('.cmt-emoji-btn');
      function grow() {
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 320) + 'px';
        ta.classList.toggle('is-long', ta.scrollHeight > 320);   // a scrollbar only for a really long comment
        var len = ta.value.trim().length;
        send.disabled = !len || len > 1000;
        counter.textContent = ta.value.length > 850 ? ta.value.length + ' / 1000' : '';
      }
      ta.value = o.text || '';
      ta.addEventListener('input', grow);
      ta.addEventListener('focus', function () { bar.hidden = false; });
      ta.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (!send.disabled) f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit')); }
        if (e.key === 'Escape') close();
      });
      pickBtn.addEventListener('click', function () {
        pick.hidden = !pick.hidden;
        pickBtn.setAttribute('aria-expanded', String(!pick.hidden));
      });
      pick.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-emoji]'); if (!b) return;
        var s = ta.selectionStart || ta.value.length, en = ta.selectionEnd || s;
        ta.value = ta.value.slice(0, s) + b.dataset.emoji + ta.value.slice(en);
        ta.focus();
        ta.selectionStart = ta.selectionEnd = s + b.dataset.emoji.length;
        grow();
      });
      function close() {
        if (o.mode === 'new') { ta.value = ''; grow(); bar.hidden = true; pick.hidden = true; ta.blur(); }
        else { f.remove(); if (o.onClose) o.onClose(); }
      }
      f.querySelector('.cmt-cancel').addEventListener('click', close);
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var text = ta.value.trim();
        if (!text || send.disabled) return;
        send.disabled = true;
        var params = o.mode === 'edit' ? { action: 'edit', id: o.id, content: text }
          : { action: 'add', target: root.dataset.target, content: text, website: f.querySelector('[name=website]').value };
        if (o.mode === 'reply') params.parent = o.parent;
        post(params).then(function (res) {
          if (!fine(res)) { send.disabled = false; return; }
          if (o.mode === 'reply') open[o.root] = true;
          close();
          load(res.body && res.body.id);
        });
      });
      setTimeout(grow, 0);
      if (o.focus) setTimeout(function () { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }, 0);
      return f;
    }

    // ---------- loading ----------
    function load(focusId) {
      var target = root.dataset.target;
      if (!target) { data = null; render(); return; }
      if (loadedFor !== target) { open = {}; loadedFor = target; }
      var seq = ++loadSeq; // only the answer to the latest request is drawn
      fetch('/api/comments?kind=' + encodeURIComponent(kind) + '&target=' + encodeURIComponent(target) + '&sort=' + sort, { credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d || seq !== loadSeq || root.dataset.target !== target) return;
          data = d;
          // a link to one comment (#comment-12): open its replies and show it
          var wanted = focusId || (firstLoad && /^#comment-(\d+)$/.test(location.hash) ? Number(location.hash.slice(9)) : null);
          var hit = wanted ? find(wanted) : null;
          if (hit && hit.parentId) open[hit.parentId] = true;
          render();
          paintSort();
          if (hit) {
            var el = document.getElementById('comment-' + hit.id);
            if (el) {
              el.classList.add('is-target');
              if (!focusId) el.scrollIntoView({ block: 'center' });
              setTimeout(function () { el.classList.remove('is-target'); }, 2600);
            }
          }
          firstLoad = false;
        })
        .catch(function () {});
    }

    // ---------- clicks ----------
    list.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b || !list.contains(b)) return;
      var act = b.dataset.act;
      if (act === 'toggle') {
        var id = Number(b.dataset.thread), box = b.nextElementSibling, c = find(id);
        open[id] = !open[id];
        box.hidden = !open[id];
        b.setAttribute('aria-expanded', String(open[id]));
        b.querySelector('span').textContent = open[id] ? T['cmt.hideReplies'] : repliesLabel(c.replies.length);
        return;
      }
      var art = b.closest('.cmt'), cid = Number(art.dataset.id), item = find(cid);
      if (!item) return;
      var menu = b.closest('details.cmt-menu');
      if (menu) menu.open = false;
      if (act === 'vote') {
        if (!data.me.authed) { location.href = loginUrl; return; }
        post({ action: 'vote', id: cid, vote: b.dataset.v }).then(function (res) {
          if (!fine(res)) return;
          item.up = res.body.up; item.down = res.body.down; item.my = res.body.my;
          var up = art.querySelector(':scope > .cmt-body > .cmt-bar .cmt-vote.up'), down = art.querySelector(':scope > .cmt-body > .cmt-bar .cmt-vote.down');
          up.classList.toggle('on', item.my === 1); up.setAttribute('aria-pressed', String(item.my === 1));
          up.querySelector('i').className = 'fa-' + (item.my === 1 ? 'solid' : 'regular') + ' fa-thumbs-up';
          up.querySelector('.n').textContent = item.up || '';
          down.classList.toggle('on', item.my === -1); down.setAttribute('aria-pressed', String(item.my === -1));
          down.querySelector('i').className = 'fa-' + (item.my === -1 ? 'solid' : 'regular') + ' fa-thumbs-down';
        });
      } else if (act === 'reply') {
        var slotEl = art.querySelector(':scope > .cmt-body > .cmt-slot');
        if (slotEl.firstChild) { slotEl.querySelector('textarea').focus(); return; }
        var rootId = item.parentId || item.id;
        // answering a reply: start with @name, like on YouTube
        slotEl.appendChild(composer({ mode: 'reply', parent: item.id, root: rootId, focus: true,
          text: item.parentId && item.user ? '@' + item.user + ' ' : '' }));
      } else if (act === 'edit') {
        var text = art.querySelector(':scope > .cmt-body > .cmt-text');
        var editSlot = art.querySelector(':scope > .cmt-body > .cmt-slot');
        if (editSlot.querySelector('.is-edit')) return;
        text.hidden = true;
        editSlot.appendChild(composer({ mode: 'edit', id: cid, text: item.content, focus: true, onClose: function () { text.hidden = false; } }));
      } else if (act === 'delete') {
        if (!confirm(T['comment.deleteConfirm'])) return;
        post({ action: 'delete', id: cid }).then(function (res) { if (fine(res)) load(); });
      } else if (act === 'pin') {
        post({ action: 'pin', id: cid, on: item.pinned ? '0' : '1' }).then(function (res) { if (fine(res)) load(); });
      } else if (act === 'heart') {
        post({ action: 'heart', id: cid, on: item.hearted ? '0' : '1' }).then(function (res) { if (fine(res)) load(); });
      } else if (act === 'report') {
        if (!confirm(T['comment.reportConfirm'])) return;
        var body = new URLSearchParams({ kind: kind, comment_id: String(cid) });
        fetch('/comment/report', { method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-Token': csrf }, body: body.toString() })
          .then(function (r) { say(r.ok ? T['flash.reported'] : r.status === 429 ? T['flash.commentLimit'] : T['cmt.error']); });
      }
    });

    // a click outside an open "⋮" menu or the sort menu closes it
    document.addEventListener('click', function (e) {
      root.querySelectorAll('details.cmt-menu[open], details.cmts-sort[open]').forEach(function (d) { if (!d.contains(e.target)) d.open = false; });
    });

    if (sortBox) sortBox.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-sort]'); if (!b) return;
      sort = b.dataset.sort;
      sortBox.open = false;
      try { localStorage.setItem('cmtSort', sort); } catch (er) {}
      paintSort();
      load();
    });

    // the Music player says which clip is playing by changing data-target
    new MutationObserver(function () { if (root.dataset.target !== loadedFor) load(); })
      .observe(root, { attributes: true, attributeFilter: ['data-target'] });

    // "2 minutes ago" moves on while the page stays open
    var tick = setInterval(function () {
      if (!document.body.contains(root)) { clearInterval(tick); return; }
      list.querySelectorAll('.cmt-time').forEach(function (t) { t.textContent = ago(Date.parse(t.getAttribute('datetime'))); });
    }, 60000);

    paintSort();
    load();
  }

  window.SkeliComments = { mount: mount };
  document.querySelectorAll('[data-comments]').forEach(mount);
})();
