<%@ page import="java.sql.*" %>
<%@ page import="com.github.skeliit.Db" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<main>
  <section style="text-align:center; padding:10px 0 6px;">
    <h2 class="comforter-brush-regular" style="font-size:3rem; margin:0;">SKELOSQUAD</h2>
    <p style="margin:6px 0 0;"><%= ((java.util.Properties)request.getAttribute("t")).getProperty("index.hero","Official website – music, lyrics, news.") %></p>
  </section>
  <section style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:16px; margin-top:14px;">
    <a class="section" href="/music.jsp" style="text-decoration:none; color:inherit; background:rgba(204,43,43,0.25); border:1px solid rgba(204,43,43,0.4); border-radius:12px; padding:16px; transition: all 0.3s ease;">
      <h3><i class="fas fa-music"></i> <%= ((java.util.Properties)request.getAttribute("t")).getProperty("tile.music.title","Music") %></h3>
      <p><%= ((java.util.Properties)request.getAttribute("t")).getProperty("tile.music.desc","YouTube videos and Spotify playlist.") %></p>
    </a>
    <a class="section" href="/texty.jsp" style="text-decoration:none; color:inherit; background:rgba(0,0,0,0.65); border:1px solid var(--panel-border); border-radius:12px; padding:16px; transition: all 0.3s ease;">
      <h3><i class="fas fa-align-left"></i> <%= ((java.util.Properties)request.getAttribute("t")).getProperty("tile.lyrics.title","Lyrics") %></h3>
      <p><%= ((java.util.Properties)request.getAttribute("t")).getProperty("tile.lyrics.desc","Browse lyrics, vote and comment.") %></p>
    </a>
    <a class="section" href="/about.jsp" style="text-decoration:none; color:inherit; background:rgba(0,0,0,0.65); border:1px solid var(--panel-border); border-radius:12px; padding:16px; transition: all 0.3s ease;">
      <h3><i class="fas fa-user"></i> <%= ((java.util.Properties)request.getAttribute("t")).getProperty("tile.about.title","About") %></h3>
      <p><%= ((java.util.Properties)request.getAttribute("t")).getProperty("tile.about.desc","Who I am and how I create.") %></p>
    </a>
  </section>

  <style>
    .news-grid { display:grid; grid-template-columns: 2fr 1fr; gap:16px; margin-top:18px; }
    @media (max-width: 800px){ .news-grid { grid-template-columns: 1fr; } }
    .card { background: var(--panel); border:1px solid var(--panel-border); border-radius:12px; padding:16px; box-shadow: 0 6px 18px rgba(0,0,0,0.20); }
    .videos { display:grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap:12px; }
    .video { position:relative; background: rgba(0,0,0,0.55); border:1px solid var(--panel-border); border-radius:10px; overflow:hidden; color: var(--text); text-decoration: none; transition: transform .2s ease, box-shadow .2s ease; }
    .video:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.35); }
    .video img { width:100%; height:128px; object-fit:cover; display:block; }
    .video .meta { padding:8px; font-size:0.95em; }
    .video .share-btn { position:absolute; right:8px; top:8px; border-radius:999px; border:1px solid var(--panel-border); background: rgba(0,0,0,0.35); color:#fff; padding:6px 10px; cursor:pointer; font-size:0.9em; }
    .video .share-btn:hover { background: rgba(0,0,0,0.5); }
    body.light .video .share-btn { background: rgba(0,0,0,0.10); color:#111; }
    .newsletter input[type=email]{ width:100%; box-sizing:border-box; margin-bottom:8px; }
    .newsletter button { background:transparent; border:1px solid var(--panel-border); color:var(--text); padding:6px 10px; border-radius:8px; cursor:pointer; }
    .newsletter button:hover { background: rgba(255,255,255,0.08); }
    .section:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.45) !important; }
    body.light .section:first-child { background:rgba(0,0,0,0.08) !important; border-color: var(--panel-border) !important; }
    body.light .section:not(:first-child) { background:rgba(0,0,0,0.06) !important; }
  </style>

  <section class="news-grid">
    <div class="card">
      <h3 class="bruno-ace-sc-regular" style="margin-top:0;">🗞️ <%= ((java.util.Properties)request.getAttribute("t")).getProperty("home.news","Novinky") %></h3>
      <div class="videos">
        <%
          String sql = "SELECT youtube_id, COALESCE(title, youtube_id) AS title, published_at FROM videos ORDER BY published_at DESC, id DESC LIMIT 3";
          try (Connection conn = Db.get()){
            if (conn != null){
              try (PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()){
                while (rs.next()){
                  String vid = rs.getString(1);
                  String title = rs.getString(2);
                  java.sql.Timestamp ts = rs.getTimestamp(3);
                  String dateStr = ts == null ? "" : new java.text.SimpleDateFormat("yyyy-MM-dd").format(ts);
        %>
                  <a class="video" href="https://www.youtube.com/watch?v=<%= vid %>" target="_blank" rel="noopener">
                    <img src="https://img.youtube.com/vi/<%= vid %>/hqdefault.jpg" alt="<%= title %>">
                    <div class="meta">
                      <div style="font-weight:600;"><%= title %></div>
                      <div style="font-size:0.85em; opacity:0.8;"><%= dateStr %></div>
                    </div>
                    <button type="button" class="share-btn" data-url="https://www.youtube.com/watch?v=<%= vid %>" title="Sdílet">Share</button>
                  </a>
        <%
                }
              }
            } else {
        %>
              <div><%= ((java.util.Properties)request.getAttribute("t")).getProperty("home.news.none","Žádná videa k zobrazení.") %></div>
        <%
            }
          } catch (SQLException ex) {
        %>
            <div>Chyba načítání videí: <%= ex.getMessage() %></div>
        <%
          }
        %>
      </div>
      <hr style="border-color:var(--panel-border); opacity:.4; margin:12px 0;">
      <h4 class="bruno-ace-sc-regular" style="margin:6px 0 8px;">📣 Sociální sítě</h4>
      <div id="home-social" style="display:grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap:12px;"></div>
      <div style="text-align:right; margin-top:8px; font-size:.9em;"><a href="/aktuality.jsp" style="color:var(--text); opacity:.7;">Všechny aktuality →</a></div>
      <script>
        (async function(){
          try{
            const res = await fetch('/api/social-posts?onePerSource=true'); if(!res.ok) return;
            const posts = await res.json(); if(!Array.isArray(posts)||!posts.length) return;
            const el = document.getElementById('home-social'); if(!el) return;
            el.innerHTML = posts.map(p=>{
              const img = p.image?`<img src="\${p.image}" style='width:100%;height:120px;object-fit:cover;display:block;'>`:'';
              const cap = (p.caption||'').slice(0,120);
              const badge = p.source==='instagram'?'<i class="fab fa-instagram"></i>':(p.source==='facebook'?'<i class="fab fa-facebook"></i>':'📰');
              return `<a href='\${p.permalink}' target='_blank' rel='noopener' style='text-decoration:none;color:inherit;border:1px solid var(--panel-border);border-radius:10px;overflow:hidden;background:rgba(0,0,0,0.55);display:block;position:relative;'>\${img}<span style='position:absolute;left:8px;top:8px;background:rgba(0,0,0,0.5);padding:2px 6px;border-radius:6px;font-size:.85em;'>\${badge}</span><div style='padding:8px;font-size:.95em;'>\${cap}</div></a>`;
            }).join('');
          }catch(e){}
        })();
      </script>
    </div>
    <div class="card">
      <h3 class="bruno-ace-sc-regular" style="margin-top:0;">🎤 <%= ((java.util.Properties)request.getAttribute("t")).getProperty("home.concerts","Koncerty") %></h3>
      <ul style="margin:0; padding-left:18px;">
        <li><%= ((java.util.Properties)request.getAttribute("t")).getProperty("home.concerts.none","Zatím nejsou naplánovány žádné koncerty.") %></li>
      </ul>
      <hr style="border-color:var(--panel-border); opacity:.5;">
      <div class="newsletter">
        <h4 style="margin:6px 0 8px;">📧 <%= ((java.util.Properties)request.getAttribute("t")).getProperty("home.newsletter.title","Novinky e-mailem") %></h4>
        <form method="post" action="/newsletter/subscribe">
          <input type="hidden" name="csrf" value="<%= request.getAttribute("csrf") %>">
          <input type="email" name="email" placeholder="<%= ((java.util.Properties)request.getAttribute("t")).getProperty("home.newsletter.placeholder","Tvůj e-mail") %>" required>
          <button type="submit"><%= ((java.util.Properties)request.getAttribute("t")).getProperty("home.newsletter.submit","Odebírat") %></button>
        </form>
      </div>
    </div>
  </section>
<script>
  document.addEventListener('click', function(e){
    const btn = e.target.closest('.share-btn');
    if(!btn) return;
    e.preventDefault(); e.stopPropagation();
    const url = btn.getAttribute('data-url');
    if (navigator.share) {
      navigator.share({ title: document.title, url }).catch(()=>{});
    } else {
      navigator.clipboard.writeText(url).then(()=>{ btn.textContent='Copied'; setTimeout(()=>btn.textContent='Share',1200); });
    }
  });
</script>
</main>

<%@ include file="includes/footer.jsp" %>
