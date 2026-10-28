// Cookie consent with categories (no dark patterns: "Accept all" and "Reject all" look the same).
//   necessary  – sign-in cookie, settings in the browser: always on, never asked
//   (měření návštěvnosti přes Matomo bylo odstraněno – stačí logy serveru a vlastní počítadlo bez cookies)
//   media      – YouTube / Spotify players (they see the IP address)
// Stored in localStorage 'consent' = {"v":1,"analytics":bool,"media":bool,"at":"…"}.
// 'cookieConsent' ('true'/'false' = media) stays for the older code (players, Spotify bar, Kevin).
// The choice can be changed any time: footer link "Cookie settings" (a[data-cookie-settings]).
(function () {
  const KEY = 'consent', LEGACY = 'cookieConsent';
  const bar = document.getElementById('cookieBar');
  if (!bar) return;
  const prefs = bar.querySelector('.cookie-prefs');
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
    if (c.media && !(before && before.media)) document.dispatchEvent(new Event('consent-granted'));
  }

  // ---------- the bar ----------
  function show(withPrefs) {
    const c = read();
    boxMedia.checked = !!(c && c.media);
    prefs.hidden = !withPrefs;
    bar.querySelector('[data-consent=settings]').setAttribute('aria-expanded', String(!!withPrefs));
    bar.style.display = 'block';
    if (withPrefs) boxMedia.focus();
  }
  function hide() { bar.style.display = 'none'; }

  bar.addEventListener('click', function (e) {
    const b = e.target.closest('[data-consent]');
    if (!b) return;
    const what = b.dataset.consent;
    if (what === 'all') save(true, true);
    else if (what === 'none') save(false, false);
    else if (what === 'save') save(false, boxMedia.checked);
    else if (what === 'settings') {
      prefs.hidden = !prefs.hidden;
      b.setAttribute('aria-expanded', String(!prefs.hidden));
      if (!prefs.hidden) boxMedia.focus();
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
