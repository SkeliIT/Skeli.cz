<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%
    String role = (String) session.getAttribute("role");
    Throwable ex = (Throwable) request.getAttribute("jakarta.servlet.error.exception");
    Integer code = (Integer) request.getAttribute("jakarta.servlet.error.status_code");
    String uri = (String) request.getAttribute("jakarta.servlet.error.request_uri");
%>
<main class="error-page">
  <div class="error-code" aria-hidden="true"><%= code != null ? code : 404 %></div>
  <h2><%= t.getProperty("error.heading") %></h2>
  <p class="page-lead"><%= t.getProperty("error.lost") %> <a href="/index.jsp"><%= t.getProperty("error.homeLink") %></a>.</p>
  <div class="error-actions">
    <a class="btn btn-primary" href="/index.jsp"><i class="fa-solid fa-house"></i> <%= t.getProperty("menu.home") %></a>
    <a class="btn btn-ghost" href="/texty.jsp"><i class="fa-solid fa-align-left"></i> <%= t.getProperty("menu.lyrics") %></a>
  </div>
  <%
    // Error details are shown to admins only - to anyone else they would leak app internals
    if (ex != null) {
      if ("ADMIN".equals(role)) {
  %>
    <details class="error-detail card">
      <summary><%= t.getProperty("error.adminDetail") %></summary>
      <pre>
status=<%= code %> uri=<%= com.github.skeliit.WebUtils.escapeHtml(uri) %>
<%
        java.io.StringWriter sw = new java.io.StringWriter();
        ex.printStackTrace(new java.io.PrintWriter(sw));
        // Exception messages can contain user input, so escape them
        out.print(com.github.skeliit.WebUtils.escapeHtml(sw.toString()));
%>
      </pre>
    </details>
  <%
      }
    }
  %>
</main>
<%@ include file="includes/footer.jsp" %>
