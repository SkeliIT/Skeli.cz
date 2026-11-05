<%@ page import="com.github.skeliit.dao.UserDao, com.github.skeliit.model.UserProfile, com.github.skeliit.model.UserComment, com.github.skeliit.model.AccountSummary, com.github.skeliit.WebUtils, com.github.skeliit.dao.PongDao, com.github.skeliit.model.PongProfile" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%-- Můj profil: vitrína – fotka, moto, oblíbený song, čísla, komentáře a CatSmash (časy, odznaky).
     Úpravy profilu, heslo, dvoufázové ověření, export a smazání účtu jsou v Nastavení (nastaveni.jsp). --%>
<main class="account-page profile-page">
  <% if (session.getAttribute("user_id") == null) { %>
  <%-- signed out (e.g. the sign-in expired): no forms, just a way back in --%>
  <div class="settings-wrap">
    <section class="acct-card acct-signed-out text-center">
      <h2 class="font-display"><%= t.getProperty("menu.account") %></h2>
      <p><%= t.getProperty("profile.loginRequired") %></p>
      <a class="btn btn-primary" href="/login.jsp?next=%2Fuzivatel.jsp"><i class="fa-solid fa-right-to-bracket"></i> <%= t.getProperty("auth.submit.login") %></a>
    </section>
  </div>
  <% } else { %>
  <%
    Integer uid = (Integer) session.getAttribute("user_id");
    String displayName = null, city = null, bio = null, theme = "dark", prefLang = (String) session.getAttribute("lang");
    Integer age = null;
    AccountSummary me = null;
    java.util.List<UserComment> myComments = java.util.List.of();
    PongProfile pong = new PongProfile();
    String[] showcase = { null, null, null, null, "brush" };
    String coverUrl = null;
    java.util.List<com.github.skeliit.model.Friend> frFriends = java.util.List.of(), frIn = java.util.List.of(), frOut = java.util.List.of(), frBlocked = java.util.List.of(), frFound = java.util.List.of();
    String frQuery = request.getParameter("fq");
    if (frQuery != null) frQuery = frQuery.strip();
    try {
      UserDao users = new UserDao();          // dao/UserDao
      UserProfile p = users.profile(uid);     // nothing saved yet = null
      if (p != null) {
        displayName = p.displayName; age = p.age; city = p.city; bio = p.bio; theme = p.theme;
        if (p.lang != null) prefLang = p.lang;
      }
      me = users.summary(uid);
      coverUrl = users.cover(uid);
      com.github.skeliit.dao.FriendDao fd = new com.github.skeliit.dao.FriendDao();   // dao/FriendDao
      frFriends = fd.friends(uid); frIn = fd.incoming(uid); frOut = fd.outgoing(uid); frBlocked = fd.blocked(uid);
      if (frQuery != null && frQuery.length() >= 2 && frQuery.length() <= 50) frFound = fd.search(uid, frQuery);
      myComments = users.comments(uid);
      pong = new PongDao().profile(uid);
      showcase = new com.github.skeliit.dao.UserDao().showcase(uid);   // oblíbený song a moto
    } catch (Exception ignore) {}
    String avatarUrl = WebUtils.safeUrl((String) session.getAttribute("avatar_url"), "/img/avatar-default.svg");
    String shownName = displayName != null && !displayName.isBlank() ? displayName : (me != null ? me.username : (String) session.getAttribute("username"));

  %>

  <div class="pt-grid">
  <%-- kdo jsi: fotka (klik = změnit), jméno, od kdy, moto --%>
  <section class="pt pt-hero">
    <%-- záhlaví: vlastní obrázek uživatele, bez něj neutrální pozadí --%>
    <div class="pt-cover" aria-hidden="true"><% if (coverUrl != null) { %><img src="<%= WebUtils.escapeHtml(coverUrl) %>" alt=""><% } %></div>
    <%-- úpravy profilu a celé nastavení jsou na samostatné stránce (nastaveni.jsp) --%>
    <div class="pt-tools">
      <a class="pt-gear<%= coverUrl == null ? " pt-cover-add" : "" %>" href="/nastaveni.jsp#zahlavi" aria-label="<%= t.getProperty(coverUrl == null ? "cover.add" : "cover.change") %>"><i class="fa-solid fa-image" aria-hidden="true"></i> <span><%= t.getProperty(coverUrl == null ? "cover.add" : "cover.change") %></span></a>
      <a class="pt-gear" href="/nastaveni.jsp" aria-label="<%= t.getProperty("account.edit") %>"><i class="fa-solid fa-gear" aria-hidden="true"></i> <span><%= t.getProperty("account.edit") %></span></a>
    </div>
    <div class="pt-in">
      <div class="pt-who">
        <a class="acct-photo<%= pong.shownFrame != null ? " av-frame f-" + pong.shownFrame : "" %>" href="/nastaveni.jsp#profil" title="<%= t.getProperty("account.changePhoto") %>">
          <img class="acct-avatar" src="<%= WebUtils.escapeHtml(avatarUrl) %>" alt="">
          <span class="acct-photo-edit" aria-hidden="true"><i class="fa-solid fa-camera"></i></span>
          <span class="sr-only"><%= t.getProperty("account.changePhoto") %></span>
        </a>
        <div class="pt-who-text">
          <h2 class="acct-name"><%= WebUtils.escapeHtml(shownName) %>
            <% if (me != null && me.artist) { %><span class="acct-badge artist"><i class="fa-solid fa-circle-check"></i> <%= t.getProperty("cmt.artist") %></span><% } %>
            <% if (me != null && me.admin) { %><span class="acct-badge">★ Admin</span><% } %>
          </h2>
          <% if (com.github.skeliit.model.PongBadges.TITLES_ON && pong.title != null) { %><p class="acct-title"><i class="fa-solid fa-crown" aria-hidden="true"></i> <%= WebUtils.escapeHtml(t.getProperty("pong.badge." + pong.title)) %></p><% } %>
          <p class="acct-meta">
            <% if (me != null) { %>@<%= WebUtils.escapeHtml(me.username) %><% } %>
            <% if (me != null && me.memberSince != null) { %> · <%= WebUtils.escapeHtml(t.getProperty("account.memberSince").replace("{0}",
                 java.time.format.DateTimeFormatter.ofLocalizedDate(java.time.format.FormatStyle.LONG).withLocale(java.util.Locale.forLanguageTag(cur)).format(me.memberSince.toLocalDateTime()))) %><% } %>
          </p>
          <%-- moto: zlatý podpis vybraným písmem --%>
          <% if (showcase[2] != null) { %><p class="acct-motto motto-<%= showcase[4] %>">„<%= WebUtils.escapeHtml(showcase[2]) %>“</p><% } %>
        </div>
      </div>
      <% if (bio != null && !bio.isBlank()) { %><p class="acct-bio"><%= WebUtils.escapeHtml(bio) %></p><% } %>
    </div>
  </section>

  <% Integer bestAll = null; for (Integer b : pong.bestMs) if (b != null && (bestAll == null || b < bestAll)) bestAll = b; %>
  <%-- části profilu: co je o mně, co je ze her (každá hra má v Hrách svůj blok), přátelé a komentáře --%>
  <nav class="acct-tabs profile-tabs" aria-label="<%= t.getProperty("menu.account") %>">
    <a href="#prehled"><i class="fa-solid fa-id-card" aria-hidden="true"></i> <span class="tab-name"><%= t.getProperty("profile.tab.overview") %></span></a>
    <a href="#hry"><i class="fa-solid fa-gamepad" aria-hidden="true"></i> <span class="tab-name"><%= t.getProperty("profile.tab.games") %></span></a>
    <a href="#pratele"><i class="fa-solid fa-user-group" aria-hidden="true"></i> <span class="tab-name"><%= t.getProperty("profile.tab.friends") %></span><% if (!frIn.isEmpty()) { %> <span class="acct-count"><%= frIn.size() %></span><% } %></a>
    <a href="#komentare"><i class="fa-solid fa-comments" aria-hidden="true"></i> <span class="tab-name"><%= t.getProperty("account.tab.comments") %></span></a>
  </nav>

  <div class="pt-tab pt-grid" id="prehled">
  <a class="pt pt-stat pt-stat3 pt-comments" href="#komentare" data-tilt><span class="pt-sheen"></span><i class="fa-solid fa-comments pt-ghost" aria-hidden="true"></i>
    <span class="pt-in"><span class="pt-label"><%= t.getProperty("account.stats.comments") %></span><b class="pt-big"><%= me != null ? me.comments : 0 %></b></span></a>
  <a class="pt pt-stat pt-stat3 pt-hearts" href="#komentare" data-tilt><span class="pt-sheen"></span><i class="fa-solid fa-heart pt-ghost" aria-hidden="true"></i>
    <span class="pt-in"><span class="pt-label"><%= t.getProperty("account.stats.hearts") %></span><b class="pt-big"><%= me != null ? me.hearts : 0 %></b></span></a>
  <a class="pt pt-stat pt-stat3 pt-stat-last pt-games" href="#hry" data-tilt><span class="pt-sheen"></span><i class="fa-solid fa-gamepad pt-ghost" aria-hidden="true"></i>
    <span class="pt-in"><span class="pt-label"><%= t.getProperty("profile.tab.games") %></span><b class="pt-big"><%= pong.wins %></b><span class="pt-note"><%= t.getProperty("account.stats.wins") %></span></span></a>
  <%-- oblíbený song: kdo ho nemá, dostane odkaz do nastavení --%>
  <% if (showcase[0] != null) { %>
  <a class="pt pt-song" href="<%= com.github.skeliit.I18n.songPath(request, showcase[0], 0) %>" data-tilt>
    <% if (showcase[3] != null) { %><img class="pt-song-img" src="<%= WebUtils.escapeHtml(showcase[3]) %>" alt="" loading="lazy"><% } %>
    <span class="pt-sheen"></span>
    <span class="pt-in"><span class="pt-label"><i class="fa-solid fa-heart" aria-hidden="true"></i> <%= t.getProperty("profile.favSong") %></span><b class="pt-song-name"><%= WebUtils.escapeHtml(showcase[1]) %></b></span>
    <span class="pt-song-play" aria-hidden="true"><i class="fa-solid fa-play"></i></span>
  </a>
  <% } else { %>
  <a class="pt pt-song pt-empty" href="/nastaveni.jsp#profil" data-tilt>
    <span class="pt-sheen"></span><i class="fa-solid fa-music pt-ghost" aria-hidden="true"></i>
    <span class="pt-in"><span class="pt-label"><i class="fa-solid fa-heart" aria-hidden="true"></i> <%= t.getProperty("profile.favSong") %></span><span class="pt-note"><%= t.getProperty("profile.favSong.pick") %></span></span>
  </a>
  <% } %>

  <%-- poslední komentář a palce nahoru; všechny komentáře jsou níž --%>
  <a class="pt pt-last" href="#komentare" data-tilt>
    <span class="pt-sheen"></span>
    <span class="pt-in">
      <span class="pt-label"><%= t.getProperty("profile.lastComment") %></span>
      <% if (myComments.isEmpty()) { %>
      <span class="pt-note"><%= t.getProperty("cmt.none") %></span>
      <% } else { UserComment lastC = myComments.get(0); %>
      <span class="pt-quote"><%= WebUtils.escapeHtml(lastC.content) %></span>
      <span class="pt-note"><%= WebUtils.escapeHtml(t.getProperty(lastC.isLyric() ? "notif.onSong" : "notif.onClip").replace("{0}", lastC.placeName == null ? "" : lastC.placeName)) %></span>
      <% } %>
      <span class="pt-last-row"><i class="fa-solid fa-thumbs-up" aria-hidden="true"></i> <%= me != null ? me.likes : 0 %> · <%= t.getProperty("account.stats.likes") %></span>
    </span>
  </a>

  </div>

  <div class="pt-tab pt-grid" id="hry">
  <%-- blok jedné hry: až přibude další hra, přijde sem další takový blok --%>
  <header class="game-head"><i class="fa-solid fa-table-tennis-paddle-ball" aria-hidden="true"></i> <h2>CatSmash</h2></header>
  <a class="pt pt-stat pt-half pt-wins" href="#pong" data-tilt><span class="pt-sheen"></span><i class="fa-solid fa-trophy pt-ghost" aria-hidden="true"></i>
    <span class="pt-in"><span class="pt-label"><%= t.getProperty("account.stats.wins") %></span><b class="pt-big"><%= pong.wins %></b></span></a>
  <a class="pt pt-stat pt-half pt-best" href="#pong" data-tilt><span class="pt-sheen"></span><i class="fa-solid fa-stopwatch pt-ghost" aria-hidden="true"></i>
    <span class="pt-in"><span class="pt-label"><%= t.getProperty("account.stats.best") %></span><b class="pt-big"><%= bestAll == null ? "–" : PongProfile.time(bestAll) %></b></span></a>
  <%-- vitrína odznaků: prstenec, nejbližší odznak za výhry a nejvzácnější získané --%>
  <section class="pt pt-badges pt-full">
    <div class="pt-in">
      <div class="pt-badges-top">
        <a class="pt-ring" href="#odznaky" style="--ring:<%= pong.badges.isEmpty() ? 0 : pong.earnedCount() * 100 / pong.badges.size() %>" aria-label="<%= t.getProperty("pong.badges.title") %> <%= pong.earnedCount() %>/<%= pong.badges.size() %>"><%= pong.earnedCount() %>/<%= pong.badges.size() %></a>
        <div>
          <span class="pt-label"><%= t.getProperty("pong.badges.title") %></span>
          <% if (pong.nextBadge != null) { %>
          <p class="pt-note"><%= WebUtils.escapeHtml(t.getProperty("profile.nextBadge").replace("{0}", t.getProperty("pong.badge." + pong.nextBadge))) %> · <b><%= t.getProperty("profile.nextWins").replace("{0}", String.valueOf(pong.nextHave)).replace("{1}", String.valueOf(pong.nextNeed)) %></b></p>
          <% } %>
        </div>
      </div>
      <% PongProfile railPong = pong; String railEmpty = "profile.noBadgesYet"; %>
      <%@ include file="/includes/profile-rail.jspf" %>
    </div>
  </section>

  <% PongProfile timesPong = pong; String timesPlay = "pong.profile.play"; %>
  <%@ include file="/includes/profile-times.jspf" %>

  <%-- všechny odznaky: získané nahoře, u každého jak ho získat a odměna ve hře --%>
  <section class="pt pt-panel" id="odznaky">
    <div class="pt-in">
    <header class="acct-card-head">
      <h3><i class="fa-solid fa-medal" aria-hidden="true"></i> <%= t.getProperty("pong.badges.title") %></h3>
      <p><%= t.getProperty("pong.profile.lead") %></p>
    </header>
    <div class="pong-badge-box">
      <div class="pong-badge-head">
        <b><%= t.getProperty("pong.badges.title") %></b>
        <span><%= pong.earnedCount() %> / <%= pong.badges.size() %></span>
        <span class="pong-badge-bar" style="--p:<%= pong.badges.isEmpty() ? 0 : pong.earnedCount() * 100 / pong.badges.size() %>%" aria-hidden="true"></span>
      </div>
      <p class="pong-badge-rule"><%= t.getProperty("pong.badges.rule") %></p>
      <ul class="pong-badges" tabindex="0" aria-label="<%= t.getProperty("pong.badges.title") %>">
      <% int locked = pong.badges.size() - pong.earnedCount();
         for (int pass = 0; pass < 2; pass++) {
           if (pass == 1) { %>
      </ul>
      <% if (locked > 0) { %>
      <details class="acct-more"<%= pong.earnedCount() == 0 ? " open" : "" %>><summary><%= t.getProperty("pong.badges.locked").replace("{0}", String.valueOf(locked)) %></summary>
      <ul class="pong-badges">
      <% } else { break; } }
           for (PongProfile.Badge b : pong.badges) {
           if (b.earned != (pass == 0)) continue;
           String tier = com.github.skeliit.model.PongBadges.tier(b.key);
           String reward = t.getProperty("pong.badge." + b.key + ".reward"); %>
        <li class="<%= b.earned ? "on" : "" %><%= tier != null ? " tier-" + tier : "" %>">
          <span class="pong-badge-icon"><i class="fa-solid <%= b.earned ? b.icon : "fa-lock" %>" aria-hidden="true"></i></span>
          <span class="pong-badge-text">
            <b><%= t.getProperty("pong.badge." + b.key) %></b>
            <span><%= t.getProperty("pong.badge." + b.key + ".how") %></span>
            <% if (reward != null) { %><span class="pong-reward"><i class="fa-solid fa-gift" aria-hidden="true"></i> <%= t.getProperty("pong.reward.label") %>: <%= reward %></span><% } %>
          </span>
          <span class="sr-only"><%= t.getProperty(b.earned ? "pong.badge.earned" : "pong.badge.locked") %></span>
        </li>
      <% } } %>
      </ul>
      <% if (locked > 0) { %></details><% } %>
    </div>
    </div>
  </section>

  </div>

  <div class="pt-tab pt-grid" id="pratele">
  <%@ include file="/includes/profile-friends.jspf" %>
  </div>

  <div class="pt-tab pt-grid" id="komentare">
  <%-- Comments: everything you wrote under lyrics and clips; edit in place or delete --%>
  <section class="pt pt-panel">
    <div class="pt-in">
    <header class="acct-card-head">
      <h3><i class="fa-solid fa-comments"></i> <%= t.getProperty("account.tab.comments") %></h3>
      <p><%= t.getProperty("account.commentsLead") %></p>
    </header>
    <% if (myComments.isEmpty()) { %>
      <p class="acct-empty"><%= t.getProperty("cmt.none") %></p>
    <% } %>
    <div class="acct-comments">
    <% int ci = 0; for (UserComment uc : myComments) { if (ci++ == 3) { %>
      <details class="acct-more"><summary><%= t.getProperty("account.comments.all").replace("{0}", String.valueOf(myComments.size())) %></summary>
    <% } %>
      <article class="acct-comment">
        <div class="acct-comment-head">
          <i class="fa-solid <%= uc.isLyric() ? "fa-file-lines" : "fa-film" %>" aria-hidden="true"></i>
          <a href="<%= WebUtils.escapeHtml(uc.link) %>"><%= WebUtils.escapeHtml(t.getProperty(uc.isLyric() ? "notif.onSong" : "notif.onClip").replace("{0}", uc.placeName == null ? "" : uc.placeName)) %></a>
          <span class="acct-dim">· <%= WebUtils.formatDateTime(uc.createdAt, cur) %></span>
          <% if (uc.reply) { %><span class="acct-dim">· <%= t.getProperty("account.reply") %></span><% } %>
          <% if (uc.up > 0) { %><span class="acct-dim">· <i class="fa-solid fa-thumbs-up"></i> <%= uc.up %></span><% } %>
        </div>
        <p class="acct-comment-text"><%= WebUtils.escapeHtml(uc.content) %></p>
        <div class="acct-comment-actions">
          <details class="acct-edit">
            <summary><i class="fa-solid fa-pen"></i> <%= t.getProperty("common.edit") %></summary>
            <form method="post" action="/api/comments">
              <input type="hidden" name="kind" value="<%= uc.kind %>">
              <input type="hidden" name="id" value="<%= uc.id %>">
              <input type="hidden" name="action" value="edit">
              <input type="hidden" name="back" value="/uzivatel.jsp">
              <input type="hidden" name="csrf" value="${csrf}">
              <textarea name="content" rows="3" maxlength="<%= WebUtils.COMMENT_MAX_LENGTH %>" aria-label="<%= t.getProperty("profile.col.comment") %>"><%= WebUtils.escapeHtml(uc.content) %></textarea>
              <button type="submit"><%= t.getProperty("common.save") %></button>
            </form>
          </details>
          <form method="post" action="/api/comments" onsubmit="return confirm('<%= WebUtils.escapeJs(t.getProperty("comment.deleteConfirm")) %>');">
            <input type="hidden" name="kind" value="<%= uc.kind %>">
            <input type="hidden" name="id" value="<%= uc.id %>">
            <input type="hidden" name="action" value="delete">
            <input type="hidden" name="back" value="/uzivatel.jsp">
            <input type="hidden" name="csrf" value="${csrf}">
            <button type="submit" class="acct-delete"><i class="fa-solid fa-trash-can"></i> <%= t.getProperty("common.delete") %></button>
          </form>
        </div>
      </article>
    <% } %>
    <% if (myComments.size() > 3) { %></details><% } %>
    </div>
  </div>
  </section>
  </div>
  </div>
  <script src="/js/profile-tiles.js?v=<%= assetVersion %>"></script>
  <script src="/js/profile-tabs.js?v=<%= assetVersion %>"></script>

  <% } %>
</main>
<%@ include file="includes/footer.jsp" %>
