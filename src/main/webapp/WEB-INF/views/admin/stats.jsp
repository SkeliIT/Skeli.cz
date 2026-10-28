<%@ include file="/includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%-- /admin/stats (AdminPagesServlet): statistiky jako přemístitelné widgety (js/admin-widgets.js), jedno období pro všechno.
     Data: DashboardStats (souhrn, lidé po dnech, dnes), VisitStats (co se pouští), MarketingStats (odkud, kam, kdy, hledání).
     Grafy kreslí service/StatsCharts. Nic se nespojuje s konkrétním člověkem – jen počty. --%>
<%
  // období pro celou stránku: 1 = dnes, 7, 30, 90, 0 = celkem (za celou dobu webu, od prvního započítaného dne)
  String dParam = request.getParameter("d");
  int d = "1".equals(dParam) ? 1 : "30".equals(dParam) ? 30 : "90".equals(dParam) ? 90 : "0".equals(dParam) ? 0 : 7;
  int n = d;
  if (d == 0) { try { n = com.github.skeliit.service.DashboardStats.daysSinceStart(); } catch (java.sql.SQLException e) { n = 365; } }
  String playKind = request.getParameter("plays");
  if (playKind == null || !com.github.skeliit.service.VisitStats.PLAY_KINDS.contains(playKind)) playKind = "lyric";

  java.util.Map<String, com.github.skeliit.service.DashboardStats.Tile> tile = new java.util.HashMap<>();
  com.github.skeliit.service.DashboardStats.Today td = null;
  java.util.List<String[]> topPlays = new java.util.ArrayList<>(), mSources = new java.util.ArrayList<>(), mCampaigns = new java.util.ArrayList<>(),
      mDevices = new java.util.ArrayList<>(), mLangs = new java.util.ArrayList<>(), mOut = new java.util.ArrayList<>(),
      mOutPages = new java.util.ArrayList<>(), mSearch = new java.util.ArrayList<>();
  long[][] mWeek = new long[7][24];
  Object since = "–";
  try {
    for (com.github.skeliit.service.DashboardStats.Tile kt : com.github.skeliit.service.DashboardStats.tiles(n)) tile.put(kt.key, kt);
    td = com.github.skeliit.service.DashboardStats.today();
    topPlays = com.github.skeliit.service.VisitStats.topPlays(playKind, d, 10);
    mSources = com.github.skeliit.service.MarketingStats.visitsBy("source", n);
    mCampaigns = com.github.skeliit.service.MarketingStats.visitsBy("campaign", n);
    mDevices = com.github.skeliit.service.MarketingStats.visitsBy("device", n);
    mLangs = com.github.skeliit.service.MarketingStats.visitsBy("lang", n);
    mOut = com.github.skeliit.service.MarketingStats.clicksByTarget(n);
    mOutPages = com.github.skeliit.service.MarketingStats.clicksByPage(n);
    mSearch = com.github.skeliit.service.MarketingStats.topSearches(n, 12);
    mWeek = com.github.skeliit.service.MarketingStats.weekHours(n);
    since = com.github.skeliit.service.VisitStats.summary().getOrDefault("since", "–");
  } catch (java.sql.SQLException e) {
    application.log("Admin stats", e);
  }
  String[][] periods = {{"1", "Dnes"}, {"7", "7 dní"}, {"30", "30 dní"}, {"90", "90 dní"}, {"0", "Celá doba"}};
  String periodText = d == 1 ? "dnes" : d == 0 ? "za celou dobu (" + n + " dní)" : "za " + d + " dní";
  java.util.function.Function<Long, String> num = v -> String.format(java.util.Locale.forLanguageTag("cs"), "%,d", v).replace(',', ' ');
  long people = tile.containsKey("people") ? tile.get("people").getTotal() : 0;
  long plays = tile.containsKey("plays") ? tile.get("plays").getTotal() : 0;
  long outSum = 0;
  for (String k : new String[]{"spotify", "youtube", "apple"}) if (tile.containsKey(k)) outSum += tile.get(k).getTotal();
  // názvy a ikony
  java.util.Map<String, String[]> mLabel = new java.util.HashMap<>();
  mLabel.put("primo", new String[]{"Napřímo", "fa-solid fa-link"});
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
  long mTotal = 0, mSrcMax = 1;
  for (String[] r : mSources) { long v = Long.parseLong(r[1]); mTotal += v; mSrcMax = Math.max(mSrcMax, v); }
  long mDevTotal = 0;
  for (String[] r : mDevices) mDevTotal += Long.parseLong(r[1]);
  long mOutTotal = 0, mOutMax = 1;
  for (String[] r : mOut) { long v = Long.parseLong(r[1]); mOutTotal += v; mOutMax = Math.max(mOutMax, v); }
  long mWeekMax = 0; int bestD = -1, bestH = -1;
  for (int i = 0; i < 7; i++) for (int h = 0; h < 24; h++) if (mWeek[i][h] > mWeekMax) { mWeekMax = mWeek[i][h]; bestD = i; bestH = h; }
  String[] mDayNames = {"Po", "Út", "St", "Čt", "Pá", "So", "Ne"};
  String[] mDayLong = {"pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota", "neděle"};
  long topMax = topPlays.isEmpty() ? 1 : Math.max(1, Long.parseLong(topPlays.get(0)[1]));
  String[][] playTabs = {{"lyric", "fa-align-left", "Texty"}, {"karaoke", "fa-microphone", "Karaoke"}, {"clip", "fa-play", "Klipy"}};
