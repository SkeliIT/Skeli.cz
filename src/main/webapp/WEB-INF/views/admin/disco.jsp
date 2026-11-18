<%@ include file="/includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%-- Admin → Hudba → Obrázky písní (web/admin/AdminDiscoServlet): u každé písně její obrázek na všech místech webu
     vedle sebe – karta na Hudbě, řádek v Textech, kulatá ikonka v Karaoke – se stejným posunem, jaký vidí návštěvník.
     Ťuknutí otevře úpravu u písně (záložka Obrázky, rovnou to místo). Pohledy „Jak to vypadá…“ ukážou všechno pohromadě. --%>
<main class="admin-page">
  <%@ include file="/includes/admin-nav.jspf" %>
  <h2 class="admin-page-title">Obrázky písní</h2>
  <p class="text-dim">Všechny náhledy na jednom místě. Ťukni na obrázek a otevře se jeho úprava u písně.</p>

  <div class="imgs-bar" id="imgsView" role="group" aria-label="Pohled">
    <button type="button" class="on" data-v="list" aria-pressed="true">Přehled</button>
    <button type="button" data-v="disco" aria-pressed="false">Jak to vypadá na Hudbě</button>
    <button type="button" data-v="texty" aria-pressed="false">v Textech</button>
    <button type="button" data-v="kar" aria-pressed="false">v Karaoke</button>
  </div>
  <div class="imgs-bar" id="imgsFilter" role="group" aria-label="Filtr">
    <button type="button" class="on" data-f="all" aria-pressed="true">Všechny <b></b></button>
    <button type="button" data-f="man" aria-pressed="false">Upravené <b></b></button>
    <button type="button" data-f="auto" aria-pressed="false">Jen automatické <b></b></button>
    <button type="button" data-f="miss" aria-pressed="false">Bez obrázku <b></b></button>
  </div>
  <div class="admin-toolbar">
    <label class="admin-search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
      <input type="search" id="imgsQ" placeholder="Hledat píseň…" aria-label="Hledat píseň"></label>
  </div>
  <p class="imgs-legend text-dim">
    <span><span class="imgs-tag"><i class="fa-regular fa-image" aria-hidden="true"></i></span> vybraný hlavní obrázek</span>
    <span><span class="imgs-tag"><i class="fa-solid fa-pen" aria-hidden="true"></i></span> posunuto ručně</span>
    <span><span class="imgs-tag miss">!</span> chybí obrázek</span>
    <span>bez štítku = automaticky</span>
  </p>

  <%-- Přehled: píseň = řádek, vedle sebe Hudba · Texty · Karaoke --%>
  <div class="imgs-view" data-v="list">
    <div class="imgs-head" aria-hidden="true"><span>Píseň</span><span>Hudba</span><span>Texty</span><span>Karaoke</span></div>
    <c:forEach var="p" items="${cards}">
      <article class="imgs-song imgs-item" data-name="<c:out value='${p.name}'/>" data-man="${p.manual ? 1 : 0}" data-miss="${empty p.src ? 1 : 0}">
        <a class="imgs-name" href="/admin/song?id=${p.id}#obrazky"><b><c:out value="${p.name}"/></b>
          <small class="text-dim">${p.year}${p.collab ? ' · spolupráce' : ''}</small></a>
        <a class="imgs-cell c-disco" href="/admin/song?id=${p.id}#disco-art" title="Upravit kartu na Hudbě">
          <span class="song-thumb disco-thumb-3x4" style="--thumb-bg: url('<c:out value="${p.src}"/>')">
            <c:if test="${not empty p.src}"><img class="${p.placed ? 'placed' : ''}" src="<c:out value='${p.src}'/>" alt="" loading="lazy" style="<c:out value='${p.style}'/>"></c:if>
          </span>
          <c:choose>
            <c:when test="${empty p.src}"><span class="imgs-tag miss">!</span></c:when>
            <c:when test="${p.own}"><span class="imgs-tag"><i class="fa-regular fa-image" aria-hidden="true"></i></span></c:when>
            <c:when test="${p.placed}"><span class="imgs-tag"><i class="fa-solid fa-pen" aria-hidden="true"></i></span></c:when>
          </c:choose>
        </a>
        <c:choose>
          <c:when test="${p.inTexty}">
            <a class="imgs-cell c-texty" href="/admin/song?id=${p.id}#row-art" title="Upravit řádek v Textech">
              <span class="song-row art-row imgs-row"><span class="song-row-art"><c:if test="${not empty p.textySrc}"><img src="<c:out value='${p.textySrc}'/>" alt="" loading="lazy" data-trim-bars<c:if test="${p.textyPlaced}"> style="<c:out value='${p.textyStyle}'/>" data-manual="1"</c:if>></c:if></span>
                <span class="song-row-text"><span class="song-row-title"><c:out value="${p.name}"/></span></span></span>
              <c:choose>
                <c:when test="${empty p.textySrc}"><span class="imgs-tag miss">!</span></c:when>
                <c:when test="${p.textyPlaced}"><span class="imgs-tag"><i class="fa-solid fa-pen" aria-hidden="true"></i></span></c:when>
              </c:choose>
            </a>
          </c:when>
          <c:otherwise><span class="imgs-cell c-texty imgs-none">není v Textech</span></c:otherwise>
        </c:choose>
        <c:choose>
          <c:when test="${not empty p.karSrc}">
            <a class="imgs-cell c-kar" href="/admin/song?id=${p.id}#disco-art" title="Ikonka v Karaoke má stejný posun jako karta na Hudbě">
              <span class="kar-icon"><img class="${p.karMain ? 'placed' : 'auto'}" src="<c:out value='${p.karSrc}'/>" alt="" loading="lazy" style="<c:out value='${p.karStyle}'/>"></span>
            </a>
          </c:when>
          <c:otherwise><span class="imgs-cell c-kar imgs-none">není v Karaoke</span></c:otherwise>
        </c:choose>
      </article>
    </c:forEach>
  </div>

  <%-- Jak to vypadá na Hudbě: karty pohromadě --%>
  <div class="imgs-view admin-disco-grid" data-v="disco" hidden>
    <c:forEach var="p" items="${cards}">
      <a class="admin-disco-card imgs-item" data-name="<c:out value='${p.name}'/>" data-man="${p.manual ? 1 : 0}" data-miss="${empty p.src ? 1 : 0}" href="/admin/song?id=${p.id}#disco-art">
        <span class="song-thumb disco-thumb-3x4" style="--thumb-bg: url('<c:out value="${p.src}"/>')">
          <c:if test="${not empty p.src}"><img class="${p.placed ? 'placed' : ''}" src="<c:out value='${p.src}'/>" alt="" loading="lazy" style="<c:out value='${p.style}'/>"></c:if>
        </span>
        <span class="admin-disco-name"><c:out value="${p.name}"/></span>
      </a>
    </c:forEach>
  </div>

  <%-- Jak to vypadá v Textech: řádky pod sebou --%>
  <div class="imgs-view imgs-wall-rows" data-v="texty" hidden>
    <c:forEach var="p" items="${cards}">
      <c:if test="${p.inTexty}">
        <a class="song-row art-row imgs-item" data-name="<c:out value='${p.name}'/>" data-man="${p.manual ? 1 : 0}" data-miss="${empty p.src ? 1 : 0}" href="/admin/song?id=${p.id}#row-art">
          <span class="song-row-art"><c:if test="${not empty p.textySrc}"><img src="<c:out value='${p.textySrc}'/>" alt="" loading="lazy" data-trim-bars<c:if test="${p.textyPlaced}"> style="<c:out value='${p.textyStyle}'/>" data-manual="1"</c:if>></c:if></span>
          <span class="song-row-text"><span class="song-row-title"><c:out value="${p.name}"/></span><span class="song-row-meta">${p.year}</span></span>
        </a>
      </c:if>
    </c:forEach>
  </div>

  <%-- Jak to vypadá v Karaoke: seznam s kulatými ikonkami --%>
  <div class="imgs-view imgs-wall-kar" data-v="kar" hidden>
    <c:forEach var="p" items="${cards}">
      <c:if test="${not empty p.karSrc}">
        <a class="imgs-kar-row imgs-item" data-name="<c:out value='${p.name}'/>" data-man="${p.manual ? 1 : 0}" data-miss="${empty p.src ? 1 : 0}" href="/admin/song?id=${p.id}#disco-art">
          <span><b><c:out value="${p.name}"/></b><small class="text-dim">${p.year}</small></span>
          <span class="kar-icon"><img class="${p.karMain ? 'placed' : 'auto'}" src="<c:out value='${p.karSrc}'/>" alt="" loading="lazy" style="<c:out value='${p.karStyle}'/>"></span>
        </a>
      </c:if>
    </c:forEach>
  </div>
  <p class="text-dim imgs-empty" id="imgsEmpty" hidden>Nic takového tu není.</p>
