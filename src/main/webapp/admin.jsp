<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%
  // the dashboard numbers (dao/AdminDao); the page still works when they can't be read
  java.util.Map<String, Integer> st = new java.util.HashMap<>();
  try {
    st = new com.github.skeliit.dao.AdminDao().stats();
  } catch (java.sql.SQLException e) {
    application.log("Admin stats", e);
  }
  String adminName = com.github.skeliit.WebUtils.escapeHtml(session.getAttribute("username"));
  int nReports = st.getOrDefault("reports", 0), nClipsAlone = st.getOrDefault("clipsWithoutSong", 0), nNoText = st.getOrDefault("songsWithoutLyrics", 0);
  // {link, icon, label, key}
  String[][] tiles = {
      {"/admin/songs", "fa-music", "Písně", "songs"},
      {"/admin/songs", "fa-film", "Klipy", "clips"},
      {"/admin/lyrics", "fa-align-left", "Songy s textem", "lyrics"},
      {"/admin/comments", "fa-comments", "Komentáře", "comments"},
      {"/admin_users.jsp", "fa-users", "Uživatelé", "users"},
      {"/admin/newsletter", "fa-envelope-open-text", "Odběratelé", "subscribers"},
      {"/admin/comments#reports", "fa-flag", "Nahlášené", "reports"}
  };
%>
<main class="admin-page">
  <%@ include file="/includes/admin-nav.jspf" %>

  <header class="admin-head">
    <h2>Admin</h2>
    <p class="admin-hello">Ahoj, <b><%= adminName %></b>. Tady máš přehled webu a všechno, co se dá upravit.</p>
  </header>

  <%-- the numbers at a glance; each tile leads where you work with it --%>
  <div class="admin-stats">
    <% for (String[] tile : tiles) { int n = st.getOrDefault(tile[3], 0); boolean alert = "reports".equals(tile[3]) && n > 0; %>
    <a class="admin-stat<%= alert ? " alert" : "" %>" href="<%= tile[0] %>">
      <i class="fa-solid <%= tile[1] %>" aria-hidden="true"></i>
      <b><%= n %></b>
      <span><%= tile[2] %></span>
    </a>
    <% } %>
  </div>

  <%-- what is waiting for the admin (the same list MC Kevin reads out) --%>
  <section class="admin-card admin-todo">
    <h3><i class="fa-solid fa-list-check" aria-hidden="true"></i> Co čeká</h3>
    <% if (nReports + nClipsAlone + nNoText == 0) { %>
      <p class="admin-done"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Všechno hotovo. Můžeš jít nahrávat.</p>
    <% } else { %>
    <ul>
      <% if (nReports > 0) { %><li class="urgent"><a href="/admin/comments#reports"><i class="fa-solid fa-flag"></i> <b><%= nReports %></b> nahlášených komentářů čeká na rozhodnutí</a></li><% } %>
      <% if (nClipsAlone > 0) { %><li><a href="/admin/lyrics"><i class="fa-solid fa-film"></i> <b><%= nClipsAlone %></b> klipů nemá song – v editoru textů z nich jedním klikem uděláš song</a></li><% } %>
      <% if (nNoText > 0) { %><li><a href="/admin/lyrics"><i class="fa-solid fa-align-left"></i> <b><%= nNoText %></b> songů nemá text</a></li><% } %>
    </ul>
    <% } %>
  </section>

<%
  // visits (VisitStats): no cookies, a visitor counts once a day; the admin's own visits are not counted
  java.util.Map<String, Object> vs = new java.util.HashMap<>();
  java.util.List<String[]> topLyrics = new java.util.ArrayList<>();
  try {
    vs = com.github.skeliit.service.VisitStats.summary();
    topLyrics = com.github.skeliit.service.VisitStats.topLyrics(5);
  } catch (java.sql.SQLException e) {
    application.log("Visit stats", e);
  }
  // {key, icon, label}
  String[][] visitTiles = {
      {"online", "fa-signal", "Právě na webu"},
      {"today", "fa-user", "Lidí dnes"},
      {"yesterday", "fa-clock-rotate-left", "Lidí včera"},
      {"days7", "fa-calendar-week", "Návštěv za 7 dní"},
      {"days30", "fa-calendar", "Návštěv za 30 dní"},
      {"pagesToday", "fa-file-lines", "Zobrazených stránek dnes"}
  };
