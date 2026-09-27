<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="/includes/header.jsp" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="sk" tagdir="/WEB-INF/tags" %>
<main class="lyric-page">
  <!-- Song switcher -->
  <nav class="lyric-switcher">
    <a class="lyric-back" href="/texty.jsp"><i class="fa-solid fa-arrow-left"></i> <%= t.getProperty("lyrics.back") %></a>
    <ul class="lyric-nav">
      <c:forEach items="${songs}" var="s">
        <%-- only songs that have lyrics; the others would link to nothing --%>
        <c:if test="${not empty s.firstLyricId}">
        <li>
          <a href="${pageContext.request.contextPath}/lyrics/${s.firstLyricId}"
             class="${(lyric != null && lyric.songId == s.id) ? 'active' : ''}">
            <c:out value="${s.name}"/>
          </a>
        </li>
        </c:if>
      </c:forEach>
    </ul>
  </nav>

  <c:if test="${not empty lyric}">
    <div class="lyric-grid">

      <!-- Song Title -->
      <header class="lyric-head">
        <h1 class="lyric-title"><c:out value="${lyric.songName}"/></h1>
        <c:if test="${not empty lyric.year}"><span class="song-year">${lyric.year}</span></c:if>
      </header>

      <!-- Video (or the song's preview photo) above the lyrics -->
      <c:if test="${not empty lyric.youtubeId or not empty lyric.previewImageUrl}">
      <div class="lyric-media">
      <c:choose>
      <c:when test="${not empty lyric.youtubeId}">
        <%
          @SuppressWarnings("unchecked")
          java.util.List<com.github.skeliit.model.SongClip> clipList =
              (java.util.List<com.github.skeliit.model.SongClip>) request.getAttribute("clips");
          if (clipList != null && clipList.size() > 1) {
        %>
        <div class="clip-versions" role="tablist">
          <% for (int ci = 0; ci < clipList.size(); ci++) { com.github.skeliit.model.SongClip clip = clipList.get(ci); %>
            <button type="button" role="tab" class="clip-version<%= ci == 0 ? " active" : "" %>"
                    aria-selected="<%= ci == 0 %>" data-yt="<%= com.github.skeliit.WebUtils.escapeHtml(clip.youtubeId) %>">
              <i class="fab fa-youtube"></i> <%= com.github.skeliit.WebUtils.escapeHtml(clip.label(t)) %>
            </button>
          <% } %>
        </div>
        <% } %>
        <div class="content-box video-box">
          <div class="video-wrapper" id="ytFacade" data-yt="<c:out value='${lyric.youtubeId}'/>">
            <button type="button" class="yt-facade" aria-label="<%= t.getProperty("lyric.openYoutube","Přehrát video") %>">
              <c:choose>
                <c:when test="${not empty lyric.previewImageUrl}">
                  <img class="yt-facade-img" src="<c:out value='${lyric.previewImageUrl}'/>" alt="">
                </c:when>
                <c:otherwise>
                  <img class="yt-facade-img" src="https://i.ytimg.com/vi/<c:out value='${lyric.youtubeId}'/>/hqdefault.jpg" alt="">
                </c:otherwise>
              </c:choose>
              <span class="yt-facade-play" aria-hidden="true"><i class="fab fa-youtube"></i></span>
            </button>
          </div>
        </div>
        <script>
        (function(){
          var box = document.getElementById('ytFacade');
          if (!box) return;
          var label = '<%= com.github.skeliit.WebUtils.escapeJs(com.github.skeliit.WebUtils.escapeHtml(t.getProperty("lyric.openYoutube","Přehrát video"))) %>';
          // clicking the thumbnail swaps in the real YouTube player
          function bind() {
            var btn = box.querySelector('.yt-facade');
            if (!btn) return;
            btn.addEventListener('click', function(){
              var iframe = document.createElement('iframe');
              iframe.src = 'https://www.youtube.com/embed/' + box.getAttribute('data-yt') + '?autoplay=1&rel=0';
              iframe.setAttribute('frameborder', '0');
              iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
              iframe.setAttribute('allowfullscreen', '');
              box.innerHTML = '';
              box.appendChild(iframe);
            });
          }
          bind();
          // version tabs (original / remake): show the chosen clip's thumbnail again
          document.querySelectorAll('.clip-version').forEach(function(tab){
            tab.addEventListener('click', function(){
              var id = tab.getAttribute('data-yt');
              if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) return;
              document.querySelectorAll('.clip-version').forEach(function(o){
                o.classList.toggle('active', o === tab);
                o.setAttribute('aria-selected', o === tab ? 'true' : 'false');
              });
              box.setAttribute('data-yt', id);
              box.innerHTML = '<button type="button" class="yt-facade" aria-label="' + label + '">'
                + '<img class="yt-facade-img" src="https://i.ytimg.com/vi/' + id + '/hqdefault.jpg" alt="">'
                + '<span class="yt-facade-play" aria-hidden="true"><i class="fab fa-youtube"></i></span></button>';
              bind();
              var yt = document.querySelector('.lyric-links a[href*="youtube.com/watch"]');
              if (yt) yt.href = 'https://www.youtube.com/watch?v=' + id;
            });
          });
        })();
        </script>
      </c:when>
      <c:otherwise>
        <div class="content-box video-box">
          <div class="video-wrapper">
            <img class="yt-facade-img" src="<c:out value='${lyric.previewImageUrl}'/>" alt="">
          </div>
        </div>
      </c:otherwise>
      </c:choose>
      </div>
      </c:if>

      <!-- Listen links (sticky sidebar on desktop) -->
      <aside class="lyric-side">

        <div class="content-box lyric-links">
          <div class="action-buttons">
            <button type="button" class="action-btn" id="shareLyric" data-copied="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("lyric.linkCopied")) %>" title="<%= t.getProperty("lyric.shareLink") %>">
              <i class="fas fa-share-alt"></i> <span><%= t.getProperty("common.share") %></span>
            </button>
            <a class="action-btn" href="https://open.spotify.com/search/<c:out value='${lyric.songName}'/>" target="_blank" rel="noopener" title="<%= t.getProperty("lyric.findSpotify") %>">
              <i class="fab fa-spotify icon-spotify"></i> Spotify
            </a>
            <c:if test="${not empty lyric.youtubeId}">
              <a class="action-btn" href="https://www.youtube.com/watch?v=<c:out value='${lyric.youtubeId}'/>" target="_blank" rel="noopener" title="<%= t.getProperty("lyric.openYoutube") %>">
                <i class="fab fa-youtube icon-youtube"></i> YouTube
              </a>
            </c:if>
            <c:if test="${not empty lyric.appleMusicId}">
              <a class="action-btn" href="https://music.apple.com/song/<c:out value='${lyric.appleMusicId}'/>" target="_blank" rel="noopener" title="<%= t.getProperty("lyric.openApple") %>">
                <i class="fab fa-apple icon-apple"></i> Apple Music
              </a>
            </c:if>
          </div>
          <div class="views-count"><i class="fa-regular fa-eye"></i> <%= t.getProperty("lyric.views") %> ${lyric.views}</div>
        </div>
      </aside>

      <!-- Lyrics Text -->
      <article class="content-box lyric-body">
        <div class="lyrics-text">
          <pre><c:out value="${lyric.words}"/></pre>
        </div>
      </article>

      <!-- Votes & Comments Box -->
      <div class="content-box lyric-comments">
        <!-- Votes -->
        <div class="votes-section">
          <c:choose>
            <c:when test="${not empty sessionScope.username}">
              <form method="post" action="/vote" class="vote-form">
                <input type="hidden" name="lyric_id" value="${lyric.id}">
                <input type="hidden" name="action" value="up">
                <input type="hidden" name="csrf" value="${csrf}">
                <button type="submit" class="vote-btn up" title="<%= t.getProperty("vote.like") %>">👍</button>
              </form>
            </c:when>
            <c:otherwise>
              <a href="/login.jsp" class="vote-btn up" title="<%= t.getProperty("vote.loginToVote") %>">👍</a>
            </c:otherwise>
          </c:choose>
          
          <span class="vote-score">
            <strong class="up">${lyric.votesUp}</strong>
            <span class="sep">/</span>
            <strong class="down">${lyric.votesDown}</strong>
          </span>
          
          <c:choose>
            <c:when test="${not empty sessionScope.username}">
              <form method="post" action="/vote" class="vote-form">
                <input type="hidden" name="lyric_id" value="${lyric.id}">
                <input type="hidden" name="action" value="down">
                <input type="hidden" name="csrf" value="${csrf}">
                <button type="submit" class="vote-btn down" title="<%= t.getProperty("vote.dislike") %>">👎</button>
              </form>
            </c:when>
            <c:otherwise>
              <a href="/login.jsp" class="vote-btn down" title="<%= t.getProperty("vote.loginToVote") %>">👎</a>
            </c:otherwise>
          </c:choose>
        </div>
        
        <hr>
        
        <!-- Comments: new-comment form first, then the threads (newest first, replies oldest first) -->
