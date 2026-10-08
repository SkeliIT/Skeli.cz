// "Online now" in the footer + visit counting (PresenceServlet / VisitStats).
// One request when a page is shown (also after PJAX navigation), then one a minute while the tab is visible.
// No cookies of its own, nothing stored in the browser.
(function () {
  const box = document.getElementById('onlineNow');
  function ping(newPage) {
    let url = '/api/presence';
    if (newPage) {
      const main = document.querySelector('main[data-lyric-id]');
      url += '?view=1' + (main ? '&lyric=' + encodeURIComponent(main.dataset.lyricId) : '');
    }
    fetch(url, { credentials: 'same-origin', cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (!j || !box || typeof j.online !== 'number') return;
        box.querySelector('b').textContent = Math.max(1, j.online); // you are here, at least
        box.hidden = false;
      })
      .catch(() => {});
  }
  ping(true);
  document.addEventListener('pjax:done', () => ping(true));
  setInterval(() => { if (!document.hidden) ping(false); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) ping(false); });
})();
