<%@ page import="com.github.skeliit.dao.UserDao, com.github.skeliit.model.UserProfile, com.github.skeliit.model.UserComment, com.github.skeliit.model.AccountSummary, com.github.skeliit.WebUtils, com.github.skeliit.dao.PongDao, com.github.skeliit.model.PongProfile" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%-- Můj profil: vitrína – fotka, moto, oblíbený song, čísla, komentáře a CatSmash (časy, odznaky).
     Úpravy profilu, heslo, dvoufázové ověření, export a smazání účtu jsou v Nastavení (nastaveni.jsp). --%>
<main class="account-page">
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
    java.util.List<String[]> songChoices = new java.util.ArrayList<>();
    try {
      UserDao users = new UserDao();          // dao/UserDao
      UserProfile p = users.profile(uid);     // nothing saved yet = null
      if (p != null) {
        displayName = p.displayName; age = p.age; city = p.city; bio = p.bio; theme = p.theme;
        if (p.lang != null) prefLang = p.lang;
      }
      me = users.summary(uid);
      myComments = users.comments(uid);
      pong = new PongDao().profile(uid);
      showcase = new com.github.skeliit.dao.UserDao().showcase(uid);   // oblíbený song a moto
      songChoices = new com.github.skeliit.dao.UserDao().songChoices();      // CatSmash: časy a odznaky (dao/PongDao)
    } catch (Exception ignore) {}
    String avatarUrl = WebUtils.safeUrl((String) session.getAttribute("avatar_url"), "/img/avatar-default.svg");
    String shownName = displayName != null && !displayName.isBlank() ? displayName : (me != null ? me.username : (String) session.getAttribute("username"));

    // messages after a redirect: fixed codes only, never echoed back
    String okKey = null;
    if ("true".equals(request.getParameter("saved"))) okKey = "settings.saved";
    if ("true".equals(request.getParameter("password_changed"))) okKey = "settings.passwordChanged";
    if (request.getParameter("signedOut") != null) okKey = "settings.signedOutOthers";
    // změna uživatelského jména (UsernameServlet): jen pevné kódy
    String nameRes = request.getParameter("name");
    if ("ok".equals(nameRes)) okKey = "account.username.ok";
    String settingsError = request.getParameter("error"), errKey = null;
    if ("empty".equals(settingsError)) errKey = "settings.error.empty";
    else if ("mismatch".equals(settingsError)) errKey = "settings.error.mismatch";
    else if ("short".equals(settingsError)) errKey = "auth.error.passwordStrength";
    else if ("invalid_chars".equals(settingsError)) errKey = "auth.error.passwordInvalidChars";
    else if ("too_long".equals(settingsError)) errKey = "auth.error.passwordTooLong";
    else if ("pwned".equals(settingsError)) errKey = "auth.error.passwordPwned";
    else if ("wrong_old".equals(settingsError)) errKey = "settings.error.wrongOld";
    else if (settingsError != null) errKey = "settings.error.generic";
    if ("required".equals(request.getParameter("confirm"))) errKey = "settings.deleteRequired";
    if ("taken".equals(nameRes) || "invalid".equals(nameRes) || "reserved".equals(nameRes) || "limit".equals(nameRes)) errKey = "account.username." + nameRes;
  %>

  <%-- who you are: photo (click = choose a new one), name, since when, numbers --%>
  <section class="acct-card acct-hero">
    <%-- úpravy profilu a celé nastavení jsou na samostatné stránce (nastaveni.jsp) --%>
    <a class="acct-edit" href="/nastaveni.jsp"><i class="fa-solid fa-gear" aria-hidden="true"></i> <%= t.getProperty("account.edit") %></a>
    <a class="acct-photo<%= pong.frame != null ? " av-frame f-" + pong.frame : "" %>" href="/nastaveni.jsp#profil" title="<%= t.getProperty("account.changePhoto") %>">
      <img class="acct-avatar" src="<%= WebUtils.escapeHtml(avatarUrl) %>" alt="">
      <span class="acct-photo-edit" aria-hidden="true"><i class="fa-solid fa-camera"></i></span>
      <span class="sr-only"><%= t.getProperty("account.changePhoto") %></span>
    </a>
    <%-- moto: zlatý podpis vybraným písmem, lehce přes spodek fotky --%>
    <% if (showcase[2] != null) { %><p class="acct-motto motto-<%= showcase[4] %>">„<%= WebUtils.escapeHtml(showcase[2]) %>“</p><% } %>
    <div class="acct-who">
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
      <% if (bio != null && !bio.isBlank()) { %><p class="acct-bio"><%= WebUtils.escapeHtml(bio) %></p><% } %>
      <%-- jako v návrhu od Gemini: zlatý ukazatel (odznaky místo XP) a štítky získaných odznaků --%>
      <% int earned = pong.earnedCount(), allBadges = Math.max(1, pong.badges.size()); %>
      <a class="acct-progress" href="#pong" aria-label="<%= t.getProperty("pong.badges.title") %> <%= earned %>/<%= pong.badges.size() %>">
        <span class="acct-progress-bar" style="--p:<%= earned * 100 / allBadges %>%"><i></i></span>
        <span class="acct-progress-n"><i class="fa-solid fa-medal" aria-hidden="true"></i> <%= earned %>/<%= pong.badges.size() %></span>
      </a>
      <%-- výstavka: jen co si hráč vyplnil --%>
      <% if (showcase[0] != null) { %>
      <a class="acct-fav" href="<%= com.github.skeliit.I18n.songPath(request, showcase[0], 0) %>">
        <% if (showcase[3] != null) { %><img src="<%= WebUtils.escapeHtml(showcase[3]) %>" alt="" width="96" height="54" loading="lazy"><% } %>
        <span><small><i class="fa-solid fa-heart" aria-hidden="true"></i> <%= t.getProperty("profile.favSong") %></small><b><%= WebUtils.escapeHtml(showcase[1]) %></b></span>
        <i class="fa-solid fa-play acct-fav-play" aria-hidden="true"></i>
      </a>
      <% } %>
      <% if (earned > 0) { %><ul class="acct-chips">
        <% int shown = 0; for (PongProfile.Badge b : pong.badges) { if (!b.earned || shown >= 3) continue; shown++; %>
        <li><i class="fa-solid <%= b.icon %>" aria-hidden="true"></i> <%= t.getProperty("pong.badge." + b.key) %></li>
        <% } %>
      </ul><% } %>
    </div>
    <ul class="acct-stats">
      <li><strong><%= me != null ? me.comments : 0 %></strong><span><%= t.getProperty("account.stats.comments") %></span></li>
      <li><strong><%= me != null ? me.likes : 0 %></strong><span><i class="fa-solid fa-thumbs-up"></i> <%= t.getProperty("account.stats.likes") %></span></li>
      <li><strong><%= me != null ? me.hearts : 0 %></strong><span><i class="fa-solid fa-heart"></i> <%= t.getProperty("account.stats.hearts") %></span></li>
      <% Integer bestAll = null; for (Integer b : pong.bestMs) if (b != null && (bestAll == null || b < bestAll)) bestAll = b; %>
      <li><strong><%= pong.wins %></strong><span><i class="fa-solid fa-trophy"></i> <%= t.getProperty("account.stats.wins") %></span></li>
      <li><strong><%= bestAll == null ? "–" : PongProfile.time(bestAll) %></strong><span><i class="fa-solid fa-stopwatch"></i> <%= t.getProperty("account.stats.best") %></span></li>
    </ul>
  </section>

  <%-- Comments: everything you wrote under lyrics and clips; edit in place or delete --%>
  <section class="acct-card" id="komentare">
    <header class="acct-card-head">
      <h3><i class="fa-solid fa-comments"></i> <%= t.getProperty("account.tab.comments") %></h3>
      <p><%= t.getProperty("account.commentsLead") %></p>
    </header>
    <% if (myComments.isEmpty()) { %>
      <p class="acct-empty"><%= t.getProperty("cmt.none") %></p>
    <% } %>
    <div class="acct-comments">
    <% for (UserComment uc : myComments) { %>
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
    </div>
  </section>

  <%-- CatSmash: nejlepší výhra a místo na každé obtížnosti, odznaky (počítá je server z uložených výher) --%>
  <section class="acct-card" id="pong">
    <header class="acct-card-head">
      <h3><i class="fa-solid fa-table-tennis-paddle-ball"></i> <%= t.getProperty("account.tab.pong") %></h3>
      <p><%= t.getProperty("pong.profile.lead") %></p>
    </header>
    <div class="pong-best">
    <% for (int d = 1; d <= 3; d++) { %>
      <div class="pong-best-item<%= pong.bestMs[d - 1] != null ? " on" : "" %>">
        <span class="pong-best-level"><%= t.getProperty("pong.level." + d) %></span>
        <% if (pong.bestMs[d - 1] != null) { %>
          <b><%= PongProfile.time(pong.bestMs[d - 1]) %></b>
          <% if (pong.place[d - 1] != null) { %><span class="acct-dim"><%= t.getProperty("pong.profile.place").replace("{0}", String.valueOf(pong.place[d - 1])) %></span><% } %>
        <% } else { %>
          <span class="acct-dim"><%= t.getProperty("pong.profile.notYet") %></span>
        <% } %>
      </div>
    <% } %>
    </div>
    <%-- odznaky v rolovacím okně: získané nahoře, u každého jak ho získat a odměna ve hře --%>
    <div class="pong-badge-box">
      <div class="pong-badge-head">
        <b><%= t.getProperty("pong.badges.title") %></b>
        <span><%= pong.earnedCount() %> / <%= pong.badges.size() %></span>
        <span class="pong-badge-bar" style="--p:<%= pong.badges.isEmpty() ? 0 : pong.earnedCount() * 100 / pong.badges.size() %>%" aria-hidden="true"></span>
      </div>
      <p class="pong-badge-rule"><%= t.getProperty("pong.badges.rule") %></p>
      <ul class="pong-badges" tabindex="0" aria-label="<%= t.getProperty("pong.badges.title") %>">
      <% for (int pass = 0; pass < 2; pass++) for (PongProfile.Badge b : pong.badges) {
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
      <% } %>
      </ul>
    </div>
    <p class="pong-play-row"><a class="btn-primary" href="/?kevin=pong"><i class="fa-solid fa-play"></i> <%= t.getProperty("pong.profile.play") %></a></p>
  </section>

  <% } %>
</main>
<%@ include file="includes/footer.jsp" %>
