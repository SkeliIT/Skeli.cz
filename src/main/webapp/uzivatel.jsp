<%@ page import="com.github.skeliit.dao.UserDao, com.github.skeliit.model.UserProfile" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<main>
  <div class="settings-wrap">
    <div class="settings-shell">
      <h2 class="font-display text-center"><%= t.getProperty("settings.heading") %></h2>
      <% if (session.getAttribute("user_id") == null) { %>
      <%-- signed out (e.g. the sign-in expired): no forms, just a way back in --%>
      <section class="settings-section text-center">
        <p><%= t.getProperty("profile.loginRequired") %></p>
        <a class="btn btn-primary" href="/login.jsp?next=%2Fuzivatel.jsp"><i class="fa-solid fa-right-to-bracket"></i> <%= t.getProperty("auth.submit.login") %></a>
      </section>
      <% } else { %>

      <%
        Integer uid = (Integer) session.getAttribute("user_id");
        String displayName = null, city = null, bio = null, theme = "dark", prefLang = (String) session.getAttribute("lang");
        Integer age = null;
        if (uid != null) {
          try {
            UserProfile p = new UserDao().profile(uid);   // dao/UserDao; nothing saved yet = null
            if (p != null) {
              displayName = p.displayName;
              age = p.age;
              city = p.city;
              bio = p.bio;
              theme = p.theme;
              if (p.lang != null) prefLang = p.lang;
            }
          } catch (Exception ignore) {}
        }
      %>

      <% if ("true".equals(request.getParameter("saved"))) { %>
        <div class="form-success text-center"><%= t.getProperty("settings.saved") %></div>
      <% } %>
      <% if ("true".equals(request.getParameter("password_changed"))) { %>
        <div class="form-success text-center"><%= t.getProperty("settings.passwordChanged") %></div>
      <% } %>
      <% if (request.getParameter("signedOut") != null) { %>
        <div class="form-success text-center"><%= t.getProperty("settings.signedOutOthers") %></div>
      <% } %>
      <%
        // Error codes sent by ChangePasswordServlet (?error=...) and ProfileDeleteServlet (?confirm=required)
        String settingsError = request.getParameter("error");
        String settingsErrorKey = null;
        if ("empty".equals(settingsError)) settingsErrorKey = "settings.error.empty";
        else if ("mismatch".equals(settingsError)) settingsErrorKey = "settings.error.mismatch";
        else if ("short".equals(settingsError)) settingsErrorKey = "auth.error.passwordStrength";
        else if ("invalid_chars".equals(settingsError)) settingsErrorKey = "auth.error.passwordInvalidChars";
        else if ("too_long".equals(settingsError)) settingsErrorKey = "auth.error.passwordTooLong";
        else if ("pwned".equals(settingsError)) settingsErrorKey = "auth.error.passwordPwned";
        else if ("wrong_old".equals(settingsError)) settingsErrorKey = "settings.error.wrongOld";
        else if (settingsError != null) settingsErrorKey = "settings.error.generic";
        if ("required".equals(request.getParameter("confirm"))) settingsErrorKey = "settings.deleteRequired";
        if (settingsErrorKey != null) {
      %>
        <div class="form-alert text-center"><%= t.getProperty(settingsErrorKey) %></div>
      <% } %>

      <section class="settings-section">
        <%@ include file="/includes/avatar-editor.jspf" %>
      </section>

      <section class="settings-section">
        <h3><%= t.getProperty("menu.profile") %></h3>
        <div class="settings-form">
          <form method="post" action="/profile/update" enctype="application/x-www-form-urlencoded">
            <input type="hidden" name="csrf" value="${csrf}">
            <label><%= t.getProperty("settings.displayName") %><br><input name="display_name" maxlength="60" value="<%= com.github.skeliit.WebUtils.escapeHtml(displayName) %>"></label>
            <label><%= t.getProperty("settings.age") %><br><input type="number" name="age" min="1" max="120" value="<%= (age!=null?age:"") %>"></label>
            <label><%= t.getProperty("settings.city") %><br><input name="city" maxlength="80" value="<%= com.github.skeliit.WebUtils.escapeHtml(city) %>"></label>
            <label><%= t.getProperty("settings.bio") %><br><textarea name="bio" rows="3"><%= com.github.skeliit.WebUtils.escapeHtml(bio) %></textarea></label>
            <label><%= t.getProperty("settings.theme") %><br>
              <select name="theme">
                <option value="dark" <%= "dark".equals(theme)?"selected":"" %>><%= t.getProperty("settings.theme.dark") %></option>
                <option value="light" <%= "light".equals(theme)?"selected":"" %>><%= t.getProperty("settings.theme.light") %></option>
              </select>
            </label>
            <label><%= t.getProperty("header.language") %><br>
              <select name="lang">
                <option value="cs" <%= "cs".equals(prefLang)?"selected":"" %>>Čeština</option>
                <option value="en" <%= "en".equals(prefLang)?"selected":"" %>>English</option>
                <option value="de" <%= "de".equals(prefLang)?"selected":"" %>>Deutsch</option>
                <option value="uk" <%= "uk".equals(prefLang)?"selected":"" %>>Українська</option>
                <option value="vi" <%= "vi".equals(prefLang)?"selected":"" %>>Tiếng Việt</option>
              </select>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" name="public_profile" value="1"> <%= t.getProperty("settings.public") %>
            </label>
            <div class="form-actions"><button type="submit"><%= t.getProperty("common.save") %></button></div>
          </form>
        </div>
      </section>

      <section class="settings-section">
        <h3><%= t.getProperty("settings.password") %></h3>
        <div class="settings-form">
          <form method="post" action="/profile/change-password">
            <input type="hidden" name="csrf" value="${csrf}">
            <label><%= t.getProperty("settings.oldPassword") %> <input type="password" name="old_password" required autocomplete="current-password"></label>
            <label><%= t.getProperty("settings.newPassword") %> <input type="password" name="new_password" minlength="8" required autocomplete="new-password" data-pw="new"></label>
            <label><%= t.getProperty("settings.confirmPassword") %> <input type="password" name="confirm_password" minlength="8" required autocomplete="new-password" data-pw="confirm"></label>
            <%@ include file="includes/password-rules.jspf" %>
            <div class="form-actions"><button type="submit"><%= t.getProperty("settings.changePassword") %></button></div>
          </form>
        </div>
      </section>

      <%-- signed in on a phone, a friend's computer…? end all the other sessions at once --%>
      <section class="settings-section">
        <h3><%= t.getProperty("settings.devices") %></h3>
        <div class="settings-form">
          <p class="text-dim"><%= t.getProperty("settings.devicesText") %></p>
          <form method="post" action="/profile/signout-others" class="text-center">
            <input type="hidden" name="csrf" value="${csrf}">
            <button type="submit"><i class="fa-solid fa-right-from-bracket"></i> <%= t.getProperty("settings.signOutOthers") %></button>
          </form>
        </div>
      </section>

      <section class="settings-section">
        <h3><%= t.getProperty("settings.privacy") %></h3>
        <div class="settings-form">
          <form method="get" action="/profile/export" class="form-actions">
            <button type="submit" class="btn-outline"><%= t.getProperty("settings.export") %></button>
          </form>
          <form method="post" action="/profile/delete" onsubmit="return confirm('<%= com.github.skeliit.WebUtils.escapeJs(t.getProperty("settings.deleteConfirm")) %>');">
            <input type="hidden" name="csrf" value="${csrf}">
            <label><%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("settings.deleteLabel")) %><br><input type="text" name="confirm" required></label>
            <div class="form-actions">
              <button type="submit" class="btn-delete"><%= t.getProperty("settings.deleteAccount") %></button>
            </div>
          </form>
        </div>
      </section>
      <% } %>
    </div>
  </div>
  <%-- the photo cropper (inside <main>, so it also runs after PJAX navigation) --%>
  <link href="/vendor/cropper/cropper.min.css" rel="stylesheet">
  <script src="/js/avatar-editor.js?v=<%= assetVersion %>"></script>
</main>
<%@ include file="includes/footer.jsp" %>
