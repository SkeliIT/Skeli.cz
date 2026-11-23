<!DOCTYPE html>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%
  String ctx = request.getContextPath();
  if (ctx == null) {
    ctx = "";
  }
%>
<%@ include file="/includes/version.jspf" %>
<%@ include file="/WEB-INF/i18n/i18n.jspf" %>
  <html lang="<%= cur %>">

  <head>
    <meta charset="utf-8" />
    <%-- lehký režim pro slabé telefony (css/effects.css, js/effects.js): rozhodne se dřív, než se stránka vykreslí.
         Slabý = telefon s nejvýš 2 GB paměti, zapnuté šetření dat, nebo mu web při měření nestíhal (fxAuto = kdy, platí 7 dní,
         pak se měří znovu). fxLow = 0 ho vypne, fxLow = on zapne natrvalo. Dřívější fxLow = 1 zapisoval web sám natrvalo
         i telefonům, které jen jednou chvíli nestíhaly – už se nebere. Lehký režim šetří jen to drahé, vzhled zůstává. --%>
    <script>try { (function () { var n = navigator, c = n.connection, m = n.deviceMemory, s = localStorage.getItem('fxLow'), a = +localStorage.getItem('fxAuto') || 0;
      if (s !== '0' && (s === 'on' || Date.now() - a < 7 * 864e5 || sessionStorage.getItem('fxLowNow') === '1' || (c && c.saveData) || (m && m <= 2 && matchMedia('(pointer: coarse)').matches))) document.documentElement.classList.add('low-fx');
    })(); } catch (e) { /* bez úložiště běží web normálně */ }</script>
    <meta name="viewport" content="width=device-width, viewport-fit=cover">
<%
  // Per-page <title>/description. A servlet may set "pageTitle"/"pageDescription"
  // (the lyric page does); otherwise the title comes from the page's menu/heading key.
  String headTitle = (String) request.getAttribute("pageTitle");
  if (headTitle == null) {
    java.util.Map<String, String> titleKeys = java.util.Map.ofEntries(
        java.util.Map.entry("/texty.jsp", "menu.lyrics"),
        java.util.Map.entry("/music.jsp", "menu.music"),
        java.util.Map.entry("/about.jsp", "about.title"),
        java.util.Map.entry("/aktuality.jsp", "menu.news"),
        java.util.Map.entry("/donate.jsp", "donate.title"),
        java.util.Map.entry("/login.jsp", "auth.login.heading"),
        java.util.Map.entry("/register.jsp", "auth.register.heading"),
        java.util.Map.entry("/forgot.jsp", "forgot.heading"),
        java.util.Map.entry("/reset.jsp", "reset.heading"),
        java.util.Map.entry("/uzivatel.jsp", "menu.account"),
        java.util.Map.entry("/nastaveni.jsp", "menu.settings"),
        java.util.Map.entry("/privacy.jsp", "privacy.heading"),
        java.util.Map.entry("/terms.jsp", "terms.heading"),
        java.util.Map.entry("/error.jsp", "error.heading"));
    String titleKey = titleKeys.get(request.getServletPath());
    if (titleKey != null) headTitle = t.getProperty(titleKey);
  }
  String headFullTitle = headTitle == null ? t.getProperty("meta.title") : headTitle + " | Skeli";
  String headDesc = (String) request.getAttribute("pageDescription");
  if (headDesc == null) headDesc = t.getProperty("meta.description");
  // Absolute URLs for search engines and link previews (never taken from the Host header)
  String siteBase = com.github.skeliit.WebUtils.baseUrl();
  String canonicalPath = (String) request.getAttribute("canonicalPath");
  Object fwdUri = request.getAttribute("jakarta.servlet.forward.request_uri");
  String headUrl = siteBase + (canonicalPath != null
      ? canonicalPath
      : (fwdUri != null ? fwdUri : request.getRequestURI()));
  // the translated public pages (sitemap list): canonical = this language's address, alternates = all five
  String headPublicPage = canonicalPath == null
      ? com.github.skeliit.web.site.SeoServlet.publicPage(String.valueOf(fwdUri != null ? fwdUri : request.getRequestURI())) : null;
  if (headPublicPage != null) headUrl = siteBase + com.github.skeliit.web.site.SeoServlet.langUrl(headPublicPage, cur);
  // error pages (404/500) must not end up in search results
  boolean headIsError = request.getAttribute("jakarta.servlet.error.status_code") != null || request.getAttribute("pageNoIndex") != null;   // (i profily hráčů)
  // link preview image/type: a page may set its own (a lyric page uses its video thumbnail)
  String headImage = (String) request.getAttribute("pageImage");
  String headType = request.getAttribute("pageType") != null ? (String) request.getAttribute("pageType") : "website";
