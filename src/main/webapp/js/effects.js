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

  // home background: Skeli's photos cross-fade over the usual one, then back to it.
  // data-dark / data-light = "name:position[:wide],…" of img/photos/<name>-lg|md.webp; a portrait
  // photo marked wide has <name>-wide.webp (whole photo on a 16:9 canvas) for landscape screens
  var slideTimer = 0, rebuildSlides = null;
  // one observer for the theme switch, whichever page is shown now
  new MutationObserver(function () { if (rebuildSlides) rebuildSlides(); })
    .observe(document.body, { attributes: true, attributeFilter: ['class'] });
  function slides(root) {
    var box = root.querySelector('.bg-slides');
    clearInterval(slideTimer);
    rebuildSlides = null;
    if (!box || reduced) return;
    function build() {
      var light = document.body.classList.contains('light');
      var size = window.innerWidth * (window.devicePixelRatio || 1) > 1400 ? 'lg' : 'md';
      box.innerHTML = '';
      (box.getAttribute(light ? 'data-light' : 'data-dark') || '').split(',').forEach(function (item) {
        var parts = item.split(':');
        if (!parts[0]) return;
        var layer = document.createElement('div');
        var landscape = window.innerWidth > window.innerHeight;
        layer.dataset.src = '/img/photos/' + parts[0].trim() + '-' + (parts[2] === 'wide' && landscape ? 'wide' : size) + '.webp';
        layer.style.setProperty('--pos', parts[1] || 'center');
        box.appendChild(layer);
      });
    }
    // step 0 = the usual background, 1..n = the photos; a photo is fetched just before its turn
    var step = 0;
    function next() {
      if (document.hidden || !box.isConnected) return;
      var layers = box.children;
      step = (step + 1) % (layers.length + 1);
      var cur = layers[step - 1];
      if (cur && !cur.style.getPropertyValue('--slide')) {
        var img = new Image();
        img.onload = function () { cur.style.setProperty('--slide', 'url("' + cur.dataset.src + '")'); show(); };
        img.src = cur.dataset.src;
      } else show();
      function show() { for (var i = 0; i < layers.length; i++) layers[i].classList.toggle('on', layers[i] === cur); }
    }
    build();
    slideTimer = setInterval(next, 7000);
    rebuildSlides = function () { build(); step = 0; };
  }

  // the photo band drifts a little slower than the page
  var bands = [];
  function parallax(root) {
    if (reduced) return;
    root.querySelectorAll('[data-parallax]').forEach(function (el) { if (bands.indexOf(el) < 0) bands.push(el); });
  }
  var pRaf = 0;
  window.addEventListener('scroll', function () {
    if (pRaf || !bands.length) return;
    pRaf = requestAnimationFrame(function () {
      pRaf = 0;
      bands = bands.filter(function (el) { return el.isConnected; });
      bands.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        var mid = r.top + r.height / 2 - window.innerHeight / 2;
        // at most 60px either way: the photo layer is 60px taller on each side
        el.style.setProperty('--py', Math.max(-60, Math.min(60, mid * -0.12)).toFixed(1) + 'px');
      });
    });
  }, { passive: true });

  // photos with data-lightbox open full screen; arrows / swipe / Esc
  var lb = null, lbItems = [], lbIndex = 0;
  function lightboxOpen(items, i) {
    if (!lb) {
      lb = document.createElement('div');
      lb.className = 'lightbox';
      lb.setAttribute('role', 'dialog');
      lb.setAttribute('aria-modal', 'true');
      var L = { cs: ['Zavřít', 'Předchozí', 'Další'], en: ['Close', 'Previous', 'Next'], de: ['Schließen', 'Zurück', 'Weiter'],
                uk: ['Закрити', 'Назад', 'Далі'], vi: ['Đóng', 'Trước', 'Sau'] }[document.documentElement.lang] || ['Zavřít', 'Předchozí', 'Další'];
      lb.innerHTML = '<img alt=""><button type="button" class="lb-close" aria-label="' + L[0] + '">✕</button>'
        + '<button type="button" class="lb-prev" aria-label="' + L[1] + '">‹</button><button type="button" class="lb-next" aria-label="' + L[2] + '">›</button>';
      document.body.appendChild(lb);
      lb.querySelector('.lb-close').addEventListener('click', lightboxClose);
      lb.querySelector('.lb-prev').addEventListener('click', function () { lightboxShow(lbIndex - 1); });
      lb.querySelector('.lb-next').addEventListener('click', function () { lightboxShow(lbIndex + 1); });
      lb.addEventListener('click', function (e) { if (e.target === lb) lightboxClose(); });
      var x0 = null;
      lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      lb.addEventListener('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 50) lightboxShow(lbIndex + (dx < 0 ? 1 : -1));
        x0 = null;
      });
      document.addEventListener('keydown', function (e) {
        if (!lb.classList.contains('open')) return;
        if (e.key === 'Escape') lightboxClose();
        if (e.key === 'ArrowLeft') lightboxShow(lbIndex - 1);
        if (e.key === 'ArrowRight') lightboxShow(lbIndex + 1);
      });
    }
    lbItems = items;
    lb.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
    lightboxShow(i);
    lb.querySelector('.lb-close').focus();
  }
  function lightboxShow(i) {
    lbIndex = (i + lbItems.length) % lbItems.length;
    var a = lbItems[lbIndex];
    var img = lb.querySelector('img');
    img.src = window.innerWidth < 900 ? a.href.replace('-lg.', '-md.') : a.href;
    img.alt = (a.querySelector('img') || {}).alt || '';
  }
  function lightboxClose() {
    lb.classList.remove('open');
    document.documentElement.style.overflow = '';
    if (lbItems[lbIndex]) lbItems[lbIndex].focus();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-lightbox]');
    if (!a) return;
    e.preventDefault();
    var group = Array.prototype.slice.call(document.querySelectorAll('a[data-lightbox="' + a.dataset.lightbox + '"]'));
    lightboxOpen(group, group.indexOf(a));
  });

  function init(root) { particles(root); marquee(root); tilt(root); slides(root); parallax(root); }
  init(document);
  document.addEventListener('pjax:done', function () { init(document.querySelector('main') || document); });
})();
