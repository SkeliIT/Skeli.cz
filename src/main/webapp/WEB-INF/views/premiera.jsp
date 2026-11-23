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
<link rel="stylesheet" href="/css/karaoke-fonts.css?v=<%= assetVersion %>">
<% String pmBg = (String) request.getAttribute("pmBackground"); %>
<main class="pm is-wait<%= pmBg != null ? " klip" : "" %>" data-csrf="<%= com.github.skeliit.filter.CsrfFilter.token(session) %>" data-song="<%= WebUtils.escapeHtml(pm.uuid) %>" data-at="<%= pm.at %>" data-now="<%= request.getAttribute("serverNow") %>"
      data-t-day="<%= WebUtils.escapeHtml(t.getProperty("premiere.d")) %>"
      data-t-soon="<%= WebUtils.escapeHtml(t.getProperty("pm.soonNow")) %>"
      data-t-left="<%= WebUtils.escapeHtml(t.getProperty("pm.left")) %>"
      data-t-copied="<%= WebUtils.escapeHtml(t.getProperty("pm.copied")) %>"
      data-t-start="<%= WebUtils.escapeHtml(t.getProperty("pm.start")) %>"
      data-t-yt="<%= WebUtils.escapeHtml(t.getProperty("pm.ytNote")) %>"
      data-t-busy="<%= WebUtils.escapeHtml(t.getProperty("pm.busy")) %>">
  <%-- pozadí: rozmazaná úvodní fotka klipu (img/premiera/pozadi-<název>.webp, bez svítících oken), jinak fotka ulice s okny --%>
  <div class="pm-foto" aria-hidden="true">
    <% if (pmBg != null) { %>
    <img class="pm-ulice" src="<%= pmBg %>" alt="" width="1600" height="899" fetchpriority="high">
    <% } else { %>
    <img class="pm-ulice" src="/img/photos/street-md.webp" srcset="/img/photos/street-md.webp 1200w, /img/photos/street-lg.webp 1920w"
         sizes="(orientation: portrait) 150vh, max(100vw, 240vh)" alt="" width="1200" height="512" fetchpriority="high">
    <% } %>
    <div class="pm-kour"></div>
    <span class="pm-tvoje"><%= WebUtils.escapeHtml(t.getProperty("pm.yourWindow")) %></span>
  </div>
  <div class="pm-prechod" aria-hidden="true"></div>

  <div class="pm-in">
    <div class="pm-hlavni">
      <span class="pm-stitek"><span class="pm-tecka" aria-hidden="true"></span><span class="pm-st-wait"><%= pmWhen %></span><span class="pm-st-live"><%= WebUtils.escapeHtml(t.getProperty("pm.live")) %></span></span>
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

    <%-- KINOSÁL (js/premiera-sal.js, styl na konci css/premiera.css): otevřený pořád, vejde se tlačítkem Vstoupit do sálu,
         30 min před premiérou se otevře všem sám. Sedadla se plní podle počtu lidí v sále (/api/premiere/live), smajlíci,
         chat = komentáře klipu (čistý text). V čas premiéry se klip (#pmVideo, sem ho přesune skript) pustí přes jeviště. --%>
    <% Integer pmUid = session != null ? (Integer) session.getAttribute("userId") : null; %>
    <section class="pm-sal" id="pmSal" hidden aria-label="<%= WebUtils.escapeHtml(t.getProperty("pm.hall")) %>"
             data-t-lidi="<%= WebUtils.escapeHtml(t.getProperty("pm.inHall")) %>"
             data-t-live="<%= WebUtils.escapeHtml(t.getProperty("pm.live")) %>"
             data-t-empty="<%= WebUtils.escapeHtml(t.getProperty("pm.chatEmpty")) %>"
             data-t-login="<%= WebUtils.escapeHtml(t.getProperty("pm.chatLogin")) %>"
             data-t-verify="<%= WebUtils.escapeHtml(t.getProperty("pm.chatVerify")) %>"
             data-t-slow="<%= WebUtils.escapeHtml(t.getProperty("pm.chatSlow")) %>"
             data-t-link="<%= WebUtils.escapeHtml(t.getProperty("pm.chatLink")) %>"
             data-t-long="<%= WebUtils.escapeHtml(t.getProperty("pm.chatLong")) %>"
             data-t-off="<%= WebUtils.escapeHtml(t.getProperty("pm.chatOff")) %>"
             data-t-err="<%= WebUtils.escapeHtml(t.getProperty("pm.chatErr")) %>"
             data-t-deleted="<%= WebUtils.escapeHtml(t.getProperty("account.deleted")) %>"
             data-t-more="<%= WebUtils.escapeHtml(t.getProperty("pm.more")) %>"
             data-t-delete="<%= WebUtils.escapeHtml(t.getProperty("common.delete")) %>"
             data-t-report="<%= WebUtils.escapeHtml(t.getProperty("comment.report")) %>"
             data-t-report-q="<%= WebUtils.escapeHtml(t.getProperty("comment.reportConfirm")) %>"
             data-t-reported="<%= WebUtils.escapeHtml(t.getProperty("flash.reported")) %>"
             data-t-pin="<%= WebUtils.escapeHtml(t.getProperty("cmt.pin")) %>"
             data-t-unpin="<%= WebUtils.escapeHtml(t.getProperty("cmt.unpin")) %>"
             data-t-react="<%= WebUtils.escapeHtml(t.getProperty("pm.react")) %>">
      <div class="pm-sal-roz">
        <div class="pm-sal-hl">
          <div class="pm-jeviste" id="pmJeviste">
            <div class="pm-scena" id="pmScena">
              <img class="pm-sal-img" src="/img/premiera/kino/sal.webp" alt="" width="1672" height="941" decoding="async">
              <div class="pm-platno<%= teaser != null && !pm.isOut() ? " ma-short" : "" %>" id="pmPlatno"<% if (teaser != null && !pm.isOut()) { %> role="button" tabindex="0" aria-label="<%= WebUtils.escapeHtml(t.getProperty("pm.teaserPlay")) %>" data-short="<%= teaser[0] %>"<% } %>>
                <div class="pm-pl-text">
                  <div class="pm-pl-napis"><%= pmName %></div>
                  <div class="pm-pl-kdy"><%= WebUtils.escapeHtml(t.getProperty("pm.title")) %> · <%= WebUtils.escapeHtml(pm.getWhen()) %></div>
                  <div class="pm-pl-odpocet" id="pmSalOdpocet">--:--</div>
                  <div class="pm-pl-lidi" id="pmSalLidi"></div>
                  <% if (teaser != null && !pm.isOut()) { %><div class="pm-pl-tip"><i class="fa-solid fa-play" aria-hidden="true"></i> <%= WebUtils.escapeHtml(t.getProperty("pm.teaser")) %></div><% } %>
                </div>
                <div class="pm-pl-finale" aria-hidden="true">
                  <div class="pm-pl-tvare" id="pmSalTvare"><% for (int fi = 1; fi <= 7; fi++) { %><img src="/img/faces/face-<%= fi %>.webp" alt="" width="44" height="44"><% } %></div>
                  <div class="pm-pl-logo"></div>
                </div>
              </div>
              <div class="pm-divaci" id="pmDivaci"></div>
              <div class="pm-tma"></div>
            </div>
            <div class="pm-reakce" id="pmReakce" aria-hidden="true"></div>
            <button type="button" class="pm-celo" id="pmCelo" aria-label="<%= WebUtils.escapeHtml(t.getProperty("pm.full")) %>" title="<%= WebUtils.escapeHtml(t.getProperty("pm.full")) %>"><i class="fa-solid fa-expand" aria-hidden="true"></i></button>
          </div>
          <div class="pm-lista" id="pmLista"></div>
        </div>
        <aside class="pm-chat"><div class="pm-chat-in">
          <h2 class="pm-chat-h"><span><i class="fa-solid fa-comments" aria-hidden="true"></i> <%= WebUtils.escapeHtml(t.getProperty("pm.chat")) %></span><span id="pmChatLidi"></span></h2>
          <% if (pmUid != null) { %>
          <form class="pm-psani" id="pmPsani">
            <input type="text" maxlength="200" autocomplete="off" enterkeyhint="send" placeholder="<%= WebUtils.escapeHtml(t.getProperty("pm.chatPh")) %>" aria-label="<%= WebUtils.escapeHtml(t.getProperty("pm.chatPh")) %>">
            <button type="submit"><%= WebUtils.escapeHtml(t.getProperty("common.send")) %></button>
          </form>
          <% } else { %>
          <a class="pm-psani pm-prihlas" href="/login.jsp?next=/premiera"><i class="fa-solid fa-right-to-bracket" aria-hidden="true"></i> <%= WebUtils.escapeHtml(t.getProperty("pm.chatLogin")) %></a>
          <% } %>
          <p class="pm-chat-info" id="pmChatInfo" role="status" hidden></p>
          <div class="pm-pripnuto" id="pmPripnuto" hidden></div>
          <div class="pm-zpravy" id="pmZpravy"></div>
        </div></aside>
      </div>
    </section>

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
<script src="/js/premiera-sal.js?v=<%= assetVersion %>"></script>
<%@ include file="/includes/footer.jsp" %>
