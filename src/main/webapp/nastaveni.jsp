<%@ page import="com.github.skeliit.dao.UserDao, com.github.skeliit.model.UserProfile, com.github.skeliit.model.UserComment, com.github.skeliit.model.AccountSummary, com.github.skeliit.WebUtils, com.github.skeliit.dao.PongDao, com.github.skeliit.model.PongProfile" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%-- Nastavení účtu po sekcích: Profil, Soukromí, Vzhled, Tvorba, Web a jazyk, Zabezpečení, Účet a data.
     Telefon: seznam sekcí, ťuknutí otevře jednu (jako v aplikaci). Počítač: seznam vlevo, sekce vpravo.
     Řídí to #kotva v adrese (formuláře se po uložení vracejí na svou sekci); bez JavaScriptu je vidět všechno. --%>
<%!
  /** Nápověda „?“ v Nastavení: krátký text je vidět hned, podrobnosti až po ťuknutí (funguje i klávesnicí a čtečkou). */
  private static String setHelp(java.util.Properties t, String key) {
    String v = t.getProperty(key);
    if (v == null) return "";
    return "<details class=\"set-help\"><summary><span aria-hidden=\"true\">?</span><span class=\"sr-only\">"
        + com.github.skeliit.WebUtils.escapeHtml(t.getProperty("settings.help.more")) + "</span></summary><p>" + com.github.skeliit.WebUtils.escapeHtml(v) + "</p></details>";
  }
