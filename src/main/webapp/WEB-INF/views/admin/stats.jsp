<%@ include file="/includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%-- /admin/stats (AdminPagesServlet): visits and what is played most --%>
<main class="admin-page admin-stats-page">
  <%@ include file="/includes/admin-nav.jspf" %>
  <h2 class="admin-page-title">Statistiky</h2>
<%
  // what is played most (VisitStats.countPlay): lyrics read, karaoke entered, clips started – per day, no personal data
  String playKind = request.getParameter("plays");
  if (playKind == null || !com.github.skeliit.service.VisitStats.PLAY_KINDS.contains(playKind)) playKind = "lyric";
  String periodParam = request.getParameter("period");
  int period = "7".equals(periodParam) ? 7 : "0".equals(periodParam) ? 0 : 30;
  int chartDays = period == 7 ? 7 : 30;
  java.util.List<String[]> topPlays = new java.util.ArrayList<>();
  long[] daily = new long[chartDays];
  try {
    topPlays = com.github.skeliit.service.VisitStats.topPlays(playKind, period, 10);
    daily = com.github.skeliit.service.VisitStats.dailyPlays(playKind, chartDays);
  } catch (java.sql.SQLException e) {
    application.log("Play stats", e);
  }
  long dayMax = 1, dayTotal = 0;
  for (long d : daily) { dayMax = Math.max(dayMax, d); dayTotal += d; }
  long topMax = topPlays.isEmpty() ? 1 : Math.max(1, Long.parseLong(topPlays.get(0)[1]));
  String[][] playTabs = {{"lyric", "fa-align-left", "Texty"}, {"karaoke", "fa-microphone", "Karaoke"}, {"clip", "fa-play", "Hudba (klipy)"}};
  String[][] periods = {{"7", "7 dní"}, {"30", "30 dní"}, {"0", "Celkem"}};
  java.time.LocalDate firstDay = java.time.LocalDate.now(java.time.ZoneId.of("Europe/Prague")).minusDays(chartDays - 1);
  java.time.format.DateTimeFormatter dm = java.time.format.DateTimeFormatter.ofPattern("d. M.");
%>
  <section class="admin-card play-card" id="plays">
    <h3><i class="fa-solid fa-chart-column" aria-hidden="true"></i> Co se nejvíc pouští</h3>
    <div class="play-switch">
      <nav class="play-tabs" aria-label="Co počítat">
        <% for (String[] tab : playTabs) { %>
        <a href="?plays=<%= tab[0] %>&amp;period=<%= period %>#plays" class="<%= tab[0].equals(playKind) ? "on" : "" %>"<%= tab[0].equals(playKind) ? " aria-current=\"page\"" : "" %>><i class="fa-solid <%= tab[1] %>" aria-hidden="true"></i> <%= tab[2] %></a>
        <% } %>
      </nav>
      <nav class="play-tabs play-period" aria-label="Období">
        <% for (String[] p : periods) { boolean on = p[0].equals(String.valueOf(period)); %>
        <a href="?plays=<%= playKind %>&amp;period=<%= p[0] %>#plays" class="<%= on ? "on" : "" %>"<%= on ? " aria-current=\"page\"" : "" %>><%= p[1] %></a>
        <% } %>
      </nav>
    </div>
    <%-- one column a day; the newest on the right --%>
    <figure class="play-chart">
      <figcaption>Po dnech, posledních <%= chartDays %> dní: <b><%= dayTotal %></b> celkem</figcaption>
      <div class="play-days" role="img" aria-label="Spuštění po dnech za posledních <%= chartDays %> dní, celkem <%= dayTotal %>">
        <% for (int i = 0; i < daily.length; i++) { java.time.LocalDate d = firstDay.plusDays(i); %>
        <span class="play-day<%= daily[i] == 0 ? " zero" : "" %>" style="--h: <%= Math.round(daily[i] * 100.0 / dayMax) %>%; --v: <%= Math.round(daily[i] * 100.0 / dayMax) %>" title="<%= d.format(dm) %>: <%= daily[i] %>×"><b><%= daily[i] > 0 ? daily[i] : "" %></b></span>
        <% } %>
      </div>
      <div class="play-axis"><span><%= firstDay.format(dm) %></span><span><%= firstDay.plusDays(chartDays / 2).format(dm) %></span><span>dnes</span></div>
    </figure>
    <% if (topPlays.isEmpty()) { %>
      <p class="text-dim">Za tohle období zatím nic. Počítá se od nasazení téhle verze webu.</p>
    <% } else { %>
    <ol class="play-top">
      <% for (String[] row : topPlays) { long n = Long.parseLong(row[1]); %>
      <li style="--w: <%= Math.round(n * 100.0 / topMax) %>%; --v: <%= Math.round(n * 100.0 / topMax) %>"><span class="play-name"><%= com.github.skeliit.WebUtils.escapeHtml(row[0]) %></span><b><%= n %>×</b></li>
      <% } %>
    </ol>
    <% } %>
    <p class="text-dim play-note">Každý člověk se u každé písně nebo klipu započítá jednou za den. Texty = otevřený text písně, Karaoke = vstup do kina, Hudba = spuštěný klip (na Hudbě, u písně i v Kevinově televizi). Roboti a admini se nepočítají.</p>
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
      {"allVisits", "fa-infinity", "Návštěv celkem"},
      {"pagesToday", "fa-file-lines", "Zobrazených stránek dnes"},
      {"pagesAll", "fa-layer-group", "Zobrazených stránek celkem"}
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

