<%@ page import="java.sql.*" %>
<%@ page import="com.github.skeliit.Db" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<main class="home-page">
  <section class="hero">
    <h1 class="hero-title"><span class="logo-mark" aria-hidden="true"></span><span class="sr-only">SKELOSQUAD</span></h1>
    <p class="hero-tagline"><%= t.getProperty("index.hero","Official website – music, lyrics, news.") %></p>
    <div class="hero-actions">
      <button type="button" class="btn btn-primary btn-lg" data-spotify-src="artist:5IouXw8U9uKCTwmncG5bUl">
        <i class="fab fa-spotify"></i> <%= t.getProperty("home.cta.listen") %>
      </button>
      <a class="btn btn-lg btn-ghost" href="/texty.jsp">
        <i class="fa-solid fa-align-left"></i> <%= t.getProperty("home.cta.lyrics") %>
      </a>
    </div>
    <div class="social-row hero-social">
      <a class="social-btn fb" href="https://www.facebook.com/mcskeli/" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
      <a class="social-btn ig" href="https://www.instagram.com/skeli.official/" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
      <a class="social-btn yt" href="https://www.youtube.com/@Skeli" target="_blank" rel="noopener" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
      <a class="social-btn sp" href="https://open.spotify.com/artist/5IouXw8U9uKCTwmncG5bUl" target="_blank" rel="noopener" aria-label="Spotify"><i class="fab fa-spotify"></i></a>
    </div>
  </section>

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
        <%
          // Title falls back to the linked song name; videos without either show just "YouTube"
          String sql = "SELECT v.youtube_id, v.title, v.published_at, s.name FROM videos v LEFT JOIN songs s ON s.id = v.song_id ORDER BY v.published_at DESC, v.id DESC LIMIT 4";
          java.time.format.DateTimeFormatter dateFmt = java.time.format.DateTimeFormatter
              .ofLocalizedDate(java.time.format.FormatStyle.MEDIUM).withLocale(java.util.Locale.forLanguageTag(cur));
          try (Connection conn = Db.get()){
            if (conn != null){
              try (PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()){
                while (rs.next()){
                  String vid = com.github.skeliit.WebUtils.escapeHtml(rs.getString(1));
                  String rawTitle = com.github.skeliit.VideoTitles.display(rs.getString(2));
                  if (rawTitle == null) rawTitle = rs.getString(4);
                  String title = rawTitle == null ? "" : com.github.skeliit.WebUtils.escapeHtml(rawTitle);
                  java.sql.Timestamp ts = rs.getTimestamp(3);
                  String dateStr = ts == null ? "" : dateFmt.format(ts.toLocalDateTime().toLocalDate());
        %>
                  <a class="video" href="https://www.youtube.com/watch?v=<%= vid %>" target="_blank" rel="noopener">
                    <div class="video-thumb">
                      <img src="https://img.youtube.com/vi/<%= vid %>/hqdefault.jpg" alt="<%= title %>" loading="lazy">
                      <span class="video-play"><i class="fa-solid fa-play"></i></span>
                    </div>
                    <div class="meta">
                      <div class="video-title"><% if (title.isEmpty()) { %><i class="fab fa-youtube icon-youtube"></i> YouTube<% } else { %><%= title %><% } %></div>
                      <% if (!dateStr.isEmpty()) { %><div class="video-date"><%= dateStr %></div><% } %>
                    </div>
                    <button type="button" class="share-btn" data-url="https://www.youtube.com/watch?v=<%= vid %>" title="<%= t.getProperty("common.share") %>"><%= t.getProperty("common.share") %></button>
                  </a>
        <%
                }
              }
            } else {
        %>
              <div class="empty-note"><%= t.getProperty("home.news.none","Žádná videa k zobrazení.") %></div>
        <%
            }
          } catch (SQLException ex) {
        %>
            <div class="empty-note"><%= t.getProperty("home.news.error") %></div>
        <%
          }
        %>
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
