<!DOCTYPE html>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%
  String ctx = request.getContextPath();
  if (ctx == null) {
    ctx = "";
  }
  String assetVersion = "2.4.6";
%>
<%@ include file="/WEB-INF/i18n/i18n.jspf" %>
  <html lang="<%= cur %>">

  <head>
    <meta charset="utf-8" />
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
        java.util.Map.entry("/uzivatel.jsp", "settings.heading"),
        java.util.Map.entry("/profile.jsp", "menu.profile"),
        java.util.Map.entry("/privacy.jsp", "privacy.heading"),
        java.util.Map.entry("/terms.jsp", "terms.heading"),
        java.util.Map.entry("/gdpr.jsp", "gdpr.title"),
        java.util.Map.entry("/error.jsp", "error.heading"));
    String titleKey = titleKeys.get(request.getServletPath());
    if (titleKey != null) headTitle = t.getProperty(titleKey);
  }
  String headFullTitle = headTitle == null ? t.getProperty("meta.title") : headTitle + " | Skeli";
  String headDesc = (String) request.getAttribute("pageDescription");
  if (headDesc == null) headDesc = t.getProperty("meta.description");
  // Absolute URLs for search engines and link previews (never taken from the Host header)
  String siteBase = com.github.skeliit.WebUtils.baseUrl();
  Object fwdUri = request.getAttribute("jakarta.servlet.forward.request_uri");
  String headUrl = siteBase + (fwdUri != null ? fwdUri : request.getRequestURI());
  // error pages (404/500) must not end up in search results
  boolean headIsError = request.getAttribute("jakarta.servlet.error.status_code") != null;
  // link preview image/type: a page may set its own (a lyric page uses its video thumbnail)
  String headImage = (String) request.getAttribute("pageImage");
  String headType = request.getAttribute("pageType") != null ? (String) request.getAttribute("pageType") : "website";
