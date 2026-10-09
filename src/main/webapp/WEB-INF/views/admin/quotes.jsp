<%@ include file="/includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>

<main class="admin-page admin-quotes-page">
  <%@ include file="/includes/admin-nav.jspf" %>
  <h2 class="admin-page-title">Citáty na úvodu</h2>
  <p class="text-dim">Dva řádky z písně. Na úvodní stránce se při každé návštěvě vypálí jeden náhodný i s názvem písně a odkazuje na její text. Uvozovky se přidají samy.</p>

  <c:if test="${not empty param.msg}">
    <p class="${param.msg == 'missing' ? 'admin-error' : 'admin-flash'}">
      <c:choose>
        <c:when test="${param.msg == 'added'}">Citát přidán.</c:when>
        <c:when test="${param.msg == 'saved'}">Citát uložen.</c:when>
        <c:when test="${param.msg == 'deleted'}">Citát smazán.</c:when>
        <c:when test="${param.msg == 'missing'}">Vyber píseň a vyplň oba řádky.</c:when>
      </c:choose>
    </p>
  </c:if>

  <section class="admin-card">
    <h3>Nový citát</h3>
    <form method="post" action="/admin/quotes" class="admin-form quote-form">
      <input type="hidden" name="csrf" value="${csrf}">
      <input type="hidden" name="action" value="add">
      <label>Píseň
        <select name="song_id" required>
          <option value="">— vyber píseň —</option>
          <c:forEach var="s" items="${songs}"><option value="${s.id}"><c:out value="${s.name}"/></option></c:forEach>
        </select>
      </label>
      <label>1. řádek <input name="line1" maxlength="200" required></label>
      <label>2. řádek <input name="line2" maxlength="200" required></label>
      <button type="submit"><i class="fa-solid fa-plus" aria-hidden="true"></i> Přidat</button>
    </form>
  </section>

  <h3 class="quotes-count">Citátů: ${quotes.size()}</h3>
  <c:forEach var="q" items="${quotes}">
    <section class="admin-card quote-card" id="q${q.id}">
      <form method="post" action="/admin/quotes" class="admin-form quote-form">
        <input type="hidden" name="csrf" value="${csrf}">
        <input type="hidden" name="action" value="save">
        <input type="hidden" name="id" value="${q.id}">
        <label>Píseň
          <select name="song_id">
            <c:forEach var="s" items="${songs}"><option value="${s.id}"${s.id == q.songId ? ' selected' : ''}><c:out value="${s.name}"/></option></c:forEach>
          </select>
        </label>
        <label>1. řádek <input name="line1" maxlength="200" value="<c:out value='${q.line1}'/>"></label>
        <label>2. řádek <input name="line2" maxlength="200" value="<c:out value='${q.line2}'/>"></label>
        <button type="submit">Uložit</button>
      </form>
      <form method="post" action="/admin/quotes" class="quote-delete">
        <input type="hidden" name="csrf" value="${csrf}">
        <input type="hidden" name="action" value="delete">
        <input type="hidden" name="id" value="${q.id}">
        <button type="submit" class="btn-delete" onclick="return confirm('Smazat tenhle citát?')">Smazat</button>
      </form>
    </section>
  </c:forEach>
</main>
<%@ include file="/includes/footer.jsp" %>
