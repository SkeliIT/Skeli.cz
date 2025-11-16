<!DOCTYPE html>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
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
    <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
    <link rel="icon" href="/favicon.ico" type="image/x-icon" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Alumni+Sans+Pinstripe:ital@0;1&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Bruno+Ace+SC&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Comforter+Brush&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
    <!-- Slick Carousel CSS -->
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick.css"/>
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick-theme.css"/>
    <!-- Skeli.cz CSS -->
    <link rel="stylesheet" href="/css/base.css?v=1.0.0">
    <link rel="stylesheet" href="/css/components.css?v=1.0.0">
    <link rel="stylesheet" href="/css/pages.css?v=1.0.0">
    <!-- Light theme extra transparency overrides -->
    <style>
      body.light{ --panel: rgba(255,255,255,0.68); --panel-strong: rgba(255,255,255,0.82); }
      body.light .user-dropdown{ background: rgba(255,255,255,0.86); }
      body.light .sp-bar{ background: rgba(255,255,255,0.80); }
      body.light .sp-minbar{ background: rgba(255,255,255,0.75); }
    </style>
    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <!-- Slick Carousel JS -->
    <script src="https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick.min.js"></script>
<%@ include file="/WEB-INF/i18n/i18n.jspf" %>
<%
  String __csrf = (String) session.getAttribute("csrf");
  if (__csrf == null) { __csrf = java.util.UUID.randomUUID().toString(); session.setAttribute("csrf", __csrf); }
  request.setAttribute("csrf", __csrf);
%>
<header>

   <div id="topClock" class="bruno-ace-sc-regular" style="position:absolute; left:14px; top:8px; font-size:0.525em; padding:3px 6px; border-radius:6px; background: rgba(0,0,0,0.20); opacity:0.45; box-shadow: 0 1px 6px rgba(0,0,0,.10);"></div>

   <h1 class="comforter-brush-regular">SKELOSQUAD</h1>
   <nav class="bruno-ace-sc-regular">
        <a href="/index.jsp"><%= ((java.util.Properties)request.getAttribute("t")).getProperty("menu.home","Home") %></a> |
        <a href="/bio.jsp"><%= ((java.util.Properties)request.getAttribute("t")).getProperty("menu.about","About") %></a> |
        <a href="/music.jsp"><%= ((java.util.Properties)request.getAttribute("t")).getProperty("menu.music","Music") %></a> |
        <a href="/aktuality.jsp">Aktuality</a> |
        <a href="/texty.jsp"><%= ((java.util.Properties)request.getAttribute("t")).getProperty("menu.lyrics","Lyrics") %></a>
    </nav>
    <div class="top-controls" style="position:absolute; top:10px; right:14px; font-size:0.8em; display:flex; gap:6px; align-items:center;">
        <% String currentUser = (String) session.getAttribute("username"); String currentRole = (String) session.getAttribute("role"); %>
        <a href="/donate.jsp" class="bruno-ace-sc-regular" style="color:#CC2B2B; font-weight:600; padding:3px 8px; display:inline-flex; align-items:center; gap:6px; text-decoration:none;" title="Donate"><i class="fa-solid fa-heart"></i><span style="font-size:0.95em; letter-spacing:.3px;">Donate</span></a>
        <button id="fontToggle" title="Tloušťka textu" class="bruno-ace-sc-regular" style="background:transparent;border:1px solid rgba(255,215,0,0.4);color:#ffd700;padding:3px 8px;border-radius:6px;cursor:pointer;font-size:0.95em;display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-bold"></i></button>
        <button id="themeToggle" title="Přepnout světlý/tmavý" class="bruno-ace-sc-regular" style="background:transparent;border:1px solid rgba(255,215,0,0.4);color:#ffd700;padding:3px 8px;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-circle-half-stroke"></i></button>
        <div class="lang-switch">
          <button class="lang-btn bruno-ace-sc-regular" title="Jazyk" style="background:transparent;border:1px solid rgba(255,215,0,0.4);color:#ffd700;padding:3px 8px;border-radius:6px;cursor:pointer;font-size:0.95em;display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-language"></i></button>
          <ul class="menu">
             <li><a href="?lang=cs">Čeština 🇨🇿</a></li>
             <li><a href="?lang=en">English 🇬🇧</a></li>
             <li><a href="?lang=de">Deutsch 🇩🇪</a></li>
             <li><a href="?lang=uk">Українська 🇺🇦</a></li>
          </ul>
        </div>
        <% if (currentUser == null) { %>
            <a href="/login.jsp" class="bruno-ace-sc-regular" style="color:white; padding:3px 8px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;" title="Přihlásit"><i class="fa-solid fa-right-to-bracket"></i><span style="font-size:0.95em; letter-spacing:.3px;">Login</span></a>
            <span style="color:rgba(255,255,255,0.5);">|</span>
            <a href="/register.jsp" class="bruno-ace-sc-regular" style="color:white; padding:3px 8px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;" title="Registrace"><i class="fa-solid fa-user-plus"></i><span style="font-size:0.95em; letter-spacing:.3px;">Register</span></a>
        <% } else { %>
            <div class="user-menu" style="position:relative; display:inline-block;">
              <span style="color:white; cursor:pointer; padding:3px 6px; font-size:0.95em;">👤 <%= currentUser %><% if ("ADMIN".equals(currentRole)) { %> <span style="color:var(--accent);">★</span><% } %></span>
              <div class="user-dropdown" style="display:none; position:absolute; right:0; top:100%; background:var(--panel-strong); border:1px solid var(--panel-border); border-radius:8px; padding:6px; min-width:140px; z-index:1000;">
                <a href="/profile.jsp" style="display:block; padding:6px 8px; text-decoration:none;">Profil</a>
                <a href="/uzivatel.jsp" style="display:block; padding:6px 8px; text-decoration:none;">Nastavení</a>
                <% if ("ADMIN".equals(currentRole)) { %><a href="/admin.jsp" class="admin" style="display:block; padding:6px 8px; text-decoration:none;">Admin</a><% } %>
                <a href="/logout" style="display:block; padding:6px 8px; text-decoration:none;">Odhlásit</a>
              </div>
            </div>
        <% } %>
    </div>
