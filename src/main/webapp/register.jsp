<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="includes/header.jsp" %>
<main>
  <div class="auth-wrap">
    <section class="auth-card">
      <h2><%= t.getProperty("auth.register.heading","Registrace") %></h2>
      <% @SuppressWarnings("unchecked") java.util.List<String> errors = (java.util.List<String>) request.getAttribute("errors");
         if (errors != null && !errors.isEmpty()) {
      %>
      <div class="form-alert">
        <strong><%= t.getProperty("auth.error.title","Něco se nepodařilo:") %></strong>
        <ul>
          <% for (String error : errors) { %>
            <li><%= error %></li>
          <% } %>
        </ul>
      </div>
      <% } %>
      <form method="post" action="register">
        <input type="hidden" name="csrf" value="<%= request.getAttribute("csrf") != null ? request.getAttribute("csrf") : "" %>">
        <%-- honeypot: invisible to people, bots fill it in and are ignored --%>
        <div class="hp-field" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
        <label><%= t.getProperty("auth.label.username","Uživatel") %><br>
          <input type="text" name="username" required pattern="[A-Za-z0-9._-]{3,50}" maxlength="50" value="<%= com.github.skeliit.WebUtils.escapeHtml(request.getAttribute("username")) %>" autocomplete="username"></label>
        <label><%= t.getProperty("auth.label.email","E-mail") %><br>
          <input type="email" name="email" required maxlength="255" value="<%= com.github.skeliit.WebUtils.escapeHtml(request.getAttribute("email")) %>" autocomplete="email"></label>
        <div class="row">
          <label><%= t.getProperty("auth.label.password","Heslo") %><br>
            <input type="password" name="password" required minlength="8" autocomplete="new-password" data-pw="new"></label>
          <label><%= t.getProperty("auth.label.confirmPassword","Potvrdit heslo") %><br>
            <input type="password" name="password2" required minlength="8" autocomplete="new-password" data-pw="confirm"></label>
        </div>
        <%@ include file="includes/password-rules.jspf" %>
        <label class="checkbox-label"><input type="checkbox" name="consent" value="1" required <%= "1".equals(request.getParameter("consent")) ? "checked" : "" %>> <%= t.getProperty("auth.label.consent","Souhlasím se zpracováním osobních údajů a podmínkami (GDPR)") %></label>
        <button type="submit"><%= t.getProperty("auth.submit.register","Registrovat") %></button>
      </form>
    </section>
  </div>
</main>
<%@ include file="includes/footer.jsp" %>
