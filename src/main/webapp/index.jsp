<%@ page import="java.sql.*" %>
<%@ page import="com.github.skeliit.Db" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<%
  // Newest clips (hero card + news) and songs with lyrics (the running tapes)
  java.util.List<com.github.skeliit.dao.HomeDao.HomeVideo> homeVideos = java.util.List.of();
  java.util.List<com.github.skeliit.dao.HomeDao.TapeSong> tapeSongs = java.util.List.of();
  boolean homeDbError = false;
  try {
    com.github.skeliit.dao.HomeDao homeDao = new com.github.skeliit.dao.HomeDao();
    homeVideos = homeDao.latestVideos(5);
    tapeSongs = homeDao.songsWithLyrics();
  } catch (SQLException ex) {
    homeDbError = true;
  }
  java.time.format.DateTimeFormatter dateFmt = java.time.format.DateTimeFormatter
      .ofLocalizedDate(java.time.format.FormatStyle.MEDIUM).withLocale(java.util.Locale.forLanguageTag(cur));
  com.github.skeliit.dao.HomeDao.HomeVideo latest = homeVideos.isEmpty() ? null : homeVideos.get(0);
%>
<main class="home-page">
  <section class="hero">
    <div class="hero-particles" aria-hidden="true"></div>
    <%-- first glance: this is Skeli's music --%>
    <p class="hero-kicker"><span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span><%= t.getProperty("home.kicker") %></p>
    <h1 class="hero-title"><span class="logo-mark" aria-hidden="true"></span><span class="sr-only">Skeli – SKELOSQUAD</span></h1>
    <p class="hero-tagline"><%= t.getProperty("home.lead") %></p>
    <div class="hero-actions">
      <button type="button" class="btn btn-primary btn-lg" data-spotify-src="artist:5IouXw8U9uKCTwmncG5bUl">
        <i class="fab fa-spotify"></i> <%= t.getProperty("home.cta.listen") %>
      </button>
      <a class="btn btn-lg btn-ghost" href="/texty.jsp">
        <i class="fa-solid fa-align-left"></i> <%= t.getProperty("home.cta.lyrics") %>
      </a>
    </div>
    <% if (latest != null) {
         String latestId = com.github.skeliit.WebUtils.escapeHtml(latest.youtubeId());
         String latestTitle = latest.title() == null ? "YouTube" : latest.title(); %>
    <a class="hero-latest" href="https://www.youtube.com/watch?v=<%= latestId %>" target="_blank" rel="noopener">
      <img src="https://i.ytimg.com/vi/<%= latestId %>/mqdefault.jpg" alt="" width="104" height="58">
      <span><small><span class="dot"></span><%= t.getProperty("home.latest") %></small><b><%= com.github.skeliit.WebUtils.escapeHtml(latestTitle) %></b></span>
      <span class="play"><i class="fa-solid fa-play"></i></span>
    </a>
    <% } %>
    <div class="social-row hero-social">
      <a class="social-btn fb" href="https://www.facebook.com/mcskeli/" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
      <a class="social-btn ig" href="https://www.instagram.com/skeli.official/" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
      <a class="social-btn yt" href="https://www.youtube.com/@Skeli" target="_blank" rel="noopener" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
      <a class="social-btn sp" href="https://open.spotify.com/artist/5IouXw8U9uKCTwmncG5bUl" target="_blank" rel="noopener" aria-label="Spotify"><i class="fab fa-spotify"></i></a>
    </div>
  </section>

  <% if (!tapeSongs.isEmpty()) { %>
  <%-- two crossed tapes with the song names, running in opposite directions --%>
  <section class="tapes" aria-label="<%= t.getProperty("home.songs") %>">
    <div class="tape tape-gold"><div class="marquee-track">
      <span class="tape-name">SKELI</span><i aria-hidden="true">✦</i>
      <% for (com.github.skeliit.dao.HomeDao.TapeSong s : tapeSongs) { %><a href="<%= com.github.skeliit.WebUtils.escapeHtml(s.href()) %>"><%= com.github.skeliit.WebUtils.escapeHtml(s.name()) %></a><i aria-hidden="true">✦</i><% } %>
    </div></div>
    <div class="tape tape-dark" aria-hidden="true"><div class="marquee-track reverse">
      <% for (com.github.skeliit.dao.HomeDao.TapeSong s : tapeSongs) {
           String img = s.thumb(); %>
      <a href="<%= com.github.skeliit.WebUtils.escapeHtml(s.href()) %>" tabindex="-1"><% if (img != null) { %><img src="<%= com.github.skeliit.WebUtils.escapeHtml(img) %>" alt="" loading="lazy"><% } %><%= com.github.skeliit.WebUtils.escapeHtml(s.name()) %><% if (s.year() != null) { %> <small><%= s.year() %></small><% } %></a>
      <% } %>
    </div></div>
  </section>
  <% } %>

  <section class="feature-grid" data-reveal>
    <a class="feature-card" href="/music.jsp">
      <span class="feature-icon"><i class="fas fa-music"></i></span>
      <h3><%= t.getProperty("tile.music.title","Music") %></h3>
      <p><%= t.getProperty("tile.music.desc","YouTube videos and Spotify playlist.") %></p>
      <span class="feature-arrow"><i class="fa-solid fa-arrow-right"></i></span>
    </a>
    <a class="feature-card" href="/texty.jsp">
      <span class="feature-icon"><i class="fas fa-align-left"></i></span>
      <h3><%= t.getProperty("tile.lyrics.title","Lyrics") %></h3>
      <p><%= t.getProperty("tile.lyrics.desc","Browse lyrics, vote and comment.") %></p>
      <span class="feature-arrow"><i class="fa-solid fa-arrow-right"></i></span>
    </a>
    <a class="feature-card" href="/about.jsp">
      <span class="feature-icon"><i class="fas fa-user"></i></span>
      <h3><%= t.getProperty("tile.about.title","About") %></h3>
      <p><%= t.getProperty("tile.about.desc","Who I am and how I create.") %></p>
      <span class="feature-arrow"><i class="fa-solid fa-arrow-right"></i></span>
    </a>
  </section>

  <section class="home-grid" data-reveal>
    <div class="home-main">
      <div class="section-head">
        <h2><%= t.getProperty("home.news","Novinky") %></h2>
        <a href="/music.jsp"><%= t.getProperty("menu.music") %> <i class="fa-solid fa-arrow-right"></i></a>
      </div>
      <div class="videos">
        <% if (homeDbError) { %>
          <div class="empty-note"><%= t.getProperty("home.news.error") %></div>
        <% } else if (homeVideos.isEmpty()) { %>
          <div class="empty-note"><%= t.getProperty("home.news.none","Žádná videa k zobrazení.") %></div>
        <% }
           for (com.github.skeliit.dao.HomeDao.HomeVideo v : homeVideos) {
             String vid = com.github.skeliit.WebUtils.escapeHtml(v.youtubeId());
             String title = v.title() == null ? "" : com.github.skeliit.WebUtils.escapeHtml(v.title());
             String dateStr = v.published() == null ? "" : dateFmt.format(v.published().toLocalDateTime().toLocalDate());
             boolean big = v == latest; %>
          <a class="video<%= big ? " video-featured" : "" %>" href="https://www.youtube.com/watch?v=<%= vid %>" target="_blank" rel="noopener">
            <div class="video-thumb">
              <img src="https://img.youtube.com/vi/<%= vid %>/<%= big ? "maxresdefault" : "hqdefault" %>.jpg" alt="<%= title %>" loading="lazy"<% if (big) { %> onerror="this.onerror=null;this.src=this.src.replace('maxresdefault','hqdefault')"<% } %>>
              <span class="video-play"><i class="fa-solid fa-play"></i></span>
            </div>
            <div class="meta">
              <% if (big) { %><span class="video-badge"><%= t.getProperty("home.latest") %></span><% } %>
              <div class="video-title"><% if (title.isEmpty()) { %><i class="fab fa-youtube icon-youtube"></i> YouTube<% } else { %><%= title %><% } %></div>
              <% if (!dateStr.isEmpty()) { %><div class="video-date"><%= dateStr %></div><% } %>
            </div>
            <button type="button" class="share-btn" data-url="https://www.youtube.com/watch?v=<%= vid %>" title="<%= t.getProperty("common.share") %>"><%= t.getProperty("common.share") %></button>
          </a>
        <% } %>
      </div>
    </div>

    <aside class="home-aside">
      <div class="card side-card">
        <h3><i class="fa-solid fa-microphone-lines"></i> <%= t.getProperty("home.concerts","Koncerty") %></h3>
        <p class="text-dim"><%= t.getProperty("home.concerts.none","Zatím nejsou naplánovány žádné koncerty.") %></p>
      </div>

      <div class="card side-card">
        <h3><i class="fa-solid fa-bullhorn"></i> <%= t.getProperty("home.social") %></h3>
        <div id="home-social" class="home-social-grid"></div>
        <a class="side-link" href="/aktuality.jsp"><%= t.getProperty("home.allNews") %></a>
      </div>

      <div class="card side-card newsletter">
        <h3><i class="fa-solid fa-envelope"></i> <%= t.getProperty("home.newsletter.title","Novinky e-mailem") %></h3>
        <form method="post" action="/newsletter/subscribe" class="newsletter-form">
          <input type="hidden" name="csrf" value="<%= request.getAttribute("csrf") %>">
          <input type="email" name="email" placeholder="<%= t.getProperty("home.newsletter.placeholder","Tvůj e-mail") %>" required>
          <div class="hp-field" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
          <button type="submit"><%= t.getProperty("home.newsletter.submit","Odebírat") %></button>
        </form>
      </div>
    </aside>
  </section>