%>
    <title><%= com.github.skeliit.WebUtils.escapeHtml(headFullTitle) %></title>
    <meta name="description" content="<%= com.github.skeliit.WebUtils.escapeHtml(headDesc) %>" />
    <meta name="author" content="Skeli" />
    <% if (headIsError) { %><meta name="robots" content="noindex" /><% } else { %><link rel="canonical" href="<%= com.github.skeliit.WebUtils.escapeHtml(headUrl) %>" /><% } %>
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
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bruno+Ace+SC&family=Exo+2:wght@500&family=Oswald:wght@300;500&display=swap" rel="stylesheet">
    <!-- Skeli.cz CSS -->
    <link rel="stylesheet" href="<%= ctx %>/css/base.css?v=<%= assetVersion %>">
    <link rel="stylesheet" href="<%= ctx %>/css/components.css?v=<%= assetVersion %>">
    <link rel="stylesheet" href="<%= ctx %>/css/pages.css?v=<%= assetVersion %>">
    <link rel="stylesheet" href="<%= ctx %>/css/admin.css?v=<%= assetVersion %>">
  </head>
  <body>
      <% request.setAttribute("csrf", com.github.skeliit.CsrfFilter.token(session)); %>
      <% String currentUser = (String) session.getAttribute("username");
         String currentRole = (String) session.getAttribute("role"); %>
        <header class="site-header" id="siteHeader">
          <div class="header-inner">
            <a href="<%= ctx %>/index.jsp" class="brand"><span class="squad-mark" aria-hidden="true"></span><span class="sr-only">SKELOSQUAD</span></a>

            <nav id="mainNav" class="main-nav">
              <a href="<%= ctx %>/index.jsp"><%= t.getProperty("menu.home","Home") %></a>
              <a href="<%= ctx %>/bio.jsp"><%= t.getProperty("menu.about","About") %></a>
              <a href="<%= ctx %>/music.jsp"><%= t.getProperty("menu.music","Music") %></a>
              <a href="<%= ctx %>/aktuality.jsp"><%= t.getProperty("menu.news") %></a>
              <a href="<%= ctx %>/texty.jsp"><%= t.getProperty("menu.lyrics","Lyrics") %></a>
              <a href="<%= ctx %>/donate.jsp" class="nav-donate"><i class="fa-solid fa-heart"></i> <%= t.getProperty("btn.donate") %></a>
              <%-- phones: the display controls live here instead of crowding the bar --%>
              <div class="nav-settings">
                <button type="button" class="icon-btn" data-proxy="fontToggle" title="<%= t.getProperty("header.fontWeight") %>" aria-label="<%= t.getProperty("header.fontWeight") %>"><i class="fa-solid fa-bold"></i></button>
                <button type="button" class="icon-btn" data-proxy="themeToggle" title="<%= t.getProperty("header.theme") %>" aria-label="<%= t.getProperty("header.theme") %>"><i class="fa-solid fa-circle-half-stroke"></i></button>
                <span class="nav-langs" aria-label="<%= t.getProperty("header.language") %>">
                  <% for (String l : new String[]{"cs", "en", "de", "uk", "vi"}) { %><a href="?lang=<%= l %>"<% if (l.equals(cur)) { %> class="active" aria-current="true"<% } %>><img class="flag" src="<%= ctx %>/img/flags/<%= l %>.svg" alt="" width="16" height="10"><%= l.toUpperCase() %></a><% } %>
                </span>
              </div>
            </nav>

            <div class="top-controls">
              <a href="<%= ctx %>/donate.jsp" class="donate-link" title="<%= t.getProperty("btn.donate") %>">
                <i class="fa-solid fa-heart"></i>
                <span><%= t.getProperty("btn.donate") %></span>
              </a>
              <button id="fontToggle" type="button" title="<%= t.getProperty("header.fontWeight") %>" aria-label="<%= t.getProperty("header.fontWeight") %>" class="icon-btn bold-btn">
                <i class="fa-solid fa-bold"></i>
              </button>
              <button id="themeToggle" type="button" title="<%= t.getProperty("header.theme") %>" aria-label="<%= t.getProperty("header.theme") %>" class="icon-btn">
                <i class="fa-solid fa-circle-half-stroke"></i>
              </button>
              <div class="lang-switch">
                <button type="button" class="lang-btn icon-btn" data-lang="<%= cur %>" title="<%= t.getProperty("header.language") %>" aria-label="<%= t.getProperty("header.language") %>">
                  <span class="lang-code"><%= cur.toUpperCase() %></span>
                </button>
                <ul class="menu">
                  <li><a href="?lang=cs"><img class="flag" src="<%= ctx %>/img/flags/cs.svg" alt="" width="18" height="12">Čeština</a></li>
                  <li><a href="?lang=en"><img class="flag" src="<%= ctx %>/img/flags/en.svg" alt="" width="18" height="12">English</a></li>
                  <li><a href="?lang=de"><img class="flag" src="<%= ctx %>/img/flags/de.svg" alt="" width="18" height="12">Deutsch</a></li>
                  <li><a href="?lang=uk"><img class="flag" src="<%= ctx %>/img/flags/uk.svg" alt="" width="18" height="12">Українська</a></li>
                  <li><a href="?lang=vi" lang="vi"><img class="flag" src="<%= ctx %>/img/flags/vi.svg" alt="" width="18" height="12">Tiếng Việt</a></li>
                </ul>
              </div>
              <% if (currentUser == null) { %>
                <a href="<%= ctx %>/login.jsp" class="auth-link" title="<%= t.getProperty("btn.login") %>">
                  <i class="fa-solid fa-right-to-bracket"></i>
                  <span><%= t.getProperty("btn.login") %></span>
                </a>
                <a href="<%= ctx %>/register.jsp" class="auth-link auth-primary" title="<%= t.getProperty("btn.register") %>">
                  <i class="fa-solid fa-user-plus"></i>
                  <span><%= t.getProperty("btn.register") %></span>
                </a>
              <% } else { %>
                <div class="user-menu">
                  <button type="button" class="user-btn">
                    <% String headerAvatar = com.github.skeliit.WebUtils.safeUrl((String) session.getAttribute("avatar_url"), null); %>
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
                    <a href="<%= ctx %>/profile.jsp"><i class="fa-solid fa-user"></i> <%= t.getProperty("menu.profile") %></a>
                    <a href="<%= ctx %>/uzivatel.jsp"><i class="fa-solid fa-gear"></i> <%= t.getProperty("menu.settings") %></a>
                    <% if ("ADMIN".equals(currentRole)) { %><a href="<%= ctx %>/admin.jsp" class="admin"><i class="fa-solid fa-star"></i> Admin</a><% } %>
                    <a href="<%= ctx %>/logout"><i class="fa-solid fa-right-from-bracket"></i> <%= t.getProperty("btn.logout") %></a>
                  </div>
                </div>
              <% } %>
              <button class="menu-toggle icon-btn" id="menuToggle" type="button" aria-controls="mainNav" aria-expanded="false"><i class="fa-solid fa-bars"></i><span class="menu-label"><%= t.getProperty("footer.menu") %></span></button>
            </div>
          </div>
        </header>
