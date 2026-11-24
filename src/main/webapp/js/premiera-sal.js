// Kinosál premiéry (/premiera, WEB-INF/views/premiera.jsp, styl na konci css/premiera.css; ukázka schválená 23. 11.:
// Skeli.cz-podklady/navrhy/premiera/kino/index.html).
// - Sál je otevřený pořád: vejde se tlačítkem „Vstoupit do sálu“ (to zároveň odemkne zvuk, js/premiera.js),
//   30 min před premiérou se otevře všem sám (pak bez zvuku, klip pustí velké ▶ z premiera.js).
// - Sedadla se plní siluetami podle toho, kolik prohlížečů je v sále (/api/premiere/live, náhodný klíč z prohlížeče,
//   ne účet). Dotaz každých ~5 s, posledních 30 min ~3 s, ve schované záložce vůbec.
// - Smajlíci: vlastní letí hned, cizí se dopočítají z rozdílu součtů mezi dvěma dotazy (server nic osobního nedrží).
// - Chat = komentáře klipu premiéry (server je ukládá pod video, takže platí mazání, nahlášení i blokace). Zpráva se
//   vždy vkládá jako čistý text (textContent), nikdy jako HTML.
// - Finále: 15 s předem kamera najede k plátnu, posledních 7,5 s obličeje na tep srdce, zhasnutí, logo, šepot;
//   ve 0 se přes celé jeviště ukáže klip (#pmVideo – řídí ho premiera.js, sem ho jen přesuneme).
// - Upoutávka (short) hraje po ťuknutí na plátno, v poslední minutě se sama zavře.
(function () {
  var root = document.querySelector('main.pm'), sal = document.getElementById('pmSal');
  if (!root || !sal || !window.fetch) return;
  var $ = function (id) { return document.getElementById(id); };
  var song = root.dataset.song, csrf = root.dataset.csrf || '', T = sal.dataset;
  var lang = document.documentElement.lang || 'cs';
  var jeviste = $('pmJeviste'), scena = $('pmScena'), platno = $('pmPlatno'), divaci = $('pmDivaci'), vrstva = $('pmReakce');
  var W = 1672, H = 941;                                       // rozměr obrázku sálu (souřadnice v sedadla.json)
  var OTEVRI_SAM = 30 * 60 * 1000, PO_STARTU = 6 * 3600 * 1000;  // kdy se sál otevře všem sám / jak dlouho po startu
  var slaby = function () { return document.documentElement.classList.contains('low-fx'); };
  var klid = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cas = function () { return window.skeliPmCas ? window.skeliPmCas() : { now: Date.now(), at: +root.dataset.at, zvuk: false }; };
  var cislo = window.Intl ? new Intl.NumberFormat(lang) : null;
  var datum = window.Intl ? new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
  var vyp = {};                                                 // nouzové vypínače z adminu (chat, reakce, efekty)

  // ---------- klíč prohlížeče: počítá „v sále“, v téhle záložce přežije i obnovení stránky ----------
  var klic = '';
  try { klic = sessionStorage.getItem('pmKlic') || ''; } catch (e) { /* bez úložiště: nový klíč */ }
  if (!/^[A-Za-z0-9]{12,40}$/.test(klic)) {
    var ZN = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', a = new Uint8Array(20);
    (window.crypto || window.msCrypto).getRandomValues(a);
    klic = Array.prototype.map.call(a, function (b) { return ZN.charAt(b % 62); }).join('');
    try { sessionStorage.setItem('pmKlic', klic); } catch (e) { /* nevadí */ }
  }
  function posli(url, data) {
    var b = new URLSearchParams(data);
    return fetch(url, { method: 'POST', credentials: 'same-origin', body: b.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-Token': csrf } });
  }
  function zivy(data) {                                         // POST do místnosti (i simulace ?pmSim)
    data.song = song; data.k = klic;
    if (song === 'sim') data.simAt = String(cas().at);
    return posli('/api/premiere/live', data);
  }

  // ---------- sedadla a diváci ----------
  var mista = [], lidi = 0, postaveno = false;
  function postavSal() {
    if (postaveno) return; postaveno = true;
    var j = function (r) { if (!r.ok) throw new Error(r.status); return r.json(); };
    Promise.all([fetch('/img/premiera/kino/divaci.json?v=1').then(j), fetch('/img/premiera/kino/sedadla.json?v=1').then(j)]).then(function (r) {
      var meta = r[0], sedadla = r[1];
      // pořadí obsazování: nejdřív k prostřední uličce, kterou vidí i telefon na výšku (výřez ±380 px kolem uličky
      // na x = 836) – jinak by si první návštěvník sedl na kraj mimo obraz a vypadalo by to, že se nic nestalo;
      // pak dál od uličky, přední řada až nakonec
      sedadla.forEach(function (st) {
        var stred = Math.abs((st.x0 + st.x1) / 2 - 836) / 836, vidi = st.x0 >= 456 && st.x1 <= 1216;
        st.poradi = (vidi ? 0 : 20) + [1.2, 0.6, 0.2, 0, 0.8, 3][st.r] + stred * 6 + Math.random() * 0.6;
      });
      sedadla.sort(function (a, b) { return a.poradi - b.poradi; });
      var lide = meta.slice().sort(function () { return Math.random() - 0.5; });   // každý návštěvník vidí jiné rozesazení
      sedadla.forEach(function (st, i) { st.m = lide[i % lide.length]; });
      // do stránky od zadních řad k předním (bližší silueta překryje vzdálenější)
      sedadla.slice().sort(function (a, b) { return a.r - b.r; }).forEach(function (st) {
        // silueta o 14 % užší než sedadlo, vycentrovaná; ramena (m.top) na horní hraně opěradla
        var m = st.m, k = (st.x1 - st.x0) / (m.sr - m.sl) * 0.86, xc = (st.x0 + st.x1) / 2;
        var left = xc - (m.sr - m.sl) * k / 2 - m.sl * k, top = st.top - m.top * k, w = m.w * k;
        var dno = Math.max.apply(null, st.c.map(function (p) { return p[1]; })), h = dno - top + 1;
        // spodek siluety přesně po křivce opěradla (clip-path: nic se nepřekresluje každý snímek)
        var body = ['0% 0%', '100% 0%'].concat(st.c.slice().reverse().map(function (p) {
          return ((p[0] - left) / w * 100).toFixed(2) + '% ' + ((p[1] - top) / h * 100).toFixed(2) + '%';
        }));
        var d = document.createElement('div');
        d.className = 'pm-divak';
        d.style.cssText = 'left:' + (left / W * 100) + '%;top:' + (top / H * 100) + '%;width:' + (w / W * 100) + '%;height:'
          + (h / H * 100) + '%;clip-path:polygon(' + body.join(',') + ')';
        var im = document.createElement('img');
        im.src = '/img/premiera/kino/' + String(m.f).replace('.png', '.webp'); im.alt = ''; im.decoding = 'async';
        d.appendChild(im); divaci.appendChild(d);
        st.el = d;
      });
      mista = sedadla;
      usad(lidi);
    }).catch(function () { postaveno = false; });
  }
  // Kdo odejde, zmizí hned. Kdo přijde, objeví se až za 3–5 s (ať si toho člověk stihne všimnout), další
  // z téže várky po 0,5–1,4 s. Při vstupu: kdo už v sále sedí, je vidět hned, ty sám si sedneš za 3–5 s.
  var ukazano = 0, cil = 0, casovac = 0, prvni = true;
  function usad(n) {
    if (!mista.length) return;
    cil = Math.min(n, mista.length);
    while (ukazano > cil) { ukazano--; mista[ukazano].el.classList.remove('sedi'); }
    if (prvni && cil > 0) {
      prvni = false;
      for (; ukazano < cil - 1; ukazano++) mista[ukazano].el.classList.add('sedi');
    }
    if (ukazano < cil && !casovac) casovac = setTimeout(dalsiDivak, 3000 + Math.random() * 2000);
  }
  function dalsiDivak() {
    casovac = 0;
    if (ukazano < cil) { mista[ukazano].el.classList.add('sedi'); ukazano++; }
    if (ukazano < cil) casovac = setTimeout(dalsiDivak, 500 + Math.random() * 900);
  }
  function ukazLidi(n) {
    lidi = n;
    var t = T.tLidi.replace('{n}', cislo ? cislo.format(n) : n);
    $('pmSalLidi').textContent = t; $('pmChatLidi').textContent = t;
    usad(n);
  }

  // ---------- smajlíci ----------
  var SMAJL = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'srdce', 'ohen', 'joint'];
  var tlacitka = {}, naObrazovce = 0;
  function obsah(k, el) {
    if (k.charAt(0) === 'f') {
      var im = document.createElement('img'); im.src = '/img/faces/face-' + k.slice(1) + '.webp'; im.alt = ''; im.width = 44; im.height = 44;
      el.appendChild(im);
    } else if (k === 'joint') {                                  // pás 7 políček: v tlačítku stojí, v letu dohořívá (css/premiera.css)
      var okno = document.createElement('span'), pas = document.createElement('span');
      okno.className = 'pm-joint'; okno.setAttribute('aria-hidden', 'true');
      okno.appendChild(pas); el.appendChild(okno);
    } else el.textContent = k === 'srdce' ? '❤️' : '🔥';
  }
  SMAJL.forEach(function (k) {
    var b = document.createElement('button');
    b.type = 'button'; b.setAttribute('aria-label', T.tReact);
    obsah(k, b);
    b.addEventListener('click', function () { moje(k); });
    $('pmLista').appendChild(b); tlacitka[k] = b;
  });
  var odeslano = {}, odeslanoCas = [];
  function moje(k) {
    var t = Date.now();
    odeslanoCas = odeslanoCas.filter(function (x) { return t - x < 1000; });
    if (odeslanoCas.length >= 5) return;                         // víc než 5 za sekundu nepošleme (server pustí 6)
    odeslanoCas.push(t);
    vypust(k, true);
    zivy({ action: 'react', r: k }).then(function (r) { if (r.ok) odeslano[k] = (odeslano[k] || 0) + 1; }).catch(function () { /* nevadí */ });
  }
  function vypust(k, ja) {
    if (jeviste.classList.contains('klid') || vyp.efekty || klid) {   // při klipu nic přes obraz: jen blikne tlačítko
      var b = tlacitka[k]; if (b) { b.classList.remove('puls'); void b.offsetWidth; b.classList.add('puls'); }
      return;
    }
    if (naObrazovce >= (slaby() ? 10 : 30)) return;              // pojistka: víc naráz neletí
    var e = document.createElement('div');
    e.className = 'pm-let' + (ja ? ' moje' : '');
    e.style.right = (1 + Math.random() * 9) + '%';              // úzký pruh u pravého okraje (jako živé vysílání)
    e.style.setProperty('--dx', (Math.random() * -60) + 'px');
    e.style.setProperty('--vyska', -(vrstva.clientHeight * (0.65 + Math.random() * 0.3)) + 'px');
    obsah(k, e);
    naObrazovce++;
    var pryc = function () { if (e.parentNode) { e.remove(); naObrazovce--; } };
    e.addEventListener('animationend', pryc);
    setTimeout(pryc, 4000);                                        // pojistka, kdyby animace neskončila (schovaná záložka)
    vrstva.appendChild(e);
  }
  var soucty = null;
  function ciziReakce(r) {
    if (!soucty) { soucty = r; odeslano = {}; return; }            // první dotaz: jen výchozí stav
    var fronta = [];
    SMAJL.forEach(function (k) {
      var n = (r[k] || 0) - (soucty[k] || 0) - (odeslano[k] || 0);
      for (var i = 0; i < Math.min(n, 8); i++) fronta.push(k);
    });
    soucty = r; odeslano = {};
    fronta.sort(function () { return Math.random() - 0.5; }).slice(0, slaby() ? 6 : 14).forEach(function (k) {
      setTimeout(function () { if (!document.hidden) vypust(k, false); }, Math.random() * 2800);   // rozložit do dalšího dotazu
    });
  }

  // ---------- chat ----------
  var zpravy = $('pmZpravy'), info = $('pmChatInfo'), form = $('pmPsani'), posledni = 0;
  function oznam(text) { info.textContent = text || ''; info.hidden = !text; }
  function prazdno() {
    var p = zpravy.querySelector('.pm-zp-prazdno');
    if (zpravy.querySelector('.pm-zp')) { if (p) p.remove(); return; }
    if (!p && !vyp.chat) { p = document.createElement('p'); p.className = 'pm-zp-prazdno'; p.textContent = T.tEmpty; zpravy.appendChild(p); }
  }
  function akce(z, el) {
    var moznosti = [];
    if (z.pripnout) moznosti.push([z.pripnuto ? T.tUnpin : T.tPin, function () {
      posli('/api/comments', { kind: 'video', action: 'pin', id: String(z.id), on: z.pripnuto ? '0' : '1' }).then(function () { dalsi = 0; });
    }]);
    if (z.nahlasit) moznosti.push([T.tReport, function () {
      if (!confirm(T.tReportQ)) return;
      posli('/comment/report', { kind: 'video', comment_id: String(z.id) }).then(function (r) { oznam(r.ok ? T.tReported : T.tErr); });
    }]);
    if (z.smazat) moznosti.push([T.tDelete, function () {
      posli('/api/comments', { kind: 'video', action: 'delete', id: String(z.id) }).then(function (r) { if (r.ok) { el.remove(); prazdno(); } else oznam(T.tErr); });
    }]);
    if (!moznosti.length) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'pm-zp-vic'; b.textContent = '⋯'; b.setAttribute('aria-label', T.tMore); b.setAttribute('aria-expanded', 'false');
    var radek = document.createElement('div'); radek.className = 'pm-zp-akce'; radek.hidden = true;
    moznosti.forEach(function (m) {
      var x = document.createElement('button'); x.type = 'button'; x.textContent = m[0];
      x.addEventListener('click', function () { radek.hidden = true; b.setAttribute('aria-expanded', 'false'); m[1](); });
      radek.appendChild(x);
    });
    b.addEventListener('click', function () { radek.hidden = !radek.hidden; b.setAttribute('aria-expanded', String(!radek.hidden)); });
    el.appendChild(b); el.appendChild(radek);
  }
  function telo(z, el) {
    var f = document.createElement(z.foto ? 'img' : 'span');
    f.className = 'pm-zp-foto';
    if (z.foto) { f.src = z.foto; f.alt = ''; f.loading = 'lazy'; f.width = 28; f.height = 28; }
    var t = document.createElement('div'); t.className = 'pm-zp-t';
    var b = document.createElement('b'); b.textContent = z.jmeno || T.tDeleted;
    var kdy = document.createElement('time');
    if (z.cas) { var d = new Date(z.cas); kdy.dateTime = d.toISOString(); kdy.textContent = datum ? datum.format(d) : d.toLocaleString(); }
    var p = document.createElement('p'); p.textContent = z.text;   // vždy čistý text, nikdy HTML
    t.appendChild(b); t.appendChild(kdy); t.appendChild(p);
    el.appendChild(f); el.appendChild(t);
  }
  function zprava(z) {
    if (!z || typeof z.id !== 'number' || z.id <= posledni) return;
    posledni = z.id;
    var el = document.createElement('div');
    el.className = 'pm-zp' + (z.skeli ? ' skeli' : '');
    telo(z, el); akce(z, el);
    zpravy.insertBefore(el, zpravy.firstChild);                   // nejnovější nahoře
    while (zpravy.children.length > 120) zpravy.lastChild.remove();   // v paměti nejvýš 120
  }
  function pripnuto(z) {
    var box = $('pmPripnuto');
    box.hidden = !z; box.textContent = '';
    if (!z) return;
    var b = document.createElement('b'); b.textContent = '📌 ' + (z.jmeno || T.tDeleted) + ': ';
    box.appendChild(b); box.appendChild(document.createTextNode(z.text));
  }
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var input = form.querySelector('input'), btn = form.querySelector('button'), text = input.value.trim();
    if (!text) return;
    btn.disabled = true;
    zivy({ action: 'chat', text: text }).then(function (r) {
      if (r.ok) { input.value = ''; oznam(''); dalsi = 0; return; }
      return r.json().catch(function () { return {}; }).then(function (d) {
        var c = d && d.error;
        oznam(c === 'login' ? T.tLogin : c === 'verify' ? T.tVerify : c === 'slow' ? T.tSlow : c === 'link' ? T.tLink
          : c === 'long' ? T.tLong : c === 'off' ? T.tOff : T.tErr);
      });
    }).catch(function () { oznam(T.tErr); }).then(function () { btn.disabled = false; });
  });

  // ---------- server ----------
  var ptam = false, dalsi = 0, chybaChatu = false;
  function interval() { var c = cas(); return (c.at - c.now > OTEVRI_SAM ? 5000 : 3000) + Math.random() * 700; }
  function dotaz() {
    if (ptam || document.hidden) return;
    ptam = true; dalsi = Date.now() + interval();
    var q = '?song=' + encodeURIComponent(song) + '&k=' + klic + '&po=' + posledni + (song === 'sim' ? '&simAt=' + cas().at : '');
    fetch('/api/premiere/live' + q, { cache: 'no-store', credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(prijato)
      .catch(function () { dalsi = Date.now() + 8000 + Math.random() * 4000; })   // server nejde: zkusit později, nezahlcovat
      .then(function () { ptam = false; });
  }
  function prijato(d) {
    vyp = d.vyp || {};
    sal.classList.toggle('bez-reakci', !!vyp.reakce);
    sal.classList.toggle('bez-chatu', !!vyp.chat);
    if (typeof d.lidi === 'number') ukazLidi(d.lidi);
    if (d.reakce) ciziReakce(d.reakce);
    if (vyp.chat) { chybaChatu = true; oznam(T.tOff); }
    else if (chybaChatu) { chybaChatu = false; oznam(''); }
    if (d.chat) d.chat.forEach(zprava);
    if ('pin' in d) pripnuto(d.pin);
    prazdno();
  }

  // ---------- upoutávka na plátně ----------
  var shortV = null;
  function zavriShort() {
    if (!shortV) return;
    shortV.pause(); shortV.remove(); shortV = null; platno.classList.remove('hraje-short');
  }
  function pustShort() {
    var c = cas();
    if (c.at - c.now <= 60000) return;                           // poslední minuta patří premiéře
    if (shortV) { zavriShort(); return; }                        // druhé ťuknutí zavře
    if (window.skeliUpoutavkyZavri) window.skeliUpoutavkyZavri();
    shortV = document.createElement('video');
    shortV.className = 'pm-pl-short'; shortV.src = platno.dataset.short; shortV.playsInline = true; shortV.setAttribute('playsinline', '');
    shortV.addEventListener('ended', zavriShort);
    platno.appendChild(shortV); platno.classList.add('hraje-short');
    shortV.play().catch(zavriShort);
  }
  if (platno.dataset.short) {
    platno.addEventListener('click', pustShort);
    platno.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pustShort(); } });
  }

  // ---------- odpočet na plátně a finále ----------
  var odpocet = $('pmSalOdpocet');
  function dva(n) { return (n < 10 ? '0' : '') + n; }
  function text(ms) {
    var s = Math.ceil(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60, x = s % 60;
    return (d > 0 ? d + ' ' + root.dataset.tDay + ' ' : '') + (h > 0 || d > 0 ? dva(h) + ':' : '') + dva(m) + ':' + dva(x);
  }
  var najeto = false, finale = false;
  function najed() {
    if (najeto) return; najeto = true;
    scena.classList.add('jede');
    if (slaby() || klid || vyp.efekty) return;                    // slabý telefon: bez jízdy kamery, jen ztlumení
    // přiblížení: plátno skoro přes celou šířku výřezu, střed plátna (30 % výšky) doprostřed
    var j = jeviste.getBoundingClientRect(), sc = scena.getBoundingClientRect();
    scena.style.setProperty('--zoom', Math.max(1.05, Math.min(2.6, (j.width * 0.94) / (sc.width * 0.4785))).toFixed(3));
    scena.style.setProperty('--ty', '20%');
  }
  // údery 7,5–2,1 s před startem (každý o něco silnější), šepot 1,4 s předem – stejně jako v ukázce a v premiera.js
  var TEPY = [7.5, 6.6, 5.7, 4.8, 3.9, 3.0, 2.1], SEPOT = 1.4;
  function finale7(zbyva) {
    if (finale) return; finale = true;
    var tv = [].slice.call(document.querySelectorAll('#pmSalTvare img'));
    var zvuk = function () { return cas().zvuk && window.SquadZvuk ? window.SquadZvuk : null; };
    platno.classList.add('v-finale');
    TEPY.forEach(function (pred, i) {
      var d = zbyva - pred * 1000;
      if (d < -300) { tv[i].classList.add('on'); return; }       // přišel pozdě: ty obličeje už svítí
      setTimeout(function () {
        tv[i].classList.add('on');
        platno.classList.remove('tep'); void platno.offsetWidth; platno.classList.add('tep');
        var z = zvuk(); if (z) z.srdce(0.55 + i * 0.07);
      }, Math.max(0, d));
    });
    setTimeout(function () { platno.classList.add('ma-logo'); var z = zvuk(); if (z && zbyva > SEPOT * 1000 - 300) z.sepot(0.09); }, Math.max(0, zbyva - SEPOT * 1000));
    setTimeout(function () { scena.classList.add('tma'); }, Math.max(0, zbyva - TEPY[0] * 1000));   // od 1. úderu sál postupně do tmy
    setTimeout(function () { jeviste.classList.add('klid'); }, Math.max(0, zbyva - 3000));          // 3 s předem nic nelétá přes obraz
  }
  function pust() {
    jeviste.classList.add('hraje', 'klid');
    setTimeout(function () { platno.classList.remove('v-finale', 'ma-logo'); }, 1200);
  }
  function tik() {
    var c = cas(), zbyva = c.at - c.now;
    odpocet.textContent = zbyva > 0 ? text(zbyva) : T.tLive;
    if (zbyva <= 60000) zavriShort();
    if (zbyva > 0 && zbyva <= 15000) najed();
    if (zbyva > 0 && zbyva <= 8000) finale7(zbyva);
    if (zbyva <= 0 && !jeviste.classList.contains('hraje')) pust();
    if (Date.now() >= dalsi) dotaz();
  }

  // ---------- vstup do sálu ----------
  var vSale = false, timer = 0;
  function spust() { if (vSale && !timer && !document.hidden) { tik(); timer = setInterval(tik, 250); } }
  function zastav() { clearInterval(timer); timer = 0; }
  function vstup(sam) {
    if (vSale) return; vSale = true;
    root.classList.add('v-sale'); sal.hidden = false;
    // klip premiéry patří na jeviště, tlačítko zvuku a „Konec“ pod něj
    jeviste.insertBefore($('pmVideo'), vrstva);
    var hl = sal.querySelector('.pm-sal-hl');
    hl.appendChild($('pmZvuk')); hl.appendChild($('pmKonec'));
    if (window.skeliUpoutavkyZavri) window.skeliUpoutavkyZavri();
    postavSal();
    try { sessionStorage.setItem('pmSal', '1'); } catch (e) { /* nevadí */ }
    dalsi = 0; spust();
    if (!sam) {                                                    // po ťuknutí: sál nahoru pod hlavičku
      var hh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
      window.scrollTo({ top: Math.max(0, sal.getBoundingClientRect().top + window.scrollY - hh - 8), behavior: 'smooth' });
    }
  }
  $('pmJsemTu').addEventListener('click', function () { vstup(false); });   // premiera.js k tomu odemkne zvuk
  function maOtevritSam() {
    var c = cas(), z = c.at - c.now, uz = false;
    try { uz = sessionStorage.getItem('pmSal') === '1'; } catch (e) { /* nevadí */ }
    return (z <= OTEVRI_SAM && z > -PO_STARTU) || (uz && z > -PO_STARTU);
  }
  var hlidac = 0;
  if (maOtevritSam()) vstup(true);
  else hlidac = setInterval(function () { if (maOtevritSam()) { clearInterval(hlidac); vstup(true); } }, 1000);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) zastav();
    else { dalsi = 0; spust(); }
  });

  // ---------- celá obrazovka: PC a Android celý sál; iPhone stránku na celou obrazovku nepustí – tam aspoň klip ----------
  $('pmCelo').addEventListener('click', function () {
    if (document.fullscreenElement || document.webkitFullscreenElement) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    if (jeviste.classList.contains('na-celou')) { jeviste.classList.remove('na-celou'); return; }
    var go = jeviste.requestFullscreen || jeviste.webkitRequestFullscreen;
    if (go) { go.call(jeviste); return; }
    jeviste.classList.add('na-celou');                             // nouzově: sál přes celé okno prohlížeče
  });
})();