%>
    <title><%= com.github.skeliit.WebUtils.escapeHtml(headFullTitle) %></title>
    <meta name="description" content="<%= com.github.skeliit.WebUtils.escapeHtml(headDesc) %>" />
    <meta name="author" content="Skeli" />
    <% if (headIsError) { %><meta name="robots" content="noindex" /><% } else { %><link rel="canonical" href="<%= com.github.skeliit.WebUtils.escapeHtml(headUrl) %>" /><% } %>
    <%
      @SuppressWarnings("unchecked")
      java.util.Map<String, String> hreflang = (java.util.Map<String, String>) request.getAttribute("hreflang");
      if (hreflang == null && headPublicPage != null && !headIsError) {
        hreflang = new java.util.LinkedHashMap<>();
        for (String l : com.github.skeliit.web.site.SeoServlet.LANGS) hreflang.put(l, com.github.skeliit.web.site.SeoServlet.langUrl(headPublicPage, l));
      }
      if (hreflang != null) {
        for (java.util.Map.Entry<String, String> e : hreflang.entrySet()) {
          String href = siteBase + e.getValue();
    %>
    <link rel="alternate" hreflang="<%= com.github.skeliit.WebUtils.escapeHtml(e.getKey()) %>" href="<%= com.github.skeliit.WebUtils.escapeHtml(href) %>" />
    <%
        }
        if (hreflang.containsKey("cs")) {
    %>
    <link rel="alternate" hreflang="x-default" href="<%= com.github.skeliit.WebUtils.escapeHtml(siteBase + hreflang.get("cs")) %>" />
    <%
        }
      }
    %>
    <%
      // RSS/Atom autodiscovery: nejdřív feed stránky (má-li ho), pak souhrnný
      String feedKind = (String) request.getAttribute("feedKind");
      if (feedKind == null) {
        if ("music.song".equals(headType)) {
          feedKind = "songs";
        } else {
          feedKind = java.util.Map.of(
              "/texty.jsp", "songs",
              "/music.jsp", "videos",
              "/aktuality.jsp", "news").getOrDefault(String.valueOf(fwdUri != null ? fwdUri : request.getRequestURI()), "all");
        }
      }
      java.util.List<String> feedKinds = "all".equals(feedKind) ? java.util.List.of("all") : java.util.List.of(feedKind, "all");
      for (String fk : feedKinds) {
        String feedTitle = com.github.skeliit.WebUtils.escapeHtml(t.getProperty("feed.title." + fk, "Skeli"));
        String feedBase = siteBase + "/" + cur + "/feed/" + fk;
    %>
    <link rel="alternate" type="application/rss+xml" title="<%= feedTitle %> (RSS)" href="<%= com.github.skeliit.WebUtils.escapeHtml(feedBase) %>.rss" />
    <link rel="alternate" type="application/atom+xml" title="<%= feedTitle %> (Atom)" href="<%= com.github.skeliit.WebUtils.escapeHtml(feedBase) %>.atom" />
    <%
      }
    %>
    <meta property="og:site_name" content="Skeli" />
    <meta property="og:title" content="<%= com.github.skeliit.WebUtils.escapeHtml(headFullTitle) %>" />
    <meta property="og:description" content="<%= com.github.skeliit.WebUtils.escapeHtml(headDesc) %>" />
    <meta property="og:type" content="<%= com.github.skeliit.WebUtils.escapeHtml(headType) %>" />
    <meta property="og:url" content="<%= com.github.skeliit.WebUtils.escapeHtml(headUrl) %>" />
    <% if (headImage != null) { %>
    <meta property="og:image" content="<%= com.github.skeliit.WebUtils.escapeHtml(headImage) %>" />
    <meta property="og:image:width" content="1280" />
    <meta property="og:image:height" content="720" />
    <% } else { %>
    <meta property="og:image" content="<%= siteBase %>/img/og-image.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <% } %>
    <meta property="og:image:alt" content="<%= com.github.skeliit.WebUtils.escapeHtml(headFullTitle) %>" />
    <meta property="og:locale" content="<%= t.getProperty("meta.locale", "cs-CZ").replace('-', '_') %>" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="<%= ctx %>/favicon.ico" sizes="48x48" />
    <link rel="icon" href="<%= ctx %>/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="<%= ctx %>/apple-touch-icon.png" />
    <meta name="theme-color" content="#09090b" />
    <%-- icons and fonts from our own server: no visitor IP goes to Google or a CDN (privacy) --%>
    <link rel="stylesheet" href="<%= ctx %>/vendor/fontawesome/css/all.min.css">
    <link rel="stylesheet" href="<%= ctx %>/fonts/fonts.css?v=<%= assetVersion %>">
    <!-- Skeli.cz CSS -->
    <link rel="stylesheet" href="<%= ctx %>/css/base.css?v=<%= assetVersion %>">
    <link rel="stylesheet" href="<%= ctx %>/css/components.css?v=<%= assetVersion %>">
    <link rel="stylesheet" href="<%= ctx %>/css/pages.css?v=<%= assetVersion %>">
    <link rel="stylesheet" href="<%= ctx %>/css/comments.css?v=<%= assetVersion %>">
    <% if (String.valueOf(fwdUri != null ? fwdUri : request.getRequestURI()).startsWith(ctx + "/admin")) { %><link rel="stylesheet" href="<%= ctx %>/css/admin.css?v=<%= assetVersion %>"><% } %>
    <link rel="stylesheet" href="<%= ctx %>/css/effects.css?v=<%= assetVersion %>">
    <%-- structured data for search engines: Skeli as a musician, the site, a song (SeoJsonLd) --%>
    <% String headLd = headIsError ? null : com.github.skeliit.service.SeoJsonLd.forPage(siteBase, headUrl, headPublicPage, headType,
           "music.song".equals(headType) ? headTitle : null, headImage, cur, t.getProperty("menu.home"), t.getProperty("menu.lyrics"));
       if (headLd != null) { %><script type="application/ld+json"><%= headLd %></script><% } %>
  </head>
  <%-- v adminu (is-admin): klidné pozadí bez fotek, bez veřejné patičky (css/admin.css) --%>
  <%-- data-unverified: přihlášený s neověřeným e-mailem (Kevin mu jednou řekne proč nejdou komentáře) --%>
  <%-- data-pong-anon: přihlášený, který má jméno v tabulkách CatSmash skryté (Kevin mu jednou nabídne, kde si ho zapne;
       hra to připomene v tabulce). Zjistí se jednou za přihlášení a drží v relaci, Nastavení ho po uložení přepíše. --%>
  <% boolean pongAnon = false;
     Object pongUid = session.getAttribute("userId");
     if (pongUid instanceof Integer) {
       Object pongPub = session.getAttribute("pongPublic");
       if (!(pongPub instanceof Boolean)) {
         try { pongPub = new com.github.skeliit.dao.UserDao().pongPublic((Integer) pongUid); session.setAttribute("pongPublic", pongPub); }
         catch (java.sql.SQLException ex) { pongPub = Boolean.TRUE; }   // bez databáze raději nic neříkat
       }
       pongAnon = !Boolean.TRUE.equals(pongPub);
     } %>
  <body<%= String.valueOf(fwdUri != null ? fwdUri : request.getRequestURI()).startsWith(ctx + "/admin") ? " class=\"is-admin\"" : "" %><%= session.getAttribute("username") != null && !com.github.skeliit.web.auth.EmailVerification.isVerified(session) ? " data-unverified" : "" %><%= pongAnon ? " data-pong-anon" : "" %>>
    <%-- na stránce písně vede přepínač rovnou na adresu písně v daném jazyce (/en/song/…), jinak by
         adresa /cs/song/… nechala text česky; jinde jen ?lang= --%>
    <% @SuppressWarnings("unchecked") java.util.Map<String, String> songLangs = (java.util.Map<String, String>) request.getAttribute("hreflang");
       java.util.function.Function<String, String> langHref = l -> songLangs != null && songLangs.containsKey(l)
           ? com.github.skeliit.WebUtils.escapeHtml(songLangs.get(l)) + "?lang=" + l : "?lang=" + l; %>
    <%-- keyboard and screen reader users jump over the header straight to the page (footer.jsp moves the focus) --%>
    <a class="skip-link" href="#main"><%= t.getProperty("a11y.skip") %></a>
    <%-- the background of every page slowly cross-fades through Skeli's photos and back to the usual one;
         night shots in the dark theme, daylight ones in the light theme (js/effects.js). It is outside
         <main>, so it keeps running while pages change. name:position[:wide] – "wide" = a 16:9 version
         of a portrait photo for landscape screens --%>
    <div class="bg-slides" aria-hidden="true"
         data-dark="skull:center:wide,mic:45% 30%,square:center 55%,walker:54% 30%"
         data-light="field:center:wide,point:center 35%"></div>
    <%-- the slow "breathing" of the background goes on where the last page left it --%>
    <script>try { var bgAt = +sessionStorage.getItem('bgEpoch') || Date.now(); sessionStorage.setItem('bgEpoch', bgAt);
      document.documentElement.style.setProperty('--breathe-at', (-((Date.now() - bgAt) / 1000 % 60)).toFixed(2) + 's'); } catch (e) {}</script>
      <% request.setAttribute("csrf", com.github.skeliit.filter.CsrfFilter.token(session)); %>
      <% String currentUser = (String) session.getAttribute("username");
         String currentRole = (String) session.getAttribute("role");
         String headerAvatar = currentUser == null ? null : com.github.skeliit.WebUtils.safeUrl((String) session.getAttribute("avatar_url"), null); %>
        <%-- desktop: the big sign sits centred above the menu and scrolls away; the bar
             below it sticks and shows the small sign on its left once docked --%>
        <div class="masthead" id="masthead">
          <a href="<%= ctx %>/index.jsp" class="masthead-brand"><span class="squad-mark" aria-hidden="true"></span><span class="sr-only">SKELOSQUAD</span></a>
        </div>
        <header class="site-header" id="siteHeader">
          <div class="header-inner">
            <a href="<%= ctx %>/index.jsp" class="brand"><span class="squad-mark" aria-hidden="true"></span><span class="sr-only">SKELOSQUAD</span></a>

            <%-- Menu (listopad 2026, podle schváleného náhledu Skeli.cz-podklady/navrhy/menu-2026-11):
                 počítač (od 1025 px) = kapsle pod logem, skupiny se rozbalí nabídkou;
                 telefon (do 767 px) = menu přes celou obrazovku, tablet (768–1024 px) = panel zprava.
                 Na telefonu a tabletu: řádky s ikonou, skupiny se rozbalují pod sebou, dole účet, ovládání a odhlášení.
                 Zprávy tu nejsou (bublina chatu je na každé stránce), Kevin má tlapku v liště.
                 Shop a další připravované věci se v menu neukazují, dokud nejsou hotové. --%>
            <div class="nav-shade" data-menu-close aria-hidden="true"></div>
            <nav id="mainNav" class="main-nav" aria-label="<%= t.getProperty("footer.menu") %>">
              <div class="mnav-top">
                <span class="squad-mark" aria-hidden="true"></span>
                <button type="button" class="mnav-close" data-menu-close aria-label="<%= t.getProperty("common.close") %>"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
              </div>
              <div class="nav-pages">
              <a href="<%= ctx %>/index.jsp" class="nav-top"><i class="fa-solid fa-house nav-ico" aria-hidden="true"></i><span class="nav-t"><%= t.getProperty("menu.home") %></span></a>
              <div class="nav-group">
                <button type="button" class="nav-group-btn" aria-expanded="false" aria-controls="navSubMusic"><i class="fa-solid fa-music nav-ico" aria-hidden="true"></i><span class="nav-t"><%= t.getProperty("menu.music") %></span><i class="fa-solid fa-chevron-down nav-chev" aria-hidden="true"></i></button>
                <div class="nav-sub" id="navSubMusic">
                  <a href="<%= ctx %>/music.jsp"><i class="fa-solid fa-music nav-ico" aria-hidden="true"></i><span class="nav-sub-t"><%= t.getProperty("menu.discography") %></span><small><%= t.getProperty("menu.d.discography") %></small></a>
                  <a href="<%= ctx %>/texty.jsp"><i class="fa-solid fa-align-left nav-ico" aria-hidden="true"></i><span class="nav-sub-t"><%= t.getProperty("menu.lyrics") %></span><small><%= t.getProperty("menu.d.lyrics") %></small></a>
                  <%-- nepřihlášený vidí „pro členy“: stránka jde otevřít, zpívat smí jen přihlášení (KaraokeCinemaServlet) --%>
                  <a href="<%= ctx %>/karaoke" class="nav-karaoke"><i class="fa-solid fa-microphone nav-ico" aria-hidden="true"></i><span class="nav-sub-t"><%= t.getProperty("menu.karaoke") %><% if (currentUser == null) { %><span class="nav-badge"><%= t.getProperty("menu.membersOnly") %></span><% } %></span><small><%= t.getProperty("menu.d.karaoke") %></small></a>
                </div>
              </div>
              <a href="<%= ctx %>/aktuality.jsp" class="nav-top"><i class="fa-solid fa-newspaper nav-ico" aria-hidden="true"></i><span class="nav-t"><%= t.getProperty("menu.news") %></span></a>
              <%-- Squad má zatím jedinou položku (CatSmash), proto rovnou odkaz; skupina se vrátí s druhou hotovou funkcí
                   (Zeď, Rookie Chart – překlady menu.wall, menu.chart, menu.squad zůstávají) --%>
              <a href="<%= ctx %>/?kevin=pong" class="nav-top" data-play-game><i class="fa-solid fa-table-tennis-paddle-ball nav-ico" aria-hidden="true"></i><span class="nav-t"><%= t.getProperty("menu.catsmash") %></span></a>
              <div class="nav-group">
                <button type="button" class="nav-group-btn" aria-expanded="false" aria-controls="navSubAbout"><i class="fa-solid fa-circle-user nav-ico" aria-hidden="true"></i><span class="nav-t"><%= t.getProperty("menu.about") %></span><i class="fa-solid fa-chevron-down nav-chev" aria-hidden="true"></i></button>
                <div class="nav-sub" id="navSubAbout">
                  <a href="<%= ctx %>/about.jsp"><i class="fa-solid fa-circle-user nav-ico" aria-hidden="true"></i><span class="nav-sub-t"><%= t.getProperty("menu.about") %></span><small><%= t.getProperty("menu.d.about") %></small></a>
                  <a href="<%= ctx %>/donate.jsp" class="nav-donate"><i class="fa-solid fa-heart nav-ico" aria-hidden="true"></i><span class="nav-sub-t"><%= t.getProperty("btn.donate") %></span><small><%= t.getProperty("menu.d.donate") %></small></a>
                </div>
              </div>
              </div>
              <div class="nav-tools">
              <%-- telefon a tablet: účet --%>
              <div class="nav-account">
              <% if (currentUser == null) { %>
                <a href="<%= ctx %>/login.jsp" class="nav-login"><i class="fa-solid fa-right-to-bracket" aria-hidden="true"></i> <%= t.getProperty("btn.login") %></a>
                <a href="<%= ctx %>/register.jsp" class="nav-register"><i class="fa-solid fa-user-plus" aria-hidden="true"></i> <%= t.getProperty("btn.register") %></a>
              <% } else { %>
                <a href="<%= ctx %>/uzivatel.jsp" class="nav-me">
                  <% if (headerAvatar != null) { %><img class="nav-me-av" src="<%= com.github.skeliit.WebUtils.escapeHtml(headerAvatar) %>" alt=""><% } else { %><span class="nav-me-av" aria-hidden="true"><%= com.github.skeliit.WebUtils.escapeHtml(currentUser.substring(0, 1).toUpperCase()) %></span><% } %>
                  <span class="nav-me-t"><b><%= com.github.skeliit.WebUtils.escapeHtml(currentUser) %></b><small><%= t.getProperty("menu.account") %></small></span>
                  <i class="fa-solid fa-chevron-right nav-chev" aria-hidden="true"></i>
                </a>
                <a href="<%= ctx %>/nastaveni.jsp" class="nav-row"><i class="fa-solid fa-gear nav-ico" aria-hidden="true"></i><span class="nav-t"><%= t.getProperty("menu.settings") %></span></a>
                <button type="button" class="nav-row nav-notif" data-notif-open aria-controls="notifPanel"><i class="fa-regular fa-bell nav-ico" aria-hidden="true"></i><span class="nav-t"><%= t.getProperty("notif.title") %></span><span class="notif-badge" hidden></span></button>
                <% if ("ADMIN".equals(currentRole)) { %><a href="<%= ctx %>/admin.jsp" class="nav-row admin"><i class="fa-solid fa-star nav-ico" aria-hidden="true"></i><span class="nav-t">Admin</span></a><% } %>
                <%-- odhlášení je poslední v kartě účtu, tlumeně a oddělené čarou --%>
                <hr>
                <form method="post" action="<%= ctx %>/logout" class="logout-form nav-logout">
                  <input type="hidden" name="csrf" value="<%= com.github.skeliit.filter.CsrfFilter.token(session) %>">
                  <button type="submit"><i class="fa-solid fa-right-from-bracket nav-ico" aria-hidden="true"></i> <%= t.getProperty("btn.logout") %></button>
                </form>
              <% } %>
              </div>
              <%-- telefon a tablet: dok u palce – kolečka s popisky: Tma/Světlo, Písmo, Zvuk (přihlášený), jazyk (seznam vyskočí
                   nahoru nad kolečkem) a srdce Podpoř moji tvorbu. Režim a písmo mačkají tlačítka v liště (#themeToggle, #fontToggle),
                   stav ukazuje CSS podle body.light, html.bold-text a aria-pressed u zvuku (js/sounds.js). --%>
              <div class="nav-settings nav-dock">
                <span class="dk-it dk-theme"><button type="button" class="dk-cb" data-proxy="themeToggle" title="<%= t.getProperty("header.theme") %>" aria-label="<%= t.getProperty("header.theme") %>"><i class="fa-solid fa-moon dk-dark" aria-hidden="true"></i><i class="fa-solid fa-sun dk-light" aria-hidden="true"></i></button><small aria-hidden="true"><span class="dk-dark"><%= t.getProperty("menu.dock.dark") %></span><span class="dk-light"><%= t.getProperty("menu.dock.light") %></span></small></span>
                <span class="dk-it dk-font"><button type="button" class="dk-cb" data-proxy="fontToggle" title="<%= t.getProperty("header.fontWeight") %>" aria-label="<%= t.getProperty("header.fontWeight") %>"><b aria-hidden="true">B</b></button><small aria-hidden="true"><%= t.getProperty("menu.dock.font") %></small></span>
                <% if (currentUser != null) { %><span class="dk-it dk-sound"><button type="button" class="dk-cb" data-sound-toggle data-t-on="<%= t.getProperty("sound.on") %>" data-t-off="<%= t.getProperty("sound.off") %>" title="<%= t.getProperty("sound.off") %>" aria-label="<%= t.getProperty("sound.off") %>"><i class="fa-solid fa-volume-high" aria-hidden="true"></i></button><small aria-hidden="true"><span class="dk-on"><%= t.getProperty("menu.dock.sound") %></span><span class="dk-off"><%= t.getProperty("menu.dock.mute") %></span></small></span><% } %>
                <span class="dk-it dk-lang">
                  <button type="button" class="dk-cb" aria-expanded="false" aria-controls="navLangPop" title="<%= t.getProperty("header.language") %>" aria-label="<%= t.getProperty("header.language") %>"><img class="flag" src="<%= ctx %>/img/flags/<%= cur %>.svg" alt="" width="22" height="15"></button><small aria-hidden="true"><%= com.github.skeliit.I18n.label(cur) %></small>
                  <span class="nav-langs dk-pop" id="navLangPop" role="group" aria-label="<%= t.getProperty("header.language") %>">
                    <% String[][] dkLangs = { { "cs", "Čeština" }, { "en", "English" }, { "de", "Deutsch" }, { "uk", "Українська" }, { "vi", "Tiếng Việt" } };
                       for (String[] l : dkLangs) { %><a href="<%= langHref.apply(l[0]) %>" lang="<%= l[0] %>"<% if (l[0].equals(cur)) { %> class="active" aria-current="true"<% } %>><img class="flag" src="<%= ctx %>/img/flags/<%= l[0] %>.svg" alt="" width="22" height="15"><%= l[1] %></a><% } %>
                  </span>
                </span>
                <a href="<%= ctx %>/donate.jsp" class="dk-it dk-don"><span class="dk-cb" aria-hidden="true"><i class="fa-solid fa-heart"></i></span><small><%= t.getProperty("menu.dock.donate") %></small></a>
              </div>
              </div>
              <%-- spodek menu na telefonu: podpis se smajlíkem loga (barva webu, s fotkou se vymění – js/effects.js setFace).
                   Kdo na smajlíka 7× ťukne, spustí easter egg SQUAD UNLOCKED (js/squad-egg.js): obličeje se rozsvítí na údery srdce. --%>
              <div class="nav-foot sq-home" data-kevin="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("squad.kevin")) %>">
                <%@ include file="squad-egg.jspf" %>
              </div>
            </nav>

            <div class="top-controls">
              <%-- vzhled a zvuk: tři přepínače pod jedním kolečkem, ať je hlavička lehčí; jazyk zůstává vidět, lidi ho hledají --%>
              <div class="view-menu">
                <button type="button" class="icon-btn view-btn" aria-expanded="false" aria-controls="viewDropdown" title="<%= t.getProperty("header.view") %>" aria-label="<%= t.getProperty("header.view") %>"><i class="fa-solid fa-sliders" aria-hidden="true"></i></button>
                <div class="view-dropdown" id="viewDropdown">
                  <button id="fontToggle" type="button" class="view-row bold-btn" title="<%= t.getProperty("header.fontWeight") %>"><i class="fa-solid fa-bold" aria-hidden="true"></i><span><%= t.getProperty("header.fontWeight") %></span></button>
                  <button id="themeToggle" type="button" class="view-row" title="<%= t.getProperty("header.theme") %>"><i class="fa-solid fa-circle-half-stroke" aria-hidden="true"></i><span><%= t.getProperty("header.theme") %></span></button>
                  <% if (currentUser != null) { %><button type="button" class="view-row" data-sound-toggle data-t-on="<%= t.getProperty("sound.on") %>" data-t-off="<%= t.getProperty("sound.off") %>"><i class="fa-solid fa-volume-high" aria-hidden="true"></i><span><%= t.getProperty("sound.off") %></span></button><% } %>
                </div>
              </div>
              <div class="lang-switch">
                <button type="button" class="lang-btn icon-btn" aria-expanded="false" data-lang="<%= cur %>" title="<%= t.getProperty("header.language") %>" aria-label="<%= t.getProperty("header.language") %>">
                  <span class="lang-code"><%= com.github.skeliit.I18n.label(cur) %></span>
                </button>
                <ul class="menu">
                  <li><a href="<%= langHref.apply("cs") %>"><img class="flag" src="<%= ctx %>/img/flags/cs.svg" alt="" width="18" height="12">Čeština</a></li>
                  <li><a href="<%= langHref.apply("en") %>"><img class="flag" src="<%= ctx %>/img/flags/en.svg" alt="" width="18" height="12">English</a></li>
                  <li><a href="<%= langHref.apply("de") %>"><img class="flag" src="<%= ctx %>/img/flags/de.svg" alt="" width="18" height="12">Deutsch</a></li>
                  <li><a href="<%= langHref.apply("uk") %>"><img class="flag" src="<%= ctx %>/img/flags/uk.svg" alt="" width="18" height="12">Українська</a></li>
                  <li><a href="<%= langHref.apply("vi") %>" lang="vi"><img class="flag" src="<%= ctx %>/img/flags/vi.svg" alt="" width="18" height="12">Tiếng Việt</a></li>
                </ul>
              </div>
              <% if (currentUser == null) { %>
                <%-- jasné tlačítko s nápisem: kdo se tu ještě nepřihlásil, vidí Registrovat; kdo už ano (poznámka
                     v prohlížeči z dřívějška), vidí rovnou Přihlásit. Vedle je vždycky kulatá ikonka té druhé možnosti
                     (dřív chyběla – kdo měl účet, ale nový prohlížeč, neměl se kde přihlásit). --%>
                <a href="<%= ctx %>/login.jsp" class="auth-link auth-alt" data-auth-alt title="<%= t.getProperty("btn.login") %>"
                   aria-label="<%= t.getProperty("btn.login") %>"
                   data-register-href="<%= ctx %>/register.jsp" data-register-text="<%= t.getProperty("btn.register") %>">
                  <i class="fa-solid fa-right-to-bracket"></i>
                </a>
                <a href="<%= ctx %>/register.jsp" class="auth-link auth-primary auth-cta" data-auth-cta title="<%= t.getProperty("btn.register") %>"
                   data-login-href="<%= ctx %>/login.jsp" data-login-text="<%= t.getProperty("btn.login") %>">
                  <i class="fa-solid fa-user-plus"></i>
                  <span><%= t.getProperty("btn.register") %></span>
                </a>
                <script>try { if (localStorage.getItem('knownUser') === '1') {
                  var ac = document.querySelector('[data-auth-cta]'), aa = document.querySelector('[data-auth-alt]');
                  ac.href = ac.dataset.loginHref; ac.querySelector('i').className = 'fa-solid fa-right-to-bracket'; ac.querySelector('span').textContent = ac.title = ac.dataset.loginText;
                  aa.href = aa.dataset.registerHref; aa.querySelector('i').className = 'fa-solid fa-user-plus'; aa.title = aa.dataset.registerText; aa.setAttribute('aria-label', aa.dataset.registerText);
                } } catch (e) { /* bez úložiště zůstane Registrovat + ikonka Přihlásit */ }</script>
              <% } else { %>
                <script>try { localStorage.setItem('knownUser', '1'); } catch (e) { /* nevadí */ }</script>
                <%-- the bell: replies to your comments, hearts from Skeli (js/notifications.js) --%>
                <button type="button" class="icon-btn notif-btn" data-notif-open aria-haspopup="dialog" aria-controls="notifPanel"
                        title="<%= t.getProperty("notif.title") %>" aria-label="<%= t.getProperty("notif.title") %>">
                  <i class="fa-regular fa-bell"></i><span class="notif-badge" hidden></span>
                </button>
                <div class="user-menu">
                  <button type="button" class="user-btn" aria-expanded="false">
                    <% if (headerAvatar != null) { %>
                    <img class="user-avatar" src="<%= com.github.skeliit.WebUtils.escapeHtml(headerAvatar) %>" alt="">
                    <% } else { %>
                    <span class="user-avatar"><%= com.github.skeliit.WebUtils.escapeHtml(currentUser.substring(0, 1).toUpperCase()) %></span>
                    <% } %>
                    <span class="user-name"><%= com.github.skeliit.WebUtils.escapeHtml(currentUser) %></span>
                    <% if ("ADMIN".equals(currentRole)) { %><span class="user-star">★</span><% } %>
                    <i class="fa-solid fa-chevron-down"></i>
                  </button>
                  <div class="user-dropdown">
                    <a href="<%= ctx %>/uzivatel.jsp"><i class="fa-solid fa-user"></i> <%= t.getProperty("menu.account") %></a>
                    <a href="<%= ctx %>/nastaveni.jsp"><i class="fa-solid fa-gear"></i> <%= t.getProperty("menu.settings") %></a>
                    <% if ("ADMIN".equals(currentRole)) { %><a href="<%= ctx %>/admin.jsp" class="admin"><i class="fa-solid fa-star"></i> Admin</a><% } %>
                    <%-- a POST with the CSRF token: another site cannot log people out with a link --%>
                    <form method="post" action="<%= ctx %>/logout" class="logout-form">
                      <input type="hidden" name="csrf" value="<%= com.github.skeliit.filter.CsrfFilter.token(session) %>">
                      <button type="submit"><i class="fa-solid fa-right-from-bracket"></i> <%= t.getProperty("btn.logout") %></button>
                    </form>
                  </div>
                </div>
              <% } %>
            </div>
            <%-- phones and tablets: everything below lives in the menu this button opens --%>
            <button class="menu-toggle" id="menuToggle" type="button" aria-controls="mainNav" aria-expanded="false"><i class="fa-solid fa-bars"></i><span class="menu-label"><%= t.getProperty("footer.menu") %></span></button>
          </div>
        </header>
        <% if (currentUser != null) { %>
        <div class="notif-panel" id="notifPanel" role="dialog" aria-label="<%= t.getProperty("notif.title") %>" hidden
             data-csrf="<%= com.github.skeliit.filter.CsrfFilter.token(session) %>"
             data-t-reply="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("notif.reply")) %>"
             data-t-friend-request="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("notif.friendRequest")) %>"
             data-t-friend-accept="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("notif.friendAccept")) %>"
             data-t-message="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("notif.message")) %>"
             data-t-heart="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("notif.heart")) %>"
             data-t-song="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("notif.onSong")) %>"
             data-t-clip="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("notif.onClip")) %>"
             data-t-passed="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("notif.passed")) %>"
             data-t-passed-place="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("notif.passedPlace")) %>"
             data-t-pong-score="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("notif.pongScore")) %>"
             data-t-pong-time="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("notif.pongTime")) %>"
             data-t-someone="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("notif.someone")) %>"
             data-t-deleted="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("account.deleted")) %>">
          <div class="notif-head">
            <strong><%= t.getProperty("notif.title") %></strong>
            <button type="button" class="notif-close" data-notif-close aria-label="<%= t.getProperty("common.close") %>"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="notif-list" aria-live="polite"><p class="notif-empty"><%= t.getProperty("notif.empty") %></p></div>
        </div>
        <script src="<%= ctx %>/js/notifications.js?v=<%= assetVersion %>" defer></script>
        <% } %>
<%
  // One-line messages after a redirect, chosen by fixed query parameters (never echoed back)
  String flashKey = null; boolean flashOk = true;
  String pVerified = request.getParameter("verified"), pVerify = request.getParameter("verify");
  String pWelcome = request.getParameter("welcome");
  if (session.getAttribute("userId") != null && "1".equals(pWelcome)) flashKey = "flash.welcome";
  else if (session.getAttribute("userId") != null && "verify".equals(pWelcome)) flashKey = "flash.welcomeVerify";
  else if ("1".equals(pVerified)) flashKey = "flash.verified";
  else if ("invalid".equals(pVerified)) { flashKey = "flash.verifyInvalid"; flashOk = false; }
  else if ("sent".equals(pVerify)) flashKey = "flash.verifySent";
  else if ("resent".equals(pVerify)) flashKey = "flash.verifyResent";
  else if ("limit".equals(pVerify)) { flashKey = "flash.verifyLimit"; flashOk = false; }
  else if ("required".equals(pVerify)) { flashKey = "flash.verifyRequired"; flashOk = false; }
  else if ("1".equals(request.getParameter("reported"))) flashKey = "flash.reported";
  else if ("0".equals(request.getParameter("reported"))) { flashKey = "flash.reportFailed"; flashOk = false; }
  else if ("limit".equals(request.getParameter("comment"))) { flashKey = "flash.commentLimit"; flashOk = false; }
  else if ("expired".equals(request.getParameter("csrf"))) { flashKey = "flash.csrfExpired"; flashOk = false; }   // formulář byl otevřený moc dlouho (CsrfFilter)
  if (flashKey != null) {
%>
        <div class="flash <%= flashOk ? "flash-ok" : "flash-warn" %>" role="status">
          <i class="fa-solid <%= flashOk ? "fa-circle-check" : "fa-circle-exclamation" %>"></i>
          <span><%= t.getProperty(flashKey).replace("{name}", com.github.skeliit.WebUtils.escapeHtml(session.getAttribute("username"))) %></span>
        </div>
<% } %>
        <script>
          (function () {
            const fwKey = 'fontWeight';
            // "B" = easier reading: bolder and slightly bigger text (see html.bold-text in base.css)
            const body = document.body;
            const fontBtn = document.getElementById('fontToggle');
            function setBold(on) {
              document.documentElement.classList.toggle('bold-text', on);
              document.documentElement.style.setProperty('--fw', on ? '700' : '400');
              fontBtn.classList.toggle('active', on);
              fontBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
            }
            setBold(localStorage.getItem(fwKey) === '600' || localStorage.getItem(fwKey) === '700');
            fontBtn.addEventListener('click', () => {
              const on = !document.documentElement.classList.contains('bold-text');
              setBold(on);
              localStorage.setItem(fwKey, on ? '700' : '400');
            });
            const k = 'theme';
            const cur = localStorage.getItem(k) || 'dark';
            body.classList.add(cur);
            document.getElementById('themeToggle').addEventListener('click', () => {
              // Animate colors only while switching (see .theme-anim in base.css)
              body.classList.add('theme-anim');
              setTimeout(() => body.classList.remove('theme-anim'), 600);
              body.classList.toggle('light');
              body.classList.toggle('dark');
              const v = body.classList.contains('light') ? 'light' : 'dark';
              localStorage.setItem(k, v);
            });

            // Header gets a solid glass background (and the small sign) once it is docked at the top
            const siteHeader = document.getElementById('siteHeader');
            const masthead = document.getElementById('masthead');
            // The bar never slides away: the menu has to be one tap away on every part of every page.
            function onHeaderScroll() {
              siteHeader.classList.toggle('scrolled', window.scrollY > Math.max(8, masthead.offsetHeight - 1));
            }
            window.addEventListener('scroll', onHeaderScroll, { passive: true });
            onHeaderScroll();

            // Jazyk a menu účtu v liště (PC): klik otevře / zavře, aria-expanded říká čtečce, jestli je otevřené
            const langSwitch = document.querySelector('.lang-switch');
            const langBtn = document.querySelector('.lang-switch .lang-btn');
            const userMenu = document.querySelector('.user-menu');
            const userBtn = userMenu && userMenu.querySelector('.user-btn');
            function setPop(box, btn, open) { if (!box) return; box.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); }
            if (langBtn && langSwitch) {
              langBtn.addEventListener('click', (e) => { e.stopPropagation(); setPop(langSwitch, langBtn, !langSwitch.classList.contains('open')); });
              langSwitch.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => setPop(langSwitch, langBtn, false)));
            }
            if (userBtn) userBtn.addEventListener('click', (e) => { e.stopPropagation(); setPop(userMenu, userBtn, !userMenu.classList.contains('open')); });
            document.addEventListener('click', () => { setPop(langSwitch, langBtn, false); setPop(userMenu, userBtn, false); });

            // Menu na telefonu a tabletu (do 1024 px): telefon = přes celou obrazovku, tablet = panel zprava.
            // Otevřené menu: stránka pod ním se neposouvá a nejde na ni ťuknout ani se k ní dostat Tabem (inert),
            // focus skočí na zavírací křížek a po zavření se vrátí na „Menu“. Esc zavře. Rozbalená je skupina s aktuální stránkou.
            const menuToggle = document.getElementById('menuToggle');
            const mainNav = document.getElementById('mainNav');
            const navMq = window.matchMedia('(max-width: 1024px)');
            function menuOpen() { return !!mainNav && mainNav.classList.contains('open'); }
            function setInert(on) {
              const keep = siteHeaderEl();
              Array.from(document.body.children).forEach(el => {
                if (el === keep || el.tagName === 'SCRIPT') return;
                if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert');
              });
              if (keep) keep.querySelectorAll('.header-inner > :not(#mainNav):not(.nav-shade)').forEach(el => { if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
            }
            function siteHeaderEl() { return document.getElementById('siteHeader'); }
            function setMenu(open, keepFocus) {
              if (!mainNav || open === menuOpen()) return;
              mainNav.classList.toggle('open', open);
              document.documentElement.classList.toggle('menu-open', open);
              menuToggle.setAttribute('aria-expanded', String(open));
              menuToggle.querySelector('i').classList.toggle('fa-bars', !open);
              menuToggle.querySelector('i').classList.toggle('fa-xmark', open);
              setInert(open);
              if (open) {
                mainNav.querySelectorAll('.nav-group').forEach(g => setGroup(g, g.classList.contains('has-active')));
                mainNav.scrollTop = 0;
                const close = mainNav.querySelector('.mnav-close');
                if (close) close.focus({ preventScroll: true });
              } else if (!keepFocus && menuToggle.offsetParent) {
                menuToggle.focus({ preventScroll: true });
              }
            }
            if (menuToggle && mainNav) {
              menuToggle.addEventListener('click', (e) => { e.stopPropagation(); setMenu(!menuOpen()); });
              document.querySelectorAll('[data-menu-close]').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); setMenu(false); }));
              // odkaz v menu (i hra a upozornění) menu zavře; na zbytek menu klik nic nezavírá
              mainNav.addEventListener('click', (e) => {
                if (!menuOpen()) return;
                if (e.target.closest('a, [data-notif-open], .logout-form button')) setMenu(false, true);
              });
              // klik mimo menu (na liště) ho zavře; syntetický klik z tlačítek níž ne
              document.addEventListener('click', (e) => { if (e.isTrusted && menuOpen() && !mainNav.contains(e.target)) setMenu(false); });
              // řádek ovládání v menu mačká skutečná tlačítka v liště (režim, tučnější text); menu zůstane otevřené
              mainNav.querySelectorAll('[data-proxy]').forEach(b => b.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById(b.dataset.proxy).click();
              }));
              // jazyk v doku: kolečko otevře seznam nahoru; zavře ho klik mimo, Esc nebo zavření menu
              const dockLangBtn = mainNav.querySelector('.dk-lang .dk-cb'), dockLangPop = document.getElementById('navLangPop');
              const setDockLang = (open) => { if (!dockLangBtn) return; dockLangPop.classList.toggle('open', open); dockLangBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); };
              if (dockLangBtn) {
                dockLangBtn.addEventListener('click', (e) => { e.stopPropagation(); setDockLang(!dockLangPop.classList.contains('open')); });
                mainNav.addEventListener('click', (e) => { if (!e.target.closest('.dk-lang')) setDockLang(false); }, true);   // true: dřív, než ho tlačítka (data-proxy) zastaví
                document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && dockLangPop.classList.contains('open')) { setDockLang(false); dockLangBtn.focus(); } });
                document.addEventListener('pjax:done', () => setDockLang(false));
              }
              navMq.addEventListener('change', () => { if (!navMq.matches) setMenu(false, true); });
              document.addEventListener('pjax:done', () => setMenu(false, true));
            }

            // Rozbalovací skupiny menu a kolečko Vzhled a zvuk. PC: klik, Esc, klik mimo, vždy jen jedna otevřená.
            // Telefon a tablet: skupiny se rozbalují pod sebou nezávisle (zavírání ostatních by posouvalo menu pod prstem).
            const dropdowns = document.querySelectorAll('.nav-group, .view-menu');
            function setGroup(d, open) { d.classList.toggle('open', open); d.querySelector('button').setAttribute('aria-expanded', String(open)); }
            function closeDropdowns(except) {
              dropdowns.forEach(d => {
                if (d === except) return;
                if (navMq.matches && d.classList.contains('nav-group') && menuOpen()) return;   // v menu na telefonu zůstávají, jak je kdo nechal
                setGroup(d, false);
              });
            }
            dropdowns.forEach(d => d.querySelector('button').addEventListener('click', () => {
              closeDropdowns(d);
              setGroup(d, !d.classList.contains('open'));
            }));
            document.addEventListener('click', (e) => { if (!e.target.closest('.nav-group, .view-menu')) closeDropdowns(); });
            document.addEventListener('keydown', (e) => {
              if (e.key !== 'Escape') return;
              if (menuOpen()) { setMenu(false); return; }
              const open = document.querySelector('.nav-group.open, .view-menu.open');
              if (open) { closeDropdowns(); setGroup(open, false); open.querySelector('button').focus(); return; }
              if (langSwitch && langSwitch.classList.contains('open')) { setPop(langSwitch, langBtn, false); langBtn.focus(); return; }
              if (userMenu && userMenu.classList.contains('open')) { setPop(userMenu, userBtn, false); userBtn.focus(); }
            });
            // po kliknutí na odkaz se nabídka zavře, i když nad ní pořád stojí myš
            document.querySelectorAll('.nav-sub a').forEach(a => a.addEventListener('click', () => {
              const g = a.closest('.nav-group');
              closeDropdowns();
              g.classList.add('just-used');
              g.addEventListener('mouseleave', () => g.classList.remove('just-used'), { once: true });
            }));
            document.addEventListener('pjax:done', () => closeDropdowns());

            // has the visitor allowed third-party content (YouTube, Spotify) in the cookie bar?
            window.skeliConsent = function () { try { return localStorage.getItem('cookieConsent') === 'true'; } catch (e) { return false; } };
            // Lightweight PJAX navigation: only <main> changes, so Kevin and the header stay
            (function () {
              const ORIGIN = location.origin;
              function isInternal(a) { try { const u = new URL(a.href, ORIGIN); return u.origin === ORIGIN && !a.hasAttribute('download') && (!a.target || a.target === '_self'); } catch { return false; } }
              function extractMain(html) {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const main = doc.querySelector('main');
                return main ? main : doc.body;
              }
              // the page now in <main>; a change of only #anchor stays on it
              let loadedPage = location.pathname + location.search;
              async function navigate(url, push) {
                try {
                  document.body.style.cursor = 'progress';
                  const res = await fetch(url, { headers: { 'X-Requested-With': 'fetch' } });
                  // only pages are swapped in; an image or a file opens normally
                  if (!(res.headers.get('content-type') || '').includes('text/html')) return location.assign(url);
                  const text = await res.text();
                  const newMain = extractMain(text);
                  if (!newMain) return location.assign(url);
                  const curMain = document.querySelector('main');
                  if (curMain) { curMain.replaceWith(newMain); } else { document.body.appendChild(newMain); }
                  const titleMatch = text.match(/<title>([\s\S]*?)<\/title>/i); if (titleMatch) document.title = titleMatch[1];
                  // re-execute inline scripts in main
                  newMain.querySelectorAll('script').forEach(old => { const s = document.createElement('script'); if (old.src) { s.src = old.src; s.async = false; /* popořadě: např. lyric-bilingual.js před karaoke.js */ } else { s.textContent = old.textContent; } (old.type && (s.type = old.type)); old.replaceWith(s); });
                  if (push) history.pushState({ url }, '', url);
                  const target = new URL(url, location.href);
                  loadedPage = target.pathname + target.search;
                  // an address with #anchor scrolls to it, any other page starts at the top
                  const anchor = target.hash && document.getElementById(decodeURIComponent(target.hash.slice(1)));
                  if (anchor) anchor.scrollIntoView({ behavior: 'smooth' }); else window.scrollTo({ top: 0, behavior: 'smooth' });
                  document.dispatchEvent(new CustomEvent('pjax:done', { detail: { url } }));
                } catch (e) { location.assign(url); }
                finally { document.body.style.cursor = ''; }
              }
              document.addEventListener('click', function (e) {
                // another handler took the click (gallery viewer, Kevin…), or a new tab is wanted
                if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
                const a = e.target.closest('a');
                if (!a || a.hasAttribute('data-lightbox') || a.hasAttribute('data-play-game')) return;   // hra se otevírá na místě (js/kevin.js), ne jako nová stránka
                if (!isInternal(a)) return;
                const href = a.getAttribute('href') || '';
                if (!href || href.startsWith('#')) return;
                // pictures and files are not pages
                if (/\.(webp|jpe?g|png|gif|svg|pdf|mp3|mp4|zip)(\?|$)/i.test(href)) return;
                // allow full reload for language switch to refresh header/nav strings
                if (href.includes('lang=')) return;
                // disable PJAX for pages that need full refresh or include page-scoped styles/scripts
                const noPjax = ['/auth/', '/karaoke', '/premiera', '/lyrics/', '/texty', '/admin', '/logout', '/login.jsp', '/register.jsp', '/uzivatel.jsp', '/nastaveni.jsp', '/profile.jsp'];
                if (noPjax.some(p => href.includes(p))) return;
                if (document.body.classList.contains('is-admin')) return;   // z adminu ven vždy celou stránkou (jiné pozadí a patička)
                e.preventDefault();
                navigate(href, true);
              });
              window.addEventListener('popstate', (e) => {
                // following a #anchor on the same page fires popstate too: the browser scrolls, nothing to load
                if (location.pathname + location.search === loadedPage) return;
                navigate((e.state && e.state.url) || location.href, false);
              });
            })();

            // Active navigation highlight
            // Aktivní položka menu: přesné mapování adres na stránku v menu (žádné hledání kousků adresy).
            // Písně (/lyrics/…, /cs/song/…) patří k Textům, kino (/karaoke/…) ke Karaoke, /hrac/ a /zprávy nesvítí nic.
            // Svítící odkaz dostane i aria-current="page" (čtečka řekne „aktuální stránka“); CatSmash je hra nad stránkou, nesvítí.
            function currentNavPage() {
              const path = location.pathname;
              if (path === '/' || path === '/index.jsp') return 'index.jsp';
              if (path.startsWith('/lyrics/') || /^\/(cs|en|de|uk|vi)\/song\//.test(path)) return 'texty.jsp';
              if (path === '/karaoke' || path.startsWith('/karaoke/')) return 'karaoke';
              return path.split('/').pop();
            }
            function updateActiveNav() {
              const cur = currentNavPage();
              document.querySelectorAll('header nav a').forEach(a => {
                const href = (a.getAttribute('href') || '').split('?')[0];
                const target = href === '/' ? '' : href.split('/').pop();
                if (!target) return;   // odkazy jazyků (?lang=) a podobné: označení od serveru zůstává
                const isActive = !!target && target === cur && !a.hasAttribute('data-play-game');
                a.classList.toggle('active', isActive);
                if (isActive) a.setAttribute('aria-current', 'page'); else if (a.getAttribute('aria-current') === 'page') a.removeAttribute('aria-current');
              });
              // stránka uvnitř nabídky: svítí i položka, která ji obsahuje
              document.querySelectorAll('.nav-group').forEach(g => g.classList.toggle('has-active', !!g.querySelector('a.active')));
            }
            updateActiveNav();
            window.updateActiveNav = updateActiveNav;   // přepínač Texty | Karaoke mění adresu bez načtení (js/texty-wheel.js)
            document.addEventListener('pjax:done', updateActiveNav);

            // Reveal animations
            (function () {
              const io = new IntersectionObserver((entries) => {
                entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); } });
              }, { threshold: 0.1 });
              function bind(root) { (root || document).querySelectorAll('[data-reveal], .reveal').forEach(el => { el.classList.add('reveal'); io.observe(el); }); }
              bind(document);
              document.addEventListener('pjax:done', (e) => { bind(document.querySelector('main') || document); });
            })();

          })();
        </script>