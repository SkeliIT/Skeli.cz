<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="sk" tagdir="/WEB-INF/tags" %>
<%-- The privacy policy: what the site really does with personal data (texts privacy.* in every language).
     Keep it true: when the site starts collecting or sending anything new, this page changes too. --%>
<main class="privacy-page">
  <sk:pageHero kicker='<%= t.getProperty("privacy.updated") %>' title='<%= t.getProperty("privacy.heading") %>'
               lead='<%= t.getProperty("privacy.lead") %>'/>
  <div class="privacy-sections">
    <section class="card prose-card" id="controller">
      <h3><span class="privacy-num">1</span> <%= t.getProperty("privacy.s1.t") %></h3>
      <p><%= t.getProperty("privacy.s1.p") %></p>
    </section>
    <section class="card prose-card" id="data">
      <h3><span class="privacy-num">2</span> <%= t.getProperty("privacy.s2.t") %></h3>
      <ul>
        <li><%= t.getProperty("privacy.s2.account") %></li>
        <li><%= t.getProperty("privacy.s2.profile") %></li>
        <li><%= t.getProperty("privacy.s2.comments") %></li>
        <li><%= t.getProperty("privacy.s2.newsletter") %></li>
        <li><%= t.getProperty("privacy.s2.security") %></li>
        <li><%= t.getProperty("privacy.s2.stats") %></li>
      </ul>
    </section>
    <section class="card prose-card" id="cookies">
      <h3><span class="privacy-num">3</span> <%= t.getProperty("privacy.s3.t") %></h3>
      <ul>
        <li><%= t.getProperty("privacy.s3.session") %></li>
        <li><%= t.getProperty("privacy.s3.storage") %></li>
        <li><%= t.getProperty("privacy.s3.matomo") %></li>
      </ul>
      <p><button type="button" class="btn btn-ghost" data-cookie-settings><i class="fa-solid fa-sliders" aria-hidden="true"></i> <%= t.getProperty("cookie.settingsLink") %></button></p>
    </section>
    <% for (int i = 4; i <= 9; i++) { %>
    <section class="card prose-card" id="s<%= i %>">
      <h3><span class="privacy-num"><%= i %></span> <%= t.getProperty("privacy.s" + i + ".t") %></h3>
      <p><%= t.getProperty("privacy.s" + i + ".p") %></p>
    </section>
    <% } %>
  </div>
</main>

<%@ include file="includes/footer.jsp" %>
