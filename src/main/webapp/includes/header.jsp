<!DOCTYPE html>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%
  String ctx = request.getContextPath();
  if (ctx == null) {
    ctx = "";
  }
  String assetVersion = "1.0.1";
%>
  <html lang="cs-cz">

  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, viewport-fit=cover">
    <title>Skeli — oficiální web</title>
    <meta name="description" content="Skeli — hudba, texty, videa a novinky" />
    <meta name="keywords" content="Skeli, hudba, rap, videoklipy, texty" />
    <meta name="author" content="Skeli" />
    <meta property="og:title" content="Skeli — oficiální web" />
    <meta property="og:description" content="Poslouchej hudbu, sleduj klipy a čti texty" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="/" />
    <link rel="shortcut icon" href="<%= ctx %>/favicon.ico" type="image/x-icon" />
    <link rel="icon" href="<%= ctx %>/favicon.ico" type="image/x-icon" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Alumni+Sans+Pinstripe:ital@0;1&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Bruno+Ace+SC&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Comforter+Brush&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
    <!-- Slick Carousel CSS -->
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick.css" />
    <link rel="stylesheet" type="text/css"
      href="https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick-theme.css" />
    <!-- Skeli.cz CSS -->
    <link rel="stylesheet" href="<%= ctx %>/css/base.css?v=<%= assetVersion %>">
    <link rel="stylesheet" href="<%= ctx %>/css/components.css?v=<%= assetVersion %>">
    <link rel="stylesheet" href="<%= ctx %>/css/pages.css?v=<%= assetVersion %>">
    <!-- Light theme extra transparency overrides -->
    <style>
      body.light {
        --panel: rgba(255, 255, 255, 0.68);
        --panel-strong: rgba(255, 255, 255, 0.82);
      }

      body.light .user-dropdown {
        background: rgba(255, 255, 255, 0.86);
      }

      body.light .sp-bar {
        background: rgba(255, 255, 255, 0.80);
      }

      body.light .sp-minbar {
        background: rgba(255, 255, 255, 0.75);
      }

      /* Global soft top fade for main panel (removes sharp edge) */
      main {
        background: linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0.22) 0%,
          var(--panel) 56px,
          var(--panel) 100%
        );
        border-top-color: transparent;
      }

      body.light main {
        background: linear-gradient(
          to bottom,
          rgba(255, 255, 255, 0.48) 0%,
          var(--panel) 56px,
          var(--panel) 100%
        );
      }

      /* Donate headline - more subtle size */
      .donate-title {
        font-size: clamp(1.45rem, 2.5vw, 2.2rem);
        letter-spacing: 0.09em;
      }

      @media (max-width: 600px) {
        #topClock {
          display: none !important;
        }
      }

      @media (min-width: 601px) and (max-width: 1100px) {
        #topClock {
          font-size: 0.45em !important;
          left: 10px !important;
          top: 4px !important;
        }
      }

      header {
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }

      /* Hamburger Menu Styles */
      .menu-toggle {
        display: none;
        background: transparent;
        border: 1px solid var(--panel-border);
        color: gold;
        padding: 6px 12px;
        border-radius: 8px;
        cursor: pointer;
        position: absolute;
        left: 14px;
        top: 10px;
        z-index: 1001;
      }

      @media (max-width: 850px) {
        .menu-toggle {
          display: block;
        }

        header nav {
          display: none;
          flex-direction: column;
          background: var(--panel-strong);
          position: absolute;
          top: 60px;
          left: 0;
          width: 100%;
          padding: 20px 0;
          border-bottom: 1px solid var(--panel-border);
          backdrop-filter: blur(15px);
        }

        header nav.open {
          display: flex;
        }

        header nav a {
          padding: 10px;
          margin: 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
      }
    </style>
    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <!-- Slick Carousel JS -->
    <script src="https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick.min.js"></script>
    <%@ include file="/WEB-INF/i18n/i18n.jspf" %>
  </head>
  <body>
      <% String __csrf=(String) session.getAttribute("csrf"); if (__csrf==null) {
        __csrf=java.util.UUID.randomUUID().toString(); session.setAttribute("csrf", __csrf); }
        request.setAttribute("csrf", __csrf); %>
        <header>

          <div id="topClock" class="bruno-ace-sc-regular"
            style="position:absolute; left:14px; top:8px; font-size:0.525em; padding:3px 6px; border-radius:6px; background: rgba(0,0,0,0.20); opacity:0.45; box-shadow: 0 1px 6px rgba(0,0,0,.10);">
          </div>

          <button class="menu-toggle" id="menuToggle" aria-label="Menu"><i class="fa-solid fa-bars"></i></button>

          <h1 class="comforter-brush-regular">SKELOSQUAD</h1>
          <nav id="mainNav" class="bruno-ace-sc-regular">
            <a href="<%= ctx %>/index.jsp">
              <%= ((java.util.Properties)request.getAttribute("t")).getProperty("menu.home","Home") %>
            </a>
            <a href="<%= ctx %>/bio.jsp">
              <%= ((java.util.Properties)request.getAttribute("t")).getProperty("menu.about","About") %>
            </a>
            <a href="<%= ctx %>/music.jsp">
              <%= ((java.util.Properties)request.getAttribute("t")).getProperty("menu.music","Music") %>
            </a>
            <a href="<%= ctx %>/aktuality.jsp">Aktuality</a>
            <a href="<%= ctx %>/texty.jsp">
              <%= ((java.util.Properties)request.getAttribute("t")).getProperty("menu.lyrics","Lyrics") %>
            </a>
          </nav>
          <div class="top-controls"
            style="position:absolute; top:10px; right:14px; font-size:0.8em; display:flex; gap:6px; align-items:center;">
            <% String currentUser=(String) session.getAttribute("username"); String currentRole=(String)
              session.getAttribute("role"); %>
              <a href="<%= ctx %>/donate.jsp" class="bruno-ace-sc-regular"
                style="color:#CC2B2B; font-weight:600; padding:3px 8px; display:inline-flex; align-items:center; gap:6px;"
                title="Donate"><i class="fa-solid fa-heart"></i><span
                  style="font-size:0.95em; letter-spacing:.3px;">Donate</span></a>
              <button id="fontToggle" title="Tloušťka textu" class="bruno-ace-sc-regular"
                style="background:transparent;border:1px solid rgba(255,215,0,0.4);color:#ffd700;padding:3px 8px;border-radius:6px;cursor:pointer;font-size:0.95em;display:inline-flex;align-items:center;gap:6px;"><i
                  class="fa-solid fa-bold"></i></button>
              <button id="themeToggle" title="Přepnout světlý/tmavý" class="bruno-ace-sc-regular"
                style="background:transparent;border:1px solid rgba(255,215,0,0.4);color:#ffd700;padding:3px 8px;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;"><i
                  class="fa-solid fa-circle-half-stroke"></i></button>
              <div class="lang-switch">
                <button class="lang-btn bruno-ace-sc-regular" title="Jazyk"
                  style="background:transparent;border:1px solid rgba(255,215,0,0.4);color:#ffd700;padding:3px 8px;border-radius:6px;cursor:pointer;font-size:0.95em;display:inline-flex;align-items:center;gap:6px;"><i
                    class="fa-solid fa-language"></i></button>
                <ul class="menu">
                  <li><a href="?lang=cs">Čeština 🇨🇿</a></li>
                  <li><a href="?lang=en">English 🇬🇧</a></li>
                  <li><a href="?lang=de">Deutsch 🇩🇪</a></li>
                  <li><a href="?lang=uk">Українська 🇺🇦</a></li>
                </ul>
              </div>
             <!--  <% if (currentUser==null) { %>
                <a href="<%= ctx %>/login.jsp" class="bruno-ace-sc-regular"
                  style="color:white; padding:3px 8px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;"
                  title="Přihlásit"><i class="fa-solid fa-right-to-bracket"></i><span
                    style="font-size:0.95em; letter-spacing:.3px;">Login</span></a>
                <span style="color:rgba(255,255,255,0.5);">|</span>
                <a href="<%= ctx %>/register.jsp" class="bruno-ace-sc-regular"
                  style="color:white; padding:3px 8px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;"
                  title="Registrace"><i class="fa-solid fa-user-plus"></i><span
                    style="font-size:0.95em; letter-spacing:.3px;">Register</span></a>
                <% } else { %>
                  <div class="user-menu" style="position:relative; display:inline-block;">
                    <span style="color:white; cursor:pointer; padding:3px 6px; font-size:0.95em;">👤 <%= currentUser %>
                        <% if ("ADMIN".equals(currentRole)) { %> <span style="color:var(--accent);">★</span>
                          <% } %></span>
                    <div class="user-dropdown"
                      style="display:none; position:absolute; right:0; top:100%; background:var(--panel-strong); border:1px solid var(--panel-border); border-radius:8px; padding:6px; min-width:140px; z-index:1000;">
                      <a href="<%= ctx %>/profile.jsp" style="display:block; padding:6px 8px; text-decoration:none;">Profil</a>
                      <a href="<%= ctx %>/uzivatel.jsp"
                        style="display:block; padding:6px 8px; text-decoration:none;">Nastavení</a>
                      <% if ("ADMIN".equals(currentRole)) { %><a href="<%= ctx %>/admin.jsp" class="admin"
                          style="display:block; padding:6px 8px; text-decoration:none;">Admin</a>
                        <% } %>
                          <a href="<%= ctx %>/logout" style="display:block; padding:6px 8px; text-decoration:none;">Odhlásit</a>
                    </div>
                  </div>
                  <% } %> -->
          </div>
        </header>
        <script>
          (function () {
            const fwKey = 'fontWeight';
            // Digital clock with locale based on session lang
            const sessionLang = (function () { try { return '<% String __lang = (String) session.getAttribute("lang"); if (__lang == null) __lang = "cs"; out.print(__lang); %>'; } catch (e) { return 'cs'; } })();
            const localeMap = { cs: 'cs-CZ', en: 'en-GB', de: 'de-DE', uk: 'uk-UA' };
            function updateClock() {
              const el = document.getElementById('topClock'); if (!el) return;
              const now = new Date();
              const loc = localeMap[sessionLang] || sessionLang || undefined;
              const d = new Intl.DateTimeFormat(loc, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(now);
              const t = new Intl.DateTimeFormat(loc, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);
              el.textContent = d + ' • ' + t;
            }
            updateClock(); setInterval(updateClock, 1000);
            const body = document.body; const curFw = localStorage.getItem(fwKey) || '400';
            document.documentElement.style.setProperty('--fw', curFw);
            document.getElementById('fontToggle').addEventListener('click', () => {
              const newFw = (getComputedStyle(document.documentElement).getPropertyValue('--fw').trim() === '400') ? '600' : '400';
              document.documentElement.style.setProperty('--fw', newFw);
              localStorage.setItem(fwKey, newFw);
            });
            const k = 'theme';
            const cur = localStorage.getItem(k) || 'dark';
            body.classList.add(cur);
            document.getElementById('themeToggle').addEventListener('click', () => {
              body.classList.toggle('light'); body.classList.toggle('dark');
              const v = body.classList.contains('light') ? 'light' : 'dark'; localStorage.setItem(k, v);
            });

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
                mainNav.classList.toggle('open');
                menuToggle.querySelector('i').classList.toggle('fa-bars');
                menuToggle.querySelector('i').classList.toggle('fa-xmark');
              });
              document.addEventListener('click', () => mainNav.classList.remove('open'));
            }

            // User menu dropdown on hover
            const userMenu = document.querySelector('.user-menu');
            const userDropdown = document.querySelector('.user-dropdown');
            if (userMenu && userDropdown) {
              userMenu.addEventListener('mouseenter', () => { userDropdown.style.display = 'block'; });
              userMenu.addEventListener('mouseleave', () => { userDropdown.style.display = 'none'; });
            }

            // Persistent Spotify bottom bar
            function ensureSpBar() {
              if (document.getElementById('sp-bar')) return document.getElementById('sp-bar');
              const bar = document.createElement('div'); bar.id = 'sp-bar'; bar.className = 'sp-bar';
              bar.innerHTML = "<div class='sp-inner'><button id='sp-hide' class='sp-hide' title='Skrýt přehrávač'>▼</button><iframe id='sp-iframe' class='sp-iframe' allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture' loading='lazy'></iframe></div>";
              document.body.appendChild(bar);
              const min = document.createElement('div'); min.id = 'sp-min'; min.className = 'sp-minbar'; min.innerHTML = '<i class="fab fa-spotify"></i> Spotify';
              document.body.appendChild(min);
              document.getElementById('sp-hide').addEventListener('click', () => closeBar());
              min.addEventListener('click', () => openBar());
              return bar;
            }
            function normalizeSrc(input) {
              if (!input) return null;
              if (/^https?:\/\//.test(input)) return input;
              // short forms: track:ID, playlist:ID, album:ID, artist:ID
              const [type, id] = input.split(':');
              if (id) { return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator`; }
              return `https://open.spotify.com/embed/track/${input}?utm_source=generator`;
            }
            const SP_DEFAULT = 'https://open.spotify.com/embed/artist/5IouXw8U9uKCTwmncG5bUl?utm_source=generator';
            function openBar() { const bar = ensureSpBar(); const f = document.getElementById('sp-iframe'); if (!f.src) { const saved = localStorage.getItem('sp_src'); f.src = saved || SP_DEFAULT; } bar.style.display = 'block'; document.getElementById('sp-min').style.display = 'none'; localStorage.setItem('sp_min', '0'); }
            function closeBar() { const bar = ensureSpBar(); bar.style.display = 'none'; const m = document.getElementById('sp-min'); m.style.display = 'block'; m.innerHTML = '<i class="fab fa-spotify"></i> Spotify'; localStorage.setItem('sp_min', '1'); }
            window.toggleSpotifyBar = function () { if (ensureSpBar().style.display === 'none') { openBar(); } else { closeBar(); } }
            window.playSpotify = function (src) { const bar = ensureSpBar(); const url = normalizeSrc(src); const f = document.getElementById('sp-iframe'); if (f.src !== url) f.src = url; openBar(); localStorage.setItem('sp_src', url); localStorage.setItem('sp_play', 'true'); };

            // Restore state on every page
            (function () {
              const bar = ensureSpBar(); const wasMin = localStorage.getItem('sp_min') === '1'; const saved = localStorage.getItem('sp_src'); const f = document.getElementById('sp-iframe'); if (saved) { f.src = saved; }
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
            function updateActiveNav() {
              const cur = location.pathname.split('/').pop() || 'index.jsp';
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

            // Parallax background
            (function () {
              let lastY = 0, ticking = false;
              function onScroll() { lastY = window.scrollY || 0; if (!ticking) { requestAnimationFrame(() => { document.body.style.backgroundPosition = `center ${Math.round(lastY * 0.25)}px`; ticking = false; }); ticking = true; } }
              window.addEventListener('scroll', onScroll, { passive: true });
              onScroll();
            })();

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