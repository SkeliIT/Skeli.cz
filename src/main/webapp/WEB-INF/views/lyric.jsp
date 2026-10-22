<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="/includes/header.jsp" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<main class="lyric-page" data-lyric-id="${lyric.id}">
  <%-- every song has its own colours: its clip's thumbnail (or preview photo), blurred far behind the page --%>
  <c:if test="${not empty lyric.youtubeId or not empty lyric.previewImageUrl}">
    <div class="lyric-ambient" aria-hidden="true"
         style="--amb: url('<c:choose><c:when test="${not empty lyric.youtubeId}">/yt-thumb/<c:out value="${lyric.youtubeId}"/>/mqdefault.jpg</c:when><c:otherwise><c:out value="${lyric.previewImageUrl}"/></c:otherwise></c:choose>')"></div>
  </c:if>
  <!-- Song switcher -->
  <nav class="lyric-switcher">
    <a class="lyric-back" href="/texty.jsp"><i class="fa-solid fa-arrow-left"></i> <%= t.getProperty("lyrics.back") %></a>
    <ul class="lyric-nav">
      <c:forEach items="${songs}" var="s">
        <%-- only songs that have lyrics; the others would link to nothing --%>
        <c:if test="${not empty s.firstLyricId}">
        <li>
          <a href="/<%= cur %>/song/${s.uuid}"
             class="${(lyric != null && lyric.songId == s.id) ? 'active' : ''}" title="<c:out value='${s.name}'/>">
            <c:out value="${s.shortName}"/>
          </a>
        </li>
        </c:if>
      </c:forEach>
    </ul>
  </nav>

  <c:if test="${not empty lyric}">
    <div class="lyric-grid">

      <!-- Song Title -->
      <%-- centred like the clip and the lyrics: the title with the artists, year and views under it, then one row of
           actions. Previous / next: on a phone at both sides of the title, on a wide screen beside the clip (below). --%>
      <header class="lyric-head">
        <c:if test="${not empty prevSong}">
          <a class="head-arrow head-prev" href="/<%= cur %>/song/${prevSong.uuid}" rel="prev" title="<%= t.getProperty("lyrics.prev") %>: <c:out value='${prevSong.shortName}'/>" aria-label="<%= t.getProperty("lyrics.prev") %>: <c:out value='${prevSong.shortName}'/>"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></a>
        </c:if>
        <div class="lyric-titles">
          <h1 class="lyric-title"><c:out value="${lyric.shortName}"/></h1>
          <c:if test="${not empty lyric.translatedTitle}"><span class="lyric-translated" lang="<%= cur %>"><c:out value="${lyric.translatedTitle}"/></span></c:if>
          <c:if test="${not empty lyric.credits}"><span class="lyric-credits"><c:out value="${lyric.credits}"/></span></c:if>
          <div class="lyric-meta">
            <c:if test="${not empty lyric.year}"><span class="song-year">${lyric.year}</span></c:if>
            <span class="head-views" title="<%= t.getProperty("lyric.views") %> ${lyric.views}"><i class="fa-regular fa-eye" aria-hidden="true"></i> ${lyric.views}<span class="sr-only"> <%= t.getProperty("lyric.views") %></span></span>
          </div>
        </div>
        <c:if test="${not empty nextSong}">
          <a class="head-arrow head-next" href="/<%= cur %>/song/${nextSong.uuid}" rel="next" title="<%= t.getProperty("lyrics.next") %>: <c:out value='${nextSong.shortName}'/>" aria-label="<%= t.getProperty("lyrics.next") %>: <c:out value='${nextSong.shortName}'/>"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></a>
        </c:if>
        <%-- what you do with the song: the heart and share, then where else to listen (round icons) --%>
        <div class="song-actions">
          <%-- one heart per person and song (js below; signed out = a link to the login) --%>
          <c:choose>
            <c:when test="${not empty sessionScope.userId}">
              <button type="button" class="action-btn like-btn${liked ? ' on' : ''}" id="likeSong" data-lyric="${lyric.id}"
                      aria-pressed="${liked}" title="<%= t.getProperty("vote.like") %>">
                <i class="fa-${liked ? 'solid' : 'regular'} fa-heart"></i> <span><%= t.getProperty("vote.like") %></span>
                <span class="like-count">${lyric.likes > 0 ? lyric.likes : ''}</span>
              </button>
            </c:when>
            <c:otherwise>
              <a class="action-btn like-btn" href="/login.jsp" data-login-next title="<%= t.getProperty("vote.loginToVote") %>">
                <i class="fa-regular fa-heart"></i> <span><%= t.getProperty("vote.like") %></span>
                <span class="like-count">${lyric.likes > 0 ? lyric.likes : ''}</span>
              </a>
            </c:otherwise>
          </c:choose>
          <button type="button" class="action-btn" id="shareLyric" data-copied="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("lyric.linkCopied")) %>" title="<%= t.getProperty("lyric.shareLink") %>">
            <i class="fas fa-share-alt"></i> <span><%= t.getProperty("common.share") %></span>
          </button>
          <span class="listen-icons">
            <a class="listen-icon listen-spotify" href="https://open.spotify.com/search/<c:out value='${lyric.songName}'/>" target="_blank" rel="noopener" title="<%= t.getProperty("lyric.findSpotify") %>" aria-label="<%= t.getProperty("lyric.findSpotify") %>"><i class="fab fa-spotify" aria-hidden="true"></i></a>
            <c:if test="${not empty lyric.youtubeId}"><a class="listen-icon listen-yt" href="https://www.youtube.com/watch?v=<c:out value='${lyric.youtubeId}'/>" target="_blank" rel="noopener" title="<%= t.getProperty("lyric.openYoutube") %>" aria-label="<%= t.getProperty("lyric.openYoutube") %>"><i class="fab fa-youtube" aria-hidden="true"></i></a></c:if>
            <c:if test="${not empty lyric.appleMusicId}"><a class="listen-icon listen-apple" href="https://music.apple.com/cz/song/<c:out value='${lyric.appleMusicId}'/>" target="_blank" rel="noopener" title="<%= t.getProperty("lyric.openApple") %>" aria-label="<%= t.getProperty("lyric.openApple") %>"><i class="fab fa-apple" aria-hidden="true"></i></a></c:if>
          </span>
        </div>
      </header>

      <%-- the clip on its own wide stage above the lyrics; water and fire flow out of it with the music (js/clip-fx.js) --%>
      <c:if test="${not empty lyric.youtubeId or not empty lyric.previewImageUrl}">
      <section class="clip-stage lyric-stage${not empty lyric.youtubeId ? ' has-fx' : ''}"${not empty lyric.youtubeId ? ' data-clip-fx' : ''}>
      <c:if test="${not empty lyric.youtubeId}"><canvas class="clip-fx-gl" aria-hidden="true"></canvas><canvas class="clip-fx-2d" aria-hidden="true"></canvas></c:if>
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
          <div class="video-wrapper" id="ytFacade" data-clip-player data-yt="<c:out value='${lyric.youtubeId}'/>">
            <button type="button" class="yt-facade" aria-label="<%= t.getProperty("lyric.openYoutube","Přehrát video") %>">
              <c:choose>
                <c:when test="${not empty lyric.previewImageUrl}">
                  <img class="yt-facade-img" src="<c:out value='${lyric.previewImageUrl}'/>" alt="">
                </c:when>
                <c:otherwise>
                  <img class="yt-facade-img" src="/yt-thumb/<c:out value='${lyric.youtubeId}'/>/hqdefault.jpg" alt="">
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
              // enablejsapi lets the player tell the effect around it where the song is
              iframe.src = 'https://www.youtube-nocookie.com/embed/' + box.getAttribute('data-yt') + '?autoplay=1&rel=0&enablejsapi=1&origin=' + encodeURIComponent(location.origin)
                + (box.dataset.start ? '&start=' + parseInt(box.dataset.start, 10) : '');   // „Pustit od 2:15“ (karta s výzvou)
              iframe.setAttribute('frameborder', '0');
              iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
              iframe.setAttribute('allowfullscreen', '');
              box.innerHTML = '';
              box.appendChild(iframe);
              window.dispatchEvent(new CustomEvent('kevin', { detail: { clip: 'ok' } }));
              window.dispatchEvent(new CustomEvent('skeli:play', { detail: { yt: box.getAttribute('data-yt') } }));
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
                + '<img class="yt-facade-img" src="/yt-thumb/' + id + '/hqdefault.jpg" alt="">'
                + '<span class="yt-facade-play" aria-hidden="true"><i class="fab fa-youtube"></i></span></button>';
              bind();
              var yt = document.querySelector('a.listen-yt');
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
      <%-- wide screens: previous / next beside the clip, see-through, out where the water and fire thin out --%>
      <c:if test="${not empty prevSong or not empty nextSong}">
        <nav class="stage-pager" aria-label="<%= t.getProperty("lyrics.pager") %>">
          <c:if test="${not empty prevSong}">
            <a class="stage-arrow stage-prev" href="/<%= cur %>/song/${prevSong.uuid}" rel="prev" aria-label="<%= t.getProperty("lyrics.prev") %>: <c:out value='${prevSong.shortName}'/>"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i><span class="stage-arrow-name" aria-hidden="true"><c:out value="${prevSong.shortName}"/></span></a>
          </c:if>
          <c:if test="${not empty nextSong}">
            <a class="stage-arrow stage-next" href="/<%= cur %>/song/${nextSong.uuid}" rel="next" aria-label="<%= t.getProperty("lyrics.next") %>: <c:out value='${nextSong.shortName}'/>"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i><span class="stage-arrow-name" aria-hidden="true"><c:out value="${nextSong.shortName}"/></span></a>
          </c:if>
        </nav>
      </c:if>
      </div>
      <c:if test="${not empty lyric.youtubeId}"><div class="stage-under"><%@ include file="/includes/clip-fx-switch.jspf" %></div></c:if>
      </section>
      </c:if>

      <!-- The lyrics in a frame that fades out at the bottom -->
      <section class="lyric-main">
      <%-- reading the lyrics: karaoke (when the clip has timings) and Aa = size and font, in the corner of the frame --%>
      <div class="lyric-tools">
        <c:if test="${not empty lyric.youtubeId}">
          <button type="button" class="tool-btn karaoke-btn" id="karaokeToggle" hidden aria-pressed="true" data-back="<%= t.getProperty("karaoke.back") %>" data-fs="<%= t.getProperty("karaoke.fullscreen") %>" data-fs-text="<%= t.getProperty("karaoke.fsText") %>" data-fs-exit="<%= t.getProperty("karaoke.fsExit") %>" title="<%= t.getProperty("lyric.karaokeHint") %>" aria-label="<%= t.getProperty("lyric.karaokeHint") %>">
            <i class="fa-solid fa-microphone-lines" aria-hidden="true"></i>
          </button>
        </c:if>
        <details class="lyric-view">
          <summary class="tool-btn" title="<%= t.getProperty("lyric.display") %>" aria-label="<%= t.getProperty("lyric.display") %>">Aa</summary>
          <div class="lyric-view-menu">
            <div class="lyric-textsize" role="group" aria-label="<%= t.getProperty("lyric.textSize") %>">
              <span><%= t.getProperty("lyric.textSize") %></span>
              <button type="button" class="ts-btn" data-step="-1" aria-label="<%= t.getProperty("lyric.textSmaller") %>" title="<%= t.getProperty("lyric.textSmaller") %>">A−</button>
              <button type="button" class="ts-btn" data-step="1" aria-label="<%= t.getProperty("lyric.textBigger") %>" title="<%= t.getProperty("lyric.textBigger") %>">A+</button>
            </div>
            <%-- a plain, easier to read font for the lyrics (remembered in this browser) --%>
            <button type="button" class="plain-font-btn" id="plainFont" aria-pressed="false"><span class="plain-font-mark" aria-hidden="true">Aa</span> <%= t.getProperty("lyric.plainFont") %></button>
          </div>
        </details>
      </div>

      <!-- Lyrics Text -->
      <article class="lyric-body">
        <%-- text v cizím jazyce: přepínač Originál (česky) · Překlad · Obojí (js/lyric-bilingual.js) --%>
        <c:if test="${not empty originalWords}">
          <div class="lyric-mode" role="group" aria-label="<%= t.getProperty("lyric.mode.label") %>">
            <button type="button" data-mode="orig" aria-pressed="false"><%= t.getProperty("lyric.mode.orig") %></button>
            <button type="button" data-mode="tr" aria-pressed="false"><%= t.getProperty("lyric.mode.tr") %></button>
            <button type="button" data-mode="both" aria-pressed="true"><%= t.getProperty("lyric.mode.both") %></button>
          </div>
        </c:if>
        <div class="lyrics-text">
          <pre lang="<%= cur %>"><c:out value="${lyric.words}"/></pre>
          <c:if test="${not empty originalWords}"><template id="lyric-original"><c:out value="${originalWords}"/></template></c:if>
        </div>
      </article>
      </section>
      <c:if test="${not empty originalWords}"><script src="/js/lyric-bilingual.js?v=<%= assetVersion %>"></script></c:if>
      <c:if test="${not empty lyric.youtubeId}"><script src="/js/clip-fx.js?v=<%= assetVersion %>"></script><script src="/js/yt-clock.js?v=<%= assetVersion %>"></script><script src="/js/karaoke.js?v=<%= assetVersion %>"></script></c:if>

      <%-- v textu chybí kus (admin → píseň → „Hledáme pomoc s textem“): návštěvník, který tomu rozumí, ho napíše;
           čeká to v adminu, na web nic nejde samo. MC Kevin na kartu jednou upozorní. --%>
      <c:if test="${not empty helpSong}">
        <section class="lyric-help content-box card-gold" id="lyric-help" data-song="${helpSong}" data-lang="<c:out value='${helpLang}'/>">
          <h2><i class="fa-solid fa-pen-nib" aria-hidden="true"></i> <%= t.getProperty("help.title") %></h2>
          <p><%= t.getProperty("help.text") %></p>
          <p class="lyric-help-meta">
            <c:if test="${not empty helpLang}"><span><%= t.getProperty("help.lang") %>: <b><c:out value="${helpLang}"/></b></span></c:if>
            <c:if test="${not empty helpTime}"><span><%= t.getProperty("help.from") %> <b><c:out value="${helpTime}"/></b></span></c:if>
          </p>
          <c:if test="${not empty helpFrom and not empty lyric.youtubeId}">
            <button type="button" class="link-btn lyric-help-play" data-from="${helpFrom}"><i class="fa-solid fa-play" aria-hidden="true"></i>
              <%= t.getProperty("help.play").replace("{time}", String.valueOf(request.getAttribute("helpTime"))) %></button>
          </c:if>
          <form class="lyric-help-form" method="post" action="/api/lyric-help"
                data-thanks="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("help.thanks")) %>"
                data-empty="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("help.empty")) %>"
                data-fail="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("help.fail")) %>"
                data-limit="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("help.limit")) %>">
            <input type="hidden" name="csrf" value="${csrf}">
            <input type="hidden" name="song" value="${helpSong}">
            <div class="hp-field" aria-hidden="true"><input type="text" name="website" tabindex="-1" autocomplete="off"></div>
            <textarea name="message" rows="7" maxlength="5000" aria-label="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("help.title")) %>"
                      placeholder="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("help.placeholder")) %>"></textarea>
            <div class="lyric-help-actions">
              <button type="submit" class="btn-primary"><i class="fa-solid fa-paper-plane" aria-hidden="true"></i> <%= t.getProperty("help.send") %></button>
              <p class="lyric-help-msg" role="status" hidden></p>
            </div>
          </form>
          <script>
          (function () {
            var card = document.getElementById('lyric-help');
            if (!card) return;
            // pustit od místa, kde chybějící kus začíná: náhled spustí klip rovnou tam, běžící klip tam skočí
            var play = card.querySelector('.lyric-help-play');
            if (play) play.addEventListener('click', function () {
              var from = parseInt(play.dataset.from, 10) || 0, box = document.getElementById('ytFacade');
              if (!box) return;
              var frame = box.querySelector('iframe'), facade = box.querySelector('.yt-facade');
              if (frame) {
                ['seekTo', 'playVideo'].forEach(function (fn) {
                  frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: fn, args: fn === 'seekTo' ? [from, true] : [] }), '*');
                });
              } else if (facade) {
                box.dataset.start = String(from);
                facade.click();
              }
              box.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            var form = card.querySelector('.lyric-help-form'), msg = card.querySelector('.lyric-help-msg');
            function note(text, ok) { msg.textContent = text; msg.hidden = false; msg.classList.toggle('ok', !!ok); }
            form.addEventListener('submit', function (e) {
              e.preventDefault();
              var text = form.message.value.trim(), btn = form.querySelector('button[type=submit]');
              if (text.length < 3) { note(form.dataset.empty); form.message.focus(); return; }
              btn.disabled = true;
              fetch(form.action, { method: 'POST', body: new URLSearchParams(new FormData(form)), credentials: 'same-origin' })
                .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return [r.status, j]; }); })
                .then(function (res) {
                  if (res[1].ok) {
                    form.message.value = '';
                    note(form.dataset.thanks, true);
                  } else note(res[0] === 429 ? form.dataset.limit : res[1].error === 'empty' ? form.dataset.empty : form.dataset.fail);
                })
                .catch(function () { note(form.dataset.fail); })
                .then(function () { btn.disabled = false; });
            });
          })();
          </script>
        </section>
      </c:if>

      <%-- the songs around this one in the newest-first list (also the ← → keys) --%>
      <c:if test="${not empty prevSong or not empty nextSong}">
        <nav class="lyric-pager" aria-label="<%= t.getProperty("lyrics.pager") %>">
          <c:if test="${not empty prevSong}">
            <a class="pager-link pager-prev" rel="prev" href="/<%= cur %>/song/${prevSong.uuid}">
              <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
              <span class="pager-thumb" aria-hidden="true"><c:if test="${not empty prevSong.thumbUrl}"><img src="<c:out value='${prevSong.thumbUrl}'/>" alt="" loading="lazy"></c:if></span>
              <span class="pager-text"><span class="pager-label"><%= t.getProperty("lyrics.prev") %></span>
                <span class="pager-name"><c:out value="${prevSong.shortName}"/></span></span>
            </a>
          </c:if>
          <c:if test="${not empty nextSong}">
            <a class="pager-link pager-next" rel="next" href="/<%= cur %>/song/${nextSong.uuid}">
              <span class="pager-text"><span class="pager-label"><%= t.getProperty("lyrics.next") %></span>
                <span class="pager-name"><c:out value="${nextSong.shortName}"/></span></span>
              <span class="pager-thumb" aria-hidden="true"><c:if test="${not empty nextSong.thumbUrl}"><img src="<c:out value='${nextSong.thumbUrl}'/>" alt="" loading="lazy"></c:if></span>
              <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </a>
          </c:if>
        </nav>
      </c:if>

      <!-- Comments -->
      <div class="content-box lyric-comments">
        <%-- comments like on YouTube (includes/comments.jspf + js/comments.js) --%>