</main>
<script src="/js/trim-bars.js?v=<%= assetVersion %>"></script>
<script>
// pohled (Přehled / Hudba / Texty / Karaoke), filtr a hledání (i bez háčků) – platí pro všechny pohledy najednou
(function () {
  var items = [].slice.call(document.querySelectorAll('.imgs-item')), view = 'list', filter = 'all';
  var q = document.getElementById('imgsQ'), empty = document.getElementById('imgsEmpty');
  function plain(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function fits(el, f) {
    return f === 'all' || (f === 'man' && el.dataset.man === '1') || (f === 'auto' && el.dataset.man === '0' && el.dataset.miss === '0')
      || (f === 'miss' && el.dataset.miss === '1');
  }
  var songs = items.filter(function (el) { return el.classList.contains('imgs-song'); });
  document.querySelectorAll('#imgsFilter [data-f]').forEach(function (b) {
    b.querySelector('b').textContent = songs.filter(function (el) { return fits(el, b.dataset.f); }).length;
  });
  function render() {
    var text = plain(q.value.trim()), shown = 0;
    document.querySelectorAll('.imgs-view').forEach(function (v) { v.hidden = v.dataset.v !== view; });
    items.forEach(function (el) {
      var ok = fits(el, filter) && plain(el.dataset.name).indexOf(text) >= 0;
      el.hidden = !ok;
      if (ok && el.closest('.imgs-view').dataset.v === view) shown++;
    });
    empty.hidden = shown > 0;
  }
  function bar(id, attr, set) {
    document.getElementById(id).addEventListener('click', function (e) {
      var b = e.target.closest('[' + attr + ']');
      if (!b) return;
      this.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      set(b.getAttribute(attr)); render();
    });
  }
  bar('imgsView', 'data-v', function (v) { view = v; });
  bar('imgsFilter', 'data-f', function (f) { filter = f; });
  q.addEventListener('input', render);
  render();
})();
</script>
<%@ include file="/includes/footer.jsp" %>
