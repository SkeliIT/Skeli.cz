<%@ page import="java.sql.*" %>
<%@ page import="com.github.skeliit.Db" %>
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
      <div class="filter-chips" id="yearChips" role="group" aria-label="${t['lyrics.filter.year']}">
        <button type="button" class="chip active" data-year="">${t['lyrics.filter.all']}</button>
      </div>
    </sk:pageHero>
    <p class="empty-note" id="searchNone" hidden><%= t.getProperty("lyrics.search.none") %></p>
    <div class="song-grid" id="songGrid">
        <%
            boolean hadRows = false;
            java.util.Map<Integer, java.util.List<com.github.skeliit.model.SongClip>> clipsBySong =
                com.github.skeliit.model.SongClip.bySong();
            try {
                try (Connection conn = Db.get();
                         PreparedStatement ps = conn.prepareStatement(
                             "SELECT s.id AS song_id, s.uuid AS song_uuid, s.name AS song_name, s.year AS song_year, s.preview_image_url, MIN(l.id) AS lyric_id, " +
                             "(SELECT v.youtube_id FROM videos v WHERE v.song_id = s.id ORDER BY v.published_at DESC, v.id DESC LIMIT 1) AS youtube_id " +
                             "FROM lyrics l JOIN songs s ON s.id = l.song_id " +
                             "GROUP BY s.id, s.uuid, s.name, s.year, s.preview_image_url " +
                             "ORDER BY s.year DESC, s.name ASC"
                         );
                         ResultSet rs = ps.executeQuery()) {
                        while (rs.next()) {
                            hadRows = true;
                            String name = rs.getString("song_name");
                            if (name != null) name = name.replaceFirst("(?i)^\\s*skeli\\s*-\\s*","" );
                            Object yearObj = rs.getObject("song_year");
                            Integer y = null;
                            if (yearObj != null) {
                                if (yearObj instanceof java.sql.Date) {
                                    y = ((java.sql.Date) yearObj).toLocalDate().getYear();
                                } else if (yearObj instanceof Number) {
                                    y = ((Number) yearObj).intValue();
                                } else {
                                    y = Integer.parseInt(yearObj.toString());
                                }
                            }
                            int lyricId = rs.getInt("lyric_id");
                            if (rs.wasNull() || lyricId <= 0) continue;
                            String songUuid = rs.getString("song_uuid");
                            String youtubeId = rs.getString("youtube_id");
                            String preview = com.github.skeliit.WebUtils.safeUrl(rs.getString("preview_image_url"), null);
                            String href = (songUuid != null && !songUuid.isBlank())
                                    ? "/cs/song/" + songUuid
                                    : "/lyrics/" + lyricId;
        %>
                            <a class="song-card" href="<%= com.github.skeliit.WebUtils.escapeHtml(href) %>" data-song="<%= rs.getInt("song_id") %>" data-year="<%= y == null ? "" : y %>">
                                <div class="song-thumb">
                                <%
                                  java.util.List<com.github.skeliit.model.SongClip> thumbClips = clipsBySong.get(rs.getInt("song_id"));
                                  if (thumbClips != null && thumbClips.size() > 1) {
                                    // two versions: the newest on top fading into the oldest below
                                %>
                                    <span class="thumb-split">
                                      <img class="split-bottom" src="/yt-thumb/<%= com.github.skeliit.WebUtils.escapeHtml(thumbClips.get(thumbClips.size() - 1).youtubeId) %>/mqdefault.jpg" alt="" loading="lazy">
                                      <img class="split-top" src="/yt-thumb/<%= com.github.skeliit.WebUtils.escapeHtml(thumbClips.get(0).youtubeId) %>/mqdefault.jpg" alt="" loading="lazy">
                                      <span class="split-tag split-tag-top"><%= com.github.skeliit.WebUtils.escapeHtml(thumbClips.get(0).label(t)) %></span>
                                      <span class="split-tag split-tag-bottom"><%= com.github.skeliit.WebUtils.escapeHtml(thumbClips.get(thumbClips.size() - 1).label(t)) %></span>
                                    </span>
                                <% } else if (youtubeId != null && !youtubeId.isEmpty()) { %>
                                    <img src="/yt-thumb/<%= com.github.skeliit.WebUtils.escapeHtml(youtubeId) %>/mqdefault.jpg" alt="" loading="lazy">
                                <% } else if (preview != null) { %>
                                    <img src="<%= com.github.skeliit.WebUtils.escapeHtml(preview) %>" alt="" loading="lazy">
                                <% } else { %>
                                    <span class="song-thumb-placeholder"><i class="fa-solid fa-music"></i></span>
                                <% } %>
                                </div>
                                <div class="song-info">
                                    <span class="song-name"><%= com.github.skeliit.WebUtils.escapeHtml(name) %></span>
                                    <% if (y != null) { %><span class="song-year"><%= y %></span><% } %>
                                </div>
                                <span class="song-line" hidden></span>
                                <span class="song-go"><i class="fa-solid fa-arrow-right"></i></span>
                            </a>
        <%
                        }
                } catch (SQLException e) {
                    out.println("<p class=\"empty-note\">" + t.getProperty("lyrics.loadError") + "</p>");
                }

                if (!hadRows) {
                    out.println("<p class=\"empty-note\">" + t.getProperty("lyrics.none") + "</p>");
                }
            } catch (Exception e) {
                out.println("<p class=\"empty-note\">" + t.getProperty("lyrics.loadError") + "</p>");
            }
        %>
    </div>
<script>
(function () {
  var grid = document.getElementById('songGrid'), input = document.getElementById('lyricSearch');
  var chips = document.getElementById('yearChips'), none = document.getElementById('searchNone');
  if (!grid || !input) return;
  var cards = [].slice.call(grid.querySelectorAll('.song-card'));
  var year = '', hits = null, timer = 0, asked = '';
  // one chip per year, newest first
  var years = [];
  cards.forEach(function (c) { var y = c.dataset.year; if (y && years.indexOf(y) < 0) years.push(y); });
  years.sort().reverse().forEach(function (y) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.dataset.year = y; b.textContent = y;
    chips.appendChild(b);
  });
  chips.addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b) return;
    chips.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('active', c === b); });
    year = b.dataset.year;
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
