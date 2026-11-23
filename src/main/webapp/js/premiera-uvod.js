// Premiéra na hlavní stránce (index.jsp, #pmUvod).
//  • víc než 30 min předem: nic, na úvodu je jen karta s odpočtem (js/premiere.js)
//  • 30 min předem: PROMĚNA – z webu se vysají barvy (body.pm-sede), jméno a tlačítka zmizí a místo nich se nakreslí
//    ulice jako stavební výkres (čáry z img/premiera/ulice-cary.json, vytažené z fotky nástrojem cary.py)
//  • čekárna: kdo ťukne „Jsem tu“, dostane jiskru. Kudy s ní jede, čáry se rozžhaví a pod výkresem se odkryje skutečná
//    černobílá ulice – lidé ji společně „staví“ (postaveno X %). Odkryté místo pomalu bledne, stavba potřebuje lidi.
//  • posledních 10 s: jiskry letí do úběžníku, ulice se dostaví vlnou od úběžníku, uprostřed rámeček; 7 smajlíků
//    na tep srdce (zvuky z js/squad-egg.js), rámeček pulzuje, šepot SKELO SQUAD, ve 0 záblesk a klip
//  • po konci klipu se barvy webu vrátí
// Simulace (?pmSim=sekund do startu, jen localhost a test): panel s posouváním času a simulovaní lidé.
// Výkon: čáry se kreslí jen jednou, každý snímek jen jiskry a žhnoucí čáry, fotka se překreslí max. 8× za s;
// ve skryté záložce stojí všechno; na slabém telefonu (html.low-fx) bez záře a s menším rozlišením.
(function () {
  var box = document.getElementById('pmUvod');
  if (!box || box.dataset.on) return;
  box.dataset.on = '1';
  var hero = box.closest('.hero'), body = document.body;
  var SIM = box.dataset.sim === '1', ZNOVU = box.dataset.znovu === '1';
  // hodiny: ostrá premiéra = čas serveru; přehrání po premiéře (ZNOVU) a simulace = vlastní čas, jde zrychlit a přeskočit
  var at = +box.dataset.at, vBase = +box.dataset.now, rBase = Date.now(), rychlost = 1;
  var now = function () { return vBase + (Date.now() - rBase) * rychlost; };
  function nastavCas(zbyvaMs, r) { vBase = at - zbyvaMs; rBase = Date.now(); if (r) rychlost = r; }
  function zrychli(r) { vBase = now(); rBase = Date.now(); rychlost = r; }
  var PRED = 30 * 60 * 1000, LIVE_MS = 15 * 60 * 1000, FINALE = 10000;
  var q = function (s) { return box.querySelector(s); };
  var slaby = function () { return document.documentElement.classList.contains('low-fx'); };
  var lang = document.documentElement.lang || 'cs';
  var PR = window.Intl && Intl.PluralRules ? new Intl.PluralRules(lang) : null;
  function lide(n) {
    var f = PR ? PR.select(n) : (n === 1 ? 'one' : 'other');
    var t = box.dataset['tLide' + f.charAt(0).toUpperCase() + f.slice(1)] || box.dataset.tLideOther;
    return t.replace('{n}', window.Intl ? new Intl.NumberFormat(lang).format(n) : n);
  }

  // ---------------------------------------------------------------- plátna a měřítko
  var cFoto = q('.pmu-foto'), cCary = q('.pmu-cary'), cSvetlo = q('.pmu-svetlo'), scena = q('.pmu-scena');
  var xf = cFoto.getContext('2d'), xc = cCary.getContext('2d'), xs = cSvetlo.getContext('2d');
  var D = null, W = 0, H = 0, DPR = 1, k = 1, ox = 0, oy = 0;
  var foto = new Image();
  // výška okna = zbytek obrazovky pod hlavičkou (změřeno, hlavička má na PC i telefonu jinou výšku)
  function vyska() { hero.style.setProperty('--pm-h', Math.round(window.innerHeight - (hero.getBoundingClientRect().top + window.scrollY) - 12) + 'px'); }
  function rozmer() {
    DPR = Math.min(slaby() ? 1 : 2, window.devicePixelRatio || 1);
    W = scena.clientWidth; H = scena.clientHeight;
    [cFoto, cCary, cSvetlo].forEach(function (c) { c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); });
    if (!D) return;
    if (W < H) {   // telefon na výšku: pás výkresu přes ~48 % šířky fotky (levý dům a úběžník), nahoře místo na název
      k = W / (D.w * 0.48);
      ox = Math.min(0, Math.max(W - D.w * k, W / 2 - D.w * k * 0.40));
      oy = Math.min(H * 0.30, Math.max(110, (H - D.h * k) * 0.32));
    } else {        // na šířku a PC: výkres přes celou scénu
      k = Math.max(W / D.w, H / D.h);
      ox = (W - D.w * k) / 2; oy = (H - D.h * k) / 2;
    }
  }
  var X = function (x) { return (ox + x * k) * DPR; }, Y = function (y) { return (oy + y * k) * DPR; };

  // ---------------------------------------------------------------- výkres (čáry)
  var segs = [], heat = null, horke = new Set(), MRIZ = 40, mriz = new Map(), kroky = [], hotovo = new Map();
  function pripravit() {
    var vx = D.vp[0], vy = D.vp[1];
    D.kostra.slice(0, 40).forEach(function (c, i) {   // konstrukční paprsky z úběžníku
      var far = Math.hypot(c[0] - vx, c[1] - vy) > Math.hypot(c[2] - vx, c[3] - vy) ? [c[0], c[1]] : [c[2], c[3]];
      var dx = far[0] - vx, dy = far[1] - vy;
      if (Math.abs(dy / (dx || 1)) < 1.3) kroky.push({ typ: 'paprsek', b: [vx, vy, vx + dx * 1.25, vy + dy * 1.25], zp: i * 0.006 });
    });
    D.kostra.forEach(function (c, i) {                // hlavní linky s přesahem jako tužkou
      var dx = (c[2] - c[0]) * .06, dy = (c[3] - c[1]) * .06;
      kroky.push({ typ: 'kostra', b: [c[0] - dx, c[1] - dy, c[2] + dx, c[3] + dy], zp: 0.22 + i * 0.0045 });
      segs.push([c[0], c[1], c[2], c[3], 1]);
    });
    D.detail.forEach(function (p, i) {                // obrysy
      kroky.push({ typ: 'detail', p: p, zp: 0.55 + i * 0.0011 });
      for (var j = 0; j + 3 < p.length; j += 2) segs.push([p[j], p[j + 1], p[j + 2], p[j + 3], 0]);
    });
    heat = new Float32Array(segs.length);
    segs.forEach(function (s, i) {
      var a0 = Math.floor(Math.min(s[0], s[2]) / MRIZ), a1 = Math.floor(Math.max(s[0], s[2]) / MRIZ);
      var b0 = Math.floor(Math.min(s[1], s[3]) / MRIZ), b1 = Math.floor(Math.max(s[1], s[3]) / MRIZ);
      for (var a = a0; a <= a1; a++) for (var b = b0; b <= b1; b++) { var key = a + ',' + b; if (!mriz.has(key)) mriz.set(key, []); mriz.get(key).push(i); }
    });
  }
  function papir() {
    xc.clearRect(0, 0, cCary.width, cCary.height);
    var krok = 24 * DPR; xc.lineWidth = 1;
    for (var x = 0, i = 0; x < cCary.width; x += krok, i++) { xc.strokeStyle = i % 5 ? 'rgba(150,170,200,.045)' : 'rgba(150,170,200,.09)'; xc.beginPath(); xc.moveTo(x + .5, 0); xc.lineTo(x + .5, cCary.height); xc.stroke(); }
    for (var y = 0, j = 0; y < cCary.height; y += krok, j++) { xc.strokeStyle = j % 5 ? 'rgba(150,170,200,.045)' : 'rgba(150,170,200,.09)'; xc.beginPath(); xc.moveTo(0, y + .5); xc.lineTo(cCary.width, y + .5); xc.stroke(); }
  }
  function styl(typ) {
    xc.setLineDash(typ === 'paprsek' ? [6 * DPR, 6 * DPR] : []);
    xc.strokeStyle = typ === 'paprsek' ? 'rgba(200,210,230,.16)' : typ === 'kostra' ? 'rgba(235,238,245,.85)' : 'rgba(220,225,235,.6)';
    xc.lineWidth = (typ === 'kostra' ? 1.1 : .9) * DPR;
  }
  function kresliKrok(kr, t) {
    var h0 = hotovo.get(kr) || 0; if (t <= h0) return;
    styl(kr.typ); xc.beginPath();
    if (kr.b) {
      var b = kr.b;
      xc.moveTo(X(b[0] + (b[2] - b[0]) * h0), Y(b[1] + (b[3] - b[1]) * h0)); xc.lineTo(X(b[0] + (b[2] - b[0]) * t), Y(b[1] + (b[3] - b[1]) * t));
    } else {
      var p = kr.p, n = p.length / 2 - 1, a = Math.floor(h0 * n);
      xc.moveTo(X(p[a * 2]), Y(p[a * 2 + 1]));
      for (var j = a + 1; j <= Math.ceil(t * n) && j <= n; j++) xc.lineTo(X(p[j * 2]), Y(p[j * 2 + 1]));
    }
    xc.stroke(); hotovo.set(kr, t);
  }
  function kota(x1, y1, x2, y2, txt, svisle) {
    xc.setLineDash([]); xc.strokeStyle = 'rgba(200,210,230,.4)'; xc.fillStyle = 'rgba(210,220,235,.65)'; xc.lineWidth = .8 * DPR;
    var t = 5 * DPR; xc.beginPath(); xc.moveTo(X(x1), Y(y1)); xc.lineTo(X(x2), Y(y2));
    if (svisle) { xc.moveTo(X(x1) - t, Y(y1)); xc.lineTo(X(x1) + t, Y(y1)); xc.moveTo(X(x2) - t, Y(y2)); xc.lineTo(X(x2) + t, Y(y2)); }
    else { xc.moveTo(X(x1), Y(y1) - t); xc.lineTo(X(x1), Y(y1) + t); xc.moveTo(X(x2), Y(y2) - t); xc.lineTo(X(x2), Y(y2) + t); }
    xc.stroke(); xc.font = (9 * DPR) + 'px "Exo 2", sans-serif'; xc.textAlign = 'center';
    if (svisle) { xc.save(); xc.translate(X(x1) - 6 * DPR, (Y(y1) + Y(y2)) / 2); xc.rotate(-Math.PI / 2); xc.fillText(txt, 0, 0); xc.restore(); }
    else xc.fillText(txt, (X(x1) + X(x2)) / 2, Y(y1) - 5 * DPR);
    xc.textAlign = 'left';
  }
  function popisky() {
    var vx = D.vp[0], vy = D.vp[1];
    xc.setLineDash([]); xc.strokeStyle = 'rgba(235,238,245,.5)'; xc.lineWidth = DPR;
    xc.beginPath(); xc.arc(X(vx), Y(vy), 7 * DPR, 0, 7); xc.moveTo(X(vx) - 14 * DPR, Y(vy)); xc.lineTo(X(vx) + 14 * DPR, Y(vy));
    xc.moveTo(X(vx), Y(vy) - 14 * DPR); xc.lineTo(X(vx), Y(vy) + 14 * DPR); xc.stroke();
    kota(1680, 133, 1787, 133, '1 200'); kota(549, 192, 549, 280, '1 650', true);
  }
  // celý výkres se nakreslí za `ms` (proměna ~7 s, při načtení stránky v čekárně ~2,5 s)
  var stavbaRaf = 0;
  function nakreslit(ms) {
    cancelAnimationFrame(stavbaRaf); hotovo.clear(); papir();
    if (!ms || slaby() && ms < 4000) { kroky.forEach(function (kr) { kresliKrok(kr, 1); }); popisky(); return; }
    var t0 = performance.now();
    (function krok(ts) {
      var t = (ts - t0) / ms, vse = true;
      for (var i = 0; i < kroky.length; i++) {
        var kr = kroky[i], p = Math.max(0, Math.min(1, (t - kr.zp) / 0.06));
        if (p > 0) kresliKrok(kr, p);
        if (p < 1) vse = false;
      }
      if (vse) popisky(); else stavbaRaf = requestAnimationFrame(krok);
    })(t0);
  }

  // ---------------------------------------------------------------- skutečná ulice pod výkresem (maska „postaveno“)
  var MW = 240, MH = 103, maska = new Float32Array(MW * MH), mCan = document.createElement('canvas');
  mCan.width = MW; mCan.height = MH;
  var mx = mCan.getContext('2d'), mImg = mx.createImageData(MW, MH), maskaZmena = true, posledniFoto = 0;
  function odkryj(x, y, sila, r) {          // x, y v pixelech fotky
    var cx = x / 8, cy = y / 8; r = r || 7;
    for (var j = Math.max(0, Math.floor(cy - r)); j <= Math.min(MH - 1, Math.ceil(cy + r)); j++)
      for (var i = Math.max(0, Math.floor(cx - r)); i <= Math.min(MW - 1, Math.ceil(cx + r)); i++) {
        var d = ((i - cx) * (i - cx) + (j - cy) * (j - cy)) / (r * r); if (d >= 1) continue;
        var n = j * MW + i; maska[n] = Math.min(1, maska[n] + sila * (1 - d));
      }
    maskaZmena = true;
  }
  function postaveno() { var s = 0; for (var i = 0; i < maska.length; i += 4) s += maska[i]; return s / (maska.length / 4); }
  function kresliFoto(ts) {
    if (!maskaZmena || !foto.complete || ts - posledniFoto < (slaby() ? 250 : 120)) return;
    posledniFoto = ts; maskaZmena = false;
    for (var i = 0; i < maska.length; i++) { var a = Math.min(1, maska[i] * 1.15); mImg.data[i * 4 + 3] = a * a * 255; }
    mx.putImageData(mImg, 0, 0);
    xf.clearRect(0, 0, cFoto.width, cFoto.height);
    xf.globalCompositeOperation = 'source-over'; xf.imageSmoothingEnabled = true;
    xf.drawImage(mCan, X(0), Y(0), D.w * k * DPR, D.h * k * DPR);
    xf.globalCompositeOperation = 'source-in';
    xf.drawImage(foto, X(0), Y(0), D.w * k * DPR, D.h * k * DPR);
    xf.globalCompositeOperation = 'source-over';
  }

  // ---------------------------------------------------------------- jiskry
  var BARVY = [[255, 170, 80], [255, 90, 70], [120, 200, 255], [255, 220, 110], [190, 130, 255], [110, 240, 170], [255, 120, 200]];
  var ja = { x: 0, y: 0, tx: 0, ty: 0, aktivni: false, barva: BARVY[Math.floor(Math.random() * BARVY.length)] };
  var ostatni = [], tahne = null;   // tahne = [x, y] bod, kam letí všechny jiskry (finále: úběžník)
  function simLide(n) {
    ostatni = [];
    for (var i = 0; i < n; i++) ostatni.push({ x: 100 + Math.random() * (D.w - 200), y: 150 + Math.random() * (D.h - 260), a: Math.random() * 7, v: .5 + Math.random() * .6, barva: BARVY[i % BARVY.length] });
  }
  function nahrej(x, y, sila) {
    var R = 46, R2 = R * R;
    for (var a = Math.floor((x - R) / MRIZ); a <= Math.floor((x + R) / MRIZ); a++)
      for (var b = Math.floor((y - R) / MRIZ); b <= Math.floor((y + R) / MRIZ); b++) {
        var l = mriz.get(a + ',' + b); if (!l) continue;
        for (var n = 0; n < l.length; n++) {
          var i = l[n], s = segs[i], d2 = Math.pow((s[0] + s[2]) / 2 - x, 2) + Math.pow((s[1] + s[3]) / 2 - y, 2);
          if (d2 > R2) continue;
          var h = sila * (1 - d2 / R2); if (h > heat[i]) { heat[i] = Math.min(1, h); horke.add(i); }
        }
      }
  }
  function jiskra(x, y, c, r) {
    var g = xs.createRadialGradient(X(x), Y(y), 0, X(x), Y(y), r * DPR);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(' + c + ',.9)'); g.addColorStop(1, 'rgba(' + c + ',0)');
    xs.fillStyle = g; xs.beginPath(); xs.arc(X(x), Y(y), r * DPR, 0, 7); xs.fill();
  }
  var raf = 0, posl = 0, posledniStav = 0;
  function snimek(ts) {
    raf = requestAnimationFrame(snimek);
    var dt = Math.min(50, ts - (posl || ts)); posl = ts;
    xs.clearRect(0, 0, cSvetlo.width, cSvetlo.height);
    if (ja.aktivni) {
      if (tahne) { ja.tx += (tahne[0] - ja.tx) * .04; ja.ty += (tahne[1] - ja.ty) * .04; }
      ja.x += (ja.tx - ja.x) * .22; ja.y += (ja.ty - ja.y) * .22;
      nahrej(ja.x, ja.y, 1); odkryj(ja.x, ja.y, .045 * dt / 16);
    }
    for (var i = 0; i < ostatni.length; i++) {
      var o = ostatni[i];
      if (tahne) { o.x += (tahne[0] - o.x) * .035; o.y += (tahne[1] - o.y) * .035; }
      else {
        o.a += (Math.random() - .5) * .3; o.x += Math.cos(o.a) * o.v * dt / 16; o.y += Math.sin(o.a) * o.v * dt / 16;
        if (o.x < 40 || o.x > D.w - 40) o.a = Math.PI - o.a; if (o.y < 90 || o.y > D.h - 40) o.a = -o.a;
      }
      nahrej(o.x, o.y, .7); odkryj(o.x, o.y, .02 * dt / 16);
    }
    // odkryté místo pomalu bledne (stavba potřebuje lidi), jen mimo finále
    if (!tahne && ts - posledniStav > 1000) {
      posledniStav = ts;
      for (var m = 0; m < maska.length; m++) if (maska[m] > 0) maska[m] = Math.max(0, maska[m] - .004);
      maskaZmena = true; ukazStav();
    }
    kresliFoto(ts);
    // žhnoucí čáry (chladnou ~2,5 s)
    xs.globalCompositeOperation = 'lighter'; xs.lineCap = 'round';
    var chlad = dt / 2500;
    // Záře BEZ shadowBlur: rozmazání u každé čáry zvlášť zahltilo grafiku a zamrazilo celý prohlížeč (23. 11. 2026,
    // snímků ubývalo až na 3 za sekundu). Místo toho široký průsvitný tah pod tenkým jasným – vypadá skoro stejně.
    var zare = !slaby();
    horke.forEach(function (i) {
      var h = heat[i] -= chlad;
      if (h <= 0) { heat[i] = 0; horke.delete(i); return; }
      var s = segs[i], sirka = (s[4] ? 2.2 : 1.6) * DPR;
      xs.beginPath(); xs.moveTo(X(s[0]), Y(s[1])); xs.lineTo(X(s[2]), Y(s[3]));
      if (zare) {
        xs.strokeStyle = 'rgba(255,150,60,' + (.22 * h).toFixed(3) + ')';
        xs.lineWidth = sirka * 5; xs.stroke();
      }
      xs.strokeStyle = 'rgba(255,' + (120 + 100 * h | 0) + ',' + (50 + 60 * h | 0) + ',' + Math.min(1, h * 1.1) + ')';
      xs.lineWidth = sirka; xs.stroke();
    });
    for (var j = 0; j < ostatni.length; j++) jiskra(ostatni[j].x, ostatni[j].y, ostatni[j].barva, 9);
    if (ja.aktivni) jiskra(ja.x, ja.y, ja.barva, 15);
    xs.globalCompositeOperation = 'source-over';
  }
  function naFotku(e) { var r = scena.getBoundingClientRect(); return [(e.clientX - r.left - ox) / k, (e.clientY - r.top - oy) / k]; }
  function pohyb(e) { if (!ja.aktivni || tahne) return; var p = naFotku(e); ja.tx = p[0]; ja.ty = p[1]; }
  function tuk(e) {
    if (!ja.aktivni || tahne || e.target.closest('button, a')) return;
    var p = naFotku(e); ja.tx = p[0]; ja.ty = p[1];
    for (var i = 0; i < 6; i++) nahrej(p[0] + (Math.random() - .5) * 120, p[1] + (Math.random() - .5) * 120, 1);   // záblesk
    odkryj(p[0], p[1], .25, 10);
  }

  // ---------------------------------------------------------------- Jsem tu, stav, odpočet
  var klepnuto = false, jsemTu = q('#pmuJsemTu');
  jsemTu.addEventListener('click', function () {
    klepnuto = true; jsemTu.disabled = true; jsemTu.textContent = jsemTu.dataset.done;
    if (window.SquadZvuk) window.SquadZvuk.odemkni();
    ja.aktivni = true; ja.x = ja.tx = D.vp[0]; ja.y = ja.ty = D.vp[1];   // jiskra vyletí z úběžníku
    odkryj(ja.x, ja.y, .4, 9);
    q('#pmuNapoveda').textContent = box.dataset.tHint2;
    ukazStav();
  });
  function ukazStav() {
    var n = ostatni.length + (ja.aktivni ? 1 : 0), p = Math.round(postaveno() * 100);
    q('#pmuStav').textContent = n ? lide(n) : '';
    q('#pmuPostaveno').textContent = p + ' %';
  }
  function dva(n) { return (n < 10 ? '0' : '') + n; }
  function ukazOdpocet(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    q('#pmuOdpocet').textContent = (s >= 3600 ? dva(Math.floor(s / 3600)) + ':' : '') + dva(Math.floor(s / 60) % 60) + ':' + dva(s % 60);
  }

  // ---------------------------------------------------------------- fáze
  var faze = 'pred', karta = hero.querySelector('.hero-premiere');
  // obdélník karty premiéry vůči hrdinovi jako clip-path (z něj se okno roztáhne a do něj se po premiéře vrátí)
  // c = obdélník karty na obrazovce (změřený dřív, než se hrdina přestaví), počítá se vůči oknu (to má šířku obrazovky)
  function vKarte(c) {
    var b = box.getBoundingClientRect();
    if (!c || !c.width) return 'inset(40% 30% 40% 30% round 14px)';
    var top = Math.max(0, Math.min(b.height - 40, c.top - b.top)), left = Math.max(0, c.left - b.left);
    return 'inset(' + top + 'px ' + Math.max(0, b.right - c.right) + 'px ' + Math.max(0, b.height - top - c.height) + 'px ' + left + 'px round 14px)';
  }
  function obdelnikKarty() { return karta ? karta.getBoundingClientRect() : null; }
  function zapnout(animovat) {          // proměna úvodu (animovat = odehrálo se to před očima)
    faze = 'cekarna';
    if (window.skeliUpoutavkyZavri) window.skeliUpoutavkyZavri();   // hrající upoutávka (js/upoutavka.js) by hrála do proměny
    body.classList.add('pm-sede');       // barvy webu se vysají (CSS, ~4 s) – jen po dobu těch 30 minut
    vyska();
    if (!animovat) { hero.classList.add('pm-hero'); box.hidden = false; box.classList.add('on'); rozmer(); nakreslit(2500); start(); return; }
    // 1) jméno, citát a tlačítka zmizí, zůstane jen karta premiéry  2) z karty se roztáhne velké okno
    hero.classList.add('pm-odchod');
    setTimeout(function () {
      var c = obdelnikKarty();
      hero.classList.add('pm-hero'); box.hidden = false;
      box.style.clipPath = vKarte(c); void box.offsetWidth;
      box.classList.add('on', 'roste');
      rozmer(); papir();
      requestAnimationFrame(function () { box.style.clipPath = 'inset(0 0 0 0 round 0px)'; });
      setTimeout(function () { box.classList.remove('roste'); box.style.clipPath = ''; nakreslit(7000); start(); }, 1700);
    }, 1400);
  }
  // po premiéře: okno se smrskne zpátky do karty („Venku!“), barvy a normální úvod se vrátí
  function navrat() {
    if (faze === 'pryc') return; faze = 'pryc';
    body.classList.remove('pm-sede');
    if (karta) karta.classList.add('is-out');
    // hrdina se vrátí do původní podoby (pod oknem, text zatím skrytý), změří se karta a okno se do ní smrskne
    hero.classList.add('pm-odchod'); hero.classList.remove('pm-hero');
    var c = obdelnikKarty();
    box.classList.add('roste'); box.style.clipPath = 'inset(0 0 0 0 round 0px)'; void box.offsetWidth;
    box.style.clipPath = vKarte(c);
    setTimeout(function () {
      stop(); if (clock) { clock.stop(); clock = null; } ramVideo.innerHTML = '';
      box.hidden = true; box.classList.remove('roste', 'on'); box.style.clipPath = '';
      hero.classList.remove('pm-hero', 'pm-odchod');
    }, 1700);
  }
  function start() { if (!raf && !document.hidden) { posl = 0; raf = requestAnimationFrame(snimek); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  var TEPY = [8.4, 7.25, 6.1, 4.95, 3.8, 2.65, 1.5], SEPOT = 1.2;
  var tvare = [].slice.call(box.querySelectorAll('.pmu-tvare img')), ramVideo = q('#pmuVideo');
  function zvuk() { return klepnuto && window.SquadZvuk ? window.SquadZvuk : null; }
  function finale(zbyva) {
    if (faze === 'finale') return; faze = 'finale';
    box.classList.add('is-final');
    tahne = D.vp.slice();
    // ulice se dostaví vlnou od úběžníku (do startu je odkrytá celá)
    var t0 = performance.now(), dl = Math.max(1000, zbyva - 600);
    (function vlna(ts) {
      if (faze !== 'finale') return;
      var p = Math.min(1, (ts - t0) / dl), r = p * 2200;
      for (var j = 0; j < MH; j++) for (var i = 0; i < MW; i++) {
        var d = Math.hypot(i * 8 - D.vp[0], j * 8 - D.vp[1]);
        if (d < r) { var n = j * MW + i; maska[n] = Math.max(maska[n], Math.min(1, (r - d) / 500)); }
      }
      for (var s = 0; s < segs.length; s += 3) {
        var dd = Math.hypot(segs[s][0] - D.vp[0], segs[s][1] - D.vp[1]);
        if (Math.abs(dd - r) < 60) { heat[s] = 1; horke.add(s); }
      }
      maskaZmena = true; ukazStav();
      if (p < 1) requestAnimationFrame(vlna);
    })(t0);
    TEPY.forEach(function (pred, i) {
      var d = zbyva - pred * 1000;
      if (d < -300) { tvare[i].classList.add('on'); return; }
      setTimeout(function () {
        tvare[i].classList.add('on');
        ramVideo.classList.remove('tep'); void ramVideo.offsetWidth; ramVideo.classList.add('tep');
        var z = zvuk(); if (z) z.srdce(0.55 + i * 0.07);
      }, Math.max(0, d));
    });
    var ds = zbyva - SEPOT * 1000;
    if (ds > -300) setTimeout(function () { var z = zvuk(); if (z) z.sepot(0.09); }, Math.max(0, ds));
  }
  var yt = SIM ? box.dataset.simYt : null, hraje = false, clock = null, dalsiDotaz = 0;
  function zive() {
    if (faze === 'zive' || faze === 'konec') return;
    faze = 'zive'; tahne = null;
    var zp = q('.pmu-znovu'); if (zp) zp.hidden = true;
    box.classList.remove('is-final'); box.classList.add('is-live');
    var z = q('.pmu-zablesk'); z.classList.remove('ted'); void z.offsetWidth; z.classList.add('ted');
    ja.aktivni = false; ostatni = [];
    for (var i = 0; i < maska.length; i++) maska[i] = 1;
    maskaZmena = true;
    pustVideo();
  }
  function embed(start, mute) {
    if (clock) { clock.stop(); clock = null; }
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + yt + '?enablejsapi=1&rel=0&playsinline=1&modestbranding=1&iv_load_policy=3&autoplay=1'
      + '&mute=' + (mute ? 1 : 0) + (start > 0 ? '&start=' + Math.floor(start) : '') + '&origin=' + encodeURIComponent(location.origin);
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true;
    f.title = q('.pmu-nazev').textContent;
    ramVideo.innerHTML = ''; ramVideo.appendChild(f);
    var dorovnano = false;
    clock = window.YtClock ? new window.YtClock(f, function (c) {
      if (!c.playing()) { if (c.duration() && c.time() >= c.duration() - 1.5) konec(); return; }
      if (!dorovnano) { dorovnano = true; var cil = (now() - at) / 1000; if (cil < (c.duration() || 1e9) && Math.abs(c.time() - cil) > 3) c.seek(cil); }
      if (!c.muted()) q('#pmuZvuk').hidden = true;
    }) : null;
  }
  function pustVideo() {
    if (hraje) return;
    if (!yt) {   // ostrá premiéra: video jen z /api/premiere, až po startu (každé 2–3 s, dokud nepřijde)
      if (Date.now() < dalsiDotaz) return;
      dalsiDotaz = Date.now() + 2000 + Math.random() * 1000;
      fetch('/api/premiere?song=' + encodeURIComponent(box.dataset.song), { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : {}; })
        .then(function (d) { if (d.yt && /^[A-Za-z0-9_-]{6,20}$/.test(d.yt)) { yt = d.yt; pustVideo(); } })
        .catch(function () { /* zkusí se znovu */ });
      return;
    }
    hraje = true;
    var souhlas = false; try { souhlas = !!(window.skeliConsent && window.skeliConsent()); } catch (e) { /* nic */ }
    if (!klepnuto && !souhlas) {   // YouTube jen tomu, kdo o něj stojí: velké ▶ (ťuknutí = chci přehrávač a zvuk)
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'pmu-pustit';
      b.innerHTML = '<span class="pmu-play"><i class="fa-solid fa-play" aria-hidden="true"></i></span><b></b><small></small>';
      b.querySelector('b').textContent = box.dataset.tStart; b.querySelector('small').textContent = box.dataset.tYt;
      b.addEventListener('click', function () { klepnuto = true; embed((now() - at) / 1000, false); });
      ramVideo.innerHTML = ''; ramVideo.appendChild(b);
      return;
    }
    embed((now() - at) / 1000, !klepnuto);
    if (!klepnuto) q('#pmuZvuk').hidden = false;
    else setTimeout(function () { if (clock && !clock.playing()) { embed((now() - at) / 1000, true); q('#pmuZvuk').hidden = false; } }, 4000);
  }
  q('#pmuUnmute').addEventListener('click', function () { if (clock) { clock.unMute(); clock.setVolume(100); clock.play(); } });
  function konec() {                     // klip dohrál: barvy se vrátí celému webu
    if (faze === 'konec') return; faze = 'konec';
    body.classList.remove('pm-sede'); box.classList.add('is-konec');
    q('#pmuDiky').hidden = false; q('#pmuZvuk').hidden = true;
    setTimeout(navrat, 5000);            // chvíli „díky“, pak se okno vrátí do karty
  }

  function tik() {
    if (!document.body.contains(box)) return uklid();   // odchod jinam (PJAX): všechno zastavit
    var zbyva = at - now();
    if (zbyva > PRED) { faze = 'pred'; return; }
    if (faze === 'pryc') return;
    if (-zbyva > LIVE_MS && !hraje && !ZNOVU) { if (faze !== 'pred') navrat(); return; }   // po premiéře normální úvod s kartou „Venku!“
    if (faze === 'pred') { if (!D) return; zapnout(zbyva > PRED - 15000); if (ZNOVU) znovuPanel(); }
    if (rychlost > 1 && zbyva < 20000) { zrychli(1); znovuPanel(); }
    if (zbyva > 0) { ukazOdpocet(zbyva); if (zbyva <= FINALE) finale(zbyva); }
    else { ukazOdpocet(0); zive(); if (!hraje) pustVideo(); }
  }
  var timer = setInterval(tik, 500);
  function uklid() {
    clearInterval(timer); stop(); cancelAnimationFrame(stavbaRaf);
    body.classList.remove('pm-sede');
    window.removeEventListener('resize', naResize); document.removeEventListener('visibilitychange', naViditelnost);
    window.removeEventListener('pointermove', pohyb);
    if (clock) clock.stop();
    var p = document.getElementById('pmSimPanel'); if (p) p.remove();
  }
  function naResize() { if (faze === 'pred' || !D) return; vyska(); rozmer(); nakreslit(0); maskaZmena = true; posledniFoto = 0; }
  function naViditelnost() { if (document.hidden) stop(); else if (faze !== 'pred') start(); }
  window.addEventListener('resize', naResize);
  document.addEventListener('visibilitychange', naViditelnost);
  window.addEventListener('pointermove', pohyb, { passive: true });
  scena.parentNode.addEventListener('pointerdown', tuk);

  // ---------------------------------------------------------------- data, pak start
  foto.src = window.innerWidth < 900 ? '/img/photos/street-md.webp' : '/img/photos/street-lg.webp';
  foto.onload = function () { maskaZmena = true; };
  fetch('/img/premiera/ulice-cary.json').then(function (r) { return r.json(); }).then(function (d) {
    D = d; pripravit(); if (SIM) { simLide(+(sessionStorage.getItem('pmSimLide') || 25)); simPanel(); }
    if (ZNOVU) znovuPanel();
    tik();
  }).catch(function () { /* bez výkresu zůstane normální úvod s kartou */ });

  // ---------------------------------------------------------------- přehrání po premiéře: zrychlit / přeskočit
  function znovuPanel() {
    var p = q('.pmu-znovu');
    if (!p) {
      p = document.createElement('div'); p.className = 'pmu-znovu';
      p.innerHTML = '<span></span><button type="button" data-a="r"></button><button type="button" data-a="o"></button><button type="button" data-a="k"></button>';
      p.querySelector('span').textContent = box.dataset.tZnovu;
      p.querySelector('[data-a="o"]').textContent = box.dataset.tNaodpocet;
      p.querySelector('[data-a="k"]').textContent = box.dataset.tNaklip;
      p.addEventListener('click', function (e) {
        var a = e.target.dataset && e.target.dataset.a; if (!a) return;
        if (a === 'r') zrychli(rychlost > 1 ? 1 : 10);
        if (a === 'o' && faze === 'cekarna') nastavCas(13000, 1);
        if (a === 'k' && (faze === 'cekarna' || faze === 'finale')) { nastavCas(0, 1); klepnuto = true; }   // ťuknutí = smí hrát zvuk
        znovuPanel(); tik();
      });
      q('.pmu-hlava').appendChild(p);
    }
    var r = p.querySelector('[data-a="r"]');
    r.textContent = rychlost > 1 ? box.dataset.tNormal : box.dataset.tFaster;
    p.hidden = !(faze === 'pred' || faze === 'cekarna' || faze === 'finale');
    r.hidden = p.querySelector('[data-a="o"]').hidden = faze === 'finale';
  }

  // ---------------------------------------------------------------- simulace (jen ?pmSim na localhostu a testu)
  function simPanel() {
    var p = document.createElement('div'); p.id = 'pmSimPanel'; p.className = 'pmu-sim';
    var cas = [['31:00 před', 1860], ['30:06 (proměna)', 1806], ['20:00', 1200], ['0:13 (odpočet)', 13]];
    p.innerHTML = '<b>Simulace</b>';
    cas.forEach(function (c) {
      var a = document.createElement('a'); a.href = '/?pmSim=' + c[1]; a.textContent = c[0]; p.appendChild(a);
    });
    var lb = document.createElement('button'); lb.type = 'button';
    var n = ostatni.length; lb.textContent = 'Lidé: ' + n;
    lb.onclick = function () { n = n === 25 ? 120 : n === 120 ? 0 : 25; try { sessionStorage.setItem('pmSimLide', n); } catch (e) { /* nic */ } simLide(n); lb.textContent = 'Lidé: ' + n; ukazStav(); };
    var kb = document.createElement('button'); kb.type = 'button'; kb.textContent = 'Konec klipu → návrat';
    kb.onclick = function () { if (faze === 'pred') return; if (faze !== 'zive') { faze = 'zive'; } konec(); };
    p.appendChild(lb); p.appendChild(kb);
    document.body.appendChild(p);
  }
})();
