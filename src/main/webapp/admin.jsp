<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<main>
  <h2>Admin</h2>
  <p>Středem je <strong>píseň</strong> — na ni se vážou texty, YouTube, Spotify, Apple Music a náhledový obrázek.</p>

  <div class="admin-grid">
    <section class="admin-card admin-card-wide admin-hero-card">
      <h3>Písně</h3>
      <p>Správa katalogu: média, náhled (Open Graph), texty.</p>
      <div class="admin-actions">
        <a class="admin-sync" href="/admin/songs">Otevřít katalog písní</a>
      </div>
    </section>

    <section class="admin-card">
      <h3>Synchronizace YouTube</h3>
      <div class="admin-actions">
        <a class="admin-sync" href="/admin/sync">Spustit sync</a>
      </div>
      <p class="text-dim">Načte videa z kanálu a spáruje je se songy. Jemné napojení děláš u konkrétní písně.</p>
    </section>

    <section class="admin-card">
      <h3>Synchronizace Instagramu</h3>
      <div class="admin-actions">
        <a class="admin-sync" href="/admin/instagram-sync">Spustit sync</a>
      </div>
      <p class="text-dim">Běží samo každou hodinu. Stáhne posledních 25 příspěvků ze skeli.official do Aktualit.</p>
    </section>

    <section class="admin-card">
      <h3>Přidat / upravit song a video</h3>
      <p class="text-dim">Song, který není na tvém kanálu (feat, cizí kanál, jen Spotify…): vlož odkaz na video a název songu – objeví se v Diskografii. Bez odkazu se přidá song bez videa.</p>
      <form method="post" action="/admin/video" style="display:grid; gap:8px;">
        <input type="hidden" name="csrf" value="${csrf}">
        <label>Odkaz na YouTube nebo ID videa: <input name="youtube_id" placeholder="https://www.youtube.com/watch?v=…"></label>
        <label>Název videa (nepovinné – jinak se vezme z YouTube): <input name="title"></label>
        <label>Název songu (vytvoří nebo propojí): <input name="song_name"></label>
        <label>Rok: <input name="year" type="number" min="1900" max="2100"></label>
        <label>Napojit na text (lyric ID): <input name="lyric_id" type="number" min="1"></label>
        <button type="submit">Uložit</button>
      </form>
    </section>

    <section class="admin-card">
      <h3>Texty písní</h3>
      <p><a class="link-btn" href="/admin/lyrics">Otevřít editor textů</a></p>
      <p class="text-dim">Vlož nebo uprav text kterékoli písně (CS/EN/DE/UK). Songy bez textu jsou v seznamu nahoře.</p>
    </section>

    <section class="admin-card">
      <h3>Synchronizace Apple Music</h3>
      <div class="admin-actions">
        <a class="admin-sync" href="/admin/apple-sync">Spustit sync</a>
      </div>
      <p class="text-dim">Doplní Apple Music ID (a timed lyrics, pokud jsou k dispozici).</p>
    </section>

    <section class="admin-card">
      <h3>Moderace komentářů</h3>
      <p class="text-dim">Upravit nebo smazat komentář můžeš i přímo u něj. Tady podle ID:</p>
      <form method="post" action="/admin/comment" class="admin-inline-form">
        <input type="hidden" name="csrf" value="${csrf}">
        <label>ID komentáře: <input name="comment_id" required></label>
        <label>Kde: <select name="kind"><option value="lyric">u textu</option><option value="video">u videa</option></select></label>
        <button type="submit" class="btn-delete">Smazat</button>
      </form>
    </section>

    <section class="admin-card admin-card-wide" id="reports">
      <h3>Nahlášené komentáře</h3>
      <%
        String reportSql =
            "SELECT r.kind, r.comment_id, COUNT(*) AS n, MAX(r.created_at) AS last_at, " +
            "       MAX(c.content) AS lyric_content, MAX(vc.content) AS video_content, " +
            "       MAX(uc.username) AS lyric_author, MAX(uv.username) AS video_author, " +
            "       MAX(c.lyric_id) AS lyric_id " +
            "FROM comment_reports r " +
            "LEFT JOIN comments c ON r.kind = 'lyric' AND c.id = r.comment_id " +
            "LEFT JOIN users uc ON uc.id = c.user_id " +
            "LEFT JOIN video_comments vc ON r.kind = 'video' AND vc.id = r.comment_id " +
            "LEFT JOIN users uv ON uv.id = vc.user_id " +
            "GROUP BY r.kind, r.comment_id " +
            "HAVING lyric_content IS NOT NULL OR video_content IS NOT NULL " +
            "ORDER BY n DESC, last_at DESC LIMIT 50";
        int reportRows = 0;
        try (java.sql.Connection rc = com.github.skeliit.Db.get();
             java.sql.PreparedStatement rps = rc.prepareStatement(reportSql);
             java.sql.ResultSet rrs = rps.executeQuery()) {
          while (rrs.next()) {
            reportRows++;
            String rKind = rrs.getString("kind");
            boolean rLyricKind = "lyric".equals(rKind);
            String rContent = rrs.getString(rLyricKind ? "lyric_content" : "video_content");
            String rAuthor = rrs.getString(rLyricKind ? "lyric_author" : "video_author");
            int rId = rrs.getInt("comment_id");
            int rLyric = rrs.getInt("lyric_id");
            String where = "lyric".equals(rKind) ? "<a href=\"/lyrics/" + rLyric + "#comment-" + rId + "\" target=\"_blank\">text #" + rLyric + "</a>" : "video";
      %>
        <div class="report-row">
          <div class="report-main">
            <div class="report-meta">
              <strong><%= com.github.skeliit.WebUtils.escapeHtml(rAuthor) %></strong>
              · <%= where %> · ID <%= rId %>
              · <span class="report-count"><i class="fa-solid fa-flag"></i> <%= rrs.getInt("n") %>×</span>
            </div>
            <div class="report-text"><%= com.github.skeliit.WebUtils.escapeHtml(rContent) %></div>
          </div>
          <div class="report-actions">
            <form method="post" action="/admin/comment">
              <input type="hidden" name="csrf" value="${csrf}">
              <input type="hidden" name="kind" value="<%= rKind %>">
              <input type="hidden" name="comment_id" value="<%= rId %>">
              <button type="submit" class="btn-delete" onclick="return confirm('Smazat tento komentář?')">Smazat komentář</button>
            </form>
            <form method="post" action="/admin/comment">
              <input type="hidden" name="csrf" value="${csrf}">
              <input type="hidden" name="kind" value="<%= rKind %>">
              <input type="hidden" name="comment_id" value="<%= rId %>">
              <input type="hidden" name="action" value="dismiss">
              <button type="submit" class="btn-dismiss">Zamítnout</button>
            </form>
          </div>
        </div>
      <%
          }
        } catch (java.sql.SQLException e) {
      %>
        <p class="form-alert">Nahlášené komentáře se nepodařilo načíst.</p>
      <%
        }
        if (reportRows == 0) {
      %>
        <p class="text-dim">Žádné nahlášené komentáře.</p>
      <% } %>
    </section>

    <section class="admin-card">
      <h3>Uživatelé</h3>
      <div class="admin-actions">
        <a href="/admin_users.jsp">Správa uživatelů</a>
      </div>
    </section>

    <section class="admin-card">
      <h3>Newsletter</h3>
      <div class="admin-actions">
        <a href="/admin/newsletter">Odběratelé</a>
      </div>
    </section>
  </div>
</main>

<%@ include file="includes/footer.jsp" %>
