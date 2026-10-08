<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" trimDirectiveWhitespaces="true" %><%--
  The old lyric page: the same text now lives at /lyrics/{id} (WEB-INF/views/lyric.jsp), so this
  address moves there for good (301) and search engines keep one page per text.
--%><%
  String oldId = request.getParameter("id");
  response.setStatus(301);
  response.setHeader("Location", oldId != null && oldId.matches("[0-9]{1,9}") ? "/lyrics/" + oldId : "/texty.jsp");
%>
