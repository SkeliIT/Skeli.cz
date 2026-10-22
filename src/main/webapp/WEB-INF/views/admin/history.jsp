<%@ include file="/includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%-- Záznam změn a koš (web/admin/AdminHistoryServlet, service/Trash, filter/AdminAuditFilter) --%>
<main class="admin-page admin-history-page">
  <%@ include file="/includes/admin-nav.jspf" %>
  <h2 class="admin-page-title">Záznam změn a koš</h2>
  <p class="text-dim">Co se v adminu smaže, leží tu ${keepDays} dní a jde vrátit. Pod tím je zapsané, kdo co kdy změnil.</p>

  <c:if test="${not empty param.msg}">
    <p class="admin-flash${param.msg == 'restored' ? '' : ' error'}">
      <c:choose>
        <c:when test="${param.msg == 'restored'}"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Vráceno zpátky na web.</c:when>
        <c:when test="${param.msg == 'gone'}">Tahle položka už v koši není (vrácená nebo starší než ${keepDays} dní).</c:when>
        <c:otherwise>Vrátit se to nepovedlo. Zkus to znovu, nebo mi napiš.</c:otherwise>
      </c:choose>
    </p>
  </c:if>

  <section class="admin-card" id="trash">
    <h3><i class="fa-solid fa-trash-can-arrow-up" aria-hidden="true"></i> Koš</h3>
    <c:choose>
      <c:when test="${empty trash}"><p class="text-dim">Koš je prázdný.</p></c:when>
      <c:otherwise>
        <ul class="trash-list">
          <c:forEach var="t" items="${trash}">
            <li class="trash-item${t.restored ? ' restored' : ''}">
              <i class="fa-solid ${t.kind == 'video' ? 'fa-film' : t.kind == 'song' ? 'fa-music' : t.kind == 'lyrics' ? 'fa-align-left' : 'fa-comment'}" aria-hidden="true"></i>
              <span class="trash-label"><c:out value="${t.label}"/>
                <small>smazal(a) <c:out value="${t.username}"/> · ${t.when}<c:if test="${t.restored}"> · vrátil(a) <c:out value="${t.restoredBy}"/></c:if></small></span>
              <c:choose>
                <c:when test="${t.restored}"><span class="trash-state"><i class="fa-solid fa-check" aria-hidden="true"></i> vráceno</span></c:when>
                <c:otherwise>
                  <span class="trash-days" title="Pak zmizí natrvalo">ještě ${t.daysLeft} dní</span>
                  <form method="post" action="/admin/history" class="inline-form">
                    <input type="hidden" name="csrf" value="${csrf}">
                    <input type="hidden" name="action" value="restore">
                    <input type="hidden" name="id" value="${t.id}">
                    <button type="submit" class="trash-restore"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Vrátit</button>
                  </form>
                </c:otherwise>
              </c:choose>
            </li>
          </c:forEach>
        </ul>
      </c:otherwise>
    </c:choose>
  </section>

  <section class="admin-card" id="log">
    <h3><i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i> Záznam změn</h3>
    <c:if test="${people.size() > 1}">
      <nav class="play-tabs" aria-label="Kdo">
        <a href="/admin/history#log" class="${empty who ? 'on' : ''}">Všichni</a>
        <c:forEach var="p" items="${people}">
          <a href="/admin/history?who=<c:out value='${p}'/>#log" class="${p == who ? 'on' : ''}"><c:out value="${p}"/></a>
        </c:forEach>
      </nav>
    </c:if>
    <c:choose>
      <c:when test="${empty log}"><p class="text-dim">Zatím se nic nezměnilo.</p></c:when>
      <c:otherwise>
        <ol class="history-list">
          <c:forEach var="l" items="${log}">
            <li>
              <span class="history-when">${l[0]}</span>
              <span class="history-who"><c:out value="${l[1]}"/></span>
              <span class="history-what"><b><c:out value="${l[2]}"/></b><c:if test="${not empty l[3]}"> <small><c:out value="${l[3]}"/></small></c:if></span>
            </li>
          </c:forEach>
        </ol>
      </c:otherwise>
    </c:choose>
  </section>
</main>
<%@ include file="/includes/footer.jsp" %>
