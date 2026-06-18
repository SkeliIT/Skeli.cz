<%@ page import="java.sql.*" %>
<%@ page import="com.github.skeliit.Db" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<main>
  <h2 class="bruno-ace-sc-regular text-center"><%= ((java.util.Properties)request.getAttribute("t")).getProperty("menu.music","Music") %></h2>

  <div class="media-columns">
  <section class="section youtube">
    <h3 class="section-title"><span class="ico"><i class="fab fa-youtube icon-youtube"></i></span> <%= ((java.util.Properties)request.getAttribute("t")).getProperty("section.youtube","YouTube") %></h3>
    <jsp:include page="/elliptic" flush="true" />
  </section>
  </div>

</main>

<%@ include file="includes/footer.jsp" %>
