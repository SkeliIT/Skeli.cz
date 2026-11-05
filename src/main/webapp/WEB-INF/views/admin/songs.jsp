<%@ include file="/includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>

<main class="admin-page">
  <%@ include file="/includes/admin-nav.jspf" %>
  <h2 class="admin-page-title">Písně <a class="admin-btn primary admin-title-btn" href="/admin/track"><i class="fa-solid fa-plus"></i> Přidat track z YouTube</a></h2>
  <p class="text-dim">Klikni na píseň a uprav u ní všechno. Zlatá ikona znamená, že to píseň má, bledá, že to chybí.</p>
  <% if ("1".equals(request.getParameter("deleted"))) { %><p class="admin-flash"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Píseň je smazaná. 30 dní ji najdeš v Koši (Systém → Záznam změn a koš).</p><% } %>

  <c:if test="${not empty param.msg}">
    <p class="admin-flash"><c:out value="${param.msg}"/></p>
  </c:if>

  <%-- hledání a filtr: kreslí skript dole, data jsou v data-name a data-lack na řádku --%>
  <div class="admin-toolbar">
    <label class="admin-search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
      <input type="search" id="songFilter" placeholder="Hledat píseň…" aria-label="Hledat píseň"></label>
  </div>
  <div class="songs-filters" id="songFilters" role="group" aria-label="Filtr písní">
    <button type="button" class="on" data-f="all" aria-pressed="true">Všechny <b></b></button>
    <button type="button" data-f="lack" aria-pressed="false">Něco chybí <b></b></button>
    <button type="button" data-f="done" aria-pressed="false">Hotové <b></b></button>
  </div>

  <%-- řádek = odkaz na úpravu; ikony tiše ukazují, co píseň má --%>
  <div class="songs-list" id="songList">
    <c:forEach var="song" items="${songs}">
      <article class="songs-row" data-name="<c:out value='${song.name}'/>" data-lack="${song.complete ? '0' : '1'}">
        <c:choose>
          <c:when test="${not empty song.thumbUrl}"><img class="songs-pic" src="<c:out value='${song.thumbUrl}'/>" alt="" loading="lazy"></c:when>
          <c:otherwise><span class="songs-pic songs-pic-empty"><i class="fa-solid fa-music" aria-hidden="true"></i></span></c:otherwise>
        </c:choose>
        <a class="songs-main" href="/admin/song?uuid=${song.uuid}">
          <span class="songs-title"><c:out value="${song.name}"/></span>
          <span class="songs-year">${song.year != null ? song.year : '—'}</span>
          <span class="songs-icons">
            <i class="fab fa-youtube${song.hasVideo ? '' : ' off'}" role="img" title="YouTube: ${song.hasVideo ? 'je' : 'chybí'}" aria-label="YouTube: ${song.hasVideo ? 'je' : 'chybí'}"></i>
            <i class="fab fa-spotify${song.hasSpotify ? '' : ' off'}" role="img" title="Spotify: ${song.hasSpotify ? 'je' : 'chybí'}" aria-label="Spotify: ${song.hasSpotify ? 'je' : 'chybí'}"></i>
            <i class="fab fa-apple${song.hasApple ? '' : ' off'}" role="img" title="Apple Music: ${song.hasApple ? 'je' : 'chybí'}" aria-label="Apple Music: ${song.hasApple ? 'je' : 'chybí'}"></i>
            <small class="${song.langCount < 5 ? 'lack' : ''}" title="Jazyky: ${song.langNames}">${song.langLabel}</small>
          </span>
        </a>
        <c:choose>
          <c:when test="${not empty song.uuid and song.hasLyrics}"><a class="songs-web" href="/cs/song/${song.uuid}" target="_blank" rel="noopener" title="Otevřít píseň na webu" aria-label="Otevřít píseň na webu"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a></c:when>
          <c:otherwise><span></span></c:otherwise>
        </c:choose>
      </article>
    </c:forEach>
  </div>
  <p class="text-dim songs-none" id="songNone" hidden>Nic takového tu není.</p>
  <script>
    // hledání (i bez háčků) a filtr Všechny / Něco chybí / Hotové
    (function () {
      var rows = [].slice.call(document.querySelectorAll('#songList .songs-row')), input = document.getElementById('songFilter');
      var box = document.getElementById('songFilters'), none = document.getElementById('songNone'), filter = 'all';
      function plain(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
      function lacks(r) { return r.dataset.lack === '1'; }
      box.querySelector('[data-f=all] b').textContent = rows.length;
      box.querySelector('[data-f=lack] b').textContent = rows.filter(lacks).length;
      box.querySelector('[data-f=done] b').textContent = rows.length - rows.filter(lacks).length;
      function render() {
        var q = plain(input.value.trim()), shown = 0;
        rows.forEach(function (r) {
          var ok = (filter === 'all' || (filter === 'lack') === lacks(r)) && plain(r.dataset.name).indexOf(q) >= 0;
          r.hidden = !ok;
          if (ok) shown++;
        });
        none.hidden = shown > 0;
      }
      input.addEventListener('input', render);
      box.addEventListener('click', function (e) {
        var b = e.target.closest('[data-f]');
        if (!b) return;
        filter = b.dataset.f;
        box.querySelectorAll('[data-f]').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
        render();
      });
    })();
  </script>

  <details class="admin-card admin-manual" id="manual"<%= request.getParameter("manual") != null ? " open" : "" %>>
    <summary><i class="fa-solid fa-screwdriver-wrench" aria-hidden="true"></i> Ručně: píseň z cizího kanálu nebo bez videa</summary>
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