<%
  // ---------- Marketing: odkud lidi chodí, kdy, z čeho, kam klikají ven, co hledají (service/MarketingStats) ----------
  int mDays = 30;
  try { mDays = Integer.parseInt(String.valueOf(request.getParameter("mdays"))); } catch (NumberFormatException e) { mDays = 30; }
  if (mDays != 7 && mDays != 90) mDays = 30;
  java.util.List<String[]> mSources = new java.util.ArrayList<>(), mCampaigns = new java.util.ArrayList<>(), mDevices = new java.util.ArrayList<>(),
      mLangs = new java.util.ArrayList<>(), mOut = new java.util.ArrayList<>(), mOutPages = new java.util.ArrayList<>(), mSearch = new java.util.ArrayList<>();
  long[][] mWeek = new long[7][24];
  try {
    mSources = com.github.skeliit.service.MarketingStats.visitsBy("source", mDays);
    mCampaigns = com.github.skeliit.service.MarketingStats.visitsBy("campaign", mDays);
    mDevices = com.github.skeliit.service.MarketingStats.visitsBy("device", mDays);
    mLangs = com.github.skeliit.service.MarketingStats.visitsBy("lang", mDays);
    mOut = com.github.skeliit.service.MarketingStats.clicksByTarget(mDays);
    mOutPages = com.github.skeliit.service.MarketingStats.clicksByPage(mDays);
    mSearch = com.github.skeliit.service.MarketingStats.topSearches(mDays, 15);
    mWeek = com.github.skeliit.service.MarketingStats.weekHours(mDays);
  } catch (java.sql.SQLException e) {
    application.log("Marketing stats", e);
  }
  // jak se co jmenuje a jakou má ikonu
  java.util.Map<String, String[]> mLabel = new java.util.HashMap<>();
  mLabel.put("primo", new String[]{"Napřímo (zadaná adresa, záložka, odkaz ze zprávy)", "fa-solid fa-link"});
  mLabel.put("instagram", new String[]{"Instagram", "fa-brands fa-instagram"});
  mLabel.put("facebook", new String[]{"Facebook", "fa-brands fa-facebook"});
  mLabel.put("youtube", new String[]{"YouTube", "fa-brands fa-youtube"});
  mLabel.put("tiktok", new String[]{"TikTok", "fa-brands fa-tiktok"});
  mLabel.put("spotify", new String[]{"Spotify", "fa-brands fa-spotify"});
  mLabel.put("apple", new String[]{"Apple Music", "fa-brands fa-apple"});
  mLabel.put("google", new String[]{"Google", "fa-brands fa-google"});
  mLabel.put("seznam", new String[]{"Seznam", "fa-solid fa-magnifying-glass"});
  mLabel.put("bing", new String[]{"Bing", "fa-solid fa-magnifying-glass"});
  mLabel.put("duckduckgo", new String[]{"DuckDuckGo", "fa-solid fa-magnifying-glass"});
  mLabel.put("x", new String[]{"X (Twitter)", "fa-solid fa-hashtag"});
  mLabel.put("whatsapp", new String[]{"WhatsApp", "fa-brands fa-whatsapp"});
  mLabel.put("discord", new String[]{"Discord", "fa-brands fa-discord"});
  java.util.Map<String, String> mDevice = java.util.Map.of("mobil", "Mobil", "pc", "Počítač", "tablet", "Tablet");
  java.util.Map<String, String> mPage = java.util.Map.of("song", "stránka písně", "music", "Hudba", "home", "úvod", "lyrics", "Texty",
      "about", "O nás", "news", "Aktuality", "karaoke", "Karaoke", "other", "jinde");
  long mTotal = 0;
  for (String[] r : mSources) mTotal += Long.parseLong(r[1]);
  long mDevTotal = 0;
  for (String[] r : mDevices) mDevTotal += Long.parseLong(r[1]);
  long mOutTotal = 0, mOutMax = 1;
  for (String[] r : mOut) { mOutTotal += Long.parseLong(r[1]); mOutMax = Math.max(mOutMax, Long.parseLong(r[1])); }
  long mSrcMax = 1;
  for (String[] r : mSources) mSrcMax = Math.max(mSrcMax, Long.parseLong(r[1]));
  long mWeekMax = 1;
  for (long[] d : mWeek) for (long h : d) mWeekMax = Math.max(mWeekMax, h);
  String[] mDayNames = {"Po", "Út", "St", "Čt", "Pá", "So", "Ne"};
