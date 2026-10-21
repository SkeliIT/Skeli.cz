<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="/includes/header.jsp" %>
<%-- The second step of signing in (web/auth/TwoFactorLoginServlet): the code from the authenticator app, or a
     backup code. The password (or Google) was right already. --%>
<main>
  <div class="auth-wrap">
    <%@ include file="/includes/auth-art.jspf" %>
    <section class="auth-card">
      <h2><%= t.getProperty("tfa.login.heading") %></h2>
      <p class="auth-lead"><%= t.getProperty("tfa.login.lead") %></p>
      <% String tfaError = (String) request.getAttribute("tfaError"); %>
      <% if (tfaError != null) { %><div class="form-alert"><%= com.github.skeliit.WebUtils.escapeHtml(tfaError) %></div><% } %>
      <form method="post" action="/login/2fa" class="tfa-login">
        <input type="hidden" name="csrf" value="<%= request.getAttribute("csrf") != null ? request.getAttribute("csrf") : "" %>">
        <label><%= t.getProperty("tfa.login.code") %><br>
          <input type="text" name="code" required autofocus autocomplete="one-time-code" inputmode="numeric" maxlength="12" class="tfa-code-input" placeholder="123456"></label>
        <button type="submit"><%= t.getProperty("tfa.login.submit") %></button>
      </form>
      <p class="auth-footer"><%= t.getProperty("tfa.login.backup") %></p>
      <p class="auth-footer"><a href="/login.jsp"><%= t.getProperty("tfa.login.cancel") %></a></p>
    </section>
  </div>
</main>
<%@ include file="/includes/footer.jsp" %>
