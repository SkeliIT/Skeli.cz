// Premiéra (/premiera, WEB-INF/views/premiera.jsp). Odpočet běží podle hodin serveru (data-now), ne podle hodin
// v telefonu. „Jsem tu“ rozsvítí tvoje okno na fotce ulice a odemkne zvuk (prohlížeč pustí zvuk jen po ťuknutí).
// Okna se rozsvěcí s blížícím se startem, ve 3-2-1 velká čísla, v okamžiku premiéry se rozsvítí celá ulice a
// stránka si od /api/premiere vyžádá video (to dostane až po startu, nikdy dřív). Klip se pustí od vteřiny,
// kde právě je premiéra, takže všichni koukají naráz; kdo přijde pozdě, naskočí do běžícího.
// Server se ptá jen při načtení, jednou za 5 minut kvůli hodinám a pak kolem startu – nikdy ve skryté záložce.
(function () {
  var root = document.querySelector('main.pm');
  if (!root) return;
  var song = root.dataset.song, at = +root.dataset.at;
  var offset = +root.dataset.now - Date.now();          // o kolik se liší hodiny serveru a telefonu
  var LIVE_MS = 15 * 60 * 1000;                           // po tuhle dobu se na premiéru „naskakuje“, pak je to záznam
  var $ = function (id) { return document.getElementById(id); };
  var foto = root.querySelector('.pm-foto');
  var now = function () { return Date.now() + offset; };
  var slaby = function () { return document.documentElement.classList.contains('low-fx'); };

  // ---------- okna a lampy na fotce (pixely fotky 1200×512, pořadí = pořadí rozsvěcení) ----------
  var OKNA = [[477,65,18,70],[477,210,19,57],[530,37,22,83],[534,200,22,62],[419,89,18,66],[422,215,18,55],[600,25,30,72],
    [384,105,16,60],[386,225,14,47],[352,120,15,55],[1050,92,67,105],[1137,80,63,110],[280,240,10,37],[312,235,8,37],[124,217,7,20],[145,212,5,23]];
  var LAMPY = [[78,165],[912,100],[268,248]];
  function pos(el, x, y, w, h) {
    el.style.left = (x / 12) + '%'; el.style.top = (y / 5.12) + '%';
    if (w) { el.style.width = (w / 12) + '%'; el.style.height = (h / 5.12) + '%'; }
    foto.appendChild(el); return el;
  }
  var okna = OKNA.map(function (o) { var d = document.createElement('span'); d.className = 'pm-okno'; return pos(d, o[0], o[1], o[2], o[3]); });
  LAMPY.forEach(function (l) { var d = document.createElement('span'); d.className = 'pm-lampa'; pos(d, l[0], l[1]); });
  var mojeOkno = -1;
  function rozsvit(o) {
    if (o.classList.contains('sviti')) return;
    o.classList.add('sviti', 'nove');
    setTimeout(function () { o.classList.remove('nove'); }, 1200);
  }
  // atmosféra sílí s blížícím se startem: 0 = 30 min a víc, 1 = start
  function atmosfera(k) {
    var s = root.style;
    s.setProperty('--pm-jas', (.45 + .15 * k).toFixed(2));
    s.setProperty('--pm-teplo', (.15 + .45 * k).toFixed(2));
    s.setProperty('--pm-kour', (.25 + .35 * k).toFixed(2));
    s.setProperty('--pm-lampy', (.25 + .35 * k).toFixed(2));
    var n = Math.floor(k * 10);                                // do startu se rozsvítí až 10 oken, zbytek v 19:00
    okna.forEach(function (o, i) { if (i < n) rozsvit(o); });
  }

  // ---------- Jsem tu ----------
  var tady = false, klepnuto = false;                      // klepnuto = v tomhle načtení ťukl (zvuk smí hrát)
  try { tady = sessionStorage.getItem('pmTady:' + song) === '1'; } catch (e) { /* soukromé okno */ }
  var jsemTu = $('pmJsemTu');
  function oznacTady(ukaz) {
    jsemTu.disabled = true; jsemTu.textContent = jsemTu.dataset.done;
    if (mojeOkno < 0) { mojeOkno = okna.findIndex(function (o) { return !o.classList.contains('sviti'); }); if (mojeOkno < 0) mojeOkno = 0; }
    var o = okna[mojeOkno]; rozsvit(o);
    if (!ukaz) return;
    var t = root.querySelector('.pm-tvoje');
    t.style.left = (parseFloat(o.style.left) + parseFloat(o.style.width) / 2) + '%'; t.style.top = o.style.top;
    foto.appendChild(t); t.classList.add('videt');
    setTimeout(function () { t.classList.remove('videt'); }, 4000);
  }
  jsemTu.addEventListener('click', function () {
    tady = klepnuto = true;
    if (window.SquadZvuk) window.SquadZvuk.odemkni();     // zvuk srdce a šepotu smí hrát jen po ťuknutí
    try { sessionStorage.setItem('pmTady:' + song, '1'); } catch (e) { /* nevadí */ }
    oznacTady(true);
  });
  if (tady) oznacTady(false);

  // ---------- odpočet ----------
  var odpocet = $('pmOdpocet'), pod = $('pmPod');
  function dva(n) { return (n < 10 ? '0' : '') + n; }
  function ukazOdpocet(ms) {
    var s = Math.ceil(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60, x = s % 60;
    var txt = (h > 0 || d > 0 ? dva(h) + ':' : '') + dva(m) + ':' + dva(x);
    odpocet.classList.toggle('dlouhy', d > 0 || h > 0);
    odpocet.innerHTML = d > 0 ? '<span class="pm-dny">' + d + ' ' + root.dataset.tDay + '</span>' + txt : txt;
    pod.textContent = ms <= 60000 ? root.dataset.tSoon : root.dataset.tLeft;
    root.classList.toggle('is-soon', ms <= 60000);
  }
  // ---------- posledních 7 s: smajlíci naskakují na tep srdce, rámeček videa pulzuje, šepot SKELO SQUAD ----------
  // údery 7,5 s až 2,1 s před startem (každý o něco silnější), šepot 1,4 s před startem, ve 0 se pustí klip do téhož rámečku
  var TEPY = [7.5, 6.6, 5.7, 4.8, 3.9, 3.0, 2.1], SEPOT = 1.4, finale = false;
  var tvare = [].slice.call(document.querySelectorAll('#pmTvare img')), ram = $('pmVideoIn');
  function zvuk() { return klepnuto && window.SquadZvuk ? window.SquadZvuk : null; }
  function finalePrijde(zbyva) {
    if (finale) return; finale = true;
    root.classList.add('is-final', 'ma-tvare'); $('pmVideo').hidden = false;
    TEPY.forEach(function (pred, i) {
      var d = zbyva - pred * 1000;
      if (d < -300) { tvare[i].classList.add('on'); return; }   // přišel pozdě: ty smajlíky už svítí
      setTimeout(function () {
        tvare[i].classList.add('on');
        ram.classList.remove('tep'); void ram.offsetWidth; ram.classList.add('tep');
        var z = zvuk(); if (z) z.srdce(0.55 + i * 0.07);
      }, Math.max(0, d));
    });
    var ds = zbyva - SEPOT * 1000;
    if (ds > -300) setTimeout(function () { var z = zvuk(); if (z) z.sepot(0.09); }, Math.max(0, ds));
  }

  // ---------- start: celá ulice se rozsvítí ----------
  var rozsviceno = false;
  function rozsvitUlici(efekt) {
    if (rozsviceno) return; rozsviceno = true;
    root.style.setProperty('--pm-lampy', 1); root.style.setProperty('--pm-teplo', .7);
    okna.forEach(function (o) { setTimeout(function () { rozsvit(o); }, efekt && !slaby() ? parseFloat(o.style.left) * 14 : 0); });   // vlna zleva doprava
    if (efekt) { var z = root.querySelector('.pm-zablesk'); z.classList.add('ted'); }
  }

  // ---------- video ----------
  var yt = null, hraje = false, clock = null;
  function stav(s) { root.classList.remove('is-wait', 'is-soon', 'is-final', 'is-live', 'is-over'); root.classList.add(s); }
  function embed(start, autoplay, mute) {
    var box = $('pmVideoIn');
    if (clock) { clock.stop(); clock = null; }
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + yt + '?enablejsapi=1&rel=0&playsinline=1&modestbranding=1&iv_load_policy=3'
      + '&autoplay=' + (autoplay ? 1 : 0) + '&mute=' + (mute ? 1 : 0) + (start > 0 ? '&start=' + Math.floor(start) : '')
      + '&origin=' + encodeURIComponent(location.origin);
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    f.title = document.querySelector('.pm-nazev').textContent;
    box.innerHTML = ''; box.appendChild(f);
    var dosrovnano = false;
    clock = window.YtClock ? new window.YtClock(f, function (c) {
      if (!c.playing()) {
        if (c.duration() && c.time() >= c.duration() - 1.5) { $('pmKonec').hidden = false; $('pmZvuk').hidden = true; }
        return;
      }
      $('pmKonec').hidden = true;
      if (!dosrovnano && root.classList.contains('is-live')) {   // jednou po rozjetí: dorovnat na čas premiéry
        dosrovnano = true;
        var cil = (now() - at) / 1000;
        if (c.duration() && cil > c.duration()) return;
        if (Math.abs(c.time() - cil) > 3) c.seek(cil);
      }
      if (!c.muted()) $('pmZvuk').hidden = true;
    }) : null;
    return f;
  }
  function pustVideo() {
    if (hraje || !yt) return; hraje = true;
    var uplynulo = now() - at;
    $('pmVideo').hidden = false;
    if (uplynulo > LIVE_MS) {                                   // záznam: klasický přehrávač od začátku, pustí si ho sám
      stav('is-over'); $('pmProbehla').hidden = false; rozsvitUlici(false);
      embed(0, false, false);
      return;
    }
    stav('is-live'); rozsvitUlici(uplynulo < 10000);
    // YouTube se načte jen tomu, kdo o něj stojí (zásady webu): ťukl na Jsem tu, nebo povolil přehrávače v souhlasu.
    // Ostatní dostanou velké ▶ – ťuknutí = chci přehrávač a zároveň povolí zvuk, klip naskočí do běžící premiéry.
    var souhlas = false; try { souhlas = !!(window.skeliConsent && window.skeliConsent()); } catch (e) { /* bez souhlasu */ }
    if (!klepnuto && !souhlas) { ukazPustit(); return; }
    // se zvukem jen po ťuknutí v tomhle načtení; jinak potichu (to prohlížeče pustí vždy) a tlačítko Zapnout zvuk
    var seZvukem = klepnuto;
    embed(uplynulo / 1000, true, !seZvukem);
    if (!seZvukem) $('pmZvuk').hidden = false;
    else setTimeout(function () {                               // prohlížeč zvuk nepustil: znovu potichu + tlačítko
      if (clock && !clock.playing()) { embed((now() - at) / 1000, true, true); $('pmZvuk').hidden = false; }
    }, 4000);
  }
  function ukazPustit() {
    var box = $('pmVideoIn'), b = document.createElement('button');
    b.type = 'button'; b.className = 'pm-pustit';
    b.style.setProperty('--pm-nahled', 'url(/yt-thumb/' + yt + '/hqdefault.jpg)');
    b.innerHTML = '<span class="pm-play"><i class="fa-solid fa-play" aria-hidden="true"></i></span><b></b><small></small>';
    b.querySelector('b').textContent = root.dataset.tStart; b.querySelector('small').textContent = root.dataset.tYt;
    b.addEventListener('click', function () { klepnuto = true; embed((now() - at) / 1000, true, false); });
    box.innerHTML = ''; box.appendChild(b);
  }
  $('pmUnmute').addEventListener('click', function () {
    if (!clock) return;
    clock.unMute(); clock.setVolume(100); clock.play();
    setTimeout(function () { if (clock && !clock.muted()) $('pmZvuk').hidden = true; }, 1500);
  });

  // ---------- server: čas a video ----------
  var ptam = false, chyb = 0;
  function zeptej(hotovo) {
    if (ptam) return; ptam = true;
    var pred = Date.now();
    fetch('/api/premiere?song=' + encodeURIComponent(song), { cache: 'no-store', credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        chyb = 0;
        if (typeof d.now === 'number') offset = d.now + (Date.now() - pred) / 2 - Date.now();
        if (typeof d.at === 'number') at = d.at;
        if (d.yt && /^[A-Za-z0-9_-]{6,20}$/.test(d.yt)) yt = d.yt;
        if (hotovo) hotovo();
      })
      .catch(function () { chyb++; if (chyb > 2) pod.textContent = root.dataset.tBusy; })
      .then(function () { ptam = false; });
  }

  // ---------- hlavní smyčka (1× za vteřinu, ve skryté záložce stojí) ----------
  var timer = 0, posledniSync = Date.now(), dalsiDotaz = 0;
  function tik() {
    var zbyva = at - now();
    if (zbyva > 0) {
      ukazOdpocet(zbyva);
      atmosfera(Math.max(0, Math.min(1, 1 - zbyva / 1800000)));
      if (zbyva <= 8000) finalePrijde(zbyva);
      if (Date.now() - posledniSync > 300000) { posledniSync = Date.now(); zeptej(); }
      return;
    }
    if (!rozsviceno && -zbyva < 10000) rozsvitUlici(true);
    if (yt) { pustVideo(); if (hraje) { clearInterval(timer); timer = 0; } return; }
    // premiéra začala, video ještě nemáme: ptát se každé 2–3 s (náhodně, ať se všichni neptají v tutéž vteřinu)
    ukazOdpocet(0);
    if (Date.now() >= dalsiDotaz) { dalsiDotaz = Date.now() + 2000 + Math.random() * 1000; zeptej(pustVideo); }
  }
  function spust() { if (!timer && !hraje) { tik(); timer = setInterval(tik, 1000); } }
  function zastav() { clearInterval(timer); timer = 0; }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) zastav();
    else { zeptej(function () { tik(); }); spust(); }       // po návratu do záložky dorovnat hodiny se serverem
  });

  // ---------- sdílení ----------
  var share = $('pmShare');
  share.addEventListener('click', function () {
    var url = location.origin + '/premiera';
    if (navigator.share) { navigator.share({ title: share.dataset.title, url: url }).catch(function () { /* zavřel */ }); return; }
    var hotovo = function () { var p = share.innerHTML; share.textContent = root.dataset.tCopied; setTimeout(function () { share.innerHTML = p; }, 2000); };
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(hotovo).catch(function () { /* nejde */ });
  });

  // první dotaz hned: přesný čas a (po premiéře) video
  zeptej(function () { tik(); });
  spust();
})();
