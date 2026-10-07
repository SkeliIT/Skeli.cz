<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="sk" tagdir="/WEB-INF/tags" %>
<%
    String role = (String) session.getAttribute("role");
    Throwable ex = (Throwable) request.getAttribute("jakarta.servlet.error.exception");
    Integer code = (Integer) request.getAttribute("jakarta.servlet.error.status_code");
    String uri = (String) request.getAttribute("jakarta.servlet.error.request_uri");
    String errLead = t.getProperty("error.lost") + " <a href='/index.jsp'>" + t.getProperty("error.homeLink") + "</a>.";
%>
<main class="error-page">
  <%-- the big gold error number on the night street (MC Kevin adds a line about it) --%>
  <sk:pageHero kicker='<%= t.getProperty("error.heading") %>'
               title='<%= String.valueOf(code != null ? code : 404) %>'
               lead='<%= errLead %>'>
    <div class="error-actions">
      <a class="btn btn-primary" href="/index.jsp"><i class="fa-solid fa-house"></i> ${t['menu.home']}</a>
      <a class="btn btn-ghost" href="/texty.jsp"><i class="fa-solid fa-align-left"></i> ${t['menu.lyrics']}</a>
    </div>
  </sk:pageHero>
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
