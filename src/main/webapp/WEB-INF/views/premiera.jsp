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
<main class="pm is-wait<%= pmBg != null ? " klip" : "" %>" data-csrf="<%= com.github.skeliit.filter.CsrfFilter.token(session) %>" data-song="<%= WebUtils.escapeHtml(pm.uuid) %>"<% if ("sim".equals(pm.uuid)) { %> data-sim-yt="LJ7ER355Hgg"<% } %> data-at="<%= pm.at %>" data-now="<%= request.getAttribute("serverNow") %>"
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
             data-t-react="<%= WebUtils.escapeHtml(t.getProperty("pm.react")) %>"
             data-t-quiz="<%= WebUtils.escapeHtml(t.getProperty("pm.quiz")) %>"
             data-t-quiz-tap="<%= WebUtils.escapeHtml(t.getProperty("pm.quizTap")) %>"
             data-t-quiz-voted="<%= WebUtils.escapeHtml(t.getProperty("pm.quizVoted")) %>"
             data-t-quiz-closed="<%= WebUtils.escapeHtml(t.getProperty("pm.quizClosed")) %>"
             data-t-quiz-hit="<%= WebUtils.escapeHtml(t.getProperty("pm.quizHit")) %>"
             data-t-quiz-none="<%= WebUtils.escapeHtml(t.getProperty("pm.quizNone")) %>"
             data-t-moods="<%= WebUtils.escapeHtml(t.getProperty("pm.moods")) %>" data-t-wave-hint="<%= WebUtils.escapeHtml(t.getProperty("pm.waveHint")) %>"
             data-t-react-emoji="<%= WebUtils.escapeHtml(t.getProperty("pm.reactEmoji")) %>"
             data-t-wave-count="<%= WebUtils.escapeHtml(t.getProperty("pm.waveCount")) %>"
             data-t-wave="<%= WebUtils.escapeHtml(t.getProperty("pm.wave")) %>"
             data-t-prog="<%= WebUtils.escapeHtml(t.getProperty("pm.prog")) %>"
             data-t-mood-text="<%= WebUtils.escapeHtml(t.getProperty("pm.moodText")) %>"
             data-t-mood-none="<%= WebUtils.escapeHtml(t.getProperty("pm.moodNone")) %>"
             data-t-bigger="<%= WebUtils.escapeHtml(t.getProperty("pm.bigger")) %>"
             data-t-smaller="<%= WebUtils.escapeHtml(t.getProperty("pm.smaller")) %>"
             data-t-quiz-first="<%= WebUtils.escapeHtml(t.getProperty("pm.quizFirst")) %>"
             data-t-quiz-next="<%= WebUtils.escapeHtml(t.getProperty("pm.quizNext")) %>"
             data-t-sound-on="<%= WebUtils.escapeHtml(t.getProperty("pm.soundOn")) %>"
             data-t-sound-off="<%= WebUtils.escapeHtml(t.getProperty("pm.soundOff")) %>">
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
                <div class="pm-kviz" id="pmKviz" aria-live="polite"></div>
                <div class="pm-pl-finale" aria-hidden="true">
                  <div class="pm-pl-tvare" id="pmSalTvare"><% for (int fi = 1; fi <= 7; fi++) { %><span class="pm-tvar pm-tvar-f<%= fi %>"></span><% } %></div>
                  <div class="pm-pl-logo"></div>
                </div>
              </div>
              <div class="pm-divaci" id="pmDivaci"></div>
              <%-- Kevinova poznámka k výsledku kvízu: pod plátnem nad hlavami diváků, nikdy přes otázku ani odpočet --%>
              <div class="pm-kviz-kevin" id="pmKvizKevin" hidden><i class="fa-solid fa-paw" aria-hidden="true"></i> <span></span></div>
              <div class="pm-tma"></div>
            </div>
            <div class="pm-reakce" id="pmReakce" aria-hidden="true"></div>
            <%-- smajlíci: svítící tlačítko v rohu sálu (i na celé obrazovce), okénko s obličeji SQUADu a smajlíky; kroužek = potlesk do vlny --%>
            <div class="pm-reakce-roh">
              <button type="button" class="pm-spoust" id="pmSpoust" aria-expanded="false" aria-controls="pmPop" aria-label="<%= WebUtils.escapeHtml(t.getProperty("pm.react")) %>"><span class="pm-tvar pm-tvar-f7" aria-hidden="true"></span></button>
              <div class="pm-pop" id="pmPop" hidden>
                <h4 class="pm-pop-tvare">SKELO SQUAD</h4><div class="pm-pop-rada pm-pop-rada-t"></div>
                <h4 class="pm-pop-emoji"><%= WebUtils.escapeHtml(t.getProperty("pm.reactEmoji")) %></h4><div class="pm-pop-rada pm-pop-rada-e"></div>
                <p class="pm-pop-vlna" id="pmPopVlna" hidden><%= WebUtils.escapeHtml(t.getProperty("pm.waveHint")) %></p>
                <%-- zvuky ťuknutí zvlášť (Skeli 25. 11.: někoho můžou otravovat, ale hudbu a sál chce slyšet) – js/premiera-sal.js --%>
                <button type="button" class="pm-pop-zvuk" id="pmPopZvuk" aria-pressed="true" data-on="<%= WebUtils.escapeHtml(t.getProperty("pm.reactSoundOn")) %>"
                        data-off="<%= WebUtils.escapeHtml(t.getProperty("pm.reactSoundOff")) %>"><i class="fa-solid fa-volume-high" aria-hidden="true"></i><span></span></button>
              </div>
            </div>
            <div class="pm-hlaska" id="pmHlaska" aria-live="polite"></div>
            <%-- chat na celé obrazovce: vždy vpravo, přepínač Celý / Malý (roh vpravo dole) / Vyp; chat se sem při celé obrazovce přesune (js) --%>
            <div class="pm-fs-prepinac" id="pmFsPrepinac" role="group" aria-label="<%= WebUtils.escapeHtml(t.getProperty("pm.fsChat")) %>">
              <button type="button" data-rezim="cely"><i class="fa-solid fa-comments" aria-hidden="true"></i> <%= WebUtils.escapeHtml(t.getProperty("pm.fsFull")) %></button>
              <button type="button" data-rezim="maly"><%= WebUtils.escapeHtml(t.getProperty("pm.fsSmall")) %></button>
              <button type="button" data-rezim="vyp"><%= WebUtils.escapeHtml(t.getProperty("pm.fsOff")) %><span class="pm-fs-nove" id="pmFsNove"></span></button>
            </div>
            <%-- chat přes sál (PC): ve finále a při klipu zmizí z obrazu, tímhle se vrátí (js/premiera-sal.js) --%>
            <button type="button" class="pm-chat-tl" id="pmChatTl" aria-pressed="false"><i class="fa-solid fa-comments" aria-hidden="true"></i> <%= WebUtils.escapeHtml(t.getProperty("pm.chat")) %><span class="pm-fs-nove" id="pmChatNove"></span></button>
            <button type="button" class="pm-celo" id="pmCelo" aria-label="<%= WebUtils.escapeHtml(t.getProperty("pm.full")) %>" title="<%= WebUtils.escapeHtml(t.getProperty("pm.full")) %>"><i class="fa-solid fa-expand" aria-hidden="true"></i></button>
            <%-- zvuk sálu (js/premiera-zvuky.js): zapnout / vypnout, stejný vypínač jako zvuky webu --%>
            <button type="button" class="pm-zvuk-sal" id="pmZvukSal"><i class="fa-solid fa-volume-high" aria-hidden="true"></i></button>
          </div>
          <div class="pm-kviz-bar" id="pmKvizBar" hidden></div>
          <%-- pod sálem, nenápadně (Skeli 25. 11.: ať nejsou v obraze): celá obrazovka a (jen PC) Menší / Větší sál – text dá js.
               V sále zůstává jen zvuk (hned vidět, že je vypnutý) a na celé obrazovce ⛶ k návratu. --%>
          <div class="pm-nastroje">
            <button type="button" id="pmKdoZmen"><i class="fa-solid fa-user" aria-hidden="true"></i> <%= WebUtils.escapeHtml(t.getProperty("pm.whoChange")) %></button>
            <button type="button" id="pmCeloVen"><i class="fa-solid fa-expand" aria-hidden="true"></i> <%= WebUtils.escapeHtml(t.getProperty("pm.full")) %></button>
            <button type="button" class="pm-velky" id="pmVelky"></button>
          </div>
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
          <%-- zprávy z chatu jsou komentáře pod klipem – ať to každý ví dřív, než napíše něco osobního (audit 25. 11.) --%>
          <p class="pm-chat-verejne"><span aria-hidden="true">ⓘ</span> <%= WebUtils.escapeHtml(t.getProperty("pm.chatPublic")) %></p>
          <p class="pm-chat-info" id="pmChatInfo" role="status" hidden></p>
          <div class="pm-pripnuto" id="pmPripnuto" hidden></div>
          <div class="pm-zpravy" id="pmZpravy"></div>
        </div></aside>
      </div>
      <%-- pod sálem: program večera (časy podle začátku premiéry, js) a náladoměr (jen během 30 min odpočtu) --%>
      <div class="pm-pod">
        <div class="pm-karta pm-program"><h3><%= WebUtils.escapeHtml(t.getProperty("pm.progTitle")) %></h3>
          <ol class="pm-prog" id="pmProgram" data-nazev="<%= pmName %>"></ol></div>
        <div class="pm-karta pm-nalada" id="pmNalada" hidden><h3><%= WebUtils.escapeHtml(t.getProperty("pm.moodTitle")) %></h3>
          <p class="pm-nal-text" id="pmNalText"></p><div class="pm-nalady" id="pmNalady"></div></div>
      </div>
    </section>
    <%-- kontakty na pomoc (audit 25. 11.; větu s upozorněním na obsah Skeli nechtěl): na stránce vždy – před premiérou, při ní i jako záznam --%>
    <aside class="pm-pomoc" aria-labelledby="pmPomocNadpis">
      <h2 class="pm-pomoc-h" id="pmPomocNadpis"><%= WebUtils.escapeHtml(t.getProperty("pm.helpTitle")) %></h2>
      <p class="pm-pomoc-uvod"><%= WebUtils.escapeHtml(t.getProperty("pm.helpIntro")) %></p>
      <ul class="pm-pomoc-linky">
        <% String[][] pmLinky = {{"116006", "116 006", "1"}, {"158", "158", "2"}, {"116111", "116 111", "3"}};
           for (String[] l : pmLinky) { %>
        <li><a href="tel:<%= l[0] %>"><%= l[1] %></a><span class="pm-pomoc-t"><b><%= WebUtils.escapeHtml(t.getProperty("pm.help" + l[2])) %></b>
          <small><%= WebUtils.escapeHtml(t.getProperty("pm.help" + l[2] + "d")) %></small></span></li>
        <% } %>
      </ul>
      <p class="pm-pomoc-cz"><%= WebUtils.escapeHtml(t.getProperty("pm.helpCz")) %></p>
    </aside>

    <div class="pm-video" id="pmVideo" hidden>
      <div class="pm-tvare" id="pmTvare" aria-hidden="true"><% for (int fi = 1; fi <= 7; fi++) { %><img src="/img/faces/face-<%= fi %>.webp" alt="" width="44" height="44"><% } %></div>
      <div class="pm-video-in" id="pmVideoIn"><span class="pm-nacita"><%= WebUtils.escapeHtml(t.getProperty("pm.loading")) %></span></div>
    </div>
    <div class="pm-zvuk" id="pmZvuk" hidden>
      <button type="button" class="pm-btn" id="pmUnmute"><i class="fa-solid fa-volume-high" aria-hidden="true"></i> <%= WebUtils.escapeHtml(t.getProperty("pm.unmute")) %></button>
      <small><%= WebUtils.escapeHtml(t.getProperty("pm.tapVideo")) %></small>
    </div>
    <p class="pm-konec" id="pmKonec" hidden><%= WebUtils.escapeHtml(t.getProperty("pm.end")) %></p>
    <%-- záloha: až server vydá video (v čas premiéry), odkaz na YouTube pro ty, komu vložený přehrávač nejde (js/premiera.js) --%>
    <p class="pm-yt-odkaz" id="pmYtOdkaz" hidden><a target="_blank" rel="noopener"><i class="fab fa-youtube" aria-hidden="true"></i> <%= WebUtils.escapeHtml(t.getProperty("pm.ytOpen")) %></a></p>
    <p class="pm-probehla" hidden id="pmProbehla"><%= WebUtils.escapeHtml(t.getProperty("pm.over").replace("{when}", pm.getWhen())) %></p>

    <%-- kdo si sedne do sálu (js/premiera-sal.js): volba zůstává jen v prohlížeči --%>
    <dialog class="pm-kdo" id="pmKdo" aria-labelledby="pmKdoH">
      <h2 id="pmKdoH"><%= WebUtils.escapeHtml(t.getProperty("pm.whoTitle")) %></h2>
      <p><%= WebUtils.escapeHtml(t.getProperty("pm.whoText")) %></p>
      <div class="pm-kdo-volby">
        <% String[][] pmKdo = {{"muz", "4", "pm.whoMan"}, {"zena", "3", "pm.whoWoman"}, {"nic", "6", "pm.whoNone"}};
           for (String[] k : pmKdo) { %>
        <button type="button" data-postava="<%= k[0] %>" aria-pressed="false"><img src="/img/premiera/kino/divak-<%= k[1] %>.webp?v=2" alt="" width="181" height="270" loading="lazy" decoding="async"><span><%= WebUtils.escapeHtml(t.getProperty(k[2])) %></span></button>
        <% } %>
      </div>
    </dialog>
    <button type="button" class="pm-jsemtu" id="pmJsemTu" data-done="<%= WebUtils.escapeHtml(t.getProperty("pm.hereDone")) %>"><%= WebUtils.escapeHtml(t.getProperty("pm.here")) %></button>
    <p class="pm-spolu"><%= WebUtils.escapeHtml(t.getProperty("pm.together")) %></p>
    <%-- nepřihlášeným: v sále se dá psát do chatu jen s účtem – rovnou nabídnout přihlášení / registraci --%>
    <% if (pmUid == null) { %><p class="pm-prihlaseni"><i class="fa-solid fa-comments" aria-hidden="true"></i> <%= WebUtils.escapeHtml(t.getProperty("pm.loginHint")) %> <a href="/login.jsp?next=/premiera"><%= WebUtils.escapeHtml(t.getProperty("btn.login")) %></a> · <a href="/register.jsp"><%= WebUtils.escapeHtml(t.getProperty("btn.register")) %></a></p><% } %>

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
<script src="/js/premiera-zvuky.js?v=<%= assetVersion %>"></script>
<script src="/js/premiera-sal.js?v=<%= assetVersion %>"></script>
<%@ include file="/includes/footer.jsp" %>
