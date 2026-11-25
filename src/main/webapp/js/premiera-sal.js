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
  // jedna postava na sedadle (i znovu: tvoje místo podle volby postavy – mojePostava)
  var RUCE = {}, metaVse = [];
  function divakEl(st, m) {
    // silueta o 14 % užší než sedadlo, vycentrovaná; ramena (m.top) na horní hraně opěradla; celý obrázek ale nikdy
    // širší než sedadlo (Skeli 24. 11.: široké postavy visely přes sousední sedadlo s rovnou hranou)
    // Skeli 25. 11.: menší (ramena se vejdou do šířky sedadla, nic nepřečuhuje uříznuté) a zapuštění níž za opěradlo
    // velikost napůl podle ramen a napůl podle výšky nad opěradlem (obrázky od ChatGPT mají různé proporce 0,80–1,18 –
    // samotná ramena dělala z někoho obra a z někoho trpaslíka; Skeli 25. 11.)
    var sw = st.x1 - st.x0, kR = sw / (m.sr - m.sl) * DIVAK_SIRE, kV = sw * DIVAK_SIRE / m.top;
    var k = Math.min(Math.sqrt(kR * kV), sw * 0.9 / m.w), xc = (st.x0 + st.x1) / 2;
    var left = xc - (m.sr - m.sl) * k / 2 - m.sl * k, top = st.top - m.top * k + sw * DIVAK_ZAPUST, w = m.w * k;
    // nad hlavou a do stran místo pro zvednuté ruce (mexická vlna – img/premiera/kino/ruce.json: nad, bok)
    var ruka = RUCE[m.f];
    var nad = Math.max(w * 0.35, ruka ? ruka.nad * k : 0), top2 = top - nad;
    var bok = ruka ? ruka.bok * k : 0, left2 = left - bok, w2 = w + 2 * bok;
    var dno = Math.max.apply(null, st.c.map(function (p) { return p[1]; })), h = dno - top2 + 1;
    // ořez po křivce opěradla (co je pod ní, schová sedadlo); vedle sedadla až ve výšce horní hrany opěradla (tam stojí
    // opěradlo souseda – dřív ve výšce rohu, tělo pak viselo přes sousední sedadlo); clip-path = nic se nepřekresluje
    var horni = Math.min.apply(null, st.c.map(function (p) { return p[1]; }));
    var krivka = function (y0, vys, l0, ww) {
      var c = st.c, Y = function (y) { return ((y - y0) / vys * 100).toFixed(2) + '%'; }, X = function (x) { return ((x - l0) / ww * 100).toFixed(2) + '%'; };
      return ['0% 0%', '100% 0%', '100% ' + Y(horni)].concat(c.slice().reverse().map(function (p) { return X(p[0]) + ' ' + Y(p[1]); }), ['0% ' + Y(horni)]);
    };
    var d = document.createElement('div');
    d.className = 'pm-divak';
    d.style.cssText = 'left:' + (left2 / W * 100) + '%;top:' + (top2 / H * 100) + '%;width:' + (w2 / W * 100) + '%;height:'
      + (h / H * 100) + '%;clip-path:polygon(' + krivka(top2, h, left2, w2).join(',') + ')';
    d.style.setProperty('--zpozdeni', (xc / W * 1.2 + st.r * 0.03).toFixed(2) + 's');   // vlna jde zleva doprava
    // obrázek má pod rameny nakreslené vlastní opěradlo: ořízne se po stejné křivce (při vlně zůstane schované)
    var im = document.createElement('img');
    im.className = 'zaklad'; im.src = '/img/premiera/kino/' + String(m.f).replace('.png', '.webp') + '?v=3'; im.alt = ''; im.decoding = 'async';   // v=3: Hitmanovo tetování výš (25. 11.)
    im.style.cssText = 'left:' + (bok / w2 * 100).toFixed(2) + '%;width:' + (w / w2 * 100).toFixed(2) + '%;top:' + (nad / h * 100).toFixed(2)
      + '%;clip-path:polygon(' + krivka(top, m.h * k, left, w).join(',') + ')';
    d.appendChild(im);
    if (ruka) {                                                  // stejný divák s rukama nahoře, leží pixel na pixelu na prvním
      var vys = (m.h + ruka.nad) * k, horni = top - ruka.nad * k;
      var r2 = document.createElement('img');
      r2.className = 'ruce'; r2.src = '/img/premiera/kino/' + ruka.f + '?v=3'; r2.alt = ''; r2.decoding = 'async';
      r2.style.cssText = 'top:' + ((horni - top2) / h * 100).toFixed(2) + '%;clip-path:polygon(' + krivka(horni, vys, left2, w2).join(',') + ')';
      d.appendChild(r2); d.classList.add('ma-ruce');
    }
    return d;
  }
  function postavSal() {
    if (postaveno) return; postaveno = true;
    var j = function (r) { if (!r.ok) throw new Error(r.status); return r.json(); };
    Promise.all([fetch('/img/premiera/kino/divaci.json?v=3').then(j), fetch('/img/premiera/kino/sedadla.json?v=1').then(j),
      fetch('/img/premiera/kino/ruce.json?v=2').then(j).catch(function () { return {}; })]).then(function (r) {
      var meta = r[0], sedadla = r[1]; RUCE = r[2] || {}; metaVse = meta;
      var skeliMisto = sedadla[SKELI_SEDADLO];                        // Skeliho pevné místo – nikdo jiný tam nesedne
      sedadla = sedadla.filter(function (st) { return st !== skeliMisto; });
      // pořadí obsazování: nejdřív k prostřední uličce, kterou vidí i telefon na výšku (výřez ±380 px kolem uličky
      // na x = 836) – jinak by si první návštěvník sedl na kraj mimo obraz a vypadalo by to, že se nic nestalo;
      // pak dál od uličky, přední řada až nakonec
      sedadla.forEach(function (st) {
        var stred = Math.abs((st.x0 + st.x1) / 2 - 836) / 836, vidi = st.x0 >= 456 && st.x1 <= 1216;
        st.poradi = (vidi ? 0 : 20) + [1.2, 0.6, 0.2, 0, 0.8, 3][st.r] + stred * 6 + Math.random() * 0.6;
      });
      sedadla.sort(function (a, b) { return a.poradi - b.poradi; });
      // kdo kde sedí (Skeli 25. 11.): menší postavy (nižší nad opěradlem vůči ramenům) dál od kamery, větší blíž; uvnitř řady
      // náhodně (každý návštěvník vidí jiné rozesazení); Hitman (divák 23) jen jednou, uprostřed sálu; stejná postava nikdy
      // dvakrát v jedné řadě (v přední řadě vypadala jako klon)
      var vyska = function (m) { return m.top / (m.sr - m.sl); };
      var hitman = meta.filter(function (m) { return /divak-23\./.test(m.f); })[0];
      var drdol = meta.filter(function (m) { return /divak-19\./.test(m.f); })[0];   // výrazný účes: taky jen jednou (Skeli 25. 11.)
      var lide = meta.filter(function (m) { return m !== hitman && m !== drdol; }).sort(function (a, b) { return vyska(a) - vyska(b); });
      var poradiMist = sedadla.slice().sort(function (a, b) { return a.r - b.r || Math.random() - 0.5; });   // od nejvzdálenější řady
      poradiMist.forEach(function (st, i) { st.m = lide[Math.min(lide.length - 1, Math.floor(i * lide.length / poradiMist.length))]; });
      var vRade = function (r, m, krome) { return poradiMist.some(function (c) { return c !== krome && c.r === r && c.m === m; }); };
      poradiMist.forEach(function (a) {                              // dvojník v téže řadě → prohodit s někým ze sousední řady
        if (!vRade(a.r, a.m, a)) return;
        var jiny = poradiMist.filter(function (b) { return Math.abs(b.r - a.r) <= 2 && b.r !== a.r && !vRade(a.r, b.m, a) && !vRade(b.r, a.m, b); })
          .sort(function (x, y) { return Math.abs(x.r - a.r) - Math.abs(y.r - a.r); })[0];
        if (jiny) { var t = jiny.m; jiny.m = a.m; a.m = t; }
      });
      var stred = poradiMist.filter(function (st) { return st.r >= 1 && st.r <= 3; });
      [hitman, drdol].forEach(function (m) {                          // každý jen jednou, uprostřed sálu, nikdy na stejném místě
        if (!m) return;
        var volna = stred.filter(function (st) { return st.m !== hitman && st.m !== drdol; });
        (volna[Math.floor(Math.random() * volna.length)] || poradiMist[0]).m = m;
      });
      // do stránky od zadních řad k předním (bližší silueta překryje vzdálenější)
      sedadla.slice().sort(function (a, b) { return a.r - b.r; }).forEach(function (st) {
        st.el = divakEl(st, st.m); divaci.appendChild(st.el);
      });
      mista = sedadla;
      postavSkeli(skeliMisto);
      usad(Math.max(0, lidi - (skeliVSale ? 1 : 0)));          // Skeliho avatar je jeden z lidí (ukazLidi)
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
      mojeIdx = cil - 1; mojePostava();                           // ty si sedneš jako poslední z těch, kdo tu jsou
      for (; ukazano < cil - 1; ukazano++) mista[ukazano].el.classList.add('sedi');
    }
    if (ukazano < cil && !casovac) casovac = setTimeout(dalsiDivak, 3000 + Math.random() * 2000);
  }
  function dalsiDivak() {
    casovac = 0;
    if (ukazano < cil) { mista[ukazano].el.classList.add('sedi'); ukazano++; }
    if (ukazano < cil) casovac = setTimeout(dalsiDivak, 500 + Math.random() * 900);
  }
  // ---------- MOJE POSTAVA (Skeli 25. 11.): před vstupem se zeptáme muž / žena / nechci říkat a na tvém místě se objeví taková
  //            postava. Volba zůstává JEN v prohlížeči (localStorage pmPostava): server ji nedostane, ostatní ji nevidí.
  //            Čísla = img/premiera/kino/divak-N (rozdělené podle siluety; 22 dredy a 23 Hitman ne). ----------
  var POSTAVY = { muz: [2, 4, 7, 10, 11, 13, 15, 17, 21], zena: [1, 3, 5, 8, 12, 14, 16, 18, 20], nic: [6, 9] };
  var mojeIdx = -1, jaSkeli = false, postava = '';
  try { postava = localStorage.getItem('pmPostava') || ''; } catch (e) { /* bez úložiště: zeptat se */ }
  if (!POSTAVY[postava]) postava = '';
  function mojePostava() {
    var st = mista[mojeIdx];
    if (!st || !st.el || !postava || (jaSkeli && song !== 'sim')) return;   // Skeli má vlastního avatara (při zkoušce ne)
    var cislo = function (m) { return +((/divak-(\d+)\./.exec(m.f) || [])[1]); };
    var vRade = mista.filter(function (x) { return x !== st && x.r === st.r; }).map(function (x) { return x.m; });
    var moznosti = metaVse.filter(function (m) { return POSTAVY[postava].indexOf(cislo(m)) >= 0; });
    var volne = moznosti.filter(function (m) { return vRade.indexOf(m) < 0; });   // ať nemáš dvojníka v řadě
    var z = volne.length ? volne : moznosti, m = z[Math.floor(Math.random() * z.length)];
    if (!m || m === st.m) return;
    var el = divakEl(st, m);
    if (st.el.classList.contains('sedi')) el.classList.add('sedi');
    divaci.replaceChild(el, st.el); st.el = el; st.m = m;
  }
  var zkouskaLidi = 0, zkouskaSkeli = false, zkouskaHlasy = 0, zkouskaVyp = {};                                          // jen zkouška (panel na konci souboru)
  function ukazLidi(n) {
    lidi = n;
    var t = T.tLidi.replace('{n}', cislo ? cislo.format(n) : n);
    $('pmSalLidi').textContent = t; $('pmChatLidi').textContent = t;
    // Skeli (účet umělce) je jeden z těch lidí: sedí na svém pevném místě, takže obecných diváků je o jednoho míň
    // (jinak sál ukázal „V sále: 1“ a seděli v něm dva – Skeli 25. 11.)
    usad(Math.max(0, n - (skeliVSale ? 1 : 0)));
    if (window.PmZvuky) window.PmZvuky.lidi(n);                    // hovor v sále sílí s počtem lidí
  }

  // ---------- smajlíci: svítící tlačítko v rohu sálu → okénko se 7 obličeji SQUADu (barvy podle nálady) a 7 smajlíky ----------
  var TVARE = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7'];
  var EMOJI = { srdce: '❤️', ohen: '🔥', smich: '😂', wow: '😮', tlesk: '👏', oslava: '🎉' };
  // joint je pro tuhle premiéru schovaný (Skeli 24. 11.: téma klipu; příště se může hodit – stačí ho sem vrátit)
  var SMAJL = TVARE.concat(['srdce', 'ohen', 'smich', 'wow', 'tlesk', 'oslava']);
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
    var popis = tvar ? String(NALADY[+k.slice(1) - 1] || '').split(' – ')[0] : (k === 'tlesk' ? T.tWaveHint : T.tReact);   // obličej: jen název nálady
    b.setAttribute('aria-label', popis || T.tReact); b.title = (popis || '') + (tvar ? ' · ' + k.slice(1) + ' / ' + 'QWERTZU'.charAt(+k.slice(1) - 1) : '');
    obsah(k, b, true);
    // u obličeje se v nadpisu ukáže, jakou náladu znamená (najetí myší, ťuknutí, klávesnice)
    var ukaz = function () { if (tvar && popis) nadpisT.textContent = 'SKELO SQUAD · ' + popis; };
    b.addEventListener('mouseenter', ukaz); b.addEventListener('focus', ukaz);
    b.addEventListener('click', function (e) { e.stopPropagation(); ukaz(); moje(k); });
    pop.querySelector(tvar ? '.pm-pop-rada-t' : '.pm-pop-rada-e').appendChild(b);
  });
  $('pmTlesk').addEventListener('click', function (e) { e.stopPropagation(); moje('tlesk'); });   // potlesk jedním ťuknutím
  // okénko se samo zavře po 8 s bez ťuknutí a při posunu sálu prstem (Skeli 25. 11.: na telefonu nešlo s ním hnout)
  var popTimer = 0;
  function popOdpocet() { clearTimeout(popTimer); popTimer = setTimeout(function () { if (!pop.hidden) zavriPop(); }, 8000); }
  function zavriPop() { clearTimeout(popTimer); pop.hidden = true; spoust.setAttribute('aria-expanded', 'false'); }
  spoust.addEventListener('click', function (e) {
    e.stopPropagation();
    pop.hidden = !pop.hidden; spoust.setAttribute('aria-expanded', String(!pop.hidden));
    if (!pop.hidden) { pop.classList.remove('otevri'); void pop.offsetWidth; pop.classList.add('otevri'); popOdpocet(); } else clearTimeout(popTimer);
  });
  pop.addEventListener('click', function (e) { e.stopPropagation(); popOdpocet(); });
  document.addEventListener('pointerdown', function (e) {
    if (!pop.hidden && !e.target.closest('.pm-pop, .pm-spoust')) zavriPop();
  });
  document.addEventListener('click', function () { if (!pop.hidden) zavriPop(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { zavriPop(); spoust.focus(); } });
  // KLÁVESNICE (Skeli 25. 11.): obličeje SQUADu se dají zahrát jako na klavír, zleva doprava 1–7 nebo Q W E R T Z U.
  // e.code = poloha klávesy, ne napsaný znak: na české klávesnici horní řada píše +ěščřžý a Z leží tam, kde má anglická Y.
  // Při psaní do chatu (nebo s Ctrl/Alt) klávesy nic nedělají.
  var KLAVESY = {};
  ['Digit', 'Numpad'].forEach(function (p) { for (var i = 1; i <= 7; i++) KLAVESY[p + i] = i - 1; });
  ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU'].forEach(function (c, i) { KLAVESY[c] = i; });
  document.addEventListener('keydown', function (e) {
    var n = KLAVESY[e.code], c = e.target;
    if (n == null || !vSale || e.repeat || e.ctrlKey || e.altKey || e.metaKey || sal.classList.contains('bez-reakci')) return;
    if (c && (c.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(c.tagName))) return;
    e.preventDefault();
    moje(TVARE[n]);
  });
  // ZVUKY SMAJLÍKŮ zvlášť (Skeli 25. 11.): vypínač dole v okénku, pamatuje se; hudba a zvuky sálu hrají dál
  var smajlZvuk = true, popZvuk = $('pmPopZvuk');
  try { smajlZvuk = localStorage.getItem('pmSmajlZvuk') !== '0'; } catch (e) { /* bez úložiště: zapnuto */ }
  function smajlZvukKresli() {
    popZvuk.classList.toggle('vyp', !smajlZvuk); popZvuk.setAttribute('aria-pressed', String(smajlZvuk));
    var popis = smajlZvuk ? popZvuk.dataset.on : popZvuk.dataset.off;   // jen ikona (Skeli 25. 11.), text pro čtečky a při najetí
    popZvuk.setAttribute('aria-label', popis); popZvuk.title = popis;
  }
  popZvuk.addEventListener('click', function () {
    smajlZvuk = !smajlZvuk; smajlZvukKresli();
    try { localStorage.setItem('pmSmajlZvuk', smajlZvuk ? '1' : '0'); } catch (e) { /* jen teď */ }
  });
  smajlZvukKresli();
  var odeslano = {}, odeslanoCas = [];
  function moje(k) {
    var t = Date.now();
    if (window.PmZvuky && smajlZvuk) window.PmZvuky.klik(k);                    // zvuček jen pro toho, kdo ťukl (js/premiera-zvuky.js) – i při rychlém hraní
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
    var uhni = chatPresSal() ? chatEl.offsetWidth / Math.max(1, vrstva.clientWidth) * 100 + 1 : 0;   // chat přes sál: letí vedle něj
    e.style.right = (uhni + 1 + Math.random() * 9) + '%';       // úzký pruh u pravého okraje (jako živé vysílání)
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
    var ol = $('pmProgram'), at = +ol.dataset.ostraAt || cas().at, casy = [at - 30 * 60000, at - 25 * 60000, at - 48000, at, at + 4 * 60000];   // 18:59:12 pozdrav (js/premiera-zvuky.js)
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
    b.title = cast.join(' – ');                                   // vysvětlení nálady jen po najetí (Skeli: moc textu)
    b.appendChild(pct); b.appendChild(jm);
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () {
      zivy({ action: 'nalada', f: k }).then(function () { if (Date.now() + 300 < dalsi) dalsi = Date.now() + 300; }).catch(function () { /* nevadí */ });
      Object.keys(nalTlac).forEach(function (x) { nalTlac[x].classList.toggle('on', x === k); nalTlac[x].setAttribute('aria-pressed', String(x === k)); });
    });
    nalBox.appendChild(b); nalTlac[k] = b;
  });
  // náladoměr na celé obrazovce: decentní proužek nahoře uprostřed (převládající nálada, procenta, čára všech nálad)
  var nalFs = document.createElement('div');
  nalFs.className = 'pm-nal-fs'; nalFs.hidden = true; nalFs.setAttribute('aria-hidden', 'true');
  nalFs.innerHTML = '<span class="pm-tvar"></span><b></b><span class="pm-nal-fs-pas"></span>';
  jeviste.appendChild(nalFs);
  function naladaStav(n) {
    nalKarta.hidden = !n; nalFs.hidden = !n;
    if (!n) return;
    var suma = 0, max = 'f1';
    TVARE.forEach(function (k) { suma += n[k] || 0; if ((n[k] || 0) > (n[max] || 0)) max = k; });
    TVARE.forEach(function (k) {
      nalTlac[k].querySelector('.pm-nal-pct').textContent = (suma ? Math.round((n[k] || 0) / suma * 100) : 0) + '\u00a0%';
      nalTlac[k].classList.toggle('on', n.moje === k); nalTlac[k].setAttribute('aria-pressed', String(n.moje === k));
    });
    if (suma) {
      nalFs.querySelector('.pm-tvar').className = 'pm-tvar pm-tvar-' + max;
      nalFs.querySelector('b').textContent = String(NALADY[+max.slice(1) - 1] || '').split(' – ')[0] + ' ' + Math.round((n[max] || 0) / suma * 100) + ' %';
      nalFs.querySelector('.pm-nal-fs-pas').innerHTML = TVARE.map(function (k) { return '<i class="pm-tvar-' + k + '" style="flex-grow:' + (n[k] || 0) + '"></i>'; }).join('');
    }
    nalFs.classList.toggle('prazdny', !suma);
    $('pmNalText').textContent = suma ? T.tMoodText.replace('{m}', String(NALADY[+max.slice(1) - 1] || '').split(' – ')[0]).replace('{p}', Math.round((n[max] || 0) / suma * 100)) : T.tMoodNone;
  }

  // ---------- MEXICKÁ VLNA: o čase rozhoduje server (8 potlesků 👏 za 3 s od kohokoli) → všichni naráz ----------
  // Kroužek kolem tlačítka smajlíků se plní potleskem; diváci s pózou „ruce nahoře“ se do ní prolnou, ostatní nadskočí.
  var VLNA_PRAH = 30, vlnaPosledni = 0, hlaskaT = 0;   // laťku posílá server (tleskPrah: 10–30 podle sálu)
  function hlaska(text) {
    var h = $('pmHlaska'); h.textContent = text; h.classList.add('videt');
    clearTimeout(hlaskaT); hlaskaT = setTimeout(function () { h.classList.remove('videt'); }, 2600);
  }
  function vlnaStav(d) {
    var n = typeof d.tlesk === 'number' ? d.tlesk : 0;
    var tl = $('pmTlesk');                                         // kroužek u tlačítka 👏 vedle smajlíků
    if (typeof d.tleskPrah === 'number' && d.tleskPrah > 0) VLNA_PRAH = d.tleskPrah;
    tl.style.setProperty('--vlnaK', Math.min(1, n / VLNA_PRAH).toFixed(3));
    tl.classList.toggle('tleska', n > 0);
    $('pmTleskN').textContent = n > 0 ? Math.min(n, VLNA_PRAH) + '/' + VLNA_PRAH : '';
    nadpisE.textContent = n > 0 ? T.tReactEmoji + ' · ' + T.tWaveCount.replace('{n}', Math.min(n, VLNA_PRAH)).replace('{p}', VLNA_PRAH) : T.tReactEmoji;
    if (d.vlna && d.vlna !== vlnaPosledni) {
      vlnaPosledni = d.vlna;
      var za = d.vlna - cas().now;
      if (za > -5000) setTimeout(vlna, Math.max(0, za));   // pozdní dotaz (pomalý telefon): vlna hned, ne vůbec (stejně jako mávnutí)
    }
  }
  // ---------- SKELI V SÁLE (Skeli 25. 11.): avatar na pevném místě (3. řada od plátna u uličky vpravo), když je Skeli
  // přihlášený v sále (server: d.skeli). Při pozdravu (zvuk js/premiera-zvuky.js: klavír 51 s, hlas 48–31,4 s předem) se na
  // svém místě postaví, otočí se čelem k divákům (za ním plátno → silueta), mluví do mikrofonu, otočí se zpátky a sedne si.
  // Všechny záběry jsou v jednom prvku na jeho sedadle: spodek těla kryje opěradlo, diváci blíž ke kameře ho překryjí.
  // (Chůze uličkou vypadala jako vystřihovánky – pryč.) Když v sále není, zazní jen hlas.
  // Snímky img/premiera/kino/skeli/ (navrhy/premiera/kino/skeli.py).
  var DIVAK_SIRE = 0.76, DIVAK_ZAPUST = 0.07;   // ramena 76 % šířky sedadla, o 7 % šířky sedadla níž za opěradlo
  var SKELI_SEDADLO = 27, SK = { w: 512, h: 768, top: 519, sl: 50, sr: 462 };
  var skeliEl = null, skeliSvetlo = null, skeliSt = null, skeliVSale = false;
  var SK_CESTA = '/img/premiera/kino/skeli/', SK_V = '?v=3';   // v=3: mávání přegenerované (25. 11.)
  function postavSkeli(st) {
    if (!st) return;
    skeliSt = st;
    // stejně menší a zapuštěný jako ostatní diváci (sedadlo v obrázku se ořízne po křivce, nevadí, že nesedí přesně)
    var sw = st.x1 - st.x0, k = sw / (SK.sr - SK.sl) * 0.78, xc = (st.x0 + st.x1) / 2;   // Skeli: celý za opěradlem (rukáv nepřečuhuje)
    var left = xc - (SK.sl + SK.sr) / 2 * k, top = st.top - SK.top * k + sw * DIVAK_ZAPUST, w = SK.w * k, h = SK.h * k;
    var horni = Math.min.apply(null, st.c.map(function (p) { return p[1]; }));
    var Y = function (y) { return ((y - top) / h * 100).toFixed(2) + '%'; }, X = function (x) { return ((x - left) / w * 100).toFixed(2) + '%'; };
    var poly = ['0% 0%', '100% 0%', '100% ' + Y(horni)].concat(st.c.slice().reverse().map(function (p) { return X(p[0]) + ' ' + Y(p[1]); }), ['0% ' + Y(horni)]);
    var d = document.createElement('div');
    d.className = 'pm-divak ma-ruce pm-skeli';
    d.style.cssText = 'left:' + (left / W * 100) + '%;top:' + (top / H * 100) + '%;width:' + (w / W * 100) + '%;height:' + (h / H * 100) + '%;clip-path:polygon(' + poly.join(',') + ')';
    d.style.setProperty('--zpozdeni', (((st.x0 + st.x1) / 2) / W * 1.2 + st.r * 0.03).toFixed(2) + 's');
    [['sedi', 'zaklad on'], ['ruce', 'ruce'], ['vstava', 'f f-vstava'], ['stoji', 'f f-stoji'], ['otocka', 'f celem f-otocka'], ['mikrofon', 'f celem f-mikrofon'],
      ['mluvi', 'f celem f-mluvi'], ['mluvi2', 'f celem f-mluvi2'], ['srdce', 'f celem f-srdce'], ['gesto', 'f celem f-gesto'],
      ['mava-mezi', 'f f-mava-mezi'], ['mava-2', 'f f-mava-2'], ['mava-3', 'f f-mava-3'], ['mava-4', 'f f-mava-4']].forEach(function (x) {
      var im = document.createElement('img'); im.className = x[1]; im.src = SK_CESTA + x[0] + '.webp' + SK_V; im.alt = ''; im.decoding = 'async'; d.appendChild(im);
    });
    var pred = null;                                               // bližší řady se kreslí přes vzdálenější
    mista.forEach(function (m) { if (!pred && m.r > st.r && m.el) pred = m.el; });
    divaci.insertBefore(d, pred);
    skeliEl = d;
    // reflektor: teplá záře kolem něj, když stojí (nad sedadlem, výška stojící postavy)
    skeliSvetlo = document.createElement('div'); skeliSvetlo.className = 'pm-skeli-svetlo';
    skeliSvetlo.style.cssText = 'left:' + ((st.x0 - sw * 0.6) / W * 100) + '%;top:' + ((st.top - sw * 2.1) / H * 100) + '%;width:' + (sw * 2.2 / W * 100) + '%;height:' + (sw * 2.6 / H * 100) + '%';
    divaci.insertBefore(skeliSvetlo, d);
    skeliScena((cas().at - cas().now) / 1000);
  }
  function skeliScena(z) {
    if (!skeliEl) return;
    // vstane, otočí se k divákům, mluví (střídá záběry, ruka na srdci, gesto), otočí se zpátky, sedne si
    // Skeli 25. 11.: otočka k divákům i zpátky rychle (kroky po 0,3 s, krátké prolnutí jako u mávání – rozdíly mezi snímky
    // nejsou vidět), pomalé prolnutí jen mezi záběry při mluvení
    var s = '';
    if (skeliVSale && z <= 49.4 && z > 30.3) {
      s = z > 49.1 ? 'vstava' : z > 48.8 ? 'otocka' : z > 48.4 ? 'mikrofon'
        : z > 40 ? (Math.floor((48.4 - z) / 2.4) % 2 ? 'mluvi2' : 'mluvi') : z > 37 ? 'srdce' : z > 34.3 ? 'mluvi' : z > 32 ? 'gesto'
        : z > 31.2 ? 'mluvi' : z > 30.9 ? 'mikrofon' : z > 30.6 ? 'otocka' : 'vstava';
    }
    skeliEl.classList.toggle('sedi', skeliVSale);
    if (skeliEl.dataset.s !== s) {
      // celý proslov rychlým prolnutím (Skeli 25. 11.: při pomalém byly při mluvení vidět dva Skeliové přes sebe – „dvojník“)
      if (!mavaBezi) skeliEl.classList.add('mava');
      skeliEl.dataset.s = s; skSnimek(s);
      if (!s && !mavaBezi) setTimeout(function () { if (!skeliEl.dataset.s && !mavaBezi) skeliEl.classList.remove('mava'); }, 300);
    }
    skeliSvetlo.classList.toggle('on', skeliVSale && z <= 49.4 && z > 30.3);
  }
  function skeliTik(zbyva) { skeliScena(zbyva / 1000); }
  // ---------- SKELI MÁVÁ (Skeli 25. 11.): tlačítko pod sálem vidí jen účet umělce; server řekne čas a postava se u všech
  //            z ničeho nic otočí, jednou zvedne ruku a otočí se zpět (žádný nápis ani reflektor). Snímky mava-1..4 (navrhy/premiera/kino/skeli-mava.py).
  var jaUmelec = false, mavaPosledni = 0, mavaBezi = false;
  // [snímek, ms od začátku]: otočí se, jednou zvedne ruku a chvilku ji podrží, spustí ji a otočí se zpět (Skeli 25. 11.: 3× vypadalo divně)
  // otočka přes Skeliho mezisnímek (hlava z profilu doleva) – mava-1 s hlavou doprava cukal na druhou stranu, vyřazený (Skeli 25. 11.)
  // Skeli 25. 11.: otočka rychle (snímky po ~0,27 s, prolnutí 0,24 s), jen ruka nahoře chvilku počká (~1,6 s)
  var MAVA = [['mava-mezi', 0], ['mava-2', 260], ['mava-3', 540], ['mava-4', 800], ['mava-3', 2400], ['mava-2', 2680], ['mava-mezi', 2960], ['', 3240]];
  function mavej() {
    if (mavaBezi || !skeliEl || !skeliVSale || !skeliEl.classList.contains('sedi') || skeliEl.dataset.s) return;   // ne při pozdravu
    mavaBezi = true; skeliEl.classList.add('mava');
    MAVA.forEach(function (x) {
      setTimeout(function () {
        if (skeliEl.dataset.s) { mavaBezi = false; skeliEl.classList.remove('mava'); return; }   // mezitím začal pozdrav: ten má přednost
        skSnimek(x[0]);
        if (!x[0]) { mavaBezi = false; setTimeout(function () { skeliEl.classList.remove('mava'); }, 150); }
      }, x[1]);
    });
  }
  $('pmMavni').addEventListener('click', function () {
    var b = $('pmMavni'); b.disabled = true;
    zivy({ action: 'mavni' }).then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.at) { mavaPosledni = d.at; setTimeout(mavej, Math.max(0, d.at - cas().now)); }
    }).catch(function () { /* nevadí */ }).then(function () { setTimeout(function () { b.disabled = false; }, 8000); });
  });
  // jako v animaci: nový postoj se plynule položí přes starý (nikdy není průhledný – Skeli: „problikávám“), starý zmizí až pak
  var skVrch = 10, skMinuly = null;
  function skSnimek(s) {
    var im = skeliEl.querySelector(s ? 'img.f-' + s : 'img.zaklad');
    if (!im) return;
    if (!skMinuly) skMinuly = skeliEl.querySelector('img.zaklad');
    if (im === skMinuly) return;
    var stary = skMinuly; skMinuly = im;
    im.style.zIndex = ++skVrch; im.classList.add('on');
    var pryc = skeliEl.classList.contains('mava') ? 100 : 260;      // mávání: krátké prolnutí, ať za postavou nezůstává „duch“
    setTimeout(function () { if (stary !== skMinuly) { stary.classList.add('hned'); stary.classList.remove('on'); void stary.offsetWidth; stary.classList.remove('hned'); } }, pryc);
  }

  function vlna() {
    if (jeviste.classList.contains('klid') || klid || vyp.efekty) return;
    if (cas().at - cas().now <= 15000) return;                     // posledních 15 s patří jízdě kamery a tmě
    hlaska(T.tWave);
    if (window.PmZvuky) window.PmZvuky.vlna();
    mista.slice(0, ukazano).forEach(function (m) { m.el.classList.remove('vlna'); void m.el.offsetWidth; m.el.classList.add('vlna'); });
    if (skeliEl && skeliEl.classList.contains('sedi') && !skeliEl.dataset.s) { skeliEl.classList.remove('vlna'); void skeliEl.offsetWidth; skeliEl.classList.add('vlna'); }
  }

  // ---------- chat ----------
  var zpravy = $('pmZpravy'), info = $('pmChatInfo'), form = $('pmPsani'), posledni = 0;
  function oznam(text) { info.textContent = text || ''; info.hidden = !text; }
  function prazdno() {
    var p = zpravy.querySelector('.pm-zp-prazdno');
    if (zpravy.querySelector('.pm-zp')) { if (p) p.remove(); return; }
    if (!p && !vyp.chat) { p = document.createElement('p'); p.className = 'pm-zp-prazdno'; p.textContent = T.tEmpty; zpravy.appendChild(p); }
  }
  // PŘIPNUTÍ (Skeli 26. 11.): zpráva zůstává na svém místě (zlatý rámeček 📌) a její kopie se přilepí nahoru pod hlavičku;
  // další připnutá pod ni (nejvýš 5). Odepnutí ji jen sundá shora – v chatu zůstane, kde byla, kontext se neztratí.
  function pripni(id, on) {
    var el = zpravy.querySelector('.pm-zp[data-id="' + id + '"]');
    if (el) el.classList.toggle('pripnuta', on);                  // hned, server to potvrdí při dalším dotazu
    posli('/api/comments', { kind: 'video', action: 'pin', id: String(id), on: on ? '1' : '0', vic: '1' })
      .then(function (r) { if (!r.ok) { oznam(T.tErr); if (el) el.classList.toggle('pripnuta', !on); } dalsi = 0; })
      .catch(function () { oznam(T.tErr); });
  }
  // SRDÍČKO od Skeliho (Skeli 26. 11.): ♡ u zpráv návštěvníků vidí jen účet umělce, ❤️ pak vidí všichni; autor dostane upozornění
  function srdce(el, on) {
    el.classList.toggle('srdce', on);
    var b = el.querySelector('.pm-zp-srdce');
    if (b) { b.textContent = on ? '❤️' : '♡'; if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', String(on)); }
  }
  function akce(z, el) {
    var moznosti = [];
    // text Připnout / Odepnout podle toho, jestli je zpráva právě připnutá (stav se mění i bez nového vykreslení)
    if (z.pripnout) moznosti.push([function () { return el.classList.contains('pripnuta') ? T.tUnpin : T.tPin; }, function () {
      pripni(z.id, !el.classList.contains('pripnuta'));
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
    var popisky = [];
    moznosti.forEach(function (m) {
      var x = document.createElement('button'); x.type = 'button';
      popisky.push(function () { x.textContent = typeof m[0] === 'function' ? m[0]() : m[0]; });
      x.addEventListener('click', function () { radek.hidden = true; b.setAttribute('aria-expanded', 'false'); m[1](); });
      radek.appendChild(x);
    });
    popisky.forEach(function (f) { f(); });
    b.addEventListener('click', function () {
      popisky.forEach(function (f) { f(); });                     // Připnout / Odepnout podle aktuálního stavu
      radek.hidden = !radek.hidden; b.setAttribute('aria-expanded', String(!radek.hidden));
    });
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
    t.appendChild(b); t.appendChild(kdy);
    if (z.srdcovat) {                                             // účet umělce: ♡ jedním ťuknutím
      var sb = document.createElement('button'); sb.type = 'button'; sb.className = 'pm-zp-srdce';
      sb.setAttribute('aria-label', T.tHeart || '❤️'); sb.title = T.tHeart || '';
      sb.addEventListener('click', function () {
        var on = !el.classList.contains('srdce'); srdce(el, on);
        posli('/api/comments', { kind: 'video', action: 'heart', id: String(z.id), on: on ? '1' : '0' })
          .then(function (r) { if (!r.ok) { srdce(el, !on); oznam(T.tErr); } dalsi = 0; })
          .catch(function () { srdce(el, !on); oznam(T.tErr); });
      });
      t.appendChild(sb);
    } else {
      var ss = document.createElement('span'); ss.className = 'pm-zp-srdce'; ss.title = T.tHearted || ''; t.appendChild(ss);
    }
    t.appendChild(p);
    el.appendChild(f); el.appendChild(t);
    srdce(el, !!z.srdce);
  }
  function zprava(z) {
    if (!z || typeof z.id !== 'number' || z.id <= posledni) return;
    posledni = z.id;
    var el = document.createElement('div');
    el.className = 'pm-zp' + (z.skeli ? ' skeli' : '') + (z.pripnuto ? ' pripnuta' : '');
    el.dataset.id = z.id;
    telo(z, el); akce(z, el);
    zpravy.insertBefore(el, zpravy.firstChild);                   // nejnovější nahoře
    if (typeof fsNovaZprava === 'function') fsNovaZprava();
    while (zpravy.children.length > 120) zpravy.lastChild.remove();   // v paměti nejvýš 120
  }
  // připnuté nahoře: jedna zpráva pod druhou; Skeli (pripnout) má u každé ✕ = odepnout. Zprávy v chatu dostanou rámeček podle seznamu.
  function pripnute(piny) {
    var box = $('pmPripnuto'), ids = {};
    piny = Array.isArray(piny) ? piny : [];
    box.hidden = !piny.length; box.textContent = '';
    piny.forEach(function (z) {
      ids[z.id] = true;
      var r = document.createElement('div'); r.className = 'pm-pin';
      var b = document.createElement('b'); b.textContent = '📌 ' + (z.jmeno || T.tDeleted) + ': ';
      r.appendChild(b); r.appendChild(document.createTextNode(z.text));   // čistý text
      if (z.pripnout) {
        var x = document.createElement('button'); x.type = 'button'; x.className = 'pm-pin-pryc'; x.textContent = '✕';
        x.setAttribute('aria-label', T.tUnpin); x.title = T.tUnpin;
        x.addEventListener('click', function () { r.remove(); if (!box.children.length) box.hidden = true; pripni(z.id, false); });
        r.appendChild(x);
      }
      box.appendChild(r);
    });
    zpravy.querySelectorAll('.pm-zp').forEach(function (el) { el.classList.toggle('pripnuta', !!ids[el.dataset.id]); });
  }
  function srdceStav(seznam) {
    if (!Array.isArray(seznam)) return;
    var ids = {}; seznam.forEach(function (i) { ids[i] = true; });
    zpravy.querySelectorAll('.pm-zp').forEach(function (el) { srdce(el, !!ids[el.dataset.id]); });
  }
  // SMAJLÍCI DO ZPRÁVY (Skeli 25. 11.): tlačítko 😊 u psaní → okénko s emoji, ťuknutí vloží smajlíka na místo kurzoru.
  // Emoji jsou obyčejné znaky textu – zpráva zůstává čistý text (nikdy HTML). Nejvýš 200 znaků jako dřív.
  var EMOJI_CHAT = ['😂', '😍', '🔥', '❤️', '👏', '😮', '😢', '🙏', '💯', '🎉', '😎', '🤯', '👍', '😅', '🥺', '💪', '🖤', '🎬', '🍿', '🎤'];
  var smajlB = $('pmPsaniSmajl'), smajlPop = $('pmPsaniPop');
  if (form && smajlB && smajlPop) {
    var pole = form.querySelector('input');   // POZOR: ne „vstup“ – tak se jmenuje funkce, která otevírá sál
    EMOJI_CHAT.forEach(function (em) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = em; b.setAttribute('aria-label', em);
      b.addEventListener('click', function (e) {
        e.preventDefault();
        if (pole.value.length + em.length > 200) return;
        var a = pole.selectionStart == null ? pole.value.length : pole.selectionStart, z = pole.selectionEnd == null ? a : pole.selectionEnd;
        pole.setRangeText(em, a, z, 'end');
        pole.focus();
      });
      smajlPop.appendChild(b);
    });
    var smajlZavri = function () { smajlPop.hidden = true; smajlB.setAttribute('aria-expanded', 'false'); };
    smajlB.addEventListener('click', function (e) {
      e.stopPropagation();
      smajlPop.hidden = !smajlPop.hidden; smajlB.setAttribute('aria-expanded', String(!smajlPop.hidden));
    });
    smajlPop.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () { if (!smajlPop.hidden) smajlZavri(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !smajlPop.hidden) { smajlZavri(); smajlB.focus(); } });
    form.addEventListener('submit', smajlZavri);
  }
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var input = form.querySelector('input'), btn = form.querySelector('button[type=submit]'), text = input.value.trim();
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
    var q = '?song=' + encodeURIComponent(song) + '&k=' + klic + '&po=' + posledni + (song === 'sim' ? '&simAt=' + cas().at + (zkouskaHlasy ? '&simHlasy=' + zkouskaHlasy : '') : '');
    fetch('/api/premiere/live' + q, { cache: 'no-store', credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(prijato)
      .catch(function () { dalsi = Date.now() + 8000 + Math.random() * 4000; })   // server nejde: zkusit později, nezahlcovat
      .then(function () { ptam = false; });
  }
  function prijato(d) {
    vyp = d.vyp || {};
    jaSkeli = !!(d.ja && d.ja.skeli);
    jaUmelec = !!(d.ja && d.ja.umelec);
    $('pmMavni').hidden = !(jaUmelec && skeliVSale);
    if (d.mava && d.mava !== mavaPosledni) {                           // Skeli zamával: u všech naráz
      mavaPosledni = d.mava;
      var zaM = d.mava - cas().now;
      // dotaz chodí jen každé 3–6 s: kdo se o mávnutí dozví pozdě, zamává hned (dřív −1,5 s = telefon ho skoro vždy propásl, Skeli 25. 11.)
      if (zaM > -7000) setTimeout(mavej, Math.max(0, zaM));
    }
    Object.keys(zkouskaVyp).forEach(function (x) { if (zkouskaVyp[x]) vyp[x] = true; });   // jen zkouška: vypínače z panelu
    sal.classList.toggle('bez-reakci', !!vyp.reakce);
    sal.classList.toggle('bez-chatu', !!vyp.chat);
    skeliVSale = !!d.skeli || zkouskaSkeli;                             // Skeli (účet umělce) je v sále (dřív než počet: ukazLidi ho odečte)
    if (typeof d.lidi === 'number') ukazLidi(zkouskaLidi || d.lidi);   // při zkoušce počet z panelu (konec souboru)
    if (d.reakce) ciziReakce(d.reakce);
    vlnaStav(d);
    naladaStav(d.nalady);
    if (vyp.chat) { chybaChatu = true; oznam(T.tOff); }
    else if (chybaChatu) { chybaChatu = false; oznam(''); }
    if (d.chat && !vyp.chat) d.chat.forEach(zprava);
    if ('piny' in d) pripnute(d.piny);
    if ('srdce' in d) srdceStav(d.srdce);
    prazdno();
    kvizStav(vyp.kviz ? null : d.kviz);
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
  // Místo pod sálem je rezervované celou dobu kvízu (třída kviz-okno, 18:34–18:55): mezi otázkami v něm běží odpočet do další
  // otázky a výška se drží na největší dosavadní – nic pod sálem neposkakuje (Skeli 24. 11.).
  var kvizOkno = false, kvizDalsi = 0, kvizBylo = false, kvizVyska = 0;
  function kvizDrzVysku() {
    requestAnimationFrame(function () { var v = kvizBar.offsetHeight; if (kvizOkno && v > kvizVyska) { kvizVyska = v; kvizBar.style.minHeight = v + 'px'; } });
  }
  function kvizCekani() {
    kvizBar.textContent = ''; kvizBar.hidden = false;
    var p = document.createElement('p'); p.className = 'pm-kv-cekej'; kvizBar.appendChild(p);
    kvizCekaniText(); kvizDrzVysku();
  }
  function kvizCekaniText() {
    var p = kvizBar.querySelector('.pm-kv-cekej'); if (!p) return;
    var za = kvizDalsi - cas().now;
    p.textContent = za > 0 && za < 1800000 ? (kvizBylo ? T.tQuizNext : T.tQuizFirst).replace('{t}', text(za)) : T.tQuiz;
  }
  function kvizSkryj() {
    if (!kviz) { if (kvizOkno && !kvizBar.querySelector('.pm-kv-cekej')) kvizCekani(); return; }
    kviz = null;
    platno.classList.remove('ma-kviz');
    kvizBar.textContent = '';
    kevinEl.hidden = true;
    if (kvizOkno) kvizCekani(); else kvizBar.hidden = true;
  }
  function kvizStav(k) {
    if (k && k.dalsi) { naplanuj(k.dalsi); kvizDalsi = k.dalsi; }
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
      // Kevin (Skeli 25. 11.): ne přes sál (překážel), ale v proužku kvízu pod sálem, s malou fotkou hlavy – ať je jasné, kdo mluví
      if (k.kevin) {
        var kv = document.createElement('p'); kv.className = 'pm-kv-kevin';
        var hl = document.createElement('img'); hl.src = '/img/premiera/kino/kevin-hlava.webp'; hl.alt = 'Kevin'; hl.width = 40; hl.height = 40; hl.decoding = 'async';
        var tx = document.createElement('span'); tx.textContent = k.kevin;
        kv.appendChild(hl); kv.appendChild(tx); kvizBar.appendChild(kv);
        kevinEl.querySelector('span').textContent = k.kevin; kevinEl.hidden = false;   // na celé obrazovce (proužek pod sálem tam není)
      }
    }
    platno.classList.add('ma-kviz');
    kvizBar.hidden = false; kvizBylo = true; kvizDrzVysku();
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
    if (c.at - c.now <= 120000 || kviz) return;                  // poslední 2 minuty patří premiéře, během kvízu je plátno jeho
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
  var TEPY = [11, 10, 9, 8, 7, 6, 5], SEPOT = 1.4;   // Skeli 24. 11.: obličeje dřív (do 5 s všech 7 barevných, pak šednou)
  var finaleCasy = [];                                            // časovače finále (posuvník zkoušky je umí zrušit)
  function finale7(zbyva) {
    if (finale) return; finale = true;
    var setTimeout = function (f, ms) { finaleCasy.push(window.setTimeout(f, ms)); };
    var tv = [].slice.call(document.querySelectorAll('#pmSalTvare .pm-tvar'));
    var zvuk = function () { return cas().zvuk && window.SquadZvuk ? window.SquadZvuk : null; };
    platno.classList.add('v-finale');
    TEPY.forEach(function (pred, i) {
      var d = zbyva - pred * 1000;
      if (d < -300) { tv[i].classList.add('on'); return; }       // přišel pozdě: ty obličeje už svítí
      setTimeout(function () {
        tv[i].classList.add('on');
        platno.classList.remove('tep'); void platno.offsetWidth; platno.classList.add('tep');
        var z = zvuk(); if (z) z.srdce(i < 4 ? 0.55 + i * 0.07 : 1);   // poslední tři naplno (hraje už stoupání finále)
      }, Math.max(0, d));
    });
    setTimeout(function () { platno.classList.add('ma-logo'); var z = zvuk(); if (z && zbyva > SEPOT * 1000 - 300) z.sepot(0.09); }, Math.max(0, zbyva - SEPOT * 1000));
    setTimeout(function () { scena.classList.add('tma'); }, Math.max(0, zbyva - 7500));              // od 7,5 s sál postupně do tmy
    setTimeout(function () { jeviste.classList.add('klid'); }, Math.max(0, zbyva - 3000));          // 3 s předem nic nelétá přes obraz
  }
  function pust() {
    jeviste.classList.add('hraje', 'klid');
    if (window.PmZvuky) window.PmZvuky.klip();                     // při klipu hraje jen klip
    setTimeout(function () { platno.classList.remove('v-finale', 'ma-logo'); }, 1200);
  }
  var pozdravVidet = false, pmSede = false, chatRezim = 'cely';   // chat přes sál: cely / maly / vyp – mění jen divák sám (Skeli 25. 11.)
  function tik() {
    var c = cas(), zbyva = c.at - c.now;
    odpocet.textContent = zbyva > 0 ? text(zbyva) : T.tLive;
    if (zbyva <= 120000) zavriShort();                                   // upoutávka končí 2 min předem (Skeli 25. 11.)
    platno.classList.toggle('bez-kdy', zbyva <= 120000);               // 2 min předem zmizí „Premiéra · datum“ (Skeli 25. 11.)
    if (zbyva > 0 && zbyva <= 20000) { scena.classList.add('priprav'); panDomu(); }
    if (zbyva > 0 && zbyva <= 7000) jeviste.classList.add('cernobile');   // s 5. obličejem (7 s) šedne i plátno s obličeji (Skeli 25. 11.)
    // 10,5 s předem ztrácí barvy celé okno (body.pm-sede jako zbytek webu – css/effects.css) až do 19:06; klip zůstává barevný
    if (zbyva > 0 && zbyva <= 10500) jeviste.classList.add('sede');   // od 10,5 s šedne sál a celé okno – černobílé dřív než 5. obličej (7 s)
    var sede = zbyva <= 10500 && zbyva > -360000;
    if (sede !== pmSede) { pmSede = sede; document.body.classList.toggle('pm-sede', sede); }
    if (window.PmZvuky) window.PmZvuky.tik(zbyva, c.now);
    skeliTik(zbyva);
    $('pmPopVlna').hidden = $('pmTlesk').hidden = !(zbyva <= OTEVRI_SAM && zbyva > 15000);   // vlna jde jen v 30 min odpočtu (server)
    var okno = zbyva <= 1560000 && zbyva > 300000 && !vyp.kviz;   // rezervované místo pro kvíz pod sálem
    if (okno !== kvizOkno) {
      kvizOkno = okno; sal.classList.toggle('kviz-okno', okno);
      if (!kviz) { if (okno) kvizCekani(); else { kvizBar.hidden = true; kvizBar.textContent = ''; kvizBar.style.minHeight = ''; kvizVyska = 0; } }
    }
    if (kvizOkno && !kviz) kvizCekaniText();                 // hudba odpočtu, hovor podle lidí, pozdrav v 18:56
    if (!pozdravVidet && zbyva <= 48000 && zbyva > 34000) { pozdravVidet = true; hlaska('🎙️ ' + (String(T.tProg || '').split('|')[2] || '')); }   // posledních 5 s barvy do černobílé   // vrstvu kamery připravit předem, jinak jízda na slabší grafice skočí
    if (zbyva > 0 && zbyva <= 15000) { najed(); if (window.PmZvuky) window.PmZvuky.finale(zbyva); }
    if (zbyva > 0 && zbyva <= 12000) finale7(zbyva);
    if (zbyva <= 0 && !jeviste.classList.contains('hraje')) pust();
    if (Date.now() >= dalsi) dotaz();
  }

  // ---------- TELEFON NA VÝŠKU: rozhlížení po sále prstem do stran (Skeli 25. 11.: na mobilu je vidět jen střed sálu) ----------
  // Svislé posouvání stránky zůstává (touch-action: pan-y v css). Po vstupu se sál jednou jemně sám rozhlédne (ať je vidět, že
  // to jde); od přípravy finále (20 s předem) se obraz plynule vrátí doprostřed – kamera najíždí na plátno.
  var panMq = window.matchMedia ? window.matchMedia('(orientation: portrait) and (max-width: 900px)') : null;
  var pan = 0, panTah = null, panAnim = 0;
  function panMez() { return Math.max(0, (scena.offsetWidth - jeviste.clientWidth) / 2); }
  function panNastav(x) { var m = panMez(); pan = Math.max(-m, Math.min(m, x)); scena.style.setProperty('--pan', pan.toFixed(1) + 'px'); }
  function panJed(cil, ms, hotovo) {                                 // plynulý posun (rozhlédnutí, návrat doprostřed)
    cancelAnimationFrame(panAnim);
    var od = pan, t0 = performance.now();
    (function krok(t) {
      var k = Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      panNastav(od + (cil - od) * e);
      if (k < 1) panAnim = requestAnimationFrame(krok); else if (hotovo) hotovo();
    })(t0);
  }
  function panSmi() { return panMq && panMq.matches && !scena.classList.contains('priprav') && !jeviste.classList.contains('fs'); }
  jeviste.addEventListener('pointerdown', function (e) {
    if (!panSmi() || e.pointerType === 'mouse' || e.target.closest('button, a, .pm-pop, .pm-chat')) return;
    cancelAnimationFrame(panAnim);
    panTah = { x: e.clientX, y: e.clientY, p: pan, tah: false };
  });
  jeviste.addEventListener('pointermove', function (e) {
    if (!panTah) return;
    var dx = e.clientX - panTah.x, dy = e.clientY - panTah.y;
    if (!panTah.tah && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) panTah.tah = true;
    if (panTah.tah) panNastav(panTah.p + dx);
  });
  ['pointerup', 'pointercancel'].forEach(function (u) { jeviste.addEventListener(u, function () { panTah = null; }); });
  function panUkazka() {                                             // jednou po vstupu: doleva, doprava, doprostřed
    if (!panSmi() || klid || slaby()) return;
    var m = panMez() * 0.6;
    setTimeout(function () { panJed(m, 1400, function () { panJed(-m, 2200, function () { panJed(0, 1300); }); }); }, 1800);
  }
  function panDomu() { if (pan && !panTah) panJed(0, 900); naklZpet(); }   // finále: zpátky doprostřed, bez náklonu

  // ---------- PC: sál se jemně natáčí za myší (jako ukázka v karaoke, Skeli 25. 11.) – rozhlížení po kině. Jedno otočení
  //            kolem osy kolmé na směr kurzoru (css rotate + mírné přiblížení, ať se neodkryjí okraje); max. jednou za snímek.
  //            Ne na slabém zařízení, při omezení pohybu a od přípravy finále (kamera najíždí na plátno). ----------
  var naklMq = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : null, naklRaf = 0, naklXY = null;
  function naklZpet() { naklXY = null; scena.classList.remove('naklon'); }
  jeviste.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || !naklMq || !naklMq.matches || klid || slaby() || vyp.efekty) return;
    if (scena.classList.contains('priprav') || jeviste.classList.contains('hraje')) { naklZpet(); return; }
    var r = jeviste.getBoundingClientRect();
    naklXY = [(e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5];
    if (naklRaf) return;
    naklRaf = requestAnimationFrame(function () {
      naklRaf = 0;
      if (!naklXY) return;
      var x = naklXY[0], y = naklXY[1], uhel = Math.min(1, Math.sqrt(x * x + y * y) * 2) * 3.2;   // nejvýš ~3°
      scena.style.setProperty('--osa', (-y).toFixed(3) + ' ' + x.toFixed(3) + ' 0');
      scena.style.setProperty('--uhel', uhel.toFixed(2) + 'deg');
      scena.style.setProperty('--lx', (-x * 4.6).toFixed(2) + '%');   // pohled se posune ke kurzoru (odkryje se ta strana)
      scena.style.setProperty('--ly', (-y * 3).toFixed(2) + '%');      // svisle míň: střed přiblížení je v 30 % výšky (nahoře rezervy méně)
      scena.classList.add('naklon');
    });
  });
  jeviste.addEventListener('pointerleave', naklZpet);

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
    hl.appendChild($('pmZvuk')); hl.appendChild($('pmKonec')); hl.appendChild($('pmYtOdkaz'));
    if (window.skeliUpoutavkyZavri) window.skeliUpoutavkyZavri();
    postavSal();
    panUkazka();
    try { sessionStorage.setItem('pmSal', '1'); } catch (e) { /* nevadí */ }
    dalsi = 0; spust();
    zvukSal(!sam || cas().zvuk);                                   // zvuk sálu jen po ťuknutí (jinak tlačítko 🔊)
    if (!sam) {                                                    // po ťuknutí: sál nahoru pod hlavičku
      var hh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
      window.scrollTo({ top: Math.max(0, sal.getBoundingClientRect().top + window.scrollY - hh - 8), behavior: 'smooth' });
    }
  }
  // před prvním vstupem okénko „Kdo si dnes sedne do sálu?“ (ťuknutí na postavu = vstup i se zvukem); Esc / zavřít = vstup bez volby
  var kdo = $('pmKdo'), kdoVstup = false;
  // pomalý mobilní signál: silueta, která se nenačte, se schová (dlaždice zůstane s nápisem, bez ikonky rozbitého obrázku)
  kdo.querySelectorAll('img').forEach(function (im) {
    var pryc = function () { im.hidden = true; };
    im.addEventListener('error', pryc);
    if (im.complete && !im.naturalWidth && im.getAttribute('src')) im.addEventListener('load', function () { im.hidden = false; });
  });
  function kdoOtevri(proVstup) {
    if (!kdo.showModal) { if (proVstup) vstup(false); return; }    // starý prohlížeč: bez otázky
    kdoVstup = proVstup;
    kdo.querySelectorAll('[data-postava]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.postava === postava)); });
    kdo.showModal();
  }
  kdo.querySelectorAll('[data-postava]').forEach(function (b) {
    b.addEventListener('click', function () {
      postava = b.dataset.postava;
      try { localStorage.setItem('pmPostava', postava); } catch (e) { /* jen teď */ }
      mojePostava(); kdo.close();
    });
  });
  kdo.addEventListener('close', function () { if (kdoVstup && !vSale) vstup(false); kdoVstup = false; });
  $('pmKdoZmen').addEventListener('click', function () { kdoOtevri(false); });
  $('pmJsemTu').addEventListener('click', function () { if (postava) vstup(false); else kdoOtevri(true); });   // premiera.js k tomu odemkne zvuk
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
  // Skeli 25. 11.: při vstupu musí zvuk hrát bez dalšího klikání. Ťuknutí na Vstoupit (nebo na volbu postavy) zvuk zapne
  // vždycky (i když byl dřív na webu vypnutý). Když se sál otevře sám (od 18:30, po obnovení stránky), prohlížeč zvuk bez
  // ťuknutí nepustí – naskočí při prvním ťuknutí kamkoli (jen když ho člověk dřív sám nevypnul).
  function zvukSal(gesto) {
    var Z = window.PmZvuky;
    if (Z && gesto) { if (Z.zapni(cas().at - cas().now) && window.skeliPmZvukPovolen) window.skeliPmZvukPovolen(); }
    else if (Z && !Z.bezi() && !Z.vypnuto()) zvukPrvniTuk();
    zvukKresli();
  }
  function zvukPrvniTuk() {
    var UDALOSTI = ['pointerup', 'keydown', 'click'];
    var odeber = function () { UDALOSTI.forEach(function (u) { document.removeEventListener(u, pust, true); }); };
    var pust = function (e) {
      odeber();
      if (e.target && e.target.closest && e.target.closest('#pmZvukSal')) return;   // ťuknutí na 🔊 si poradí samo
      var Z = window.PmZvuky;
      if (Z && !Z.bezi() && !Z.vypnuto() && Z.start(cas().at - cas().now) && window.skeliPmZvukPovolen) window.skeliPmZvukPovolen();
      zvukKresli();
    };
    UDALOSTI.forEach(function (u) { document.addEventListener(u, pust, true); });
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
    var popis = on ? T.tSmaller : T.tBigger;                       // jen ikona, text jako nápověda (Skeli 25. 11.)
    velkyBtn.querySelector('i').className = 'fa-solid ' + (on ? 'fa-down-left-and-up-right-to-center' : 'fa-up-right-and-down-left-from-center');
    velkyBtn.setAttribute('aria-label', popis); velkyBtn.title = popis;
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
  // Celý / Malý je jedno tlačítko (Skeli 25. 11.): ťuknutí přepne velikost, z „Vyp“ vrátí poslední velikost
  var fsVel = prepinac.querySelector('[data-rezim="vel"]'), fsPosledni = 'maly';
  function fsRezim(r) {
    if (r !== 'cely' && r !== 'maly' && r !== 'vyp') r = 'maly';
    if (r !== 'vyp') fsPosledni = r;
    jeviste.classList.remove('fs-cely', 'fs-maly', 'fs-vyp'); jeviste.classList.add('fs-' + r);
    prepinac.querySelectorAll('button').forEach(function (b) {
      var on = b === fsVel ? r !== 'vyp' : b.dataset.rezim === r;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    });
    fsVel.querySelector('span').textContent = fsPosledni === 'cely' ? fsVel.dataset.cely : fsVel.dataset.maly;
    if (r !== 'vyp') { nepreceteno = 0; $('pmFsNove').textContent = ''; }
    try { localStorage.setItem('pmFsRezim', r); } catch (e) { /* nevadí */ }
  }
  prepinac.querySelectorAll('button').forEach(function (b) {
    b.addEventListener('click', function () {
      if (b !== fsVel) fsRezim(b.dataset.rezim);
      else fsRezim(jeviste.classList.contains('fs-cely') ? 'maly' : jeviste.classList.contains('fs-maly') ? 'cely' : fsPosledni);
    });
  });
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
    var schovany = sal.classList.contains('chat-pryc') && window.matchMedia('(min-width: 1200px)').matches;
    if (!jeviste.classList.contains('fs-vyp') && !schovany) return;
    nepreceteno++; $('pmFsNove').textContent = $('pmChatNove').textContent = nepreceteno > 9 ? '9+' : nepreceteno;
  }

  // ---------- CHAT PŘES SÁL (PC od 1200 px, Skeli 25. 11. varianta B; css/premiera.css na konci): chat je sklo v pravé části
  //            obrazu. Sám se nikdy neschová (Skeli 25. 11.) – jen divák tlačítkem Chat (schovat / vrátit), volba se pamatuje. ----------
  function chatPresSal() {
    return !!chatEl && chatEl.parentNode === chatDomov && !sal.classList.contains('chat-pryc') && getComputedStyle(chatEl).position === 'absolute';
  }
  function chatPrycKresli() {
    sal.classList.toggle('chat-pryc', chatRezim === 'vyp');
    sal.classList.toggle('chat-maly', chatRezim === 'maly');
    chatEl.querySelectorAll('.pm-chat-rezim button[data-rezim]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.rezim === chatRezim)); });
    var vel = chatEl.querySelector('.pm-chat-vel');   // jedno tlačítko velký / malý: popisek = co ťuknutí udělá
    if (vel) { var co = chatRezim === 'maly' ? vel.dataset.cely : vel.dataset.maly; vel.title = co; vel.setAttribute('aria-label', co); }
    if (chatRezim !== 'vyp') { nepreceteno = 0; $('pmFsNove').textContent = $('pmChatNove').textContent = ''; }
  }
  function chatNastav(r) {
    chatRezim = r; chatPrycKresli();
    try { localStorage.setItem('pmChatRezim', r); } catch (e) { /* jen teď */ }
  }
  try {
    chatRezim = localStorage.getItem('pmChatRezim') || (localStorage.getItem('pmChatSkryty') === '1' ? 'vyp' : 'cely');
  } catch (e) { /* velký */ }
  if (!/^(cely|maly|vyp)$/.test(chatRezim)) chatRezim = 'cely';
  chatPrycKresli();
  chatEl.querySelectorAll('.pm-chat-rezim button[data-rezim]').forEach(function (b) { b.addEventListener('click', function () { chatNastav(b.dataset.rezim); }); });
  chatEl.querySelector('.pm-chat-vel').addEventListener('click', function () { chatNastav(chatRezim === 'cely' ? 'maly' : 'cely'); });
  $('pmChatTl').addEventListener('click', function () { chatNastav('cely'); });   // skrytý chat zpět

  // ---------- celá obrazovka: PC a Android celý sál; iPhone stránku na celou obrazovku nepustí – tam aspoň klip ----------
  $('pmCeloVen').addEventListener('click', function () { $('pmCelo').click(); });   // tlačítko pod sálem (v sále jen k návratu)
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

  // ---------- ZKOUŠKA (jen simulace ?pmSim – server ji pustí jen na testu a lokálně). Texty jen česky schválně: panel vidí
  //            jen Skeli při zkoušce. Posuvník času projede celý večer 18:30 → start klipu (Skeli 25. 11.: „hledat chyby“):
  //            posune start premiéry (server dostává simAt, takže kvíz, vlna i Skeliho pozdrav jedou podle něj), sál vrátí
  //            jednorázové věci (finále, kvíz, zvuky) a zbytek si dopočítá jako divák, který přišel v tu chvíli. Když už běží
  //            klip a jde se zpátky, stránka se znovu načte od nového času (volby panelu zůstanou v adrese).
  //            Diváci: ruční počet, plný sál, nebo příchody jako na premiéře (podle času); smyšlení diváci hlasují v kvízu
  //            (server, jen simulace – stejně jako na premiéře se pak ukážou procenta a Kevin). ----------
  function zkouskaReset() {
    finaleCasy.forEach(clearTimeout); finaleCasy = [];
    najeto = false; finale = false; pozdravVidet = false;
    scena.classList.remove('priprav', 'jede', 'tma'); scena.style.removeProperty('--zoom'); scena.style.removeProperty('--ty');
    jeviste.classList.remove('cernobile', 'sede', 'klid');
    platno.classList.remove('v-finale', 'ma-logo', 'tep', 'ma-kviz');
    document.querySelectorAll('#pmSalTvare .pm-tvar').forEach(function (t) { t.classList.remove('on'); });
    kviz = null; kvizBylo = false; kvizDalsi = 0; kvizVyska = 0; kvizOkno = false;
    sal.classList.remove('kviz-okno'); kvizEl.textContent = ''; kvizBar.textContent = ''; kvizBar.hidden = true; kvizBar.style.minHeight = '';
    kevinEl.hidden = true;
    dalsi = 0;                                                     // hned se zeptat serveru (kvíz podle nového času)
  }
  if (song === 'sim') (function () {
    var q = new URLSearchParams(location.search);
    var cis = function (k, d) { var x = parseInt(q.get(k), 10); return isNaN(x) ? d : x; };
    var SKOKY = [['18:30 otevření', -1800], ['18:35 kvíz', -1505], ['18:53 vážné otázky', -425], ['18:58:50 pozdrav', -70],
      ['18:59:40 finále', -20], ['19:00 klip', -4]];
    var p = document.createElement('div'); p.className = 'pm-zkouska';
    p.innerHTML = '<b>🧪 Zkouška</b><button type="button" data-a="sbal" aria-expanded="true">Schovat</button><button type="button" data-a="zvuk">🔇 Zapnout zvuk</button>'
      + '<div class="pm-zk-telo">'
      + '<label class="pm-zk-cas">Čas <output data-o="cas">–</output><input type="range" data-a="cas" min="-1800" max="15" step="1"></label>'
      + '<div class="pm-zk-skoky">' + SKOKY.map(function (s) { return '<button type="button" data-skok="' + s[1] + '">' + s[0] + '</button>'; }).join('') + '</div>'
      + '<label>Lidí v sále <output data-o="lidi">–</output><input type="range" data-a="lidi" min="1" max="45"></label>'
      + '<button type="button" data-a="plny">🎟️ Plný sál</button><button type="button" data-a="polo">Poloprázdný</button>'
      + '<label><input type="checkbox" data-a="prichody"> Přicházejí jako na premiéře</label>'
      + '<label><input type="checkbox" data-a="hlasy"> Diváci hlasují v kvízu</label>'
      + '<label><input type="checkbox" data-a="smajl"> Publikum posílá smajlíky</label>'
      + '<label><input type="checkbox" data-a="pise"> Publikum píše do chatu</label>'
      + '<span class="pm-zk-vyp">Nouzové vypínače (jako v adminu): '
      + ['chat|Chat', 'reakce|Smajlíci', 'efekty|Efekty', 'kviz|Kvíz'].map(function (x) { x = x.split('|'); return '<label><input type="checkbox" data-vyp="' + x[0] + '"> ' + x[1] + ' vyp.</label>'; }).join('')
      + '</span>'
      + '<button type="button" data-a="vlna">🌊 Vlna teď</button>'
      + '<label><input type="checkbox" data-a="skeli"> Skeli je v sále</label></div>';
    document.body.appendChild(p);
    var el = function (a) { return p.querySelector('[data-a=' + a + ']'); };
    var casR = el('cas'), casO = p.querySelector('[data-o=cas]'), lidiR = el('lidi'), lidiO = p.querySelector('[data-o=lidi]');
    var prichody = el('prichody'), hlasy = el('hlasy'), smajl = el('smajl'), skeliCh = el('skeli');
    // volby z adresy (po znovunačtení zůstanou); výchozí: plný sál, příchody jako na premiéře, diváci hlasují, Skeli v sále
    lidiR.value = cis('pmLidi', 45); prichody.checked = cis('pmPrichody', 1) === 1; hlasy.checked = cis('pmHlasy', 1) === 1;
    smajl.checked = cis('pmSmajl', 1) === 1; skeliCh.checked = cis('pmSkeli', 1) === 1;
    var pise = el('pise'); pise.checked = cis('pmPise', 1) === 1;
    zkouskaSkeli = skeliCh.checked;
    var sbal = el('sbal');
    sbal.addEventListener('click', function () {
      var on = p.classList.toggle('sbaleno');
      sbal.textContent = on ? 'Ukázat' : 'Schovat'; sbal.setAttribute('aria-expanded', String(!on));
    });

    function sekund() { var c = cas(); return Math.round((c.now - c.at) / 1000); }   // od startu klipu (před startem záporné)
    function popis(sek) {
      var t = 19 * 3600 + sek, h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, x = ((t % 60) + 60) % 60;
      return h + ':' + dva(m) + ':' + dva(x) + (sek < 0 ? ' · za ' + text(-sek * 1000) : ' · klip');
    }
    // diváci: ruční počet, nebo podle času jako na premiéře (v 18:30 asi pětina, od 18:50 celý počet z posuvníku)
    function pocetLidi() {
      var cil = +lidiR.value;
      if (!prichody.checked) return cil;
      var k = Math.max(0, Math.min(1, (sekund() + 1800) / 1200));
      return Math.max(1, Math.round(cil * (0.2 + 0.8 * k)));
    }
    function obnovLidi() {
      var n = pocetLidi();
      lidiO.textContent = prichody.checked ? n + ' / ' + lidiR.value : lidiR.value;
      zkouskaHlasy = hlasy.checked ? Math.max(0, n - 1) : 0;    // hlasují všichni kromě tebe (ty ťukáš sám)
      if (n !== zkouskaLidi) { zkouskaLidi = n; ukazLidi(n); }
    }
    function adresa(sek) {                                         // volby panelu do adresy (pro znovunačtení)
      q.set('pmSim', String(-sek)); q.set('pmLidi', lidiR.value); q.set('pmPrichody', prichody.checked ? '1' : '0');
      q.set('pmHlasy', hlasy.checked ? '1' : '0'); q.set('pmSmajl', smajl.checked ? '1' : '0'); q.set('pmSkeli', skeliCh.checked ? '1' : '0'); q.set('pmPise', pise.checked ? '1' : '0');
      return location.pathname + '?' + q.toString();
    }
    function skoc(sek) {
      if (!window.skeliPmSimPosun || !window.skeliPmSimPosun(-sek * 1000)) { location.href = adresa(sek); return; }   // klip už běží
      zkouskaReset();
      if (window.PmZvuky && window.PmZvuky.skok) window.PmZvuky.skok(-sek * 1000);
      zavriShort();
      obnovLidi(); tik();
      try { history.replaceState(null, '', adresa(sek)); } catch (e) { /* nevadí */ }
    }
    var tahne = false;
    casR.addEventListener('input', function () { tahne = true; casO.textContent = popis(+casR.value); });
    casR.addEventListener('change', function () { tahne = false; skoc(+casR.value); });
    p.querySelectorAll('[data-skok]').forEach(function (b) { b.addEventListener('click', function () { skoc(+b.dataset.skok); }); });
    lidiR.addEventListener('input', obnovLidi);
    prichody.addEventListener('change', obnovLidi);
    hlasy.addEventListener('change', obnovLidi);
    el('plny').addEventListener('click', function () { lidiR.value = 45; obnovLidi(); });
    el('polo').addEventListener('click', function () { lidiR.value = 20; obnovLidi(); });
    // nouzové vypínače jen v tomhle prohlížeči (skutečné jsou v adminu → píseň → Premiéra) – nic se neukládá
    p.querySelectorAll('[data-vyp]').forEach(function (ch) {
      ch.addEventListener('change', function () { zkouskaVyp[ch.dataset.vyp] = ch.checked; dalsi = 0; dotaz(); });
    });
    // zvuk: stejné jako 🔊 v sále (po znovunačtení stránky ho prohlížeč pustí až po ťuknutí)
    var zvukB = el('zvuk');
    function zvukText() { var Z = window.PmZvuky; zvukB.textContent = Z && Z.bezi() ? '🔊 Zvuk hraje' : '🔇 Zapnout zvuk'; }
    zvukB.addEventListener('click', function () { $('pmZvukSal').click(); zvukText(); });
    skeliCh.addEventListener('change', function () { zkouskaSkeli = skeliCh.checked; skeliVSale = zkouskaSkeli; ukazLidi(zkouskaLidi); });
    el('vlna').addEventListener('click', vlna);
    function kazdouVterinu() {
      if (document.hidden) return;
      if (!tahne) { var s = sekund(); casR.value = s; casO.textContent = popis(s); }
      obnovLidi(); zvukText();
    }
    kazdouVterinu(); setInterval(kazdouVterinu, 1000);
    // smyšlený chat jako v ukázkách: jen v tomhle prohlížeči (nikam se neposílá ani neukládá), věty podle části večera
    var LIDE = ['Andy', 'Kuba_77', 'Terka', 'MiraZ', 'skeloFan', 'Lucka', 'Ondra', 'Petr', 'Bára', 'Dominik'];
    var VETY = [
      [-1505, ['čau všichni 👋', 'zdravím z Brna!', 'už se těšim 🔥', 'jsem tu včas haha', 'kdy to začne?', 'ta upoutávka byla síla', 'čekám od 18:30 😅', 'dobrej sál xD', 'Skeli boss 😎']],
      [-300, ['to jsem nevěděl', 'jasně že B', 'ten kvíz je dobrej', 'trefil jsem to 😎', 'Kevin zase rýpe xD', 'tohle je vážný téma', 'kolik vás to dalo?', 'netrefil jsem ani jednu 😂']],
      [0, ['už to bude!!', '❤️❤️❤️', 'husí kůže', 'SKELO SQUAD 🔥', 'mám mráz po zádech', 'ticho, začíná to', 'díky za pozdrav ❤️']],
      [1e9, ['🔥🔥🔥', 'to je síla', 'ten text…', 'mrazí mě', 'top klip', 'tohle sdílím', '❤️']]];
    setInterval(function () {
      if (!pise.checked || document.hidden || !vSale || vyp.chat) return;
      if (Math.random() > Math.min(0.85, (zkouskaLidi || 1) / 30)) return;
      var s = sekund(), vety = VETY.filter(function (x) { return s < x[0]; })[0][1];
      var el2 = document.createElement('div'); el2.className = 'pm-zp';
      telo({ jmeno: LIDE[Math.floor(Math.random() * LIDE.length)], text: vety[Math.floor(Math.random() * vety.length)], cas: Date.now() }, el2);
      zpravy.insertBefore(el2, zpravy.firstChild); fsNovaZprava(); prazdno();
      while (zpravy.children.length > 120) zpravy.lastChild.remove();
    }, 2000);
    setInterval(function () {
      if (!smajl.checked || document.hidden || !vSale) return;
      if (Math.random() < Math.min(0.9, (zkouskaLidi || 1) / 15)) vypust(SMAJL[Math.floor(Math.random() * SMAJL.length)], false);
    }, 500);
  })();
})();
