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
  int nReports = st.getOrDefault("reports", 0), nClipsAlone = st.getOrDefault("clipsWithoutSong", 0), nNoText = st.getOrDefault("songsWithoutLyrics", 0), nSiteReports = st.getOrDefault("siteReports", 0), nLyricHelp = st.getOrDefault("lyricHelp", 0);
  // which ones, so the to-do list says what it means (a clip on YouTube that isn't joined to a song of the catalogue
  // doesn't show in the discography or among the lyrics)
  java.util.List<String[]> clipNames = new java.util.ArrayList<>(), noTextNames = new java.util.ArrayList<>();
  try {
    com.github.skeliit.dao.AdminDao todo = new com.github.skeliit.dao.AdminDao();
    if (nClipsAlone > 0) clipNames = todo.clipsWithoutSong();
    if (nNoText > 0) noTextNames = todo.songsWithoutLyrics();
  } catch (java.sql.SQLException e) {
    application.log("Admin to-do", e);
  }
  // Czech plurals: 1 / 2–4 / 5 and more
  String reportsText = nReports == 1 ? "nahlášený komentář čeká na rozhodnutí" : nReports < 5 ? "nahlášené komentáře čekají na rozhodnutí" : "nahlášených komentářů čeká na rozhodnutí";
  String clipsText = nClipsAlone == 1 ? "klip z YouTube zatím není u žádné písně" : nClipsAlone < 5 ? "klipy z YouTube zatím nejsou u žádné písně" : "klipů z YouTube zatím není u žádné písně";
  String clipsTail = nClipsAlone == 1 ? " – v Diskografii je jen jako klip, bez textu a bez stránky písně" : " – v Diskografii jsou jen jako klipy, bez textu a bez stránky písně";
  String clipsHint = "Přiřaď k písni v Textech, nebo odklikni ✓, když je to tak správně.";
  String siteReportsText = nSiteReports == 1 ? "problém nahlásil návštěvník Kevinovi" : nSiteReports < 5 ? "problémy nahlásili návštěvníci Kevinovi" : "problémů nahlásili návštěvníci Kevinovi";
  String lyricHelpText = nLyricHelp == 1 ? "text poslal návštěvník k písni, kde hledáme pomoc" : nLyricHelp < 5 ? "texty poslali návštěvníci k písním, kde hledáme pomoc" : "textů poslali návštěvníci k písním, kde hledáme pomoc";
  // píseň, ke které patří ten nejnovější (na její stránce v adminu jsou texty)
  int lyricHelpSong = 0;
  if (nLyricHelp > 0) {
    try { java.util.List<com.github.skeliit.model.LyricHelp> lh = new com.github.skeliit.dao.LyricHelpDao().sent(0); if (!lh.isEmpty()) lyricHelpSong = lh.get(0).songId; }
    catch (java.sql.SQLException e) { application.log("Lyric help", e); }
  }
  String noTextText = nNoText == 1 ? "píseň nemá text" : nNoText < 5 ? "písně nemají text" : "písní nemá text";
  // {link, icon, label, key}
  String[][] tiles = {
      // songs and clips are one thing (every song on YouTube has its clip); only a song with no clip, out just on
      // Spotify, is told apart under the number
      {"/admin/songs", "fa-music", "Písně", "songs"},
      {"/admin/lyrics", "fa-align-left", "Songy s textem", "lyrics"},
      {"/admin/comments", "fa-comments", "Komentáře", "comments"},
      {"/admin_users.jsp", "fa-users", "Uživatelé", "users"},
      {"/admin/newsletter", "fa-envelope-open-text", "Odběratelé", "subscribers"}
  };
%>
<main class="admin-page">
  <%@ include file="/includes/admin-nav.jspf" %>

<%
  // období dlaždic nahoře: 7 nebo 30 dní (porovnává se s předchozím stejně dlouhým obdobím)
  int dashDays = "30".equals(request.getParameter("days")) ? 30 : 7;
  java.util.List<com.github.skeliit.service.DashboardStats.Tile> kpis = new java.util.ArrayList<>();
  try { kpis = com.github.skeliit.service.DashboardStats.tiles(dashDays); } catch (java.sql.SQLException e) { application.log("Dashboard", e); }