<%
  com.github.skeliit.model.LyricView lyricView = (com.github.skeliit.model.LyricView) request.getAttribute("lyric");
  String cmtKind = "lyric", cmtTarget = String.valueOf(lyricView.id);
%>
<%@ include file="/includes/comments.jspf" %>
      </div>
      
    </div>
  </c:if>
  <script>
    // ← / → go to the previous / next song; one listener for the whole visit (pages come in by PJAX)
    if (!window.lyricPagerKeys) {
      window.lyricPagerKeys = true;
      document.addEventListener('keydown', function (e) {
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        const el = document.activeElement;
        if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.closest('.lyric-nav'))) return;
        const link = document.querySelector('.lyric-pager ' + (e.key === 'ArrowLeft' ? '.pager-prev' : '.pager-next'));
        if (link) link.click();
      });
    }
  </script>
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

    // A playing clip that is scrolled out of view shrinks to a small player in the
    // bottom-left corner, so it can be watched while reading long lyrics.
    (function () {
      const box = document.querySelector('.lyric-media .video-box');
      const player = document.getElementById('ytFacade');
      if (!box || !player || !('IntersectionObserver' in window)) return;
      let dismissed = false;
      function playing() { return !!player.querySelector('iframe'); }
      function dock() {
        player.classList.remove('is-mini');
        box.style.minHeight = '';
      }
      new IntersectionObserver(function (entries) {
        const visible = entries[0].isIntersecting;
        if (visible) { dismissed = false; dock(); return; }
        if (!playing() || dismissed) return;
        box.style.minHeight = box.offsetHeight + 'px'; // keep the gap while the player floats
        if (!player.querySelector('.mini-close')) {
          const close = document.createElement('button');
          close.type = 'button';
          close.className = 'mini-close';
          close.setAttribute('aria-label', '<%= com.github.skeliit.WebUtils.escapeJs(t.getProperty("player.hide")) %>');
          close.innerHTML = '<i class="fa-solid fa-xmark"></i>';
          close.addEventListener('click', function () { dismissed = true; dock(); });
          player.appendChild(close);
        }
        player.classList.add('is-mini');
      }, { threshold: 0.15 }).observe(box);
    })();

    // A− / A+ for the lyrics, remembered in this browser
    (function () {
      const KEY = 'lyricScale';
      let scale = 1;
      try { scale = parseFloat(localStorage.getItem(KEY)) || 1; } catch (e) {}
      function apply() { document.documentElement.style.setProperty('--lyric-scale', scale.toFixed(2)); }
      apply();
      document.querySelectorAll('.ts-btn[data-step]').forEach(function (b) {
        b.addEventListener('click', function () {
          scale = Math.min(1.8, Math.max(0.8, scale + 0.1 * Number(b.dataset.step)));
          apply();
          try { localStorage.setItem(KEY, scale.toFixed(2)); } catch (e) {}
        });
      });
      // Aa: the lyrics in a plain font instead of the capitals of Bruno Ace
      const font = document.getElementById('plainFont');
      let plain = false;
      try { plain = localStorage.getItem('lyricFont') === 'plain'; } catch (e) {}
      function paintFont() {
        document.documentElement.classList.toggle('lyric-plain', plain);
        if (font) font.setAttribute('aria-pressed', String(plain));
      }
      paintFont();
      if (font) font.addEventListener('click', function () {
        plain = !plain;
        paintFont();
        try { localStorage.setItem('lyricFont', plain ? 'plain' : 'brand'); } catch (e) {}
      });
    })();

    // the heart: given or taken back without reloading the page
    (function () {
      const like = document.getElementById('likeSong');
      document.querySelectorAll('a[data-login-next]').forEach(function (a) { a.href = '/login.jsp?next=' + encodeURIComponent(location.pathname); });
      if (!like) return;
      const csrf = (document.querySelector('input[name=csrf]') || {}).value || '';
      like.addEventListener('click', function () {
        like.disabled = true;
        fetch('/vote', { method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-Token': csrf },
          body: 'lyric_id=' + encodeURIComponent(like.dataset.lyric) })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d) {
            like.disabled = false;
            if (!d) return;
            like.classList.toggle('on', d.liked);
            like.setAttribute('aria-pressed', String(d.liked));
            like.querySelector('i').className = (d.liked ? 'fa-solid' : 'fa-regular') + ' fa-heart';
            like.querySelector('.like-count').textContent = d.likes > 0 ? d.likes : '';
            if (d.liked) { like.classList.remove('pop'); void like.offsetWidth; like.classList.add('pop'); }
            window.dispatchEvent(new CustomEvent('kevin', { detail: { heart: d.liked ? 'on' : 'off' } }));
          })
          .catch(function () { like.disabled = false; });
      });
    })();

    (function () {
      const btn = document.getElementById('shareLyric');
      if (!btn) return;
      btn.addEventListener('click', function () {
        const uuid = '<c:out value="${lyric.songUuid}"/>';
        const path = '<c:out value="${lyric.publicPath}"/>';
        const url = path
          ? (location.origin + path)
          : (uuid ? (location.origin + '/<%= cur %>/song/' + uuid) : location.href);
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