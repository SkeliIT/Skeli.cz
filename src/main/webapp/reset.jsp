<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%
  String resetToken = request.getParameter("token");
  boolean resetTokenValid = com.github.skeliit.ResetPasswordServlet.isTokenValid(resetToken);
  // Error codes sent by ResetPasswordServlet (?error=...)
  String resetError = request.getParameter("error");
  String resetErrorKey = null;
  if ("weak".equals(resetError)) resetErrorKey = "auth.error.passwordStrength";
  else if ("invalid_chars".equals(resetError)) resetErrorKey = "auth.error.passwordInvalidChars";
  else if ("too_long".equals(resetError)) resetErrorKey = "auth.error.passwordTooLong";
  else if ("mismatch".equals(resetError)) resetErrorKey = "auth.error.passwordMismatch";
%>

<main>
  <div class="auth-wrap">
    <section class="auth-card">
      <h2><%= t.getProperty("reset.heading") %></h2>
      <% if (!resetTokenValid) { %>
        <div class="form-alert"><%= t.getProperty("reset.expired") %></div>
        <div class="auth-footer">
          <a href="/forgot.jsp"><%= t.getProperty("reset.newLink") %></a>
        </div>
      <% } else { %>
        <% if (resetErrorKey != null) { %>
          <div class="form-alert"><%= t.getProperty(resetErrorKey) %></div>
        <% } %>
        <form method="post" action="reset">
          <input type="hidden" name="csrf" value="${csrf}">
          <input type="hidden" name="token" value="<%= com.github.skeliit.WebUtils.escapeHtml(resetToken) %>">
          <label><%= t.getProperty("reset.password") %><br>
            <input type="password" name="password" minlength="8" required autocomplete="new-password" data-pw="new"></label>
          <label><%= t.getProperty("reset.confirm") %><br>
            <input type="password" name="password2" minlength="8" required autocomplete="new-password" data-pw="confirm"></label>
          <%@ include file="includes/password-rules.jspf" %>
          <button type="submit"><%= t.getProperty("reset.submit") %></button>
        </form>
      <% } %>
    </section>
  </div>
</main>

<%@ include file="includes/footer.jsp" %>
