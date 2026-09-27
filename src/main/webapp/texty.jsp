<%@ page import="java.sql.*" %>
<%@ page import="com.github.skeliit.Db" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<main class="texty-page">
    <h2><%= t.getProperty("menu.lyrics","Lyrics") %></h2>
    <p class="page-lead"><%= t.getProperty("lyrics.subtitle") %></p>
    <div class="song-grid">
        <%
            boolean hadRows = false;
            try {
                try (Connection conn = Db.get();
                         PreparedStatement ps = conn.prepareStatement(
                             "SELECT s.id AS song_id, s.name AS song_name, s.year AS song_year, s.preview_image_url, MIN(l.id) AS lyric_id, " +
                             "(SELECT v.youtube_id FROM videos v WHERE v.song_id = s.id LIMIT 1) AS youtube_id " +
                             "FROM lyrics l JOIN songs s ON s.id = l.song_id " +
                             "GROUP BY s.id, s.name, s.year, s.preview_image_url " +
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
                            String youtubeId = rs.getString("youtube_id");
                            String preview = com.github.skeliit.WebUtils.safeUrl(rs.getString("preview_image_url"), null);
        %>
                            <a class="song-card" href="/lyrics/<%= lyricId %>">
                                <div class="song-thumb">
                                <% if (youtubeId != null && !youtubeId.isEmpty()) { %>
                                    <img src="https://img.youtube.com/vi/<%= com.github.skeliit.WebUtils.escapeHtml(youtubeId) %>/mqdefault.jpg" alt="" loading="lazy">
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
</main>

<%@ include file="includes/footer.jsp" %>