%>
<main class="account-page settings-page">
  <% if (session.getAttribute("user_id") == null) { %>
  <%-- signed out (e.g. the sign-in expired): no forms, just a way back in --%>
  <div class="settings-wrap">
    <section class="acct-card acct-signed-out text-center">
      <h2 class="font-display"><%= t.getProperty("settings.heading") %></h2>
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
    boolean profilePublic = true, coverPublic = true, friendRequests = true;
    boolean communityPublic = false;
    boolean pongPublic = false;
    boolean[] sharing = new boolean[8];   // {pár slov o sobě, město, písně se srdcem, přátelé, stav online, moje tvorba, profil i pro nepřihlášené, aktivita}
    java.util.Set<String> siteEarned = java.util.Set.of();
    java.util.List<String> shownBadges = java.util.List.of();
    boolean chatOpen = true;
    String coverUrl = null;
    try {
      UserDao users = new UserDao();          // dao/UserDao
      UserProfile p = users.profile(uid);     // nothing saved yet = null
      if (p != null) {
        displayName = p.displayName; age = p.age; city = p.city; bio = p.bio; theme = p.theme;
        if (p.lang != null) prefLang = p.lang;
      }
      me = users.summary(uid);
      profilePublic = users.profilePublic(uid);
      coverPublic = users.coverPublic(uid);
      friendRequests = users.friendRequests(uid);
      sharing = users.sharing(uid);
      communityPublic = users.communityPublic(uid);
      pongPublic = users.pongPublic(uid);
      shownBadges = users.showcaseBadges(uid);
      chatOpen = users.chatOpen(uid);
      siteEarned = new com.github.skeliit.dao.SiteBadgeDao().sync(uid);
      coverUrl = users.cover(uid);
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

  <%-- Nastavení po sekcích: telefon = seznam sekcí (jako v aplikaci), ťuknutí otevře jednu a nahoře je cesta zpět;
       počítač = seznam vlevo, vybraná sekce vpravo. Řídí to #kotva v adrese (skript dole), bez JavaScriptu je vidět všechno. --%>
  <% String[][] setNav = {
       { "profil", "fa-user", "account.tab.profile", "settings.nav.profile" },
       { "soukromi", "fa-user-lock", "account.tab.privacy", "settings.nav.privacy" },
       { "vzhled", "fa-palette", "look.tab", "settings.nav.look" },
       { "tvorba", "fa-music", "tracks.tab", "settings.nav.tracks" },
       { "web", "fa-globe", "settings.tab.web", "settings.nav.web" },
       { "zabezpeceni", "fa-shield-halved", "account.tab.security", "settings.nav.security" },
       { "ucet", "fa-download", "settings.tab.data", "settings.nav.data" } }; %>
  <div class="set-layout">
  <nav class="set-nav" aria-label="<%= t.getProperty("menu.settings") %>">
    <% for (String[] n : setNav) { %>
    <a href="#<%= n[0] %>"<%= "ucet".equals(n[0]) ? " class=\"set-nav-end\"" : "" %>>
      <i class="fa-solid <%= n[1] %>" aria-hidden="true"></i>
      <span><b><%= t.getProperty(n[2]) %></b><small><%= t.getProperty(n[3]) %></small></span>
      <i class="fa-solid fa-chevron-right set-nav-go" aria-hidden="true"></i>
    </a>
    <% } %>
  </nav>
  <div class="set-body">
  <a class="set-back" href="#"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> <%= t.getProperty("menu.settings") %></a>

  <%-- Moje tvorba: skladby odkazem z YouTube, Spotify, Apple Music a SoundCloudu (nic se nenahrává) --%>
  <section class="acct-card" id="tvorba">
    <header class="acct-card-head">
      <h3><i class="fa-solid fa-music" aria-hidden="true"></i> <%= t.getProperty("tracks.title") %></h3>
      <p><%= t.getProperty("tracks.lead") %></p><%= setHelp(t, "tracks.lead.more") %>
    </header>
    <%
      String tracksMsg = request.getParameter("tracks");
      if (tracksMsg != null && java.util.Set.of("saved", "deleted").contains(tracksMsg)) { %><p class="form-success" role="status"><%= t.getProperty("tracks.msg." + tracksMsg) %></p><% }
      if (tracksMsg != null && java.util.Set.of("link", "nolink", "title", "rights", "limit", "verify", "fail").contains(tracksMsg)) { %><p class="form-alert" role="alert"><%= t.getProperty("tracks.msg." + tracksMsg) %></p><% }
      @SuppressWarnings("unchecked")
      java.util.Map<String, String> trackDraft = (java.util.Map<String, String>) session.getAttribute("tracksDraft");
      session.removeAttribute("tracksDraft");
      java.util.List<com.github.skeliit.model.UserTrack> myTracks = java.util.List.of();
      try { myTracks = new com.github.skeliit.dao.UserTrackDao().list(uid, true); } catch (Exception ignore) {}
      java.util.List<com.github.skeliit.model.UserTrack> trackForms = new java.util.ArrayList<>();
      trackForms.add(null);          // první je formulář pro novou skladbu, pak jeden pro každou uloženou
      trackForms.addAll(myTracks);
      for (com.github.skeliit.model.UserTrack tr : trackForms) {
        boolean isNew = tr == null;
        String prefix = isNew ? "new" : "t" + tr.id;
        String vTitle = isNew ? (trackDraft == null ? "" : trackDraft.get("title")) : tr.title;
        String vYear = isNew ? (trackDraft == null ? "" : trackDraft.get("year")) : (tr.year == null ? "" : String.valueOf(tr.year));
        String vYt = isNew ? (trackDraft == null ? "" : trackDraft.get("youtube")) : tr.youtubeUrl();
        String vSp = isNew ? (trackDraft == null ? "" : trackDraft.get("spotify")) : tr.spotifyUrl();
        String vAp = isNew ? (trackDraft == null ? "" : trackDraft.get("apple")) : tr.appleUrl();
        String vSc = isNew ? (trackDraft == null ? "" : trackDraft.get("soundcloud")) : tr.soundcloudUrl();
    %>
    <% if (!isNew) { %>
    <details class="acct-more"><summary><%= WebUtils.escapeHtml(tr.title) %><% if (tr.hidden) { %> <i class="fa-solid fa-lock" aria-hidden="true"></i><% } %></summary>
    <% if (tr.hidden) { %><p class="acct-dim"><%= WebUtils.escapeHtml(t.getProperty("tracks.hidden").replace("{0}", tr.hiddenReason == null ? "" : tr.hiddenReason)) %></p><% } %>
    <% } %>
    <form method="post" action="/profile/tracks" class="acct-form-grid<%= isNew ? " track-form-new" : "" %>">
      <input type="hidden" name="csrf" value="${csrf}">
      <input type="hidden" name="action" value="save">
      <% if (!isNew) { %><input type="hidden" name="id" value="<%= tr.id %>"><% } %>
      <label><%= t.getProperty("tracks.name") %><input name="title" maxlength="120" value="<%= WebUtils.escapeHtml(vTitle) %>" placeholder="<%= t.getProperty("tracks.name.hint") %>"></label>
      <label><%= t.getProperty("tracks.year") %><input type="number" name="year" min="1950" max="2100" value="<%= WebUtils.escapeHtml(vYear) %>"></label>
      <label class="wide"><span><i class="fab fa-youtube" aria-hidden="true"></i> YouTube</span><input type="url" name="youtube" inputmode="url" maxlength="500" value="<%= WebUtils.escapeHtml(vYt) %>" placeholder="https://youtu.be/..."></label>
      <label class="wide"><span><i class="fab fa-spotify" aria-hidden="true"></i> Spotify</span><input type="url" name="spotify" inputmode="url" maxlength="500" value="<%= WebUtils.escapeHtml(vSp) %>" placeholder="https://open.spotify.com/track/..."></label>
      <label class="wide"><span><i class="fab fa-apple" aria-hidden="true"></i> Apple Music</span><input type="url" name="apple" inputmode="url" maxlength="500" value="<%= WebUtils.escapeHtml(vAp) %>" placeholder="https://music.apple.com/..."></label>
      <label class="wide"><span><i class="fab fa-soundcloud" aria-hidden="true"></i> SoundCloud</span><input type="url" name="soundcloud" inputmode="url" maxlength="500" value="<%= WebUtils.escapeHtml(vSc) %>" placeholder="https://soundcloud.com/..."></label>
      <label class="wide track-rights"><input type="checkbox" name="rights" value="1" required> <span><%= t.getProperty("tracks.rights") %></span></label>
      <div class="form-actions wide"><button type="submit"><i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> <%= t.getProperty(isNew ? "tracks.add" : "common.save") %></button></div>
    </form>
    <% if (!isNew) { %>
    <form method="post" action="/profile/tracks" onsubmit="return confirm('<%= WebUtils.escapeJs(t.getProperty("tracks.deleteConfirm")) %>');">
      <input type="hidden" name="csrf" value="${csrf}"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<%= tr.id %>">
      <button type="submit" class="btn-outline friend-btn"><i class="fa-solid fa-trash" aria-hidden="true"></i> <%= t.getProperty("tracks.delete") %></button>
    </form>
    </details>
    <% } %>
    <% } %>
  </section>

  <%-- Profile: photo, name and the rest, how the site looks for you --%>
  <section class="acct-card" id="profil">
    <header class="acct-card-head">
      <h3><i class="fa-solid fa-user"></i> <%= t.getProperty("account.tab.profile") %></h3>
      <p><%= t.getProperty("account.profileLead") %></p>
    </header>
    <div class="acct-block">
      <%@ include file="/includes/avatar-editor.jspf" %>
    </div>
    <div class="acct-block">
      <%@ include file="/includes/cover-editor.jspf" %>
    </div>
    <%-- uživatelské jméno (vidí ho ostatní u komentářů); jde změnit i u účtu přes Google --%>
    <div class="settings-form acct-block">
      <form method="post" action="/profile/username" class="acct-form-grid acct-username">
        <input type="hidden" name="csrf" value="${csrf}">
        <label><%= t.getProperty("account.username") %>
          <input name="username" required minlength="3" maxlength="50" autocomplete="username"
                 value="<%= WebUtils.escapeHtml(me != null ? me.username : (String) session.getAttribute("username")) %>">
        </label>
        <p class="acct-dim"><%= t.getProperty("account.username.hint") %></p><%= setHelp(t, "account.username.hint.more") %>
        <button type="submit" class="btn-primary"><%= t.getProperty("account.username.save") %></button>
      </form>
    </div>
    <div class="settings-form acct-block">
      <form method="post" action="/profile/update" enctype="application/x-www-form-urlencoded" class="acct-form-grid">
        <input type="hidden" name="csrf" value="${csrf}">
        <label><%= t.getProperty("settings.displayName") %><input name="display_name" maxlength="60" value="<%= WebUtils.escapeHtml(displayName) %>"></label>
        <label><%= t.getProperty("settings.city") %><input name="city" maxlength="80" value="<%= WebUtils.escapeHtml(city) %>"></label>
        <label><%= t.getProperty("settings.age") %><input type="number" name="age" min="1" max="120" value="<%= (age != null ? age : "") %>"></label>
        <label class="wide"><%= t.getProperty("settings.bio") %><textarea name="bio" rows="3"><%= WebUtils.escapeHtml(bio) %></textarea></label>
        <label><%= t.getProperty("profile.favSong") %>
          <select name="fav_song">
            <option value=""><%= t.getProperty("profile.favSong.none") %></option>
            <%-- dvě skupiny: Skeliho skladby, pod nimi spolupráce (cizí tracky, kde hostuje) --%>
            <% String favGroup = null;
               for (String[] sc : songChoices) {
                 String g = "1".equals(sc[2]) ? t.getProperty("music.collabs") : "Skeli";
                 if (!g.equals(favGroup)) { if (favGroup != null) { %></optgroup><% } favGroup = g; %><optgroup label="<%= WebUtils.escapeHtml(g) %>"><% } %>
            <option value="<%= WebUtils.escapeHtml(sc[0]) %>"<%= sc[0].equals(showcase[0]) ? " selected" : "" %>><%= WebUtils.escapeHtml(sc[1]) %></option><% }
               if (favGroup != null) { %></optgroup><% } %>
          </select>
        </label>
        <label class="wide"><%= t.getProperty("profile.motto") %>
          <input type="text" name="motto" maxlength="160" value="<%= WebUtils.escapeHtml(showcase[2] == null ? "" : showcase[2]) %>" placeholder="<%= t.getProperty("profile.motto.hint") %>">
        </label>
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
      <p class="acct-dim"><%= t.getProperty("tfa.lead") %></p><%= setHelp(t, "tfa.lead.more") %>
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
    <%-- Co o mně vidí ostatní: všechno, čím se hráč ukazuje ostatním, na jednom místě a dobrovolně
         (web/profile/ProfileVisibilityServlet). Nahoře živý náhled – mění se hned při přepínání, uloží se tlačítkem. --%>
    <% boolean anyFrame = false, anyMark = false;
       for (PongProfile.Badge b : pong.badges) { if (!b.earned) continue;
         if (com.github.skeliit.model.PongBadges.isFrame(b.key)) anyFrame = true;
         if (com.github.skeliit.model.PongBadges.isMark(b.key)) anyMark = true; }
       String visName = me != null ? me.username : (String) session.getAttribute("username"); %>
    <form class="vis-form<%= profilePublic ? "" : " vis-hidden" %>" id="viditelnost" method="post" action="/profile/visibility"
          data-champ="<%= pong.champPlace != null ? pong.champPlace : "" %>" data-frame="<%= pong.frame != null ? pong.frame : "" %>">
      <input type="hidden" name="csrf" value="${csrf}">
      <h4 class="vis-head"><i class="fa-solid fa-eye" aria-hidden="true"></i> <%= t.getProperty("vis.title") %></h4>
      <p class="acct-dim"><%= t.getProperty("vis.lead") %></p>
      <% if ("1".equals(request.getParameter("vis"))) { %><p class="pong-title-msg ok" role="status"><%= t.getProperty("vis.saved") %></p><% } %>
      <% if ("0".equals(request.getParameter("vis"))) { %><p class="pong-title-msg" role="alert"><%= t.getProperty("pong.title.failed") %></p><% } %>
      <div class="vis-preview" aria-hidden="true">
        <span class="vis-preview-label"><%= t.getProperty("vis.preview") %></span>
        <span class="vis-person">
          <span class="av-frame<%= pong.shownFrame != null ? " f-" + pong.shownFrame : "" %>" data-vis-av><img src="<%= WebUtils.escapeHtml(avatarUrl) %>" alt="" width="48" height="48"></span>
          <b><%= WebUtils.escapeHtml(visName) %></b>
          <i class="fa-solid vis-mark <%= pong.mark != null ? com.github.skeliit.model.PongBadges.icon(pong.mark) : "" %>" data-vis-mark<%= pong.mark == null ? " hidden" : "" %>></i>
        </span>
      </div>
      <ul class="vis-list">
        <li class="vis-row">
          <span class="vis-ico"><i class="fa-solid fa-id-card" aria-hidden="true"></i></span>
          <span class="vis-text"><b id="visPubT"><%= t.getProperty("settings.public") %></b><small><%= t.getProperty("profile.public.lead") %></small>
            <% if (profilePublic && visName != null) { %><a class="vis-link" href="/hrac/<%= java.net.URLEncoder.encode(visName, "UTF-8").replace("+", "%20") %>?nahled=1"><%= t.getProperty("profile.public.preview") %> <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a><% } %></span>
          <label class="vis-switch"><input type="checkbox" name="pub" value="1" aria-labelledby="visPubT"<%= profilePublic ? " checked" : "" %>><span aria-hidden="true"></span></label>
        </li>
        <li class="vis-row">
          <span class="vis-ico"><i class="fa-solid fa-users" aria-hidden="true"></i></span>
          <span class="vis-text"><b id="visPeopleT"><%= t.getProperty("vis.people.title") %></b><small><%= t.getProperty("vis.people.lead") %></small></span>
          <label class="vis-switch"><input type="checkbox" name="people" value="1" aria-labelledby="visPeopleT"<%= communityPublic ? " checked" : "" %>><span aria-hidden="true"></span></label>
        </li>
        <li class="vis-row">
          <span class="vis-ico"><i class="fa-solid fa-trophy" aria-hidden="true"></i></span>
          <span class="vis-text"><b id="visPongT"><%= t.getProperty("vis.pong.title") %></b><small><%= t.getProperty("vis.pong.lead") %></small></span>
          <label class="vis-switch"><input type="checkbox" name="pong" value="1" aria-labelledby="visPongT"<%= pongPublic ? " checked" : "" %>><span aria-hidden="true"></span></label>
        </li>
        <li class="vis-row">
          <span class="vis-ico"><i class="fa-solid fa-comments" aria-hidden="true"></i></span>
          <span class="vis-text"><b id="visAboutT"><%= t.getProperty("vis.about.title") %></b><small><%= t.getProperty("vis.about.lead") %></small></span>
          <label class="vis-switch"><input type="checkbox" name="about" value="1" aria-labelledby="visAboutT"<%= sharing[0] ? " checked" : "" %>><span aria-hidden="true"></span></label>
        </li>
        <li class="vis-row">
          <span class="vis-ico"><i class="fa-solid fa-house" aria-hidden="true"></i></span>
          <span class="vis-text"><b id="visCityT"><%= t.getProperty("vis.city.title") %></b><small><%= t.getProperty("vis.city.lead") %></small></span>
          <label class="vis-switch"><input type="checkbox" name="city" value="1" aria-labelledby="visCityT"<%= sharing[1] ? " checked" : "" %>><span aria-hidden="true"></span></label>
        </li>
        <li class="vis-row">
          <span class="vis-ico"><i class="fa-solid fa-heart" aria-hidden="true"></i></span>
          <span class="vis-text"><b id="visLikesT"><%= t.getProperty("vis.likes.title") %></b><small><%= t.getProperty("vis.likes.lead") %></small></span>
          <label class="vis-switch"><input type="checkbox" name="likes" value="1" aria-labelledby="visLikesT"<%= sharing[2] ? " checked" : "" %>><span aria-hidden="true"></span></label>
        </li>
        <li class="vis-row">
          <span class="vis-ico"><i class="fa-solid fa-user-group" aria-hidden="true"></i></span>
          <span class="vis-text"><b id="visFriendsListT"><%= t.getProperty("vis.friends.title") %></b><small><%= t.getProperty("vis.friends.lead") %></small></span>
          <label class="vis-switch"><input type="checkbox" name="friendsPublic" value="1" aria-labelledby="visFriendsListT"<%= sharing[3] ? " checked" : "" %>><span aria-hidden="true"></span></label>
        </li>
        <li class="vis-row">
          <span class="vis-ico"><i class="fa-solid fa-music" aria-hidden="true"></i></span>
          <span class="vis-text"><b id="visTracksT"><%= t.getProperty("vis.tracks.title") %></b><small><%= t.getProperty("vis.tracks.lead") %></small></span>
          <label class="vis-switch"><input type="checkbox" name="tracks" value="1" aria-labelledby="visTracksT"<%= sharing[5] ? " checked" : "" %>><span aria-hidden="true"></span></label>
        </li>
        <li class="vis-row">
          <span class="vis-ico"><i class="fa-solid fa-link" aria-hidden="true"></i></span>
          <span class="vis-text"><b id="visWebT"><%= t.getProperty("vis.web.title") %></b><small><%= t.getProperty("vis.web.lead") %></small>
            <% if (sharing[6] && profilePublic && visName != null) { %><small class="vis-state on">skeli.cz/hrac/<%= WebUtils.escapeHtml(visName) %></small><% } %></span>
          <label class="vis-switch"><input type="checkbox" name="web" value="1" aria-labelledby="visWebT"<%= sharing[6] ? " checked" : "" %>><span aria-hidden="true"></span></label>
        </li>
        <li class="vis-row">
          <span class="vis-ico"><i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i></span>
          <span class="vis-text"><b id="visActivityT"><%= t.getProperty("vis.activity.title") %></b><small><%= t.getProperty("vis.activity.lead") %></small></span>
          <label class="vis-switch"><input type="checkbox" name="activity" value="1" aria-labelledby="visActivityT"<%= sharing[7] ? " checked" : "" %>><span aria-hidden="true"></span></label>
        </li>
        <li class="vis-row">
          <span class="vis-ico"><i class="fa-solid fa-eye" aria-hidden="true"></i></span>
          <span class="vis-text"><b id="visOnlineT"><%= t.getProperty("vis.online.title") %></b><small><%= t.getProperty("vis.online.lead") %></small></span>
          <label class="vis-switch"><input type="checkbox" name="online" value="1" aria-labelledby="visOnlineT"<%= sharing[4] ? " checked" : "" %>><span aria-hidden="true"></span></label>
        </li>
        <%-- vitrína: až 3 získané odznaky nahoře na profilu --%>
        <li class="vis-row vis-pick">
          <span class="vis-ico"><i class="fa-solid fa-medal" aria-hidden="true"></i></span>
          <span class="vis-text"><b><%= t.getProperty("vis.showcase.title") %></b><small><%= t.getProperty("vis.showcase.lead") %></small></span>
          <% if (pong.earnedCount() == 0 && siteEarned.isEmpty()) { %>
          <small class="vis-empty"><i class="fa-solid fa-lock" aria-hidden="true"></i> <%= t.getProperty("vis.showcase.empty") %></small>
          <% } else { %>
          <div class="vis-show-picks">
            <% for (int slot = 0; slot < 3; slot++) { String chosen = slot < shownBadges.size() ? shownBadges.get(slot) : ""; %>
            <select name="b<%= slot + 1 %>" aria-label="<%= t.getProperty("vis.showcase.title") %> <%= slot + 1 %>">
              <option value=""><%= t.getProperty("vis.showcase.none") %></option>
              <% for (String siteKey : siteEarned) { %>
              <option value="<%= siteKey %>"<%= siteKey.equals(chosen) ? " selected" : "" %>><%= WebUtils.escapeHtml(t.getProperty("site.badge." + siteKey)) %></option>
              <% } %>
              <% for (PongProfile.Badge b : pong.badges) { if (!b.earned) continue; %>
              <option value="<%= b.key %>"<%= b.key.equals(chosen) ? " selected" : "" %>><%= WebUtils.escapeHtml(t.getProperty("pong.badge." + b.key)) %></option>
              <% } %>
            </select>
            <% } %>
          </div>
          <% } %>
        </li>
        <li class="vis-row">
          <span class="vis-ico"><i class="fa-solid fa-user-group" aria-hidden="true"></i></span>
          <span class="vis-text"><b id="visFriendsT"><%= t.getProperty("friends.vis.title") %></b><small><%= t.getProperty("friends.vis.lead") %></small></span>
          <label class="vis-switch"><input type="checkbox" name="friends" value="1" aria-labelledby="visFriendsT"<%= friendRequests ? " checked" : "" %>><span aria-hidden="true"></span></label>
        </li>
        <li class="vis-row">
          <span class="vis-ico"><i class="fa-solid fa-comments" aria-hidden="true"></i></span>
          <span class="vis-text"><b id="visChatT"><%= t.getProperty("vis.chat.title") %></b><small><%= t.getProperty("vis.chat.lead") %></small></span>
          <label class="vis-switch"><input type="checkbox" name="chat" value="1" aria-labelledby="visChatT"<%= chatOpen ? " checked" : "" %>><span aria-hidden="true"></span></label>
        </li>
        <li class="vis-row">
          <span class="vis-ico"><i class="fa-solid fa-image" aria-hidden="true"></i></span>
          <span class="vis-text"><b id="visCoverT"><%= t.getProperty("cover.title") %></b><small><%= t.getProperty("cover.visLead") %></small></span>
          <label class="vis-switch"><input type="checkbox" name="cover" value="1" aria-labelledby="visCoverT"<%= coverPublic ? " checked" : "" %>><span aria-hidden="true"></span></label>
        </li>
        <%-- rámeček kolem fotky se vybírá v záložce Vzhled (includes/settings-looks.jspf) --%>
        <li class="vis-row vis-pick">
          <span class="vis-ico"><i class="fa-solid fa-star" aria-hidden="true"></i></span>
          <span class="vis-text"><b><label for="pongMark"><%= t.getProperty("pong.mark.title") %></label></b><small><%= t.getProperty("pong.mark.lead") %></small></span>
          <% if (!anyMark) { %>
          <small class="vis-empty"><i class="fa-solid fa-lock" aria-hidden="true"></i> <%= t.getProperty("pong.mark.empty") %></small>
          <% } else { %>
          <select id="pongMark" name="m">
            <option value=""><%= t.getProperty("pong.mark.none") %></option>
            <% for (PongProfile.Badge b : pong.badges) { if (!b.earned || !com.github.skeliit.model.PongBadges.isMark(b.key)) continue; %>
            <option value="<%= b.key %>" data-icon="<%= com.github.skeliit.model.PongBadges.icon(b.key) %>"<%= b.key.equals(pong.mark) ? " selected" : "" %>><%= WebUtils.escapeHtml(t.getProperty("pong.badge." + b.key)) %></option>
            <% } %>
          </select>
          <% } %>
        </li>
      </ul>
      <div class="vis-actions"><button type="submit" class="btn-primary"><i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> <%= t.getProperty("common.save") %></button></div>
    </form>
    <script>
      // živý náhled karty „Co o mně vidí ostatní“: rámeček (šampion má přednost), znak u jména, ztlumení skrytého profilu
      (function () {
        if (window.__visPreview) return;
        window.__visPreview = true;
        document.addEventListener('change', function (e) {
          var form = e.target.closest && e.target.closest('.vis-form');
          if (!form) return;
          var av = form.querySelector('[data-vis-av]'), fr = form.querySelector('[name=f]'),
            mk = form.querySelector('[name=m]'), mi = form.querySelector('[data-vis-mark]'), pub = form.querySelector('[name=pub]'), place = form.dataset.champ;
          var cls = fr ? fr.value : form.dataset.frame;
          if (cls === 'champ') cls = place ? 'champ' + place : '';   // medaile jen v první trojce
          av.className = 'av-frame' + (cls ? ' f-' + cls : '');
          if (mk && mi) { var op = mk.options[mk.selectedIndex], ic = op && op.getAttribute('data-icon'); mi.className = 'fa-solid vis-mark ' + (ic || ''); mi.hidden = !ic; }
          form.classList.toggle('vis-hidden', !!pub && !pub.checked);
        });
      })();
    </script>
  </section>

  <%-- Web a jazyk: režim, jazyk, tučnější text, efekty, cookies. Režim, písmo a efekty si pamatuje prohlížeč
       (stejné jako tlačítka v hlavičce), jazyk a režim se zapíšou i k účtu. --%>
  <section class="acct-card" id="web">
    <header class="acct-card-head">
      <h3><i class="fa-solid fa-globe"></i> <%= t.getProperty("settings.tab.web") %></h3>
    </header>
    <div class="set-rows">
      <div class="set-row">
        <span class="set-k"><%= t.getProperty("settings.theme") %></span>
        <div class="set-seg" role="group" aria-label="<%= t.getProperty("settings.theme") %>">
          <button type="button" data-set-theme="dark"><i class="fa-solid fa-moon" aria-hidden="true"></i> <%= t.getProperty("settings.theme.dark") %></button>
          <button type="button" data-set-theme="light"><i class="fa-solid fa-sun" aria-hidden="true"></i> <%= t.getProperty("settings.theme.light") %></button>
        </div>
      </div>
      <form class="set-row" method="post" action="/profile/look">
        <input type="hidden" name="csrf" value="${csrf}"><input type="hidden" name="slot" value="lang">
        <span class="set-k"><%= t.getProperty("header.language") %></span>
        <div class="set-seg set-seg-wrap" role="group" aria-label="<%= t.getProperty("header.language") %>">
          <% String[][] langs = { { "cs", "Čeština" }, { "en", "English" }, { "de", "Deutsch" }, { "uk", "Українська" }, { "vi", "Tiếng Việt" } };
             String curLang = com.github.skeliit.I18n.current(request);
             for (String[] l : langs) { %>
          <button type="submit" name="value" value="<%= l[0] %>" aria-pressed="<%= l[0].equals(curLang) %>"><%= l[1] %></button>
          <% } %>
        </div>
      </form>
      <div class="set-row">
        <span class="set-k"><%= t.getProperty("header.fontWeight") %></span>
        <div class="set-seg" role="group" aria-label="<%= t.getProperty("header.fontWeight") %>">
          <button type="button" data-set-bold="0"><%= t.getProperty("settings.off") %></button>
          <button type="button" data-set-bold="1"><%= t.getProperty("settings.on") %></button>
        </div>
      </div>
      <div class="set-row">
        <span class="set-k"><%= t.getProperty("settings.fx.title") %><small><%= t.getProperty("settings.fx.hint") %></small></span>
        <div class="set-seg" role="group" aria-label="<%= t.getProperty("settings.fx.title") %>">
          <button type="button" data-set-fx="auto"><%= t.getProperty("settings.fx.auto") %></button>
          <button type="button" data-set-fx="full"><%= t.getProperty("settings.fx.full") %></button>
          <button type="button" data-set-fx="low"><%= t.getProperty("settings.fx.low") %></button>
        </div>
      </div>
      <div class="set-row">
        <span class="set-k"><%= t.getProperty("settings.cookies") %></span>
        <button type="button" class="btn-outline" data-cookie-settings><%= t.getProperty("cookie.settingsLink") %></button>
      </div>
    </div>
  </section>

  <%-- Účet a data: stažení údajů a (odděleně, úplně dole) smazání účtu --%>
  <section class="acct-card" id="ucet">
    <header class="acct-card-head">
      <h3><i class="fa-solid fa-download"></i> <%= t.getProperty("settings.tab.data") %></h3>
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
        <p class="acct-dim"><%= t.getProperty("account.deleteText") %></p><%= setHelp(t, "account.deleteText.more") %>
        <form method="post" action="/profile/delete" onsubmit="return confirm('<%= WebUtils.escapeJs(t.getProperty("settings.deleteConfirm")) %>');">
          <input type="hidden" name="csrf" value="${csrf}">
          <label><%= WebUtils.escapeHtml(t.getProperty("settings.deleteLabel")) %><input type="text" name="confirm" required autocomplete="off"></label>
          <div class="form-actions"><button type="submit" class="btn-delete"><i class="fa-solid fa-trash-can"></i> <%= t.getProperty("settings.deleteAccount") %></button></div>
        </form>
      </div>
    </div>
  </section>

  <%@ include file="includes/settings-looks.jspf" %>

  </div></div>

  <script>
    // Sekce podle #kotvy (i kotva uvnitř sekce, třeba #dvoufazove). Telefon bez kotvy = seznam sekcí,
    // počítač bez kotvy = Profil. Web a jazyk: přepínače režimu, tučnějšího textu a efektů (pamatuje si je prohlížeč).
    (function () {
      const page = document.querySelector('main.settings-page');
      const parts = Array.from(page.querySelectorAll('section.acct-card[id]'));
      const links = Array.from(page.querySelectorAll('.set-nav a'));
      if (!parts.length) return;
      const wide = matchMedia('(min-width: 1024px)');
      function show() {
        const want = location.hash.length > 1 ? document.getElementById(location.hash.slice(1)) : null;
        let part = want && parts.find(function (p) { return p === want || p.contains(want); });
        if (!part && wide.matches) part = document.getElementById('profil');
        page.classList.add('set-js'); page.classList.toggle('set-home', !part);
        parts.forEach(function (p) { p.hidden = p !== part; });
        links.forEach(function (a) { const on = !!part && a.getAttribute('href') === '#' + part.id; a.classList.toggle('active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
        if (want && want !== part) want.scrollIntoView({ block: 'start' });
      }
      links.forEach(function (a) {
        a.addEventListener('click', function (e) { e.preventDefault(); history.pushState(null, '', a.getAttribute('href')); show(); window.scrollTo(0, 0); });
      });
      const back = page.querySelector('.set-back');
      if (back) back.addEventListener('click', function (e) { e.preventDefault(); history.pushState(null, '', location.pathname + location.search); show(); window.scrollTo(0, 0); });
      window.addEventListener('hashchange', show);
      window.addEventListener('popstate', show);
      wide.addEventListener('change', show);
      show();

      // --- Web a jazyk ---
      function mark(sel, val) { page.querySelectorAll('[' + sel + ']').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute(sel) === val)); }); }
      function theme() { return document.body.classList.contains('light') ? 'light' : 'dark'; }
      mark('data-set-theme', theme());
      page.querySelectorAll('[data-set-theme]').forEach(function (b) {
        b.addEventListener('click', function () {
          const v = b.getAttribute('data-set-theme');
          if (theme() !== v) { const tg = document.getElementById('themeToggle'); if (tg) tg.click(); }
          mark('data-set-theme', v);
          fetch('/profile/look', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-Token': '${csrf}' },
            body: 'json=1&slot=theme&value=' + v }).catch(function () {});
        });
      });
      function bold() { return document.documentElement.classList.contains('bold-text') ? '1' : '0'; }
      mark('data-set-bold', bold());
      page.querySelectorAll('[data-set-bold]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (bold() !== b.getAttribute('data-set-bold')) { const f = document.getElementById('fontToggle'); if (f) f.click(); }
          mark('data-set-bold', bold());
        });
      });
      function fx() { let s = null; try { s = localStorage.getItem('fxLow'); } catch (e) {} return s === 'on' ? 'low' : s === '0' ? 'full' : 'auto'; }
      mark('data-set-fx', fx());
      page.querySelectorAll('[data-set-fx]').forEach(function (b) {
        b.addEventListener('click', function () {
          const v = b.getAttribute('data-set-fx');
          try {
            if (v === 'auto') { localStorage.removeItem('fxLow'); localStorage.removeItem('fxAuto'); }
            else localStorage.setItem('fxLow', v === 'low' ? 'on' : '0');
            sessionStorage.removeItem('fxLowNow');
          } catch (e) {}
          document.documentElement.classList.toggle('low-fx', v === 'low');
          mark('data-set-fx', v);
        });
      });
    })();
  </script>
  <% } %>
  <%-- the photo cropper (inside <main>, so it also runs after PJAX navigation) --%>
  <link href="/vendor/cropper/cropper.min.css" rel="stylesheet">
  <script src="/js/avatar-editor.js?v=<%= assetVersion %>"></script>
</main>
<%@ include file="includes/footer.jsp" %>
