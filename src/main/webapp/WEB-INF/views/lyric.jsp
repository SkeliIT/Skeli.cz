<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="/includes/header.jsp" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
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