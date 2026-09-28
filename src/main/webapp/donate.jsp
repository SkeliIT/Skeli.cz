<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<main class="donate-page">
  <div class="donate-card">
    <div class="donate-intro">
      <h2 class="donate-title"><%= t.getProperty("donate.title","Podpoř můj projekt") %></h2>
      <p class="donate-description"><%= t.getProperty("donate.description","Dobrovolný příspěvek pomůže s výrobou hudby, videí a provozem webu. Dík!") %></p>
    </div>

    <div class="donate-grid">
      <section class="donate-section">
        <h3><%= t.getProperty("donate.options.title","💰 Možnosti") %></h3>
        <ul>
          <li><%= t.getProperty("donate.revolut.label","💳 Revolut") %>: <a href="https://revolut.me/skelimc" target="_blank" rel="noopener">revolut.me/skelimc</a></li>
        </ul>
      </section>

      <section class="donate-section">
        <h3><%= t.getProperty("donate.contact.title","📧 Fakturace / kontakt") %></h3>
        <p><%= t.getProperty("donate.email.label","E-mail") %>: <a href="mailto:skelimc@seznam.cz">skelimc@seznam.cz</a></p>
      </section>
    </div>
  </div>
</main>

<%@ include file="includes/footer.jsp" %>
