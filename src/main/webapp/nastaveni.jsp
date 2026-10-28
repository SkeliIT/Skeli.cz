<%@ page import="com.github.skeliit.dao.UserDao, com.github.skeliit.model.UserProfile, com.github.skeliit.model.UserComment, com.github.skeliit.model.AccountSummary, com.github.skeliit.WebUtils, com.github.skeliit.dao.PongDao, com.github.skeliit.model.PongProfile" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%-- Nastavení účtu: záložky Profil (fotka, jména, výstavka, vzhled a jazyk, rámeček fotky), Zabezpečení
     (heslo, zařízení, dvoufázové ověření) a Soukromí (export, smazání). Vidět je vždy jedna záložka – podle
     #kotvy v adrese (formuláře se po uložení vracejí na svou záložku); bez JavaScriptu jsou vidět všechny. --%>
<main class="account-page settings-page">
  <% if (session.getAttribute("user_id") == null) { %>
  <%-- signed out (e.g. the sign-in expired): no forms, just a way back in --%>
  <div class="settings-wrap">
    <section class="acct-card acct-signed-out text-center">
      <h2 class="font-display"><%= t.getProperty("menu.account") %></h2>
      <p><%= t.getProperty("profile.loginRequired") %></p>
      <a class="btn btn-primary" href="/login.jsp?next=%2Fnastaveni.jsp"><i class="fa-solid fa-right-to-bracket"></i> <%= t.getProperty("auth.submit.login") %></a>
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

  <%-- nahoře: nadpis a cesta zpět na profil --%>
  <header class="settings-head">
    <a class="settings-back" href="/uzivatel.jsp"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> <%= t.getProperty("account.backToProfile") %></a>
    <h1 class="font-display"><i class="fa-solid fa-gear" aria-hidden="true"></i> <%= t.getProperty("menu.settings") %></h1>
  </header>

  <% if (okKey != null) { %><div class="form-success text-center"><%= t.getProperty(okKey) %></div><% } %>
  <% if (errKey != null) { %><div class="form-alert text-center"><%= t.getProperty(errKey) %></div><% } %>

  <%-- záložky: vidět je vždy jen jedna část (skript dole) --%>
  <nav class="acct-tabs settings-tabs" aria-label="<%= t.getProperty("menu.settings") %>">
    <a href="#profil"><i class="fa-solid fa-user"></i> <%= t.getProperty("account.tab.profile") %></a>
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
    <%-- uživatelské jméno (vidí ho ostatní u komentářů); jde změnit i u účtu přes Google --%>
    <div class="settings-form acct-block">
      <form method="post" action="/profile/username" class="acct-form-grid acct-username">
        <input type="hidden" name="csrf" value="${csrf}">
        <label><%= t.getProperty("account.username") %>
          <input name="username" required minlength="3" maxlength="50" autocomplete="username"
                 value="<%= WebUtils.escapeHtml(me != null ? me.username : (String) session.getAttribute("username")) %>">
        </label>
        <p class="acct-dim"><%= t.getProperty("account.username.hint") %></p>
        <button type="submit" class="btn-primary"><%= t.getProperty("account.username.save") %></button>
      </form>
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
        <label><%= t.getProperty("profile.favSong") %>
          <select name="fav_song">
            <option value=""><%= t.getProperty("profile.favSong.none") %></option>
            <% for (String[] sc : songChoices) { %><option value="<%= WebUtils.escapeHtml(sc[0]) %>"<%= sc[0].equals(showcase[0]) ? " selected" : "" %>><%= WebUtils.escapeHtml(sc[1]) %></option><% } %>
          </select>
        </label>
        <label class="wide"><%= t.getProperty("profile.motto") %>
          <input type="text" name="motto" maxlength="160" value="<%= WebUtils.escapeHtml(showcase[2] == null ? "" : showcase[2]) %>" placeholder="<%= t.getProperty("profile.motto.hint") %>">
        </label>
        <fieldset class="wide motto-fonts"><legend><%= t.getProperty("profile.mottoFont") %></legend>
          <% for (String mf : com.github.skeliit.dao.UserDao.MOTTO_FONTS) { %>
          <label class="motto-font-opt"><input type="radio" name="motto_font" value="<%= mf %>"<%= mf.equals(showcase[4]) ? " checked" : "" %>>
            <span class="motto-<%= mf %>"><%= t.getProperty("profile.mottoFont." + mf) %></span></label>
          <% } %>
        </fieldset>
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
    <%-- titul u jména: jeden získaný odznak (ukazuje se v komentářích a v tabulce pořadí) --%>
    <% if (com.github.skeliit.model.PongBadges.TITLES_ON) { %>
    <form class="pong-title-form" method="post" action="/api/pong/title">
      <input type="hidden" name="csrf" value="${csrf}">
      <input type="hidden" name="back" value="account">
      <label for="pongTitle"><b><%= t.getProperty("pong.title.title") %></b> <span class="acct-dim"><%= t.getProperty("pong.title.lead") %></span></label>
      <% if ("1".equals(request.getParameter("pongTitle"))) { %><p class="pong-title-msg ok" role="status"><%= t.getProperty("pong.title.saved") %></p><% } %>
      <% if ("0".equals(request.getParameter("pongTitle"))) { %><p class="pong-title-msg" role="alert"><%= t.getProperty("pong.title.failed") %></p><% } %>
      <% if (pong.earnedCount() == 0) { %>
        <p class="acct-dim"><%= t.getProperty("pong.title.empty") %></p>
      <% } else { %>
      <div class="pong-title-row">
        <select id="pongTitle" name="t">
          <option value=""><%= t.getProperty("pong.title.none") %></option>
          <% for (PongProfile.Badge b : pong.badges) { if (!b.earned) continue; %>
          <option value="<%= b.key %>"<%= b.key.equals(pong.title) ? " selected" : "" %>><%= WebUtils.escapeHtml(t.getProperty("pong.badge." + b.key)) %></option>
          <% } %>
        </select>
        <button type="submit" class="btn-primary"><%= t.getProperty("pong.title.save") %></button>
      </div>
      <% } %>
    </form>
    <% } %>
    <%-- rámeček kolem fotky: jen z odznaků PongBadges.FRAMES (ukazuje se v komentářích, v tabulce a tady na profilu) --%>
    <form class="pong-title-form pong-frame-form" method="post" action="/api/pong/frame">
      <input type="hidden" name="csrf" value="${csrf}">
      <input type="hidden" name="back" value="account">
      <label for="pongFrame"><b><%= t.getProperty("pong.frame.title") %></b> <span class="acct-dim"><%= t.getProperty("pong.frame.lead") %></span></label>
      <% if ("1".equals(request.getParameter("pongFrame"))) { %><p class="pong-title-msg ok" role="status"><%= t.getProperty("pong.frame.saved") %></p><% } %>
      <% if ("0".equals(request.getParameter("pongFrame"))) { %><p class="pong-title-msg" role="alert"><%= t.getProperty("pong.title.failed") %></p><% } %>
      <% boolean anyFrame = false; for (PongProfile.Badge b : pong.badges) if (b.earned && com.github.skeliit.model.PongBadges.isFrame(b.key)) anyFrame = true; %>
      <% if (!anyFrame) { %>
        <p class="acct-dim"><%= t.getProperty("pong.frame.empty") %></p>
      <% } else { %>
      <div class="pong-title-row">
        <select id="pongFrame" name="f">
          <option value=""><%= t.getProperty("pong.frame.none") %></option>
          <% for (PongProfile.Badge b : pong.badges) { if (!b.earned || !com.github.skeliit.model.PongBadges.isFrame(b.key)) continue; %>
          <option value="<%= b.key %>"<%= b.key.equals(pong.frame) ? " selected" : "" %>><%= WebUtils.escapeHtml(t.getProperty("pong.frame." + b.key)) %></option>
          <% } %>
        </select>
        <button type="submit" class="btn-primary"><%= t.getProperty("pong.title.save") %></button>
      </div>
      <% } %>
    </form>
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
    <%-- two-factor sign-in (web/profile/TwoFactorSetupServlet): off → a QR code for the app → on, with backup codes --%>
    <%
      com.github.skeliit.dao.TwoFactorDao.State tfa = null;
      try { tfa = new com.github.skeliit.dao.TwoFactorDao().state(uid); } catch (Exception ignore) {}
      String tfaSetup = (String) session.getAttribute(com.github.skeliit.web.profile.TwoFactorSetupServlet.SETUP);
      @SuppressWarnings("unchecked")
      java.util.List<String> tfaCodes = (java.util.List<String>) session.getAttribute(com.github.skeliit.web.profile.TwoFactorSetupServlet.NEW_CODES);
      if (tfaCodes != null) session.removeAttribute(com.github.skeliit.web.profile.TwoFactorSetupServlet.NEW_CODES);   // shown once
      String tfaMsg = request.getParameter("tfa");
      boolean tfaGood = "on".equals(tfaMsg) || "off".equals(tfaMsg) || "codes".equals(tfaMsg);
      boolean tfaBad = "wrong".equals(tfaMsg) || "required".equals(tfaMsg) || "admin".equals(tfaMsg);
      boolean tfaAdminLocked = "ADMIN".equals(session.getAttribute("role")) && com.github.skeliit.web.profile.TwoFactorSetupServlet.requiredForAdmins();
      String tfaAccount = me != null ? me.username : String.valueOf(session.getAttribute("username"));
    %>
    <div class="settings-form acct-block acct-tfa" id="dvoufazove">
      <h4><i class="fa-solid fa-mobile-screen-button" aria-hidden="true"></i> <%= t.getProperty("tfa.title") %></h4>
      <% if (tfaGood) { %><div class="form-success"><%= t.getProperty("tfa.msg." + tfaMsg) %></div><% } %>
      <% if (tfaBad) { %><div class="form-alert"><%= t.getProperty("tfa.msg." + tfaMsg) %></div><% } %>
      <p class="acct-dim"><%= t.getProperty("tfa.lead") %></p>
      <% if (tfaCodes != null) { %>
        <div class="tfa-codes">
          <b><%= t.getProperty("tfa.newCodesTitle") %></b>
          <p class="acct-dim"><%= t.getProperty("tfa.newCodesText") %></p>
          <ol><% for (String c : tfaCodes) { %><li><code><%= WebUtils.escapeHtml(c) %></code></li><% } %></ol>
        </div>
      <% } %>
      <% if (tfa != null && tfa.isEnabled()) { %>
        <p><i class="fa-solid fa-circle-check tfa-ok" aria-hidden="true"></i> <%= t.getProperty("tfa.on").replace("{date}", WebUtils.formatDateTime(tfa.enabledAt, cur)) %>
          <%= t.getProperty("tfa.codesLeft").replace("{n}", String.valueOf(tfa.codesLeft)) %></p>
        <p class="acct-dim"><%= t.getProperty("tfa.disableText") %></p>
        <form method="post" action="/profile/2fa" class="tfa-form">
          <input type="hidden" name="csrf" value="${csrf}">
          <label><%= t.getProperty("tfa.code") %> <input type="text" name="code" required autocomplete="one-time-code" inputmode="numeric" maxlength="12" class="tfa-code-input"></label>
          <div class="form-actions">
            <button type="submit" name="action" value="codes" class="btn-outline"><i class="fa-solid fa-key" aria-hidden="true"></i> <%= t.getProperty("tfa.regenerate") %></button>
            <% if (!tfaAdminLocked) { %><button type="submit" name="action" value="disable" class="btn-delete"><%= t.getProperty("tfa.disable") %></button><% } %>
          </div>
        </form>
        <% if (tfaAdminLocked) { %><p class="acct-dim"><%= t.getProperty("tfa.adminLocked") %></p><% } %>
      <% } else if (tfaSetup != null) { String uri = com.github.skeliit.security.Totp.otpauthUri(tfaAccount, tfaSetup); %>
        <p><%= t.getProperty("tfa.scan") %></p>
        <div class="tfa-setup">
          <div class="tfa-qr" role="img" aria-label="QR"><%= com.github.skeliit.security.Totp.qrSvg(uri) %></div>
          <div>
            <p class="acct-dim"><%= t.getProperty("tfa.key") %><br><code class="tfa-key"><%= com.github.skeliit.security.Totp.grouped(tfaSetup) %></code></p>
            <p><a href="<%= WebUtils.escapeHtml(uri) %>" class="tfa-open"><i class="fa-solid fa-mobile-screen" aria-hidden="true"></i> <%= t.getProperty("tfa.openApp") %></a></p>
          </div>
        </div>
        <form method="post" action="/profile/2fa" class="tfa-form">
          <input type="hidden" name="csrf" value="${csrf}">
          <label><%= t.getProperty("tfa.code") %> <input type="text" name="code" required autofocus autocomplete="one-time-code" inputmode="numeric" maxlength="12" class="tfa-code-input" placeholder="123456"></label>
          <div class="form-actions">
            <button type="submit" name="action" value="confirm"><%= t.getProperty("tfa.confirm") %></button>
            <button type="submit" name="action" value="cancel" class="btn-outline" formnovalidate><%= t.getProperty("tfa.cancel") %></button>
          </div>
        </form>
      <% } else { %>
        <p><%= t.getProperty("tfa.off") %></p>
        <form method="post" action="/profile/2fa">
          <input type="hidden" name="csrf" value="${csrf}">
          <input type="hidden" name="action" value="start">
          <button type="submit"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> <%= t.getProperty("tfa.start") %></button>
        </form>
      <% } %>
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
    // záložky: ukáže se jen část podle #kotvy (i kotva uvnitř části, třeba #dvoufazove), výchozí je Profil
    (function () {
      const parts = Array.from(document.querySelectorAll('main.settings-page > section.acct-card[id]'));
      const links = Array.from(document.querySelectorAll('.settings-tabs a'));
      if (!parts.length) return;
      function show() {
        const want = location.hash ? document.getElementById(location.hash.slice(1)) : null;
        const part = (want && parts.find(function (p) { return p === want || p.contains(want); })) || parts[0];
        parts.forEach(function (p) { p.hidden = p !== part; });
        links.forEach(function (a) { const on = a.getAttribute('href') === '#' + part.id; a.classList.toggle('active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
        if (want && want !== part) want.scrollIntoView({ block: 'start' });
      }
      links.forEach(function (a) {
        a.addEventListener('click', function (e) { e.preventDefault(); history.replaceState(null, '', a.getAttribute('href')); show(); window.scrollTo(0, 0); });
      });
      window.addEventListener('hashchange', show);
      show();
    })();
  </script>
  <% } %>
  <%-- the photo cropper (inside <main>, so it also runs after PJAX navigation) --%>
  <link href="/vendor/cropper/cropper.min.css" rel="stylesheet">
  <script src="/js/avatar-editor.js?v=<%= assetVersion %>"></script>
</main>
<%@ include file="includes/footer.jsp" %>
