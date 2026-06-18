<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>

<main>
  <h2>Přehled písní</h2>
  <p><a href="/admin.jsp">← Zpět na admin</a></p>

  <table class="songs-table">
    <thead>
      <tr>
        <th>ID</th>
        <th>Název</th>
        <th>Rok</th>
        <th>Video</th>
        <th>Text</th>
        <th>Jazyky</th>
        <th>Akce</th>
      </tr>
    </thead>
    <tbody>
      <c:forEach var="song" items="${songs}">
        <tr>
          <td>${song.id}</td>
          <td>${song.name}</td>
          <td>${song.year != null ? song.year : '-'}</td>
          <td>
            <c:choose>
              <c:when test="${song.hasVideo}">
                <span class="indicator yes">✓</span>
              </c:when>
              <c:otherwise>
                <span class="indicator no">✗</span>
              </c:otherwise>
            </c:choose>
          </td>
          <td>
            <c:choose>
              <c:when test="${song.hasLyrics}">
                <span class="indicator yes">✓</span>
              </c:when>
              <c:otherwise>
                <span class="indicator no">✗</span>
              </c:otherwise>
            </c:choose>
          </td>
          <td>
            <c:if test="${song.hasLyrics}">
              <c:forEach var="lang" items="${song.languages}">
                <span class="lang-flag">${lang}</span>
              </c:forEach>
            </c:if>
          </td>
          <td>
            <c:if test="${song.hasVideo}">
              <a href="/music.jsp" class="link-btn" target="_blank">Video</a>
            </c:if>
            <c:if test="${song.hasLyrics}">
              <a href="/lyrics/${song.id}" class="link-btn" target="_blank">Text</a>
            </c:if>
          </td>
        </tr>
      </c:forEach>
    </tbody>
  </table>
</main>

<%@ include file="includes/footer.jsp" %>
