// Upoutávka (short) k premiéře v nakloněném okénku (.pmf, jako ukázka na Karaoke): ťuknutí okénko srovná, plynule
// roztáhne na výšku (short je na výšku) a video se pustí přímo v něm, se zvukem. Ťuknutí na video = pauza / dál,
// křížek nebo konec videa = okénko se vrátí zpátky. Používá ho úvod (index.jsp) i stránka /premiera.
// Video je na našem serveru, YouTube se kvůli němu nenačítá. Tlačítko [data-pm-share] sdílí odkaz na premiéru i s datem.
(function () {
  var otevrene = window.skeliUpoutavky = window.skeliUpoutavky || [];
  var klidne = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // zavře všechny upoutávky (začíná premiéra, proměna úvodu, PJAX vymění stránku)
  window.skeliUpoutavkyZavri = function () { otevrene.slice().forEach(function (z) { z(true); }); };

  document.querySelectorAll('.pmf[data-teaser]').forEach(function (okno) {
    if (okno.dataset.teaserOn) return;
    okno.dataset.teaserOn = '1';
    var video = null, x = null, prubeh = null, puvodni = null, konecTimer = 0;

    // velikost roztaženého okénka: na výšku 9:16, co nejvyšší, ale vejde se na obrazovku i do šířky stránky
    function cil() {
      var vyska = Math.min(window.innerHeight * 0.78, 680);
      var volne = getComputedStyle(okno).position === 'absolute' ? vyska : (okno.parentElement.clientWidth || vyska);   // PC: okénko vedle textu
      var sirka = Math.min(vyska * 9 / 16, volne);
      return { w: Math.round(sirka), h: Math.round(sirka * 16 / 9) };
    }

    function otevri() {
      clearTimeout(konecTimer);
      puvodni = { w: okno.offsetWidth, h: okno.offsetHeight };      // velikost bez naklonění
      okno.style.width = puvodni.w + 'px'; okno.style.height = puvodni.h + 'px';
      void okno.offsetWidth;                                         // prohlížeč si zapamatuje výchozí stav pro přechod
      var c = cil();
      okno.classList.remove('tilting'); okno.style.removeProperty('--rx'); okno.style.removeProperty('--ry');
      okno.classList.add('is-open');
      okno.style.width = c.w + 'px'; okno.style.height = c.h + 'px';
      okno.setAttribute('aria-expanded', 'true');

      video = document.createElement('video');
      video.className = 'pmf-video';
      video.src = okno.dataset.teaser;
      video.playsInline = true; video.preload = 'auto';
      video.setAttribute('playsinline', '');
      video.addEventListener('playing', function () { okno.classList.add('is-playing'); video.dataset.hralo = '1'; });   // po pauze zůstane obraz
      video.addEventListener('pause', function () { okno.classList.remove('is-playing'); });
      video.addEventListener('timeupdate', function () { if (prubeh && video.duration) prubeh.style.transform = 'scaleX(' + (video.currentTime / video.duration) + ')'; });
      video.addEventListener('ended', function () { zavri(); });
      x = document.createElement('button');
      x.type = 'button'; x.className = 'pmf-x';
      x.setAttribute('aria-label', okno.dataset.close || '×');
      x.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
      x.addEventListener('click', function (e) { e.stopPropagation(); zavri(); });
      prubeh = document.createElement('span');
      prubeh.className = 'pmf-prubeh';
      okno.append(video, x, prubeh);
      otevrene.push(zavri);
      var p = video.play();                                          // ťuknutí = prohlížeč dovolí i zvuk
      if (p && p.catch) p.catch(function () { okno.classList.remove('is-playing'); });
      // roztažené okénko celé na obrazovku (na telefonu by spodek utekl dolů)
      setTimeout(function () { if (video) okno.scrollIntoView({ behavior: klidne ? 'auto' : 'smooth', block: 'center' }); }, klidne ? 0 : 420);
    }

    function zavri(hned) {
      if (!video) return;
      video.pause(); video.removeAttribute('src'); video.load();    // uvolnit video z paměti
      [video, x, prubeh].forEach(function (el) { el.remove(); });
      video = x = prubeh = null;
      okno.classList.remove('is-open', 'is-playing');
      okno.setAttribute('aria-expanded', 'false');
      var i = otevrene.indexOf(zavri); if (i >= 0) otevrene.splice(i, 1);
      if (puvodni && !hned && !klidne) {
        okno.style.width = puvodni.w + 'px'; okno.style.height = puvodni.h + 'px';
        konecTimer = setTimeout(uklid, 650);                         // po návratu zpátky na velikost z CSS
      } else uklid();
    }
    function uklid() { okno.style.removeProperty('width'); okno.style.removeProperty('height'); }

    function tuk(e) {
      e.preventDefault();
      if (!video) { otevri(); return; }
      if (video.paused) video.play().catch(function () { /* nejde */ }); else video.pause();
    }
    okno.addEventListener('click', tuk);
    okno.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') tuk(e);
      else if (e.key === 'Escape') zavri();
    });

    // jako na Karaoke: zavřené okénko se naklání pod myší i pod prstem (k natočení z CSS se přičte --rx/--ry);
    // prst stránku dál posouvá nahoru a dolů (touch-action: pan-y v CSS), po zvednutí se okénko vrátí
    if (!klidne) {
      var nakloneni = function (e) {
        if (video) return;
        var r = okno.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        okno.classList.add('tilting');
        okno.style.setProperty('--rx', (-py * 10).toFixed(2) + 'deg');
        okno.style.setProperty('--ry', (px * 14).toFixed(2) + 'deg');
      };
      okno.addEventListener('pointermove', nakloneni);
      okno.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') nakloneni(e); });
      ['pointerleave', 'pointercancel', 'pointerup'].forEach(function (ev) {
        okno.addEventListener(ev, function (e) {
          if (ev === 'pointerup' && e.pointerType === 'mouse') return;
          okno.classList.remove('tilting'); okno.style.removeProperty('--rx'); okno.style.removeProperty('--ry');
        });
      });
    }
  });

  // sdílení premiéry (úvod): na telefonu nabídka sdílení, na PC zkopíruje text s datem a odkaz
  document.querySelectorAll('[data-pm-share]').forEach(function (b) {
    if (b.dataset.shareOn) return;
    b.dataset.shareOn = '1';
    b.addEventListener('click', function () {
      var url = location.origin + '/premiera';
      if (navigator.share) { navigator.share({ title: b.dataset.title, text: b.dataset.text, url: url }).catch(function () { /* zavřel */ }); return; }
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(b.dataset.text + ' ' + url).then(function () {
        var p = b.innerHTML; b.textContent = b.dataset.copied;
        setTimeout(function () { b.innerHTML = p; }, 2000);
      }).catch(function () { /* nejde */ });
    });
  });

  // PJAX vymění <main>: video, které zmizelo ze stránky, by jinak hrálo dál (jen jednou za celou návštěvu)
  if (!window.skeliUpoutavkyPjax) {
    window.skeliUpoutavkyPjax = true;
    document.addEventListener('pjax:done', window.skeliUpoutavkyZavri);
  }
})();
