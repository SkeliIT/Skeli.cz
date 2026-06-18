<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="includes/header.jsp" %>
<main>
  <h2 class="bruno-ace-sc-regular text-center" style="margin-top:0;">Aktuality</h2>
  <section class="card" style="max-width:1000px; margin:0 auto;">
    <div id="social-feed" class="news-grid"></div>
    <div id="feed-empty" style="display:none; text-align:center; opacity:.6; padding:24px 0;">Žádné příspěvky k zobrazení.</div>
    <div class="text-center" style="margin-top:12px;">
      <button id="load-more" class="newsletter button" style="display:none;">Načíst další</button>
    </div>
  </section>
</main>
<script>
(function(){
  var PAGE = 12;
  var offset = 0, loading = false, done = false;
  var feed = document.getElementById('social-feed');
  var btn  = document.getElementById('load-more');
  var empty = document.getElementById('feed-empty');

  function sourceBadge(source) {
    if (source === 'instagram') return '<i class="fab fa-instagram"></i>';
    if (source === 'facebook')  return '<i class="fab fa-facebook"></i>';
    return '📰';
  }

  function card(p) {
    var img = p.image ? '<img src="' + p.image + '" alt="" class="news-image">' : '';
    var cap = (p.caption || '').slice(0, 200);
    var badge = sourceBadge(p.source);
    var date = p.createdAt ? new Date(p.createdAt).toLocaleDateString('cs-CZ') : '';
    return '<a href="' + p.permalink + '" target="_blank" rel="noopener" class="news-card">'
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
    try {
      var res = await fetch('/api/social-posts?limit=' + PAGE + '&offset=' + offset);
      if (!res.ok) { done = true; return; }
      var arr = await res.json();
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
      loading = false;
      btn.disabled = false;
    }
  }

  btn.addEventListener('click', load);
  load();
})();
</script>
<%@ include file="includes/footer.jsp" %>
