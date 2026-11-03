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
<main class="account-page player-page">
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
  <section class="acct-card acct-hero">
    <span class="acct-photo<%= pp.shownFrame != null ? " av-frame f-" + WebUtils.escapeHtml(pp.shownFrame) : "" %>">
      <img class="acct-avatar" src="<%= WebUtils.escapeHtml(plAvatar) %>" alt="">
    </span>
    <% if (sc[2] != null) { %><p class="acct-motto motto-<%= WebUtils.escapeHtml(sc[4]) %>">„<%= WebUtils.escapeHtml(sc[2]) %>“</p><% } %>
    <div class="acct-who">
      <h2 class="acct-name"><%= WebUtils.escapeHtml(pl.username) %>
        <% if (pl.artist) { %><span class="acct-badge artist"><i class="fa-solid fa-circle-check"></i> <%= t.getProperty("cmt.artist") %></span><% } %>
        <% if (pp.mark != null) { %><i class="fa-solid <%= com.github.skeliit.model.PongBadges.icon(pp.mark) %> acct-mark" title="<%= WebUtils.escapeHtml(t.getProperty("pong.badge." + pp.mark)) %>"></i><% } %>
      </h2>
      <p class="acct-meta">
        <% if (pl.memberSince != null) { %><%= WebUtils.escapeHtml(t.getProperty("account.memberSince").replace("{0}",
             java.time.format.DateTimeFormatter.ofLocalizedDate(java.time.format.FormatStyle.LONG).withLocale(java.util.Locale.forLanguageTag(cur)).format(pl.memberSince.toLocalDateTime()))) %><% } %>
      </p>
      <% if (sc[0] != null) { %>
      <a class="acct-fav" href="<%= com.github.skeliit.I18n.songPath(request, sc[0], 0) %>">
        <% if (sc[3] != null) { %><img src="<%= WebUtils.escapeHtml(sc[3]) %>" alt="" width="96" height="54" loading="lazy"><% } %>
        <span><small><i class="fa-solid fa-heart" aria-hidden="true"></i> <%= t.getProperty("profile.favSong") %></small><b><%= WebUtils.escapeHtml(sc[1]) %></b></span>
        <i class="fa-solid fa-play acct-fav-play" aria-hidden="true"></i>
      </a>
      <% } %>
    </div>
    <ul class="acct-stats">
      <li><strong><%= pp.wins %></strong><span><i class="fa-solid fa-trophy"></i> <%= t.getProperty("account.stats.wins") %></span></li>
      <li><strong><%= bestAll == null ? "–" : PongProfile.time(bestAll) %></strong><span><i class="fa-solid fa-stopwatch"></i> <%= t.getProperty("account.stats.best") %></span></li>
      <li><strong><%= pp.earnedCount() %></strong><span><i class="fa-solid fa-medal"></i> <%= t.getProperty("pong.badges.title") %></span></li>
    </ul>
  </section>

  <section class="acct-card" id="pong">
    <header class="acct-card-head">
      <h3><i class="fa-solid fa-table-tennis-paddle-ball"></i> <%= t.getProperty("account.tab.pong") %></h3>
    </header>
    <div class="pong-best">
    <% for (int d = 1; d <= 3; d++) { %>
      <div class="pong-best-item<%= pp.bestMs[d - 1] != null ? " on" : "" %>">
        <span class="pong-best-level"><%= t.getProperty("pong.level." + d) %></span>
        <% if (pp.bestMs[d - 1] != null) { %>
          <b><%= PongProfile.time(pp.bestMs[d - 1]) %></b>
          <% if (pp.place[d - 1] != null) { %><span class="acct-dim"><%= t.getProperty("pong.profile.place").replace("{0}", String.valueOf(pp.place[d - 1])) %></span><% } %>
        <% } else { %>
          <span class="acct-dim"><%= t.getProperty("pong.profile.notYet") %></span>
        <% } %>
      </div>
    <% } %>
    </div>
    <div class="pong-badge-box">
      <div class="pong-badge-head"><b><%= t.getProperty("player.badges") %></b><span><%= pp.earnedCount() %> / <%= pp.badges.size() %></span></div>
      <% if (pp.earnedCount() == 0) { %>
      <p class="acct-dim"><%= t.getProperty("player.noBadges") %></p>
      <% } else { %>
      <ul class="pong-badges">
        <% for (PongProfile.Badge b : pp.badges) { if (!b.earned) continue; String tier = com.github.skeliit.model.PongBadges.tier(b.key); %>
        <li class="on<%= tier != null ? " tier-" + tier : "" %>">
          <span class="pong-badge-icon"><i class="fa-solid <%= b.icon %>" aria-hidden="true"></i></span>
          <span class="pong-badge-text"><b><%= t.getProperty("pong.badge." + b.key) %></b><span><%= t.getProperty("pong.badge." + b.key + ".how") %></span></span>
        </li>
        <% } %>
      </ul>
      <% } %>
    </div>
    <p class="pong-play-row"><a class="btn-primary" href="/?kevin=pong"><i class="fa-solid fa-play"></i> <%= t.getProperty("player.challenge") %></a></p>
  </section>
  <% } %>
</main>
<%@ include file="/includes/footer.jsp" %>
