// Redesign 2026 effects (css/effects.css): embers / snow in the home hero, the song
// marquee, the light that follows the mouse and the 3D tilt of cards. Nothing runs when
// the visitor asked for less motion; PJAX page swaps re-run the per-page parts.
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // embers rising in the smoke (snow in the light theme: same elements, other animation)
  function particles(root) {
    if (reduced) return;
    root.querySelectorAll('.hero-particles:not([data-done])').forEach(function (box) {
      box.dataset.done = '1';
      var count = window.innerWidth < 700 ? 18 : 34;
      for (var i = 0; i < count; i++) {
        var s = document.createElement('span');
        s.style.left = (Math.random() * 100) + '%';
        s.style.setProperty('--s', (2 + Math.random() * 4).toFixed(1) + 'px');
        s.style.setProperty('--t', (9 + Math.random() * 12).toFixed(1) + 's');
        s.style.setProperty('--delay', (-Math.random() * 20).toFixed(1) + 's');
        s.style.setProperty('--dx', ((Math.random() - 0.5) * 160).toFixed(0) + 'px');
        box.appendChild(s);
      }
    });
  }

  // the marquee scrolls by half its width, so its content is doubled to loop seamlessly
  function marquee(root) {
    root.querySelectorAll('.marquee-track:not([data-done])').forEach(function (track) {
      track.dataset.done = '1';
      Array.prototype.slice.call(track.children).forEach(function (el) {
        var copy = el.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        if (copy.tagName === 'A') copy.tabIndex = -1;
        track.appendChild(copy);
      });
    });
  }

  // cards lean slightly towards the mouse
  var TILT = '.feature-card, .video, .song-card, .disco-card, [data-tilt]';
  function tilt(root) {
    if (reduced || !finePointer) return;
    root.querySelectorAll(TILT).forEach(function (el) {
      if (el.dataset.tiltBound) return;
      el.dataset.tiltBound = '1';
      el.setAttribute('data-tilt', '');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.classList.add('tilting');
        el.style.setProperty('--rx', (-y * 5).toFixed(2) + 'deg');
        el.style.setProperty('--ry', (x * 6).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('tilting');
        el.style.removeProperty('--rx');
        el.style.removeProperty('--ry');
      });
    });
  }

  // a warm light under the mouse, as if the smoke were lit by it
  if (!reduced && finePointer) {
    var light = document.createElement('div');
    light.className = 'cursor-light';
    light.setAttribute('aria-hidden', 'true');
    document.body.appendChild(light);
    var raf = 0, mx = 0, my = 0;
    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0;
        light.style.setProperty('--mx', mx + 'px');
        light.style.setProperty('--my', my + 'px');
      });
    }, { passive: true });
  }

  function init(root) { particles(root); marquee(root); tilt(root); }
  init(document);
  document.addEventListener('pjax:done', function () { init(document.querySelector('main') || document); });
})();
