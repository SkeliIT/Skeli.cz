<%@ include file="/includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="com.github.skeliit.model.KaraokeClip, com.github.skeliit.WebUtils" %>
<%
  @SuppressWarnings("unchecked") java.util.List<KaraokeClip> kClips = (java.util.List<KaraokeClip>) request.getAttribute("clips");
  KaraokeClip kClip = (KaraokeClip) request.getAttribute("clip");
%>
<main class="admin-page admin-karaoke-page">
  <%@ include file="/includes/admin-nav.jspf" %>
  <% if (kClip == null) { %>
  <h2 class="admin-page-title">Karaoke</h2>
  <p class="text-dim">Na stránce písně se řádek, který se zrovna zpívá, vypaluje laserem. Časy řádků se počítají automaticky (Whisper poslechne klip); tady je jde doladit ručně. Ruční úprava má přednost před automatickou.</p>
  <section class="admin-card admin-card-wide">
    <h3>Klipy s českým textem</h3>
    <table class="admin-table karaoke-list">
      <thead><tr><th>Klip</th><th>Píseň</th><th>Řádků</th><th>Časy</th><th></th></tr></thead>
      <tbody>
      <% for (KaraokeClip k : kClips) { %>
        <tr>
          <td><img class="karaoke-thumb" src="/yt-thumb/<%= k.youtubeId %>/mqdefault.jpg" alt="" loading="lazy"> <%= WebUtils.escapeHtml(k.title == null ? k.youtubeId : k.title) %></td>
          <td><%= WebUtils.escapeHtml(k.songName) %></td>
          <td><%= k.getLineCount() %></td>
          <td><% if (k.manual) { %><span class="admin-badge ok">ručně</span><% } else if (k.auto) { %><span class="admin-badge">automaticky</span><% } else { %><span class="admin-badge warn">chybí</span><% } %></td>
          <td><a class="btn-small" href="/admin/karaoke?yt=<%= k.youtubeId %>"><i class="fa-solid fa-sliders"></i> Doladit</a></td>
        </tr>
      <% } %>
      </tbody>
    </table>
  </section>
  <% } else { %>
  <p><a href="/admin/karaoke"><i class="fa-solid fa-arrow-left"></i> Všechny klipy</a></p>
  <h2 class="admin-page-title">Karaoke: <%= WebUtils.escapeHtml(kClip.songName) %></h2>
  <p class="text-dim">Pusť klip a v <strong>ťukacím režimu</strong> zmáčkni <kbd>mezerník</kbd> přesně ve chvíli, kdy začíná další řádek (konec předchozího se nastaví sám). Pomůže zpomalit na 0,75×. Každý čas jde pak posunout o desetinu sekundy nebo nastavit na „teď“.</p>

  <div class="karaoke-editor" id="karaokeEditor" data-yt="<%= kClip.youtubeId %>" data-csrf="${csrf}">
    <div class="karaoke-side">
      <div class="karaoke-player"><iframe id="kPlayer" allow="autoplay; encrypted-media" allowfullscreen
        src="https://www.youtube-nocookie.com/embed/<%= kClip.youtubeId %>?enablejsapi=1&rel=0&playsinline=1"></iframe></div>
      <div class="karaoke-controls">
        <button type="button" id="kPlay"><i class="fa-solid fa-play"></i> Přehrát / pauza</button>
        <span class="karaoke-clock" id="kClock">0:00.0</span>
        <label>Rychlost
          <select id="kRate"><option value="1">1×</option><option value="0.75">0,75×</option><option value="0.5">0,5×</option></select>
        </label>
      </div>
      <div class="karaoke-controls">
        <label class="checkbox-label"><input type="checkbox" id="kTap"> Ťukací režim</label>
        <span class="text-dim" id="kTapInfo"></span>
      </div>
      <div class="karaoke-controls">
        <button type="button" id="kSave" class="btn-primary"><i class="fa-solid fa-floppy-disk"></i> Uložit</button>
        <button type="button" id="kReset" class="btn-outline">Vrátit automatické</button>
        <span id="kMsg" role="status"></span>
      </div>
    </div>
    <ol class="karaoke-lines" id="kLines"></ol>
  </div>
  <script>
  (function () {
    var LINES = <%= ((String) request.getAttribute("linesJson")).replace("<", "\\u003c") %>;
    var box = document.getElementById('karaokeEditor'), yt = box.dataset.yt, csrf = box.dataset.csrf;
    var frame = document.getElementById('kPlayer'), list = document.getElementById('kLines');
    var times = LINES.map(function () { return [null, null]; });
    var playing = false, base = 0, baseAt = performance.now(), tapAt = 0;

    // ---------- the player: commands and the time it reports (the YouTube IFrame API messages) ----------
    function cmd(func, args) { frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: func, args: args || [] }), '*'); }
    var hello = setInterval(function () { frame.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 3, channel: 'widget' }), '*'); }, 800);
    window.addEventListener('message', function (e) {
      if (e.source !== frame.contentWindow) return;
      var m; try { m = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (er) { return; }
      if (!m) return;
      clearInterval(hello);
      var info = m.info;
      if (m.event === 'onStateChange' && typeof info === 'number') { base = now(); baseAt = performance.now(); playing = info === 1; }
      if (info && typeof info === 'object') {
        if (typeof info.playerState === 'number') playing = info.playerState === 1;
        if (typeof info.currentTime === 'number') { base = info.currentTime; baseAt = performance.now(); }
        if (typeof info.playbackRate === 'number') rate = info.playbackRate;
      }
    });
    var rate = 1;
    function now() { return base + (playing ? (performance.now() - baseAt) / 1000 * rate : 0); }
    function fmt(t) { if (t == null) return '–'; var m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1); }
    function seek(t) { cmd('seekTo', [Math.max(0, t), true]); base = Math.max(0, t); baseAt = performance.now(); }

    // ---------- the list of lines ----------
    function row(i) {
      return '<li data-i="' + i + '"><span class="k-text"></span>'
        + '<span class="k-time"><button type="button" data-a="play" title="Přehrát od tohoto řádku">▶</button>'
        + '<button type="button" data-a="minus" title="O 0,1 s dřív">−</button>'
        + '<input type="number" step="0.01" min="0" data-a="start" aria-label="Začátek (s)">'
        + '<button type="button" data-a="plus" title="O 0,1 s později">+</button>'
        + '<button type="button" data-a="nowStart" title="Začátek = teď">teď</button>'
        + '<span class="k-to">→</span><input type="number" step="0.01" min="0" data-a="end" aria-label="Konec (s)"></span></li>';
    }
    list.innerHTML = LINES.map(function (l, i) { return row(i); }).join('');
    Array.from(list.children).forEach(function (li, i) { li.querySelector('.k-text').textContent = LINES[i]; });
    function paint() {
      Array.from(list.children).forEach(function (li, i) {
        var s = li.querySelector('[data-a=start]'), e = li.querySelector('[data-a=end]');
        if (document.activeElement !== s) s.value = times[i][0] == null ? '' : times[i][0].toFixed(2);
        if (document.activeElement !== e) e.value = times[i][1] == null ? '' : times[i][1].toFixed(2);
      });
    }
    list.addEventListener('input', function (e) {
      var li = e.target.closest('li'); if (!li) return;
      var i = +li.dataset.i, v = e.target.value === '' ? null : parseFloat(e.target.value);
      if (e.target.dataset.a === 'start') times[i][0] = v; else if (e.target.dataset.a === 'end') times[i][1] = v;
    });
    list.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-a]'); if (!b) return;
      var i = +b.closest('li').dataset.i, a = b.dataset.a;
      if (a === 'play') { seek((times[i][0] || 0) - 1); cmd('playVideo'); }
      if (a === 'minus' && times[i][0] != null) times[i][0] = Math.max(0, +(times[i][0] - 0.1).toFixed(2));
      if (a === 'plus' && times[i][0] != null) times[i][0] = +(times[i][0] + 0.1).toFixed(2);
      if (a === 'nowStart') { times[i][0] = +now().toFixed(2); if (i > 0 && (times[i - 1][1] == null || times[i - 1][1] > times[i][0])) times[i - 1][1] = times[i][0]; }
      paint();
    });

    // ---------- tapping: space = the next line starts now ----------
    var tap = document.getElementById('kTap'), tapInfo = document.getElementById('kTapInfo'), next = 0;
    function paintTap() { tapInfo.textContent = tap.checked ? 'další: ' + (next + 1) + '. řádek' : ''; }
    tap.addEventListener('change', function () {
      // start from the first line that has not started yet at the current time
      next = 0; var t = now();
      while (next < times.length && times[next][0] != null && times[next][0] < t) next++;
      paintTap(); tap.blur();
    });
    document.addEventListener('keydown', function (e) {
      if (!tap.checked || e.code !== 'Space' || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
      e.preventDefault();
      if (next >= times.length) return;
      var t = +now().toFixed(2);
      times[next][0] = t;
      if (next > 0) times[next - 1][1] = t;
      next++;
      paintTap(); paint();
    });

    document.getElementById('kPlay').addEventListener('click', function () { cmd(playing ? 'pauseVideo' : 'playVideo'); });
    document.getElementById('kRate').addEventListener('change', function (e) { rate = parseFloat(e.target.value); cmd('setPlaybackRate', [rate]); });

    // ---------- the clock and the line that plays ----------
    var clock = document.getElementById('kClock');
    (function loop() {
      if (!document.body.contains(box)) return;
      var t = now(); clock.textContent = fmt(t);
      var cur = -1; for (var i = 0; i < times.length; i++) if (times[i][0] != null && times[i][0] <= t) cur = i;
      Array.from(list.children).forEach(function (li, i) { li.classList.toggle('playing', i === cur); });
      requestAnimationFrame(loop);
    })();

    // ---------- load, save, back to automatic ----------
    var msg = document.getElementById('kMsg');
    function say(text, bad) { msg.textContent = text; msg.className = bad ? 'admin-error' : 'admin-flash'; }
    function load() {
      fetch('/api/karaoke?yt=' + yt).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        if (d && d.times && d.times.length === LINES.length) { times = d.times.map(function (p) { return [p[0], p[1]]; }); say(d.source === 'manual' ? 'Načteny ruční časy.' : 'Načteny automatické časy.'); }
        else say('Zatím žádné časy – použij ťukací režim.');
        paint();
      });
    }
    function post(params) {
      return fetch('/admin/karaoke', { method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-Token': csrf },
        body: new URLSearchParams(params).toString() });
    }
    document.getElementById('kSave').addEventListener('click', function () {
      // a missing end = the next line's start (the last one: start + 4 s)
      for (var i = 0; i < times.length; i++) {
        if (times[i][0] == null) { say('Chybí začátek ' + (i + 1) + '. řádku.', true); return; }
        if (times[i][1] == null || times[i][1] < times[i][0]) times[i][1] = i + 1 < times.length && times[i + 1][0] != null ? times[i + 1][0] : +(times[i][0] + 4).toFixed(2);
      }
      paint();
      post({ yt: yt, action: 'save', times: JSON.stringify(times) }).then(function (r) { say(r.ok ? 'Uloženo. Na stránce písně platí hned.' : 'Uložení se nepovedlo.', !r.ok); });
    });
    document.getElementById('kReset').addEventListener('click', function () {
      if (!confirm('Smazat ruční časy a vrátit automatické?')) return;
      post({ yt: yt, action: 'reset' }).then(function () { load(); });
    });
    load();
  })();
  </script>
  <% } %>
</main>
<%@ include file="/includes/footer.jsp" %>