%>
<main class="admin-page admin-stats-page">
  <%@ include file="/includes/admin-nav.jspf" %>
  <div class="st-top">
    <h2 class="admin-page-title">Statistiky</h2>
    <nav class="play-tabs play-period" aria-label="Období pro celou stránku">
      <% for (String[] p : periods) { boolean on = p[0].equals(String.valueOf(d)); %>
      <a href="?d=<%= p[0] %>&amp;plays=<%= playKind %>" class="<%= on ? "on" : "" %>"<%= on ? " aria-current=\"page\"" : "" %>><%= p[1] %></a>
      <% } %>
    </nav>
    <button type="button" class="st-edit-btn" data-edit-layout aria-pressed="false"><i class="fa-solid fa-table-cells-large" aria-hidden="true"></i> <span>Upravit rozložení</span></button>
  </div>
  <% if ("1".equals(request.getParameter("statsReset"))) { %>
  <p class="admin-flash"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Statistiky jsou vynulované, počítá se od teď.</p>
  <% } %>
  <div class="st-editbar" hidden>
    <p>Přetáhni widget za úchyt <i class="fa-solid fa-grip-vertical" aria-hidden="true"></i> (nebo šipkami), změň šířku, schovej, co nepotřebuješ. Rozložení si pamatuje tenhle prohlížeč.</p>
    <div class="st-hidden-list"></div>
    <div class="st-editbar-btns"><button type="button" class="kp-fullbtn" data-layout-reset><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Výchozí rozložení</button>
      <button type="button" class="btn-primary" data-edit-layout><i class="fa-solid fa-check" aria-hidden="true"></i> Hotovo</button></div>
  </div>

  <div class="st-grid" data-widgets>
    <%-- SOUHRN --%>
    <section class="w" data-w="sum" data-size="xl" data-title="Souhrn">
      <h3><i class="fa-solid fa-gauge-high" aria-hidden="true"></i> Souhrn <small><%= periodText %></small></h3>
      <div class="st-sum">
        <% for (String[] k : new String[][]{{"people", "Lidí na webu"}, {"pages", "Zobrazených stránek"}, {"plays", "Přehrání (texty, klipy, karaoke)"}}) {
             com.github.skeliit.service.DashboardStats.Tile kt = tile.get(k[0]); if (kt == null) continue; %>
        <div class="st-num"><span class="st-lbl"><%= k[1] %></span><b><%= num.apply(kt.getTotal()) %></b>
          <% if (d != 0) { %><span class="st-trend st-<%= kt.getTrend() %>"><%= kt.getTrendText() %></span><% } %></div>
        <% } %>
        <div class="st-num"><span class="st-lbl">Šli poslouchat ven</span><b><%= num.apply(outSum) %></b>
          <span class="st-svc">
            <% for (String[] s : new String[][]{{"spotify", "Spotify"}, {"youtube", "YouTube"}, {"apple", "Apple"}}) { long v = tile.containsKey(s[0]) ? tile.get(s[0]).getTotal() : 0; %>
            <span style="--c:<%= com.github.skeliit.service.StatsCharts.brand(s[0]) %>"><i aria-hidden="true"></i><%= s[1] %> <b><%= v %></b></span>
            <% } %>
          </span></div>
      </div>
    </section>

    <%-- LIDÉ PO DNECH (u Dnes po hodinách) --%>
    <section class="w" data-w="people" data-size="l" data-title="Lidé po dnech">
      <% if (d == 1 && td != null) { %>
      <h3><i class="fa-solid fa-clock" aria-hidden="true"></i> Příchody po hodinách <small><span class="lg lg-today">dnes</span> <span class="lg lg-yest">včera</span></small></h3>
      <div class="hours" role="img" aria-label="Příchody na web po hodinách, dnes a včera">
        <% for (int i = 0; i < 24; i++) { %>
        <div class="hour<%= i == td.hourNow ? " now" : i > td.hourNow ? " later" : "" %>" title="<%= i %>:00 – dnes <%= td.hours[i] %>, včera <%= td.hoursYesterday[i] %>">
          <span class="bar-y" style="--h:<%= td.pct(td.hoursYesterday[i]) %>%"></span><span class="bar-t" style="--h:<%= td.pct(td.hours[i]) %>%"></span>
          <% if (i % 6 == 0) { %><small><%= i %></small><% } %>
        </div>
        <% } %>
      </div>
      <% } else if (tile.containsKey("people")) { int days = n; %>
      <h3><i class="fa-solid fa-chart-line" aria-hidden="true"></i> Lidé po dnech <small><span class="lg lg-today">teď</span> <span class="lg lg-prev">předtím</span></small></h3>
      <%= com.github.skeliit.service.StatsCharts.peopleLine(tile.get("people").series, days) %>
      <% } %>
    </section>

    <%-- CESTA NÁVŠTĚVNÍKA --%>
    <section class="w" data-w="funnel" data-size="s" data-title="Cesta návštěvníka">
      <h3><i class="fa-solid fa-filter" aria-hidden="true"></i> Cesta návštěvníka</h3>
      <% long base = Math.max(1, people); %>
      <ol class="st-funnel">
        <li style="--w:100%"><span>Přišli na web</span><i aria-hidden="true"></i><b><%= num.apply(people) %></b></li>
        <li style="--w:<%= Math.min(100, Math.round(plays * 100.0 / base)) %>%"><span>Pustili si song <small>na 100 lidí <%= Math.round(plays * 100.0 / base) %> přehrání</small></span><i aria-hidden="true"></i><b><%= num.apply(plays) %></b></li>
        <li class="out" style="--w:<%= Math.min(100, Math.round(outSum * 100.0 / base)) %>%"><span>Šli na Spotify, YouTube, Apple <small>na 100 lidí <%= Math.round(outSum * 100.0 / base) %> prokliků</small></span><i aria-hidden="true"></i><b><%= num.apply(outSum) %></b></li>
      </ol>
      <p class="st-note">Čím víc lidí dojde až dolů, tím víc streamů. Prokliky se počítají kliknutím (kdo klikne dvakrát, počítá se dvakrát).</p>
    </section>

    <%-- CO SE NEJVÍC POUŠTÍ --%>
    <section class="w" data-w="plays" data-size="m" data-title="Co se nejvíc pouští">
      <h3><i class="fa-solid fa-music" aria-hidden="true"></i> Co se nejvíc pouští <small><%= periodText %></small></h3>
      <nav class="play-tabs st-tabs" aria-label="Co počítat">
        <% for (String[] tb : playTabs) { boolean on = tb[0].equals(playKind); %>
        <a href="?d=<%= d %>&amp;plays=<%= tb[0] %>" class="<%= on ? "on" : "" %>"<%= on ? " aria-current=\"page\"" : "" %>><i class="fa-solid <%= tb[1] %>" aria-hidden="true"></i> <%= tb[2] %></a>
        <% } %>
      </nav>
      <% if (topPlays.isEmpty()) { %><p class="st-note">Za tohle období zatím nic.</p><% } else { %>
      <ol class="st-rank">
        <% int ri = 0; for (String[] row : topPlays) { long v = Long.parseLong(row[1]); ri++; %>
        <li style="--w:<%= Math.round(v * 100.0 / topMax) %>%"><span class="st-rk"><%= ri %></span><span class="st-rn"><%= com.github.skeliit.WebUtils.escapeHtml(row[0]) %></span><b><%= v %>×</b></li>
        <% } %>
      </ol>
      <% } %>
    </section>

    <%-- ODKUD LIDI CHODÍ --%>
    <section class="w" data-w="sources" data-size="m" data-title="Odkud lidi chodí">
      <h3><i class="fa-solid fa-route" aria-hidden="true"></i> Odkud lidi chodí <small><%= num.apply(mTotal) %> návštěv</small></h3>
      <% if (mSources.isEmpty()) { %><p class="st-note">Zatím žádná data.</p><% } else { %>
      <div class="st-stack" role="img" aria-label="Podíl zdrojů návštěv">
        <% for (String[] r : mSources) { %><span style="flex:<%= r[1] %>;--c:<%= com.github.skeliit.service.StatsCharts.brand(r[0]) %>" title="<%= com.github.skeliit.WebUtils.escapeHtml(mLabel.getOrDefault(r[0], new String[]{r[0]})[0]) %>: <%= r[1] %>"></span><% } %>
      </div>
      <ol class="st-bars">
        <% for (String[] r : mSources) { long v = Long.parseLong(r[1]); String[] lb = mLabel.getOrDefault(r[0], new String[]{r[0], "fa-solid fa-globe"}); %>
        <li style="--w:<%= Math.round(v * 100.0 / mSrcMax) %>%;--c:<%= com.github.skeliit.service.StatsCharts.brand(r[0]) %>">
          <i class="<%= lb[1] %>" aria-hidden="true"></i><span><%= com.github.skeliit.WebUtils.escapeHtml(lb[0]) %></span><em aria-hidden="true"></em><b><%= v %></b><small><%= Math.round(v * 100.0 / Math.max(1, mTotal)) %> %</small>
        </li>
        <% } %>
      </ol>
      <% } %>
      <p class="st-note">Štítek v odkazu (<code>skeli.cz/?z=ig-bio</code>) ukáže v Kampaních, který příspěvek přivedl lidi.</p>
    </section>

    <%-- KDY LIDI CHODÍ --%>
    <section class="w" data-w="heat" data-size="l" data-title="Kdy lidi chodí">
      <h3><i class="fa-solid fa-calendar-week" aria-hidden="true"></i> Kdy lidi chodí
        <small>čím teplejší barva, tím víc lidí</small></h3>
