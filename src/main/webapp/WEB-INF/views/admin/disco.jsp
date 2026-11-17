<%@ include file="/includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%-- Admin → Hudba → Obrázky v Diskografii (web/admin/AdminDiscoServlet): všechny karty jako na Hudbě,
     u každé Upravit = karta „Obrázek v Diskografii“ u písně (výběr obrázku, posun, zvětšení i zmenšení). --%>
<main class="admin-page">
  <%@ include file="/includes/admin-nav.jspf" %>
  <h2 class="admin-page-title">Obrázky v Diskografii</h2>
  <p class="text-dim">Takhle vypadají karty na stránce Hudba. Klikni na kartu: vybereš jiný obrázek (snímek z videa, vlastní fotku),
    posuneš ho a zvětšíš nebo zmenšíš.</p>
  <div class="admin-disco-grid">
    <c:forEach var="p" items="${cards}">
      <a class="admin-disco-card" href="/admin/song?id=${p.id}#disco-art">
        <span class="song-thumb disco-thumb-3x4" style="--thumb-bg: url('<c:out value="${p.src}"/>')">
          <c:if test="${not empty p.src}"><img class="${p.placed ? 'placed' : ''}" src="<c:out value='${p.src}'/>" alt="" loading="lazy" style="<c:out value='${p.style}'/>"></c:if>
        </span>
        <span class="admin-disco-name"><c:out value="${p.name}"/></span>
        <span class="admin-disco-meta">${p.year}${p.own ? ' · vlastní obrázek' : ''}${p.placed ? ' · upraveno' : ''}${p.collab ? ' · spolupráce' : ''}</span>
        <span class="admin-disco-edit"><i class="fa-solid fa-pen" aria-hidden="true"></i> Upravit</span>
      </a>
    </c:forEach>
  </div>
</main>
<%@ include file="/includes/footer.jsp" %>