%>
  <h3 class="admin-section-title" id="stats"><i class="fa-solid fa-chart-line" aria-hidden="true"></i> Návštěvnost</h3>
  <% if ("1".equals(request.getParameter("statsReset"))) { %>
  <p class="admin-flash"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Statistiky jsou vynulované, počítá se od teď.</p>
  <% } %>
  <div class="admin-stats admin-visits">
    <% for (String[] tile : visitTiles) { Object n = vs.getOrDefault(tile[0], 0); %>
    <div class="admin-stat<%= "online".equals(tile[0]) ? " live" : "" %>">
      <i class="fa-solid <%= tile[1] %>" aria-hidden="true"></i>
      <b><%= n %></b>
      <span><%= tile[2] %></span>
    </div>
    <% } %>
  </div>
  <div class="admin-grid">
    <section class="admin-card">
      <h3><i class="fa-solid fa-ranking-star" aria-hidden="true"></i> Nejčtenější texty</h3>
      <% if (topLyrics.isEmpty()) { %>
        <p class="text-dim">Zatím nikdo nic nečetl.</p>
      <% } else { %>
      <ol class="admin-top">
        <% for (String[] row : topLyrics) { %>
        <li><span><%= com.github.skeliit.WebUtils.escapeHtml(row[0]) %> <small><%= com.github.skeliit.WebUtils.escapeHtml(row[1]).toUpperCase() %></small></span> <b><%= row[2] %>×</b></li>
        <% } %>
      </ol>
      <% } %>
    </section>
    <section class="admin-card">
      <h3><i class="fa-solid fa-circle-info" aria-hidden="true"></i> Jak se počítá</h3>
      <p class="text-dim">Každý člověk se započítá jednou za den, text písně taky jen jednou za den. Roboti a tvoje návštěvy jako admina se nepočítají. Bez cookies, takže se počítají všichni, i ti, kdo v cookie liště odmítnou.</p>
      <p class="text-dim">Počítá se od: <b><%= com.github.skeliit.WebUtils.escapeHtml(vs.getOrDefault("since", "–")) %></b></p>
      <form method="post" action="/admin/stats-reset" class="admin-reset">
        <input type="hidden" name="csrf" value="${csrf}">
        <label class="checkbox-label"><input type="checkbox" name="confirm" value="ANO" required> Opravdu vynulovat počítadla (zobrazení textů i návštěvnost)</label>
        <button type="submit" class="btn-delete"><i class="fa-solid fa-rotate-left"></i> Vynulovat statistiky</button>
      </form>
    </section>
  </div>

  <h3 class="admin-section-title"><i class="fa-solid fa-compact-disc" aria-hidden="true"></i> Obsah</h3>
  <div class="admin-grid">
    <section class="admin-card admin-link-card">
      <h3>Katalog písní</h3>
      <p class="text-dim">Středem je píseň: na ni se vážou texty, klipy z YouTube, Spotify, Apple Music a náhledový obrázek.</p>
      <a class="admin-btn primary" href="/admin/songs"><i class="fa-solid fa-music"></i> Otevřít katalog</a>
    </section>
    <section class="admin-card admin-link-card">
      <h3>Texty písní</h3>
      <p class="text-dim">Vlož nebo uprav text kterékoli písně (CS/EN/DE/UK/VI). Songy bez textu a klipy bez songu jsou v seznamu nahoře.</p>
      <a class="admin-btn primary" href="/admin/lyrics"><i class="fa-solid fa-align-left"></i> Otevřít editor textů</a>
    </section>
    <section class="admin-card admin-card-wide">
      <h3>Přidat / upravit song a video</h3>
      <p class="text-dim">Song, který není na tvém kanálu (feat, cizí kanál, jen Spotify…): vlož odkaz na video a název songu – objeví se v Diskografii. Bez odkazu se přidá song bez videa.</p>
      <form method="post" action="/admin/video" class="admin-form admin-form-cols">
        <input type="hidden" name="csrf" value="${csrf}">
        <label class="span-2">Odkaz na YouTube nebo ID videa <input name="youtube_id" placeholder="https://www.youtube.com/watch?v=…"></label>
        <label>Název songu (vytvoří nebo propojí) <input name="song_name"></label>
        <label>Název videa (nepovinné – jinak z YouTube) <input name="title"></label>
        <label>Rok <input name="year" type="number" min="1900" max="2100"></label>
        <label>Napojit na text (lyric ID) <input name="lyric_id" type="number" min="1"></label>
        <button type="submit" class="span-2"><i class="fa-solid fa-floppy-disk"></i> Uložit</button>
      </form>
    </section>
  </div>

  <h3 class="admin-section-title" id="community"><i class="fa-solid fa-people-group" aria-hidden="true"></i> Komunita</h3>
  <div class="admin-grid">
    <section class="admin-card admin-link-card">
      <h3>Komentáře</h3>
      <p class="text-dim">Všechny komentáře u textů i klipů, nahlášené nahoře. Smazat nebo zamítnout nahlášení jedním klikem.</p>
      <a class="admin-btn" href="/admin/comments"><i class="fa-solid fa-comments"></i> Komentáře</a>
    </section>
    <section class="admin-card admin-link-card">
      <h3>Uživatelé</h3>
      <p class="text-dim">Role (uživatel / admin), smazání účtu.</p>
      <a class="admin-btn" href="/admin_users.jsp"><i class="fa-solid fa-users"></i> Správa uživatelů</a>
    </section>
    <section class="admin-card admin-link-card">
      <h3>Newsletter</h3>
      <p class="text-dim">Kdo odebírá novinky e-mailem a kdo už odběr potvrdil.</p>
      <a class="admin-btn" href="/admin/newsletter"><i class="fa-solid fa-envelope-open-text"></i> Odběratelé</a>
    </section>
  </div>

  <h3 class="admin-section-title" id="sync"><i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i> Synchronizace</h3>
  <section class="admin-card admin-sync-card">
    <div class="admin-sync-item">
      <i class="fab fa-youtube icon-youtube" aria-hidden="true"></i>
      <div><b>YouTube</b><span>Načte videa z kanálu a spáruje je se songy.</span></div>
      <a class="admin-btn" href="/admin/sync">Spustit</a>
    </div>
    <div class="admin-sync-item">
      <i class="fab fa-instagram icon-instagram" aria-hidden="true"></i>
      <div><b>Instagram</b><span>Běží samo každou hodinu: posledních 25 příspěvků do Aktualit.</span></div>
      <a class="admin-btn" href="/admin/instagram-sync">Spustit</a>
    </div>
    <div class="admin-sync-item">
      <i class="fab fa-apple" aria-hidden="true"></i>
      <div><b>Apple Music</b><span>Najde písně v katalogu Apple Music a doplní odkazy (zdarma, bez klíčů). Časovaný text jen s placeným účtem Apple Developer.</span>