<script>
  // Load social posts for home page
  (async function(){
    try{
      const res = await fetch('/api/social-posts?onePerSource=true');
      if(!res.ok) return;
      const posts = await res.json();
      if(!Array.isArray(posts)||!posts.length) return;
      const el = document.getElementById('home-social');
      if(!el) return;
      const esc = v => String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
      // http(s) links, or paths on this site (downloaded Instagram images); never "//host" or "javascript:"
      const safeUrl = u => /^(https?:\/\/|\/(?!\/))/i.test(u||'') ? esc(u) : '#';
      el.innerHTML = posts.map(p=>{
        const img = p.image?`<img src="\${safeUrl(p.image)}" class="home-social-img" alt="" loading="lazy">`:'';
        const cap = esc((p.caption||'').slice(0,120));
        const badge = p.source==='instagram'?'<i class="fab fa-instagram"></i>':(p.source==='facebook'?'<i class="fab fa-facebook"></i>':'<i class="fa-solid fa-newspaper"></i>');
        return `<a href="\${safeUrl(p.permalink)}" target="_blank" rel="noopener" class="home-social-link">\${img}<span class="home-social-badge">\${badge}</span><div class="home-social-caption">\${cap}</div></a>`;
      }).join('');
    }catch(e){}
  })();

  // Share button handler (bound once, survives PJAX navigation back to this page)
  if (!window.__skeliShareBound) {
    window.__skeliShareBound = true;
    document.addEventListener('click', function(e){
      const btn = e.target.closest('.share-btn');
      if(!btn) return;
      e.preventDefault(); e.stopPropagation();
      const url = btn.getAttribute('data-url');
      if (navigator.share) {
        navigator.share({ title: document.title, url }).catch(()=>{});
      } else {
        navigator.clipboard.writeText(url).then(()=>{ const old = btn.textContent; btn.textContent='<%= com.github.skeliit.WebUtils.escapeJs(t.getProperty("common.copied")) %>'; setTimeout(()=>btn.textContent=old,1200); });
      }
    });
  }
</script>
</main>

<%@ include file="includes/footer.jsp" %>
