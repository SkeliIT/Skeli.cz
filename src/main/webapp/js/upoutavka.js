// Upoutávka (short) k premiéře: ťuknutí na fotku s data-teaser pustí krátké video se zvukem hned pod ní,
// další ťuknutí nebo křížek ho zavře. Používá ji karta premiéry na úvodu (index.jsp) i stránka /premiera.
// Na úvodu je fotka uvnitř odkazu na /premiera: video proto nikdy nedáváme dovnitř odkazu (ťuknutí na ovládání
// videa by otevřelo stránku), ale až za něj. Video je na našem serveru, YouTube se kvůli němu nenačítá.
(function () {
  var otevrene = window.skeliUpoutavky = window.skeliUpoutavky || [];

  // zavře všechny upoutávky (třeba když začíná premiéra nebo PJAX vymění stránku)
  window.skeliUpoutavkyZavri = function () { otevrene.slice().forEach(function (z) { z(); }); };

  document.querySelectorAll('[data-teaser]').forEach(function (foto) {
    if (foto.dataset.teaserOn) return;
    foto.dataset.teaserOn = '1';
    var za = foto.closest('a') || foto;       // kam vložit video: za odkaz (úvod), jinak hned za fotku
    var box = null;

    function zavri() {
      if (!box) return;
      var v = box.querySelector('video');
      v.pause(); v.removeAttribute('src'); v.load();     // uvolnit video z paměti
      box.remove(); box = null;
      foto.classList.remove('is-open');
      foto.setAttribute('aria-expanded', 'false');
      var i = otevrene.indexOf(zavri); if (i >= 0) otevrene.splice(i, 1);
    }

    function otevri() {
      box = document.createElement('div');
      box.className = 'upoutavka';
      var v = document.createElement('video');
      v.src = foto.dataset.teaser;
      v.controls = true; v.playsInline = true; v.preload = 'auto';
      v.setAttribute('playsinline', '');
      v.addEventListener('ended', zavri);               // po konci zpátky fotka
      var x = document.createElement('button');
      x.type = 'button'; x.className = 'upoutavka-x';
      x.setAttribute('aria-label', foto.dataset.close || '×');
      x.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
      x.addEventListener('click', zavri);
      box.append(v, x);
      za.insertAdjacentElement('afterend', box);
      foto.classList.add('is-open');
      foto.setAttribute('aria-expanded', 'true');
      otevrene.push(zavri);
      var p = v.play();                                  // ťuknutí = prohlížeč dovolí i zvuk
      if (p && p.catch) p.catch(function () { /* zvuk zakázaný: zůstane ovládání videa */ });
    }

    function prepni(e) { e.preventDefault(); e.stopPropagation(); if (box) zavri(); else otevri(); }
    foto.addEventListener('click', prepni);
    foto.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') prepni(e); });
  });

  // PJAX vymění <main>: video, které zmizelo ze stránky, by jinak hrálo dál (jen jednou za celou návštěvu)
  if (!window.skeliUpoutavkyPjax) {
    window.skeliUpoutavkyPjax = true;
    document.addEventListener('pjax:done', window.skeliUpoutavkyZavri);
  }
})();
