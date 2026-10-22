<%@ include file="/includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>

<main class="admin-page">
  <%@ include file="/includes/admin-nav.jspf" %>
  <h2 class="admin-page-title">Písně <a class="admin-btn primary admin-title-btn" href="/admin/track"><i class="fa-solid fa-plus"></i> Přidat track z YouTube</a></h2>
  <p class="text-dim">Klikni na píseň a uprav u ní všechno: klip, Spotify, Apple Music, obrázky i texty.</p>
  <%-- legenda: co znamenají ikony a zkratky jazyků v tabulce --%>
  <p class="songs-legend">
    <span><span class="indicator yes"><i class="fab fa-youtube"></i></span> zelená = je</span>
    <span><span class="indicator no"><i class="fab fa-youtube"></i></span> šedá = chybí</span>
    <span class="text-dim">ikony: klip na YouTube · Spotify · Apple Music · vlastní obrázek</span>
    <span><span class="lang-flag">CS</span><span class="lang-flag missing">EN</span> jazyky textu (přeškrtnutý = chybí)</span>
  </p>
  <% if ("1".equals(request.getParameter("deleted"))) { %><p class="admin-flash"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Píseň je smazaná. 30 dní ji najdeš v Koši (Systém → Záznam změn a koš).</p><% } %>

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
          </td>
          <td>${song.year != null ? song.year : '—'}</td>
          <td class="media-badges">
            <span class="indicator ${song.hasVideo ? 'yes' : 'no'}" title="YouTube"><i class="fab fa-youtube"></i></span>
            <span class="indicator ${song.hasSpotify ? 'yes' : 'no'}" title="Spotify"><i class="fab fa-spotify"></i></span>
            <span class="indicator ${song.hasApple ? 'yes' : 'no'}" title="Apple Music"><i class="fab fa-apple"></i></span>
            <span class="indicator ${song.hasPreview ? 'yes' : 'no'}" title="Vlastní obrázek písně"><i class="fa-regular fa-image"></i></span>
          </td>
          <td>
            <%-- všech pět jazyků; chybějící přeškrtnutý --%>
            <c:forEach var="l" items="${['cs','en','de','uk','vi']}">
              <span class="lang-flag${song.hasLang(l) ? '' : ' missing'}" title="${song.hasLang(l) ? 'Text je' : 'Text chybí'}">${l}</span>
            </c:forEach>
          </td>
          <td>
            <a href="/admin/song?uuid=${song.uuid}" class="link-btn">Upravit</a>
            <c:if test="${not empty song.uuid and song.hasLyrics}">
              <a href="/cs/song/${song.uuid}" class="link-btn" target="_blank" rel="noopener" title="Otevřít píseň na webu">Na webu ↗</a>
            </c:if>
          </td>
        </tr>
      </c:forEach>
    </tbody>
  </table>

  <details class="admin-card admin-manual" id="manual"<%= request.getParameter("manual") != null ? " open" : "" %>>
    <summary><i class="fa-solid fa-screwdriver-wrench" aria-hidden="true"></i> Ručně: píseň z cizího kanálu nebo bez klipu</summary>
    <% if ("saved".equals(request.getParameter("manual"))) { %><p class="admin-flash"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Uloženo.</p><% } %>
    <p class="text-dim">Jen pro zvláštní případy (feat na cizím kanálu, píseň jen na Spotify). Běžně stačí „Přidat track z YouTube“.</p>
      <form method="post" action="/admin/video" class="admin-form admin-form-cols">
        <input type="hidden" name="csrf" value="${csrf}">
        <label class="span-2">Odkaz na YouTube nebo ID videa <input name="youtube_id" placeholder="https://www.youtube.com/watch?v=…"></label>
        <label>Název songu (vytvoří nebo propojí) <input name="song_name"></label>
        <label>Název videa (nepovinné – jinak z YouTube) <input name="title"></label>
        <label>Rok <input name="year" type="number" min="1900" max="2100"></label>
        <label>Napojit na text (lyric ID) <input name="lyric_id" type="number" min="1"></label>
        <button type="submit" class="span-2"><i class="fa-solid fa-floppy-disk"></i> Uložit</button>
      </form>
  </details>
</main>

<%@ include file="/includes/footer.jsp" %>
