<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="sk" tagdir="/WEB-INF/tags" %>
<%-- Terms of use + community rules (texts terms.* in every language). Keep them true to what the site
     really does: no promise of a feature that doesn't exist (e.g. blocking accounts for a while). --%>
<main class="privacy-page terms-page">
  <sk:pageHero kicker='<%= t.getProperty("terms.updated") %>' title='<%= t.getProperty("terms.heading") %>'
               lead='<%= t.getProperty("terms.lead") %>'/>
  <div class="privacy-sections">
    <% for (int i = 1; i <= 2; i++) { %>
    <section class="card prose-card" id="t<%= i %>">
      <h3><span class="privacy-num"><%= i %></span> <%= t.getProperty("terms.s" + i + ".t") %></h3>
      <p><%= t.getProperty("terms.s" + i + ".p") %></p>
    </section>
    <% } %>
    <section class="card prose-card" id="pravidla">
      <h3><span class="privacy-num">3</span> <%= t.getProperty("terms.s3.t") %></h3>
      <p><%= t.getProperty("terms.s3.p") %></p>
      <ul>
        <% for (int r = 1; r <= 7; r++) { %><li><%= t.getProperty("terms.rule" + r) %></li><% } %>
      </ul>
    </section>
    <% for (int i = 4; i <= 9; i++) { %>
    <section class="card prose-card" id="t<%= i %>">
      <h3><span class="privacy-num"><%= i %></span> <%= t.getProperty("terms.s" + i + ".t") %></h3>
      <p><%= t.getProperty("terms.s" + i + ".p") %></p>
    </section>
    <% } %>
  </div>
</main>

<%@ include file="includes/footer.jsp" %>
