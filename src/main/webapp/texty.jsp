<%@ page import="com.github.skeliit.dao.SongDao, com.github.skeliit.model.LyricListItem, com.github.skeliit.model.SongClip, com.github.skeliit.model.SongTitle, com.github.skeliit.WebUtils" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="sk" tagdir="/WEB-INF/tags" %>

<main class="texty-page">
    <sk:pageHero kicker='<%= t.getProperty("hero.kicker.lyrics") %>'
                 title='<%= t.getProperty("menu.lyrics") %>' lead='<%= t.getProperty("lyrics.subtitle") %>'>
      <%-- search by the name or by a word from the lyrics (/api/search), then by year --%>
      <form class="lyric-search" role="search" onsubmit="return false">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <input type="search" id="lyricSearch" autocomplete="off" maxlength="60"
               placeholder="${t['lyrics.search.placeholder']}" aria-label="${t['lyrics.search.placeholder']}">
      </form>
      <div class="filter-chips" id="yearChips" role="group" aria-label="${t['lyrics.filter.year']}" data-older="${t['lyrics.filter.older']}">
        <button type="button" class="chip active" data-year="">${t['lyrics.filter.all']}</button>
      </div>
    </sk:pageHero>
    <p class="empty-note" id="searchNone" hidden><%= t.getProperty("lyrics.search.none") %></p>
    <%-- one song per row, newest first, grouped by year: the title sits on the page background
         and the row fades into the song's clip thumbnail (or its preview photo) on the right --%>
    <div class="song-list" id="songGrid">
        <%
            // dao/SongDao: songs with lyrics, newest first; null = they could not be read
            java.util.List<LyricListItem> songs = null;
            java.util.Map<Integer, java.util.List<SongClip>> clipsBySong = java.util.Map.of();
            try {
                songs = new SongDao().withLyrics(cur);
                clipsBySong = SongClip.bySong();
            } catch (Exception e) {
                application.log("Texty list", e);
            }
            String lastYear = null;
            if (songs != null) for (LyricListItem song : songs) {
                SongTitle st = SongTitle.of(song.name);
                String art = song.artUrl();
                String meta = st.credits;
                java.util.List<SongClip> clips = clipsBySong.get(song.songId);
                if (clips != null && clips.size() > 1) {
                    meta = (meta.isEmpty() ? "" : meta + " · ") + clips.size() + " " + t.getProperty("music.versions", "verze");
                }
                String yearKey = song.year == null ? "" : String.valueOf(song.year);
                if (!yearKey.equals(lastYear)) {
                    lastYear = yearKey;
        %>
                            <h2 class="song-year-head" data-year="<%= yearKey %>"><%= song.year == null ? "–" : song.year %></h2>
        <%
                }
        %>
                            <a class="song-row" href="<%= WebUtils.escapeHtml(song.path(cur)) %>" data-song="<%= song.songId %>" data-year="<%= yearKey %>">
                                <span class="song-row-art" aria-hidden="true">
                                <% if (art != null) { %>
                                    <img src="<%= WebUtils.escapeHtml(art) %>" alt="" loading="lazy" data-trim-bars<% if (!song.artStyle.isEmpty()) { %> style="<%= song.artStyle %>" data-manual="1"<% } %>>
                                <% } %>
                                </span>
                                <span class="song-row-text">
                                    <span class="song-row-title"><%= WebUtils.escapeHtml(st.title) %></span>
                                    <% String tr = song.translatedTitle; if (!"cs".equals(cur) && tr != null && !tr.isBlank()) { %><span class="song-row-sub" lang="<%= cur %>"><%= WebUtils.escapeHtml(tr) %></span><% } %>
                                    <% if (!meta.isEmpty()) { %><span class="song-row-meta"><%= WebUtils.escapeHtml(meta) %></span><% } %>
                                    <span class="song-line" hidden></span>
                                </span>
                                <span class="song-go"><i class="fa-solid fa-arrow-right"></i></span>
                            </a>
        <%
            }
            if (songs == null) {
                out.println("<p class=\"empty-note\">" + t.getProperty("lyrics.loadError") + "</p>");
            } else if (songs.isEmpty()) {
                out.println("<p class=\"empty-note\">" + t.getProperty("lyrics.none") + "</p>");
            }
        %>
    </div>
<script src="/js/trim-bars.js?v=<%= assetVersion %>"></script>
<script>
(function () {
  var grid = document.getElementById('songGrid'), input = document.getElementById('lyricSearch');
  var chips = document.getElementById('yearChips'), none = document.getElementById('searchNone');
  if (!grid || !input) return;
  var cards = [].slice.call(grid.querySelectorAll('.song-row'));
  var heads = [].slice.call(grid.querySelectorAll('.song-year-head'));
  var year = '', hits = null, timer = 0, asked = '';
  // one chip per year, newest first; only the newest shows until "Older years" opens the rest
  var years = [];
  cards.forEach(function (c) { var y = c.dataset.year; if (y && years.indexOf(y) < 0) years.push(y); });
  years.sort().reverse().forEach(function (y, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = i ? 'chip older' : 'chip'; b.dataset.year = y; b.textContent = y;
    chips.appendChild(b);
  });
  var toggle = null;
  if (years.length > 1) {
    toggle = document.createElement('button');
    toggle.type = 'button'; toggle.className = 'chip chip-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span></span> <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>';
    toggle.firstChild.textContent = chips.dataset.older;
    chips.appendChild(toggle);
  }
  function setOpen(open) {
    chips.classList.toggle('open', open);
    if (toggle) toggle.setAttribute('aria-expanded', String(open));
  }
  chips.addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b) return;
    if (b === toggle) return setOpen(!chips.classList.contains('open'));
    chips.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('active', c === b); });
    year = b.dataset.year;
    setOpen(false);   // a picked older year stays visible on its own (it is .active)
    render();
  });
  function render() {
    var shown = 0;
    cards.forEach(function (c) {
      var hit = hits && hits[c.dataset.song];
      var ok = (!hits || !!hit) && (!year || c.dataset.year === year);
      c.hidden = !ok;
      var line = c.querySelector('.song-line');
      line.hidden = !(hit && hit.line);
      if (hit && hit.line) line.textContent = '„' + hit.line + '“';
      if (ok) shown++;
    });
    // a year heading only while one of its songs is shown
    heads.forEach(function (h) {
      h.hidden = !cards.some(function (c) { return !c.hidden && c.dataset.year === h.dataset.year; });
    });
    none.hidden = shown > 0;
  }
  input.addEventListener('input', function () {
    clearTimeout(timer);
    var q = input.value.trim();
    if (q.length < 2) { hits = null; asked = ''; return render(); }
    timer = setTimeout(function () {
      asked = q;
      fetch('/api/search?q=' + encodeURIComponent(q))
        .then(function (r) { return r.ok ? r.json() : []; })
        .catch(function () { return []; })
        .then(function (list) {
          if (asked !== q) return;   // an older answer that came late
          hits = {};
          list.forEach(function (s) { hits[s.id] = s; });
          render();
        });
    }, 220);
  });
})();
</script>
</main>

<%@ include file="includes/footer.jsp" %>