</header>
<script>
  (function(){
    const fwKey='fontWeight';
    // Digital clock with locale based on session lang
    const sessionLang = (function(){ try { return '<% String __lang = (String) session.getAttribute("lang"); if (__lang == null) __lang = "cs"; out.print(__lang); %>'; } catch(e){ return 'cs'; } })();
    const localeMap = { cs:'cs-CZ', en:'en-GB', de:'de-DE', uk:'uk-UA' };
    function updateClock(){
      const el = document.getElementById('topClock'); if(!el) return;
      const now = new Date();
      const loc = localeMap[sessionLang] || sessionLang || undefined;
      const d = new Intl.DateTimeFormat(loc, { weekday:'long', day:'2-digit', month:'long', year:'numeric'}).format(now);
      const t = new Intl.DateTimeFormat(loc, { hour:'2-digit', minute:'2-digit', second:'2-digit'}).format(now);
      el.textContent = d + ' • ' + t;
    }
    updateClock(); setInterval(updateClock, 1000);
    const body=document.body; const curFw=localStorage.getItem(fwKey)||'400';
    document.documentElement.style.setProperty('--fw', curFw);
    document.getElementById('fontToggle').addEventListener('click',()=>{
      const newFw=(getComputedStyle(document.documentElement).getPropertyValue('--fw').trim()==='400')?'600':'400';
      document.documentElement.style.setProperty('--fw', newFw);
      localStorage.setItem(fwKey,newFw);
    });
    const k='theme';
    const cur=localStorage.getItem(k)||'dark';
    body.classList.add(cur);
    document.getElementById('themeToggle').addEventListener('click',()=>{
      body.classList.toggle('light'); body.classList.toggle('dark');
      const v=body.classList.contains('light')?'light':'dark'; localStorage.setItem(k,v);
    });

    // Language menu toggle by click
    const langSwitch=document.querySelector('.lang-switch');
    const langBtn=document.querySelector('.lang-switch .lang-btn');
    if (langBtn && langSwitch) {
      langBtn.addEventListener('click', (e)=>{ e.stopPropagation(); langSwitch.classList.toggle('open'); });
      document.addEventListener('click', ()=>{ langSwitch.classList.remove('open'); });
      langSwitch.querySelectorAll('.menu a').forEach(a=>a.addEventListener('click', ()=>{ langSwitch.classList.remove('open'); }));
    }
    // User menu dropdown on hover
    const userMenu=document.querySelector('.user-menu');
    const userDropdown=document.querySelector('.user-dropdown');
    if (userMenu && userDropdown) {
      userMenu.addEventListener('mouseenter', ()=>{ userDropdown.style.display='block'; });
      userMenu.addEventListener('mouseleave', ()=>{ userDropdown.style.display='none'; });
    }

    // Persistent Spotify bottom bar
    function ensureSpBar(){
      if(document.getElementById('sp-bar')) return document.getElementById('sp-bar');
      const bar=document.createElement('div'); bar.id='sp-bar'; bar.className='sp-bar';
      bar.innerHTML = "<div class='sp-inner'><button id='sp-hide' class='sp-hide' title='Skrýt přehrávač'>▼</button><iframe id='sp-iframe' class='sp-iframe' allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture' loading='lazy'></iframe></div>";
      document.body.appendChild(bar);
      const min=document.createElement('div'); min.id='sp-min'; min.className='sp-minbar'; min.innerHTML='<i class="fab fa-spotify"></i> Spotify';
      document.body.appendChild(min);
      document.getElementById('sp-hide').addEventListener('click', ()=>closeBar());
      min.addEventListener('click', ()=>openBar());
      return bar;
    }
    function normalizeSrc(input){
      if(!input) return null;
      if(/^https?:\/\//.test(input)) return input;
      // short forms: track:ID, playlist:ID, album:ID, artist:ID
      const [type,id] = input.split(':');
      if(id){ return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator`; }
      return `https://open.spotify.com/embed/track/${input}?utm_source=generator`;
    }
    const SP_DEFAULT = 'https://open.spotify.com/embed/artist/5IouXw8U9uKCTwmncG5bUl?utm_source=generator';
    function openBar(){ const bar=ensureSpBar(); const f=document.getElementById('sp-iframe'); if(!f.src){ const saved=localStorage.getItem('sp_src'); f.src=saved||SP_DEFAULT; } bar.style.display='block'; document.getElementById('sp-min').style.display='none'; localStorage.setItem('sp_min','0'); }
    function closeBar(){ const bar=ensureSpBar(); bar.style.display='none'; const m=document.getElementById('sp-min'); m.style.display='block'; m.innerHTML='<i class="fab fa-spotify"></i> Spotify'; localStorage.setItem('sp_min','1'); }
    window.toggleSpotifyBar=function(){ if(ensureSpBar().style.display==='none'){ openBar(); } else { closeBar(); } }
    window.playSpotify=function(src){ const bar=ensureSpBar(); const url=normalizeSrc(src); const f=document.getElementById('sp-iframe'); if(f.src!==url) f.src=url; openBar(); localStorage.setItem('sp_src', url); localStorage.setItem('sp_play','true'); };

    // Restore state on every page
    (function(){ const bar=ensureSpBar(); const wasMin=localStorage.getItem('sp_min')==='1'; const saved=localStorage.getItem('sp_src'); const f=document.getElementById('sp-iframe'); if(saved){ f.src=saved; }
      if((saved||SP_DEFAULT) && !wasMin){ f.src=f.src||SP_DEFAULT; bar.style.display='block'; document.getElementById('sp-min').style.display='none'; }
      else { bar.style.display='none'; const m=document.getElementById('sp-min'); m.style.display='block'; m.innerHTML='<i class="fab fa-spotify"></i> Spotify'; }
    })();

    // Autowire any element with data-spotify-src
    document.addEventListener('click', function(e){ const t=e.target.closest('[data-spotify-src]'); if(t){ e.preventDefault(); window.playSpotify(t.getAttribute('data-spotify-src')); }});

    // Lightweight PJAX navigation to preserve global UI (Spotify bar)
    (function(){
      const ORIGIN = location.origin;
      function isInternal(a){ try{ const u=new URL(a.href, ORIGIN); return u.origin===ORIGIN && !a.hasAttribute('download') && (!a.target || a.target==='_self'); }catch{return false;} }
      function extractMain(html){
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const main = doc.querySelector('main');
        return main ? main : doc.body;
      }
      async function navigate(url, push){
        try{
          document.body.style.cursor='progress';
          const res = await fetch(url, {headers:{'X-Requested-With':'fetch'}});
          const text = await res.text();
          const newMain = extractMain(text);
          if(!newMain) return location.assign(url);
          const curMain = document.querySelector('main');
          if(curMain){ curMain.replaceWith(newMain); } else { document.body.appendChild(newMain); }
          const titleMatch = text.match(/<title>([\s\S]*?)<\/title>/i); if(titleMatch) document.title = titleMatch[1];
          // re-execute inline scripts in main
          newMain.querySelectorAll('script').forEach(old => { const s=document.createElement('script'); if(old.src){ s.src=old.src; } else { s.textContent=old.textContent; } (old.type && (s.type=old.type)); old.replaceWith(s); });
          if(push) history.pushState({url}, '', url);
          window.scrollTo({top:0, behavior:'smooth'});
          document.dispatchEvent(new CustomEvent('pjax:done', {detail:{url}}));
        }catch(e){ location.assign(url); }
        finally{ document.body.style.cursor=''; }
      }
      document.addEventListener('click', function(e){
        const a = e.target.closest('a');
        if(!a) return;
        if(!isInternal(a)) return;
        const href = a.getAttribute('href') || '';
        if(!href || href.startsWith('#')) return;
        // allow full reload for language switch to refresh header/nav strings
        if(href.includes('lang=')) return;
        // disable PJAX for pages that need full refresh or include page-scoped styles/scripts
        const noPjax = ['/lyrics/', '/texty', '/admin', '/logout', '/login.jsp', '/register.jsp', '/uzivatel.jsp', '/profile.jsp'];
        if (noPjax.some(p => href.includes(p))) return;
        e.preventDefault();
        navigate(href, true);
      });
      window.addEventListener('popstate', (e)=>{ const url = (e.state && e.state.url) || location.href; navigate(url, false); });
    })();

    // Active navigation highlight
    function updateActiveNav(){
      const cur = location.pathname.split('/').pop() || 'index.jsp';
      document.querySelectorAll('header nav a').forEach(a=>{
        try{
          const href = a.getAttribute('href') || '';
          const normalized = href.split('?')[0];
          if(!normalized) return;
          const isActive = ((cur === '' || cur === '/') && (normalized === '/' || normalized === 'index.jsp')) || (cur === normalized || (location.pathname.endsWith('/') && normalized === 'index.jsp'));
          a.classList.toggle('active', isActive);
        }catch{}
      });
    }
    updateActiveNav();
    document.addEventListener('pjax:done', updateActiveNav);

    // Parallax background
    (function(){
      let lastY=0, ticking=false;
      function onScroll(){ lastY=window.scrollY||0; if(!ticking){ requestAnimationFrame(()=>{ document.body.style.backgroundPosition = `center ${Math.round(lastY*0.25)}px`; ticking=false; }); ticking=true; } }
      window.addEventListener('scroll', onScroll, {passive:true});
      onScroll();
    })();

    // Reveal animations
    (function(){
      const io = new IntersectionObserver((entries)=>{
        entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('show'); io.unobserve(e.target); } });
      }, {threshold:0.1});
      function bind(root){ (root||document).querySelectorAll('[data-reveal], .reveal').forEach(el=>{ el.classList.add('reveal'); io.observe(el); }); }
      bind(document);
      document.addEventListener('pjax:done', (e)=>{ bind(document.querySelector('main')||document); });
    })();

  })();
</script>
