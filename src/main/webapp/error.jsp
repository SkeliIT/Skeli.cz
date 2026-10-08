<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="sk" tagdir="/WEB-INF/tags" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%
    String role = (String) session.getAttribute("role");
    Throwable ex = (Throwable) request.getAttribute("jakarta.servlet.error.exception");
    Integer code = (Integer) request.getAttribute("jakarta.servlet.error.status_code");
    String uri = (String) request.getAttribute("jakarta.servlet.error.request_uri");
    boolean forbidden = code != null && code == 403;
    boolean signedOut = session.getAttribute("userId") == null;
    String errLead = forbidden ? t.getProperty(signedOut ? "error.forbiddenSignIn" : "error.forbidden")
        : code != null && code == 429 ? t.getProperty("error.tooMany")
        : code != null && code >= 500 ? t.getProperty("error.server")
        : t.getProperty("error.lost") + " <a href='/index.jsp'>" + t.getProperty("error.homeLink") + "</a>.";
    // back to the admin page after signing in (only a path on this site)
    String nextPath = "GET".equals(request.getMethod()) && uri != null && uri.startsWith("/") && !uri.startsWith("//") ? uri : "/admin.jsp";
    // the hero body takes EL only (scriptless tag), so the sign-in button is prepared here
    if (forbidden && signedOut) {
      pageContext.setAttribute("signInHref", "/login.jsp?next=" + java.net.URLEncoder.encode(nextPath, "UTF-8"));
      pageContext.setAttribute("signInLabel", t.getProperty("auth.submit.login"));
    }
%>
<main class="error-page">
  <%-- the big gold error number on the night street (MC Kevin adds a line about it) --%>
  <sk:pageHero kicker='<%= t.getProperty("error.heading") %>'
               title='<%= String.valueOf(code != null ? code : 404) %>'
               lead='<%= errLead %>'>
    <div class="error-actions">
      <c:if test="${not empty signInHref}">
      <a class="btn btn-primary" href="<c:out value='${signInHref}'/>"><i class="fa-solid fa-right-to-bracket"></i> <c:out value='${signInLabel}'/></a>
      </c:if>
      <a class="btn ${empty signInHref ? 'btn-primary' : 'btn-ghost'}" href="/index.jsp"><i class="fa-solid fa-house"></i> ${t['menu.home']}</a>
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
