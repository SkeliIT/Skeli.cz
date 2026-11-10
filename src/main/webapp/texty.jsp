<%@ page import="com.github.skeliit.dao.SongDao, com.github.skeliit.model.LyricListItem, com.github.skeliit.model.SongClip, com.github.skeliit.model.SongTitle, com.github.skeliit.WebUtils" %>
<%-- Karaoke má vlastní stránku /karaoke (KaraokeCinemaServlet); staré texty.jsp?karaoke=1 tam přesměruje --%>
<% if ("1".equals(request.getParameter("karaoke"))) { response.setStatus(301); response.setHeader("Location", "/karaoke"); return; }
   boolean karaokeMode = false; %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="sk" tagdir="/WEB-INF/tags" %>
<%
    // Texty i Karaoke na jedné stránce: Kolotoč písní (js/texty-wheel.js). Píseň uprostřed kola se rozsvítí
    // a ukáže verš a tlačítka Číst text / Zpívej; přepínač nahoře nechá v režimu Karaoke jen písně s časy.
    String kickerT = t.getProperty("hero.kicker.lyrics"), kickerK = t.getProperty("karaoke.kicker");
    String titleT = t.getProperty("menu.lyrics"), titleK = t.getProperty("menu.karaoke");
    String leadT = t.getProperty("lyrics.subtitle"), leadK = t.getProperty("karaoke.list.lead");