<%
  // One-line messages after a redirect, chosen by fixed query parameters (never echoed back)
  String flashKey = null; boolean flashOk = true;
  String pVerified = request.getParameter("verified"), pVerify = request.getParameter("verify");
  if ("1".equals(pVerified)) flashKey = "flash.verified";
  else if ("invalid".equals(pVerified)) { flashKey = "flash.verifyInvalid"; flashOk = false; }
  else if ("sent".equals(pVerify)) flashKey = "flash.verifySent";
  else if ("resent".equals(pVerify)) flashKey = "flash.verifyResent";
  else if ("limit".equals(pVerify)) { flashKey = "flash.verifyLimit"; flashOk = false; }
  else if ("required".equals(pVerify)) { flashKey = "flash.verifyRequired"; flashOk = false; }
  else if ("1".equals(request.getParameter("reported"))) flashKey = "flash.reported";
  else if ("0".equals(request.getParameter("reported"))) { flashKey = "flash.reportFailed"; flashOk = false; }
  else if ("limit".equals(request.getParameter("comment"))) { flashKey = "flash.commentLimit"; flashOk = false; }
  if (flashKey != null) {
%>
        <div class="flash <%= flashOk ? "flash-ok" : "flash-warn" %>" role="status">
          <i class="fa-solid <%= flashOk ? "fa-circle-check" : "fa-circle-exclamation" %>"></i>
          <span><%= t.getProperty(flashKey) %></span>
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

            // Header gets a solid glass background once the page is scrolled
            const siteHeader = document.getElementById('siteHeader');
            function onHeaderScroll() { siteHeader.classList.toggle('scrolled', window.scrollY > 8); }
            window.addEventListener('scroll', onHeaderScroll, { passive: true });
            onHeaderScroll();

            // Language menu toggle by click
            const langSwitch = document.querySelector('.lang-switch');
            const langBtn = document.querySelector('.lang-switch .lang-btn');
            if (langBtn && langSwitch) {
              langBtn.addEventListener('click', (e) => { e.stopPropagation(); langSwitch.classList.toggle('open'); });
              document.addEventListener('click', () => { langSwitch.classList.remove('open'); });
              langSwitch.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => { langSwitch.classList.remove('open'); }));
            }

            // Hamburger menu toggle
            const menuToggle = document.getElementById('menuToggle');
            const mainNav = document.getElementById('mainNav');
            if (menuToggle && mainNav) {
              menuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                setMenu(!mainNav.classList.contains('open'));
              });
              // a real click elsewhere closes it (not the synthetic one from the settings row below)
              document.addEventListener('click', (e) => { if (e.isTrusted) setMenu(false); });
              // settings row inside the phone menu presses the real bar buttons; the menu stays open
              mainNav.querySelectorAll('[data-proxy]').forEach(b => b.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById(b.dataset.proxy).click();
              }));
            }
            function setMenu(open) {
              mainNav.classList.toggle('open', open);
              menuToggle.setAttribute('aria-expanded', open);
              menuToggle.querySelector('i').classList.toggle('fa-bars', !open);
              menuToggle.querySelector('i').classList.toggle('fa-xmark', open);
            }

            // User menu: opens on hover (CSS) and on click/tap
            const userMenu = document.querySelector('.user-menu');
            if (userMenu) {
              userMenu.querySelector('.user-btn').addEventListener('click', (e) => { e.stopPropagation(); userMenu.classList.toggle('open'); });
              document.addEventListener('click', () => userMenu.classList.remove('open'));
            }

            // Persistent Spotify bottom bar
            function ensureSpBar() {
              if (document.getElementById('sp-bar')) return document.getElementById('sp-bar');
              const bar = document.createElement('div'); bar.id = 'sp-bar'; bar.className = 'sp-bar';
              bar.innerHTML = "<div class='sp-inner'><button id='sp-hide' class='sp-hide' title='<%= com.github.skeliit.WebUtils.escapeJs(com.github.skeliit.WebUtils.escapeHtml(t.getProperty("player.hide"))) %>' aria-label='<%= com.github.skeliit.WebUtils.escapeJs(com.github.skeliit.WebUtils.escapeHtml(t.getProperty("player.hide"))) %>'><i class='fa-solid fa-chevron-down'></i></button><iframe id='sp-iframe' class='sp-iframe' allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture' loading='lazy'></iframe></div>";
              document.body.appendChild(bar);
              const min = document.createElement('div'); min.id = 'sp-min'; min.className = 'sp-minbar'; min.innerHTML = '<i class="fab fa-spotify"></i> Spotify';
              document.body.appendChild(min);
              document.getElementById('sp-hide').addEventListener('click', () => closeBar());
              min.addEventListener('click', () => openBar());
              return bar;
            }
            // theme=0 = Spotify's dark embed, instead of a color taken from the artwork
            function darkEmbed(u) { return (!u || /[?&]theme=/.test(u)) ? u : u + (u.includes('?') ? '&' : '?') + 'theme=0'; }
            function normalizeSrc(input) {
              if (!input) return null;
              if (/^https?:\/\//.test(input)) return darkEmbed(input);
              // short forms: track:ID, playlist:ID, album:ID, artist:ID
              const [type, id] = input.split(':');
              if (id) { return `https://open.spotify.com/embed/\${type}/\${id}?utm_source=generator&theme=0`; }
              return `https://open.spotify.com/embed/track/\${input}?utm_source=generator&theme=0`;
            }
            const SP_DEFAULT = 'https://open.spotify.com/embed/artist/5IouXw8U9uKCTwmncG5bUl?utm_source=generator&theme=0';
            function openBar() { const bar = ensureSpBar(); const f = document.getElementById('sp-iframe'); if (!f.src) { const saved = darkEmbed(localStorage.getItem('sp_src')); f.src = saved || SP_DEFAULT; } bar.style.display = 'block'; document.getElementById('sp-min').style.display = 'none'; localStorage.setItem('sp_min', '0'); }
            function closeBar() { const bar = ensureSpBar(); bar.style.display = 'none'; const m = document.getElementById('sp-min'); m.style.display = 'block'; m.innerHTML = '<i class="fab fa-spotify"></i> Spotify'; localStorage.setItem('sp_min', '1'); }
            window.toggleSpotifyBar = function () { if (ensureSpBar().style.display === 'none') { openBar(); } else { closeBar(); } }
            window.playSpotify = function (src) { const bar = ensureSpBar(); const url = normalizeSrc(src); const f = document.getElementById('sp-iframe'); if (f.src !== url) f.src = url; openBar(); localStorage.setItem('sp_src', url); localStorage.setItem('sp_play', 'true'); };

            // Restore state on every page
            (function () {
              const bar = ensureSpBar(); const wasMin = localStorage.getItem('sp_min') === '1'; const saved = darkEmbed(localStorage.getItem('sp_src')); const f = document.getElementById('sp-iframe'); if (saved) { f.src = saved; }
              if ((saved || SP_DEFAULT) && !wasMin) { f.src = f.src || SP_DEFAULT; bar.style.display = 'block'; document.getElementById('sp-min').style.display = 'none'; }
              else { bar.style.display = 'none'; const m = document.getElementById('sp-min'); m.style.display = 'block'; m.innerHTML = '<i class="fab fa-spotify"></i> Spotify'; }
            })();

            // Autowire any element with data-spotify-src
            document.addEventListener('click', function (e) { const t = e.target.closest('[data-spotify-src]'); if (t) { e.preventDefault(); window.playSpotify(t.getAttribute('data-spotify-src')); } });

            // Lightweight PJAX navigation to preserve global UI (Spotify bar)
            (function () {
              const ORIGIN = location.origin;
              function isInternal(a) { try { const u = new URL(a.href, ORIGIN); return u.origin === ORIGIN && !a.hasAttribute('download') && (!a.target || a.target === '_self'); } catch { return false; } }
              function extractMain(html) {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const main = doc.querySelector('main');
                return main ? main : doc.body;
              }
              async function navigate(url, push) {
                try {
                  document.body.style.cursor = 'progress';
                  const res = await fetch(url, { headers: { 'X-Requested-With': 'fetch' } });
                  const text = await res.text();
                  const newMain = extractMain(text);
                  if (!newMain) return location.assign(url);
                  const curMain = document.querySelector('main');
                  if (curMain) { curMain.replaceWith(newMain); } else { document.body.appendChild(newMain); }
                  const titleMatch = text.match(/<title>([\s\S]*?)<\/title>/i); if (titleMatch) document.title = titleMatch[1];
                  // re-execute inline scripts in main
                  newMain.querySelectorAll('script').forEach(old => { const s = document.createElement('script'); if (old.src) { s.src = old.src; } else { s.textContent = old.textContent; } (old.type && (s.type = old.type)); old.replaceWith(s); });
                  if (push) history.pushState({ url }, '', url);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  document.dispatchEvent(new CustomEvent('pjax:done', { detail: { url } }));
                } catch (e) { location.assign(url); }
                finally { document.body.style.cursor = ''; }
              }
              document.addEventListener('click', function (e) {
                const a = e.target.closest('a');
                if (!a) return;
                if (!isInternal(a)) return;
                const href = a.getAttribute('href') || '';
                if (!href || href.startsWith('#')) return;
                // allow full reload for language switch to refresh header/nav strings
                if (href.includes('lang=')) return;
                // disable PJAX for pages that need full refresh or include page-scoped styles/scripts
                const noPjax = ['/lyrics/', '/texty', '/admin', '/logout', '/login.jsp', '/register.jsp', '/uzivatel.jsp', '/profile.jsp'];
                if (noPjax.some(p => href.includes(p))) return;
                e.preventDefault();
                navigate(href, true);
              });
              window.addEventListener('popstate', (e) => { const url = (e.state && e.state.url) || location.href; navigate(url, false); });
            })();

            // Active navigation highlight
            // Pages that belong to a menu item under another URL
            const navAliases = { 'about.jsp': 'bio.jsp', 'lyric.jsp': 'texty.jsp' };
            function updateActiveNav() {
              let cur = location.pathname.split('/').pop() || 'index.jsp';
              if (location.pathname.startsWith('/lyrics/')) cur = 'texty.jsp';
              cur = navAliases[cur] || cur;
              document.querySelectorAll('header nav a').forEach(a => {
                try {
                  const href = a.getAttribute('href') || '';
                  const normalized = (href.split('?')[0] || '').split('/').pop() || '';
                  if (!normalized) return;
                  const isActive = ((cur === '' || cur === '/') && (normalized === '/' || normalized === 'index.jsp')) || (cur === normalized || (location.pathname.endsWith('/') && normalized === 'index.jsp'));
                  a.classList.toggle('active', isActive);
                } catch { }
              });
            }
            updateActiveNav();
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