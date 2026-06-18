<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<main>
  <div class="auth-wrap">
    <section class="auth-card">
      <h2>Nastavit nové heslo</h2>
      <form method="post" action="reset">
        <input type="hidden" name="token" value="<%= request.getParameter("token") != null ? request.getParameter("token") : "" %>">
        <label>Nové heslo:<br>
          <input type="password" name="password" minlength="12" required autocomplete="new-password"></label>
        <button type="submit">Uložit heslo</button>
      </form>
    </section>
  </div>
</main>

<%@ include file="includes/footer.jsp" %>
