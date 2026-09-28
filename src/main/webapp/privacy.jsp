<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<main>
  <h2><%= t.getProperty("privacy.heading") %></h2>
  <div class="card prose-card">
    <p><%= t.getProperty("privacy.p1") %></p>
    <p><%= t.getProperty("privacy.p2") %></p>
    <p><%= t.getProperty("privacy.controller") %> <a href="mailto:privacy@skeli.cz">privacy@skeli.cz</a></p>
  </div>
</main>

<%@ include file="includes/footer.jsp" %>