%>
  <h3 class="admin-section-title" id="marketing"><i class="fa-solid fa-bullhorn" aria-hidden="true"></i> Marketing</h3>
  <nav class="play-tabs play-period mk-period" aria-label="Období">
    <% for (int d : new int[]{7, 30, 90}) { %>
    <a href="/admin/stats?mdays=<%= d %>#marketing"<%= d == mDays ? " class=\"on\" aria-current=\"true\"" : "" %>><%= d %> dní</a>
    <% } %>
  </nav>
  <p class="text-dim mk-note">Počítá se od 22. 10. 2026, jen počty – bez cookies, bez IP adres, nic se nespojuje s konkrétním člověkem.</p>
  <div class="admin-grid mk-grid">
    <section class="admin-card mk-card">
      <h3><i class="fa-solid fa-route" aria-hidden="true"></i> Odkud lidi chodí <small><%= mTotal %> návštěv</small></h3>
      <% if (mSources.isEmpty()) { %><p class="text-dim">Zatím žádná data – nasbírají se během pár dní.</p><% } else { %>
      <ol class="mk-bars">
        <% for (String[] r : mSources) { long n = Long.parseLong(r[1]); String[] lb = mLabel.getOrDefault(r[0], new String[]{r[0], "fa-solid fa-globe"}); %>
        <li style="--w: <%= Math.round(n * 100.0 / mSrcMax) %>%">
          <i class="<%= lb[1] %>" aria-hidden="true"></i>
          <span class="mk-name"><%= com.github.skeliit.WebUtils.escapeHtml(lb[0]) %></span>
          <b><%= n %></b><small><%= Math.round(n * 100.0 / Math.max(1, mTotal)) %> %</small>
        </li>
        <% } %>
      </ol>
      <% } %>
    </section>

    <section class="admin-card mk-card">
      <h3><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> Kam klikají ven <small><%= mOutTotal %> kliknutí</small></h3>
      <% if (mOut.isEmpty()) { %><p class="text-dim">Zatím nikdo neklikl na Spotify, Apple Music ani YouTube.</p><% } else { %>
      <ol class="mk-bars mk-out">
        <% for (String[] r : mOut) { long n = Long.parseLong(r[1]); String[] lb = mLabel.getOrDefault(r[0], new String[]{r[0], "fa-solid fa-globe"}); %>
        <li class="mk-<%= r[0] %>" style="--w: <%= Math.round(n * 100.0 / mOutMax) %>%">
          <i class="<%= lb[1] %>" aria-hidden="true"></i>
          <span class="mk-name"><%= com.github.skeliit.WebUtils.escapeHtml(lb[0]) %></span>
          <b><%= n %></b><small><%= Math.round(n * 100.0 / Math.max(1, mOutTotal)) %> %</small>
        </li>
        <% } %>
      </ol>
      <p class="text-dim mk-sub">Odkud: <% boolean first = true; for (String[] r : mOutPages) { %><%= first ? "" : " · " %><%= com.github.skeliit.WebUtils.escapeHtml(mPage.getOrDefault(r[0], r[0])) %> <b><%= r[1] %></b><% first = false; } %></p>
      <% } %>
    </section>

    <section class="admin-card mk-card mk-wide">
      <h3><i class="fa-solid fa-clock" aria-hidden="true"></i> Kdy lidi chodí <small>čím zlatější, tím víc lidí – hodí se, kdy postovat</small></h3>
      <div class="mk-heat" role="img" aria-label="Návštěvy podle dne v týdnu a hodiny">
        <span class="mk-corner"></span>
        <% for (int h = 0; h < 24; h++) { %><span class="mk-hour"><%= h % 3 == 0 ? String.valueOf(h) : "" %></span><% } %>
        <% for (int d = 0; d < 7; d++) { %>
          <span class="mk-day"><%= mDayNames[d] %></span>
          <% for (int h = 0; h < 24; h++) { long n = mWeek[d][h]; %><span class="mk-cell" style="--a: <%= n == 0 ? 0 : Math.round(15 + n * 85.0 / mWeekMax) %>" title="<%= mDayNames[d] %> <%= h %>:00–<%= h %>:59: <%= n %> návštěv"></span><% } %>
        <% } %>
      </div>
    </section>

    <section class="admin-card mk-card">
      <h3><i class="fa-solid fa-mobile-screen" aria-hidden="true"></i> Zařízení a jazyk</h3>
      <% if (mDevices.isEmpty()) { %><p class="text-dim">Zatím žádná data.</p><% } else { %>
      <div class="mk-split" role="img" aria-label="Podíl zařízení">
        <% for (String[] r : mDevices) { long n = Long.parseLong(r[1]); %><span class="mk-dev-<%= r[0] %>" style="flex: <%= n %>" title="<%= mDevice.getOrDefault(r[0], r[0]) %>: <%= n %>"></span><% } %>
      </div>
      <ul class="mk-legend">
        <% for (String[] r : mDevices) { long n = Long.parseLong(r[1]); %><li class="mk-dev-<%= r[0] %>"><%= mDevice.getOrDefault(r[0], r[0]) %> <b><%= Math.round(n * 100.0 / Math.max(1, mDevTotal)) %> %</b></li><% } %>
      </ul>
      <ul class="mk-chips">
        <% for (String[] r : mLangs) { %><li><img src="/img/flags/<%= com.github.skeliit.WebUtils.escapeHtml(r[0]) %>.svg" alt="" width="18" height="12"> <%= com.github.skeliit.WebUtils.escapeHtml(r[0]).toUpperCase() %> <b><%= r[1] %></b></li><% } %>
      </ul>
      <% } %>
    </section>

    <section class="admin-card mk-card">
      <h3><i class="fa-solid fa-tag" aria-hidden="true"></i> Kampaně</h3>
      <% if (mCampaigns.isEmpty()) { %>
      <p class="text-dim">Dej do odkazu štítek, třeba <code>skeli.cz/?z=ig-bio</code> do bia na Instagramu nebo <code>skeli.cz/?z=klip-drama</code>
        pod klip – tady pak uvidíš, kolik lidí přišlo z kterého odkazu.</p>
      <% } else { %>
      <ol class="admin-top">
        <% for (String[] r : mCampaigns) { %><li><span><code><%= com.github.skeliit.WebUtils.escapeHtml(r[0]) %></code></span> <b><%= r[1] %></b></li><% } %>
      </ol>
      <% } %>
    </section>

    <section class="admin-card mk-card">
      <h3><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> Co lidi hledají v Textech</h3>
      <% if (mSearch.isEmpty()) { %><p class="text-dim">Zatím nikdo nic nehledal.</p><% } else { %>
      <ol class="admin-top">
        <% for (String[] r : mSearch) { %><li><span><%= com.github.skeliit.WebUtils.escapeHtml(r[0]) %><% if ("0".equals(r[2])) { %> <em class="mk-none">nic nenašlo</em><% } %></span> <b><%= r[1] %>×</b></li><% } %>
      </ol>
      <p class="text-dim mk-sub">„Nic nenašlo“ = nápad, co lidi chtějí a na webu není. Hledání se maže po 90 dnech.</p>
      <% } %>
    </section>
  </div>
</main>
<%@ include file="/includes/footer.jsp" %>
