// Zvuky webu: nová zpráva, zvoneček, Kevin. Vyrábí je prohlížeč (Web Audio), nic se nestahuje.
// Reproduktor v hlavičce vypíná všechno, jednotlivé zvuky jsou v nastavení chatu. Ukládá se jen v tomhle prohlížeči.
// Prohlížeč pustí zvuk až po prvním kliknutí nebo klepnutí; do té doby se nic nehraje a nic se nedohrává.
// Kdo už na webu klikal, tomu ho prohlížeč často povolí hned po načtení další stránky, proto se o to pokusí sám.
(function () {
  if (window.SkeliSound) { window.SkeliSound.refresh(); return; }
  var DEFAULTS = { message: true, bell: true, kevin: false };
  var ctx = null;

  function get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* jen pro tuhle návštěvu */ } }
  function muted() { return get('soundMuted') === '1'; }
  function enabled(kind) {
    if (muted()) return false;
    var v = get('sound_' + kind);
    return v === null ? DEFAULTS[kind] === true : v === '1';
  }

  function wake() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (AC) { try { ctx = new AC(); } catch (e) { ctx = null; } }
  }
  // dotyk počítá prohlížeč jako povolení až při zvednutí prstu (touchend, click), ne při pointerdown
  ['pointerdown', 'pointerup', 'touchend', 'mousedown', 'click', 'keydown'].forEach(function (ev) { document.addEventListener(ev, wake, { passive: true, capture: true }); });
  wake();

  function tone(freq, start, length, volume) {
    var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + start;
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volume, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + length);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + length + 0.02);
  }
  var SOUNDS = {
    message: function () { tone(740, 0, 0.16, 0.3); tone(988, 0.11, 0.24, 0.3); },
    bell: function () { tone(1175, 0, 0.36, 0.22); },
    kevin: function () { tone(520, 0, 0.1, 0.16); tone(660, 0.07, 0.12, 0.14); }
  };

  function play(kind) {
    if (!enabled(kind) || !SOUNDS[kind] || !ctx) return false;
    // víc otevřených záložek a malé okno chatu nemají zvonit přes sebe
    var now = Date.now(), last = +(get('soundLast') || 0);
    if (now - last < 1500) return false;
    if (ctx.state !== 'running') {
      // ještě se o to pokusí; když to prohlížeč nedovolí, nic se později nedohraje
      ctx.resume().then(function () { if (Date.now() - now < 800) { set('soundLast', String(Date.now())); SOUNDS[kind](); } }).catch(function () {});
      return false;
    }
    set('soundLast', String(now));
    SOUNDS[kind]();
    return true;
  }

  function refresh() {
    var off = muted();
    document.querySelectorAll('[data-sound-toggle]').forEach(function (b) {
      var label = off ? b.dataset.tOn : b.dataset.tOff, icon = b.querySelector('i'), text = b.querySelector('span');
      if (icon) icon.className = 'fa-solid ' + (off ? 'fa-volume-xmark' : 'fa-volume-high');
      if (text) text.textContent = label;
      b.title = label;
      b.setAttribute('aria-label', label);
      b.setAttribute('aria-pressed', String(off));
    });
    document.querySelectorAll('[data-sound-pref]').forEach(function (box) {
      var kind = box.dataset.soundPref, v = get('sound_' + kind);
      box.checked = v === null ? DEFAULTS[kind] === true : v === '1';
    });
  }

  document.addEventListener('click', function (e) {
    var test = e.target.closest && e.target.closest('[data-sound-test]');
    if (test) {
      wake();
      var kind = test.dataset.soundTest;
      if (ctx && SOUNDS[kind]) { ctx.resume().then(function () { SOUNDS[kind](); }).catch(function () {}); }
      return;
    }
    var b = e.target.closest && e.target.closest('[data-sound-toggle]');
    if (!b) return;
    set('soundMuted', muted() ? '0' : '1');
    refresh();
    // Kevin to okomentuje (js/kevin.js): ticho pochválí, zvuky přijme s povzdechem
    window.dispatchEvent(new CustomEvent('kevin', { detail: { sound: muted() ? 'off' : 'on' } }));
  });
  document.addEventListener('change', function (e) {
    var kind = e.target.dataset && e.target.dataset.soundPref;
    if (kind) set('sound_' + kind, e.target.checked ? '1' : '0');
  });

  window.SkeliSound = { play: play, enabled: enabled, refresh: refresh };
  document.addEventListener('pjax:done', refresh);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh); else refresh();
})();
