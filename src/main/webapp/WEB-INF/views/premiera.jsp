<%@ include file="/includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="com.github.skeliit.model.Premiere, com.github.skeliit.WebUtils" %>
<%--
  Premiéra (/premiera, web/site/PremiereServlet): posledních 7 s naskakuje 7 smajlíků na tep srdce (zvuky z js/squad-egg.js),
  rámeček videa na každý úder zapulzuje, šepot SKELO SQUAD a start. Fotka ulice, okna se rozsvěcí s blížícím se startem a „Jsem tu“
  rozsvítí tvoje okno (a odemkne zvuk). V okamžiku premiéry se celá ulice rozsvítí a všem se pustí klip od stejné
  vteřiny; kdo přijde pozdě, naskočí do běžícího. Video ID tu není: js/premiera.js ho dostane z /api/premiere
  až po startu. Po premiéře zůstane stránka jako přehrání klipu.
--%>
<%
  Premiere pm = (Premiere) request.getAttribute("premiere");
  String pmName = WebUtils.escapeHtml(pm.name);
  String pmWhen = WebUtils.escapeHtml(t.getProperty("premiere.at").replace("{when}", pm.getWhen()));
%>
<link rel="stylesheet" href="/css/premiera.css?v=<%= assetVersion %>">
<main class="pm is-wait" data-song="<%= WebUtils.escapeHtml(pm.uuid) %>" data-at="<%= pm.at %>" data-now="<%= request.getAttribute("serverNow") %>"
      data-t-day="<%= WebUtils.escapeHtml(t.getProperty("premiere.d")) %>"
      data-t-soon="<%= WebUtils.escapeHtml(t.getProperty("pm.soonNow")) %>"
      data-t-left="<%= WebUtils.escapeHtml(t.getProperty("pm.left")) %>"
      data-t-copied="<%= WebUtils.escapeHtml(t.getProperty("pm.copied")) %>"
      data-t-start="<%= WebUtils.escapeHtml(t.getProperty("pm.start")) %>"
      data-t-yt="<%= WebUtils.escapeHtml(t.getProperty("pm.ytNote")) %>"
      data-t-busy="<%= WebUtils.escapeHtml(t.getProperty("pm.busy")) %>">
  <div class="pm-foto" aria-hidden="true">
    <img class="pm-ulice" src="/img/photos/street-md.webp" srcset="/img/photos/street-md.webp 1200w, /img/photos/street-lg.webp 1920w"
         sizes="(orientation: portrait) 150vh, max(100vw, 240vh)" alt="" width="1200" height="512" fetchpriority="high">
    <div class="pm-kour"></div>
    <span class="pm-tvoje"><%= WebUtils.escapeHtml(t.getProperty("pm.yourWindow")) %></span>
  </div>
  <div class="pm-prechod" aria-hidden="true"></div>

  <div class="pm-in">
    <div class="pm-hlavni">
      <span class="pm-stitek"><span class="pm-tecka" aria-hidden="true"></span><span class="pm-st-wait"><%= pmWhen %> <small><%= WebUtils.escapeHtml(t.getProperty("pm.tz")) %></small></span><span class="pm-st-live"><%= WebUtils.escapeHtml(t.getProperty("pm.live")) %></span></span>
      <h1 class="pm-nazev"><%= pmName %></h1>
      <div class="pm-odpocet" id="pmOdpocet" aria-live="off">--:--</div>
      <p class="pm-pod" id="pmPod"><%= WebUtils.escapeHtml(t.getProperty("pm.left")) %></p>
      <% String[] teaser = (String[]) request.getAttribute("teaser");
         if (teaser != null && !pm.isOut()) { %>
      <%-- upoutávka (short) do začátku premiéry: nakloněné okénko jako na úvodu, ťuknutí ho roztáhne a pustí v něm video (js/upoutavka.js) --%>
      <div class="pmf" role="button" tabindex="0" aria-expanded="false" data-teaser="<%= teaser[0] %>"
           data-close="<%= WebUtils.escapeHtml(t.getProperty("common.close")) %>" aria-label="<%= WebUtils.escapeHtml(t.getProperty("pm.teaserPlay")) %>">
        <img class="pmf-foto" src="<%= teaser[1] %>" alt="" width="640" height="360">
        <span class="pmf-play" aria-hidden="true"><i class="fa-solid fa-play"></i></span>
        <small class="pmf-stitek"><%= WebUtils.escapeHtml(t.getProperty("pm.teaser")) %></small>
      </div>
      <% } %>
    </div>

    <div class="pm-video" id="pmVideo" hidden>
      <div class="pm-tvare" id="pmTvare" aria-hidden="true"><% for (int fi = 1; fi <= 7; fi++) { %><img src="/img/faces/face-<%= fi %>.webp" alt="" width="44" height="44"><% } %></div>
      <div class="pm-video-in" id="pmVideoIn"><span class="pm-nacita"><%= WebUtils.escapeHtml(t.getProperty("pm.loading")) %></span></div>
    </div>
    <div class="pm-zvuk" id="pmZvuk" hidden>
      <button type="button" class="pm-btn" id="pmUnmute"><i class="fa-solid fa-volume-high" aria-hidden="true"></i> <%= WebUtils.escapeHtml(t.getProperty("pm.unmute")) %></button>
      <small><%= WebUtils.escapeHtml(t.getProperty("pm.tapVideo")) %></small>
    </div>
    <p class="pm-konec" id="pmKonec" hidden><%= WebUtils.escapeHtml(t.getProperty("pm.end")) %></p>
    <p class="pm-probehla" hidden id="pmProbehla"><%= WebUtils.escapeHtml(t.getProperty("pm.over").replace("{when}", pm.getWhen())) %></p>
    <% if (pm.isOut()) { %><a class="pm-btn" href="/?pmZnovu=1"><i class="fa-solid fa-rotate-right" aria-hidden="true"></i> <%= WebUtils.escapeHtml(t.getProperty("premiere.again")) %></a><% } %>

    <button type="button" class="pm-jsemtu" id="pmJsemTu" data-done="<%= WebUtils.escapeHtml(t.getProperty("pm.hereDone")) %>"><%= WebUtils.escapeHtml(t.getProperty("pm.here")) %></button>
    <p class="pm-spolu"><%= WebUtils.escapeHtml(t.getProperty("pm.together")) %></p>

    <div class="pm-odkazy">
      <a class="pm-btn pm-btn-ghost" href="<%= WebUtils.escapeHtml((String) request.getAttribute("songHref")) %>"><i class="fa-solid fa-align-left" aria-hidden="true"></i> <%= WebUtils.escapeHtml(t.getProperty("pm.lyrics")) %></a>
      <button type="button" class="pm-btn pm-btn-ghost" id="pmShare" data-title="<%= pmName %>" data-text="<%= WebUtils.escapeHtml(t.getProperty("pm.shareText").replace("{name}", pm.name).replace("{when}", pm.getWhen())) %>"><i class="fas fa-share-alt" aria-hidden="true"></i> <%= WebUtils.escapeHtml(t.getProperty("pm.share")) %></button>
    </div>
  </div>

  <div class="pm-zablesk" aria-hidden="true"></div>
</main>
<script src="/js/yt-clock.js?v=<%= assetVersion %>"></script>
<script src="/js/upoutavka.js?v=<%= assetVersion %>"></script>
<script src="/js/premiera.js?v=<%= assetVersion %>"></script>
<%@ include file="/includes/footer.jsp" %>