<%
  // result of /admin/apple-sync (numbers only, never echoed as text)
  String appleRes = request.getParameter("apple");
  if ("error".equals(appleRes)) {
%>
        <span class="admin-sync-result warn">Katalog Apple Music teď nejde načíst. Zkus to prosím později.</span>
<% } else if (appleRes != null && appleRes.matches("[0-9]{1,4}")) {
     String miss = request.getParameter("appleMissing"), lyr = request.getParameter("appleLyrics");
     miss = miss != null && miss.matches("[0-9]{1,4}") ? miss : "0";
     lyr = lyr != null && lyr.matches("[0-9]{1,4}") ? lyr : "0";
%>
        <span class="admin-sync-result">Hotovo: doplněno <b><%= appleRes %></b>, bez Apple Music zůstává <b><%= miss %></b> (featy u jiných interpretů, songy, které na Apple Music nejsou)<% if (!"0".equals(lyr)) { %>, časovaných textů: <b><%= lyr %></b><% } %>.</span>
<% } %>
      </div>
      <a class="admin-btn" href="/admin/apple-sync">Spustit</a>
    </div>
    <div class="admin-sync-item">
      <i class="fa-solid fa-file-zipper" aria-hidden="true"></i>
      <div><b>Export textů</b><span>Stáhne všechny texty jako soubory TTML v archivu ZIP, např. pro Apple Music přes DistroKid.</span></div>
      <a class="admin-btn" href="/admin/lyrics-export">Stáhnout</a>
    </div>
  </section>
</main>

<%@ include file="includes/footer.jsp" %>
