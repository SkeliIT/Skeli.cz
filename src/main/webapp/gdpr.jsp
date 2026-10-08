<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %><%
  // The privacy rules live in one place only (privacy.jsp); the old GDPR page sends visitors there
  response.setStatus(HttpServletResponse.SC_MOVED_PERMANENTLY);
  response.setHeader("Location", "/privacy.jsp");
%>
