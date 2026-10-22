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
  // A clip started anywhere on the site, counted for the admin's "what is played most" (the server counts
  // each clip once a day per visitor; here once per page): the event 'skeli:play' {yt} from our own play
  // buttons, or a YouTube player on the page reporting "playing" (players with enablejsapi=1).
  const counted = new Set();
  function countClip(yt) {
    if (!yt || counted.has(yt) || !/^[\w-]{6,20}$/.test(yt)) return;
    counted.add(yt);
    fetch('/api/presence?play=clip&id=' + encodeURIComponent(yt), { credentials: 'same-origin', cache: 'no-store' }).catch(() => {});
  }
  window.addEventListener('skeli:play', e => countClip(e.detail && e.detail.yt));
  window.addEventListener('message', e => {
    if (!/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(e.origin)) return;
    let m;
    try { m = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (x) { return; }
    const info = m && m.info;
    const state = m && m.event === 'onStateChange' ? info : info && info.playerState;
    if (state !== 1) return;
    const frame = Array.from(document.querySelectorAll('iframe')).find(f => f.contentWindow === e.source);
    countClip(frame && (frame.src.match(/\/embed\/([\w-]{6,20})/) || [])[1]);
  });
  // ---------- statistiky pro marketing (/api/hit → MarketingStats): jen počty, nic o člověku ----------
  function hit(params) {
    fetch('/api/hit?' + new URLSearchParams(params), { credentials: 'same-origin', cache: 'no-store', keepalive: true }).catch(() => {});
  }
  // druh stránky, na které se kliklo ven
  function pageKind() {
    const p = location.pathname;
    if (/\/song\/|\/lyrics\//.test(p)) return 'song';
    if (/music/.test(p)) return 'music';
    if (p === '/' || /index\.jsp$/.test(p)) return 'home';
    if (/texty/.test(p)) return 'lyrics';
    if (/about/.test(p)) return 'about';
    if (/aktuality/.test(p)) return 'news';
    if (/karaoke/.test(p)) return 'karaoke';
    return 'other';
  }
  // začátek návštěvy (jednou za otevřenou kartu prohlížeče): odkud přišel (jen adresa webu) a štítek
  // kampaně z odkazu, např. skeli.cz/?z=ig-bio (bere i utm_source)
  try {
    if (!sessionStorage.getItem('skVisit')) {
      sessionStorage.setItem('skVisit', '1');
      let ref = '';
      try { const r = new URL(document.referrer); if (r.host !== location.host) ref = r.hostname; } catch (x) { /* žádný odkaz */ }
      const q = new URLSearchParams(location.search);
      hit({ k: 'visit', ref: ref, z: q.get('z') || q.get('utm_source') || '' });
    }
  } catch (x) { /* soukromé okno bez sessionStorage: nepočítá se */ }
  // kliknutí ven na Spotify, Apple Music, YouTube a sociální sítě
  const OUT = [[/(^|\.)spotify\.com$/, 'spotify'], [/(^|\.)music\.apple\.com$/, 'apple'], [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube'],
    [/(^|\.)instagram\.com$/, 'instagram'], [/(^|\.)facebook\.com$/, 'facebook'], [/(^|\.)tiktok\.com$/, 'tiktok']];
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    let host;
    try { host = new URL(a.href, location.href).hostname; } catch (x) { return; }
    const hitOut = OUT.find(o => o[0].test(host));
    if (hitOut) hit({ k: 'out', t: hitOut[1], p: pageKind() });
  }, true);
  // hledání v Textech (texty.jsp pošle událost, až člověk dopíše): výraz a jestli se něco našlo
  window.addEventListener('skeli:search', e => {
    const d = e.detail || {};
    if (d.q && d.q.length >= 2) hit({ k: 'search', q: d.q, f: d.found ? '1' : '0' });
  });
  setInterval(() => { if (!document.hidden) ping(false); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) ping(false); });
})();