<%
  // souhrn špičky: nejsilnější den v týdnu, nejsilnější tříhodinové okno, nejvytíženější hodina, průměr za den
  long[] daySum = new long[7], hourSum = new long[24]; long weekTotal = 0;
  for (int i = 0; i < 7; i++) for (int h = 0; h < 24; h++) { daySum[i] += mWeek[i][h]; hourSum[h] += mWeek[i][h]; weekTotal += mWeek[i][h]; }
  int bestDay = 0; for (int i = 1; i < 7; i++) if (daySum[i] > daySum[bestDay]) bestDay = i;
  int bestWin = 0; long bestWinSum = -1;
  for (int h = 0; h < 24; h++) { long s3 = hourSum[h] + hourSum[(h + 1) % 24] + hourSum[(h + 2) % 24]; if (s3 > bestWinSum) { bestWinSum = s3; bestWin = h; } }
  double perDay = weekTotal / (double) Math.max(1, n);
%>
      <% if (weekTotal > 0) { %>
      <ul class="st-peak">
        <li><span>Nejsilnější den</span><b><%= mDayLong[bestDay] %></b><small><%= Math.round(daySum[bestDay] * 100.0 / weekTotal) %> % návštěv</small></li>
        <li><span>Nejsilnější čas</span><b><%= bestWin %>–<%= (bestWin + 3) % 24 %> h</b><small><%= Math.round(bestWinSum * 100.0 / weekTotal) %> % návštěv</small></li>
        <li><span>Nejvíc najednou</span><b><%= mDayLong[bestD] %> <%= bestH %> h</b><small><%= mWeekMax %> návštěv</small></li>
        <li><span>Průměrně</span><b><%= perDay >= 10 ? String.valueOf(Math.round(perDay)) : String.format(java.util.Locale.forLanguageTag("cs"), "%.1f", perDay) %> / den</b><small>návštěv <%= periodText %></small></li>
      </ul>
      <p class="st-note st-tip"><i class="fa-solid fa-lightbulb" aria-hidden="true"></i> Postuj na sítě kousek před špičkou – <%= new String[]{"v pondělí", "v úterý", "ve středu", "ve čtvrtek", "v pátek", "v sobotu", "v neděli"}[bestDay] %> kolem <%= (bestWin + 23) % 24 %> h.</p>
      <% } %>
      <div class="st-heat" role="img" aria-label="Návštěvy podle dne v týdnu a hodiny">
        <span></span>
        <% for (int h = 0; h < 24; h++) { %><span class="st-hh"><%= h % 3 == 0 ? String.valueOf(h) : "" %></span><% } %>
        <% for (int i = 0; i < 7; i++) { %>
          <span class="st-hd"><%= mDayNames[i] %></span>
          <% for (int h = 0; h < 24; h++) { long v = mWeek[i][h]; String col = com.github.skeliit.service.StatsCharts.heatColor(v, mWeekMax); %><i<%= col != null ? " style=\"--c:" + col + "\"" : "" %> title="<%= mDayNames[i] %> <%= h %>:00–<%= h %>:59: <%= v %> návštěv"></i><% } %>
        <% } %>
      </div>
      <div class="st-heat-legend"><span>málo</span><i style="background:<%= com.github.skeliit.service.StatsCharts.heatLegend() %>"></i><span>nejvíc (<%= mWeekMax %>)</span></div>
    </section>

    <%-- KAM KLIKAJÍ VEN --%>
    <section class="w" data-w="out" data-size="s" data-title="Kam klikají ven">
      <h3><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> Kam klikají ven <small><%= num.apply(mOutTotal) %></small></h3>
      <% if (mOut.isEmpty()) { %><p class="st-note">Zatím nikdo neklikl na Spotify, Apple Music ani YouTube.</p><% } else { %>
      <ol class="st-bars">
        <% for (String[] r : mOut) { long v = Long.parseLong(r[1]); String[] lb = mLabel.getOrDefault(r[0], new String[]{r[0], "fa-solid fa-globe"}); %>
        <li style="--w:<%= Math.round(v * 100.0 / mOutMax) %>%;--c:<%= com.github.skeliit.service.StatsCharts.brand(r[0]) %>">
          <i class="<%= lb[1] %>" aria-hidden="true"></i><span><%= com.github.skeliit.WebUtils.escapeHtml(lb[0]) %></span><em aria-hidden="true"></em><b><%= v %></b><small><%= Math.round(v * 100.0 / Math.max(1, mOutTotal)) %> %</small>
        </li>
        <% } %>
      </ol>
      <p class="st-note">Odkud: <% boolean first = true; for (String[] r : mOutPages) { %><%= first ? "" : " · " %><%= com.github.skeliit.WebUtils.escapeHtml(mPage.getOrDefault(r[0], r[0])) %> <b><%= r[1] %></b><% first = false; } %></p>
      <% } %>
    </section>

    <%-- ZAŘÍZENÍ A JAZYK --%>
    <section class="w" data-w="devices" data-size="s" data-title="Zařízení a jazyk">
      <h3><i class="fa-solid fa-mobile-screen" aria-hidden="true"></i> Zařízení a jazyk</h3>
      <% if (mDevices.isEmpty()) { %><p class="st-note">Zatím žádná data.</p><% } else {
           long mob = 0; for (String[] r : mDevices) if ("mobil".equals(r[0])) mob = Long.parseLong(r[1]); %>
      <div class="st-dev">
        <%= com.github.skeliit.service.StatsCharts.donut(mDevices, Math.round(mob * 100.0 / Math.max(1, mDevTotal)) + " %", "z mobilu") %>
        <ul class="st-legend">
          <% for (String[] r : mDevices) { long v = Long.parseLong(r[1]); %><li class="st-seg-<%= r[0] %>"><i aria-hidden="true"></i><%= mDevice.getOrDefault(r[0], r[0]) %> <b><%= Math.round(v * 100.0 / Math.max(1, mDevTotal)) %> %</b></li><% } %>
        </ul>
      </div>
      <ul class="mk-chips">
        <% for (String[] r : mLangs) { %><li><img src="/img/flags/<%= com.github.skeliit.WebUtils.escapeHtml(r[0]) %>.svg" alt="" width="18" height="12"> <%= com.github.skeliit.WebUtils.escapeHtml(r[0]).toUpperCase() %> <b><%= r[1] %></b></li><% } %>
      </ul>
      <% } %>
    </section>

    <%-- KAMPANĚ --%>
    <section class="w" data-w="campaigns" data-size="s" data-title="Kampaně">
      <h3><i class="fa-solid fa-tag" aria-hidden="true"></i> Kampaně</h3>
      <% if (mCampaigns.isEmpty()) { %>
      <p class="st-note">Dej do odkazu štítek, třeba <code>skeli.cz/?z=ig-bio</code> do bia na Instagramu nebo <code>skeli.cz/?z=klip-drama</code> pod klip – tady pak uvidíš, kolik lidí přišlo z kterého odkazu.</p>
      <% } else { %>
      <ol class="admin-top">
        <% for (String[] r : mCampaigns) { %><li><span><code><%= com.github.skeliit.WebUtils.escapeHtml(r[0]) %></code></span> <b><%= r[1] %></b></li><% } %>
      </ol>
      <% } %>
    </section>

    <%-- HLEDÁNÍ --%>
    <section class="w" data-w="search" data-size="s" data-title="Co hledají v Textech">
      <h3><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> Co hledají v Textech</h3>
      <% if (mSearch.isEmpty()) { %><p class="st-note">Zatím nikdo nic nehledal.</p><% } else { %>
      <ol class="admin-top">
        <% for (String[] r : mSearch) { %><li><span><%= com.github.skeliit.WebUtils.escapeHtml(r[0]) %><% if ("0".equals(r[2])) { %> <em class="mk-none">nic nenašlo</em><% } %></span> <b><%= r[1] %>×</b></li><% } %>
      </ol>
      <p class="st-note">„Nic nenašlo“ = nápad, co lidi chtějí a na webu není. Hledání se maže po 90 dnech.</p>
      <% } %>
    </section>
  </div>

  <%-- jak se počítá a vynulování: schované dole, ať se nedá zmáčknout omylem --%>
  <details class="st-danger" id="stats">
    <summary><i class="fa-solid fa-circle-info" aria-hidden="true"></i> Jak se počítá a vynulování statistik</summary>
    <p class="st-note">Každý člověk se započítá jednou za den, text písně taky jen jednou za den. Roboti a tvoje návštěvy jako admina se nepočítají. Bez cookies a bez IP adres, takže se počítají všichni, i ti, kdo v cookie liště odmítnou. „Celkem“ = za celou dobu, co web počítá.</p>
    <p class="st-note">Počítá se od: <b><%= com.github.skeliit.WebUtils.escapeHtml(String.valueOf(since)) %></b></p>
    <form method="post" action="/admin/stats-reset" class="admin-reset">
      <input type="hidden" name="csrf" value="${csrf}">
      <label class="checkbox-label"><input type="checkbox" name="confirm" value="ANO" required> Opravdu vynulovat počítadla (zobrazení textů i návštěvnost)</label>
      <button type="submit" class="btn-delete"><i class="fa-solid fa-rotate-left"></i> Vynulovat statistiky</button>
    </form>
  </details>
  <script src="/js/admin-widgets.js?v=<%= assetVersion %>"></script>
</main>
<%@ include file="/includes/footer.jsp" %>
