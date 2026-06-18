<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="/includes/header.jsp" %>
<%@ taglib prefix="c" uri="https://jakarta.ee/jsp/jstl/core" %>

<main>
  <h2>Moje Hudba!</h2>

  <div class="media-columns">
    <section class="section youtube">
      <div class="player-shell">
        <h3 class="section-title"><span class="ico"><i class="fab fa-youtube" style="color:#FF0000"></i></span> ${t.getProperty('section.youtube','YouTube')}</h3>
        <jsp:include page="/elliptic" flush="true" />
      </div>
    </section>
  </div>
</main>


<%@ include file="/includes/footer.jsp" %>
