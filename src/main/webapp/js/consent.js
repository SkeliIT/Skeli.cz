// Cookie consent with categories (no dark patterns: "Accept all" and "Reject all" look the same).
//   necessary  – sign-in cookie, settings in the browser: always on, never asked
//   analytics  – Matomo on the operator's server: loaded ONLY after consent (no request before)
//   media      – YouTube / Spotify players (they see the IP address)
// Stored in localStorage 'consent' = {"v":1,"analytics":bool,"media":bool,"at":"…"}.
// 'cookieConsent' ('true'/'false' = media) stays for the older code (players, Spotify bar, MC Kevin).
// The choice can be changed any time: footer link "Cookie settings" (a[data-cookie-settings]).
(function () {
  const KEY = 'consent', LEGACY = 'cookieConsent';
  const bar = document.getElementById('cookieBar');
  if (!bar) return;
  const prefs = bar.querySelector('.cookie-prefs');
  const boxAnalytics = document.getElementById('consentAnalytics');
  const boxMedia = document.getElementById('consentMedia');

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
      // a visitor who answered the old bar: its "Accept" covered the players and analytics
      const old = localStorage.getItem(LEGACY);
      if (old === 'true') return { v: 1, analytics: true, media: true };
      if (old === 'false') return { v: 1, analytics: false, media: false };
    } catch (e) { /* storage blocked: ask again */ }
    return null;
  }

  function save(analytics, media) {
    const before = read();
    const c = { v: 1, analytics: !!analytics, media: !!media, at: new Date().toISOString() };
    try {
      localStorage.setItem(KEY, JSON.stringify(c));
      localStorage.setItem(LEGACY, c.media ? 'true' : 'false');
    } catch (e) { /* no storage: the choice holds for this page only */ }
    hide();
    apply(c, before);
  }

  function apply(c, before) {
    if (c.analytics) loadMatomo();
    else if (before && before.analytics && window._paq) window._paq.push(['forgetConsentGiven']);
    if (c.media && !(before && before.media)) document.dispatchEvent(new Event('consent-granted'));
  }

  // ---------- Matomo (only after consent) ----------
  let matomoLoaded = false;
  function loadMatomo() {
    if (matomoLoaded) return;
    matomoLoaded = true;
    const _paq = window._paq = window._paq || [];
    const u = 'https://matomo.vitexsoftware.com/';
    _paq.push(['requireConsent']);
    _paq.push(['setConsentGiven']);
    _paq.push(['setTrackerUrl', u + 'matomo.php']);
    _paq.push(['setSiteId', '18']);
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    const g = document.createElement('script');
    g.async = true;
    g.src = u + 'matomo.js';
    document.head.appendChild(g);
  }
  document.addEventListener('pjax:done', function (e) {
    if (!matomoLoaded) return;
    window._paq.push(['setCustomUrl', e.detail && e.detail.url ? e.detail.url : location.href]);
    window._paq.push(['setDocumentTitle', document.title]);
    window._paq.push(['trackPageView']);
  });

  // ---------- the bar ----------
  function show(withPrefs) {
    const c = read();
    boxAnalytics.checked = !!(c && c.analytics);
    boxMedia.checked = !!(c && c.media);
    prefs.hidden = !withPrefs;
    bar.querySelector('[data-consent=settings]').setAttribute('aria-expanded', String(!!withPrefs));
    bar.style.display = 'block';
    if (withPrefs) boxAnalytics.focus();
  }
  function hide() { bar.style.display = 'none'; }

  bar.addEventListener('click', function (e) {
    const b = e.target.closest('[data-consent]');
    if (!b) return;
    const what = b.dataset.consent;
    if (what === 'all') save(true, true);
    else if (what === 'none') save(false, false);
    else if (what === 'save') save(boxAnalytics.checked, boxMedia.checked);
    else if (what === 'settings') {
      prefs.hidden = !prefs.hidden;
      b.setAttribute('aria-expanded', String(!prefs.hidden));
      if (!prefs.hidden) boxAnalytics.focus();
    }
  });
  document.addEventListener('click', function (e) {
    const link = e.target.closest('[data-cookie-settings]');
    if (!link) return;
    e.preventDefault();
    show(true);
  });

  const current = read();
  if (current) apply(current, null);
  else show(false);
})();
