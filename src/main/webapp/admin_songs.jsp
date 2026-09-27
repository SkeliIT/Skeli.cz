<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>

<main>
  <h2>Přehled písní</h2>
  <p><a href="/admin.jsp">← Zpět na admin</a></p>

  <c:if test="${not empty param.msg}">
    <p class="admin-flash">
      <c:choose>
        <c:when test="${param.msg == 'preview_saved'}">Náhledový obrázek uložen.</c:when>
        <c:when test="${param.msg == 'preview_deleted'}">Náhledový obrázek smazán.</c:when>
        <c:when test="${param.msg == 'no_file'}">Nebyl vybrán žádný soubor.</c:when>
        <c:when test="${param.msg == 'too_large'}">Soubor je příliš velký (max 5&nbsp;MB).</c:when>
        <c:when test="${param.msg == 'invalid_image'}">Neplatný obrázek.</c:when>
        <c:otherwise>${param.msg}</c:otherwise>
      </c:choose>
    </p>
  </c:if>

  <p class="text-dim">Náhledový obrázek slouží pro Open Graph (sdílení odkazu) a jako placeholder před načtením YouTube videa.</p>

  <table class="songs-table">
    <thead>
      <tr>
        <th>ID</th>
        <th>Náhled</th>
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
          <td class="song-preview-cell">
            <c:choose>
              <c:when test="${not empty song.previewImageUrl}">
                <img class="song-preview-thumb" src="${song.previewImageUrl}" alt="Náhled: ${song.name}">
              </c:when>
              <c:otherwise>
                <span class="song-preview-empty">—</span>
              </c:otherwise>
            </c:choose>
            <form method="post" action="/admin/songs/preview" enctype="multipart/form-data" class="song-preview-form">
              <input type="hidden" name="csrf" value="${csrf}">
              <input type="hidden" name="song_id" value="${song.id}">
              <label class="song-preview-upload">
                <input type="file" name="preview" accept="image/jpeg,image/png,image/webp" required>
                <span>Nahrát</span>
              </label>
              <button type="submit">Uložit</button>
            </form>
            <c:if test="${not empty song.previewImageUrl}">
              <form method="post" action="/admin/songs/preview" class="song-preview-form">
                <input type="hidden" name="csrf" value="${csrf}">
                <input type="hidden" name="song_id" value="${song.id}">
                <input type="hidden" name="action" value="delete">
                <button type="submit" class="btn-delete" onclick="return confirm('Smazat náhled?')">Smazat</button>
              </form>
            </c:if>
          </td>
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
              <a href="/admin/lyrics?song=${song.id}" class="link-btn">Text</a>
            </c:if>
          </td>
        </tr>
      </c:forEach>
    </tbody>
  </table>
</main>

<%@ include file="includes/footer.jsp" %>
