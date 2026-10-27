// CatSmash – pinkání s Kevinem do 10 gólů (otevírá se z Kevinova menu: „Zahraj si se mnou“).
// Hřiště na výšku: Kevin nahoře (jeho 3D model z js/kevin-model.js drží zlatou pálku), hráč dole. Ovládání
// prstem / myší (pálka jde za ním) nebo šipkami. Tři obtížnosti: 1 lehká, 2 normální, 3 Kevin naštvaný
// (rychlá reakce, předvídá odrazy, míří ti do protirohu – porazit ho je opravdu těžké).
// Zbraň hráče = ODSTŘEL: klik / mezerník / tlačítko ⚡ (telefon, i druhý prst) – pálka poskočí a míček vystřelí
// rychleji; čím přesněji načasované vůči dotyku míčku, tím víc (perfektní = zastavení času, 3× za sebou = SUPER).
// Pokažený odstřel (špatně načasovaný / naprázdno) míček nezrychlí, ale přibrzdí – a Kevin ho potrestá: vrátí ho
// šikmo do rohu, kde hráč není (klidně přes odraz od stěny).
// Stroj: obrázek rámu (kevin/pong/ram.webp, 768×1376) se sklem hřiště; Kevin stojí nahoře na prostředním ze tří
// ozubených kol a běží na něm na místě – běží doprava, jeho pálka jede doprava. Kola do sebe zapadají (sousední se
// točí opačně, rychlost podle poloměru), dole tři kola hráče točí jeho pálka. Pálky jezdí po kolejnici s pásem.
// Komár: jednou za zápas (náhodně) přiletí komár, Kevin hru sám zapauzuje, sleduje ho, vrhne se po něm, omráčený
// komár spadne přes hřiště a Kevin se tváří, že nic – hra pokračuje.
// Hlášky a nápisy jdou z reproduktorů na bocích stroje jako z komiksu: nápisy odstřelu (PERFEKTNÍ ODSTŘEL…)
// vyletí z levého jako zubatá „výbuchová“ bublina, Kevinovy hlášky z pravého jako mluvicí bublina. Kde je
// vedle stroje volno (PC), letí ven ze stroje, jinak přes kraj stroje dovnitř.
// Pozadí hrací plochy (na skle hřiště, ztmavené, ať je vidět hopík a pálky): sklo stroje, nebo jeden ze 6 obrázků
// (město, západ slunce, les, vesmír, polární záře, ganja údolí), výběr v menu hry (localStorage kevinPongBg);
// obrázky žijí na plátně .kpong-bgfx (déšť, prach, světlušky, hvězdy s meteorem, sníh, pyl). Se „omezit pohyb“ jen obrázek.
// Kevin komentuje hru hláškami z js/kevin-pong-lines.js (načte se se hrou) podle situace – série, mečbol, 9:9,
// obrat, dlouhá výměna, rychlý hopík, odstřely, trest, nehybný hráč, odveta, rekord, vzácné hlášky; bez opakování
// (balíček se zamíchá), s odstupem mezi hláškami, důležité chvíle přebijí. Chybí-li jazyk, mluví z kevin-lines.js.
// Kevin dělá lidské chyby: míček „sleduje“ až od části hřiště, s každým odrazem od stěny a s rychlostí se víc splete.
// Výhra přihlášeného hráče jde do tabulky pořadí (/api/pong: server měří čas od startu, pořadí = nejrychlejší
// výhra). Nepřihlášenému se nejlepší čas uloží jen v prohlížeči. Texty: KEVIN_LINES[jazyk].pong (kevin-lines.js).
(function () {
  if (window.KevinPong) return;
  var W = 600, H = 900, PAD_W = 124, PAD_H = 16, BALL_R = 14, WIN = 10;
  var PLAYER_Y = H - 46, KEVIN_Y = 60;               // pálky (logické souřadnice hřiště)
  // rám: rozměr obrázku, sklo hřiště v něm a kola [obrázek, x, y, poloměr] (vše v pixelech obrázku)
  var FRAME_W = 768, FRAME_H = 1376, GLASS = { x: 138, y: 316, w: 492, h: 741 };
  // Kevinova kola koukají shora ze stroje: spodek je uvnitř (ořízne ho štěrbina v horní hraně rámu, y = TOP_SLOT)
  var TOP_SLOT = 124, GEARS_KEVIN = [[1, 290.5, 122, 46], [2, 384, 118, 58], [3, 477.5, 122, 46]];
  // okénka s živou mechanikou [x, y, šířka, výška] – nahoře ji pohání Kevinův běh, dole hráčova pálka
  var WIN_TOP = [128, 191, 513, 79], WIN_BOT = [123, 1073, 523, 136];
  var BGS = ['tma', 'mesto', 'zapad', 'les', 'vesmir', 'zare', 'ganja'];
  // watch = jakou část hřiště (od sebe) Kevin sleduje, err = chyba odhadu (díl šířky), bounceErr = o kolik víc
  // se splete za každý odraz od stěny; chyba se losuje jednou za let míčku (ne pořád dokola – to by se zprůměrovalo)
  var LEVELS = {
    1: { speed: 490, gain: 1.03, max: 1000, react: 0.26, err: 0.11, bounceErr: 0.6, watch: 0.6, aiSpeed: 340, aim: 0.1, kshot: 0 },
    2: { speed: 580, gain: 1.04, max: 1250, react: 0.15, err: 0.065, bounceErr: 0.5, watch: 0.75, aiSpeed: 520, aim: 0.35, kshot: 0 },
    // trojka: pořád těžká, ale porazitelná (dřív chyba 0,02 a běh 1000 = skoro neomylný, hráč dal 1 gól z 10 her)
    3: { speed: 680, gain: 1.045, max: 1500, react: 0.08, err: 0.048, bounceErr: 0.45, watch: 0.95, aiSpeed: 800, aim: 0.7, kshot: 0.16 }
  };
  // odstřel: pálka je nejvýš SHOT_IDEAL ms po kliknutí; odchylka dotyku míčku od té chvíle (ms) → zrychlení
  var SHOT = [[35, 1.6, 'perfect'], [90, 1.3, 'good'], [160, 1.12, 'weak']], SHOT_IDEAL = 40, SHOT_SUPER = 1.85, LIFT = 22;

  function open(opts) {
    opts = opts || {};
    var lang = document.documentElement.lang || 'cs';
    var KL = (window.KEVIN_LINES || {})[lang] || (window.KEVIN_LINES || {}).en || {};
    var T = KL.pong || ((window.KEVIN_LINES || {}).en || {}).pong;
    var ver = opts.version ? '?' + opts.version : '';
    var pick = function (a) { return Array.isArray(a) ? a[Math.floor(Math.random() * a.length)] : a; };
    var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* nevadí */ } } };

    // ---------- okno hry ----------
    var root = document.createElement('div');
    root.className = 'kpong';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', T.title);
    root.innerHTML =
      '<div class="kpong-box">' +
      '  <div class="kpong-top">' +
      '    <div class="kpong-score" aria-live="polite"><span class="kpong-who">' + esc(T.you) + '</span><b class="kpong-you">0</b><i>:</i><b class="kpong-kev">0</b><span class="kpong-who">Kevin</span></div>' +
      '    <button type="button" class="kpong-close" aria-label="' + esc(T.close) + '"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
      '  </div>' +
      '  <div class="kpong-machine"><div class="kpong-frame">' +
      '    <canvas class="kpong-mech" data-win="top" style="' + winVars(WIN_TOP) + '" aria-hidden="true"></canvas>' +
      '    <canvas class="kpong-mech" data-win="bot" style="' + winVars(WIN_BOT) + '" aria-hidden="true"></canvas>' +
      '    <div class="kpong-gears" data-set="kevin">' + GEARS_KEVIN.map(gear).join('') + '</div>' +
      '    <i class="kpong-slot" aria-hidden="true"></i>' +
      '    <div class="kpong-smoke" aria-hidden="true">' + [0, 1, 2, 3, 4, 5].map(function (k) { return '<i style="--k:' + k + '"></i>'; }).join('') + '</div>' +
      '    <i class="kpong-spk" data-side="l" aria-hidden="true"></i><i class="kpong-spk" data-side="r" aria-hidden="true"></i>' +
      '    <canvas class="kpong-kevin" aria-hidden="true"></canvas>' +
      '    <div class="kpong-field">' +
      '      <div class="kpong-bg" aria-hidden="true"></div><canvas class="kpong-bgfx" aria-hidden="true"></canvas>' +
      '      <canvas class="kpong-court" width="600" height="900" aria-hidden="true"></canvas>' +
      '      <div class="kpong-panel"></div>' +
      '      <button type="button" class="kpong-set" aria-label="' + esc(T.settings || 'Settings') + '" aria-haspopup="dialog"><i class="fa-solid fa-gear" aria-hidden="true"></i></button>' +
      '    </div>' +
      '  </div></div>' +
      '  <div class="kpong-pad"><button type="button" class="kpong-shot"><i class="fa-solid fa-bolt" aria-hidden="true"></i> ' + esc(T.shot || 'Odstřel') + '</button></div>' +
      '</div>' +
      '<p class="sr-only kpong-live" aria-live="polite"></p>';   // úvod a konec (.kpong-panel) leží přímo na skle hřiště
    document.body.appendChild(root);
    document.documentElement.classList.add('kpong-open');
    var court = root.querySelector('.kpong-court'), cx = court.getContext('2d');
    var field = root.querySelector('.kpong-field'), panel = root.querySelector('.kpong-panel');
    var liveEl = root.querySelector('.kpong-live'), youEl = root.querySelector('.kpong-you'), kevEl = root.querySelector('.kpong-kev');
    var kevCanvas = root.querySelector('.kpong-kevin');
    var machine = root.querySelector('.kpong-machine'), frame = root.querySelector('.kpong-frame');
    var shotBtn = root.querySelector('.kpong-shot'), topBar = root.querySelector('.kpong-top');
    var padEl = root.querySelector('.kpong-pad');
    function winVars(w) { return '--wx:' + w[0] + ';--wy:' + w[1] + ';--ww:' + w[2] + ';--wh:' + w[3]; }
    function gear(g) {
      return '<img class="kpong-gear" src="/kevin/pong/kolo-' + g[0] + '.webp' + ver + '" alt="" style="--x:' + g[1] + ';--y:' + g[2] + ';--r:' + g[3] + '">';
    }

    // velikost stroje: celý rám, a když je displej úzký (telefon), ořízne se kraj rámu a spodek pod koly hráče,
    // ať je hřiště co největší. --u = kolik pixelů obrazovky je jeden pixel obrázku.
    function fit() {
      var landscape = innerWidth > innerHeight && innerHeight < 500;
      var availW = innerWidth - 16 - (landscape ? topBar.offsetWidth + padEl.offsetWidth + 24 : 0);
      // skóre a křížek leží přes volné místo nad strojem (vedle Kevina), na výšku tedy nezabírají řádek
      var availH = innerHeight - 16 - (landscape ? 0 : (padEl.offsetHeight ? padEl.offsetHeight + 8 : 0));
      var all = { x0: 0, x1: FRAME_W, y0: -110, y1: FRAME_H };    // nad rámem místo pro Kevina
      var cut = { x0: GLASS.x - 62, x1: GLASS.x + GLASS.w + 62, y0: -110, y1: landscape ? 1070 : 1300 };
      var uAll = Math.min(availW / FRAME_W, availH / FRAME_H), uCut = Math.min(availW / (cut.x1 - cut.x0), availH / (cut.y1 - cut.y0));
      var v = uCut > uAll * 1.12 ? cut : all, u = v === cut ? uCut : uAll;
      machine.classList.toggle('cut', v === cut);
      machine.style.width = Math.floor((v.x1 - v.x0) * u) + 'px';
      machine.style.height = Math.floor((v.y1 - v.y0) * u) + 'px';
      frame.style.setProperty('--u', u);
      frame.style.left = -v.x0 * u + 'px';
      frame.style.top = -v.y0 * u + 'px';
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      mechEls.forEach(function (c) {
        var w = c.dataset.win === 'top' ? WIN_TOP : WIN_BOT;
        c.width = Math.round(w[2] * u * dpr); c.height = Math.round(w[3] * u * dpr);
      });
    }
    var mechEls = [].slice.call(root.querySelectorAll('.kpong-mech'));
    fit();
    addEventListener('resize', fit);

    // ---------- Kevin (3D) ----------
    var K = null;
    import('/js/kevin-model.js' + ver).then(function (m) {
      K = m.createKevin(kevCanvas, {
        src: '/kevin/kevin.glb' + ver, moves: '/kevin/pohyby.json' + ver,
        light: document.body.classList.contains('light'), overscan: 1.25, alwaysRender: true,
        onReady: function () { kevCanvas.classList.add('on'); K.turn(0); }
      });
    }).catch(function () { /* hra jde i bez něj */ });

    // ---------- odznaky: pamatuje si je prohlížeč, přihlášenému je sloučí s účtem (/api/pong/me) ----------
    // Část se počítá z výher (první výhra, 10:0…), část se stane uvnitř zápasu (odstřely, šroubky…) – ty se
    // přihlášenému posílají na server (/api/pong/badges). Odznaky odemykají pálky, míčky a pozadí.
    var BADGE_ICON = { first: 'fa-trophy', easy: 'fa-mug-hot', normal: 'fa-scale-balanced', angry: 'fa-cat', clean: 'fa-shield-halved',
      close: 'fa-heart-pulse', fast: 'fa-bolt', streak: 'fa-medal', wins50: 'fa-medal', wins100: 'fa-medal', sniper: 'fa-crosshairs',
      super: 'fa-explosion', tinker: 'fa-screwdriver-wrench', yarn: 'fa-mitten', overheat: 'fa-fire', comeback: 'fa-arrow-trend-up',
      marathon: 'fa-person-running', night: 'fa-moon', loyal: 'fa-calendar-check', wardrobe: 'fa-shirt' };
    var CLAIMABLE = ['sniper', 'super', 'tinker', 'yarn', 'overheat', 'comeback', 'marathon', 'night', 'loyal'];
    var LOOKS = ['easy', 'clean', 'overheat', 'angry', 'comeback', 'yarn', 'night', 'super', 'loyal', 'wins50', 'sniper', 'tinker', 'close'];
    var badges = {};
    try { (JSON.parse(store.get('kevinPongBadges') || '[]') || []).forEach(function (k) { if (BADGE_ICON[k]) badges[k] = true; }); } catch (e) { /* nic */ }
    // hráči z doby před odznaky: výhry podle rekordů v prohlížeči
    if (store.get('kevinPongBest1')) badges.easy = true;
    if (store.get('kevinPongBest2')) badges.normal = true;
    if (store.get('kevinPongBest3') || store.get('kevinPongBeat3')) badges.angry = true;
    if (badges.easy || badges.normal || badges.angry) badges.first = true;
    // zkoušky jen na test.skeli.cz a na vlastním počítači (na www nefungují):
    // #vse = na tuhle návštěvu odemkne všechny pálky, míčky a pozadí (nic se neuloží, bez #vse je vše zase zamčené),
    // #klubko = Kevin hodí klubíčko hned na začátku zápasu (na jakékoli obtížnosti)
    var TRY_HOST = /^(test\.|localhost$|127\.)/.test(location.hostname);
    var PREVIEW_ALL = TRY_HOST && /\bvse\b/.test(location.hash), FORCE_YARN = TRY_HOST && /\bklubko\b/.test(location.hash);
    function hasBadge(k) { return !k || PREVIEW_ALL || !!badges[k]; }
    // přidá odznaky, vrátí ty opravdu nové (v pořadí BADGE_ICON)
    function addBadges(list) {
      var fresh = [];
      list.forEach(function (k) { if (BADGE_ICON[k] && !badges[k]) { badges[k] = true; fresh.push(k); } });
      if (!badges.wardrobe && LOOKS.every(function (k) { return badges[k]; })) { badges.wardrobe = true; fresh.push('wardrobe'); }
      store.set('kevinPongBadges', JSON.stringify(Object.keys(badges)));
      return Object.keys(BADGE_ICON).filter(function (k) { return fresh.indexOf(k) >= 0; });
    }
    addBadges([]);
    function lockText(k) { return (T.lockBy || '{badge}').replace('{badge}', (T.badgeNames || {})[k] || k); }
    // přihlášený: odznaky z účtu sem, odznaky ze zápasů z tohoto prohlížeče na účet
    function syncBadges() {
      return fetch('/api/pong/me', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (j) {
        if (!j.signedIn) return;
        signedIn = true; csrf = j.csrf || csrf;
        addBadges(j.badges || []);
        var missing = CLAIMABLE.filter(function (k) { return badges[k] && (j.badges || []).indexOf(k) < 0; });
        if (missing.length) post('/api/pong/badges', { keys: missing.join(',') }).catch(function () { /* příště */ });
      }).catch(function () { /* hraje se i bez účtu */ });
    }

    // ---------- pozadí a jeho život ----------
    var bgEl = root.querySelector('.kpong-bg'), fx = root.querySelector('.kpong-bgfx'), fxc = fx.getContext('2d');
    var bgName = store.get('kevinPongBg'), still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // pozadí pro všechny: Tma a Noční město; ostatní odemkne odznak (kdo nic nevybral nebo má zamčené, má Noční město)
    var BG_BADGE = { zapad: 'close', les: 'loyal', vesmir: 'fast', zare: 'overheat', ganja: 'comeback' };
    if (BGS.indexOf(bgName) < 0 || !hasBadge(BG_BADGE[bgName])) bgName = 'mesto';
    var parts = [], fxLast = 0, shoot0 = 0, fxW = 1, fxH = 1;
    // výřez obrázku na hřiště (hřiště je na výšku, obrázky na šířku): kde je v obrázku to nejhezčí
    var BG_POS = { mesto: '20%', zapad: '62%', les: '50%', vesmir: '28%', zare: '50%', ganja: '55%' };
    function setBg(name) {
      bgName = name;
      root.dataset.bg = name;
      bgEl.style.backgroundImage = name === 'tma' ? '' : 'url(/kevin/pong/pozadi-' + name + '.webp' + ver + ')';
      bgEl.style.backgroundPosition = (BG_POS[name] || '50%') + ' 50%';
      seedFx();
    }
    function fxSize() {
      var dpr = Math.min(1.5, window.devicePixelRatio || 1);
      fxW = Math.max(1, field.clientWidth); fxH = Math.max(1, field.clientHeight);
      fx.width = Math.round(fxW * dpr); fx.height = Math.round(fxH * dpr);
      fxc.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedFx();
    }
    function rnd(a, b) { return a + Math.random() * (b - a); }
    // částice podle pozadí: x, y, velikost, rychlost, fáze
    function seedFx() {
      var w = fxW, h = fxH, n = { mesto: 90, zapad: 30, les: 22, vesmir: 60, zare: 70, ganja: 36 }[bgName] || 0;
      parts = [];
      for (var i = 0; i < n; i++) parts.push({ x: rnd(0, w), y: rnd(0, h), s: rnd(0.6, 1.4), v: rnd(0.6, 1.4), p: rnd(0, 6.28) });
    }
    function fxTick(now) {
      if (still) return;
      var dt = fxLast ? Math.min(0.05, (now - fxLast) / 1000) : 0, w = fxW, h = fxH, t = now / 1000;
      fxLast = now;
      fxc.clearRect(0, 0, w, h);
      parts.forEach(function (q) {
        switch (bgName) {
          case 'mesto':   // déšť šikmo
            q.y += 820 * q.v * dt; q.x -= 140 * q.v * dt;
            if (q.y > h) { q.y = -20; q.x = rnd(0, w + 120); }
            fxc.strokeStyle = 'rgba(190,200,255,' + (0.18 * q.s) + ')'; fxc.lineWidth = q.s;
            fxc.beginPath(); fxc.moveTo(q.x, q.y); fxc.lineTo(q.x + 3.4 * q.s, q.y - 20 * q.s); fxc.stroke();
            break;
          case 'zare':    // sníh s houpáním
            q.y += 38 * q.v * dt; q.x += Math.sin(t * 0.9 + q.p) * 18 * dt;
            if (q.y > h) { q.y = -6; q.x = rnd(0, w); }
            dot(q.x, q.y, 1.6 * q.s, 'rgba(255,255,255,' + (0.55 * q.s) + ')');
            break;
          case 'les':     // světlušky: bloudí a pulzují
            q.x += Math.sin(t * 0.5 * q.v + q.p) * 22 * dt; q.y += Math.cos(t * 0.4 * q.v + q.p * 2) * 18 * dt;
            glow(q.x, q.y, 9 * q.s, 'rgba(210,255,120,', 0.25 + 0.55 * Math.max(0, Math.sin(t * 1.6 * q.v + q.p)));
            break;
          case 'vesmir':  // blikající hvězdy
            dot(q.x, q.y, 1.1 * q.s, 'rgba(255,255,255,' + (0.25 + 0.6 * Math.abs(Math.sin(t * 1.3 * q.v + q.p))) + ')');
            break;
          case 'zapad':   // teplý prach stoupá
          case 'tma':     // zlaté jiskry
            q.y -= 16 * q.v * dt; q.x += Math.sin(t * 0.6 + q.p) * 8 * dt;
            if (q.y < -10) { q.y = h + 10; q.x = rnd(0, w); }
            glow(q.x, q.y, 4 * q.s, bgName === 'tma' ? 'rgba(255,200,80,' : 'rgba(255,190,120,', 0.35 + 0.35 * Math.sin(t * 2 * q.v + q.p));
            break;
          case 'ganja':   // pyl se vznáší do stran
            q.x += (14 + 10 * Math.sin(t * 0.7 + q.p)) * q.v * dt; q.y += Math.sin(t * 1.1 + q.p) * 10 * dt;
            if (q.x > w + 10) { q.x = -10; q.y = rnd(0, h); }
            glow(q.x, q.y, 3.5 * q.s, 'rgba(255,245,170,', 0.45);
            break;
        }
      });
      // vesmír: občas meteor
      if (bgName === 'vesmir') {
        if (!shoot0 || now - shoot0 > 7000) shoot0 = now + rnd(0, 3000);
        var k = (now - shoot0) / 900;
        if (k > 0 && k < 1) {
          var x0 = w * 0.85, y0 = h * 0.08, x1 = x0 - w * 0.45 * k, y1 = y0 + h * 0.3 * k;
          var g = fxc.createLinearGradient(x1, y1, x1 + 120, y1 - 80);
          g.addColorStop(0, 'rgba(255,255,255,' + (1 - k) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
          fxc.strokeStyle = g; fxc.lineWidth = 2; fxc.beginPath(); fxc.moveTo(x1, y1); fxc.lineTo(x1 + 120, y1 - 80); fxc.stroke();
        }
      }
    }
    function dot(x, y, r, c) { fxc.fillStyle = c; fxc.beginPath(); fxc.arc(x, y, r, 0, 7); fxc.fill(); }
    function glow(x, y, r, c, a) {
      if (a <= 0) return;
      var g = fxc.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, c + a + ')'); g.addColorStop(1, c + '0)');
      fxc.fillStyle = g; fxc.beginPath(); fxc.arc(x, y, r, 0, 7); fxc.fill();
    }

    fxSize(); addEventListener('resize', function () { setTimeout(fxSize, 0); });
    setBg(bgName);

    // ---------- komiksové bubliny z reproduktorů ----------
    // jedna bublina na reproduktor (nová nahradí starou); zubatý obrys výbuchu je pokaždé trochu jiný (ručně kreslený)
    var comics = { l: null, r: null }, comicTimers = { l: 0, r: 0 };
    function burstSvg() {
      var pts = [], n = 18;
      for (var i = 0; i < n * 2; i++) {
        var a = i / (n * 2) * Math.PI * 2, k = i % 2 ? 0.74 + Math.random() * 0.08 : 0.96 + Math.random() * 0.08;
        pts.push((100 + Math.cos(a) * 98 * k).toFixed(1) + ',' + (60 + Math.sin(a) * 58 * k).toFixed(1));
      }
      return '<svg class="kp-burst" viewBox="0 0 200 120" preserveAspectRatio="none" aria-hidden="true"><polygon points="' + pts.join(' ') + '"/></svg>';
    }
    function comic(side, kind, text, ms) {
      var spk = root.querySelector('.kpong-spk[data-side="' + side + '"]');
      if (!spk || !text) return;
      if (comics[side]) comics[side].remove();
      var r = spk.getBoundingClientRect(), room = side === 'l' ? r.left : innerWidth - r.right;
      var out = room > 230, el = document.createElement('div');
      el.innerHTML = (kind !== 'say' ? burstSvg() : '') + '<span>' + esc(text) + '</span>';
      if (out) {
        // vedle stroje je volno (PC): bublina vyletí ven – vlevo od levého, vpravo od pravého reproduktoru
        el.className = 'kp-comic ' + kind + ' ' + side + ' out';
        el.style.top = Math.round(r.top + r.height / 2) + 'px';
        if (side === 'l') el.style.right = Math.round(innerWidth - r.left + 4) + 'px';
        else el.style.left = Math.round(r.right + 4) + 'px';
        el.style.maxWidth = Math.round(Math.min(room - 16, 300)) + 'px';
      } else {
        // telefon: nic přes hřiště – Kevinova bublina v horním okénku pod ním (špička k němu), nápis odstřelu
        // v dolním okénku u pálky hráče
        var win = root.querySelector('.kpong-mech[data-win="' + (kind === 'say' ? 'top' : 'bot') + '"]').getBoundingClientRect();
        el.className = 'kp-comic ' + kind + (kind === 'say' ? ' top' : ' bottom');
        el.style.left = Math.round(win.left + win.width / 2) + 'px';
        el.style.top = Math.round(win.top + win.height / 2) + 'px';
        el.style.maxWidth = Math.round(win.width + 16) + 'px';
      }
      root.appendChild(el);
      comics[side] = el;
      spk.classList.remove('boom'); void spk.offsetWidth; spk.classList.add(kind === 'say' ? 'talk' : 'boom');
      liveEl.textContent = text;
      clearTimeout(comicTimers[side]);
      comicTimers[side] = setTimeout(function () {
        el.classList.add('bye'); spk.classList.remove('talk');
        setTimeout(function () { el.remove(); if (comics[side] === el) comics[side] = null; }, 260);
      }, ms);
    }
    // ---------- Kevin komentátor ----------
    var PL = (window.KEVIN_PONG_LINES || {})[lang] || {}, decks = {}, lastQuip = 0;
    // hláška ke klíči: z banky bez opakování (zamíchaný balíček), jinak z náhradního seznamu
    function line(key, fallback) {
      var list = PL[key] && PL[key].length ? PL[key] : null;
      if (!list) return fallback && fallback.length ? pick(fallback) : null;
      var d = decks[key];
      if (!d || !d.length) {
        d = decks[key] = list.map(function (_, i) { return i; });
        for (var i = d.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = d[i]; d[i] = d[j]; d[j] = x; }
      }
      return list[d.pop()];
    }
    // řekne hlášku, když zrovna nemluví (odstup 2,2 s); force = důležitá chvíle, přebije
    function quip(key, chance, fallback, ms, force) {
      var now = performance.now(), tk = TALK[talk];
      if (!tk[0]) return false;
      if (!force && (now - lastQuip < tk[1] || comics.r)) return false;
      chance = Math.min(1, chance * tk[0]);
      if (chance < 1 && Math.random() > chance) return false;
      var t = line(key, fallback);
      if (!t) return false;
      lastQuip = now;
      say(t, ms);
      return true;
    }
    function showFlash(f) { comic('l', 'burst ' + f.kind, f.text, f.kind === 'super' ? 1700 : 1300); }
    function say(t, ms) {
      if (!t) return;
      // čas na přečtení: ~60 ms na znak, nejméně 2,6 s, nejvýš 7 s (dřív mizely dřív, než se daly přečíst)
      comic('r', 'say', t, Math.max(ms || 0, Math.min(7000, Math.max(2600, 1200 + t.length * 60))));
      if (K) { K.setTalking(true); setTimeout(function () { if (K) K.setTalking(false); }, Math.min(2200, 600 + t.length * 45)); }
    }

    // ---------- stav hry ----------
    var level = +(store.get('kevinPongLevel') || 2), L = LEVELS[level];
    var you = 0, kev = 0, running = false, paused = false, started = 0, serveAt = 0, serving = 1;
    var player = { x: W / 2, target: W / 2, w: PAD_W, shotAt: -1e9, shotUsed: true, stunUntil: 0, lastHit: -1e9, boosted: false };
    // šroubek ze stroje (chytí ho pálka = vylepšení na 8 s), Kevinovo klubíčko (trojka, jednou za zápas), Kevinova nálada:
    // vede o 3 a víc = líný (pomalejší, víc se splete, zívá), prohrává o 3 a víc = snaží se
    var screw = null, nextScrewAt = 0, power = { kind: null, until: 0 }, yarn = null, yarnUsed = false, mood = 'calm';
    var MOOD = { lazy: [0.85, 1.35], calm: [1, 1], try: [1.08, 0.8] };   // [rychlost běhu, chyba odhadu]
    var kevin = { x: W / 2, target: W / 2, nextThink: 0, moving: 0, miss: 0, planned: false, shot: false };
    // přehřátí kol: heat 0–1 roste s Kevinovým během, v klidu klesá; při 1 kola kouří a Kevin do hotUntil zpomalí
    var heat = 0, heatShown = -1, hotUntil = 0, isHot = false;
    var hopik = new Image(); hopik.src = '/kevin/pong/hopik.webp' + ver;
    // obrázkové pálky a míčky: jeden list obrázků + popis dílů (vyrábí tools/catsmash-sprites.py)
    var palImg = new Image(), micImg = new Image(), PAL = null, MIC = null, onSprites = [];
    palImg.src = '/kevin/pong/palky.webp' + ver; micImg.src = '/kevin/pong/micky.webp' + ver;
    function spritesReady() { onSprites.forEach(function (f) { f(); }); }
    function loadJson(url, set) { fetch(url + ver).then(function (r) { return r.json(); }).then(function (j) { set(j); spritesReady(); }).catch(function () { /* bez obrázků zůstanou barevné */ }); }
    loadJson('/kevin/pong/palky.json', function (j) { PAL = j; });
    loadJson('/kevin/pong/micky.json', function (j) { MIC = j; });
    palImg.onload = micImg.onload = spritesReady;
    hopik.addEventListener('load', spritesReady);
    // Přívěsky pod pálkou se chovají podle materiálu (MAT podle id pálky):
    //  swing = tuhý kus, otáčí se celý kolem místa, kde visí (kov, dřevo, střapec);
    //  sway  = měkké nebo tekuté, ohýbá se (čím níž, tím víc): plyš, láva, barva;
    //  beads = tuhé korálky na šňůrce: korálky se jen posouvají, ohýbá se šňůrka;
    //  string = tuhý kus na provázku (klíček): provázek se kývá, klíček visí na jeho konci;
    //  rigid = nehýbe se vůbec (led, neon, ekvalizér, ozubená kola).
    // damp = tlumení (kov se houpe dlouho, láva skoro hned stojí), stiff = pružnost (větvička se vrací sama),
    // push = jak moc ho rozhoupe pohyb pálky (těžká láva málo, lehký plyš hodně)
    var MAT = {
      vetev: { mode: 'swing', damp: 3.2, stiff: 55, push: 0.55 },
      lava: { mode: 'sway', damp: 7, stiff: 6, push: 0.3, drip: 'lava', every: [900, 2600] },
      retez: { mode: 'swing', damp: 1.1, stiff: 0, push: 1 },
      graffiti: { mode: 'sway', damp: 6, stiff: 10, push: 0.3, drip: 'paint', every: [1800, 4200] },
      plys: { mode: 'sway', damp: 3, stiff: 8, push: 0.8 },
      jadeit: { mode: 'swing', damp: 1.6, stiff: 0, push: 1 },
      perly: { mode: 'beads', damp: 2.2, stiff: 0, push: 0.7 },
      mince: { mode: 'swing', damp: 1.2, stiff: 0, push: 1 },
      cip: { mode: 'swing', damp: 1.3, stiff: 0, push: 1 },
      led: { mode: 'rigid' }, neon: { mode: 'rigid' }, ekvalizer: { mode: 'rigid' }, kola: { mode: 'rigid' }
    };
    var hang = [], hangSkin = -1, padMove = { last: null, v: 0, t: 0 }, HANG_G = 2200;
    function padSprite(i) { var s = SKINS[i]; return s && s.img && PAL && PAL[s.img] && palImg.complete && palImg.naturalWidth ? PAL[s.img] : null; }
    function matOf(i) { return MAT[SKINS[i] && SKINS[i].img] || { mode: 'rigid' }; }
    function partMode(mat, p) { return p.fixed || mat.mode === 'rigid' ? 'fixed' : p.mode || mat.mode; }
    // délka kyvadla v herních bodech: tuhý kus = od čepu k těžišti, provázek = provázek + půl klíčku,
    // měkký = celá délka, korálky = hloubka smyčky
    function pendLen(mat, p, s) {
      var m = partMode(mat, p);
      if (m === 'string') return (p.cord + Math.hypot(p.img[2], p.img[3]) * p.scale * 0.5) * s;
      if (m === 'swing') return Math.max(8, (p.y - p.py + p.img[3]) * s * 0.6);
      return Math.max(8, (p.y + p.img[3]) * s * 0.85);
    }
    function hangTick(now) {
      var sp = padSprite(skin), mat = matOf(skin);
      if (hangSkin !== skin) { hang = []; hangSkin = skin; drips = []; dripNext = []; }
      var dt = padMove.t ? Math.min(0.05, (now - padMove.t) / 1000) : 0;
      padMove.t = now;
      if (!sp || mat.mode === 'rigid' || dt <= 0 || now < hitStop) return;
      var v = padMove.last == null ? 0 : (player.x - padMove.last) / dt;
      var acc = clamp((v - padMove.v) / dt, -30000, 30000) * mat.push;
      padMove.last = player.x; padMove.v = v;
      var s = PAD_W / sp.w;
      sp.parts.forEach(function (p, i) {
        if (partMode(mat, p) === 'fixed') return;
        if (mat.mode === 'beads') i = 0;                // korálky na jedné šňůrce = jedno kyvadlo
        var st = hang[i] || (hang[i] = { a: 0, w: 0, L: pendLen(mat, p, s), done: 0 });
        if (st.done === now) return;
        st.done = now;
        for (var k = 0; k < 3; k++) {
          var h = dt / 3;
          st.w += (-(HANG_G / st.L) * Math.sin(st.a) - mat.stiff * st.a - (acc / st.L) * Math.cos(st.a) - mat.damp * st.w) * h;
          st.a = clamp(st.a + st.w * h, -1.1, 1.1);
        }
      });
    }
    function hangKick(strength) {
      var mat = matOf(skin);
      hang.forEach(function (st) { if (st) st.w += (Math.random() - 0.5) * strength * (mat.push || 0); });
    }
    var HANG_REST = { a: 0, w: 0 };
    // kapky z lávy a barvy: na špičce čůrku se kapka nalije (0,65 s), odtrhne se a spadne (tips = poloha špiček teď)
    var drips = [], dripNext = [], dripT = 0;
    function dripTick(mat, tips, now) {
      var dt = dripT ? Math.min(0.05, (now - dripT) / 1000) : 0;
      dripT = now;
      if (paused || now < hitStop) dt = 0;
      tips.forEach(function (t, i) {
        if (!t) return;
        if (!dripNext[i]) dripNext[i] = now + rnd(0, mat.every[1]);
        if (now >= dripNext[i] && dt > 0) {
          drips.push({ i: i, x: t[0], y: t[1], vy: 0, r: 0, hang: true, age: 0, c: t[2] });
          dripNext[i] = now + rnd(mat.every[0], mat.every[1]);
        }
      });
      drips = drips.filter(function (d) {
        d.age += dt;
        if (d.hang) {
          var t = tips[d.i];
          if (!t) return false;
          var k = d.age / 0.65;
          d.r = 2.3 * Math.min(1, k); d.x = t[0]; d.y = t[1] + d.r * 0.7;
          if (k >= 1) { d.hang = false; d.vy = 20; }
        } else {
          d.vy += 1300 * dt; d.y += d.vy * dt;
        }
        return d.y < H + 12;
      });
    }
    function drawDrips(kind) {
      drips.forEach(function (d) {
        var stretch = d.hang ? 1.15 : 1 + Math.min(1.6, d.vy / 500);   // padající kapka se protáhne
        cx.save(); cx.translate(d.x, d.y); cx.scale(1 / Math.sqrt(stretch), stretch);
        if (kind === 'lava') {
          cx.globalCompositeOperation = 'lighter';
          var g = cx.createRadialGradient(0, 0, 0, 0, 0, d.r * 2.6);
          g.addColorStop(0, 'rgba(255, 220, 120, .9)'); g.addColorStop(0.35, 'rgba(255, 120, 20, .7)'); g.addColorStop(1, 'rgba(200, 40, 0, 0)');
          cx.fillStyle = g; cx.beginPath(); cx.arc(0, 0, d.r * 2.6, 0, 7); cx.fill();
          cx.globalCompositeOperation = 'source-over';
          cx.fillStyle = '#ffd36b'; cx.beginPath(); cx.arc(0, 0, d.r, 0, 7); cx.fill();
        } else {
          cx.fillStyle = 'rgb(' + d.c.join(',') + ')'; cx.beginPath(); cx.arc(0, 0, d.r, 0, 7); cx.fill();
          cx.fillStyle = 'rgba(255, 255, 255, .55)'; cx.beginPath(); cx.arc(-d.r * 0.35, -d.r * 0.35, d.r * 0.3, 0, 7); cx.fill();
        }
        cx.restore();
      });
    }
    // obrázková pálka: horní hrana těla = plocha odrazu (top). Koncovky se nenatahují, střed ano (velká pálka).
    function drawSpritePad(sp, x, top, w, glow, still, skinIdx) {
      var mat = matOf(skinIdx == null ? skin : skinIdx);
      var s = PAD_W / sp.w, kx = w / (sp.w * s), left = x - w / 2, b = sp.body;
      var cap = Math.min(sp.split * 0.6, b[2] / 3), capD = cap * s, bh = b[3] * s;
      if (glow) { cx.shadowColor = glow; cx.shadowBlur = 18; }
      cx.drawImage(palImg, b[0], b[1], cap, b[3], left, top, capD, bh);
      cx.drawImage(palImg, b[0] + cap, b[1], b[2] - 2 * cap, b[3], left + capD - 0.3, top, w - 2 * capD + 0.6, bh);
      cx.drawImage(palImg, b[0] + b[2] - cap, b[1], cap, b[3], left + w - capD, top, capD, bh);
      cx.shadowBlur = 0;
      var y0 = top + sp.split * s;
      // korálky: posun bodu ve smyčce (čím hlouběji, tím víc do strany, a trochu nahoru, ať šňůrka nemění délku)
      var loop = still ? HANG_REST : hang[0] || HANG_REST, deep = sp.loopDepth || 1;
      function beadShift(yb) {
        var f = Math.max(0, yb) / deep, dx = Math.sin(loop.a) * deep * s * f;
        return [dx, -(1 - Math.cos(loop.a)) * deep * s * f * f];
      }
      if (mat.mode === 'beads' && sp.cord) {
        var pts = sp.cord.map(function (q) { var d = beadShift(q[1]); return [left + q[0] * s * kx + d[0], y0 + q[1] * s + d[1]]; });
        cx.strokeStyle = 'rgba(236, 226, 236, .9)'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(pts[0][0], pts[0][1]);
        for (var c = 1; c < pts.length - 1; c++) cx.quadraticCurveTo(pts[c][0], pts[c][1], (pts[c][0] + pts[c + 1][0]) / 2, (pts[c][1] + pts[c + 1][1]) / 2);
        cx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); cx.stroke();
      }
      var tips = [];
      sp.parts.forEach(function (p, i) {
        var im = p.img, m = partMode(mat, p), st = still ? HANG_REST : hang[i] || HANG_REST;
        if (m === 'fixed') {
          cx.drawImage(palImg, im[0], im[1], im[2], im[3], left + p.x * s * kx, y0 + p.y * s, im[2] * s * kx, im[3] * s);
          return;
        }
        if (m === 'beads') {                             // korálek je tuhý: jen se posune
          var d = beadShift(p.y + im[3] / 2);
          cx.drawImage(palImg, im[0], im[1], im[2], im[3], left + p.x * s * kx + d[0], y0 + p.y * s + d[1], im[2] * s, im[3] * s);
          return;
        }
        var px = left + p.px * s * kx, py = y0 + p.py * s;
        if (m === 'string') {                            // provázek od pálky, na konci klíček (visí svisle podél provázku)
          var ay = y0 + 4 * s, rx = px + Math.sin(st.a) * p.cord * s, ry = ay + Math.cos(st.a) * p.cord * s, k = s * p.scale;
          cx.strokeStyle = 'rgba(90, 30, 40, .95)'; cx.lineWidth = 1.3;
          cx.beginPath(); cx.moveTo(px - 1, ay); cx.lineTo(rx - 0.6, ry); cx.moveTo(px + 1, ay); cx.lineTo(rx + 0.6, ry); cx.stroke();
          cx.save(); cx.translate(rx, ry); cx.rotate(-st.a); cx.rotate(p.rot);
          cx.drawImage(palImg, im[0], im[1], im[2], im[3], -p.ring[0] * k, -p.ring[1] * k, im[2] * k, im[3] * k);
          cx.restore();
          return;
        }
        if (m === 'swing') {
          cx.save(); cx.translate(px, py); cx.rotate(-st.a);
          cx.drawImage(palImg, im[0], im[1], im[2], im[3], (p.x - p.px) * s, (p.y - p.py) * s, im[2] * s, im[3] * s);
          cx.restore();
          return;
        }
        var bottom = p.y + im[3], reach = Math.sin(st.a) * bottom * s;   // sway: měkké se ohýbá po řádcích
        function dxAt(yb) { return reach * Math.pow(Math.max(0, yb) / bottom, 1.4); }
        var left0 = left + p.x * s * kx;
        for (var r = 0; r < im[3]; r += 3) {
          var hh = Math.min(3, im[3] - r);
          cx.drawImage(palImg, im[0], im[1] + r, im[2], hh, left0 + dxAt(p.y + r + hh / 2), y0 + (p.y + r) * s, im[2] * s, hh * s + 0.4);
        }
        if (p.tip) tips[i] = [left0 + (p.tip[0] - p.x) * s + dxAt(p.tip[1]), y0 + p.tip[1] * s, p.tip.slice(2)];
      });
      if (mat.drip && !still) { dripTick(mat, tips, performance.now()); drawDrips(mat.drip); }
    }
    var ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, speed: 0, trail: [], fire: false, mishit: false };
    var combo = 0, hitStop = 0, flash = null, awaitStart = false, pausedMs = 0;
    // co se v zápase stalo (pro odznaky): perfektní odstřely, SUPER, přehřátí kol, nejdelší výměna, klubíčko
    var mt = { perfect: 0, superHit: false, overheats: 0, maxRally: 0, yarn: false };
    var gamesPlayed = 0, streakP = 0, streakK = 0, maxDown = 0, comebackSaid = false, rally = 0, fastSaid = false;
    var lastTarget = 0, lastMoveAt = 0, idleSaid = false;
    var coarse = window.matchMedia('(pointer: coarse)').matches;
    // komár: během zápasu rušil (uživatel 2026-10-27) → sám už nepřiletí; ?komar=1 nebo #komar v adrese = zkouška scénky
    var MOSQUITO_CHANCE = /[?&]komar=1(&|$)/.test(location.search) || location.hash === '#komar' ? 1 : 0;
    var mosq = { done: false, active: false };
    var keys = { left: false, right: false }, raf = 0, last = 0, signedIn = false, csrf = null;

    // ---------- nastavení hráče (⚙, pamatuje si je prohlížeč) ----------
    // upovídanost: [násobek šance na hlášku, odstup mezi běžnými hláškami v ms]; mlčí = žádné komentáře
    // (scénka s komárem a otázky „pokračujem?“ mluví dál)
    var TALK = { more: [1.6, 3500], normal: [1, 6000], less: [0.4, 11000], mute: [0, 1e9] }, TALK_KEYS = ['more', 'normal', 'less', 'mute'];
    var talk = TALK[store.get('kevinPongTalk')] ? store.get('kevinPongTalk') : 'normal';
    var vibOn = store.get('kevinPongVib') !== '0', lefty = store.get('kevinPongLefty') === '1';
    // citlivost klávesnice: násobek rychlosti pálky na šipkách (0,5 = pomalá a přesná, 2 = rychlá)
    var keySpeed = clamp(+(store.get('kevinPongKeys') || 1) || 1, 0.5, 2);
    root.classList.toggle('lefty', lefty);
    // vzhledy pálky: Klasik pro všechny, obrázkové pálky odemyká odznak (b); pamatuje se podle id
    var SKINS = [
      { id: 'klasik', pad: ['#f2f2f4', '#9a9aa4'], rim: '#ffd23f', glow: 'rgba(255, 200, 60, .9)', trail: '#e6b730' },
      // obrázkové pálky (img = klíč v kevin/pong/palky.json z tools/catsmash-sprites.py); pad = barvy pro záložní kreslení
      { b: 'easy', img: 'vetev', pad: ['#c79a62', '#5a3a1c'], rim: '#8fd16a', glow: 'rgba(120, 200, 90, .9)', trail: '#9ccf6a' },
      { b: 'clean', img: 'led', pad: ['#eef8ff', '#8fc6e8'], rim: '#cdeeff', glow: 'rgba(170, 225, 255, .95)', trail: '#bfe6ff' },
      { b: 'overheat', img: 'lava', pad: ['#5a5550', '#1c1a18'], rim: '#ff8a2a', glow: 'rgba(255, 110, 20, .95)', trail: '#ff6a1a' },
      { b: 'angry', img: 'retez', pad: ['#ffe27a', '#a67c00'], rim: '#ffd23f', glow: 'rgba(255, 210, 63, 1)', trail: '#e6b730' },
      { b: 'comeback', img: 'graffiti', pad: ['#3a3a40', '#111114'], rim: '#ff5fd2', glow: 'rgba(120, 220, 255, .9)', trail: '#ffcf3a' },
      { b: 'yarn', img: 'plys', pad: ['#ffffff', '#cfcfd6'], rim: '#ffc2cf', glow: 'rgba(255, 190, 205, .9)', trail: '#ffd6df' },
      { b: 'night', img: 'neon', pad: ['#2a2a35', '#08080c'], rim: '#7df9ff', glow: 'rgba(200, 110, 255, .95)', trail: '#b46bff' },
      { b: 'super', img: 'ekvalizer', pad: ['#2a2a2a', '#050505'], rim: '#e6b730', glow: 'rgba(230, 183, 48, .9)', trail: '#e6b730' },
      { b: 'loyal', img: 'jadeit', pad: ['#8fd6a8', '#2f7a4c'], rim: '#7fd6a0', glow: 'rgba(110, 210, 150, .9)', trail: '#6fcf97' },
      { b: 'wardrobe', img: 'perly', pad: ['#ffffff', '#d9cfe0'], rim: '#fff4fb', glow: 'rgba(255, 240, 250, .95)', trail: '#f3e6ff' },
      { b: 'wins50', img: 'mince', pad: ['#ffd76a', '#8a6400'], rim: '#ffd23f', glow: 'rgba(255, 200, 60, .95)', trail: '#d9a441' },
      { b: 'sniper', img: 'cip', pad: ['#3a3330', '#0e0b0a'], rim: '#e6b730', glow: 'rgba(90, 255, 160, .8)', trail: '#59f0a0' },
      { b: 'tinker', img: 'kola', pad: ['#e0a36a', '#7a4320'], rim: '#e0a36a', glow: 'rgba(224, 150, 90, .9)', trail: '#c9844a' }
    ];
    SKINS.forEach(function (s) { s.id = s.id || s.img; s.ok = function () { return hasBadge(s.b); }; });
    // (staré číselné kevinPongSkin / kevinPongBall patřily ke zrušeným barevným pálkám a míčkům → začne se od základu)
    var skin = Math.max(0, SKINS.map(function (s) { return s.id; }).indexOf(store.get('kevinPongPad')));
    if (!SKINS[skin] || !SKINS[skin].ok()) skin = 0;
    // míčky: hopík pro všechny, ostatní odemkne odznak; kreslí je drawBall
    var BALLS = [{ id: 'hopik' },
      // obrázkové míčky (kevin/pong/micky.json): ke každé obrázkové pálce jeden do páru + mramor
      { id: 'kastan', b: 'easy' }, { id: 'ledovka', b: 'clean' }, { id: 'lavak', b: 'overheat' }, { id: 'tlapka', b: 'angry' },
      { id: 'sprej', b: 'comeback' }, { id: 'plysak', b: 'yarn' }, { id: 'vir', b: 'night' }, { id: 'repro', b: 'super' },
      { id: 'jadeitak', b: 'loyal' }, { id: 'perla', b: 'wardrobe' }, { id: 'procesor', b: 'sniper' }, { id: 'hodinky', b: 'tinker' },
      { id: 'mramor', b: 'close' }];
    var ballType = Math.max(0, BALLS.map(function (b) { return b.id; }).indexOf(store.get('kevinPongBallId')));
    if (!BALLS[ballType] || !hasBadge(BALLS[ballType].b)) ballType = 0;
    function vibe(p) { if (vibOn && navigator.vibrate) try { navigator.vibrate(p); } catch (e) { /* nevadí */ } }

    // ---------- zvuky stroje (Web Audio, nic se nestahuje; hrají jen po zapnutí v ⚙) ----------
    var vol = +(store.get('kevinPongVol') || 0), ac = null, master = null, noiseBuf = null;
    function audio() {
      if (!vol) return null;
      if (!ac) {
        var C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        ac = new C(); master = ac.createGain(); master.connect(ac.destination);
        noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        var d = noiseBuf.getChannelData(0);
        for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ac.state === 'suspended') ac.resume();
      master.gain.value = vol * 0.6;
      return ac;
    }
    // at = za kolik sekund zazní (odstřel: náboj teď, rána až po zastavení času)
    function tone(f, dur, type, gain, f2, at) {
      var a = audio();
      if (!a) return;
      var t = a.currentTime + (at || 0), o = a.createOscillator(), g = a.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      g.gain.setValueAtTime(gain || 0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
    }
    function noise(dur, freq, gain, q, type, at, f2) {
      var a = audio();
      if (!a) return;
      var t = a.currentTime + (at || 0), s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      s.buffer = noiseBuf; f.type = type || 'bandpass'; f.frequency.setValueAtTime(freq, t); f.Q.value = q || 1;
      if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur);
      g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
    }
    var sfx = {
      pad: function (kevinSide) { tone(kevinSide ? 330 : 440, 0.09, 'triangle', 0.35, kevinSide ? 260 : 360); noise(0.04, 1800, 0.12); },   // bonk
      wall: function () { tone(880, 0.04, 'sine', 0.08); },
      // odstřel (vybral uživatel, varianta 27): elektrický náboj po dobu zastavení času, pak prásknutí jiskry,
      // suchý úder a hopík slyšitelně odsviští pryč; bez náboje (obyčejný odstřel) jen kratší rána
      shot: function (charge) {
        if (charge) zap(charge);
        var c = charge || 0;
        noise(0.03, 5000, charge ? 0.9 : 0.6, 0.7, 'highpass', c); tone(2600, 0.04, 'square', 0.12, 500, c);            // prásknutí
        tone(180, 0.09, 'sine', 1, 60, c); noise(0.03, 1800, 0.6, 1, 'bandpass', c); noise(0.06, 600, 0.5, 0.7, 'lowpass', c);   // úder
        noise(charge ? 0.45 : 0.25, 3000, 0.45, 2.5, 'bandpass', c + 0.02, 400);                                      // svist pryč
      },
      miss: function () { tone(220, 0.25, 'square', 0.1, 110); },
      goal: function (mine) { tone(mine ? 523 : 392, 0.14, 'triangle', 0.25); setTimeout(function () { tone(mine ? 784 : 262, 0.22, 'triangle', 0.25); }, 130); },
      click: function () { noise(0.015, 3200, 0.05, 6); },     // cvaknutí zubu
      hiss: function () { noise(1.6, 5000, 0.18, 0.4); }       // syčení přehřátých kol
    };
    // elektrický náboj: pila stoupá a chvěje se čím dál rychleji
    function zap(dur) {
      var a = audio();
      if (!a) return;
      var t = a.currentTime, o = a.createOscillator(), lfo = a.createOscillator(), lg = a.createGain(), trem = a.createGain(), g = a.createGain(), f = a.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(1600, t + dur);
      lfo.frequency.setValueAtTime(12, t); lfo.frequency.exponentialRampToValueAtTime(70, t + dur); lg.gain.value = 0.5; trem.gain.value = 0.5;
      f.type = 'lowpass'; f.frequency.setValueAtTime(600, t); f.frequency.exponentialRampToValueAtTime(6000, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + dur * 0.95); g.gain.linearRampToValueAtTime(0.0001, t + dur);
      lfo.connect(lg); lg.connect(trem.gain);
      o.connect(f); f.connect(trem); trem.connect(g); g.connect(master); o.start(t); lfo.start(t); o.stop(t + dur + 0.02); lfo.stop(t + dur + 0.02);
    }
    // bzučení komára: pila se chvěním, dokud ho Kevin netrefí
    function buzzStart() {
      var a = audio();
      if (!a) return null;
      var o = a.createOscillator(), l = a.createOscillator(), lg = a.createGain(), g = a.createGain();
      o.type = 'sawtooth'; o.frequency.value = 620; l.frequency.value = 7; lg.gain.value = 40; g.gain.value = 0.04;
      l.connect(lg); lg.connect(o.frequency); o.connect(g); g.connect(master); o.start(); l.start();
      return { stop: function () { try { g.gain.setTargetAtTime(0, a.currentTime, 0.05); o.stop(a.currentTime + 0.3); l.stop(a.currentTime + 0.3); } catch (e) { /* už stojí */ } } };
    }

    function resetBall(towardPlayer) {
      ball.x = W / 2; ball.y = H / 2; ball.trail = [];
      ball.speed = L.speed;
      var a = (Math.random() * 0.6 - 0.3);
      ball.vx = Math.sin(a) * ball.speed;
      ball.vy = (towardPlayer ? 1 : -1) * Math.cos(a) * ball.speed;
      ball.fire = false; ball.mishit = false; ball.perfect = false; player.boosted = false; rally = 0; fastSaid = false;
      kevin.planned = false; kevin.shot = false;
      if (!towardPlayer) aimError();
      serveAt = awaitStart ? Infinity : performance.now() + 1200;   // chvilka na nádech; první podání čeká na hráče
    }

    // kde míč protne čáru y (se odrazy od stran) – Kevin podle toho běží
    function predictX(y) {
      if (ball.vy === 0) return ball.x;
      var t = (y - ball.y) / ball.vy;
      if (t < 0) return W / 2;
      var x = ball.x + ball.vx * t, span = W - 2 * BALL_R, p = ((x - BALL_R) % (2 * span) + 2 * span) % (2 * span);
      return BALL_R + (p > span ? 2 * span - p : p);
    }

    // Kevinova chyba pro tenhle let míčku: větší s počtem odrazů od stěn a s rychlostí míčku
    function aimError() {
      var t = Math.abs((PLAYER_Y - KEVIN_Y) / (ball.vy || 1)), walls = Math.floor(Math.abs(ball.vx) * t / (W - 2 * BALL_R));
      kevin.miss = gauss() * L.err * MOOD[mood][1] * W * (1 + L.bounceErr * walls) * Math.max(1, ball.speed / L.speed);
    }

    // výška zvednuté pálky: nahoru za SHOT_IDEAL ms, chvíli drží, pak dolů
    function liftAt(now) {
      var t = now - player.shotAt;
      if (t < 0 || t > 260) return 0;
      return LIFT * (t < SHOT_IDEAL ? t / SHOT_IDEAL : t < 140 ? 1 : 1 - (t - 140) / 120);
    }

    // hráč je připravený: odpočet 3–2–1, pak první podání (čas hry i na serveru běží až od teď), nebo hopík
    // poletí dál, kde se zastavil (po komárovi, nastavení, návratu do okna)
    function kickOff() {
      if (!awaitStart || !running) return false;
      var first = awaitStart === 'start';
      awaitStart = false;
      serveAt = performance.now() + 1500;
      if (first) {
        started = performance.now(); pausedMs = 0;
        if (signedIn) post('/api/pong/start', { d: level }).catch(function () { /* hraje se i tak */ });
      }
      return true;
    }
    // pauza skončila: hra počká, až hráč ťukne („Ťukni a jedem!“), pak odpočet
    function askToResume(line) {
      if (!running) return;
      paused = false; awaitStart = 'resume'; serveAt = Infinity;
      if (line) say(line, 2600);
    }
    function shoot() {
      if (kickOff()) return;
      var now = performance.now();
      if (!running || paused || now - player.shotAt < 380) return;
      player.shotAt = now; player.shotUsed = false;
      // kliknuto chvilku PO dotyku: míček ještě zrychlí, ale slaběji (odchylka = zpoždění + SHOT_IDEAL)
      if (ball.vy < 0 && !player.boosted && now - player.lastHit < 160) boost(now - player.lastHit + SHOT_IDEAL, now);
    }

    function boost(off, now) {
      player.shotUsed = true;
      var tier = SHOT.filter(function (s) { return off <= s[0]; })[0];
      if (!tier) return mishit(now);
      var mult = tier[1], kind = tier[2];
      if (kind === 'perfect') { combo++; if (combo >= 3) { kind = 'super'; mult = SHOT_SUPER; combo = 0; ball.fire = true; } }
      else combo = 0;
      if (kind === 'perfect' || kind === 'super') mt.perfect++;
      if (kind === 'super') mt.superHit = true;
      player.boosted = true;
      ball.speed *= mult; ball.vx *= mult; ball.vy *= mult;
      aimError();
      flash = { kind: kind, text: T.shots ? T.shots[kind] : kind, at: now };
      showFlash(flash);
      sfx.shot(kind === 'super' ? 0.3 : kind === 'perfect' ? 0.22 : 0);
      if (kind === 'perfect' || kind === 'super') {
        hitStop = now + (kind === 'super' ? 300 : 220);         // zastavení času = nabití energie (zvuk náboje), pak výstřel
        vibe(kind === 'super' ? [30, 40, 60] : 35);
      }
      field.classList.remove('shot', 'shot-super'); void field.offsetWidth; field.classList.add(kind === 'super' ? 'shot-super' : 'shot');
      ball.perfect = kind === 'perfect' || kind === 'super';
      if (kind === 'super') quip('odstrel_super', 1, null, 0, true);
      else if (kind === 'perfect') quip('odstrel_perfekt', 0.3);
      else quip('odstrel_dobry', 0.1);
    }

    // pokažený odstřel: míček nezrychlí (ani o běžné zrychlení odrazu), naopak trochu zpomalí – ne pod 90 % základní
    // rychlosti; Kevin ho vidí jasně (žádná chyba odhadu) a vrátí ho šikmo (viz punish)
    function mishit(now) {
      combo = 0; player.boosted = true;
      var k = Math.max(L.speed * 0.9, ball.speed / L.gain * 0.88) / ball.speed;
      ball.speed *= k; ball.vx *= k; ball.vy *= k;
      ball.mishit = true; kevin.miss = 0;
      flash = { kind: 'miss', text: T.shots ? T.shots.miss : 'miss', at: now };
      showFlash(flash);
      sfx.miss();
      quip('odstrel_pokazeny', 0.25);
    }

    // Kevinův trest za pokažený odstřel: míří do rohu dál od hráče – rovně, nebo přes odraz od stěny, podle toho,
    // co dá ostřejší úhel (max. ~63°); míček přitom o kousek zrychlí
    function punish() {
      var far = player.x < W / 2 ? W - BALL_R - 24 : BALL_R + 24, dy = PLAYER_Y - ball.y;
      var direct = Math.atan2(far - ball.x, dy);
      var wallX = far > W / 2 ? 2 * BALL_R - far : 2 * (W - BALL_R) - far;   // zrcadlo přes protější stěnu
      var bank = Math.atan2(wallX - ball.x, dy);
      var a = Math.abs(bank) <= 1.1 && Math.abs(bank) > Math.abs(direct) ? bank : clamp(direct, -1.1, 1.1);
      var sp = Math.min(L.max, ball.speed * 1.12);
      ball.speed = sp; ball.vx = Math.sin(a) * sp; ball.vy = Math.cos(a) * sp; ball.mishit = false;
      quip('trest', 0.5);
    }

    // ---------- komár: scénka ----------
    // 1) přiletí a 2–3 s krouží nad strojem, hra běží; občas vletí Kevinovi za záda (menší, tmavší, za ním).
    // 2) Kevin ho uvidí, jen když mu letí před očima (čelem k nám = vidí vše vpředu, bokem jen na tu stranu,
    //    kam kouká); za zády ho jen uslyší („Co to bzučí?“) a otočí se. Pak pauza.
    // 3) Kevin seskočí z kola na horní hranu stroje a honí ho: dvakrát vyskočí vedle (komár uhne), napotřetí
    //    ho trefí, omráčený komár spadne. 4) Kevin doběhne zpátky, vyskočí na kolo, hláška, hra jede dál.
    // Vše v pixelech obrázku rámu; Kevinova chodidla stojí na kole v (384, 60), horní hrana stroje je y = 112.
    var KF = { x: 384, y: 60 }, EDGE_Y = 112, RUN = [170, 598];
    function placeKevin(x, y) {
      var u = parseFloat(frame.style.getPropertyValue('--u')) || 0.5;
      kevCanvas.style.transform = 'translate(' + ((x - KF.x) * u).toFixed(1) + 'px, ' + ((y - KF.y) * u).toFixed(1) + 'px)';
    }
    function mosquito() {
      mosq.done = true;
      if (Math.random() >= MOSQUITO_CHANCE) return;
      mosq.active = true;
      var M = T.mosquito || {};
      var el = document.createElement('div');
      el.className = 'kpong-mosq';
      frame.appendChild(el);
      var buzz = buzzStart();
      var side = Math.random() < 0.5 ? 1 : -1;
      var m = { x: side > 0 ? -30 : FRAME_W + 30, y: rnd(-40, 40), tx: 384, ty: 0, behind: false, speed: 1 };
      var t0 = performance.now(), phase = 'fly', seenFor = 0, lastT = t0, kx = KF.x, ky = KF.y, raf2 = 0;
      function newTarget(far) {
        var cx = far ? (m.x < 384 ? rnd(480, 640) : rnd(130, 290)) : kx + rnd(-170, 170);
        m.tx = clamp(cx, 110, 660); m.ty = rnd(-80, 70);
      }
      newTarget(false);
      function tick() {
        if (!root.isConnected) return;
        var now = performance.now(), dt = Math.min(0.05, (now - lastT) / 1000), el0 = now - t0;
        lastT = now;
        // komár: míří k cíli, kličkuje; u cíle si vybere nový; občas zalétne za Kevina
        var dx = m.tx - m.x, dy = m.ty - m.y, d = Math.hypot(dx, dy);
        if (d < 14) { newTarget(false); if (phase === 'fly') m.behind = Math.random() < 0.45; }
        var v = 190 * m.speed;
        m.x += dx / (d || 1) * v * dt + Math.sin(now / 90) * 0.9;
        m.y += dy / (d || 1) * v * dt + Math.cos(now / 70) * 0.9;
        el.style.setProperty('--mx', m.x.toFixed(1));
        el.style.setProperty('--my', m.y.toFixed(1));
        el.classList.toggle('left', dx < 0);
        el.classList.toggle('behind', m.behind && phase === 'fly');
        if (phase === 'fly') {
          // vidí ho? (yaw 0 = čelem k nám, + doprava, − doleva)
          var yaw = K ? K.yaw : 0, inFront = !m.behind && (Math.abs(yaw) < 0.6 || (yaw > 0 ? m.x > kx - 20 : m.x < kx + 20));
          seenFor = inFront ? seenFor + dt : 0;
          if (el0 > 2000 && seenFor > 0.3) startChase('see');
          else if (el0 > 3200) startChase('hear');
        }
        raf2 = requestAnimationFrame(tick);
      }
      raf2 = requestAnimationFrame(tick);

      function startChase(how) {
        phase = how; paused = true; m.behind = false;
        if (K) { K.hold(null, 0.2); K.setSpeed(1); }
        if (how === 'hear') {
          say(line('komar_slysi', M.hear), 1800);
          if (K) { K.look(m.x < kx ? -1 : 1, -0.6); K.turn(m.x < kx ? -Math.PI / 2 : Math.PI / 2); }
          setTimeout(function () { say(line('komar_prilet', M.pause), 1800); chase(0); }, 1300);
        } else {
          say(line('komar_prilet', M.pause), 1800);
          setTimeout(function () { chase(0); }, 500);
        }
      }
      // přesun Kevina: běh po hraně (x), skok obloukem (výška), vše jako jedna animace v čase
      function move(toX, toY, ms, arc, clip, then) {
        var fx = kx, fy = ky, s0 = performance.now();
        if (K && clip) K.hold(clip, 0.15);
        if (K && toX !== fx) K.turn(toX > fx ? Math.PI / 2 : -Math.PI / 2);
        (function step2() {
          if (!root.isConnected) return;
          var k = Math.min(1, (performance.now() - s0) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          kx = fx + (toX - fx) * (arc ? k : e);
          ky = fy + (toY - fy) * (arc ? k : e) - (arc ? Math.sin(Math.PI * k) * arc : 0);
          placeKevin(kx, ky);
          if (k < 1) requestAnimationFrame(step2); else then && then();
        })();
      }
      // pokus n: doběhne pod komára, vyskočí; dva pokusy vedle (komár uhne), třetí trefa
      function chase(n) {
        var target = clamp(m.x, RUN[0], RUN[1]);
        var first = n === 0, runTo = function () {
          var dist = Math.abs(target - kx), ms = Math.max(250, dist / 300 * 1000);
          move(target, EDGE_Y, ms, 0, K && K.has('sprint') ? 'sprint' : 'run3', jump);
        };
        if (first) move(kx + (target > kx ? 40 : -40), EDGE_Y, 420, 40, K && K.has('jumpDown') ? 'jumpDown' : null, runTo);   // seskok z kola
        else runTo();
        function jump() {
          m.speed = 0.5; m.tx = kx; m.ty = EDGE_Y - 150;                     // komár se zastaví nad ním
          if (K) { K.turn(0); K.look(0, -1); }
          setTimeout(function () {
            var hit = n >= 2;
            if (PL.komar_lov) say(line('komar_lov'), 900);
            move(kx, EDGE_Y, 640, 95, K && K.has('hangJump') ? 'hangJump' : null, function () {
              if (K && K.has('landSoft')) K.once('landSoft');
              if (hit) return caught();
              say(line('komar_vedle', M.jump), 1400);
              setTimeout(function () { chase(n + 1); }, 450);
            });
            setTimeout(function () {                                         // ve výskoku: uhne, nebo trefa
              if (hit) { stun(); return; }
              m.speed = 2.2; newTarget(true);
            }, 300);
          }, 250);
        }
      }
      function stun() {
        cancelAnimationFrame(raf2);
        if (buzz) buzz.stop();
        var u = parseFloat(frame.style.getPropertyValue('--u')) || 0.5;
        el.classList.remove('behind'); el.classList.add('hit');
        el.animate([{ transform: 'translate(-50%, -50%) rotate(0deg)' }, { transform: 'translate(-50%, calc(-50% + ' + Math.round(900 * u) + 'px)) rotate(200deg)', opacity: 0 }],
          { duration: 1300, easing: 'cubic-bezier(.5, 0, .9, .6)', fill: 'forwards' });
        vibe(25);
      }
      function caught() {
        if (K) { K.hold(null, 0.2); K.turn(0); K.look(0, 0); K.expression(2, 1600); }
        say(line('komar_po', M.after), 2400);
        setTimeout(function () {
          move(KF.x, EDGE_Y, Math.max(250, Math.abs(KF.x - kx) / 260 * 1000), 0, K && K.has('run3') ? 'run3' : 'walk', function () {
            move(KF.x, KF.y, 420, 50, null, function () {                    // výskok zpátky na kolo
              if (K) { K.hold(null, 0.2); K.turn(0); }
              kevCanvas.style.transform = '';
              el.remove(); mosq.active = false; lastMove = null;
              askToResume(line('pokracovat', M.ask));
            });
          });
        }, 1200);
      }
    }

    function step(now) {
      raf = requestAnimationFrame(step);
      var real = last ? now - last : 0, dt = Math.min(0.034, real / 1000); last = now;
      if (running && (paused || awaitStart)) {
        pausedMs += real;
        if (hotUntil > now) hotUntil += real;
        if (power.kind) power.until += real;
        if (yarn) { yarn.until += real; yarn.land += real; yarn.at += real; }   // (nitka se mezitím jen nehýbe)
        nextScrewAt += real;
      }   // pauzy, komár, nastavení, čekání na ťuknutí
      if (!running || paused) { draw(now); return; }
      // zastavení času po perfektním odstřelu: všechno stojí, jen se kreslí
      if (now < hitStop) { draw(now); return; }
      // hráč se 10 s nehne (ne při čekání na start) a vzácná hláška zhruba jednou za minutu ticha
      if (Math.abs(player.target - lastTarget) > 1) { lastTarget = player.target; lastMoveAt = now; idleSaid = false; }
      if (!awaitStart && !idleSaid && now - lastMoveAt > 10000) { idleSaid = true; quip('nehybe_se', 1); }
      else if (awaitStart && !idleSaid && now - lastMoveAt > 9000) { idleSaid = true; quip('cekani', 1); }
      if (!awaitStart && now - lastQuip > 15000 && Math.random() < dt / 90) quip('vzacne', 1);
      // komár: přiletí jednou za zápas, nejdřív po 6 s hry a jen když míček letí k hráči (Kevin má volno)
      if (!mosq.done && now - started > 6000 && now >= serveAt) mosquito();
      // odstřel naprázdno: pálka chvíli „ve vzduchu“ – pomalejší a kombo je pryč
      if (!player.shotUsed && now - player.shotAt > 260) { player.shotUsed = true; player.stunUntil = now + 300; combo = 0; }
      // hráč: prst / myš (přímo) nebo šipky
      if (keys.left) player.target -= 900 * keySpeed * dt;
      if (keys.right) player.target += 900 * keySpeed * dt;
      player.target = clamp(player.target, player.w / 2, W - player.w / 2);
      player.x += (player.target - player.x) * Math.min(1, dt * (now < player.stunUntil ? 7 : 30));
      // šroubek: občas vypadne z horního okénka stroje a pomalu padá k hráči
      if (!awaitStart && !screw && now > nextScrewAt) screw = { x: rnd(60, W - 60), y: KEVIN_Y + 40, a: rnd(0, 6), nut: Math.random() < 0.5 };
      if (screw) {
        // padá rychle a rovně (jen se při pádu převrací) – vylepšení se musí vybojovat
        screw.y += 430 * dt; screw.a += (screw.nut ? 6 : 4) * dt;
        if (Math.abs(screw.y - PLAYER_Y) < PAD_H + 10 && Math.abs(screw.x - player.x) < player.w / 2 + 12) { powerUp(now); screw = null; nextScrewAt = now + rnd(18000, 30000); }
        else if (screw.y > H + 20) { screw = null; nextScrewAt = now + rnd(15000, 25000); }
      }
      if (power.kind && now > power.until) { power.kind = null; player.w = PAD_W; }
      // Kevin: přemýšlí jednou za „react“, cíl = kam přiletí míč (+ chyba); na těžké míří do protirohu
      if (now / 1000 >= kevin.nextThink) {
        kevin.nextThink = now / 1000 + L.react + (isHot ? 0.06 : 0);
        if (ball.vy < 0 && (ball.mishit || ball.y < KEVIN_Y + L.watch * (PLAYER_Y - KEVIN_Y))) {
          var hit = predictX(KEVIN_Y + PAD_H);
          var aimSide = player.x < W / 2 ? 1 : -1;     // pošle míč na stranu, kde hráč není
          kevin.target = hit - aimSide * (ball.mishit ? 0.9 : L.aim) * PAD_W * 0.42 + kevin.miss;
        } else if (ball.vy < 0) {
          kevin.target = kevin.x + (W / 2 - kevin.x) * 0.2;   // míček letí k němu, ale ještě ho „nesleduje“
        } else {
          kevin.target = level === 3 ? W / 2 : kevin.x + (W / 2 - kevin.x) * 0.3;
        }
        kevin.target = clamp(kevin.target, PAD_W / 2, W - PAD_W / 2);
      }
      var dx = kevin.target - kevin.x, ran;
      // zpomalení se násobí (přehřátí, šroubek, nálada), ale Kevin nikdy pod polovinu rychlosti – aby měl šanci
      var maxStep = L.aiSpeed * Math.max(0.5, (isHot ? 0.7 : 1) * (power.kind === 'slow' ? 0.65 : 1) * MOOD[mood][0]) * dt;
      ran = clamp(dx, -maxStep, maxStep);
      kevin.moving = Math.abs(dx) > 4 ? Math.sign(dx) : 0;
      kevin.x += ran;
      heatTick(Math.abs(ran), dt, now);
      // klubíčko na nitce se houpe pořád (i mezi body, než se podává)
      var yarnHit = yarn && yarnTick(now, dt);
      if (yarn && now > yarn.until) yarn = null;
      // míč
      if (now >= serveAt) {
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        ball.trail.push([ball.x, ball.y]); if (ball.trail.length > 10) ball.trail.shift();
        ball.spin = (ball.spin || 0) + (ball.vx * 0.5 + ball.vy * 0.15) * dt / BALL_R;   // hopík se kutálí
        if (ball.vy < 0 && !kevin.planned && ball.y < (KEVIN_Y + PLAYER_Y) / 2) { kevin.planned = true; kevin.shot = !ball.mishit && Math.random() < L.kshot; }
        if (yarnHit && yarn) {
          var sx = ball.x - yarn.x, sy = ball.y - yarn.y, sd = Math.hypot(sx, sy), SR = BALL_R + yarn.r;
          if (sd < SR && sd > 0) {
            var nx = sx / sd, ny = sy / sd, dot = ball.vx * nx + ball.vy * ny;
            if (dot < 0) {
              ball.vx -= 2 * dot * nx; ball.vy -= 2 * dot * ny; ball.x = yarn.x + nx * SR; ball.y = yarn.y + ny * SR;
              if (Math.abs(ball.vy) < ball.speed * 0.4) { ball.vy = (ball.vy < 0 ? -1 : 1) * ball.speed * 0.4; ball.vx = (ball.vx < 0 ? -1 : 1) * Math.sqrt(ball.speed * ball.speed - ball.vy * ball.vy); }
              yarnPush(-nx, -ny, ball.speed);
              sfx.wall(); aimError(); kevin.planned = false;
            }
          }
        }
        if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx); sfx.wall(); }
        if (ball.x > W - BALL_R) { ball.x = W - BALL_R; ball.vx = -Math.abs(ball.vx); sfx.wall(); }
        // pálka hráče (při odstřelu zvednutá)
        var py = PLAYER_Y - liftAt(now);
        if (ball.vy > 0 && ball.y + BALL_R >= py - PAD_H / 2 && ball.y < py + PAD_H && Math.abs(ball.x - player.x) <= player.w / 2 + BALL_R) {
          bounce(player.x, -1, py, player.w);
          hangKick(4 + ball.speed / 300);                // ťuk rozhoupe přívěsky
          ball.fire = false; sfx.pad(false);
          player.lastHit = now; player.boosted = false; rallyTick();
          if (!player.shotUsed) boost(Math.abs(now - player.shotAt - SHOT_IDEAL), now);
          else if (now < player.stunUntil + 200) mishit(now);      // pálka se po odstřelu naprázdno ještě nevzpamatovala
          else { combo = 0; aimError(); }
        }
        // Kevinova pálka
        if (ball.vy < 0 && ball.y - BALL_R <= KEVIN_Y + PAD_H / 2 && ball.y > KEVIN_Y - PAD_H && Math.abs(ball.x - kevin.x) <= PAD_W / 2 + BALL_R) {
          bounce(kevin.x, 1); sfx.pad(true);
          ball.fire = false;
          if (ball.perfect) { ball.perfect = false; quip('odstrel_chycen', 0.4); }
          if (ball.mishit) punish();
          else if (kevin.shot) kevinShot(now);
          kevin.planned = false; kevin.shot = false;
          rallyTick();
        }
        if (ball.y > H + BALL_R * 2) goal(false);
        else if (ball.y < KEVIN_Y - 70) goal(true);
      }
      animateKevin(dt);
      draw(now);
    }

    function powerUp(now) {
      var k = ['big', 'slow', 'calm'][Math.floor(Math.random() * 3)];
      power = { kind: k, until: now + 8000 };
      player.w = k === 'big' ? PAD_W * 1.5 : PAD_W;
      if (k === 'calm') { var f = Math.min(1, Math.max(0.7, L.speed / ball.speed)); ball.speed *= f; ball.vx *= f; ball.vy *= f; }
      comic('l', 'burst good', (T.power || {})[k] || k, 1500);
      sfx.shot(0); vibe(30);
      store.set('kevinPongScrews', String(+(store.get('kevinPongScrews') || 0) + 1));
      quip('sroubek', 0.7);
    }
    // Kevin hodí klubíčko vlny, ale konec nitky drží na své pálce: klubíčko vyletí, nitka se napne a klubíčko
    // visí a houpe se pod jeho pálkou (s ní se i pohybuje). Nitka je provaz z 18 článků (verlet: články se smí
    // přiblížit, ale ne vzdálit víc než na délku článku = prověšená nitka). Hopík se od klubíčka odráží a rozhoupe ho.
    // Po 9 s si ho Kevin namotá zpátky.
    var YARN_N = 18;
    function throwYarn() {
      if (!running) return;
      if (K && K.has('throwIt')) K.once('throwIt');
      if (K) K.expression(2, 1500);
      setTimeout(function () {
        if (!running) return;
        var t = performance.now(), off = rnd(-0.32, 0.32) * PAD_W, ax = kevin.x + off, ay = KEVIN_Y + PAD_H / 2;
        var nodes = [];
        for (var i = 0; i <= YARN_N; i++) nodes.push({ x: ax, y: ay, px: ax, py: ay });
        var end = nodes[YARN_N], dir = Math.random() < 0.5 ? -1 : 1;
        end.px = end.x - dir * rnd(5, 8); end.py = end.y - 9;          // vyletí šikmo dolů (rychlost = rozdíl poloh)
        yarn = { off: off, nodes: nodes, len: rnd(250, 330), reel: 1, at: t, land: t + 350, until: t + 9000,
          r: 22, a: 0, x: ax, y: ay, twist: 0 };
        mt.yarn = true;
        quip('klubko', 1, null, 0, true);
      }, 520);
    }
    function yarnTick(now, dt) {
      var n = yarn.nodes, end = n[YARN_N];
      // na konci se namotá zpátky (délka nitky se zkracuje k nule)
      yarn.reel = now > yarn.until - 900 ? Math.max(0, (yarn.until - now) / 900) : 1;
      var seg = yarn.len * yarn.reel / YARN_N, steps = 3, h = dt / steps;
      for (var k = 0; k < steps; k++) {
        n[0].x = kevin.x + yarn.off; n[0].y = KEVIN_Y + PAD_H / 2;      // uvázaná na Kevinově pálce
        for (var i = 1; i <= YARN_N; i++) {
          var q = n[i], vx = (q.x - q.px) * 0.996, vy = (q.y - q.py) * 0.996;
          q.px = q.x; q.py = q.y;
          q.x += vx; q.y += vy + 1500 * h * h;                          // tíže
        }
        for (var it = 0; it < 10; it++) {
          for (var j = 0; j < YARN_N; j++) {
            var A = n[j], Bn = n[j + 1], dx = Bn.x - A.x, dy = Bn.y - A.y, d = Math.hypot(dx, dy);
            if (d <= seg || d === 0) continue;                           // prověšená nitka se netlačí
            var diff = (d - seg) / d, wa = j === 0 ? 0 : j + 1 === YARN_N ? 0.85 : 0.5, wb = 1 - wa;
            A.x += dx * diff * wa; A.y += dy * diff * wa;
            Bn.x -= dx * diff * wb; Bn.y -= dy * diff * wb;
          }
          n[0].x = kevin.x + yarn.off; n[0].y = KEVIN_Y + PAD_H / 2;
        }
        if (end.x < yarn.r) { end.x = yarn.r; end.px = end.x + Math.abs(end.x - end.px) * 0.6; }
        if (end.x > W - yarn.r) { end.x = W - yarn.r; end.px = end.x - Math.abs(end.x - end.px) * 0.6; }
      }
      yarn.twist += (end.x - end.px) * 0.6;
      yarn.a += (end.x - end.px) / yarn.r;
      yarn.x = end.x; yarn.y = end.y; yarn.dt = dt;
      return now >= yarn.land && yarn.reel > 0.3;                        // hopík se odráží, jen když klubíčko visí
    }
    // ťuk hopíku: klubíčko dostane rychlost ve směru od hopíku (n = jednotkový vektor od hopíku ke klubíčku)
    function yarnPush(nx, ny, speed) {
      var end = yarn.nodes[YARN_N], f = speed * 0.35 * (yarn.dt || 0.016);
      end.px -= nx * f; end.py -= ny * f;
    }
    // nitka: hladká křivka přes články, tmavý okraj, barva vlny a světlé točené vlákno (posouvá se, jak se klubíčko točí)
    function drawYarnThread() {
      var n = yarn.nodes, end = n[YARN_N];
      var ang = Math.atan2(n[YARN_N - 1].y - end.y, n[YARN_N - 1].x - end.x);
      var tipX = end.x + Math.cos(ang) * yarn.r * 0.85, tipY = end.y + Math.sin(ang) * yarn.r * 0.85;   // nitka vychází z klubíčka
      function path() {
        cx.beginPath(); cx.moveTo(n[0].x, n[0].y);
        for (var i = 1; i < YARN_N - 1; i++) cx.quadraticCurveTo(n[i].x, n[i].y, (n[i].x + n[i + 1].x) / 2, (n[i].y + n[i + 1].y) / 2);
        cx.quadraticCurveTo(n[YARN_N - 1].x, n[YARN_N - 1].y, tipX, tipY);
      }
      cx.lineCap = 'round'; cx.lineJoin = 'round';
      path(); cx.strokeStyle = 'rgba(60, 8, 26, .6)'; cx.lineWidth = 5.6; cx.stroke();
      path(); cx.strokeStyle = '#d4456a'; cx.lineWidth = 3.8; cx.stroke();
      cx.setLineDash([3, 4.5]); cx.lineDashOffset = -yarn.twist;
      path(); cx.strokeStyle = 'rgba(255, 200, 214, .9)'; cx.lineWidth = 1.7; cx.stroke();
      cx.lineDashOffset = -yarn.twist + 3.7;
      path(); cx.strokeStyle = 'rgba(120, 20, 50, .6)'; cx.lineWidth = 1.2; cx.stroke();
      cx.setLineDash([]); cx.lineDashOffset = 0;
      // chloupky vlny: pár krátkých odstávajících vláken podél nitky
      cx.strokeStyle = 'rgba(255, 190, 205, .55)'; cx.lineWidth = 1;
      for (var j = 2; j < YARN_N - 1; j += 3) {
        var q = n[j], r2 = n[j + 1], dx = r2.x - q.x, dy = r2.y - q.y, d = Math.hypot(dx, dy) || 1, side = j % 2 ? 1 : -1;
        cx.beginPath(); cx.moveTo(q.x, q.y); cx.lineTo(q.x - dy / d * 3 * side + dx / d * 2, q.y + dx / d * 3 * side + dy / d * 2); cx.stroke();
      }
      // uzlík na pálce
      cx.fillStyle = '#b8325a'; cx.beginPath(); cx.arc(n[0].x, n[0].y + 1, 3.6, 0, 7); cx.fill();
    }
    function kevinShot(now) {
      var sp = Math.min(L.max * 1.12, ball.speed * 1.4), k = sp / ball.speed;
      ball.speed = sp; ball.vx *= k; ball.vy *= k; ball.fire = true;
      hitStop = now + 160; sfx.shot(0.16);
      field.classList.remove('shot', 'shot-super'); void field.offsetWidth; field.classList.add('shot');
      if (K) { K.once(K.has('fistPump') ? 'fistPump' : 'cheer'); K.expression(2, 1200); }
      quip('odstrel_kevin', 0.6);
    }

    function heatTick(ranPx, dt, now) {
      // kola se hřejí pomalu a rychle chladnou: přehřátí jen po hodně dlouhém běhání sem a tam (dřív moc brzo)
      heat = clamp(heat + ranPx / W * 0.16 - dt * 0.07, 0, 1);
      if (heat >= 1 && !isHot) {
        hotUntil = now + 3500; heat = 0.3; mt.overheats++;
        quip('kola_prehrata', 1, null, 0, true); sfx.hiss();
        if (K) K.expression(23, 1500);
      }
      if (isHot !== now < hotUntil) { isHot = !isHot; root.classList.toggle('hot', isHot); }
      var shown = isHot ? 1 : Math.round(heat * 20) / 20;      // žár kol: méně zápisů do stylu
      if (shown !== heatShown) { heatShown = shown; frame.style.setProperty('--heat', shown); }
    }

    function bounce(px, dir, py, pw) {
      var off = clamp((ball.x - px) / ((pw || PAD_W) / 2), -1, 1), a = off * 1.05;   // až ±60°
      ball.speed = Math.min(L.max, ball.speed * L.gain);
      ball.vx = Math.sin(a) * ball.speed;
      ball.vy = dir * Math.cos(a) * ball.speed;
      ball.y = dir < 0 ? (py || PLAYER_Y) - PAD_H / 2 - BALL_R - 1 : KEVIN_Y + PAD_H / 2 + BALL_R + 1;
      field.classList.remove('hit'); void field.offsetWidth; field.classList.add('hit');
    }

    function goal(byPlayer) {
      if (byPlayer) { you++; youEl.textContent = you; } else { kev++; kevEl.textContent = kev; }
      bump(byPlayer ? youEl : kevEl); sfx.goal(byPlayer);
      var was = mood;
      mood = kev - you >= 3 ? 'lazy' : you - kev >= 3 ? 'try' : 'calm';
      if (mood === 'lazy' && was !== 'lazy' && K && K.has('yawn')) setTimeout(function () { if (K && running) K.once('yawn'); }, 1700);
      if (byPlayer && !yarnUsed && you < WIN && (FORCE_YARN || level === 3 && you - kev >= 2)) { yarnUsed = true; setTimeout(throwYarn, 1400); }
      if (you >= WIN || kev >= WIN) return finish(you >= WIN);
      if (K) {
        if (byPlayer) { K.once(Math.random() < 0.5 && K.has('stomp') ? 'stomp' : 'no'); K.expression(23, 1600); }
        else { K.once(K.has('fistPump') && Math.random() < 0.5 ? 'fistPump' : 'cheer'); K.expression(2, 1600); }
      }
      // komentář ke gólu: nejdřív výjimečné chvíle, pak obyčejný gól (ne pokaždé)
      if (byPlayer) { streakP++; streakK = 0; } else { streakK++; streakP = 0; }
      maxDown = Math.max(maxDown, kev - you);
      var diff = kev - you;
      if (you === 9 && kev === 9) quip('9_9', 1, null, 0, true);
      else if (kev === 9 && !byPlayer) quip('mecbol_kevin', 1, null, 0, true);
      else if (you === 9 && byPlayer) quip('mecbol_hrac', 1, null, 0, true);
      else if (byPlayer && maxDown >= 3 && you >= kev && !comebackSaid) { comebackSaid = true; quip('obrat', 1, null, 0, true); }
      else if (streakK === 3) quip('serie_kevin', 1, null, 0, true);
      else if (streakP === 3) quip('serie_hrac', 1, null, 0, true);
      else if (diff === 3 && !byPlayer) quip('vede_kevin', 0.9);
      else if (diff === -3 && byPlayer) quip('vede_hrac', 0.9);
      else if (you === kev) quip('remiza', 0.6);
      else quip(byPlayer ? 'gol_hrac' : 'gol_kevin', 0.35, byPlayer ? T.conceded : T.scored);
      resetBall(!byPlayer);
    }

    // Kola: každé se otočí o tolik, kolik ujede pálka (převedeno na pixely obrázku) děleno jeho poloměrem.
    // Nahoře Kevin běží po vrcholu prostředního kola – běží doprava, vrch kola ujíždí doleva (kolo proti směru
    // hodinek), krajní kola se točí opačně. Dole prostřední kolo hráče jede jako kolo vozíku, krajní opačně.
    // Krajní kola mají posunutý začátek o půl zubu, ať zuby zapadají do mezer.
    var gearSets = ['kevin'].map(function (set) {
      return [].slice.call(root.querySelectorAll('[data-set="' + set + '"] .kpong-gear')).map(function (el, i) {
        return { el: el, r: +el.style.getPropertyValue('--r'), a: i === 1 ? 0 : 7, sign: (i === 1 ? 1 : -1) * (set === 'kevin' ? -1 : 1) };
      });
    });

    // ---------- živá mechanika v okénkách (kreslí se na plátno, v pixelech obrázku rámu) ----------
    // vpředu řetěz kol (sousední zapadají: vzdálenost středů = 0,9 × součet poloměrů, točí se opačně a o půl
    // zubu posunutá), vzadu větší kola ztmavená do hloubky, vpravo píst s klikou, přes to sklo. Rychlost =
    // obvodová rychlost v px/s: nahoře podle Kevinova běhu, dole podle hráčovy pálky, v klidu stroj pomalu tiká.
    var gearImg = [1, 2, 3].map(function (i) { var im = new Image(); im.src = '/kevin/pong/kolo-' + i + '.webp' + ver; return im; });
    function chain(win, sizes, yA, yB, x0, xEnd) {
      var out = [], prev = null;
      for (var i = 0; ; i++) {
        var r = sizes[i % sizes.length], y = i % 2 ? yB : yA, x = x0;
        if (prev) { var d = (prev.r + r) * 0.9, dy = y - prev.y; x = prev.x + Math.sqrt(Math.max(0, d * d - dy * dy)); }
        if (x > xEnd) break;
        prev = { img: i % 3, x: x, y: y, r: r, sign: i % 2 ? -1 : 1, a: (i % 2) * Math.PI / 26 };
        out.push(prev);
      }
      return out;
    }
    var MECH = {
      top: { win: WIN_TOP, front: chain(WIN_TOP, [30, 40, 24, 40], 224, 238, 150, 540),
        back: [{ img: 1, x: 210, y: 268, r: 62, sign: -1, a: 0 }, { img: 0, x: 395, y: 274, r: 72, sign: 1, a: 0 }, { img: 2, x: 590, y: 266, r: 60, sign: -1, a: 0 }],
        v: 0, dir: 1 },
      bot: { win: WIN_BOT, front: chain(WIN_BOT, [42, 56, 32, 56], 1130, 1150, 160, 545),
        back: [{ img: 2, x: 190, y: 1102, r: 80, sign: 1, a: 0 }, { img: 0, x: 420, y: 1096, r: 92, sign: -1, a: 0 }, { img: 1, x: 640, y: 1108, r: 80, sign: 1, a: 0 }],
        v: 0, dir: 1 }
    };
    var mechWant = { top: 0, bot: 0 }, mechLast = 0;
    function mechTick(now) {
      var dt = mechLast ? Math.min(0.05, (now - mechLast) / 1000) : 0;
      mechLast = now;
      mechEls.forEach(function (c) {
        var m = MECH[c.dataset.win], want = running && !paused ? mechWant[c.dataset.win] : 0;
        if (Math.abs(want) > 1) m.dir = want > 0 ? 1 : -1;
        var target = Math.abs(want) + 9;                     // 9 px/s = klidné tikání
        m.v += (target - m.v) * Math.min(1, dt * 5);
        var step = m.v * dt * m.dir;
        if (Math.abs(want) > 20) { m.acc = (m.acc || 0) + Math.abs(step); if (m.acc > 28) { m.acc = 0; sfx.click(); } }
        m.front.forEach(function (g) { g.a += g.sign * step / g.r; });
        m.back.forEach(function (g) { g.a += g.sign * step * 0.45 / g.r; });
        drawMech(m, c);
      });
    }
    function drawMech(m, c) {
      var g2 = c.getContext('2d'), w = m.win, s = c.width / w[2];
      g2.setTransform(s, 0, 0, s, -w[0] * s, -w[1] * s);
      var bg = g2.createLinearGradient(0, w[1], 0, w[1] + w[3]);
      bg.addColorStop(0, '#060508'); bg.addColorStop(1, '#141218');
      g2.fillStyle = bg; g2.fillRect(w[0], w[1], w[2], w[3]);
      function draw1(g) {
        var im = gearImg[g.img];
        if (!im.naturalWidth) return;
        g2.save(); g2.translate(g.x, g.y); g2.rotate(g.a); g2.drawImage(im, -g.r, -g.r, 2 * g.r, 2 * g.r); g2.restore();
      }
      m.back.forEach(draw1);
      g2.fillStyle = 'rgba(5, 4, 7, .62)';                     // zadní vrstva ztmavená = hloubka
      g2.fillRect(w[0], w[1], w[2], w[3]);
      // píst: klika na posledním kole řetězu, ojnice k pístu ve válci vpravo
      var k = m.front[m.front.length - 1], ang = k.a * k.sign, pin = [k.x + Math.cos(ang) * k.r * 0.5, k.y + Math.sin(ang) * k.r * 0.5];
      var L = k.r * 1.9, cyl = k.y, px = pin[0] + Math.sqrt(Math.max(0, L * L - (cyl - pin[1]) * (cyl - pin[1])));
      var cylX = k.x + k.r * 0.5 + L + 6;
      g2.fillStyle = '#0f0e12'; g2.strokeStyle = 'rgba(230,183,48,.55)'; g2.lineWidth = 2;
      g2.beginPath(); g2.rect(cylX - 34, cyl - 9, 46, 18); g2.fill(); g2.stroke();
      m.front.forEach(draw1);
      var rod = g2.createLinearGradient(pin[0], pin[1] - 3, pin[0], pin[1] + 3);
      rod.addColorStop(0, '#f3d27a'); rod.addColorStop(1, '#8f6600');
      g2.strokeStyle = rod; g2.lineWidth = 5; g2.lineCap = 'round';
      g2.beginPath(); g2.moveTo(pin[0], pin[1]); g2.lineTo(px, cyl); g2.stroke();
      g2.fillStyle = '#c99a12'; g2.beginPath(); g2.arc(pin[0], pin[1], 4, 0, 7); g2.fill();
      g2.fillStyle = '#e6b730'; g2.fillRect(px - 2, cyl - 7, 14, 14);
      // sklo: odlesk nahoře a stín u okrajů
      var gl = g2.createLinearGradient(0, w[1], 0, w[1] + w[3]);
      gl.addColorStop(0, 'rgba(255,255,255,.10)'); gl.addColorStop(0.35, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(0,0,0,.35)');
      g2.fillStyle = gl; g2.fillRect(w[0], w[1], w[2], w[3]);
      g2.strokeStyle = 'rgba(0,0,0,.7)'; g2.lineWidth = 6; g2.strokeRect(w[0], w[1], w[2], w[3]);
    }
    var prevKX = W / 2, prevPX = W / 2, lastMove = 0, lastSpeed = 1;
    function spin(list, dx) {
      if (!dx) return;
      var px = dx * GLASS.w / W;
      list.forEach(function (g) {
        g.a += g.sign * px / g.r * 180 / Math.PI;
        g.el.style.transform = 'rotate(' + g.a.toFixed(2) + 'deg)';
      });
    }
    // Kevin stojí na kole a běží na místě (klus) čelem ke směru, rychlost nohou podle rychlosti pálky
    function animateKevin(dt) {
      var dxK = kevin.x - prevKX, dxP = player.x - prevPX;
      prevKX = kevin.x; prevPX = player.x;
      spin(gearSets[0], dxK);
      mechWant.top = dxK / (dt || 0.016) * GLASS.w / W;
      mechWant.bot = dxP / (dt || 0.016) * GLASS.w / W;
      if (!K) return;
      if (kevin.moving !== lastMove) {
        lastMove = kevin.moving;
        K.hold(kevin.moving ? (K.has('jog') ? 'jog' : 'walk') : null, 0.18);
        K.turn(kevin.moving ? kevin.moving * Math.PI / 2 : 0);
      }
      var sp = kevin.moving ? clamp(Math.abs(dxK) / (dt || 0.016) / 420, 0.7, 1.8) : 1;
      if (Math.abs(sp - lastSpeed) > 0.08) { lastSpeed = sp; K.setSpeed(sp); }
    }

    // dlouhá výměna (10 odrazů bez gólu) a rychlý hopík – jednou za výměnu
    function rallyTick() {
      rally++;
      if (rally > mt.maxRally) mt.maxRally = rally;
      if (rally === 10) quip('dlouha_vymena', 1);
      else if (!fastSaid && ball.speed > L.max * 0.92) { fastSaid = true; quip('rychly_hopik', 0.35); }
    }
    function finish(playerWon) {
      running = false;
      var ms = Math.round(performance.now() - started - pausedMs);
      if (K) { K.hold(null); if (playerWon) { K.once(K.has('defeat') ? 'defeat' : 'shrug'); K.expression(23, 3000); } else { K.hold(K.has('dance2') ? 'dance2' : 'cheer'); K.expression(2, 3000); } }
      var endKey = playerWon ? (level === 3 && !store.get('kevinPongBeat3') ? 'vyhra_hrac_3' : kev === 9 ? 'vyhra_hrac_tesne' : 'vyhra_hrac')
        : (you === 0 ? 'vyhra_kevin_10_0' : 'vyhra_kevin');
      if (playerWon && level === 3) store.set('kevinPongBeat3', '1');
      quip(endKey, 1, playerWon ? T.won : T.lost, 4200, true);
      var bestKey = 'kevinPongBest' + level, best = +(store.get(bestKey) || 0);
      if (playerWon && (!best || ms < best)) store.set(bestKey, String(ms));
      var fresh = earnBadges(playerWon, ms);
      var newBest = playerWon && best && ms < best;               // nepřihlášený: rekord v prohlížeči
      var send = playerWon && signedIn ? post('/api/pong/win', { d: level, ms: ms, kevin: kev }) : Promise.resolve(null);
      send.then(function (res) {
        if (newBest || (res && res.ok && res.best === ms)) setTimeout(function () { quip('rekord', 1, null, 3600, true); }, 4400);
        endScreen(playerWon, ms, res && res.ok ? res : null, fresh);
      }).catch(function () { endScreen(playerWon, ms, null, fresh); });
    }
    // odznaky po zápase: co se stalo v zápase + počítadla v prohlížeči; vrací nové (ukáže je konec zápasu)
    function earnBadges(won, ms) {
      var e = [];
      if (won) {
        var wins = +(store.get('kevinPongWins') || 0) + 1;
        store.set('kevinPongWins', String(wins));
        e.push('first', ['easy', 'normal', 'angry'][level - 1]);
        if (kev === 0) e.push('clean');
        if (kev === 9) e.push('close');
        if (ms < 75000) e.push('fast');
        if (wins >= 10) e.push('streak');
        if (wins >= 50) e.push('wins50');
        if (wins >= 100) e.push('wins100');
        if (mt.yarn) e.push('yarn');
        if (maxDown >= 5) e.push('comeback');
        if (new Date().getHours() < 4) e.push('night');
      }
      if (mt.perfect >= 3) e.push('sniper');
      if (mt.superHit) e.push('super');
      if (+(store.get('kevinPongScrews') || 0) >= 10) e.push('tinker');
      if (mt.overheats >= 3) e.push('overheat');
      if (mt.maxRally >= 30) e.push('marathon');
      if (+(store.get('kevinPongDays') || 0) >= 7) e.push('loyal');
      var fresh = addBadges(e);
      var claim = fresh.filter(function (k) { return CLAIMABLE.indexOf(k) >= 0; });
      if (signedIn && claim.length) post('/api/pong/badges', { keys: claim.join(',') }).catch(function () { /* doplní se příště */ });
      return fresh;
    }

    // ---------- obrazovky (start, konec) a tabulka ----------
    function startScreen() {
      panel.hidden = false;
      // bloky: nadpis · obtížnost · Hrát · ovládání (3 dlaždice + rada k odstřelu) · tabulka
      var icons = ['fa-arrows-left-right', 'fa-bolt', 'fa-pause'];
      var controls = T.controls ? '<ul class="kp-controls">' + T.controls.map(function (c, i) {
          return '<li><i class="fa-solid ' + icons[i] + '" aria-hidden="true"></i><b>' + esc(c[0]) + '</b><span>' + esc(c[1]) + '</span></li>';
        }).join('') + '</ul><p class="kp-hint">' + esc(T.shotHint) + '</p>' : '<p class="kpong-help">' + esc(T.help) + '</p>';
      var short = T.levelsShort || T.levels;
      panel.dataset.view = 'main';
      panel.innerHTML = '<div class="kp-view kp-main"><h2 class="kpong-title">' + esc(T.title) + '</h2><p class="kpong-lead">' + esc(T.lead) + '</p>' +
        '<div class="kp-seg" role="radiogroup" aria-label="' + esc(T.level) + '" style="--i:' + (level - 1) + '"><span class="kp-thumb" aria-hidden="true"></span>' +
        [1, 2, 3].map(function (d) {
          return '<button type="button" role="radio" class="kpong-level" data-d="' + d + '" aria-checked="' + (d === level) + '" title="' + esc(T.levels[d - 1]) + '">' + esc(short[d - 1]) + '</button>';
        }).join('') + '</div>' +
        '<p class="kp-desc">' + esc(T.levelHints[level - 1]) + '</p>' +
        '<button type="button" class="kpong-play btn-primary"><i class="fa-solid fa-play" aria-hidden="true"></i> ' + esc(T.play) + '</button>' +
        '<p class="kp-rec" hidden></p>' +
        '<p class="kp-links"><button type="button" class="kp-link" data-go="how">' + esc(T.how || T.controlsTitle || '') + '</button><span aria-hidden="true">·</span>' +
        '<button type="button" class="kp-link" data-go="top">' + esc(T.board) + '</button></p></div>' +
        '<div class="kp-view kp-how"><h3 class="kp-label">' + esc(T.controlsTitle || '') + '</h3>' + controls + backBtn() + '</div>' +
        '<div class="kp-view kp-top"><section class="kpong-board"></section>' + backBtn() + '</div>';
      panel.querySelectorAll('.kpong-level').forEach(function (b) {
        b.addEventListener('click', function () {
          level = +b.dataset.d; L = LEVELS[level]; store.set('kevinPongLevel', String(level));
          panel.querySelectorAll('.kpong-level').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
          panel.querySelector('.kp-seg').style.setProperty('--i', level - 1);
          panel.querySelector('.kp-desc').textContent = T.levelHints[level - 1];
          board(level);
        });
      });
      panel.querySelector('.kpong-play').addEventListener('click', begin);
      board(level);
      say(pick(T.hello), 3000);
    }

    function backBtn() { return '<button type="button" class="kp-link kp-backto" data-go="main"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> ' + esc(T.back || '') + '</button>'; }
    // odkazy v menu přepínají pohled: hlavní · jak se hraje · tabulka
    panel.addEventListener('click', function (e) {
      var g = e.target.closest('[data-go]');
      if (!g) return;
      panel.dataset.view = g.dataset.go;
      panel.scrollTop = 0;
      var first = panel.querySelector('.kp-' + g.dataset.go + ' button');
      if (first) first.focus();
    });

    function board(d) {
      var box = panel.querySelector('.kpong-board');
      if (!box) return;
      box.innerHTML = '<h3 class="kp-label">' + esc(T.board) + ' · ' + esc(T.levels[d - 1]) + '</h3><p class="kpong-note">…</p>';
      fetch('/api/pong/top?d=' + d, { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (j) {
        signedIn = !!j.signedIn; csrf = j.csrf || null;
        var rows = (j.top || []).map(function (r) {
          return '<li class="' + (r.me ? 'me' : '') + '"><span class="kpong-place">' + r.place + '.</span>' +
            '<img src="' + esc(r.avatar || '/img/avatar-default.svg') + '" alt="" width="24" height="24" loading="lazy">' +
            '<span class="kpong-name">' + esc(r.name) + (r.title ? ' <i class="fa-solid ' + esc(r.title.icon) + ' kpong-rtitle" title="' + esc(r.title.name) + '" aria-label="' + esc(r.title.name) + '"></i>' : '') + '</span><span class="kpong-time">' + time(r.ms) + '</span><span class="kpong-kgoals">' + r.kevin + ' ' + esc(T.kevinGoals) + '</span></li>';
        }).join('');
        var mine = j.me ? '<p class="kpong-note">' + esc(T.yourBest.replace('{place}', j.me.place).replace('{time}', time(j.me.ms))) + '</p>' : '';
        var local = +(store.get('kevinPongBest' + d) || 0);
        var guest = !signedIn ? '<p class="kpong-note">' + esc(T.loginToRank) + ' <a href="/login.jsp?next=' + encodeURIComponent(location.pathname + location.search) + '">' + esc(T.login) + '</a>' +
          (local ? ' · ' + esc(T.localBest.replace('{time}', time(local))) : '') + '</p>' : '';
        box.innerHTML = '<h3 class="kp-label">' + esc(T.board) + ' · ' + esc(T.levels[d - 1]) + '</h3>' +
          (rows ? '<ol class="kpong-list">' + rows + '</ol>' : '<p class="kpong-note">' + esc(T.empty) + '</p>') + mine + guest;
        var rec = panel.querySelector('.kp-rec'), recMs = j.me ? j.me.ms : local;
        if (rec) {
          rec.hidden = !recMs;
          if (recMs) rec.innerHTML = '<i class="fa-solid fa-trophy" aria-hidden="true"></i> ' + esc(T.best || '') + ' <b>' + time(recMs) + '</b>';
        }
      }).catch(function () { box.innerHTML = '<p class="kpong-note">' + esc(T.boardFail) + '</p>'; });
    }

    function endScreen(won, ms, res, fresh) {
      panel.hidden = false;
      var line = won ? T.winTime.replace('{time}', time(ms)) : T.loseLine;
      if (won && res) line += ' ' + T.place.replace('{place}', res.place);
      panel.dataset.view = 'main';
      panel.innerHTML = '<div class="kp-view kp-main"><h2 class="kpong-title">' + esc(won ? T.winTitle : T.loseTitle) + '</h2>' +
        '<p class="kpong-final">' + you + ' : ' + kev + '</p><p class="kpong-lead">' + esc(line) + '</p>' +
        (fresh && fresh.length ? '<div class="kp-newbadges"><p class="kp-label">' + esc(T.newBadge || '') + '</p><ul>' + fresh.map(function (k) {
          var rw = (T.rewards || {})[k];
          return '<li><span class="kp-nb-icon' + ({ streak: ' bronze', wins50: ' silver' }[k] || '') + '"><i class="fa-solid ' + BADGE_ICON[k] + '" aria-hidden="true"></i></span>' +
            '<span><b>' + esc((T.badgeNames || {})[k] || k) + '</b>' + (rw ? '<small><i class="fa-solid fa-gift" aria-hidden="true"></i> ' + esc(T.rewardLabel || '') + ': ' + esc(rw) + '</small>' : '') + '</span></li>';
        }).join('') + '</ul>' + (signedIn ? '<a class="kp-link" href="/uzivatel.jsp#pong">' + esc(T.seeProfile || '') + '</a>' : '') + '</div>' : '') +
        '<button type="button" class="kpong-play btn-primary"><i class="fa-solid fa-rotate-right" aria-hidden="true"></i> ' + esc(T.again) + '</button>' +
        '<p class="kp-links"><button type="button" class="kp-link kpong-back">' + esc(T.changeLevel) + '</button><span aria-hidden="true">·</span>' +
        '<button type="button" class="kp-link" data-go="top">' + esc(T.board) + '</button></p></div>' +
        '<div class="kp-view kp-top"><section class="kpong-board"></section>' + backBtn() + '</div>';
      panel.querySelector('.kpong-play').addEventListener('click', begin);
      panel.querySelector('.kpong-back').addEventListener('click', startScreen);
      board(level);
    }

    function begin() {
      panel.hidden = true;
      you = 0; kev = 0; youEl.textContent = '0'; kevEl.textContent = '0';
      player.x = player.target = W / 2; kevin.x = kevin.target = W / 2;
      if (K) { K.hold(null); K.look(0, 0); }
      L = LEVELS[level];
      started = performance.now(); mosq.done = false;
      screw = null; nextScrewAt = performance.now() + rnd(15000, 25000); power = { kind: null, until: 0 }; player.w = PAD_W;
      yarn = null; yarnUsed = false; mood = 'calm';
      mt = { perfect: 0, superHit: false, overheats: 0, maxRally: 0, yarn: false };
      var today = new Date().toISOString().slice(0, 10);              // Věrný parťák: počet různých dní se hrou
      if (store.get('kevinPongDay') !== today) { store.set('kevinPongDay', today); store.set('kevinPongDays', String(+(store.get('kevinPongDays') || 0) + 1)); }
      heat = 0; hotUntil = 0; isHot = false; root.classList.remove('hot'); frame.style.setProperty('--heat', 0); heatShown = 0;
      running = true; awaitStart = 'start';            // první hopík vyletí, až hráč ťukne / klikne / zmáčkne mezerník
      resetBall(Math.random() < 0.5);
      streakP = streakK = maxDown = 0; comebackSaid = false; lastMoveAt = performance.now(); idleSaid = false;
      quip(gamesPlayed > 0 ? 'odveta' : level === 3 ? 'start_3' : 'start', 1, T.start, 2800, true);
      if (FORCE_YARN) { yarnUsed = true; setTimeout(throwYarn, 1800); }   // zkouška #klubko: hned na začátku
      gamesPlayed++;
    }

    // barvy pálky během vylepšení: velká pálka zelená, pomalý Kevin modrá, klidný hopík fialová
    var POWER_COL = {
      big: ['#c6ffd0', '#18a04e', 'rgba(90, 255, 140, .9)'],
      slow: ['#cfe6ff', '#2a62d0', 'rgba(110, 170, 255, .9)'],
      calm: ['#eadcff', '#7a46d0', 'rgba(190, 140, 255, .9)']
    };
    // svítí barva vylepšení? Posledních 3 s bliká: z 2 bliknutí za sekundu až na 10 (fáze = integrál rostoucí frekvence)
    function powerLit(left) {
      if (left > 3000) return true;
      if (left <= 0) return false;
      var t = (3000 - left) / 1000, phase = 2 * t + 4 / 3 * t * t;
      return Math.floor(phase * 2) % 2 === 0;
    }

    // ---------- kreslení hřiště ----------
    function draw(now) {
      mechTick(now); fxTick(now);
      var light = false;   // hřiště je tmavé sklo stroje i ve světlém režimu
      cx.clearRect(0, 0, W, H);
      rail(KEVIN_Y, kevin.x); rail(PLAYER_Y, player.x);
      // čáry: střed, branky
      cx.strokeStyle = light ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.1)';
      cx.lineWidth = 3; cx.setLineDash([14, 14]);
      cx.beginPath(); cx.moveTo(0, (KEVIN_Y + PLAYER_Y) / 2); cx.lineTo(W, (KEVIN_Y + PLAYER_Y) / 2); cx.stroke();
      cx.setLineDash([]);
      // pálky (zlatá Kevinova, hráčova v barvě textu)
      var warn = kevin.shot && ball.vy < 0 && Math.sin(now / 70) > 0;
      if (kevin.shot && ball.vy < 0) { cx.shadowColor = 'rgba(255, 90, 20, .95)'; cx.shadowBlur = 18 + 10 * Math.sin(now / 60); }
      pad(kevin.x, KEVIN_Y, warn ? '#ff7a2e' : '#e6b730', warn ? '#a32600' : '#8f6600');
      cx.shadowBlur = 0;
      var lift = liftAt(now);
      if (lift > 0) { cx.shadowColor = 'rgba(230,183,48,.9)'; cx.shadowBlur = 24 * lift / LIFT; }
      // vylepšení obarví pálku (každé jinak); poslední 3 s bliká zpátky do normální barvy, čím blíž konec, tím rychleji
      var pc = power.kind && powerLit(power.until - now) ? POWER_COL[power.kind] : null;
      var sp = padSprite(skin);
      hangTick(now);
      if (sp) {
        // obrázková pálka: vylepšení ji neobarví, ale rozzáří její barvou (a záře bliká stejně jako barva)
        drawSpritePad(sp, player.x, PLAYER_Y - lift - PAD_H / 2, player.w, pc ? pc[2] : lift > 0 ? 'rgba(230,183,48,.9)' : null);
      } else {
        if (pc) { cx.shadowColor = pc[2]; cx.shadowBlur = 18; }
        pad(player.x, PLAYER_Y - lift, pc ? pc[0] : SKINS[skin].pad[0], pc ? pc[1] : SKINS[skin].pad[1], player.w);
      }
      cx.shadowBlur = 0;
      if (screw) drawScrew(screw);
      if (yarn) {
        drawYarnThread();
        drawYarn(yarn.x, yarn.y, yarn.r * (0.55 + 0.45 * yarn.reel), yarn.a);
      }
      // míč: zlatý hopík se stopou
      if (running && now >= serveAt) {
        ball.trail.forEach(function (p, i) {
          cx.globalAlpha = (i + 1) / ball.trail.length * 0.25;
          cx.fillStyle = ball.fire ? (i % 2 ? '#ff6a00' : '#ffb02e') : player.boosted && ball.vy < 0 ? '#fff3b0' : SKINS[skin].trail;
          cx.beginPath(); cx.arc(p[0], p[1], BALL_R * (ball.fire ? 0.9 + i / 12 : 0.5 + i / 20), 0, 7); cx.fill();
        });
        cx.globalAlpha = 1;
      }
      if (running) {
        if (ball.fire) { cx.shadowColor = 'rgba(255, 120, 20, .95)'; cx.shadowBlur = 22; }
        if (ballType > 0) {
          drawBall(BALLS[ballType].id, ball.x, ball.y, ball.spin || 0, now);
        } else if (hopik.naturalWidth) {
          cx.save(); cx.translate(ball.x, ball.y); cx.rotate(ball.spin || 0);
          cx.drawImage(hopik, -BALL_R, -BALL_R, BALL_R * 2, BALL_R * 2);
          cx.restore();
          var sh = cx.createRadialGradient(ball.x - 5, ball.y - 6, 1, ball.x, ball.y, BALL_R);   // odlesk zůstává nahoře vlevo
          sh.addColorStop(0, 'rgba(255, 255, 255, .45)'); sh.addColorStop(0.4, 'rgba(255, 255, 255, 0)'); sh.addColorStop(1, 'rgba(0, 0, 0, .35)');
          cx.fillStyle = sh; cx.beginPath(); cx.arc(ball.x, ball.y, BALL_R, 0, 7); cx.fill();
        } else {
          var g = cx.createRadialGradient(ball.x - 4, ball.y - 5, 2, ball.x, ball.y, BALL_R);
          g.addColorStop(0, '#fff3b0'); g.addColorStop(0.45, '#e6b730'); g.addColorStop(1, '#6b4a00');
          cx.fillStyle = g; cx.beginPath(); cx.arc(ball.x, ball.y, BALL_R, 0, 7); cx.fill();
        }
        cx.shadowBlur = 0;
        cx.beginPath(); cx.arc(ball.x, ball.y, BALL_R, 0, 7);
        cx.shadowColor = SKINS[skin].glow; cx.shadowBlur = 10;   // zlatý okraj se září: černý hopík je vidět i na tmavém pozadí
        cx.lineWidth = 3; cx.strokeStyle = SKINS[skin].rim; cx.stroke(); cx.shadowBlur = 0;
        if (awaitStart) {      // čeká na hráče: výzva pulzuje, písmo se zmenší, aby se vešla
          var rt = coarse ? T.readyTouch || '' : T.readyMouse || '', fs = 32;
          cx.save(); cx.textAlign = 'center';
          cx.font = fs + 'px "Bruno Ace SC", system-ui, sans-serif';
          while (cx.measureText(rt).width > W - 60 && fs > 14) { fs -= 2; cx.font = fs + 'px "Bruno Ace SC", system-ui, sans-serif'; }
          var tw = cx.measureText(rt).width + 44, th = fs + 26;
          cx.fillStyle = 'rgba(8, 7, 6, .72)';
          roundRect(W / 2 - tw / 2, H / 2 + 100 - fs * 0.85 - 13, tw, th, th / 2);
          cx.globalAlpha = 0.7 + 0.3 * Math.sin(now / 260);
          cx.fillStyle = '#ffd23f'; cx.shadowColor = 'rgba(0,0,0,.85)'; cx.shadowBlur = 8;
          cx.fillText(rt, W / 2, H / 2 + 100);
          cx.restore();
        } else if (now < serveAt) {   // odpočet podání 3–2–1
          cx.fillStyle = light ? 'rgba(0,0,0,.5)' : 'rgba(255,255,255,.7)';
          cx.font = '700 64px system-ui, sans-serif'; cx.textAlign = 'center';
          cx.fillText(String(Math.ceil((serveAt - now) / 500)), W / 2, H / 2 + 100);
        }
      }
    }
    // kolejnice, po které pálka jezdí; pás (čárkovaný) je k pálce připevněný, takže jede s ní
    function rail(y, x) {
      cx.lineWidth = 3; cx.strokeStyle = 'rgba(230,183,48,.16)';
      cx.beginPath(); cx.moveTo(10, y); cx.lineTo(W - 10, y); cx.stroke();
      cx.strokeStyle = 'rgba(230,183,48,.38)'; cx.setLineDash([8, 16]); cx.lineDashOffset = -x;
      cx.beginPath(); cx.moveTo(10, y); cx.lineTo(W - 10, y); cx.stroke();
      cx.setLineDash([]); cx.lineDashOffset = 0;
    }
    // klubíčko vlny: růžová koule, přes ni navinuté nitky v několika směrech (otáčí se s a)
    function drawYarn(x, y, r, a) {
      cx.save(); cx.translate(x, y); cx.rotate(a);
      var g = cx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
      g.addColorStop(0, '#ffb3c6'); g.addColorStop(0.6, '#e85a7a'); g.addColorStop(1, '#8e2340');
      cx.fillStyle = g; cx.beginPath(); cx.arc(0, 0, r, 0, 7); cx.fill();
      cx.save(); cx.beginPath(); cx.arc(0, 0, r, 0, 7); cx.clip();
      cx.strokeStyle = 'rgba(120, 20, 50, .55)'; cx.lineWidth = Math.max(1, r / 14);
      [[0, 1], [1.1, 0.75], [2.2, 0.9]].forEach(function (d) {
        cx.save(); cx.rotate(d[0]);
        for (var i = -3; i <= 3; i++) { cx.beginPath(); cx.ellipse(0, i * r * 0.22, r * d[1], r * 0.32, 0, 0, Math.PI); cx.stroke(); }
        cx.restore();
      });
      cx.restore(); cx.restore();
    }
    // obrázkové míčky za odznaky (dokonalý kruh, točí se jako hopík)
    function drawBall(id, x, y, a) {
      var spr = MIC && MIC[id], r = BALL_R;
      if (!spr || !micImg.complete || !micImg.naturalWidth) return;
      cx.save(); cx.translate(x, y); cx.rotate(a);
      cx.drawImage(micImg, spr[0], spr[1], spr[2], spr[3], -r, -r, r * 2, r * 2);
      cx.restore();
    }

    function pad(x, y, c1, c2, w) {
      w = w || PAD_W;
      var g = cx.createLinearGradient(0, y - PAD_H / 2, 0, y + PAD_H / 2);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      cx.fillStyle = g;
      roundRect(x - w / 2, y - PAD_H / 2, w, PAD_H, PAD_H / 2);
    }
    // díl ze stroje, který padá: šroubek (z boku – hlava s drážkou, dřík se závitem, špička) nebo matička
    // (šestihran s dírou); mosazný, při pádu se převrací a jemně září, ať je vidět na každém pozadí
    function drawScrew(s) {
      cx.save(); cx.translate(s.x, s.y); cx.rotate(s.a);
      cx.shadowColor = 'rgba(255, 210, 63, .8)'; cx.shadowBlur = 12;
      var brass = cx.createLinearGradient(-14, 0, 14, 0);
      brass.addColorStop(0, '#8f6600'); brass.addColorStop(0.45, '#ffe08a'); brass.addColorStop(1, '#a37b00');
      cx.fillStyle = brass; cx.strokeStyle = '#4a3300'; cx.lineWidth = 1.5;
      if (s.nut) {
        cx.beginPath();
        for (var i = 0; i < 6; i++) { var an = i * Math.PI / 3 + Math.PI / 6; cx[i ? 'lineTo' : 'moveTo'](Math.cos(an) * 15, Math.sin(an) * 15); }
        cx.closePath(); cx.moveTo(6.5, 0); cx.arc(0, 0, 6.5, 0, Math.PI * 2, true);       // díra (opačný směr = vyřízne se)
        cx.fill(); cx.shadowBlur = 0; cx.stroke();
        cx.strokeStyle = 'rgba(74, 51, 0, .55)'; cx.beginPath(); cx.arc(0, 0, 10.5, 0, Math.PI * 2); cx.stroke();   // sražená hrana
      } else {
        cx.beginPath();                                                    // dřík se špičkou
        cx.moveTo(-5, -10); cx.lineTo(5, -10); cx.lineTo(5, 14); cx.lineTo(0, 21); cx.lineTo(-5, 14); cx.closePath();
        cx.fill(); cx.shadowBlur = 0; cx.stroke();
        cx.strokeStyle = 'rgba(74, 51, 0, .8)'; cx.lineWidth = 1.6;          // závit
        for (var y = -7; y < 15; y += 3.6) { cx.beginPath(); cx.moveTo(-5, y + 1.6); cx.lineTo(5, y - 1.2); cx.stroke(); }
        cx.fillStyle = brass; cx.strokeStyle = '#4a3300'; cx.lineWidth = 1.5;   // hlava s drážkou
        cx.beginPath(); cx.moveTo(-12, -10); cx.lineTo(12, -10); cx.quadraticCurveTo(12, -19, 0, -19); cx.quadraticCurveTo(-12, -19, -12, -10); cx.closePath();
        cx.fill(); cx.stroke();
        cx.strokeStyle = '#4a3300'; cx.lineWidth = 2.5; cx.beginPath(); cx.moveTo(0, -18); cx.lineTo(0, -11); cx.stroke();
      }
      cx.restore();
    }
    function roundRect(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.fill(); }

    // ---------- ovládání ----------
    function toField(e) { var r = court.getBoundingClientRect(); return (e.clientX - r.left) / r.width * W; }
    // Prst, který přišel první, vede pálku (zachycený – vede ji, i když sjede z hřiště); další prst = odstřel.
    // Prst funguje na celém stroji, i na spodním okénku s koly pod hřištěm – tam nezakrývá pálku ani hopík.
    // Myš vede pálku po celém okně hry (dřív jen nad hřištěm – když vyjela ven, pálka se zasekla), levé
    // tlačítko kdekoli mimo tlačítka a menu = odstřel.
    var mover = null;
    function onPointer(e) {
      if (!running || (e.type === 'pointerdown' && e.target.closest('.kpong-set'))) return;
      if (e.pointerType === 'touch') {
        if (e.type === 'pointerdown') {
          if (mover !== null && mover !== e.pointerId) { shoot(); e.preventDefault(); return; }
          mover = e.pointerId;
          kickOff();
          try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) { /* nevadí */ }
        } else if (e.pointerId !== mover) return;
      } else if (e.type === 'pointerdown') {
        if (e.button !== 0 || setCard || e.target.closest('button, a, .kpong-panel, .kpong-settings')) return;
        shoot();
      }
      player.target = clamp(toField(e), player.w / 2, W - player.w / 2); e.preventDefault();
    }
    function onPointerEnd(e) { if (e.pointerId === mover) mover = null; }
    function mouseOnly(e) { if (e.pointerType !== 'touch') onPointer(e); }
    function touchOnly(e) { if (e.pointerType === 'touch') onPointer(e); }
    root.addEventListener('pointermove', mouseOnly);
    root.addEventListener('pointerdown', mouseOnly);
    machine.addEventListener('pointermove', touchOnly);
    machine.addEventListener('pointerdown', touchOnly);
    machine.addEventListener('pointerup', onPointerEnd);
    machine.addEventListener('pointercancel', onPointerEnd);
    shotBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); shoot(); });

    function onKey(e) {
      if (e.key === 'Escape') return setCard ? closeSettings() : close();
      if (setCard) return;                                         // v nastavení klávesy nehrají
      if (e.key === 'ArrowLeft' || e.key === 'a') { keys.left = e.type === 'keydown'; e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key === 'd') { keys.right = e.type === 'keydown'; e.preventDefault(); }
      if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && e.type === 'keydown' && running) { if (!e.repeat) shoot(); e.preventDefault(); }
      if (e.key === 'p' && e.type === 'keydown' && running && !mosq.active && !setCard) { paused = !paused; if (paused) quip('pauza', 1, null, 0, true); e.preventDefault(); }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('keyup', onKey);
    // odchod z okna = pauza; po návratu se hra zeptá (na telefonu není klávesa P)
    function onHidden() {
      if (document.hidden && running) paused = true;
      else if (!document.hidden && running && paused && !mosq.active && !setCard) askToResume();
    }
    document.addEventListener('visibilitychange', onHidden);
    root.querySelector('.kpong-close').addEventListener('click', close);

    // ---------- nastavení ve hře (⚙): pozadí hrací plochy (mění se hned, je vidět pod kartou) a celá obrazovka;
    // během hry se při otevření zapauzuje, po zavření se po krátké chvilce rozjede ----------
    var canFull = !!(root.requestFullscreen || root.webkitRequestFullscreen);   // iPhone ji pro stránky nemá
    function isFull() { return (document.fullscreenElement || document.webkitFullscreenElement) === root; }
    function toggleFull() {
      var p = isFull() ? (document.exitFullscreen || document.webkitExitFullscreen).call(document)
        : (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
      if (p && p.catch) p.catch(function () { /* prohlížeč nepovolil */ });
    }
    function onFull() {
      var i = setCard && setCard.querySelector('.kp-full i');
      if (i) i.className = 'fa-solid ' + (isFull() ? 'fa-compress' : 'fa-expand');
      setTimeout(fit, 80);
    }
    var setBtn = root.querySelector('.kpong-set'), setCard = null, setPausedGame = false;
    function openSettings() {
      if (setCard) return closeSettings();
      if (mosq.active) return;                                     // během scénky s komárem ne
      setPausedGame = running && !paused;
      if (setPausedGame) paused = true;
      setCard = document.createElement('div');
      setCard.className = 'kpong-settings';
      setCard.setAttribute('role', 'dialog');
      setCard.setAttribute('aria-label', T.settings || 'Settings');
      setCard.innerHTML = '<h2 class="kpong-title">' + esc(T.settings || '') + '</h2>' +
        '<section class="kp-sec"><h3 class="kp-label">' + esc(T.bgTitle || '') + '</h3><div class="kp-bgs" role="radiogroup" aria-label="' + esc(T.bgTitle || '') + '">' +
        BGS.map(function (b, i) {
          var ok = hasBadge(BG_BADGE[b]), nm = (T.bgs || BGS)[i];
          return '<button type="button" role="radio" class="kp-bgopt" data-bg="' + b + '" aria-checked="' + (b === bgName) + '"' + (ok ? '' : ' aria-disabled="true"') +
            ' title="' + esc(nm + (ok ? '' : ' – ' + lockText(BG_BADGE[b]))) + '" aria-label="' + esc(nm) + '"' +
            (b === 'tma' ? '' : ' style="background-image:url(/kevin/pong/pozadi-' + b + '-mini.webp' + ver + ')"') + '>' +
            (ok ? '' : '<i class="fa-solid fa-lock" aria-hidden="true"></i>') + '</button>';
        }).join('') + '</div><p class="kp-bgname">' + esc((T.bgs || BGS)[BGS.indexOf(bgName)]) + '</p></section>' +
        '<section class="kp-sec"><h3 class="kp-label">' + esc(T.skinTitle || '') + '</h3><div class="kp-bgs" role="radiogroup" aria-label="' + esc(T.skinTitle || '') + '">' +
        SKINS.map(function (s, i) {
          var ok = s.ok(), name = (T.skins || [])[i] || '';
          return '<button type="button" role="radio" class="kp-skin" data-skin="' + i + '" aria-checked="' + (i === skin) + '"' + (ok ? '' : ' aria-disabled="true"') +
            ' title="' + esc(name + (ok ? '' : ' – ' + lockText(s.b))) + '" aria-label="' + esc(name) + '" style="--c1:' + s.pad[0] + ';--c2:' + s.pad[1] + ';--rim:' + s.rim + '"' +
            (s.img ? ' data-img="1"><canvas width="132" height="66" aria-hidden="true"></canvas>' : '>') +
            (ok ? '' : '<i class="fa-solid fa-lock" aria-hidden="true"></i>') + '</button>';
        }).join('') + '</div><p class="kp-bgname kp-skinname">' + esc((T.skins || [])[skin] || '') + '</p></section>' +
        '<section class="kp-sec"><h3 class="kp-label">' + esc(T.ballTitle || '') + '</h3><div class="kp-bgs" role="radiogroup" aria-label="' + esc(T.ballTitle || '') + '">' +
        BALLS.map(function (bl, i) {
          var ok = hasBadge(bl.b), name = (T.balls || [])[i] || bl.id;
          return '<button type="button" role="radio" class="kp-ball" data-ball="' + i + '" aria-checked="' + (i === ballType) + '"' + (ok ? '' : ' aria-disabled="true"') +
            ' title="' + esc(name + (ok ? '' : ' – ' + lockText(bl.b))) + '" aria-label="' + esc(name) + '"><canvas width="88" height="88" aria-hidden="true"></canvas>' +
            (ok ? '' : '<i class="fa-solid fa-lock" aria-hidden="true"></i>') + '</button>';
        }).join('') + '</div><p class="kp-bgname kp-ballname">' + esc((T.balls || [])[ballType] || '') + '</p></section>' +
        '<section class="kp-sec"><h3 class="kp-label">' + esc(T.soundTitle || '') + '</h3><div class="kp-row">' +
        '<button type="button" class="kp-fullbtn kp-snd" aria-pressed="' + (vol > 0) + '"></button>' +
        '<input type="range" class="kp-vol" min="0.1" max="1" step="0.1" value="' + (vol || +(store.get('kevinPongVolLast') || 0.6)) + '" aria-label="' + esc(T.volume || '') + '"></div></section>' +
        (coarse ? '' : '<section class="kp-sec"><h3 class="kp-label">' + esc(T.keysTitle || '') + '</h3><div class="kp-row kp-keyrow">' +
          '<i class="fa-solid fa-gauge-simple-high" aria-hidden="true"></i>' +
          '<input type="range" class="kp-keys" min="0.5" max="2" step="0.1" value="' + keySpeed + '" aria-label="' + esc(T.keysTitle || '') + '">' +
          '<output class="kp-keysval">' + Math.round(keySpeed * 100) + ' %</output></div><p class="kp-bgname">' + esc(T.keysHint || '') + '</p></section>') +
        '<section class="kp-sec"><h3 class="kp-label">' + esc(T.talkTitle || '') + '</h3><div class="kp-talk" role="radiogroup" aria-label="' + esc(T.talkTitle || '') + '">' +
        TALK_KEYS.map(function (k, i) { return '<button type="button" role="radio" data-talk="' + k + '" aria-checked="' + (k === talk) + '">' + esc((T.talk || TALK_KEYS)[i]) + '</button>'; }).join('') + '</div></section>' +
        '<div class="kp-checks">' +
        (navigator.vibrate ? '<button type="button" class="kp-fullbtn kp-opt" data-opt="vib" aria-pressed="' + vibOn + '"><i class="fa-solid fa-mobile-screen" aria-hidden="true"></i> ' + esc(T.vibrate || '') + '</button>' : '') +
        (coarse ? '<button type="button" class="kp-fullbtn kp-opt" data-opt="lefty" aria-pressed="' + lefty + '"><i class="fa-solid fa-hand" aria-hidden="true"></i> ' + esc(T.lefty || '') + '</button>' : '') +
        '</div>' +
        (canFull ? '<button type="button" class="kp-fullbtn kp-full"><i class="fa-solid ' + (isFull() ? 'fa-compress' : 'fa-expand') + '" aria-hidden="true"></i> ' + esc(T.fullscreen || '') + '</button>' : '') +
        '<button type="button" class="kpong-play btn-primary kp-resume"><i class="fa-solid fa-' + (setPausedGame ? 'play' : 'check') + '" aria-hidden="true"></i> ' + esc(setPausedGame ? T.resume || '' : T.done || '') + '</button>';
      root.appendChild(setCard);
      setBtn.setAttribute('aria-expanded', 'true');
      setCard.querySelectorAll('.kp-bgopt').forEach(function (b, i) {
        b.addEventListener('click', function () {
          if (!hasBadge(BG_BADGE[b.dataset.bg])) { setCard.querySelector('.kp-bgname').textContent = (T.bgs || BGS)[i] + ' – ' + lockText(BG_BADGE[b.dataset.bg]); return; }
          setBg(b.dataset.bg); store.set('kevinPongBg', b.dataset.bg);
          setCard.querySelectorAll('.kp-bgopt').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
          setCard.querySelector('.kp-bgname').textContent = (T.bgs || BGS)[i];
        });
      });
      var fb = setCard.querySelector('.kp-full');
      if (fb) fb.addEventListener('click', toggleFull);
      // náhledy obrázkových pálek a míčků (nakreslí se znovu, až se obrázky načtou)
      function previews() {
        if (!setCard) return;
        setCard.querySelectorAll('.kp-skin[data-img] canvas').forEach(function (c) {
          var sp = padSprite(+c.parentNode.dataset.skin), keep = cx;
          if (!sp) return;
          cx = c.getContext('2d'); cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, c.width, c.height);
          var k = c.width / (PAD_W * 1.08); cx.scale(k, k);
          drawSpritePad(sp, PAD_W * 0.54, (c.height / k - (sp.h * PAD_W / sp.w)) / 2, PAD_W, null, true, +c.parentNode.dataset.skin);
          cx = keep;
        });
        setCard.querySelectorAll('.kp-ball canvas').forEach(function (c) {
          var i = +c.parentNode.dataset.ball, keep = cx;
          if (i === 0 && hopik.naturalWidth) {          // hopík: fotka
            cx = c.getContext('2d'); cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, 88, 88);
            cx.drawImage(hopik, 88 * 0.3 / 2.6, 88 * 0.3 / 2.6, 88 * 2 / 2.6, 88 * 2 / 2.6); cx = keep; return;
          }
          if (!MIC || !MIC[BALLS[i].id]) return;
          cx = c.getContext('2d'); cx.setTransform(88 / (BALL_R * 2.6), 0, 0, 88 / (BALL_R * 2.6), 0, 0); cx.clearRect(0, 0, BALL_R * 2.6, BALL_R * 2.6);
          drawBall(BALLS[i].id, BALL_R * 1.3, BALL_R * 1.3, 0.4, 0);
          cx = keep;
        });
      }
      previews();
      onSprites.push(previews);
      setCard.querySelectorAll('.kp-skin').forEach(function (b) {
        b.addEventListener('click', function () {
          var i = +b.dataset.skin, name = (T.skins || [])[i] || '', nameEl = setCard.querySelector('.kp-skinname');
          if (!SKINS[i].ok()) { nameEl.textContent = name + ' – ' + lockText(SKINS[i].b); return; }
          skin = i; store.set('kevinPongPad', SKINS[i].id);
          setCard.querySelectorAll('.kp-skin').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
          nameEl.textContent = name;
        });
      });
      // míčky: náhled nakreslený stejnou funkcí jako ve hře
      setCard.querySelectorAll('.kp-ball').forEach(function (b) {
        var i = +b.dataset.ball, c = b.querySelector('canvas'), keep = cx;
        cx = c.getContext('2d'); cx.setTransform(88 / (BALL_R * 2.6), 0, 0, 88 / (BALL_R * 2.6), 0, 0); cx.clearRect(0, 0, BALL_R * 2.6, BALL_R * 2.6);
        if (i === 0 && hopik.naturalWidth) cx.drawImage(hopik, BALL_R * 0.3, BALL_R * 0.3, BALL_R * 2, BALL_R * 2);
        else if (i > 0) drawBall(BALLS[i].id, BALL_R * 1.3, BALL_R * 1.3, 0.4, 0);
        cx = keep;
        b.addEventListener('click', function () {
          var name = (T.balls || [])[i] || '', nameEl = setCard.querySelector('.kp-ballname');
          if (!hasBadge(BALLS[i].b)) { nameEl.textContent = name + ' – ' + lockText(BALLS[i].b); return; }
          ballType = i; store.set('kevinPongBallId', BALLS[i].id);
          setCard.querySelectorAll('.kp-ball').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
          nameEl.textContent = name;
        });
      });
      var snd = setCard.querySelector('.kp-snd'), volEl = setCard.querySelector('.kp-vol');
      function showSnd() {
        snd.setAttribute('aria-pressed', String(vol > 0)); volEl.disabled = !vol;
        snd.innerHTML = '<i class="fa-solid ' + (vol ? 'fa-volume-high' : 'fa-volume-xmark') + '" aria-hidden="true"></i> ' + esc(vol ? T.on || '' : T.off || '');
      }
      showSnd();
      snd.addEventListener('click', function () {
        vol = vol ? 0 : +volEl.value; store.set('kevinPongVol', String(vol)); showSnd();
        if (vol) sfx.pad(false);                                   // ukázka, jak hlasité to je
      });
      volEl.addEventListener('input', function () { vol = +volEl.value; store.set('kevinPongVol', String(vol)); store.set('kevinPongVolLast', String(vol)); });
      volEl.addEventListener('change', function () { sfx.pad(false); });
      var keysEl = setCard.querySelector('.kp-keys');
      if (keysEl) keysEl.addEventListener('input', function () {
        keySpeed = +keysEl.value; store.set('kevinPongKeys', String(keySpeed));
        setCard.querySelector('.kp-keysval').textContent = Math.round(keySpeed * 100) + ' %';
      });
      setCard.querySelectorAll('[data-talk]').forEach(function (b) {
        b.addEventListener('click', function () {
          talk = b.dataset.talk; store.set('kevinPongTalk', talk);
          setCard.querySelectorAll('[data-talk]').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
        });
      });
      setCard.querySelectorAll('.kp-opt').forEach(function (b) {
        b.addEventListener('click', function () {
          var on = b.getAttribute('aria-pressed') !== 'true';
          b.setAttribute('aria-pressed', String(on));
          if (b.dataset.opt === 'vib') { vibOn = on; store.set('kevinPongVib', on ? '1' : '0'); if (on) vibe(30); }
          else { lefty = on; store.set('kevinPongLefty', on ? '1' : '0'); root.classList.toggle('lefty', on); setTimeout(fit, 50); }
        });
      });
      setCard.querySelector('.kp-resume').addEventListener('click', closeSettings);
      setCard.querySelector('.kp-resume').focus();
    }
    function closeSettings() {
      if (!setCard) return;
      setCard.remove(); setCard = null;
      setBtn.setAttribute('aria-expanded', 'false');
      if (setPausedGame) askToResume();
      setPausedGame = false;
    }
    setBtn.addEventListener('click', openSettings);
    document.addEventListener('fullscreenchange', onFull);
    document.addEventListener('webkitfullscreenchange', onFull);

    function close() {
      if (ac) try { ac.close(); } catch (e) { /* nevadí */ }
      if (running && !awaitStart) {
        var bye = line('odchod');
        if (bye) setTimeout(function () { window.dispatchEvent(new CustomEvent('kevin', { detail: { say: bye } })); }, 600);
      }
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey); document.removeEventListener('keyup', onKey);
      document.removeEventListener('visibilitychange', onHidden);
      removeEventListener('resize', fit); removeEventListener('resize', fxSize);
      document.removeEventListener('fullscreenchange', onFull); document.removeEventListener('webkitfullscreenchange', onFull);
      if (isFull()) { var ex = (document.exitFullscreen || document.webkitExitFullscreen).call(document); if (ex && ex.catch) ex.catch(function () {}); }
      Object.keys(comicTimers).forEach(function (k) { clearTimeout(comicTimers[k]); });
      if (K && K.dispose) K.dispose();
      root.remove();
      document.documentElement.classList.remove('kpong-open');
      window.KevinPong.isOpen = false;
      if (opts.onClose) opts.onClose();
    }

    // ---------- pomocníci ----------
    function post(url, data) {
      var body = new URLSearchParams(); Object.keys(data).forEach(function (k) { body.set(k, data[k]); });
      return fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'X-CSRF-Token': csrf || '' }, body: body }).then(function (r) { return r.json(); });
    }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; }
    function time(ms) { var s = ms / 1000, m = Math.floor(s / 60); return m + ':' + (s - m * 60).toFixed(1).padStart(4, '0'); }
    function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

    window.KevinPong.isOpen = true;
    last = performance.now();
    raf = requestAnimationFrame(step);
    syncBadges();
    startScreen();
    root.querySelector('.kpong-close').focus();
  }

  window.KevinPong = { open: open, isOpen: false };
})();
