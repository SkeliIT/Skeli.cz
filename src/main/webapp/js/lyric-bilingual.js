// Text písně pro zahraniční návštěvníky: Originál (česky) · Překlad · Obojí (český řádek a pod ním překlad).
// Stránka písně v jiném jazyce než češtině má v <template id="lyric-original"> český text; v <pre> je překlad.
// Volba se pamatuje v prohlížeči (localStorage.lyricMode), výchozí je Obojí.
// Karaoke (js/karaoke.js) skládá řádky přes LyricText.build, takže zlatě svítí zpívaný český řádek a pod ním
// běží překlad jako titulky. Bez šablony (česká stránka) se nic nemění.
(function () {
  var pre = document.querySelector('.lyric-page .lyrics-text pre');
  var tpl = document.getElementById('lyric-original');
  if (!pre || !tpl) return;
  var orig = tpl.content ? tpl.content.textContent : tpl.textContent;
  var tr = pre.textContent;
  var trLang = pre.getAttribute('lang') || document.documentElement.lang || '';
  var mode = 'both';
  try { mode = localStorage.getItem('lyricMode') || 'both'; } catch (e) {}
  if (['orig', 'tr', 'both'].indexOf(mode) < 0) mode = 'both';

  function nonEmpty(text) { return text.split('\n').filter(function (l) { return l.trim(); }); }

  // Postaví text v <pre> podle režimu. lineFactory (karaoke) vyrobí prvek pro každý zpívaný řádek;
  // bez ní je řádek obyčejný span.
  function build(target, lineFactory) {
    target = target || pre;
    target.textContent = '';
    target.classList.toggle('bi', mode === 'both');
    var primary = mode === 'tr' ? tr : orig;
    if (mode !== 'both') {
      if (!lineFactory) { target.textContent = primary; return; }
      primary.split('\n').forEach(function (line, i, all) {
        if (line.trim()) target.appendChild(lineFactory(line));
        else if (line) target.appendChild(document.createTextNode(line));
        if (i < all.length - 1) target.appendChild(document.createTextNode('\n'));
      });
      return;
    }
    // Obojí: každý český řádek je blok, pod ním menší překlad; prázdný řádek = mezera mezi slokami
    var trLines = nonEmpty(tr), j = 0;
    orig.split('\n').forEach(function (line) {
      if (!line.trim()) {
        var gap = document.createElement('span');
        gap.className = 'bi-gap';
        target.appendChild(gap);
        return;
      }
      var el = lineFactory ? lineFactory(line) : document.createElement('span');
      if (!lineFactory) { el.className = 'bi-orig'; el.textContent = line; }
      el.setAttribute('lang', 'cs');
      target.appendChild(el);
      var t = trLines[j++];
      if (t) {
        var s = document.createElement('span');
        s.className = 'bi-tr';
        s.textContent = t;
        if (trLang) s.setAttribute('lang', trLang);
        target.appendChild(s);
      }
    });
  }

  function set(m) {
    if (['orig', 'tr', 'both'].indexOf(m) < 0 || m === mode) return;
    mode = m;
    try { localStorage.setItem('lyricMode', m); } catch (e) {}
    syncButtons();
    // karaoke si text přeskládá samo (zavolá preventDefault), jinak ho přeskládáme tady
    var ev = new CustomEvent('lyric:mode', { cancelable: true, detail: { mode: m } });
    if (window.dispatchEvent(ev)) build();
  }

  function syncButtons() {
    document.querySelectorAll('.lyric-mode [data-mode]').forEach(function (b) {
      var on = b.dataset.mode === mode;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      // zlatá výplň přejede pod vybranou volbu a vezme si její šířku (volby jsou různě dlouhé)
      if (on) {
        b.parentNode.style.setProperty('--ind-x', b.offsetLeft + 'px');
        b.parentNode.style.setProperty('--ind-w', b.offsetWidth + 'px');
      }
    });
  }
  // písmo se může načíst až po prvním vykreslení: pak se šířky voleb změní
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { syncButtons(); });

  window.LyricText = {
    get mode() { return mode; },
    /** Text, který se zpívá v karaoke a čte jako hlavní (překlad jen v režimu Překlad). */
    primary: function () { return mode === 'tr' ? tr : orig; },
    /** Překlad řádku podle pořadí neprázdných řádků (pro titulky na celé obrazovce). */
    translation: function (i) { return mode === 'both' ? (nonEmpty(tr)[i] || '') : ''; },
    build: build,
    set: set
  };

  document.querySelectorAll('.lyric-mode [data-mode]').forEach(function (b) {
    b.addEventListener('click', function () { set(b.dataset.mode); });
  });
  syncButtons();
  build();
})();
