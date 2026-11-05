// Záložky profilu: vidět je vždy jedna část podle #kotvy (i kotva uvnitř části, třeba #odznaky v Hrách). Výchozí je první.
// Bez JavaScriptu jsou vidět všechny části pod sebou. Skript je uvnitř <main>, takže běží i po přechodu přes PJAX.
(function () {
  function show(scroll) {
    var parts = [].slice.call(document.querySelectorAll('main .pt-tab[id]'));
    if (!parts.length) return;
    var hash = location.hash ? location.hash.slice(1) : '';
    var want = hash ? document.getElementById(hash) : null;
    var part = (want && parts.filter(function (p) { return p === want || p.contains(want); })[0]) || parts[0];
    parts.forEach(function (p) { p.hidden = p !== part; });
    document.querySelectorAll('.profile-tabs a').forEach(function (a) {
      var on = a.getAttribute('href') === '#' + part.id;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (scroll && want && want !== part) want.scrollIntoView({ block: 'start' });
  }
  // jeden posluchač pro celou návštěvu: čte vždy aktuální stránku
  if (!window.__profileTabs) {
    window.__profileTabs = true;
    window.addEventListener('hashchange', function () { show(true); });
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('.profile-tabs a');
      if (!a) return;
      e.preventDefault();
      history.replaceState(null, '', a.getAttribute('href'));
      show(false);
      var nav = a.closest('.profile-tabs'), top = nav.getBoundingClientRect().top + scrollY - 90;
      if (scrollY > top) scrollTo(0, top);
    });
  }
  show(true);
})();
