<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="includes/header.jsp" %>
<main>
  <h2 class="bruno-ace-sc-regular" style="text-align:center; margin-top:0;">Aktuality</h2>
  <section class="card" style="background: var(--panel); border:1px solid var(--panel-border); border-radius:12px; padding:16px; box-shadow: 0 6px 18px rgba(0,0,0,0.20); max-width:1000px; margin:0 auto;">
    <div id="social-feed" style="display:grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap:12px;"></div>
    <div id="feed-empty" style="display:none; text-align:center; opacity:.6; padding:24px 0;">Žádné příspěvky k zobrazení.</div>
    <div style="text-align:center; margin-top:12px;">
      <button id="load-more" style="background:transparent; border:1px solid var(--panel-border); color:var(--text); padding:8px 12px; border-radius:8px; cursor:pointer; display:none;">Načíst další</button>
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
    var img = p.image ? '<img src="' + p.image + '" alt="" style="width:100%;height:180px;object-fit:cover;display:block;">' : '';
    var cap = (p.caption || '').slice(0, 200);
    var badge = sourceBadge(p.source);
    var date = p.createdAt ? new Date(p.createdAt).toLocaleDateString('cs-CZ') : '';
    return '<a href="' + p.permalink + '" target="_blank" rel="noopener"'
      + ' style="text-decoration:none;color:inherit;border:1px solid var(--panel-border);border-radius:10px;overflow:hidden;background:rgba(0,0,0,0.55);display:block;position:relative;">'
      + img
      + '<span style="position:absolute;left:8px;top:8px;background:rgba(0,0,0,0.5);padding:2px 6px;border-radius:6px;font-size:.85em;">' + badge + '</span>'
      + '<div style="padding:8px;">'
      + '<div style="font-size:.95em;">' + cap + '</div>'
      + '<div style="font-size:.8em;opacity:.6;margin-top:4px;">' + date + '</div>'
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