%>
  <header class="admin-head">
    <h2>Admin</h2>
    <p class="admin-hello">Ahoj, <b><%= adminName %></b>. <span class="live-now"><i class="fa-solid fa-circle" aria-hidden="true"></i> <%= com.github.skeliit.service.VisitStats.onlineNow() %> právě na webu</span></p>
  </header>

  <%-- přehled za období: číslo, malá křivka po dnech a změna proti předchozímu období --%>
  <section class="kpi-board">
    <div class="kpi-head">
      <h3><i class="fa-solid fa-chart-line" aria-hidden="true"></i> Za posledních <%= dashDays %> dní</h3>
      <nav class="play-tabs play-period" aria-label="Období">
        <a href="/admin.jsp?days=7"<%= dashDays == 7 ? " class=\"on\" aria-current=\"true\"" : "" %>>7 dní</a>
        <a href="/admin.jsp?days=30"<%= dashDays == 30 ? " class=\"on\" aria-current=\"true\"" : "" %>>30 dní</a>
      </nav>
    </div>
    <div class="kpi-grid">
      <% for (com.github.skeliit.service.DashboardStats.Tile k : kpis) { %>
      <a class="kpi kpi-<%= k.getTrend() %>" href="/admin/stats">
        <span class="kpi-label"><i class="fa-solid <%= k.icon %>" aria-hidden="true"></i> <%= k.label %></span>
        <b class="kpi-value"><%= String.format(java.util.Locale.forLanguageTag("cs"), "%,d", k.getTotal()).replace(',', ' ') %></b>
        <span class="kpi-trend"><%= k.getTrendText() %></span>
        <%= k.getSpark() %>
        <% if (!k.hint.isEmpty()) { %><small class="kpi-hint"><%= k.hint %></small><% } %>
      </a>
      <% } %>
    </div>
  </section>


  <%-- what is waiting for the admin (the same list MC Kevin reads out) --%>
  <section class="admin-card admin-todo" id="todo">
    <h3><i class="fa-solid fa-list-check" aria-hidden="true"></i> Co čeká</h3>
    <% if (nReports + nClipsAlone + nNoText + nSiteReports + nLyricHelp == 0) { %>
      <p class="admin-done"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Všechno hotovo. Můžeš jít nahrávat.</p>
    <% } else { %>
    <ul>
      <% if (nReports > 0) { %><li class="urgent"><a href="/admin/comments#reports"><i class="fa-solid fa-flag"></i> <span><b><%= nReports %></b> <%= reportsText %></span></a></li><% } %>
      <% if (nSiteReports > 0) { %><li class="urgent"><a href="/admin/feedback#reports"><i class="fa-solid fa-triangle-exclamation"></i> <span><b><%= nSiteReports %></b> <%= siteReportsText %></span></a></li><% } %>
      <% if (nLyricHelp > 0) { %><li><a href="/admin/song?id=<%= lyricHelpSong %>#lyric-help"><i class="fa-solid fa-pen-nib"></i> <span><b><%= nLyricHelp %></b> <%= lyricHelpText %><small>Přečti je u písně v kartě Hledáme pomoc s textem, opiš do textu a smaž.</small></span></a></li><% } %>
      <% if (nClipsAlone > 0) { %><li><a href="/admin/lyrics"><i class="fa-solid fa-film"></i> <span><b><%= nClipsAlone %></b> <%= clipsText %><%= clipsTail %><small><%= clipsHint %></small></span></a><ul class="todo-items"><% for (String[] it : clipNames) { %><li><span><%= com.github.skeliit.WebUtils.escapeHtml(it[1]) %></span><form method="post" action="/admin/todo"><input type="hidden" name="csrf" value="${csrf}"><input type="hidden" name="kind" value="clip"><input type="hidden" name="id" value="<%= com.github.skeliit.WebUtils.escapeHtml(it[0]) %>"><button type="submit" class="todo-ok" title="Hotovo – takhle je to správně, už neukazovat" aria-label="Hotovo: <%= com.github.skeliit.WebUtils.escapeHtml(it[1]) %>"><i class="fa-solid fa-check" aria-hidden="true"></i></button></form></li><% } %></ul></li><% } %>
      <% if (nNoText > 0) { %><li><a href="/admin/lyrics"><i class="fa-solid fa-align-left"></i> <span><b><%= nNoText %></b> <%= noTextText %><small>Když má píseň zůstat bez textu, odklikni ✓.</small></span></a><ul class="todo-items"><% for (String[] it : noTextNames) { %><li><span><%= com.github.skeliit.WebUtils.escapeHtml(it[1]) %></span><form method="post" action="/admin/todo"><input type="hidden" name="csrf" value="${csrf}"><input type="hidden" name="kind" value="song"><input type="hidden" name="id" value="<%= com.github.skeliit.WebUtils.escapeHtml(it[0]) %>"><button type="submit" class="todo-ok" title="Hotovo – takhle je to správně, už neukazovat" aria-label="Hotovo: <%= com.github.skeliit.WebUtils.escapeHtml(it[1]) %>"><i class="fa-solid fa-check" aria-hidden="true"></i></button></form></li><% } %></ul></li><% } %>
    </ul>
    <% } %>
  </section>

