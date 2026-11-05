<%@ include file="/includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%-- Admin → Hudba → Poznámky: nastříkaná poznámka u písně (web/admin/AdminNotesServlet). Jedna na píseň. --%>
<main class="admin-page">
  <%@ include file="/includes/admin-nav.jspf" %>
  <h2 class="admin-page-title">Poznámky u písní</h2>
  <p class="text-dim">Krátký vzkaz nastříkaný pod fotkou nebo videem, třeba „Videoklip už brzy na YouTube“. Každá píseň má jednu poznámku.</p>

  <c:if test="${not empty param.msg}">
    <p class="admin-flash${param.msg == 'saved' or param.msg == 'deleted' ? '' : ' error'}">
      <c:choose>
        <c:when test="${param.msg == 'saved'}">Poznámka je uložená.</c:when>
        <c:when test="${param.msg == 'deleted'}">Poznámka je smazaná.</c:when>
        <c:when test="${param.msg == 'bad_date'}">Datum se nepodařilo přečíst, nic se neuložilo.</c:when>
        <c:otherwise>Vyber píseň a napiš aspoň český text.</c:otherwise>
      </c:choose>
    </p>
  </c:if>

  <section class="admin-card">
    <h3>${note.songId > 0 ? 'Upravit poznámku' : 'Nová poznámka'}</h3>
    <form method="post" action="/admin/notes" class="admin-form note-form">
      <input type="hidden" name="csrf" value="${csrf}">
      <input type="hidden" name="action" value="save">
      <label>Píseň
        <select name="song_id" required>
          <option value="">— vyber píseň —</option>
          <c:forEach var="s" items="${songs}"><option value="${s.id}"${s.id == note.songId ? ' selected' : ''}><c:out value="${s.name}"/></option></c:forEach>
        </select>
      </label>
      <label>Text česky (nejvýš 80 znaků)
        <input name="text_cs" maxlength="80" required value="<c:out value='${note.textCs}'/>" placeholder="Videoklip už brzy na YouTube">
      </label>
      <p class="text-dim note-form-hint">Překlady. Když některý necháš prázdný, ukáže se v tom jazyce čeština.</p>
      <div class="note-form-langs">
        <label>EN <input name="text_en" maxlength="80" value="<c:out value='${note.textEn}'/>"></label>
        <label>DE <input name="text_de" maxlength="80" value="<c:out value='${note.textDe}'/>"></label>
        <label>UK <input name="text_uk" maxlength="80" value="<c:out value='${note.textUk}'/>"></label>
        <label>VI <input name="text_vi" maxlength="80" value="<c:out value='${note.textVi}'/>"></label>
      </div>
      <fieldset class="note-form-places">
        <legend>Kde se má ukázat</legend>
        <label><input type="checkbox" name="show_song"${note.showSong ? ' checked' : ''}> Na stránce písně</label>
        <label><input type="checkbox" name="show_lyrics"${note.showLyrics ? ' checked' : ''}> V Textech</label>
        <label><input type="checkbox" name="show_music"${note.showMusic ? ' checked' : ''}> Na Hudbě</label>
      </fieldset>
      <label>Sundat po tomhle dni (nepovinné)
        <input type="date" name="until" value="${note.until}">
      </label>
      <button type="submit"><i class="fa-solid fa-spray-can" aria-hidden="true"></i> Uložit poznámku</button>
      <c:if test="${note.songId > 0}"><a class="admin-btn" href="/admin/notes">Zrušit úpravu</a></c:if>
    </form>
  </section>

  <section class="admin-card">
    <h3>Poznámky na webu</h3>
    <c:if test="${empty notes}"><p class="text-dim">Zatím žádná.</p></c:if>
    <div class="note-list">
      <c:forEach var="n" items="${notes}">
        <article class="note-item${n.expired ? ' is-expired' : ''}">
          <div class="note-item-text">
            <strong><c:out value="${n.songName}"/></strong>
            <span class="note-item-say">„<c:out value="${n.textCs}"/>“</span>
            <small class="text-dim"><c:out value="${n.places}"/><c:if test="${not empty n.until}"> · do ${n.until}</c:if><c:if test="${n.expired}"> · už neplatí</c:if></small>
          </div>
          <a class="note-item-btn" href="/admin/notes?song=${n.songId}" title="Upravit" aria-label="Upravit: <c:out value='${n.songName}'/>"><i class="fa-solid fa-pen" aria-hidden="true"></i></a>
          <form method="post" action="/admin/notes" onsubmit="return confirm('Smazat tuhle poznámku?');">
            <input type="hidden" name="csrf" value="${csrf}">
            <input type="hidden" name="action" value="delete">
            <input type="hidden" name="song_id" value="${n.songId}">
            <button type="submit" class="note-item-btn" title="Smazat" aria-label="Smazat: <c:out value='${n.songName}'/>"><i class="fa-solid fa-trash-can" aria-hidden="true"></i></button>
          </form>
        </article>
      </c:forEach>
    </div>
  </section>
</main>
<%@ include file="/includes/footer.jsp" %>
