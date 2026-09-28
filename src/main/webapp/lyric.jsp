<%@ page import="java.sql.*" %>
<%@ page import="com.github.skeliit.Db" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<main class="avoid-footer">
    <h2 style="text-align:center;"><%= t.getProperty("lyric.heading") %></h2>


    <% String flash = request.getParameter("msg"); if (flash != null) { %>
      <div style="background:rgba(0,128,0,0.35); padding:8px 10px; border-radius:8px; margin-bottom:10px; text-align:center;"><%= t.getProperty("deleted".equals(flash) ? "comment.flash.deleted" : ("updated".equals(flash) ? "comment.flash.updated" : "comment.flash.added")) %></div>
    <% } %>
    <div class="nav-top">
      <h3><%= t.getProperty("lyric.songList") %></h3>
      <ul class="song-list">
        <%
            String idParam = request.getParameter("id");

            String listSql = "SELECT s.id AS song_id, s.name AS song_name, s.year AS song_year, MIN(l.id) AS lyric_id " +
                             "FROM lyrics l JOIN songs s ON s.id = l.song_id " +
                             "GROUP BY s.id, s.name, s.year " +
                             "ORDER BY s.year DESC, s.name ASC";

            Connection conn = null;
            boolean connected = false;
            try {
                conn = Db.get();
                connected = true;
            } catch (SQLException ce) {
                // keep connected=false
            }

            Integer activeId = null;
            try { if (idParam != null) activeId = Integer.parseInt(idParam); } catch (Exception ignore) {}

            if (connected) {
                try (PreparedStatement ps = conn.prepareStatement(listSql);
                     ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        String name = rs.getString("song_name");
                        int lyricId = rs.getInt("lyric_id");
                        boolean isActive = (activeId != null && activeId == lyricId);
        %>
                        <li><a class="<%= isActive ? "active" : "" %>" href="lyric.jsp?id=<%= lyricId %>"><%= com.github.skeliit.WebUtils.escapeHtml(name) %></a></li>
        <%
                    }
                } catch (SQLException e) {
                    out.println("<li>" + t.getProperty("lyrics.loadError") + "</li>");
                }
            } else {
                out.println("<li>" + t.getProperty("lyrics.loadError") + "</li>");
            }
        %>
        </ul>
    </div>

    <section>
        <%
            // Support SEO path /lyrics/{id-slug}
            if (activeId == null) {
                String pi = request.getPathInfo();
                if (pi != null && pi.length() > 1) {
                    String p = pi.substring(1);
                    try { activeId = Integer.parseInt(p.split("-",2)[0]); } catch (Exception ignore) {}
                }
            }
            if (connected) {
                if (activeId == null) {
                    out.println("<p>" + t.getProperty("lyric.choose") + "</p>");
                } else {
                    String detailSql = "SELECT s.name AS song_name, s.year AS song_year, l.words, l.score, " +
                                       "(SELECT v.youtube_id FROM videos v WHERE v.song_id = l.song_id ORDER BY v.published_at DESC, v.id DESC LIMIT 1) AS yt " +
                                       "FROM lyrics l JOIN songs s ON s.id = l.song_id " +
                                       "WHERE l.id = ?";
                    try (PreparedStatement ps = conn.prepareStatement(detailSql)) {
                        ps.setInt(1, activeId);
                        try (ResultSet rs = ps.executeQuery()) {
                            if (rs.next()) {
                                String name = rs.getString("song_name");
                                String year = rs.getString("song_year");
                                String words = rs.getString("words");
                                String yt = rs.getString("yt");
                                // try translated words if available for selected language
                                String curLang = cur;
                                if (!curLang.equals("cs")) {
                                  try (PreparedStatement tr = conn.prepareStatement("SELECT words FROM lyrics_translations WHERE lyric_id=? AND lang=?")) {
                                    tr.setInt(1, activeId);
                                    tr.setString(2, curLang);
                                    try (ResultSet rtr = tr.executeQuery()) { if (rtr.next() && rtr.getString(1) != null) { words = rtr.getString(1); } }
                                  }
                                }
        %>
                                <div class="card accent lyric-layout lyric-card">
                                  <div>
                                    <h3><%= com.github.skeliit.WebUtils.escapeHtml(name) %><% if (year != null) { %> (<%= year %>)<% } %></h3>
                                    <% if (yt != null && !yt.isEmpty()) { %>
                                    <div class="video-container">
                                      <div class="video-ratio">
                                        <iframe src="https://www.youtube.com/embed/<%= com.github.skeliit.WebUtils.escapeHtml(yt) %>" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                                      </div>
                                    </div>
                                    <% } %>
                                    <div class="lyrics-box">
                                      <pre><%= com.github.skeliit.WebUtils.escapeHtml(words) %></pre>
                                    </div>
                                  </div>
                                  <div>

                                  <hr style="border:none; border-top:1px solid rgba(0,0,0,0.08); margin:16px 0;">

                                  <div class="votes">
                                    <form method="post" action="vote?from=legacy" style="display:inline;">
                                      <input type="hidden" name="lyric_id" value="<%= activeId %>">
                                      <input type="hidden" name="action" value="up">
                                      <input type="hidden" name="csrf" value="${csrf}">
                                      <button type="submit" class="btn-vote up" title="<%= t.getProperty("vote.like") %>">
                                        <i class="fa-solid fa-thumbs-up"></i>
                                      </button>
                                    </form>
                                    <form method="post" action="vote?from=legacy" style="display:inline;">
                                      <input type="hidden" name="lyric_id" value="<%= activeId %>">
                                      <input type="hidden" name="action" value="down">
                                      <input type="hidden" name="csrf" value="${csrf}">
                                      <button type="submit" class="btn-vote down" title="<%= t.getProperty("vote.dislike") %>">
                                        <i class="fa-solid fa-thumbs-down"></i>
                                      </button>
                                    </form>
                                    <span style="margin-left:6px; white-space:nowrap;">
                                      <%
                                        int up=0, down=0;
                                        try (PreparedStatement psV = conn.prepareStatement(
                                          "SELECT SUM(vote=1) AS up, SUM(vote=-1) AS down FROM lyrics_votes WHERE lyric_id=?")) {
                                          psV.setInt(1, activeId);
                                          try (ResultSet rsv = psV.executeQuery()) {
                                            if (rsv.next()) { up = rsv.getInt("up"); down = rsv.getInt("down"); }
                                          }
                                        }
                                      %>
                                      <strong><%= up %></strong> / <strong><%= down %></strong>
                                    </span>
                                  </div>

                                  <div class="views views-count">
                                    <%
                                      long views = 0;
                                      try (PreparedStatement psViews = conn.prepareStatement(
                                        "INSERT INTO lyric_views (lyric_id, views) VALUES (?,1) ON DUPLICATE KEY UPDATE views = views + 1")) {
                                        psViews.setInt(1, activeId);
                                        psViews.executeUpdate();
                                      }
                                      try (PreparedStatement psViews2 = conn.prepareStatement(
                                        "SELECT views FROM lyric_views WHERE lyric_id=?")) {
                                        psViews2.setInt(1, activeId);
                                        try (ResultSet rsv2 = psViews2.executeQuery()) { if (rsv2.next()) views = rsv2.getLong(1); }
                                      }
                                    %>
                                    <%= t.getProperty("lyric.views") %> <%= views %>
                                  </div>
                                  </div>

                                  <div>
                                  <div class="comments">
                                    <h4><%= t.getProperty("comments.title") %></h4>
                                    <div>
                                      <%
                                        try (PreparedStatement psC = conn.prepareStatement(
                                          "SELECT c.id, c.user_id, c.content, c.created_at, u.username, u.avatar_url FROM comments c JOIN users u ON u.id=c.user_id WHERE c.lyric_id=? ORDER BY c.created_at DESC")) {
                                          psC.setInt(1, activeId);
                                        try (ResultSet rsc = psC.executeQuery()) {
                                          while (rsc.next()) {
                                            int __cid = rsc.getInt("id");
                                    %>
                                              <div class="comment-item">
                                                <img src="<%= com.github.skeliit.WebUtils.escapeHtml(com.github.skeliit.WebUtils.safeUrl(rsc.getString("avatar_url"), "/img/avatar-default.svg")) %>" alt="avatar" class="comment-avatar">
                                                <div style="flex:1;">
                                                  <strong><%= com.github.skeliit.WebUtils.escapeHtml(rsc.getString("username")) %></strong>
                                                  <span class="meta comment-meta">(<%= rsc.getTimestamp("created_at") %>)</span>
                                                  <div id="c-body-<%= __cid %>"><%= com.github.skeliit.WebUtils.escapeHtml(rsc.getString("content")) %></div>
                                                <%
                                                  Integer uid2 = (Integer) session.getAttribute("userId");
                                                  String role2 = (String) session.getAttribute("role");
                                                  boolean canEdit = (uid2 != null && (uid2 == rsc.getInt("user_id") || "ADMIN".equals(role2)));
                                                  if (canEdit) {
                                                %>
                                                <div style="margin-top:6px;">
                                                  <form method="post" action="/comment" style="display:inline;">
                                                    <input type="hidden" name="lyric_id" value="<%= activeId %>">
                                                    <input type="hidden" name="comment_id" value="<%= __cid %>">
                                                    <input type="hidden" name="action" value="delete">
                                                    <input type="hidden" name="csrf" value="${csrf}">
                                                    <button type="submit" style="background:#7b1e1e;color:#fff;border:none;padding:4px 8px;border-radius:6px;"><%= t.getProperty("common.delete") %></button>
                                                  </form>
                                                  <button type="button" onclick="(function(){ var f=document.getElementById('edit-<%= __cid %>'); f.style.display = f.style.display==='none'?'block':'none'; })()" style="margin-left:6px;"><%= t.getProperty("common.edit") %></button>
                                                </div>
                                                <form id="edit-<%= __cid %>" method="post" action="/comment" style="display:none; margin-top:6px;">
                                                  <input type="hidden" name="lyric_id" value="<%= activeId %>">
                                                  <input type="hidden" name="comment_id" value="<%= __cid %>">
                                                  <input type="hidden" name="action" value="update">
                                                  <%
                                                    String __content = rsc.getString("content");
                                                    if (__content == null) __content = "";
                                                    __content = com.github.skeliit.WebUtils.escapeHtml(__content);
                                                  %>
                                                  <textarea name="content" rows="3" style="width:100%;"><%= __content %></textarea>
                                                    <input type="hidden" name="csrf" value="${csrf}">
                                                    <button type="submit"><%= t.getProperty("common.save") %></button>
                                                </form>
                                                <%
                                                  }
                                                %>
                                              </div>
                                            </div>
                                    <%
                                            }
                                          }
                                        }
                                      %>
                                    </div>

                                    <%
                                      Integer uid = (Integer) session.getAttribute("userId");
                                      if (uid != null) {
                                    %>
                                      <form method="post" action="/comment" style="margin-top:10px;">
                                        <input type="hidden" name="lyric_id" value="<%= activeId %>">
                                        <input type="hidden" name="csrf" value="${csrf}">
                                        <div style="position:relative;">
                                          <textarea id="comment-textarea" name="content" rows="3" class="comment-textarea" placeholder="<%= t.getProperty("comment.placeholder") %> 😎" required></textarea>
                                          <button type="button" id="emoji-btn" class="emoji-trigger">😊</button>
                                        </div>
                                        <button type="submit" style="margin-top:6px; padding:6px 10px; border:1px solid var(--panel-border); border-radius:8px; background:rgba(0,0,0,0.2); color:inherit;"><%= t.getProperty("common.send") %></button>
                                      </form>
                                    <%
                                      } else {
                                    %>
                                      <p><a href="/login.jsp"><%= t.getProperty("comment.login.link") %></a><%= t.getProperty("comment.login.toCommentVote") %></p>
                                    <%
                                      }
                                    %>
                                  </div>
                                  </div>
                                </div>
        <%
                            } else {
                                out.println("<p>" + t.getProperty("lyric.notFound") + "</p>");
                            }
                        }
                    } catch (SQLException de) {
                        out.println("<p>" + t.getProperty("lyrics.loadError") + "</p>");
                    }
                }
                try { conn.close(); } catch (Exception ignore) {}
            }
        %>
      </section>
