<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<main>
  <div class="auth-wrap">
    <section class="auth-card">
      <h2>Zapomenuté heslo</h2>
      <% if ("true".equals(request.getParameter("sent"))) { %>
        <div class="form-success">✓ Pokud účet existuje, byl na něj odeslán e-mail s odkazem pro obnovení hesla.</div>
      <% } %>
      <form method="post" action="forgot">
        <label>Uživatelské jméno:<br>
          <input name="username" required autocomplete="username"></label>
        <button type="submit">Poslat odkaz na reset</button>
      </form>
      <div class="auth-footer">
        <a href="/login.jsp">← Zpět na přihlášení</a>
      </div>
    </section>
  </div>
</main>

<%@ include file="includes/footer.jsp" %>
