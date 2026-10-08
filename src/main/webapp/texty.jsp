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
      <div class="filter-chips" id="yearChips" role="group" aria-label="${t['lyrics.filter.year']}" data-older="${t['lyrics.filter.older']}">
        <button type="button" class="chip active" data-year="">${t['lyrics.filter.all']}</button>
      </div>
    </sk:pageHero>
    <p class="empty-note" id="searchNone" hidden><%= t.getProperty("lyrics.search.none") %></p>
    <%-- one song per row, newest first, grouped by year: the title sits on the page background
         and the row fades into the song's clip thumbnail (or its preview photo) on the right --%>
    <div class="song-list" id="songGrid">
        <%
            boolean hadRows = false;
            java.util.Map<Integer, java.util.List<com.github.skeliit.model.SongClip>> clipsBySong =
                com.github.skeliit.model.SongClip.bySong();
            try {
                try (Connection conn = Db.get();
                         PreparedStatement ps = conn.prepareStatement(
                             "SELECT s.id AS song_id, s.uuid AS song_uuid, s.name AS song_name, s.year AS song_year, s.preview_image_url, MIN(l.id) AS lyric_id, " +
                             "(SELECT v.youtube_id FROM videos v WHERE v.song_id = s.id ORDER BY v.published_at DESC, v.id DESC LIMIT 1) AS youtube_id, " +
                             "(SELECT MAX(v.published_at) FROM videos v WHERE v.song_id = s.id) AS newest_clip, " +
                             "(SELECT lt.title FROM lyrics lt WHERE lt.song_id = s.id AND lt.lang = ? ORDER BY lt.id LIMIT 1) AS tr_title " +
                             "FROM lyrics l JOIN songs s ON s.id = l.song_id " +
                             "GROUP BY s.id, s.uuid, s.name, s.year, s.preview_image_url " +
                             "ORDER BY s.year DESC, newest_clip DESC, s.name ASC"
                         )) {
                        ps.setString(1, cur);
                        try (ResultSet rs = ps.executeQuery()) {
                        String lastYear = null;
                        while (rs.next()) {
                            hadRows = true;
                            com.github.skeliit.model.SongTitle st = com.github.skeliit.model.SongTitle.of(rs.getString("song_name"));
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
                                    ? "/" + cur + "/song/" + songUuid
                                    : "/lyrics/" + lyricId;
                            java.util.List<com.github.skeliit.model.SongClip> clips = clipsBySong.get(rs.getInt("song_id"));
                            String art = youtubeId != null && !youtubeId.isEmpty()
                                    ? "/yt-thumb/" + youtubeId + "/hqdefault.jpg" : preview;
                            String meta = st.credits;
                            if (clips != null && clips.size() > 1) {
                                meta = (meta.isEmpty() ? "" : meta + " · ") + clips.size() + " " + t.getProperty("music.versions", "verze");
                            }
                            String yearKey = y == null ? "" : String.valueOf(y);
                            if (!yearKey.equals(lastYear)) {
                                lastYear = yearKey;
        %>
                            <h2 class="song-year-head" data-year="<%= yearKey %>"><%= y == null ? "–" : y %></h2>
        <%
                            }
        %>
                            <a class="song-row" href="<%= com.github.skeliit.WebUtils.escapeHtml(href) %>" data-song="<%= rs.getInt("song_id") %>" data-year="<%= yearKey %>">
                                <span class="song-row-art" aria-hidden="true">
                                <% if (art != null) { %>
                                    <img src="<%= com.github.skeliit.WebUtils.escapeHtml(art) %>" alt="" loading="lazy">
                                <% } %>
                                </span>
                                <span class="song-row-text">
                                    <span class="song-row-title"><%= com.github.skeliit.WebUtils.escapeHtml(st.title) %></span>
                                    <% String tr = rs.getString("tr_title"); if (!"cs".equals(cur) && tr != null && !tr.isBlank()) { %><span class="song-row-sub" lang="<%= cur %>"><%= com.github.skeliit.WebUtils.escapeHtml(tr) %></span><% } %>
                                    <% if (!meta.isEmpty()) { %><span class="song-row-meta"><%= com.github.skeliit.WebUtils.escapeHtml(meta) %></span><% } %>
                                    <span class="song-line" hidden></span>
                                </span>
                                <span class="song-go"><i class="fa-solid fa-arrow-right"></i></span>
                            </a>
        <%
                        }
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
  var cards = [].slice.call(grid.querySelectorAll('.song-row'));
  var heads = [].slice.call(grid.querySelectorAll('.song-year-head'));
  // old clips have black (or white) bars baked into their thumbnail: find the plain columns at
  // the edges and swap in a copy without them (the thumbnails come from our own server, so the
  // canvas may read them)
  function trimBars(img) {
    var w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h || img.dataset.trimmed) return;
    img.dataset.trimmed = '1';
    try {
      var c = document.createElement('canvas'), sw = 96, sh = Math.round(96 * h / w);
      c.width = sw; c.height = sh;
      var x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(img, 0, 0, sw, sh);
      var d = x.getImageData(0, 0, sw, sh).data;
      var plain = function (col) {
        var sum = 0, sq = 0;
        for (var r = 0; r < sh; r++) {
          var i = (r * sw + col) * 4, l = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
          sum += l; sq += l * l;
        }
        var mean = sum / sh, sd = Math.sqrt(Math.max(0, sq / sh - mean * mean));
        return sd < 7 && (mean < 32 || mean > 232);
      };
      var left = 0, right = 0;
      while (left < sw / 2 && plain(left)) left++;
      while (right < sw / 2 && plain(sw - 1 - right)) right++;
      if (left < 4 && right < 4) return;                       // no real bars
      if (left + right > sw * 0.6) return;                     // a plain picture, not bars
      var l = Math.round(left / sw * w), r = Math.round(right / sw * w);
      var out = document.createElement('canvas');
      out.width = w - l - r; out.height = h;
      out.getContext('2d').drawImage(img, l, 0, w - l - r, h, 0, 0, w - l - r, h);
      img.src = out.toDataURL('image/jpeg', 0.88);
    } catch (e) { /* leave the thumbnail as it is */ }
  }
  grid.querySelectorAll('.song-row-art img').forEach(function (img) {
    if (img.complete) trimBars(img); else img.addEventListener('load', function () { trimBars(img); }, { once: true });
  });
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