%>
<main class="texty-page<%= karaokeMode ? " k-mode" : "" %>">
    <sk:pageHero kicker='<%= karaokeMode ? kickerK : kickerT %>'
                 title='<%= karaokeMode ? titleK : titleT %>' lead='<%= karaokeMode ? leadK : leadT %>'>
      <%-- search by the name or by a word from the lyrics (/api/search), then by year --%>
      <form class="lyric-search" role="search" onsubmit="return false">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <input type="search" id="lyricSearch" autocomplete="off" maxlength="60"
               placeholder="${t['lyrics.search.placeholder']}" aria-label="${t['lyrics.search.placeholder']}">
      </form>
      <div class="filter-chips" id="yearChips" role="group" aria-label="${t['lyrics.filter.year']}" data-older="${t['lyrics.filter.older']}"
           data-all="${t['lyrics.filter.all']}"></div>
    </sk:pageHero>
    <p class="empty-note" id="searchNone" hidden data-t="<%= WebUtils.escapeHtml(t.getProperty("lyrics.search.none")) %>"
       data-k="<%= WebUtils.escapeHtml(t.getProperty("karaoke.list.none")) %>"></p>
    <%
        // dao/SongDao: songs with lyrics, newest first; null = they could not be read
        java.util.List<LyricListItem> songs = null;
        java.util.Map<Integer, String> lyricNotes = java.util.Map.of();   // nastříkané poznámky z adminu
        java.util.Map<Integer, java.util.List<SongClip>> clipsBySong = java.util.Map.of();
        java.util.Map<Integer, String> verses = java.util.Map.of();       // řádek z textu ke každé písni
        java.util.Set<String> singable = new java.util.HashSet<>();       // uuid písní, které mají karaoke
        try {
            songs = new SongDao().withLyrics(cur);
            lyricNotes = new com.github.skeliit.dao.SongNoteDao().active(com.github.skeliit.dao.SongNoteDao.Place.LYRICS, cur);
            clipsBySong = SongClip.bySong();
            verses = new SongDao().quoteLines();
            for (com.github.skeliit.model.KaraokeSong k : com.github.skeliit.web.site.KaraokeCinemaServlet.playable(application)) singable.add(k.uuid);
        } catch (Exception e) {
            application.log("Texty list", e);
        }
        boolean canSing = com.github.skeliit.web.site.KaraokeCinemaServlet.canSing(request);
    %>
    <div class="wheel-wrap" id="wheelWrap">
      <nav class="wheel-years" id="wheelYears" aria-hidden="true"></nav>
      <%-- Kolotoč: jedna píseň na řádek, nejnovější první; kolečkem, prstem i šipkami (↑ ↓, Enter otevře text) --%>
      <div class="lyric-wheel song-list" id="songGrid" tabindex="0" aria-label="${t['menu.lyrics']}">
        <div class="wheel-pad" aria-hidden="true"></div>
        <%
            if (songs != null) for (LyricListItem song : songs) {
                SongTitle st = SongTitle.of(song.name);
                String art = song.artUrl();
                String meta = st.credits;
                java.util.List<SongClip> clips = clipsBySong.get(song.songId);
                if (clips != null && clips.size() > 1) {
                    meta = (meta.isEmpty() ? "" : meta + " · ") + clips.size() + " " + t.getProperty("music.versions", "verze");
                }
                String yearKey = song.year == null ? "" : String.valueOf(song.year);
                boolean k = song.uuid != null && singable.contains(song.uuid);
                String verse = verses.get(song.songId);
                String path = WebUtils.escapeHtml(song.path(cur));
        %>
        <article class="song-row wheel-item" data-song="<%= song.songId %>" data-year="<%= yearKey %>"<%= k ? " data-k=\"1\"" : "" %>>
          <span class="song-row-art" aria-hidden="true">
          <% if (art != null) { %>
            <img src="<%= WebUtils.escapeHtml(art) %>" alt="" loading="lazy" data-trim-bars<% if (!song.artStyle.isEmpty()) { %> style="<%= song.artStyle %>" data-manual="1"<% } %>>
          <% } %>
          </span>
          <% String rowNote = lyricNotes.get(song.songId); if (rowNote != null) { %><span class="song-note song-note-mini song-note-row"><span><%= WebUtils.escapeHtml(rowNote) %></span></span><% } %>
          <span class="wheel-year"><%= song.year == null ? "–" : song.year %></span>
          <% if (k) { %><span class="wheel-kbadge"><i class="fa-solid fa-microphone" aria-hidden="true"></i><%= t.getProperty("menu.karaoke") %></span><% } %>
          <% if (verse != null && !verse.isBlank()) { %><p class="wheel-verse"><span class="kline">„<%= WebUtils.escapeHtml(verse) %>“</span></p><% } %>
          <a class="song-row-text" href="<%= path %>">
            <span class="song-row-title"><%= WebUtils.escapeHtml(st.title) %></span>
            <% String tr = song.translatedTitle; if (!"cs".equals(cur) && tr != null && !tr.isBlank()) { %><span class="song-row-sub" lang="<%= cur %>"><%= WebUtils.escapeHtml(tr) %></span><% } %>
            <% if (!meta.isEmpty()) { %><span class="song-row-meta"><%= WebUtils.escapeHtml(meta) %></span><% } %>
            <span class="song-line" hidden></span>
          </a>
          <div class="wheel-btns">
            <a class="wbtn wbtn-read" href="<%= path %>" tabindex="-1"><i class="fa-solid fa-align-left" aria-hidden="true"></i><%= t.getProperty("lyrics.read") %></a>
            <% if (k) { %>
            <a class="wbtn wbtn-sing" href="/karaoke-kino/<%= WebUtils.escapeHtml(song.uuid) %>" tabindex="-1"><i class="fa-solid fa-<%= canSing ? "microphone" : "lock" %>" aria-hidden="true"></i><%= t.getProperty("karaoke.sing") %><% if (!canSing) { %><small> · <%= t.getProperty("menu.membersOnly") %></small><% } %></a>
            <% } %>
          </div>
        </article>
        <%
            }
        %>
        <div class="wheel-pad" aria-hidden="true"></div>
      </div>
    </div>
    <%
        if (songs == null) {
            out.println("<p class=\"empty-note\">" + t.getProperty("lyrics.loadError") + "</p>");
        } else if (songs.isEmpty()) {
            out.println("<p class=\"empty-note\">" + t.getProperty("lyrics.none") + "</p>");
        }
    %>
<script src="/js/trim-bars.js?v=<%= assetVersion %>"></script>
<script src="/js/texty-wheel.js?v=<%= assetVersion %>"></script>
<%-- pozadí: video – tmavý režim kámen s vypáleným textem, světlý zamlžené okno --%>
<script src="/js/texty-bg.js?v=<%= assetVersion %>"></script>
</main>

<%@ include file="includes/footer.jsp" %>
