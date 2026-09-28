<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<main>
  <div class="auth-wrap">
    <section class="auth-card">
      <h2><%= t.getProperty("reset.heading") %></h2>
      <form method="post" action="reset">
        <input type="hidden" name="csrf" value="${csrf}">
        <input type="hidden" name="token" value="<%= com.github.skeliit.WebUtils.escapeHtml(request.getParameter("token")) %>">
        <label><%= t.getProperty("reset.password") %><br>
          <input type="password" name="password" minlength="12" required autocomplete="new-password"></label>
        <p class="form-note"><%= t.getProperty("auth.error.passwordStrength") %></p>
        <button type="submit"><%= t.getProperty("reset.submit") %></button>
      </form>
    </section>
  </div>
</main>

<%@ include file="includes/footer.jsp" %>