<%
  @SuppressWarnings("unchecked")
  java.util.List<com.github.skeliit.model.CommentView> threads =
      (java.util.List<com.github.skeliit.model.CommentView>) request.getAttribute("comments");
  int commentTotal = 0;
  if (threads != null) for (com.github.skeliit.model.CommentView c0 : threads) commentTotal += 1 + c0.replies.size();
  boolean canPost = com.github.skeliit.EmailVerification.isVerified(session);
  com.github.skeliit.model.LyricView lyricView = (com.github.skeliit.model.LyricView) request.getAttribute("lyric");
%>
        <h3 class="comments-title" id="comments"><%= t.getProperty("comments.title") %> <span class="comments-count"><%= commentTotal %></span></h3>

        <c:if test="${not empty sessionScope.username}">
          <% if (canPost) { %>
          <form method="post" action="/comment" class="comment-form">
            <input type="hidden" name="lyric_id" value="${lyric.id}">
            <input type="hidden" name="csrf" value="${csrf}">
            <div class="hp-field" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
            <textarea name="content" maxlength="<%= com.github.skeliit.WebUtils.COMMENT_MAX_LENGTH %>"
                      placeholder="<%= t.getProperty("comment.placeholder") %>"
                      required></textarea>
            <div class="comment-form-foot">
              <span class="comment-hint"><%= t.getProperty("comment.maxLength") %></span>
              <button type="submit"><%= t.getProperty("comment.add") %></button>
            </div>
          </form>
          <% } else { %>
          <div class="verify-notice">
            <p><i class="fa-solid fa-envelope-circle-check"></i> <%= t.getProperty("verify.notice") %></p>
            <form method="post" action="/verify/resend">
              <input type="hidden" name="csrf" value="${csrf}">
              <input type="hidden" name="back" value="/lyrics/${lyric.id}#comments">
              <button type="submit" class="btn"><%= t.getProperty("verify.resend") %></button>
            </form>
          </div>
          <% } %>
        </c:if>
        <c:if test="${empty sessionScope.username}">
          <p class="comment-login">
            <a href="/login.jsp"><%= t.getProperty("comment.login.link") %></a><%= t.getProperty("comment.login.toComment") %>
          </p>
        </c:if>

        <% if (threads != null) for (com.github.skeliit.model.CommentView thread : threads) { %>
          <div class="comment-thread">
            <sk:lyricComment cmt="<%= thread %>" lyricId="<%= lyricView.id %>" t="<%= t %>" lang="<%= cur %>" canPost="<%= canPost %>"/>
            <% if (!thread.replies.isEmpty()) { %>
            <div class="comment-replies">
              <% for (com.github.skeliit.model.CommentView reply : thread.replies) { %>
                <sk:lyricComment cmt="<%= reply %>" lyricId="<%= lyricView.id %>" t="<%= t %>" lang="<%= cur %>" canPost="<%= canPost %>" isReply="<%= true %>"/>
              <% } %>
            </div>
            <% } %>
          </div>
        <% } %>
      </div>
      
    </div>
  </c:if>
  <script>
    // Song chips row: fade the edges that have hidden songs, let the mouse wheel
    // scroll it sideways, and start with the current song in the middle
    (function () {
      const nav = document.querySelector('.lyric-nav');
      if (!nav) return;
      function updateFades() {
        const max = nav.scrollWidth - nav.clientWidth;
        nav.classList.toggle('fade-left', nav.scrollLeft > 2);
        nav.classList.toggle('fade-right', nav.scrollLeft < max - 2);
      }
      nav.addEventListener('scroll', updateFades, { passive: true });
      // chip widths change once the web font arrives or the window resizes
      if (window.ResizeObserver) new ResizeObserver(updateFades).observe(nav);
      else window.addEventListener('resize', updateFades);
      nav.addEventListener('wheel', function (e) {
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
        const before = nav.scrollLeft;
        nav.scrollLeft += e.deltaY;
        // at either end, let the page scroll normally
        if (nav.scrollLeft !== before) e.preventDefault();
      }, { passive: false });
      function centerActive() {
        const active = nav.querySelector('a.active');
        if (active) {
          const li = active.parentElement;
          nav.scrollLeft = li.offsetLeft - (nav.clientWidth - li.offsetWidth) / 2;
        }
        updateFades();
      }
      centerActive();
      // measure again with the real font (Bruno Ace is wider than the fallback)
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(centerActive);
    })();

    // Edit a comment in place (the pencil swaps the text for a small form) and open reply forms
    (function () {
      document.querySelectorAll('.comment-item').forEach(function (item) {
        const toggle = item.querySelector('.comment-edit-toggle');
        const form = item.querySelector('.comment-edit-form');
        const text = item.querySelector('.comment-text');
        if (toggle && form && text) {
          function setEditing(on) {
            form.hidden = !on;
            text.hidden = on;
            toggle.classList.toggle('active', on);
            if (on) { const ta = form.querySelector('textarea'); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
          }
          toggle.addEventListener('click', function () { setEditing(form.hidden); });
          form.querySelector('.comment-edit-cancel').addEventListener('click', function () {
            form.reset();
            setEditing(false);
          });
        }
        const replyBtn = item.querySelector('.comment-reply-toggle');
        const replyForm = item.querySelector('.comment-reply-form');
        if (replyBtn && replyForm) {
          replyBtn.addEventListener('click', function () {
            replyForm.hidden = !replyForm.hidden;
            replyBtn.hidden = !replyForm.hidden;
            if (!replyForm.hidden) replyForm.querySelector('textarea').focus();
          });
          replyForm.querySelector('.comment-reply-cancel').addEventListener('click', function () {
            replyForm.reset();
            replyForm.hidden = true;
            replyBtn.hidden = false;
          });
        }
      });
    })();

    (function () {
      const btn = document.getElementById('shareLyric');
      if (!btn) return;
      btn.addEventListener('click', function () {
        const url = location.href;
        if (navigator.share) { navigator.share({ title: document.title, url }).catch(() => {}); return; }
        navigator.clipboard.writeText(url).then(() => {
          const label = btn.querySelector('span'); const old = label.textContent;
          label.textContent = btn.dataset.copied; setTimeout(() => label.textContent = old, 1500);
        });
      });
    })();
  </script>
</main>
<%@ include file="/includes/footer.jsp" %>