<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="/includes/header.jsp" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<style>
  /* Lyric Page Boxes */
  .lyric-header-box {
    background: rgba(204, 43, 43, 0.15);
    border: 1px solid rgba(204, 43, 43, 0.3);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(204, 43, 43, 0.1);
  }
  body.light .lyric-header-box {
    background: rgba(0, 0, 0, 0.06);
    border-color: rgba(0, 0, 0, 0.18);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.10);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  .lyric-header-box h2 {
    margin: 0 0 16px 0;
    text-align: center;
  }
  .lyric-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 16px;
    justify-content: center;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .lyric-nav a {
    color: var(--text);
    font-weight: 600;
    text-decoration: none;
    transition: color .2s, text-shadow .2s;
  }
  .lyric-nav a.active {
    color: var(--accent);
    text-shadow: 0 0 8px var(--accent);
  }
  .lyric-nav a:hover {
    color: var(--accent);
    text-shadow: 0 0 8px var(--accent);
  }
  .lyric-nav li:not(:last-child)::after {
    content: "|";
    color: rgba(255, 255, 255, 0.3);
    margin-left: 8px;
  }
  body.light .lyric-nav li:not(:last-child)::after {
    color: rgba(0, 0, 0, 0.3);
  }
  
  .content-box {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--panel-border);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  body.light .content-box {
    background: rgba(255, 255, 255, 0.6);
    border-color: rgba(0, 0, 0, 0.15);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  
  .lyric-title {
    text-align: center;
    color: var(--accent);
    margin: 0 0 20px 0;
  }
  
  .video-wrapper {
    position: relative;
    padding-top: 56.25%;
    border-radius: 8px;
    overflow: hidden;
    background: #000;
  }
  .video-wrapper iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  
  .lyrics-text {
    text-align: center;
    max-width: 100%;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .lyrics-text pre {
    white-space: pre-wrap;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 1.05em;
    margin: 0;
    font-weight: var(--fw);
    color: var(--text);
    text-align: center;
  }
  
  .action-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 16px;
  }
  .action-btn {
    background: transparent;
    border: none;
    color: var(--text);
    padding: 8px 14px;
    cursor: pointer;
    font-weight: 600;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
  }
  .action-btn:hover {
    color: var(--accent);
    text-shadow: 0 0 8px var(--accent);
  }
  
  .votes-section {
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: center;
    padding: 16px 0;
  }
  .vote-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2px solid;
    cursor: pointer;
    font-size: 18px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .vote-btn.up {
    border-color: rgba(0, 255, 170, 0.4);
    background: rgba(0, 255, 170, 0.08);
    color: var(--text);
  }
  .vote-btn.up:hover {
    background: rgba(0, 255, 170, 0.2);
    transform: translateY(-2px);
  }
  .vote-btn.down {
    border-color: rgba(255, 80, 80, 0.4);
    background: rgba(255, 80, 80, 0.08);
    color: var(--text);
  }
  .vote-btn.down:hover {
    background: rgba(255, 80, 80, 0.2);
    transform: translateY(-2px);
  }
  
  .comment-item {
    display: flex;
    gap: 12px;
    margin: 12px 0;
    padding: 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  body.light .comment-item {
    background: rgba(0, 0, 0, 0.03);
    border-color: rgba(0, 0, 0, 0.08);
  }
  .comment-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }
  .comment-content {
    flex: 1;
  }
  .comment-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .comment-username {
    color: var(--accent);
    font-weight: 600;
  }
  .comment-date {
    font-size: 0.85em;
    opacity: 0.6;
    margin-left: 8px;
  }
  .comment-text {
    color: var(--text);
  }
  .views-count {
    text-align: center;
    opacity: 0.5;
    font-size: 0.9em;
    margin-top: 10px;
  }
</style>
<main>
  <!-- Header Box: Title + Navigation -->
  <div class="lyric-header-box">
    <h2 class="bruno-ace-sc-regular">${t.getProperty('menu.lyrics','Texty')}</h2>
    <ul class="lyric-nav">
      <c:forEach items="${songs}" var="s">
        <li>
          <a href="${pageContext.request.contextPath}/lyrics/${s.firstLyricId}" 
             class="${(lyric != null && lyric.songId == s.id) ? 'active' : ''}">
            ${s.name}
          </a>
        </li>
      </c:forEach>
    </ul>
  </div>

  <c:if test="${not empty lyric}">
    <div style="max-width:800px; margin:0 auto;">
      
      <!-- Song Title -->
      <h3 class="bruno-ace-sc-regular lyric-title">
        ${lyric.songName} <c:if test="${not empty lyric.year}">(${lyric.year})</c:if>
      </h3>
      
      <!-- Video Box -->
      <c:if test="${not empty lyric.youtubeId}">
        <div class="content-box">
          <div class="video-wrapper">
            <iframe src="https://www.youtube.com/embed/${lyric.youtubeId}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowfullscreen></iframe>
          </div>
        </div>
      </c:if>
      
      <!-- Lyrics Text Box -->
      <div class="content-box">
        <div class="lyrics-text">
          <pre><c:out value="${lyric.words}"/></pre>
        </div>
        
        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="action-btn" onclick="navigator.clipboard.writeText(window.location.href); alert('⚡ Odkaz zkopírován!')" title="Sdílet odkaz">
            <i class="fas fa-share-alt"></i> Sdílet
          </button>
          <a class="action-btn" href="https://open.spotify.com/search/<c:out value='${lyric.songName}'/>" target="_blank" rel="noopener" title="Najít na Spotify">
            <i class="fab fa-spotify" style="color:#1DB954;"></i> Spotify
          </a>
          <c:if test="${not empty lyric.youtubeId}">
            <a class="action-btn" href="https://www.youtube.com/watch?v=${lyric.youtubeId}" target="_blank" rel="noopener" title="Otevřít na YouTube">
              <i class="fab fa-youtube" style="color:#FF0000;"></i> YouTube
            </a>
          </c:if>
          <c:if test="${not empty lyric.appleMusicId}">
            <a class="action-btn" href="https://music.apple.com/song/${lyric.appleMusicId}" target="_blank" rel="noopener" title="Otevřít na Apple Music">
              <i class="fab fa-apple" style="color:#fc3c44;"></i> Apple Music
            </a>
          </c:if>
        </div>
        
        <div class="views-count">Návštěvy: ${lyric.views}</div>
      </div>
      
      <!-- Votes & Comments Box -->
      <div class="content-box">
        <!-- Votes -->
        <div class="votes-section">
          <c:choose>
            <c:when test="${not empty sessionScope.username}">
              <form method="post" action="/vote" style="display:inline;">
                <input type="hidden" name="lyric_id" value="${lyric.id}">
                <input type="hidden" name="action" value="up">
                <input type="hidden" name="csrf" value="${csrf}">
                <button type="submit" class="vote-btn up" title="Líbí se mi">👍</button>
              </form>
            </c:when>
            <c:otherwise>
              <a href="/login.jsp" class="vote-btn up" style="text-decoration:none; display:inline-block;" title="Přihlaš se pro hlasování">👍</a>
            </c:otherwise>
          </c:choose>
          
          <span style="font-size:1.1em; font-weight:600;">
            <strong style="color:#00ffaa;">${lyric.votesUp}</strong>
            <span style="opacity:0.5;">/</span>
            <strong style="color:#ff5050;">${lyric.votesDown}</strong>
          </span>
          
          <c:choose>
            <c:when test="${not empty sessionScope.username}">
              <form method="post" action="/vote" style="display:inline;">
                <input type="hidden" name="lyric_id" value="${lyric.id}">
                <input type="hidden" name="action" value="down">
                <input type="hidden" name="csrf" value="${csrf}">
                <button type="submit" class="vote-btn down" title="Nelíbí se mi">👎</button>
              </form>
            </c:when>
            <c:otherwise>
              <a href="/login.jsp" class="vote-btn down" style="text-decoration:none; display:inline-block;" title="Přihlaš se pro hlasování">👎</a>
            </c:otherwise>
          </c:choose>
        </div>
        
        <hr style="border:none; border-top:1px solid var(--panel-border); margin:20px 0;">
        
        <!-- Comments -->
        <h4 style="margin:0 0 16px; color:var(--accent); text-align:center;">Komentáře</h4>
        
        <c:forEach items="${comments}" var="cmt">
          <div class="comment-item">
            <img src="${empty cmt.avatarUrl ? '/img/avatar-default.png' : cmt.avatarUrl}" 
                 alt="avatar" 
                 class="comment-avatar"/>
            <div class="comment-content">
              <div class="comment-meta">
                <div>
                  <strong class="comment-username"><c:out value="${cmt.username}"/></strong>
                  <span class="comment-date">${cmt.createdAt}</span>
                </div>
                <c:if test="${not empty sessionScope.userId && (sessionScope.userId == cmt.userId || sessionScope.role == 'ADMIN')}">
                  <form method="post" action="/comment" style="display:inline;">
                    <input type="hidden" name="comment_id" value="${cmt.id}">
                    <input type="hidden" name="action" value="delete">
                    <input type="hidden" name="lyric_id" value="${lyric.id}">
                    <input type="hidden" name="csrf" value="${csrf}">
                    <button type="submit" 
                            style="background:transparent; border:none; color:#ff4444; cursor:pointer; padding:4px 8px; font-size:0.9em;" 
                            onclick="return confirm('Opravdu smazat komentář?')" 
                            title="Smazat">❌</button>
                  </form>
                </c:if>
              </div>
              <div class="comment-text"><c:out value="${cmt.content}"/></div>
            </div>
          </div>
        </c:forEach>
        
        <c:if test="${not empty sessionScope.username}">
          <form method="post" action="/comment" style="margin-top:20px;">
            <input type="hidden" name="lyric_id" value="${lyric.id}">
            <input type="hidden" name="csrf" value="${csrf}">
            <textarea name="content" 
                      placeholder="Napiš komentář..." 
                      required 
                      style="width:100%; min-height:80px; padding:10px; box-sizing:border-box; margin-bottom:10px; background:rgba(0,0,0,0.2); border:1px solid var(--panel-border); border-radius:8px; color:var(--text); font-family:inherit; font-size:1em; resize:vertical;"></textarea>
            <button type="submit" 
                    style="background:var(--accent); color:#000; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:600; font-size:1em; width:100%;">Přidat komentář</button>
          </form>
        </c:if>
        <c:if test="${empty sessionScope.username}">
          <p style="margin-top:20px; text-align:center; opacity:0.7;">
            <a href="/login.jsp" style="color:var(--accent); text-decoration:none; font-weight:600;">Přihlaš se</a> pro přidání komentáře
          </p>
        </c:if>
      </div>
      
    </div>
  </c:if>
</main>
<%@ include file="/includes/footer.jsp" %>