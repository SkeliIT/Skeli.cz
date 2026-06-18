<%@ page import="java.sql.*" %>
<%@ page import="com.github.skeliit.Db" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<main>
  <section class="hero-section">
    <h2 class="comforter-brush-regular">SKELOSQUAD</h2>
    <p><%= ((java.util.Properties)request.getAttribute("t")).getProperty("index.hero","Official website – music, lyrics, news.") %></p>
  </section>

  <section class="tiles-grid">
    <a class="section" href="/music.jsp">
      <h3><i class="fas fa-music"></i> <%= ((java.util.Properties)request.getAttribute("t")).getProperty("tile.music.title","Music") %></h3>
      <p><%= ((java.util.Properties)request.getAttribute("t")).getProperty("tile.music.desc","YouTube videos and Spotify playlist.") %></p>
    </a>
    <a class="section" href="/texty.jsp">
      <h3><i class="fas fa-align-left"></i> <%= ((java.util.Properties)request.getAttribute("t")).getProperty("tile.lyrics.title","Lyrics") %></h3>
      <p><%= ((java.util.Properties)request.getAttribute("t")).getProperty("tile.lyrics.desc","Browse lyrics, vote and comment.") %></p>
    </a>
    <a class="section" href="/about.jsp">
      <h3><i class="fas fa-user"></i> <%= ((java.util.Properties)request.getAttribute("t")).getProperty("tile.about.title","About") %></h3>
      <p><%= ((java.util.Properties)request.getAttribute("t")).getProperty("tile.about.desc","Who I am and how I create.") %></p>
    </a>
  </section>

  <section class="news-grid">
    <div class="card">
      <h3 class="bruno-ace-sc-regular">🗞️ <%= ((java.util.Properties)request.getAttribute("t")).getProperty("home.news","Novinky") %></h3>
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
                      <div><%= title %></div>
                      <div><%= dateStr %></div>
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
      <h4 class="bruno-ace-sc-regular">📣 Sociální sítě</h4>
      <div id="home-social" class="home-social-grid"></div>
      <div class="all-news-link"><a href="/aktuality.jsp">Všechny aktuality →</a></div>
      <script>
        (async function(){
          try{
            const res = await fetch('/api/social-posts?onePerSource=true'); if(!res.ok) return;
            const posts = await res.json(); if(!Array.isArray(posts)||!posts.length) return;
            const el = document.getElementById('home-social'); if(!el) return;
            el.innerHTML = posts.map(p=>{
              const img = p.image?`<img src="\${p.image}" class="home-social-img">`:'';
              const cap = (p.caption||'').slice(0,120);
              const badge = p.source==='instagram'?'<i class="fab fa-instagram"></i>':(p.source==='facebook'?'<i class="fab fa-facebook"></i>':'📰');
              return `<a href="\${p.permalink}" target="_blank" rel="noopener" class="home-social-link">\${img}<span class="home-social-badge">\${badge}</span><div class="home-social-caption">\${cap}</div></a>`;
            }).join('');
          }catch(e){}
        })();
      </script>
    </div>
    <div class="card">
      <h3 class="bruno-ace-sc-regular">🎤 <%= ((java.util.Properties)request.getAttribute("t")).getProperty("home.concerts","Koncerty") %></h3>
      <ul class="concerts-list">
        <li><%= ((java.util.Properties)request.getAttribute("t")).getProperty("home.concerts.none","Zatím nejsou naplánovány žádné koncerty.") %></li>
      </ul>
      <hr style="border-color:var(--panel-border); opacity:.5;">
      <div class="newsletter">
        <h4>📧 <%= ((java.util.Properties)request.getAttribute("t")).getProperty("home.newsletter.title","Novinky e-mailem") %></h4>
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
