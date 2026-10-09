<%@ include file="/includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>

<main class="admin-page">
  <%@ include file="/includes/admin-nav.jspf" %>
  <h2 class="admin-page-title">Písně</h2>
  <p class="text-dim">Píseň je střed administrace — YouTube, Spotify, Apple Music a náhled se vážou k ní.</p>

  <c:if test="${not empty param.msg}">
    <p class="admin-flash"><c:out value="${param.msg}"/></p>
  </c:if>

  <table class="songs-table">
    <thead>
      <tr>
        <th></th>
        <th>Název</th>
        <th>Rok</th>
        <th>Média</th>
        <th>Text</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <c:forEach var="song" items="${songs}">
        <tr>
          <td>
            <c:choose>
              <c:when test="${not empty song.thumbUrl}">
                <img class="song-preview-thumb" src="<c:out value='${song.thumbUrl}'/>" alt="" loading="lazy">
              </c:when>
              <c:otherwise>
                <span class="song-preview-empty">—</span>
              </c:otherwise>
            </c:choose>
          </td>
          <td>
            <a href="/admin/song?uuid=${song.uuid}"><strong><c:out value="${song.name}"/></strong></a>
            <div class="text-dim song-list-uuid" title="${song.uuid}"><c:out value="${song.uuid}"/></div>
          </td>
          <td>${song.year != null ? song.year : '—'}</td>
          <td class="media-badges">
            <span class="indicator ${song.hasVideo ? 'yes' : 'no'}" title="YouTube"><i class="fab fa-youtube"></i></span>
            <span class="indicator ${song.hasSpotify ? 'yes' : 'no'}" title="Spotify"><i class="fab fa-spotify"></i></span>
            <span class="indicator ${song.hasApple ? 'yes' : 'no'}" title="Apple Music"><i class="fab fa-apple"></i></span>
            <span class="indicator ${song.hasPreview ? 'yes' : 'no'}" title="Náhled / OG"><i class="fa-regular fa-image"></i></span>
          </td>
          <td>
            <c:choose>
              <c:when test="${song.hasLyrics}">
                <c:forEach var="lang" items="${song.languages}">
                  <span class="lang-flag">${lang}</span>
                </c:forEach>
              </c:when>
              <c:otherwise>
                <span class="indicator no">✗</span>
              </c:otherwise>
            </c:choose>
          </td>
          <td>
            <a href="/admin/song?uuid=${song.uuid}" class="link-btn">Upravit</a>
            <c:if test="${not empty song.uuid}">
              <a href="/cs/song/${song.uuid}" class="link-btn" target="_blank">Text</a>
            </c:if>
          </td>
        </tr>
      </c:forEach>
    </tbody>
  </table>
</main>

<%@ include file="/includes/footer.jsp" %>
