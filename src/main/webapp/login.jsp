<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="includes/header.jsp" %>
<main>
  <div class="auth-wrap">
    <section class="auth-card">
      <h2><%= ((java.util.Properties)request.getAttribute("t")).getProperty("auth.login.heading","Přihlášení") %></h2>
      <% String loginError = (String) request.getAttribute("loginError"); %>
      <% if (loginError != null) { %>
      <div class="form-alert"><%= loginError %></div>
      <% } %>
      <% if ("1".equals(request.getParameter("registered"))) { %>
      <div class="form-success"><%= ((java.util.Properties)request.getAttribute("t")).getProperty("auth.register.success","Registrace proběhla úspěšně. Nyní se můžete přihlásit.") %></div>
      <% } %>
      <form method="post" action="login">
        <input type="hidden" name="csrf" value="<%= request.getAttribute("csrf") != null ? request.getAttribute("csrf") : "" %>">
        <label><%= ((java.util.Properties)request.getAttribute("t")).getProperty("auth.label.username","Uživatel") %><br>
          <input type="text" name="username" required value="<%= request.getAttribute("username") != null ? request.getAttribute("username") : "" %>" autocomplete="username"></label>
        <label><%= ((java.util.Properties)request.getAttribute("t")).getProperty("auth.label.password","Heslo") %><br>
          <input type="password" name="password" required autocomplete="current-password"></label>
        <label class="checkbox-label">
          <input type="checkbox" name="remember" value="1"> <%= ((java.util.Properties)request.getAttribute("t")).getProperty("auth.label.remember","Zapamatovat na tomto zařízení") %>
        </label>
        <button type="submit"><%= ((java.util.Properties)request.getAttribute("t")).getProperty("auth.submit.login","Přihlásit") %></button>
      </form>
      <p class="auth-footer">
        <a href="/forgot.jsp">
          <%= ((java.util.Properties)request.getAttribute("t")).getProperty("login.forgot","Forgot your password?") %>
        </a>
      </p>
    </section>
  </div>
</main>
<%@ include file="includes/footer.jsp" %>