<%
  // visits at a glance (the details and charts are on /admin/stats)
  java.util.Map<String, Object> vs = new java.util.HashMap<>();
  int chartDays = dashDays == 30 ? 30 : 14;
  long[] visitDays = new long[chartDays];
  try {
    vs = com.github.skeliit.service.VisitStats.summary();
    visitDays = com.github.skeliit.service.VisitStats.dailyVisits(chartDays);
  } catch (java.sql.SQLException e) {
    application.log("Visit stats", e);
  }
  long visitMax = 1;
  for (long d : visitDays) visitMax = Math.max(visitMax, d);
  // under the arrow: the other numbers and the top 5 of the last 7 days of each kind
  String[][] moreTiles = {
      {"yesterday", "fa-clock-rotate-left", "Lidí včera"},
      {"days30", "fa-calendar", "Návštěv za 30 dní"},
      {"allVisits", "fa-infinity", "Návštěv celkem"},
      {"pagesAll", "fa-layer-group", "Stránek celkem"}
  };
  String[][] topKinds = {{"lyric", "fa-align-left", "Texty"}, {"karaoke", "fa-microphone", "Karaoke"}, {"clip", "fa-play", "Klipy"}};
  java.util.Map<String, java.util.List<String[]>> tops = new java.util.LinkedHashMap<>();
  for (String[] k : topKinds) {
    try {
      tops.put(k[0], com.github.skeliit.service.VisitStats.topPlays(k[0], 7, 5));
    } catch (java.sql.SQLException e) {
      application.log("Play stats", e);
      tops.put(k[0], new java.util.ArrayList<>());
    }
  }
%>
  <section class="admin-card admin-glance">
    <div class="admin-glance-head">
      <h3><i class="fa-solid fa-chart-column" aria-hidden="true"></i> Lidé po dnech</h3>
      <a href="/admin/stats">Všechny statistiky a grafy <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
    </div>
    <div class="play-days admin-spark" role="img" aria-label="Lidé po dnech za posledních <%= chartDays %> dní">
      <% for (int i = 0; i < visitDays.length; i++) { %><span class="play-day<%= visitDays[i] == 0 ? " zero" : "" %>" style="--h: <%= Math.round(visitDays[i] * 100.0 / visitMax) %>%; --v: <%= Math.round(visitDays[i] * 100.0 / visitMax) %>" title="<%= visitDays[i] %> lidí"><b><%= visitDays[i] > 0 ? visitDays[i] : "" %></b></span><% } %>
    </div>
    <p class="text-dim admin-spark-note">Lidé po dnech, posledních <%= chartDays %> dní (dnes vpravo).</p>
    <%-- the round arrow under the chart: the rest of the numbers, without leaving the dashboard --%>
    <details class="stats-more">
      <summary><span>Další statistiky</span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></summary>
      <div class="admin-stats admin-visits">
        <% for (String[] tile : moreTiles) { %>
        <div class="admin-stat">
          <i class="fa-solid <%= tile[1] %>" aria-hidden="true"></i>
          <b><%= vs.getOrDefault(tile[0], 0) %></b>
          <span><%= tile[2] %></span>
        </div>
        <% } %>
      </div>
      <p class="admin-more-k">Nejvíc puštěné za posledních 7 dní</p>
      <div class="admin-more-tops">
        <% for (String[] k : topKinds) { java.util.List<String[]> rows = tops.get(k[0]); long max = rows.isEmpty() ? 1 : Math.max(1, Long.parseLong(rows.get(0)[1])); %>
        <div class="admin-more-top">
          <h4><i class="fa-solid <%= k[1] %>" aria-hidden="true"></i> <%= k[2] %></h4>
          <% if (rows.isEmpty()) { %>
          <p class="text-dim">Zatím nic.</p>
          <% } else { %>
          <ol class="play-top">
            <% for (String[] row : rows) { long n = Long.parseLong(row[1]); long pct = Math.round(n * 100.0 / max); %>
            <li style="--w: <%= pct %>%; --v: <%= pct %>"><span class="play-name"><%= com.github.skeliit.WebUtils.escapeHtml(row[0]) %></span><b><%= n %>×</b></li>
            <% } %>
          </ol>
          <% } %>
        </div>
        <% } %>
      </div>
      <a class="admin-more-all" href="/admin/stats">Všechny statistiky a grafy <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
    </details>
  </section>

  <%-- co na webu je (písně, texty, komentáře, lidé): menší řádek dole, každá dlaždice vede tam, kde se s tím pracuje --%>
  <h3 class="admin-section-title"><i class="fa-solid fa-box-archive" aria-hidden="true"></i> Obsah webu</h3>
  <div class="admin-stats admin-content-stats">
    <% for (String[] tile : tiles) { int n = st.getOrDefault(tile[3], 0); boolean alert = "reports".equals(tile[3]) && n > 0; %>
    <a class="admin-stat<%= alert ? " alert" : "" %>" href="<%= tile[0] %>">
      <i class="fa-solid <%= tile[1] %>" aria-hidden="true"></i>
      <b><%= n %></b>
      <span><%= tile[2] %></span>
      <% if ("songs".equals(tile[3]) && st.getOrDefault("spotifyOnly", 0) > 0) { %><small><%= st.get("spotifyOnly") %> jen na Spotify</small><% } %>
    </a>
    <% } %>
  </div>
</main>

<%@ include file="includes/footer.jsp" %>
