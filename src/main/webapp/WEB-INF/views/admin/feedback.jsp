<%@ include file="/includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%-- "Co říkáš na web?": every rating; a heart puts the message on the home page (web/admin/AdminFeedbackServlet) --%>
<main class="admin-page admin-feedback-page">
  <%@ include file="/includes/admin-nav.jspf" %>
  <h2 class="admin-page-title">Co říkáš na web?</h2>
  <p class="text-dim">Hodnocení webu od přihlášených návštěvníků. Vzkazy vidíš jen ty. Když se ti nějaký líbí, dej <b>Zobrazit jako referenci</b> a objeví se na hlavní stránce v pruhu „Co o webu říkáte“ (nejvýš 6 nejnovějších). Když člověk vzkaz změní, z referencí zmizí, ať ho zase vidíš.</p>
  <%-- problems visitors reported to MC Kevin (Nahlásit problém): sorted out = deleted --%>
  <section class="admin-card fb-reports" id="reports">
    <h3><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Nahlášené problémy</h3>
    <c:choose>
      <c:when test="${empty reports}"><p class="text-dim">Nikdo nic nenahlásil. Návštěvníci hlásí problémy Kevinovi (v jeho menu Nahlásit problém).</p></c:when>
      <c:otherwise>
        <c:forEach var="r" items="${reports}">
          <div class="fb-report">
            <div class="fb-admin-head">
              <a href="<c:out value='${r.page}'/>" target="_blank" rel="noopener"><c:out value="${r.page}"/></a>
              <span class="text-dim"><%= com.github.skeliit.WebUtils.formatDateTime(((com.github.skeliit.model.SiteReport) pageContext.getAttribute("r")).at, cur) %></span>
              <span class="text-dim"><c:out value="${empty r.username ? 'nepřihlášený návštěvník' : r.username}"/></span>
            </div>
            <p class="fb-admin-msg"><c:out value="${r.message}"/></p>
            <form method="post" action="/admin/feedback"><input type="hidden" name="csrf" value="${csrf}"><input type="hidden" name="id" value="${r.id}">
              <input type="hidden" name="action" value="delete_report"><button type="submit"><i class="fa-solid fa-check" aria-hidden="true"></i> Vyřešeno (smazat)</button></form>
          </div>
        </c:forEach>
      </c:otherwise>
    </c:choose>
  </section>

  <p class="fb-admin-counts"><span><i class="fa-solid fa-thumbs-up" aria-hidden="true"></i> ${up}</span> <span><i class="fa-solid fa-thumbs-down" aria-hidden="true"></i> ${down}</span></p>

  <c:if test="${empty items}"><p class="text-dim">Zatím nikdo nehodnotil.</p></c:if>
  <c:forEach var="f" items="${items}">
    <section class="admin-card fb-admin-item${f.hearted ? ' is-hearted' : ''}" id="f${f.id}">
      <div class="fb-admin-head">
        <span class="fb-admin-vote ${f.up ? 'up' : 'down'}"><i class="fa-solid ${f.up ? 'fa-thumbs-up' : 'fa-thumbs-down'}" aria-hidden="true"></i></span>
        <strong><c:out value="${f.username}"/></strong>
        <span class="text-dim"><%= com.github.skeliit.WebUtils.formatDateTime(((com.github.skeliit.model.SiteFeedback) pageContext.getAttribute("f")).at, cur) %></span>
        <c:if test="${f.hearted}"><span class="fb-admin-badge"><i class="fa-solid fa-star" aria-hidden="true"></i> reference na úvodu</span></c:if>
      </div>
      <c:choose>
        <c:when test="${not empty f.message}"><p class="fb-admin-msg"><c:out value="${f.message}"/></p></c:when>
        <c:otherwise><p class="text-dim">(bez vzkazu)</p></c:otherwise>
      </c:choose>
      <div class="fb-admin-actions">
        <c:if test="${not empty f.message}">
          <form method="post" action="/admin/feedback"><input type="hidden" name="csrf" value="${csrf}"><input type="hidden" name="id" value="${f.id}">
            <input type="hidden" name="action" value="${f.hearted ? 'unheart' : 'heart'}">
            <button type="submit"><i class="fa-${f.hearted ? 'regular' : 'solid'} fa-heart" aria-hidden="true"></i> ${f.hearted ? 'Odebrat z referencí' : 'Zobrazit jako referenci'}</button></form>
        </c:if>
        <form method="post" action="/admin/feedback" onsubmit="return confirm('Smazat toto hodnocení?')"><input type="hidden" name="csrf" value="${csrf}"><input type="hidden" name="id" value="${f.id}">
          <input type="hidden" name="action" value="delete"><button type="submit" class="btn-delete"><i class="fa-solid fa-trash" aria-hidden="true"></i> Smazat</button></form>
      </div>
    </section>
  </c:forEach>
</main>
<%@ include file="/includes/footer.jsp" %>
