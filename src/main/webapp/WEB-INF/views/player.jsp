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
  com.github.skeliit.dao.FriendDao.Rel plRel = (com.github.skeliit.dao.FriendDao.Rel) request.getAttribute("playerRel");   // null = můj vlastní náhled
  String plBack = pl == null ? "/uzivatel.jsp" : "/hrac/" + java.net.URLEncoder.encode(pl.username, "UTF-8").replace("+", "%20");
  String plCover = (String) request.getAttribute("playerCover");   // null = bez záhlaví nebo ho hráč ostatním neukazuje
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
    <div class="pt-cover" aria-hidden="true"><% if (plCover != null) { %><img src="<%= WebUtils.escapeHtml(plCover) %>" alt=""><% } %></div>
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
            <% String plCity = (String) request.getAttribute("playerCity"); if (plCity != null && !plCity.isBlank()) { %> · <%= WebUtils.escapeHtml(plCity) %><% } %>
          </p>
          <% if (Boolean.TRUE.equals(request.getAttribute("playerOnline"))) { %><p class="pt-online"><%= t.getProperty("profile.online") %></p><% } %>
          <% if (sc[2] != null) { %><p class="acct-motto motto-<%= WebUtils.escapeHtml(sc[4]) %>">„<%= WebUtils.escapeHtml(sc[2]) %>“</p><% } %>
        </div>
      </div>
      <%
        @SuppressWarnings("unchecked")
        java.util.List<String> shownBadges = (java.util.List<String>) request.getAttribute("playerShownBadges");
        if (shownBadges == null) shownBadges = java.util.List.of();
        PongProfile showPong = pp;
      %>
      <%@ include file="/includes/profile-showcase.jspf" %>
      <% String plBio = (String) request.getAttribute("playerBio"); if (plBio != null && !plBio.isBlank()) { %><p class="acct-bio"><%= WebUtils.escapeHtml(plBio) %></p><% } %>
      <%-- přátelé a nahlášení: u vlastního náhledu (?nahled) nic --%>
      <% if (plRel != null) { %>
      <div class="player-actions">
        <% String frMsg = request.getParameter("friend"); if (frMsg != null && java.util.Set.of("fail", "verify", "limit", "closed").contains(frMsg)) { %><p class="form-alert" role="alert"><%= t.getProperty("friends.msg." + frMsg) %></p><% } %>
        <% if ("1".equals(request.getParameter("reported"))) { %><p class="form-success" role="status"><%= t.getProperty("player.report.sent") %></p><% } %>
        <% if ("0".equals(request.getParameter("reported"))) { %><p class="form-alert" role="alert"><%= t.getProperty("player.report.failed") %></p><% } %>
        <% if (plRel == com.github.skeliit.dao.FriendDao.Rel.NONE) { %><form method="post" action="/profile/friends"><input type="hidden" name="csrf" value="${csrf}"><input type="hidden" name="name" value="<%= WebUtils.escapeHtml(pl.username) %>"><input type="hidden" name="action" value="request"><input type="hidden" name="back" value="<%= WebUtils.escapeHtml(plBack) %>"><button type="submit" class="btn-primary friend-btn"><%= t.getProperty("friends.add") %></button></form>
        <% } else if (plRel == com.github.skeliit.dao.FriendDao.Rel.SENT) { %><form method="post" action="/profile/friends"><input type="hidden" name="csrf" value="${csrf}"><input type="hidden" name="name" value="<%= WebUtils.escapeHtml(pl.username) %>"><input type="hidden" name="action" value="cancel"><input type="hidden" name="back" value="<%= WebUtils.escapeHtml(plBack) %>"><button type="submit" class="btn-outline friend-btn"><%= t.getProperty("friends.cancel") %></button></form><span class="player-state"><%= t.getProperty("friends.state.sent") %></span>
        <% } else if (plRel == com.github.skeliit.dao.FriendDao.Rel.RECEIVED) { %><form method="post" action="/profile/friends"><input type="hidden" name="csrf" value="${csrf}"><input type="hidden" name="name" value="<%= WebUtils.escapeHtml(pl.username) %>"><input type="hidden" name="action" value="accept"><input type="hidden" name="back" value="<%= WebUtils.escapeHtml(plBack) %>"><button type="submit" class="btn-primary friend-btn"><%= t.getProperty("friends.accept") %></button></form><form method="post" action="/profile/friends"><input type="hidden" name="csrf" value="${csrf}"><input type="hidden" name="name" value="<%= WebUtils.escapeHtml(pl.username) %>"><input type="hidden" name="action" value="decline"><input type="hidden" name="back" value="<%= WebUtils.escapeHtml(plBack) %>"><button type="submit" class="btn-outline friend-btn"><%= t.getProperty("friends.decline") %></button></form>
        <% } else if (plRel == com.github.skeliit.dao.FriendDao.Rel.FRIENDS) { %><span class="player-state on"><i class="fa-solid fa-user-check" aria-hidden="true"></i> <%= t.getProperty("friends.state.friends") %></span><form method="post" action="/profile/friends"><input type="hidden" name="csrf" value="${csrf}"><input type="hidden" name="name" value="<%= WebUtils.escapeHtml(pl.username) %>"><input type="hidden" name="action" value="remove"><input type="hidden" name="back" value="<%= WebUtils.escapeHtml(plBack) %>"><button type="submit" class="btn-outline friend-btn"><%= t.getProperty("friends.remove") %></button></form>
        <% } else if (plRel == com.github.skeliit.dao.FriendDao.Rel.I_BLOCKED) { %><span class="player-state"><%= t.getProperty("friends.state.blocked") %></span><form method="post" action="/profile/friends"><input type="hidden" name="csrf" value="${csrf}"><input type="hidden" name="name" value="<%= WebUtils.escapeHtml(pl.username) %>"><input type="hidden" name="action" value="unblock"><input type="hidden" name="back" value="<%= WebUtils.escapeHtml(plBack) %>"><button type="submit" class="btn-outline friend-btn"><%= t.getProperty("friends.unblock") %></button></form><% } %>
        <details class="player-more">
          <summary aria-label="<%= t.getProperty("player.more") %>"><i class="fa-solid fa-ellipsis" aria-hidden="true"></i></summary>
          <div class="player-more-box">
            <% if (plRel != com.github.skeliit.dao.FriendDao.Rel.I_BLOCKED) { %><form method="post" action="/profile/friends" onsubmit="return confirm('<%= WebUtils.escapeJs(t.getProperty("friends.blockConfirm")) %>');"><input type="hidden" name="csrf" value="${csrf}"><input type="hidden" name="name" value="<%= WebUtils.escapeHtml(pl.username) %>"><input type="hidden" name="action" value="block"><input type="hidden" name="back" value="<%= WebUtils.escapeHtml(plBack) %>"><button type="submit" class="btn-outline friend-btn"><%= t.getProperty("friends.block") %></button></form><% } %>
            <form class="player-report" method="post" action="/profile/report">
              <input type="hidden" name="csrf" value="${csrf}"><input type="hidden" name="name" value="<%= WebUtils.escapeHtml(pl.username) %>">
              <label><%= t.getProperty("player.report") %>
                <select name="reason" required>
                  <% for (String why : new String[] { "spam", "abuse", "image", "fake", "music", "other" }) { %><option value="<%= why %>"><%= t.getProperty("player.report." + why) %></option><% } %>
                </select>
              </label>
              <input name="note" maxlength="300" placeholder="<%= WebUtils.escapeHtml(t.getProperty("player.report.note")) %>" aria-label="<%= WebUtils.escapeHtml(t.getProperty("player.report.note")) %>">
              <button type="submit" class="btn-outline friend-btn"><%= t.getProperty("player.report.send") %></button>
            </form>
          </div>
        </details>
      </div>
      <% } %>
    </div>
  </section>

  <nav class="acct-tabs profile-tabs" aria-label="<%= WebUtils.escapeHtml(pl.username) %>">
    <a href="#prehled"><i class="fa-solid fa-id-card" aria-hidden="true"></i> <span class="tab-name"><%= t.getProperty("profile.tab.overview") %></span></a>
    <a href="#hry"><i class="fa-solid fa-gamepad" aria-hidden="true"></i> <span class="tab-name"><%= t.getProperty("profile.tab.games") %></span></a>
  </nav>

  <div class="pt-tab pt-grid" id="prehled">
  <a class="pt pt-stat pt-games pt-big-tile" href="#hry" data-tilt><span class="pt-sheen"></span><i class="fa-solid fa-gamepad pt-ghost" aria-hidden="true"></i>
    <span class="pt-in"><span class="pt-label"><%= t.getProperty("profile.tab.games") %></span><b class="pt-big"><%= pp.wins %></b><span class="pt-note"><%= t.getProperty("account.stats.wins") %></span></span></a>
  <% if (sc[0] != null) { %>
  <a class="pt pt-song" href="<%= com.github.skeliit.I18n.songPath(request, sc[0], 0) %>" data-tilt>
    <% if (sc[3] != null) { %><img class="pt-song-img" src="<%= WebUtils.escapeHtml(sc[3]) %>" alt="" loading="lazy"><% } %>
    <span class="pt-sheen"></span>
    <span class="pt-in"><span class="pt-label"><i class="fa-solid fa-heart" aria-hidden="true"></i> <%= t.getProperty("profile.favSong") %></span><b class="pt-song-name"><%= WebUtils.escapeHtml(sc[1]) %></b></span>
    <span class="pt-song-play" aria-hidden="true"><i class="fa-solid fa-play"></i></span>
  </a>
  <% } %>
  <%
    @SuppressWarnings("unchecked")
    java.util.List<com.github.skeliit.model.UserTrack> tracksList = (java.util.List<com.github.skeliit.model.UserTrack>) request.getAttribute("playerTracks");
    if (tracksList == null) tracksList = java.util.List.of();
    String tracksTitle = "profile.tracks.others", tracksBack = plBack;
    boolean tracksAdmin = "ADMIN".equals(session.getAttribute("role"));
  %>
  <%@ include file="/includes/profile-tracks.jspf" %>
  <%
    @SuppressWarnings("unchecked")
    java.util.List<com.github.skeliit.model.LikedSong> likesList = (java.util.List<com.github.skeliit.model.LikedSong>) request.getAttribute("playerLikes");
    if (likesList == null) likesList = java.util.List.of();
    String likesTitle = "profile.likes.others";
    boolean likesOwn = false;
  %>
  <%@ include file="/includes/profile-likes.jspf" %>
  <%
    @SuppressWarnings("unchecked")
    java.util.List<com.github.skeliit.model.Friend> plFriends = (java.util.List<com.github.skeliit.model.Friend>) request.getAttribute("playerFriends");
    if (plFriends != null && !plFriends.isEmpty()) {
  %>
  <section class="pt pt-friends" id="pratele-hrace">
    <div class="pt-in">
      <span class="pt-label"><i class="fa-solid fa-user-group" aria-hidden="true"></i> <%= t.getProperty("profile.tab.friends") %></span>
      <ul class="friend-list">
        <% for (com.github.skeliit.model.Friend fr : plFriends) { %>
        <li class="friend-row"><a class="friend-who" href="/hrac/<%= java.net.URLEncoder.encode(fr.username, "UTF-8").replace("+", "%20") %>"><img src="<%= WebUtils.escapeHtml(fr.avatarUrl) %>" alt="" width="44" height="44" loading="lazy" referrerpolicy="no-referrer"><span><%= WebUtils.escapeHtml(fr.username) %></span></a></li>
        <% } %>
      </ul>
    </div>
  </section>
  <% } %>

  </div>

  <div class="pt-tab pt-grid" id="hry">
  <header class="game-head"><i class="fa-solid fa-table-tennis-paddle-ball" aria-hidden="true"></i> <h2>CatSmash</h2></header>
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
  </div>
  <script src="/js/profile-tiles.js?v=<%= assetVersion %>"></script>
  <script src="/js/profile-tabs.js?v=<%= assetVersion %>"></script>
  <% } %>
</main>
<%@ include file="/includes/footer.jsp" %>
