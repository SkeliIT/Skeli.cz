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
  var hodiny = window.Intl ? new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit' }) : null;
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
    Promise.all([fetch('/img/premiera/kino/divaci.json?v=2').then(j), fetch('/img/premiera/kino/sedadla.json?v=1').then(j),
      fetch('/img/premiera/kino/ruce.json?v=1').then(j).catch(function () { return {}; })]).then(function (r) {
      var meta = r[0], sedadla = r[1], RUCE = r[2] || {};
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
        // nad hlavou a do stran místo pro zvednuté ruce (mexická vlna – img/premiera/kino/ruce.json: nad, bok)
        var ruka = RUCE[m.f];
        var nad = Math.max(w * 0.35, ruka ? ruka.nad * k : 0), top2 = top - nad;
        var bok = ruka ? ruka.bok * k : 0, left2 = left - bok, w2 = w + 2 * bok;
        var dno = Math.max.apply(null, st.c.map(function (p) { return p[1]; })), h = dno - top2 + 1;
        // ořez po křivce opěradla (co je pod ní, schová sedadlo), po stranách vodorovně až k okrajům; clip-path = nic
        // se nepřekresluje každý snímek
        var krivka = function (y0, vys, l0, ww) {
          var c = st.c, Y = function (y) { return ((y - y0) / vys * 100).toFixed(2) + '%'; }, X = function (x) { return ((x - l0) / ww * 100).toFixed(2) + '%'; };
          return ['0% 0%', '100% 0%', '100% ' + Y(c[c.length - 1][1])].concat(c.slice().reverse().map(function (p) { return X(p[0]) + ' ' + Y(p[1]); }), ['0% ' + Y(c[0][1])]);
        };
        var d = document.createElement('div');
        d.className = 'pm-divak';
        d.style.cssText = 'left:' + (left2 / W * 100) + '%;top:' + (top2 / H * 100) + '%;width:' + (w2 / W * 100) + '%;height:'
          + (h / H * 100) + '%;clip-path:polygon(' + krivka(top2, h, left2, w2).join(',') + ')';
        d.style.setProperty('--zpozdeni', (xc / W * 1.2 + st.r * 0.03).toFixed(2) + 's');   // vlna jde zleva doprava
        // obrázek má pod rameny nakreslené vlastní opěradlo: ořízne se po stejné křivce (při vlně zůstane schované)
        var im = document.createElement('img');
        im.className = 'zaklad'; im.src = '/img/premiera/kino/' + String(m.f).replace('.png', '.webp'); im.alt = ''; im.decoding = 'async';
        im.style.cssText = 'left:' + (bok / w2 * 100).toFixed(2) + '%;width:' + (w / w2 * 100).toFixed(2) + '%;top:' + (nad / h * 100).toFixed(2)
          + '%;clip-path:polygon(' + krivka(top, m.h * k, left, w).join(',') + ')';
        d.appendChild(im);
        if (ruka) {                                                  // stejný divák s rukama nahoře, leží pixel na pixelu na prvním
          var vys = (m.h + ruka.nad) * k, horni = top - ruka.nad * k;
          var r2 = document.createElement('img');
          r2.className = 'ruce'; r2.src = '/img/premiera/kino/' + ruka.f + '?v=1'; r2.alt = ''; r2.decoding = 'async';
          r2.style.cssText = 'top:' + ((horni - top2) / h * 100).toFixed(2) + '%;clip-path:polygon(' + krivka(horni, vys, left2, w2).join(',') + ')';
          d.appendChild(r2); d.classList.add('ma-ruce');
        }
        divaci.appendChild(d);
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
    if (window.PmZvuky) window.PmZvuky.lidi(n);                    // hovor v sále sílí s počtem lidí
  }

  // ---------- smajlíci: svítící tlačítko v rohu sálu → okénko se 7 obličeji SQUADu (barvy podle nálady) a 7 smajlíky ----------
  var TVARE = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7'];
  var EMOJI = { srdce: '❤️', ohen: '🔥', smich: '😂', wow: '😮', tlesk: '👏', oslava: '🎉' };
  var SMAJL = TVARE.concat(['srdce', 'ohen', 'smich', 'wow', 'tlesk', 'oslava', 'joint']);
  var NALADY = String(T.tMoods || '').split('|');                  // „naštvaný – štve mě to|…“ (7 nálad v jazyce stránky)
  var naObrazovce = 0, spoust = $('pmSpoust'), pop = $('pmPop');
  var nadpisT = pop.querySelector('.pm-pop-tvare'), nadpisE = pop.querySelector('.pm-pop-emoji');
  function obsah(k, el, ikona) {
    if (k.charAt(0) === 'f') {                                    // obličej = maska z obrázku obarvená podle nálady (css)
      var t = document.createElement('span'); t.className = 'pm-tvar pm-tvar-' + k; el.appendChild(t);
    } else if (k === 'joint') {
      if (ikona) {                                                // v okénku: celý joint (1. políčko pásu)
        var im = document.createElement('img'); im.src = '/img/premiera/kino/joint-ikona.webp'; im.alt = ''; im.width = 30; im.height = 30; el.appendChild(im);
      } else {                                                    // v letu: pás 7 políček, dohořívá (css/premiera.css)
        var okno = document.createElement('span'), pas = document.createElement('span');
        okno.className = 'pm-joint'; okno.setAttribute('aria-hidden', 'true');
        okno.appendChild(pas); el.appendChild(okno);
      }
    } else el.textContent = EMOJI[k];
  }
  SMAJL.forEach(function (k) {
    var b = document.createElement('button'), tvar = k.charAt(0) === 'f';
    b.type = 'button';
    var popis = tvar ? NALADY[+k.slice(1) - 1] : T.tReact;
    b.setAttribute('aria-label', popis || T.tReact); b.title = popis || '';
    obsah(k, b, true);
    // u obličeje se v nadpisu ukáže, jakou náladu znamená (najetí myší, ťuknutí, klávesnice)
    var ukaz = function () { if (tvar && popis) nadpisT.textContent = 'SKELO SQUAD · ' + popis; };
    b.addEventListener('mouseenter', ukaz); b.addEventListener('focus', ukaz);
    b.addEventListener('click', function (e) { e.stopPropagation(); ukaz(); moje(k); });
    pop.querySelector(tvar ? '.pm-pop-rada-t' : '.pm-pop-rada-e').appendChild(b);
  });
  function zavriPop() { pop.hidden = true; spoust.setAttribute('aria-expanded', 'false'); }
  spoust.addEventListener('click', function (e) {
    e.stopPropagation();
    pop.hidden = !pop.hidden; spoust.setAttribute('aria-expanded', String(!pop.hidden));
    if (!pop.hidden) { pop.classList.remove('otevri'); void pop.offsetWidth; pop.classList.add('otevri'); }
  });
  pop.addEventListener('click', function (e) { e.stopPropagation(); });
  document.addEventListener('click', function () { if (!pop.hidden) zavriPop(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { zavriPop(); spoust.focus(); } });
  var odeslano = {}, odeslanoCas = [];
  function moje(k) {
    var t = Date.now();
    odeslanoCas = odeslanoCas.filter(function (x) { return t - x < 1000; });
    if (odeslanoCas.length >= 5) return;                         // víc než 5 za sekundu nepošleme (server pustí 6)
    odeslanoCas.push(t);
    vypust(k, true);
    zivy({ action: 'react', r: k }).then(function (r) {
      if (r.ok) odeslano[k] = (odeslano[k] || 0) + 1;
      if (k === 'tlesk' && Date.now() + 400 < dalsi) dalsi = Date.now() + 400;   // potlesk: hned ukázat kroužek vlny
    }).catch(function () { /* nevadí */ });
  }
  function vypust(k, ja) {
    if (jeviste.classList.contains('klid') || vyp.efekty || klid) {   // při klipu nic přes obraz: jen blikne tlačítko
      spoust.classList.remove('puls'); void spoust.offsetWidth; spoust.classList.add('puls');
      return;
    }
    if (naObrazovce >= (slaby() ? 10 : 30)) return;              // pojistka: víc naráz neletí
    var e = document.createElement('div');
    e.className = 'pm-let' + (ja ? ' moje' : '');
    e.style.right = (1 + Math.random() * 9) + '%';              // úzký pruh u pravého okraje (jako živé vysílání)
    e.style.setProperty('--dx', (Math.random() * -60) + 'px');
    e.style.setProperty('--vyska', -(vrstva.clientHeight * (0.65 + Math.random() * 0.3)) + 'px');
    obsah(k, e, false);
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

  // ---------- PROGRAM VEČERA (časy podle začátku premiéry, pražský čas) ----------
  (function () {
    var ol = $('pmProgram'), at = cas().at, casy = [at - 30 * 60000, at - 25 * 60000, at, at + 4 * 60000];
    var f = window.Intl ? new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Prague' }) : null;
    String(T.tProg || '').split('|').forEach(function (t, i) {
      var li = document.createElement('li'), b = document.createElement('b'), sp = document.createElement('span');
      b.textContent = f ? f.format(new Date(casy[i])) : ''; sp.textContent = t.replace('{name}', ol.dataset.nazev);
      li.appendChild(b); li.appendChild(sp); ol.appendChild(li);
    });
  })();

  // ---------- NÁLADOMĚR: jeden obličej na prohlížeč (jde změnit), procenta celého sálu; jen během 30 min odpočtu ----------
  var nalBox = $('pmNalady'), nalKarta = $('pmNalada'), nalTlac = {};
  TVARE.forEach(function (k, i) {
    var b = document.createElement('button'); b.type = 'button'; b.dataset.k = k;
    var cast = String(NALADY[i] || '').split(' – ');
    obsah(k, b, true);
    var pct = document.createElement('span'); pct.className = 'pm-nal-pct'; pct.textContent = '0\u00a0%';
    var jm = document.createElement('b'); jm.textContent = cast[0] || '';
    var po = document.createElement('small'); po.textContent = cast[1] || '';
    b.appendChild(pct); b.appendChild(jm); b.appendChild(po);
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () {
      zivy({ action: 'nalada', f: k }).then(function () { if (Date.now() + 300 < dalsi) dalsi = Date.now() + 300; }).catch(function () { /* nevadí */ });
      Object.keys(nalTlac).forEach(function (x) { nalTlac[x].classList.toggle('on', x === k); nalTlac[x].setAttribute('aria-pressed', String(x === k)); });
    });
    nalBox.appendChild(b); nalTlac[k] = b;
  });
  function naladaStav(n) {
    nalKarta.hidden = !n;
    if (!n) return;
    var suma = 0, max = 'f1';
    TVARE.forEach(function (k) { suma += n[k] || 0; if ((n[k] || 0) > (n[max] || 0)) max = k; });
    TVARE.forEach(function (k) {
      nalTlac[k].querySelector('.pm-nal-pct').textContent = (suma ? Math.round((n[k] || 0) / suma * 100) : 0) + '\u00a0%';
      nalTlac[k].classList.toggle('on', n.moje === k); nalTlac[k].setAttribute('aria-pressed', String(n.moje === k));
    });
    $('pmNalText').textContent = suma ? T.tMoodText.replace('{m}', String(NALADY[+max.slice(1) - 1] || '').split(' – ')[0]).replace('{p}', Math.round((n[max] || 0) / suma * 100)) : T.tMoodNone;
  }

  // ---------- MEXICKÁ VLNA: o čase rozhoduje server (8 potlesků 👏 za 3 s od kohokoli) → všichni naráz ----------
  // Kroužek kolem tlačítka smajlíků se plní potleskem; diváci s pózou „ruce nahoře“ se do ní prolnou, ostatní nadskočí.
  var VLNA_PRAH = 8, vlnaPosledni = 0, hlaskaT = 0;
  function hlaska(text) {
    var h = $('pmHlaska'); h.textContent = text; h.classList.add('videt');
    clearTimeout(hlaskaT); hlaskaT = setTimeout(function () { h.classList.remove('videt'); }, 2600);
  }
  function vlnaStav(d) {
    var n = typeof d.tlesk === 'number' ? d.tlesk : 0;
    spoust.style.setProperty('--vlnaK', Math.min(1, n / VLNA_PRAH).toFixed(3));
    spoust.classList.toggle('tleska', n > 0);
    nadpisE.textContent = n > 0 ? T.tReactEmoji + ' · ' + T.tWaveCount.replace('{n}', Math.min(n, VLNA_PRAH)).replace('{p}', VLNA_PRAH) : T.tReactEmoji;
    if (d.vlna && d.vlna !== vlnaPosledni) {
      vlnaPosledni = d.vlna;
      var za = d.vlna - cas().now;
      if (za > -1500) setTimeout(vlna, Math.max(0, za));
    }
  }
  function vlna() {
    if (jeviste.classList.contains('klid') || klid || vyp.efekty) return;
    if (cas().at - cas().now <= 15000) return;                     // posledních 15 s patří jízdě kamery a tmě
    hlaska(T.tWave);
    if (window.PmZvuky) window.PmZvuky.vlna();
    mista.slice(0, ukazano).forEach(function (m) { m.el.classList.remove('vlna'); void m.el.offsetWidth; m.el.classList.add('vlna'); });
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
    if (z.cas) {                                                  // dnešní zpráva jen čas, starší i s datem
      var d = new Date(z.cas), dnes = d.toDateString() === new Date().toDateString();
      kdy.dateTime = d.toISOString();
      kdy.textContent = dnes && hodiny ? hodiny.format(d) : datum ? datum.format(d) : d.toLocaleString();
    }
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
    if (typeof fsNovaZprava === 'function') fsNovaZprava();
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
    vlnaStav(d);
    naladaStav(d.nalady);
    if (vyp.chat) { chybaChatu = true; oznam(T.tOff); }
    else if (chybaChatu) { chybaChatu = false; oznam(''); }
    if (d.chat) d.chat.forEach(zprava);
    if ('pin' in d) pripnuto(d.pin);
    prazdno();
    kvizStav(d.kviz);
  }

  // ---------- KVÍZ na plátně (řídí ho server: service/PremiereQuiz – čas, hlasy, výsledek, Kevin) ----------
  // Otázka 12 s, pak výsledek 14 s. Správnou odpověď a zajímavost pošle server až po konci hlasování. Prohlížeč se zeptá
  // přesně v okamžiku, kdy otázka začíná a kdy končí hlasování (pole dalsi / do), takže všichni vidí totéž.
  var kvizEl = $('pmKviz'), kvizBar = $('pmKvizBar'), kevinEl = $('pmKvizKevin'), kviz = null;
  var mojeOdp = {};
  try { mojeOdp = JSON.parse(sessionStorage.getItem('pmKvizMoje') || '{}'); } catch (e) { /* bez úložiště */ }
  function naplanuj(t) {                                         // t = čas serveru, kdy se zeptat
    var za = t - cas().now;
    if (za > 0 && Date.now() + za < dalsi) dalsi = Date.now() + za;
  }
  function kvizKlic(i) { return song + '@' + cas().at + '#' + i; }
  function kvizSkryj() {
    if (!kviz) return;
    kviz = null;
    platno.classList.remove('ma-kviz');
    kvizBar.hidden = true; kvizBar.textContent = '';
    kevinEl.hidden = true;
  }
  function kvizStav(k) {
    if (k && k.dalsi) naplanuj(k.dalsi);
    if (!k || !k.faze) { kvizSkryj(); return; }
    naplanuj(k.do + 300);                                        // hned po konci fáze znovu (výsledek / návrat k odpočtu)
    if (!kviz || kviz.i !== k.i || kviz.faze !== k.faze) kvizKresli(k);
  }
  function odpovedi(k, kde, velke) {
    var box = document.createElement('div'); box.className = velke ? 'pm-kv-tlacitka' : 'pm-kv-odpovedi';
    k.a.forEach(function (a, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'pm-kv-odp'; b.dataset.i = i;
      var t = document.createElement('span'); t.className = 't'; t.textContent = 'ABC'.charAt(i) + ' · ' + a;
      b.appendChild(t);
      if (!velke) { var p = document.createElement('span'); p.className = 'pct'; b.appendChild(p); var pas = document.createElement('i'); b.insertBefore(pas, t); }
      b.addEventListener('click', function (e) { e.stopPropagation(); hlasuj(i); });
      box.appendChild(b);
    });
    kde.appendChild(box);
  }
  function kvizKresli(k) {
    kviz = k;
    zavriShort();
    var moje = mojeOdp[kvizKlic(k.i)];
    kvizEl.textContent = ''; kvizBar.textContent = '';
    var nad = document.createElement('div'); nad.className = 'pm-kv-nadpis'; nad.textContent = T.tQuiz;
    var q = document.createElement('div'); q.className = 'pm-kv-otazka'; q.textContent = k.q;
    kvizEl.appendChild(nad); kvizEl.appendChild(q);
    odpovedi(k, kvizEl, false);
    odpovedi(k, kvizBar, true);
    var stav = document.createElement('p'); stav.className = 'pm-kv-stav'; stav.setAttribute('role', 'status'); kvizBar.appendChild(stav);
    kvizEl.classList.toggle('vysledek', k.faze === 'vysledek');
    kevinEl.hidden = true;
    if (k.faze === 'otazka') {
      var cas2 = document.createElement('div'); cas2.className = 'pm-kv-cas'; var pr = document.createElement('i'); cas2.appendChild(pr); kvizEl.appendChild(cas2);
      var zbyva = Math.max(0, k.do - cas().now);
      pr.style.transitionDuration = zbyva + 'ms';
      requestAnimationFrame(function () { requestAnimationFrame(function () { pr.style.transform = 'scaleX(0)'; }); });   // proužek času ubývá
      if (k.hlasoval || moje != null) oznacMoje(moje, true);
      else stav.textContent = T.tQuizTap;
    } else {
      var celkem = k.hlasu || 0;
      document.querySelectorAll('.pm-kv-odp').forEach(function (b) {
        var i = +b.dataset.i;
        b.disabled = true;
        if (i === k.ok) { b.classList.add('ok'); b.querySelector('.t').textContent += ' ✓'; }
        if (k.pct && b.querySelector('.pct')) {
          b.querySelector('.pct').textContent = k.pct[i] + ' %';
          b.querySelector('i').style.transform = 'scaleX(' + (k.pct[i] / 100) + ')';
        }
      });
      if (moje != null) oznacMoje(moje, false);
      var f = document.createElement('div'); f.className = 'pm-kv-fakt'; f.textContent = k.fakt; kvizEl.appendChild(f);
      stav.textContent = celkem ? T.tQuizHit.replace('{p}', k.pct[k.ok]) : T.tQuizNone;
      var f2 = document.createElement('p'); f2.className = 'pm-kv-fakt-bar'; f2.textContent = k.fakt; kvizBar.appendChild(f2);   // čitelně i na telefonu
      if (k.kevin) { kevinEl.querySelector('span').textContent = k.kevin; kevinEl.hidden = false; }
    }
    platno.classList.add('ma-kviz');
    kvizBar.hidden = false;
    if (window.PmZvuky) window.PmZvuky.kviz(k.faze, k.do - cas().now);   // napětí, bubnový vír, úder při odhalení
  }
  function oznacMoje(i, hlasovani) {
    document.querySelectorAll('.pm-kv-odp').forEach(function (b) {
      if (+b.dataset.i === i) b.classList.add('moje');
      if (hlasovani) b.disabled = true;
    });
    if (hlasovani) kvizBar.querySelector('.pm-kv-stav').textContent = T.tQuizVoted;
  }
  function hlasuj(i) {
    if (!kviz || kviz.faze !== 'otazka' || mojeOdp[kvizKlic(kviz.i)] != null) return;
    var klicO = kvizKlic(kviz.i);
    mojeOdp[klicO] = i;
    try { sessionStorage.setItem('pmKvizMoje', JSON.stringify(mojeOdp)); } catch (e) { /* nevadí */ }
    oznacMoje(i, true);
    zivy({ action: 'kviz', i: String(kviz.i), odp: String(i) }).then(function (r) {
      if (r.status === 409 && kviz) kvizBar.querySelector('.pm-kv-stav').textContent = T.tQuizClosed;
    }).catch(function () { /* výsledek se ukáže i tak */ });
  }

  // ---------- upoutávka na plátně ----------
  var shortV = null;
  function zavriShort() {
    if (!shortV) return;
    shortV.pause(); shortV.remove(); shortV = null; platno.classList.remove('hraje-short');
  }
  function pustShort() {
    var c = cas();
    if (c.at - c.now <= 60000 || kviz) return;                   // poslední minuta patří premiéře, během kvízu je plátno jeho
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
    if (window.PmZvuky) window.PmZvuky.klip();                     // při klipu hraje jen klip
    setTimeout(function () { platno.classList.remove('v-finale', 'ma-logo'); }, 1200);
  }
  function tik() {
    var c = cas(), zbyva = c.at - c.now;
    odpocet.textContent = zbyva > 0 ? text(zbyva) : T.tLive;
    if (zbyva <= 60000) zavriShort();
    if (zbyva > 0 && zbyva <= 20000) scena.classList.add('priprav');   // vrstvu kamery připravit předem, jinak jízda na slabší grafice skočí
    if (zbyva > 0 && zbyva <= 15000) { najed(); if (window.PmZvuky) window.PmZvuky.finale(zbyva); }
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
    zvukSal(!sam || cas().zvuk);                                   // zvuk sálu jen po ťuknutí (jinak tlačítko 🔊)
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
    if (window.PmZvuky) window.PmZvuky.schovej(document.hidden);    // ve schované záložce ticho
    if (document.hidden) zastav();
    else { dalsi = 0; spust(); }
  });

  // ---------- ZVUK SÁLU (js/premiera-zvuky.js): tlačítko 🔊 vlevo nahoře = stejný vypínač jako zvuky celého webu ----------
  // (funkce hledají tlačítko až při použití: vstup() do sálu se volá i dřív, než sem skript dojde)
  function zvukKresli() {
    var b = $('pmZvukSal'), Z = window.PmZvuky, on = !!(Z && Z.bezi());
    b.hidden = !Z;                                                 // prohlížeč bez Web Audio: bez tlačítka
    b.classList.toggle('vyp', !on);
    b.setAttribute('aria-label', on ? T.tSoundOff : T.tSoundOn); b.title = on ? T.tSoundOff : T.tSoundOn;
  }
  function zvukSal(gesto) {
    var Z = window.PmZvuky;
    if (Z && gesto && !Z.vypnuto()) Z.start(cas().at - cas().now);
    zvukKresli();
  }
  $('pmZvukSal').addEventListener('click', function () {
    var Z = window.PmZvuky;
    if (!Z) return;
    if (Z.bezi()) Z.vypni();
    else if (Z.zapni(cas().at - cas().now) && window.skeliPmZvukPovolen) window.skeliPmZvukPovolen();
    zvukKresli();
  });
  zvukKresli();

  // ---------- VELKÝ SÁL na PC: sál přes celou šířku okna (výchozí), nebo menší v obsahu stránky; volba se pamatuje ----------
  // (tlačítko je vidět jen na širokém PC – css/premiera.css; na telefonu třída nic nemění)
  var velkyBtn = $('pmVelky');
  function velkySal(on) {
    root.classList.toggle('velky-sal', on);
    velkyBtn.textContent = on ? T.tSmaller : T.tBigger;
  }
  var velkyChci = true;
  try { velkyChci = localStorage.getItem('pmVelky') !== '0'; } catch (e) { /* bez úložiště: velký */ }
  velkySal(velkyChci);
  velkyBtn.addEventListener('click', function () {
    var on = !root.classList.contains('velky-sal');
    velkySal(on);
    try { localStorage.setItem('pmVelky', on ? '1' : '0'); } catch (e) { /* nevadí */ }
  });

  // ---------- chat na celé obrazovce: skutečný chat se přesune do sálu (vše funguje dál), vpravo ve 3 režimech ----------
  var chatEl = document.querySelector('.pm-chat'), chatDomov = chatEl.parentNode, prepinac = $('pmFsPrepinac'), nepreceteno = 0;
  function naCelou() { return document.fullscreenElement === jeviste || document.webkitFullscreenElement === jeviste || jeviste.classList.contains('na-celou'); }
  function fsRezim(r) {
    jeviste.classList.remove('fs-cely', 'fs-maly', 'fs-vyp'); jeviste.classList.add('fs-' + r);
    prepinac.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.rezim === r); b.setAttribute('aria-pressed', String(b.dataset.rezim === r)); });
    if (r !== 'vyp') { nepreceteno = 0; $('pmFsNove').textContent = ''; }
    try { localStorage.setItem('pmFsRezim', r); } catch (e) { /* nevadí */ }
  }
  prepinac.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { fsRezim(b.dataset.rezim); }); });
  function fsZmena() {
    var fs = naCelou();
    if (fs && chatEl.parentNode !== jeviste) {
      jeviste.appendChild(chatEl); jeviste.classList.add('fs');
      var r = 'maly'; try { r = localStorage.getItem('pmFsRezim') || 'maly'; } catch (e) { /* malý */ }
      fsRezim(r);
    } else if (!fs && chatEl.parentNode === jeviste) {
      chatDomov.appendChild(chatEl);
      jeviste.classList.remove('fs', 'fs-cely', 'fs-maly', 'fs-vyp');
    }
  }
  document.addEventListener('fullscreenchange', fsZmena);
  document.addEventListener('webkitfullscreenchange', fsZmena);
  new MutationObserver(fsZmena).observe(jeviste, { attributes: true, attributeFilter: ['class'] });   // nouzové „přes okno“
  function fsNovaZprava() {
    if (!jeviste.classList.contains('fs-vyp')) return;
    nepreceteno++; $('pmFsNove').textContent = nepreceteno > 9 ? '9+' : nepreceteno;
  }

  // ---------- celá obrazovka: PC a Android celý sál; iPhone stránku na celou obrazovku nepustí – tam aspoň klip ----------
  $('pmCelo').addEventListener('click', function () {
    if (document.fullscreenElement || document.webkitFullscreenElement) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    if (jeviste.classList.contains('na-celou')) { jeviste.classList.remove('na-celou'); return; }
    var go = jeviste.requestFullscreen || jeviste.webkitRequestFullscreen;
    var nouze = function () { jeviste.classList.add('na-celou'); };   // nouzově: sál přes celé okno prohlížeče
    if (go) {
      try {                                                        // prohlížeč může celou obrazovku odmítnout → nouzově přes okno
        var p = go.call(jeviste);
        if (p && p.catch) p.catch(nouze);
      } catch (e) { nouze(); }
      return;
    }
    nouze();
  });
})();