</main>

<script>
// Emoji picker
(function(){
  const emojis = ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','😺','😸','😹','😻','😼','😽','🙀','😿','😾','🙈','🙉','🙊','💋','💌','💘','💝','💖','💗','💓','💞','💕','💟','❣️','💔','❤️','🧡','💛','💚','💙','💜','🤎','🖤','🤍','💯','💢','💥','💫','💦','💨','🕳️','💣','💬','👁️‍🗨️','🗨️','🗯️','💭','💤','👋','🤚','🖐️','✋','🖖','👌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦵','🦿','🦶','👂','🦻','👃','🧠','🦷','🦴','👀','👁️','👅','👄','🔥','💯','✨','🎉','🎊','🎈','🎁','🏆','🥇','🥈','🥉','⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🥅','⛳','🪁','🎣','🤿','🎽','🎿','🛷','🥌','🎯','🪃','🪄','🎱'];
  const btn = document.getElementById('emoji-btn');
  const textarea = document.getElementById('comment-textarea');
  if (!btn || !textarea) return;
  
  let picker = null;
  
  btn.addEventListener('click', function(e){
    e.preventDefault();
    e.stopPropagation();
    
    if (picker) {
      picker.remove();
      picker = null;
      return;
    }
    
    picker = document.createElement('div');
    picker.style.cssText = 'position:absolute; right:0; top:40px; background:var(--panel-strong); border:1px solid var(--panel-border); border-radius:8px; padding:8px; max-width:280px; max-height:200px; overflow-y:auto; display:grid; grid-template-columns:repeat(8,1fr); gap:4px; z-index:1000; box-shadow:0 8px 24px rgba(0,0,0,0.35);';
    
    emojis.forEach(emoji => {
      const span = document.createElement('span');
      span.textContent = emoji;
      span.style.cssText = 'cursor:pointer; font-size:1.5em; text-align:center; padding:4px; border-radius:4px; transition:background .15s;';
      span.addEventListener('mouseenter', function(){ this.style.background='rgba(255,255,255,0.08)'; });
      span.addEventListener('mouseleave', function(){ this.style.background='transparent'; });
      span.addEventListener('click', function(){
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        textarea.value = text.substring(0, start) + emoji + text.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
        picker.remove();
        picker = null;
      });
      picker.appendChild(span);
    });
    
    btn.parentElement.appendChild(picker);
    
    document.addEventListener('click', function closeP(ev){
      if (!picker.contains(ev.target) && ev.target !== btn) {
        picker.remove();
        picker = null;
        document.removeEventListener('click', closeP);
      }
    });
  });
})();
</script>

<%@ include file="includes/footer.jsp" %>
