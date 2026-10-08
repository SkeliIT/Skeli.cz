<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="includes/header.jsp" %>
<main>
  <div class="auth-wrap">
    <%@ include file="/includes/auth-art.jspf" %>
    <section class="auth-card">
      <h2><%= t.getProperty("auth.login.heading","Přihlášení") %></h2>
      <% String loginError = (String) request.getAttribute("loginError"); %>
      <% if (loginError != null) { %>
      <div class="form-alert"><%= loginError %></div>
      <% } %>
      <% if ("1".equals(request.getParameter("registered"))) { %>
      <div class="form-success"><%= t.getProperty("auth.register.success","Registrace proběhla úspěšně. Nyní se můžete přihlásit.") %></div>
      <% } %>
      <% if ("1".equals(request.getParameter("reset"))) { %>
      <div class="form-success"><%= t.getProperty("reset.success") %></div>
      <% } %>
      <form method="post" action="login">
        <% String nextParam = com.github.skeliit.LoginServlet.safeNext(request.getParameter("next")); if (nextParam != null) { %><input type="hidden" name="next" value="<%= com.github.skeliit.WebUtils.escapeHtml(nextParam) %>"><% } %>
        <input type="hidden" name="csrf" value="<%= request.getAttribute("csrf") != null ? request.getAttribute("csrf") : "" %>">
        <label><%= t.getProperty("auth.label.login") %><br>
          <input type="text" name="username" required value="<%= com.github.skeliit.WebUtils.escapeHtml(request.getAttribute("username")) %>" autocomplete="username"></label>
        <label><%= t.getProperty("auth.label.password","Heslo") %><br>
          <input type="password" name="password" required autocomplete="current-password"></label>
        <label class="checkbox-label">
          <input type="checkbox" name="remember" value="1"> <%= t.getProperty("auth.label.remember","Zapamatovat na tomto zařízení") %>
        </label>
        <button type="submit"><%= t.getProperty("auth.submit.login","Přihlásit") %></button>
      </form>
      <p class="auth-footer">
        <a href="/forgot.jsp">
          <%= t.getProperty("login.forgot","Forgot your password?") %>
        </a>
      </p>
    </section>
  </div>
</main>
<%@ include file="includes/footer.jsp" %>
