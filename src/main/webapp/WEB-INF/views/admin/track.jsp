<%@ include file="/includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>

<main class="admin-page admin-track-page">
  <%@ include file="/includes/admin-nav.jspf" %>
  <p class="admin-crumb"><a href="/admin/songs">Písně</a> · <strong>Přidat track z YouTube</strong></p>
  <h2 class="admin-page-title">Přidat track z YouTube</h2>
  <p class="text-dim">Vlož odkaz na klip. Název, rok a náhled se načtou z YouTube, zkontroluješ je, případně doplníš Spotify, Apple Music a text — a jedním tlačítkem je track na webu.</p>

  <c:if test="${not empty error}"><p class="admin-error"><c:out value="${error}"/></p></c:if>
  <c:if test="${param.msg == 'bad_youtube'}"><p class="admin-error">Tohle nevypadá jako odkaz na YouTube video.</p></c:if>
  <c:if test="${param.msg == 'bad_name'}"><p class="admin-error">Nová píseň potřebuje název.</p></c:if>
  <c:if test="${param.msg == 'link_taken'}"><p class="admin-error">Ten odkaz na Spotify nebo Apple Music už patří jiné písni.</p></c:if>

  <%-- step 1: the link --%>
  <form method="get" action="/admin/track" class="admin-card admin-form track-lookup">
    <label>Odkaz na YouTube
      <input name="url" type="text" required placeholder="https://www.youtube.com/watch?v=…" value="<c:out value='${empty draft ? param.url : draft.youtubeId}'/>" autofocus>
    </label>
    <button type="submit"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> Načíst</button>
  </form>

  <%-- step 2: check what was read and save --%>
  <c:if test="${not empty draft}">
    <form method="post" action="/admin/track" class="admin-card admin-form track-form">
      <input type="hidden" name="csrf" value="${csrf}">
      <input type="hidden" name="youtube_id" value="<c:out value='${draft.youtubeId}'/>">
      <div class="track-preview">
        <img src="<c:out value='${draft.thumbUrl}'/>" alt="">
        <div>
          <label>Název klipu (jak je na YouTube)
            <input name="video_title" value="<c:out value='${draft.videoTitle}'/>">
          </label>
          <c:if test="${not empty draft.linkedSongId}">
            <p class="text-dim">Tenhle klip už je u písně <a href="/admin/song?uuid=${draft.linkedSongUuid}"><c:out value="${draft.linkedSongName}"/></a>. Uložením ho můžeš přesunout jinam.</p>
          </c:if>
        </div>
      </div>

      <fieldset class="track-song">
        <legend>Píseň</legend>
        <c:set var="useExisting" value="${not empty draft.linkedSongId or not empty draft.sameNameSongId}"/>
        <c:set var="preselect" value="${not empty draft.linkedSongId ? draft.linkedSongId : draft.sameNameSongId}"/>
        <label class="track-choice"><input type="radio" name="song_mode" value="new"${useExisting ? '' : ' checked'}> Nová píseň</label>
        <div class="track-new">
          <label>Název písně <input name="song_name" value="<c:out value='${draft.songName}'/>"></label>
          <label>Rok <input name="year" type="number" min="1990" max="2100" value="${draft.year}"></label>
        </div>
        <label class="track-choice"><input type="radio" name="song_mode" value="existing"${useExisting ? ' checked' : ''}> K existující písni (např. remake nebo jiná verze klipu)</label>
        <select name="song_id" class="track-existing">
          <c:forEach var="s" items="${songs}">
            <option value="${s.id}"${s.id == preselect ? ' selected' : ''}><c:out value="${s.name}"/><c:if test="${not empty s.year}"> (${s.year})</c:if></option>
          </c:forEach>
        </select>
      </fieldset>

      <label>Spotify (nepovinné) <input name="spotify" placeholder="odkaz na skladbu ze Spotify"></label>
      <label>Apple Music (nepovinné) <input name="apple" placeholder="odkaz na skladbu z Apple Music"></label>
      <label>Text písně česky (nepovinné, jde doplnit i později)
        <textarea name="lyrics" rows="10" placeholder="Každý řádek textu na nový řádek, sloky oddělené prázdným řádkem."></textarea>
      </label>
      <p class="text-dim">Překlady textu, obrázek v seznamu Texty a další věci doladíš na stránce písně, kam tě uložení přenese.</p>
      <button type="submit"><i class="fa-solid fa-plus" aria-hidden="true"></i> Přidat track</button>
    </form>
  </c:if>
</main>
<%@ include file="/includes/footer.jsp" %>
