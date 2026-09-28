<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<main>
  <h2><%= t.getProperty("terms.heading") %></h2>
  <div class="card prose-card">
    <ul>
      <li><%= t.getProperty("terms.r1") %></li>
      <li><%= t.getProperty("terms.r2") %></li>
      <li><%= t.getProperty("terms.r3") %></li>
    </ul>
  </div>
</main>

<%@ include file="includes/footer.jsp" %>
