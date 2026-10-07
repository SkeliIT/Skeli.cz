<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="includes/header.jsp" %>
<%@ taglib prefix="sk" tagdir="/WEB-INF/tags" %>
<main class="news-page">
  <sk:pageHero photo="square" pos="center 40%" day="panorama" dayPos="68% center" kicker='<%= t.getProperty("hero.kicker.news") %>'
               title='<%= t.getProperty("menu.news") %>' lead='<%= t.getProperty("news.lead") %>'>
    <div class="filter-chips" id="sourceChips" role="group" aria-label="${t['news.filter']}">
      <button type="button" class="chip active" data-source="">${t['lyrics.filter.all']}</button>
      <button type="button" class="chip" data-source="instagram"><i class="fab fa-instagram"></i> Instagram</button>
      <button type="button" class="chip" data-source="youtube"><i class="fab fa-youtube"></i> YouTube</button>
    </div>
  </sk:pageHero>
  <section class="news-feed">
    <div id="social-feed" class="news-grid"></div>
    <div id="feed-empty" class="empty-note" style="display:none;"><%= t.getProperty("news.empty") %></div>
    <div class="news-more">
      <button id="load-more" type="button" class="btn" style="display:none;"><%= t.getProperty("news.loadMore") %></button>
    </div>
  </section>
<script>
(function(){
  var PAGE = 12;
  var offset = 0, loading = false, done = false;
  var feed = document.getElementById('social-feed');
  var btn  = document.getElementById('load-more');
  var empty = document.getElementById('feed-empty');
  var chips = document.getElementById('sourceChips');
  var source = '', round = 0;
  // another source: start the feed again (an answer for the previous filter is dropped)
  chips.addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b || b.dataset.source === source) return;
    chips.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('active', c === b); });
    source = b.dataset.source;
    round++;
    offset = 0; done = false; loading = false;
    feed.innerHTML = '';
    empty.style.display = 'none';
    load();
  });

  function sourceBadge(source) {
    if (source === 'instagram') return '<i class="fab fa-instagram"></i>';
    if (source === 'facebook')  return '<i class="fab fa-facebook"></i>';
    if (source === 'youtube')   return '<i class="fab fa-youtube"></i>';
    return '<i class="fa-solid fa-newspaper"></i>';
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // http(s) links, or paths on this site (downloaded Instagram images); never "//host" or "javascript:"
  function safeUrl(u) {
    return /^(https?:\/\/|\/(?!\/))/i.test(u || '') ? esc(u) : '#';
  }

  function card(p) {
    var img = p.image ? '<img src="' + safeUrl(p.image) + '" alt="" class="news-image">' : '';
    var cap = esc((p.caption || '').slice(0, 200));
    var badge = sourceBadge(p.source);
    var date = p.createdAt ? esc(new Date(p.createdAt).toLocaleDateString('<%= com.github.skeliit.WebUtils.escapeJs(t.getProperty("meta.locale")) %>')) : '';
    return '<a href="' + safeUrl(p.permalink) + '" target="_blank" rel="noopener" class="news-card">'
      + img
      + '<span class="news-badge">' + badge + '</span>'
      + '<div class="news-info">'
      + '<div class="news-title">' + cap + '</div>'
      + '<div class="news-date">' + date + '</div>'
      + '</div></a>';
  }

  async function load() {
    if (loading || done) return;
    loading = true;
    btn.disabled = true;
    var mine = round;
    try {
      var res = await fetch('/api/social-posts?limit=' + PAGE + '&offset=' + offset + (source ? '&source=' + source : ''));
      if (mine !== round) return;
      if (!res.ok) { done = true; return; }
      var arr = await res.json();
      if (mine !== round) return;
      if (!Array.isArray(arr) || arr.length === 0) {
        done = true;
        btn.style.display = 'none';
        if (offset === 0) { empty.style.display = ''; }
        return;
      }
      feed.insertAdjacentHTML('beforeend', arr.map(card).join(''));
      offset += arr.length;
      if (arr.length < PAGE) { done = true; btn.style.display = 'none'; }
      else { btn.style.display = ''; }
    } catch(e) {
      done = true;
    } finally {
      if (mine === round) {
        loading = false;
        btn.disabled = false;
      }
    }
  }

  btn.addEventListener('click', load);
  load();
})();
</script>
</main>
<%@ include file="includes/footer.jsp" %>
