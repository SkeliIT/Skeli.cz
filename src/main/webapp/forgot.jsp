<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<main>
  <div class="auth-wrap">
    <%@ include file="/includes/auth-art.jspf" %>
    <section class="auth-card">
      <h2><%= t.getProperty("forgot.heading") %></h2>
      <% if ("1".equals(request.getParameter("expired"))) { %>
        <div class="form-alert"><%= t.getProperty("reset.expired") %></div>
      <% } %>
      <% if ("true".equals(request.getParameter("sent"))) { %>
        <div class="form-success"><%= t.getProperty("forgot.sent") %></div>
      <% } %>
      <form method="post" action="forgot">
        <input type="hidden" name="csrf" value="${csrf}">
        <label><%= t.getProperty("forgot.username") %><br>
          <input name="username" required autocomplete="username email"></label>
        <button type="submit"><%= t.getProperty("forgot.submit") %></button>
      </form>
      <div class="auth-footer">
        <a href="/login.jsp"><%= t.getProperty("forgot.back") %></a>
      </div>
    </section>
  </div>
</main>

<%@ include file="includes/footer.jsp" %>
