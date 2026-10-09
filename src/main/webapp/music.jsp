<%@ page import="com.github.skeliit.dao.SongDao, com.github.skeliit.model.DiscoItem, com.github.skeliit.model.SongClip, com.github.skeliit.WebUtils" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="sk" tagdir="/WEB-INF/tags" %>

<main class="music-page">
  <sk:pageHero kicker='<%= t.getProperty("hero.kicker.music") %>'
               title='<%= t.getProperty("menu.music") %>' lead='<%= t.getProperty("music.lead") %>'/>

  <section class="section youtube">
    <h3 class="section-title"><span class="ico"><i class="fab fa-youtube icon-youtube"></i></span> <%= t.getProperty("music.videos") %></h3>
    <jsp:include page="/elliptic" flush="true" />
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
      try {
        disco = new SongDao().discography(cur);
        clipsBySong = SongClip.bySong();
      } catch (Exception e) {
        application.log("Diskografie", e);
      }
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
      <article class="song-card disco-card">
        <a class="song-thumb" <% if (mainHref != null) { %>href="<%= mainHref %>"<% if (!hasLyrics) { %> target="_blank" rel="noopener"<% } } %> aria-label="<%= nameHtml %>">
          <%
            if (versions != null && versions.size() > 1) {
              // two versions: the newest on top fading into the oldest below
          %>
            <span class="thumb-split">
              <img class="split-bottom" src="/yt-thumb/<%= WebUtils.escapeHtml(versions.get(versions.size() - 1).youtubeId) %>/mqdefault.jpg" alt="" loading="lazy">
              <img class="split-top" src="/yt-thumb/<%= WebUtils.escapeHtml(versions.get(0).youtubeId) %>/mqdefault.jpg" alt="" loading="lazy">
              <span class="split-tag split-tag-top"><%= WebUtils.escapeHtml(versions.get(0).label(t)) %></span>
              <span class="split-tag split-tag-bottom"><%= WebUtils.escapeHtml(versions.get(versions.size() - 1).label(t)) %></span>
            </span>
          <% } else if (yt != null) { %>
            <img src="/yt-thumb/<%= ytHtml %>/mqdefault.jpg" alt="" loading="lazy">
            <%-- on hover the cover shrinks into a sleeve and a record with it on the label slides out --%>
            <span class="vinyl" aria-hidden="true" style="--cover: url('/yt-thumb/<%= ytHtml %>/mqdefault.jpg')"></span>
          <% } else if (preview != null) { %>
            <img src="<%= WebUtils.escapeHtml(preview) %>" alt="" loading="lazy">
            <span class="vinyl" aria-hidden="true" style="--cover: url('<%= WebUtils.escapeHtml(preview) %>')"></span>
          <% } else { %>
            <span class="song-thumb-placeholder"><i class="fa-solid fa-music"></i></span>
          <% } %>
        </a>
        <div class="song-info">
          <span class="song-name"><%= nameHtml %><% String tr = d.translatedTitle; if (!"cs".equals(cur) && tr != null && !tr.isBlank()) { %><span class="song-row-sub" lang="<%= cur %>"><%= WebUtils.escapeHtml(tr) %></span><% } %></span>
          <% if (d.year != null) { %><span class="song-year"><%= d.year %></span><% } %>
        </div>
        <div class="disco-links">
          <%-- icons only, stacked on the right edge of the thumbnail; the name is in title/aria-label --%>
          <% if (lyricsHref != null) { %><a class="disco-lyrics" href="<%= lyricsHref %>" title="<%= t.getProperty("music.link.lyrics") %>" aria-label="<%= t.getProperty("music.link.lyrics") %>"><i class="fa-solid fa-align-left"></i></a><% } %>
          <% if (yt != null) { %><a class="disco-youtube" href="https://www.youtube.com/watch?v=<%= ytHtml %>" target="_blank" rel="noopener" title="YouTube" aria-label="YouTube"><i class="fab fa-youtube"></i></a><% } %>
          <a class="disco-spotify" href="<%= spotifyHref %>" target="_blank" rel="noopener" title="Spotify" aria-label="Spotify"><i class="fab fa-spotify"></i></a>
          <% if (appleHref != null) { %><a class="disco-apple" href="<%= appleHref %>" target="_blank" rel="noopener" title="Apple Music" aria-label="Apple Music"><i class="fab fa-apple"></i></a><% } %>
        </div>
        <% if (versions != null && versions.size() > 1) { %>
        <details class="disco-versions">
          <summary><%= versions.size() %> <%= t.getProperty("music.versions") %> <i class="fa-solid fa-chevron-down"></i></summary>
          <ul>
          <% for (SongClip clip : versions) { String cid = WebUtils.escapeHtml(clip.youtubeId); %>
            <li><a href="https://www.youtube.com/watch?v=<%= cid %>" target="_blank" rel="noopener">
              <img src="/yt-thumb/<%= cid %>/mqdefault.jpg" alt="" loading="lazy">
              <span><%= WebUtils.escapeHtml(clip.label(t)) %></span>
              <i class="fab fa-youtube"></i>
            </a></li>
          <% } %>
          </ul>
        </details>
        <% } %>
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
