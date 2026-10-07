<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<main>
  <div class="auth-wrap">
    <%@ include file="/includes/auth-art.jspf" %>
    <section class="auth-card">
      <% if ("true".equals(request.getParameter("sent"))) { %>
      <%-- after sending: no form any more, a clear "it's on its way" and where to look for it --%>
      <div class="mail-sent">
        <span class="mail-sent-icon" aria-hidden="true"><i class="fa-solid fa-paper-plane"></i></span>
        <h2><%= t.getProperty("forgot.sentTitle") %></h2>
        <p><%= t.getProperty("forgot.sentText") %></p>
        <p class="mail-spam"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> <%= t.getProperty("mail.spamHint") %></p>
        <a class="btn btn-ghost" href="/forgot.jsp"><i class="fa-solid fa-rotate-right"></i> <%= t.getProperty("forgot.again") %></a>
      </div>
      <% } else { %>
      <h2><%= t.getProperty("forgot.heading") %></h2>
      <% if ("1".equals(request.getParameter("expired"))) { %>
        <div class="form-alert"><%= t.getProperty("reset.expired") %></div>
      <% } %>
      <form method="post" action="forgot">
        <input type="hidden" name="csrf" value="${csrf}">
        <label><%= t.getProperty("forgot.username") %><br>
          <input name="username" required autocomplete="username email"></label>
        <button type="submit"><%= t.getProperty("forgot.submit") %></button>
      </form>
      <% } %>
      <div class="auth-footer">
        <a href="/login.jsp"><%= t.getProperty("forgot.back") %></a>
      </div>
    </section>
  </div>
</main>

<%@ include file="includes/footer.jsp" %>
