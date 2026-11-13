<%@ page import="com.github.skeliit.dao.SongDao, com.github.skeliit.model.DiscoItem, com.github.skeliit.model.SongClip, com.github.skeliit.WebUtils" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="sk" tagdir="/WEB-INF/tags" %>

<main class="music-page">
  <sk:pageHero kicker='<%= t.getProperty("hero.kicker.music") %>'
               title='<%= t.getProperty("menu.music") %>' lead='<%= t.getProperty("music.lead") %>'/>

  <section class="section youtube">
    <h3 class="section-title"><span class="ico"><i class="fab fa-youtube icon-youtube"></i></span> <%= t.getProperty("music.videos") %>
      <%@ include file="/includes/clip-fx-switch.jspf" %></h3>
    <jsp:include page="/elliptic" flush="true" />
    <script src="/js/clip-fx.js?v=<%= assetVersion %>"></script>
    <%-- comments under the clip that plays (the player sets data-target) --%>
    <% String cmtKind = "video", cmtTarget = ""; %>
    <div class="ep-comments-wrap"><%@ include file="/includes/comments.jspf" %></div>
  </section>

  <section class="discography" data-reveal>
    <div class="section-head">
      <h2><%= t.getProperty("music.discography") %></h2>
    </div>
    <div class="song-grid">
    <%
      // dao/SongDao: every song (newest first), then the clips that aren't linked to a song;
      // null = they could not be read
      java.util.List<DiscoItem> disco = null;
      java.util.Map<Integer, java.util.List<SongClip>> clipsBySong = java.util.Map.of();
      java.util.Map<Integer, String> musicNotes = java.util.Map.of();   // nastříkané poznámky z adminu
      java.util.Map<Integer, String> quoteLines = java.util.Map.of();   // řádek z textu na zadní straně karty
      try {
        disco = new SongDao().discography(cur);
        clipsBySong = SongClip.bySong();
        quoteLines = new SongDao().quoteLines();
        musicNotes = new com.github.skeliit.dao.SongNoteDao().active(com.github.skeliit.dao.SongNoteDao.Place.MUSIC, cur);
      } catch (Exception e) {
        application.log("Diskografie", e);
      }
      // ostré náhledy na výšku z klipů (tools/disco-nahledy.py, img/disco/<id>.webp); bez nich malý náhled z YouTube
      java.util.Set<String> discoImgs = application.getResourcePaths("/img/disco/");
      if (discoImgs == null) discoImgs = java.util.Set.of();
      // obrázek a jeho posun vybraný v adminu (karta „Obrázek v Diskografii“)
      java.util.Map<Integer, String[]> discoPicked = java.util.Map.of();
      try { discoPicked = new com.github.skeliit.dao.SongDao().discoPictures(); } catch (Exception e) { application.log("Diskografie obrázky", e); }
      if (disco != null) for (DiscoItem d : disco) {
        String nameHtml = WebUtils.escapeHtml(d.name);
        String yt = d.youtubeId;
        String ytHtml = yt == null ? null : WebUtils.escapeHtml(yt);
        String preview = d.previewUrl();
        String lyricsHref = d.lyricsPath(cur);
        boolean hasLyrics = lyricsHref != null;
        String mainHref = hasLyrics ? lyricsHref : d.youtubeUrl();
        String appleHref = d.appleMusicUrl();
        String spotifyHref = d.spotifyUrl();
        java.util.List<SongClip> versions = d.song ? clipsBySong.get(d.id) : null;
    %>
      <%-- otočná karta: vpředu náhled, název a rok; po najetí (na telefonu ťuknutím) se otočí a vzadu je řádek z textu,
           verze videa a odkazy k poslechu (js/effects.js: ťuknutí, klávesnice přes :focus-within) --%>
      <article class="song-card disco-card flip-card" tabindex="0">
       <div class="flip-in">
        <div class="flip-face flip-front">
          <span class="song-thumb">
          <% String[] picked = d.song ? discoPicked.get(d.id) : null; %>
          <% if (picked != null && picked[0] != null) { %>
            <img class="disco-picked<%= picked[1].isEmpty() ? "" : " placed" %>" src="<%= WebUtils.escapeHtml(picked[0]) %>" alt="" loading="lazy" style="<%= picked[1] %>">
          <% } else if (versions != null && versions.size() > 1) { %>
            <span class="thumb-split">
              <% String vb = versions.get(versions.size() - 1).youtubeId, vt = versions.get(0).youtubeId; %>
              <img class="split-bottom" src="<%= discoImgs.contains("/img/disco/" + vb + ".webp") ? "/img/disco/" + WebUtils.escapeHtml(vb) + ".webp" : "/yt-thumb/" + WebUtils.escapeHtml(vb) + "/mqdefault.jpg" %>" alt="" loading="lazy">
              <img class="split-top" src="<%= discoImgs.contains("/img/disco/" + vt + ".webp") ? "/img/disco/" + WebUtils.escapeHtml(vt) + ".webp" : "/yt-thumb/" + WebUtils.escapeHtml(vt) + "/mqdefault.jpg" %>" alt="" loading="lazy">
              <span class="split-tag split-tag-top"><%= WebUtils.escapeHtml(versions.get(0).label(t)) %></span>
              <span class="split-tag split-tag-bottom"><%= WebUtils.escapeHtml(versions.get(versions.size() - 1).label(t)) %></span>
            </span>
          <% } else if (yt != null) { %>
            <img class="<%= picked != null && !picked[1].isEmpty() ? "placed" : "" %>" src="<%= discoImgs.contains("/img/disco/" + yt + ".webp") ? "/img/disco/" + ytHtml + ".webp" : "/yt-thumb/" + ytHtml + "/mqdefault.jpg" %>" alt="" loading="lazy" style="<%= picked != null ? picked[1] : "" %>">
          <% } else if (preview != null) { %>
            <img src="<%= WebUtils.escapeHtml(preview) %>" alt="" loading="lazy">
          <% } else { %>
            <span class="song-thumb-placeholder"><i class="fa-solid fa-music"></i></span>
          <% } %>
          <% String cardNote = d.song ? musicNotes.get(d.id) : null; if (cardNote != null) { %><span class="song-note song-note-mini"><span><%= WebUtils.escapeHtml(cardNote) %></span></span><% } %>
          </span>
          <div class="song-info">
            <span class="song-name"><%= nameHtml %><% String tr = d.translatedTitle; if (!"cs".equals(cur) && tr != null && !tr.isBlank()) { %><span class="song-row-sub" lang="<%= cur %>"><%= WebUtils.escapeHtml(tr) %></span><% } %></span>
            <% if (d.year != null) { %><span class="song-year"><%= d.year %></span><% } %>
          </div>
          <span class="flip-hint" aria-hidden="true">↻</span>
        </div>
        <div class="flip-face flip-back">
          <b class="flip-name"><%= nameHtml %></b>
          <% if (d.year != null) { %><span class="song-year"><%= d.year %></span><% } %>
          <% String qLine = d.song ? quoteLines.get(d.id) : null; if (qLine != null) { %><p class="flip-quote" lang="cs">„<%= WebUtils.escapeHtml(qLine) %>“</p><% } %>
          <% if (versions != null && versions.size() > 1) { %>
          <details class="disco-versions">
            <summary><%= versions.size() %> <%= t.getProperty("music.versions") %> <i class="fa-solid fa-chevron-down"></i></summary>
            <ul>
            <% for (SongClip clip : versions) { String cid = WebUtils.escapeHtml(clip.youtubeId); %>
              <li><a href="https://www.youtube.com/watch?v=<%= cid %>" target="_blank" rel="noopener" data-play-yt="<%= cid %>"><img src="/yt-thumb/<%= cid %>/mqdefault.jpg" alt="" loading="lazy"><span><%= WebUtils.escapeHtml(clip.label(t)) %></span><i class="fab fa-youtube"></i></a></li>
            <% } %>
            </ul>
          </details>
          <% } %>
          <%-- ▶ Přehrát: video hraje přímo tady v přehrávači nahoře (EllipticPlayerServlet, událost skeli:playClip); na PC i klik na kartu.
               Bez videa velké tlačítko na text (s videem je text jen první ikona v liště, místo na telefonu nestačí). --%>
          <% if (yt != null) { %><button type="button" class="flip-play" data-play-yt="<%= ytHtml %>"><i class="fa-solid fa-play" aria-hidden="true"></i> <%= t.getProperty("music.play") %></button>
          <% } else if (hasLyrics) { %><a class="flip-open" href="<%= lyricsHref %>"><%= t.getProperty("music.link.lyrics") %> <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a><% } %>
          <%-- vždy čtyři místa (Text, YouTube, Spotify, Apple), co píseň nemá, zůstane prázdné --%>
          <nav class="disco-dock" aria-label="<%= nameHtml %>">
            <% if (lyricsHref != null) { %><a class="disco-lyrics" href="<%= lyricsHref %>" title="<%= t.getProperty("music.link.lyrics") %>" aria-label="<%= t.getProperty("music.link.lyrics") %>"><i class="fa-solid fa-align-left" aria-hidden="true"></i></a><% } else { %><span></span><% } %>
            <% if (yt != null) { %><a class="disco-youtube" href="https://www.youtube.com/watch?v=<%= ytHtml %>" target="_blank" rel="noopener" title="YouTube" aria-label="YouTube"><i class="fab fa-youtube" aria-hidden="true"></i></a><% } else { %><span></span><% } %>
            <a class="disco-spotify" href="<%= spotifyHref %>" target="_blank" rel="noopener" title="Spotify" aria-label="Spotify"><i class="fab fa-spotify" aria-hidden="true"></i></a>
            <% if (appleHref != null) { %><a class="disco-apple" href="<%= appleHref %>" target="_blank" rel="noopener" title="Apple Music" aria-label="Apple Music"><i class="fab fa-apple" aria-hidden="true"></i></a><% } else { %><span></span><% } %>
          </nav>
        </div>
       </div>
      </article>
    <%
      }
      if (disco == null) {
    %>
      <p class="empty-note"><%= t.getProperty("lyrics.loadError") %></p>
    <% } %>
    </div>
  </section>

  <section class="spotify-block" data-reveal>
    <div class="section-head">
      <h2><%= t.getProperty("music.spotify") %></h2>
      <span class="listen-links">
        <a href="https://open.spotify.com/artist/5IouXw8U9uKCTwmncG5bUl" target="_blank" rel="noopener"><i class="fab fa-spotify"></i> Spotify <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
        <a href="https://music.apple.com/cz/artist/skeli/1820513581" target="_blank" rel="noopener"><i class="fab fa-apple icon-apple"></i> Apple Music <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
      </span>
    </div>
    <%-- Spotify loads only after consent in the cookie bar or a click here (privacy) --%>
    <div class="card spotify-embed consent-embed">
      <div class="consent-embed-cover"><i class="fab fa-spotify" aria-hidden="true"></i><p><%= t.getProperty("consent.spotify") %></p><button type="button" class="btn btn-primary consent-embed-btn"><i class="fa-solid fa-play"></i> <%= t.getProperty("consent.load") %></button></div>
      <iframe data-consent-src="https://open.spotify.com/embed/artist/5IouXw8U9uKCTwmncG5bUl?utm_source=generator&amp;theme=0"
              title="Spotify – Skeli" loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
    </div>
  </section>
</main>

<%@ include file="includes/footer.jsp" %>
