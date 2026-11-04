<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="/includes/header.jsp" %>
<%@ page import="com.github.skeliit.model.AccountSummary, com.github.skeliit.model.PongProfile, com.github.skeliit.WebUtils" %>
<%-- /hrac/{jméno} (web/site/PlayerProfileServlet): veřejný profil hráče pro přihlášené. Jen věci určené k vystavení –
     fotka s rámečkem, jméno, moto, oblíbený song, od kdy je členem, výhry, rekordy a získané odznaky. Nic osobního
     (e-mail ze souhrnu účtu se tu nikdy nevypisuje). Skrytý nebo neexistující profil = stejná hláška. --%>
<%
  AccountSummary pl = (AccountSummary) request.getAttribute("player");
  PongProfile pp = (PongProfile) request.getAttribute("playerPong");
  String[] sc = (String[]) request.getAttribute("playerShowcase");
  String plAvatar = (String) request.getAttribute("playerAvatar");
%>
<main class="account-page player-page profile-page">
  <% if (pl == null || pp == null) { %>
  <div class="settings-wrap">
    <section class="acct-card acct-signed-out text-center">
      <h2 class="font-display"><i class="fa-solid fa-user-lock" aria-hidden="true"></i> <%= t.getProperty("player.hidden") %></h2>
      <p><%= t.getProperty("player.hiddenText") %></p>
      <a class="btn btn-primary" href="/"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> <%= t.getProperty("player.back") %></a>
    </section>
  </div>
  <% } else {
       if (sc == null) sc = new String[] { null, null, null, null, "brush" };
       Integer bestAll = null; for (Integer b : pp.bestMs) if (b != null && (bestAll == null || b < bestAll)) bestAll = b; %>
  <div class="pt-grid">
  <section class="pt pt-hero">
    <div class="pt-photo" aria-hidden="true"></div>
    <div class="pt-in">
      <div class="pt-who">
        <span class="acct-photo<%= pp.shownFrame != null ? " av-frame f-" + WebUtils.escapeHtml(pp.shownFrame) : "" %>">
          <img class="acct-avatar" src="<%= WebUtils.escapeHtml(plAvatar) %>" alt="">
        </span>
        <div class="pt-who-text">
          <h2 class="acct-name"><%= WebUtils.escapeHtml(pl.username) %>
            <% if (pl.artist) { %><span class="acct-badge artist"><i class="fa-solid fa-circle-check"></i> <%= t.getProperty("cmt.artist") %></span><% } %>
            <% if (pp.mark != null) { %><i class="fa-solid <%= com.github.skeliit.model.PongBadges.icon(pp.mark) %> acct-mark" title="<%= WebUtils.escapeHtml(t.getProperty("pong.badge." + pp.mark)) %>"></i><% } %>
          </h2>
          <p class="acct-meta">
            <% if (pl.memberSince != null) { %><%= WebUtils.escapeHtml(t.getProperty("account.memberSince").replace("{0}",
                 java.time.format.DateTimeFormatter.ofLocalizedDate(java.time.format.FormatStyle.LONG).withLocale(java.util.Locale.forLanguageTag(cur)).format(pl.memberSince.toLocalDateTime()))) %><% } %>
          </p>
          <% if (sc[2] != null) { %><p class="acct-motto motto-<%= WebUtils.escapeHtml(sc[4]) %>">„<%= WebUtils.escapeHtml(sc[2]) %>“</p><% } %>
        </div>
      </div>
    </div>
  </section>

  <a class="pt pt-stat pt-stat3 pt-wins" href="#pong" data-tilt><span class="pt-sheen"></span><i class="fa-solid fa-trophy pt-ghost" aria-hidden="true"></i>
    <span class="pt-in"><span class="pt-label"><%= t.getProperty("account.stats.wins") %></span><b class="pt-big"><%= pp.wins %></b></span></a>
  <a class="pt pt-stat pt-stat3 pt-best" href="#pong" data-tilt><span class="pt-sheen"></span><i class="fa-solid fa-stopwatch pt-ghost" aria-hidden="true"></i>
    <span class="pt-in"><span class="pt-label"><%= t.getProperty("account.stats.best") %></span><b class="pt-big"><%= bestAll == null ? "–" : PongProfile.time(bestAll) %></b></span></a>
  <a class="pt pt-stat pt-stat3 pt-stat-last pt-medals" href="#odznaky" data-tilt><span class="pt-sheen"></span><i class="fa-solid fa-medal pt-ghost" aria-hidden="true"></i>
    <span class="pt-in"><span class="pt-label"><%= t.getProperty("pong.badges.title") %></span><b class="pt-big"><%= pp.earnedCount() %></b></span></a>

  <section class="pt pt-badges<%= sc[0] == null ? " pt-full" : "" %>">
    <div class="pt-in">
      <span class="pt-label"><%= t.getProperty("player.badges") %></span>
      <% PongProfile railPong = pp; String railEmpty = "player.noBadges"; %>
      <%@ include file="/includes/profile-rail.jspf" %>
    </div>
  </section>

  <% if (sc[0] != null) { %>
  <a class="pt pt-song" href="<%= com.github.skeliit.I18n.songPath(request, sc[0], 0) %>" data-tilt>
    <% if (sc[3] != null) { %><img class="pt-song-img" src="<%= WebUtils.escapeHtml(sc[3]) %>" alt="" loading="lazy"><% } %>
    <span class="pt-sheen"></span>
    <span class="pt-in"><span class="pt-label"><i class="fa-solid fa-heart" aria-hidden="true"></i> <%= t.getProperty("profile.favSong") %></span><b class="pt-song-name"><%= WebUtils.escapeHtml(sc[1]) %></b></span>
    <span class="pt-song-play" aria-hidden="true"><i class="fa-solid fa-play"></i></span>
  </a>
  <% } %>

  <% PongProfile timesPong = pp; String timesPlay = "player.challenge"; %>
  <%@ include file="/includes/profile-times.jspf" %>

  <% if (pp.earnedCount() > 0) { %>
  <section class="pt pt-panel" id="odznaky">
    <div class="pt-in">
    <div class="pong-badge-box">
      <div class="pong-badge-head"><b><%= t.getProperty("player.badges") %></b><span><%= pp.earnedCount() %> / <%= pp.badges.size() %></span></div>
      <ul class="pong-badges">
        <% for (PongProfile.Badge b : pp.badges) { if (!b.earned) continue; String tier = com.github.skeliit.model.PongBadges.tier(b.key); %>
        <li class="on<%= tier != null ? " tier-" + tier : "" %>">
          <span class="pong-badge-icon"><i class="fa-solid <%= b.icon %>" aria-hidden="true"></i></span>
          <span class="pong-badge-text"><b><%= t.getProperty("pong.badge." + b.key) %></b><span><%= t.getProperty("pong.badge." + b.key + ".how") %></span></span>
        </li>
        <% } %>
      </ul>
    </div>
    </div>
  </section>
  <% } %>
  </div>
  <script src="/js/profile-tiles.js?v=<%= assetVersion %>"></script>
  <% } %>
</main>
<%@ include file="/includes/footer.jsp" %>
