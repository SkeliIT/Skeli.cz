<%@ page import="com.github.skeliit.dao.UserDao, com.github.skeliit.model.UserProfile, com.github.skeliit.model.UserComment, com.github.skeliit.model.AccountSummary, com.github.skeliit.WebUtils" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%-- "My account": profile and settings in one page. A card with your photo and numbers on top, a bar
     of jumps to the parts (Profile, Comments, Security, Privacy), each part in its own card. --%>
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
    try {
      UserDao users = new UserDao();          // dao/UserDao
      UserProfile p = users.profile(uid);     // nothing saved yet = null
      if (p != null) {
        displayName = p.displayName; age = p.age; city = p.city; bio = p.bio; theme = p.theme;
        if (p.lang != null) prefLang = p.lang;
      }
      me = users.summary(uid);
      myComments = users.comments(uid);
    } catch (Exception ignore) {}
    String avatarUrl = WebUtils.safeUrl((String) session.getAttribute("avatar_url"), "/img/avatar-default.svg");
    String shownName = displayName != null && !displayName.isBlank() ? displayName : (me != null ? me.username : (String) session.getAttribute("username"));

    // messages after a redirect: fixed codes only, never echoed back
    String okKey = null;
    if ("true".equals(request.getParameter("saved"))) okKey = "settings.saved";
    if ("true".equals(request.getParameter("password_changed"))) okKey = "settings.passwordChanged";
    if (request.getParameter("signedOut") != null) okKey = "settings.signedOutOthers";
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
  %>

  <%-- who you are: photo (click = choose a new one), name, since when, numbers --%>
  <section class="acct-card acct-hero">
    <label class="acct-photo" for="avatar-input" title="<%= t.getProperty("account.changePhoto") %>">
      <img class="acct-avatar" src="<%= WebUtils.escapeHtml(avatarUrl) %>" alt="">
      <span class="acct-photo-edit" aria-hidden="true"><i class="fa-solid fa-camera"></i></span>
      <span class="sr-only"><%= t.getProperty("account.changePhoto") %></span>
    </label>
    <div class="acct-who">
      <h2 class="acct-name"><%= WebUtils.escapeHtml(shownName) %>
        <% if (me != null && me.artist) { %><span class="acct-badge artist"><i class="fa-solid fa-circle-check"></i> <%= t.getProperty("cmt.artist") %></span><% } %>
        <% if (me != null && me.admin) { %><span class="acct-badge">★ Admin</span><% } %>
      </h2>
      <p class="acct-meta">
        <% if (me != null) { %>@<%= WebUtils.escapeHtml(me.username) %><% } %>
        <% if (me != null && me.memberSince != null) { %> · <%= WebUtils.escapeHtml(t.getProperty("account.memberSince").replace("{0}",
             java.time.format.DateTimeFormatter.ofLocalizedDate(java.time.format.FormatStyle.LONG).withLocale(java.util.Locale.forLanguageTag(cur)).format(me.memberSince.toLocalDateTime()))) %><% } %>
      </p>
      <% if (bio != null && !bio.isBlank()) { %><p class="acct-bio"><%= WebUtils.escapeHtml(bio) %></p><% } %>
    </div>
    <ul class="acct-stats">
      <li><strong><%= me != null ? me.comments : 0 %></strong><span><%= t.getProperty("account.stats.comments") %></span></li>
      <li><strong><%= me != null ? me.likes : 0 %></strong><span><i class="fa-solid fa-thumbs-up"></i> <%= t.getProperty("account.stats.likes") %></span></li>
      <li><strong><%= me != null ? me.hearts : 0 %></strong><span><i class="fa-solid fa-heart"></i> <%= t.getProperty("account.stats.hearts") %></span></li>
    </ul>
  </section>

  <% if (okKey != null) { %><div class="form-success text-center"><%= t.getProperty(okKey) %></div><% } %>
  <% if (errKey != null) { %><div class="form-alert text-center"><%= t.getProperty(errKey) %></div><% } %>

  <%-- jumps to the parts; the one in view lights up (script below) --%>
  <nav class="acct-tabs" aria-label="<%= t.getProperty("menu.account") %>">
    <a href="#profil"><i class="fa-solid fa-user"></i> <%= t.getProperty("account.tab.profile") %></a>
    <a href="#komentare"><i class="fa-solid fa-comments"></i> <%= t.getProperty("account.tab.comments") %> <span class="acct-count"><%= myComments.size() %></span></a>
    <a href="#zabezpeceni"><i class="fa-solid fa-shield-halved"></i> <%= t.getProperty("account.tab.security") %></a>
    <a href="#soukromi"><i class="fa-solid fa-user-lock"></i> <%= t.getProperty("account.tab.privacy") %></a>
  </nav>

  <%-- Profile: photo, name and the rest, how the site looks for you --%>
  <section class="acct-card" id="profil">
    <header class="acct-card-head">
      <h3><i class="fa-solid fa-user"></i> <%= t.getProperty("account.tab.profile") %></h3>
      <p><%= t.getProperty("account.profileLead") %></p>
    </header>
    <div class="acct-block">
      <%@ include file="/includes/avatar-editor.jspf" %>
    </div>
    <div class="settings-form acct-block">
      <form method="post" action="/profile/update" enctype="application/x-www-form-urlencoded" class="acct-form-grid">
        <input type="hidden" name="csrf" value="${csrf}">
        <label><%= t.getProperty("settings.displayName") %><input name="display_name" maxlength="60" value="<%= WebUtils.escapeHtml(displayName) %>"></label>
        <label><%= t.getProperty("settings.city") %><input name="city" maxlength="80" value="<%= WebUtils.escapeHtml(city) %>"></label>
        <label><%= t.getProperty("settings.age") %><input type="number" name="age" min="1" max="120" value="<%= (age != null ? age : "") %>"></label>
        <label><%= t.getProperty("settings.theme") %>
          <select name="theme">
            <option value="dark" <%= "dark".equals(theme) ? "selected" : "" %>><%= t.getProperty("settings.theme.dark") %></option>
            <option value="light" <%= "light".equals(theme) ? "selected" : "" %>><%= t.getProperty("settings.theme.light") %></option>
          </select>
        </label>
        <label class="wide"><%= t.getProperty("settings.bio") %><textarea name="bio" rows="3"><%= WebUtils.escapeHtml(bio) %></textarea></label>
        <label><%= t.getProperty("header.language") %>
          <select name="lang">
            <option value="cs" <%= "cs".equals(prefLang) ? "selected" : "" %>>Čeština</option>
            <option value="en" <%= "en".equals(prefLang) ? "selected" : "" %>>English</option>
            <option value="de" <%= "de".equals(prefLang) ? "selected" : "" %>>Deutsch</option>
            <option value="uk" <%= "uk".equals(prefLang) ? "selected" : "" %>>Українська</option>
            <option value="vi" <%= "vi".equals(prefLang) ? "selected" : "" %>>Tiếng Việt</option>
          </select>
        </label>
        <label class="checkbox-label"><input type="checkbox" name="public_profile" value="1"> <%= t.getProperty("settings.public") %></label>
        <div class="form-actions wide"><button type="submit"><i class="fa-solid fa-floppy-disk"></i> <%= t.getProperty("common.save") %></button></div>
      </form>
    </div>
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

  <%-- Security: password and the devices you are signed in on --%>
  <section class="acct-card" id="zabezpeceni">
    <header class="acct-card-head">
      <h3><i class="fa-solid fa-shield-halved"></i> <%= t.getProperty("account.tab.security") %></h3>
      <p><%= t.getProperty("account.securityLead") %></p>
    </header>
    <div class="acct-cols">
      <div class="settings-form acct-block">
        <h4><%= t.getProperty("settings.password") %></h4>
        <form method="post" action="/profile/change-password">
          <input type="hidden" name="csrf" value="${csrf}">
          <label><%= t.getProperty("settings.oldPassword") %> <input type="password" name="old_password" required autocomplete="current-password"></label>
          <label><%= t.getProperty("settings.newPassword") %> <input type="password" name="new_password" minlength="8" required autocomplete="new-password" data-pw="new"></label>
          <label><%= t.getProperty("settings.confirmPassword") %> <input type="password" name="confirm_password" minlength="8" required autocomplete="new-password" data-pw="confirm"></label>
          <%@ include file="includes/password-rules.jspf" %>
          <div class="form-actions"><button type="submit"><%= t.getProperty("settings.changePassword") %></button></div>
        </form>
      </div>
      <%-- signed in on a phone, a friend's computer…? end all the other sessions at once --%>
      <div class="settings-form acct-block">
        <h4><%= t.getProperty("settings.devices") %></h4>
        <p class="acct-dim"><%= t.getProperty("settings.devicesText") %></p>
        <form method="post" action="/profile/signout-others">
          <input type="hidden" name="csrf" value="${csrf}">
          <button type="submit" class="btn-outline"><i class="fa-solid fa-right-from-bracket"></i> <%= t.getProperty("settings.signOutOthers") %></button>
        </form>
      </div>
    </div>
  </section>

  <%-- Privacy: your data as a file, or the account gone for good --%>
  <section class="acct-card" id="soukromi">
    <header class="acct-card-head">
      <h3><i class="fa-solid fa-user-lock"></i> <%= t.getProperty("account.tab.privacy") %></h3>
      <p><%= t.getProperty("account.privacyLead") %></p>
    </header>
    <div class="acct-cols">
      <div class="settings-form acct-block">
        <h4><%= t.getProperty("settings.export") %></h4>
        <p class="acct-dim"><%= t.getProperty("account.exportText") %></p>
        <form method="get" action="/profile/export">
          <button type="submit" class="btn-outline"><i class="fa-solid fa-download"></i> <%= t.getProperty("settings.export") %></button>
        </form>
      </div>
      <div class="settings-form acct-block acct-danger">
        <h4><%= t.getProperty("settings.deleteAccount") %></h4>
        <p class="acct-dim"><%= t.getProperty("account.deleteText") %></p>
        <form method="post" action="/profile/delete" onsubmit="return confirm('<%= WebUtils.escapeJs(t.getProperty("settings.deleteConfirm")) %>');">
          <input type="hidden" name="csrf" value="${csrf}">
          <label><%= WebUtils.escapeHtml(t.getProperty("settings.deleteLabel")) %><input type="text" name="confirm" required autocomplete="off"></label>
          <div class="form-actions"><button type="submit" class="btn-delete"><i class="fa-solid fa-trash-can"></i> <%= t.getProperty("settings.deleteAccount") %></button></div>
        </form>
      </div>
    </div>
  </section>

  <script>
    // the part in view lights up in the bar of jumps
    (function () {
      const links = Array.from(document.querySelectorAll('.acct-tabs a'));
      if (!links.length || !('IntersectionObserver' in window)) return;
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
        });
      }, { rootMargin: '-35% 0px -60% 0px' });
      links.forEach(function (a) { const s = document.querySelector(a.getAttribute('href')); if (s) io.observe(s); });
    })();
  </script>
  <% } %>
  <%-- the photo cropper (inside <main>, so it also runs after PJAX navigation) --%>
  <link href="/vendor/cropper/cropper.min.css" rel="stylesheet">
  <script src="/js/avatar-editor.js?v=<%= assetVersion %>"></script>
</main>
<%@ include file="includes/footer.jsp" %>
