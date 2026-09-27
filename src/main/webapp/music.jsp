<%@ page import="java.sql.*" %>
<%@ page import="com.github.skeliit.Db" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<main class="music-page">
  <h2><%= t.getProperty("menu.music","Music") %></h2>
  <p class="page-lead"><%= t.getProperty("music.lead") %></p>

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
      // Every song (newest first) and then the clips that aren't linked to a song
      String discoSql =
          "SELECT s.name, s.year, (SELECT MIN(l.id) FROM lyrics l WHERE l.song_id = s.id) AS lyric_id, " +
          "       (SELECT v.youtube_id FROM videos v WHERE v.song_id = s.id ORDER BY v.published_at DESC, v.id DESC LIMIT 1) AS yt, 0 AS grp, s.id AS ord, s.preview_image_url AS preview " +
          "FROM songs s " +
          "UNION ALL " +
          "SELECT v.title, NULL, NULL, v.youtube_id, 1, v.id, NULL FROM videos v WHERE v.song_id IS NULL " +
          "ORDER BY grp, year DESC, ord DESC";
      try (Connection conn = Db.get();
           PreparedStatement ps = conn.prepareStatement(discoSql);
           ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
          boolean isSong = rs.getInt("grp") == 0;
          String name = isSong ? rs.getString("name") : com.github.skeliit.VideoTitles.display(rs.getString("name"));
          if (name == null || name.isBlank()) name = "YouTube";
          if (isSong) name = name.replaceFirst("(?i)^\\s*skeli\\s*-\\s*", "");
          Object yearObj = rs.getObject("year");
          int lyricId = rs.getInt("lyric_id");
          boolean hasLyrics = !rs.wasNull() && lyricId > 0;
          String yt = rs.getString("yt");
          String preview = com.github.skeliit.WebUtils.safeUrl(rs.getString("preview"), null);
          String nameHtml = com.github.skeliit.WebUtils.escapeHtml(name);
          String ytHtml = yt == null ? null : com.github.skeliit.WebUtils.escapeHtml(yt);
          String mainHref = hasLyrics ? "/lyrics/" + lyricId : (yt != null ? "https://www.youtube.com/watch?v=" + ytHtml : null);
          String spotifyHref = "https://open.spotify.com/search/" + java.net.URLEncoder.encode("Skeli " + name, "UTF-8").replace("+", "%20");
    %>
      <article class="song-card disco-card">
        <a class="song-thumb" <% if (mainHref != null) { %>href="<%= mainHref %>"<% if (!hasLyrics) { %> target="_blank" rel="noopener"<% } } %> aria-label="<%= nameHtml %>">
          <% if (yt != null) { %>
            <img src="https://img.youtube.com/vi/<%= ytHtml %>/mqdefault.jpg" alt="" loading="lazy">
          <% } else if (preview != null) { %>
            <img src="<%= com.github.skeliit.WebUtils.escapeHtml(preview) %>" alt="" loading="lazy">
          <% } else { %>
            <span class="song-thumb-placeholder"><i class="fa-solid fa-music"></i></span>
          <% } %>
        </a>
        <div class="song-info">
          <span class="song-name"><%= nameHtml %></span>
          <% if (yearObj != null) { %><span class="song-year"><%= String.valueOf(yearObj).replaceAll("^(\\d{4}).*$", "$1") %></span><% } %>
        </div>
        <div class="disco-links">
          <%-- icons only, stacked on the right edge of the thumbnail; the name is in title/aria-label --%>
          <% if (hasLyrics) { %><a class="disco-lyrics" href="/lyrics/<%= lyricId %>" title="<%= t.getProperty("music.link.lyrics") %>" aria-label="<%= t.getProperty("music.link.lyrics") %>"><i class="fa-solid fa-align-left"></i></a><% } %>
          <% if (yt != null) { %><a class="disco-youtube" href="https://www.youtube.com/watch?v=<%= ytHtml %>" target="_blank" rel="noopener" title="YouTube" aria-label="YouTube"><i class="fab fa-youtube"></i></a><% } %>
          <a class="disco-spotify" href="<%= spotifyHref %>" target="_blank" rel="noopener" title="Spotify" aria-label="Spotify"><i class="fab fa-spotify"></i></a>
        </div>
      </article>
    <%
        }
      } catch (SQLException e) {
    %>
      <p class="empty-note"><%= t.getProperty("lyrics.loadError") %></p>
    <%
      }
    %>
    </div>
  </section>

  <section class="spotify-block" data-reveal>
    <div class="section-head">
      <h2><%= t.getProperty("music.spotify") %></h2>
      <a href="https://open.spotify.com/artist/5IouXw8U9uKCTwmncG5bUl" target="_blank" rel="noopener"><i class="fab fa-spotify"></i> Spotify <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
    </div>
    <div class="card spotify-embed">
      <iframe src="https://open.spotify.com/embed/artist/5IouXw8U9uKCTwmncG5bUl?utm_source=generator&amp;theme=0"
              title="Spotify – Skeli" loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
    </div>
  </section>
</main>

<%@ include file="includes/footer.jsp" %>
