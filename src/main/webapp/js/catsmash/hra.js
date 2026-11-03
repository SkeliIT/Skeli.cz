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
// Kevin komentuje hru hláškami z js/catsmash/hlasky.js (načte se se hrou) podle situace – série, mečbol, 9:9,
// obrat, dlouhá výměna, rychlý hopík, odstřely, trest, nehybný hráč, odveta, rekord, vzácné hlášky; bez opakování
// (balíček se zamíchá), s odstupem mezi hláškami, důležité chvíle přebijí. Chybí-li jazyk, mluví z js/lines/catsmash-<jazyk>.js.
// Kevin dělá lidské chyby: míček „sleduje“ až od části hřiště, s každým odrazem od stěny a s rychlostí se víc splete.
// Výhra přihlášeného hráče jde do tabulky pořadí (/api/pong: server měří čas od startu, pořadí = nejrychlejší
// výhra). Nepřihlášenému se nejlepší čas uloží jen v prohlížeči. Texty: KEVIN_LINES[jazyk].pong (js/lines/catsmash-<jazyk>.js).
(function () {
  if (window.KevinPong) return;
  // pevná data hry (rozměry, obtížnosti, tabulky efektů a odznaků) jsou v js/catsmash/data.js
  var D = window.CatSmash.data;
  var W = D.W, H = D.H, PAD_W = D.PAD_W, PAD_H = D.PAD_H, BALL_R = D.BALL_R, WIN = D.WIN, PLAYER_Y = D.PLAYER_Y, KEVIN_Y = D.KEVIN_Y, FRAME_W = D.FRAME_W, FRAME_H = D.FRAME_H, GLASS = D.GLASS, TOP_SLOT = D.TOP_SLOT, GEARS_KEVIN = D.GEARS_KEVIN, WIN_TOP = D.WIN_TOP, WIN_BOT = D.WIN_BOT, BGS = D.BGS, LEVELS = D.LEVELS, SHOT = D.SHOT, SHOT_IDEAL = D.SHOT_IDEAL, SHOT_SUPER = D.SHOT_SUPER, LIFT = D.LIFT;

  function open(opts) {
    opts = opts || {};
    if (window.KevinPong && window.KevinPong.isOpen) return;   // už běží: druhé otevření by vyrobilo druhý automat
    var lang = document.documentElement.lang || 'cs';
    var KL = (window.KEVIN_LINES || {})[lang] || (window.KEVIN_LINES || {}).en || {};
    var T = KL.pong || ((window.KEVIN_LINES || {}).en || {}).pong;
    var ver = opts.version ? '?' + opts.version : '';
    var pick = function (a) { return Array.isArray(a) ? a[Math.floor(Math.random() * a.length)] : a; };
    var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* nevadí */ } } };

    // ---------- okno hry ----------
    // fotka hráče u skóre: stejná jako v hlavičce webu (nepřihlášený = výchozí obrázek)
    function myFace() { var im = document.querySelector('img.user-avatar'); return im && im.getAttribute('src') || '/img/avatar-default.svg'; }
    var root = document.createElement('div');
    root.className = 'kpong';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', T.title);
    root.innerHTML =
      '<div class="kpong-amb" aria-hidden="true"></div>' +
      '<div class="kpong-box">' +
      '  <div class="kpong-top">' +
      '    <div class="kpong-score" aria-live="polite"><img class="kpong-face" src="' + esc(myFace()) + '" alt="" width="34" height="34"><span class="kpong-who">' + esc(T.you) + '</span><b class="kpong-you">0</b><i>:</i><b class="kpong-kev">0</b><span class="kpong-who">Kevin</span><img class="kpong-face kev" src="/kevin/pong/menu/kevin.webp' + ver + '" alt="" width="34" height="34"></div>' +
      '    <button type="button" class="kpong-look" aria-label="' + esc(T.lookBtn || '') + '" title="' + esc(T.lookBtn || '') + '"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></button>' +
      '    <button type="button" class="kpong-close" aria-label="' + esc(T.close) + '"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
      '  </div>' +
      '  <div class="kpong-machine"><div class="kpong-frame">' +
      '    <canvas class="kpong-mech" data-win="top" style="' + winVars(WIN_TOP) + '" aria-hidden="true"></canvas>' +
      '    <canvas class="kpong-mech" data-win="bot" style="' + winVars(WIN_BOT) + '" aria-hidden="true"></canvas>' +
      '    <div class="kpong-gears" data-set="kevin">' + GEARS_KEVIN.map(gear).join('') + '</div>' +
      '    <i class="kpong-slot" aria-hidden="true"></i>' +
      '    <div class="kpong-smoke" aria-hidden="true">' + [0, 1, 2, 3, 4, 5].map(function (k) { return '<i style="--k:' + k + '"></i>'; }).join('') + '</div>' +
      '    <i class="kpong-spk" data-side="l" aria-hidden="true"></i><i class="kpong-spk" data-side="r" aria-hidden="true"></i>' +
      '    <button type="button" class="kpong-set" aria-label="' + esc(T.menuBtn || 'Menu') + '" aria-haspopup="dialog"><i class="fa-solid fa-bars" aria-hidden="true"></i><span>' + esc(T.menuBtn || 'Menu') + '</span></button>' +
      '    <canvas class="kpong-kevin" aria-hidden="true"></canvas>' +
      '    <div class="kpong-skin" hidden aria-hidden="true"></div>' +
      '    <div class="kp-gauge" aria-hidden="true"><i></i><b>E</b></div>' +
      '    <div class="kpong-field">' +
      '      <div class="kpong-bg" aria-hidden="true"></div><canvas class="kpong-bgfx" aria-hidden="true"></canvas>' +
      // telefon: skóre jako velká průhledná čísla ve skle (Kevin nahoře, ty dole) – pod míčkem, nic nezakrývají
      '      <div class="kp-bigscore" aria-hidden="true"><b data-s="kev">0</b><b data-s="you">0</b></div>' +
      '      <canvas class="kpong-court" width="600" height="900" aria-hidden="true"></canvas><span class="kp-streak" aria-hidden="true"><b class="kp-st-n"><small>×</small><span>2</span></b>' +
      '<span class="kp-st-l">' + esc(T.streakLabel || 'SÉRIE') + '</span><i class="kp-st-fire"><i></i><i></i><i></i><i></i></i></span>' +
      '      <div class="kp-replay-ui" aria-hidden="true"><span class="kp-rp-tag">● REPLAY</span><b class="kp-rp-title"></b><b class="kp-rp-goal"></b><span class="kp-rp-skip">' + esc(T.replaySkip || '') + '</span></div>' +
      '      <div class="kpong-panel"></div>' +
      '      <div class="kp-tut" hidden><p class="kp-tut-step"></p><p class="kp-tut-text"></p><button type="button" class="kp-link kp-tut-skip"></button></div>' +
      '    </div>' +
      '  </div></div>' +
      // prohlídka: nápověda nahoře a „Zpět ke hře“ dole (jen během prohlídky)
      '  <div class="kp-look-ui" hidden><p>' + esc(T.lookHint || '') + '</p><button type="button" class="kpong-play btn-primary kp-look-back"><i class="fa-solid fa-play" aria-hidden="true"></i> ' + esc(T.lookBack || '') + '</button></div>' +
      '  <div class="kpong-pad"><button type="button" class="kpong-shot"><i class="fa-solid fa-bolt" aria-hidden="true"></i><span>' + esc(T.shot || 'Odstřel') + '</span></button><button type="button" class="kpong-stickbtn" aria-label="' + esc(T.stickBtn || 'Superútok') + '"><i class="fa-solid fa-magnet" aria-hidden="true"></i></button></div>' +
      '</div>' +
      '<p class="sr-only kpong-live" aria-live="polite"></p>';   // úvod a konec (.kpong-panel) leží přímo na skle hřiště
    document.body.appendChild(root);
    document.documentElement.classList.add('kpong-open');
    // web pod hrou se po doběhnutí náběhu hry úplně přestane kreslit (šetří grafiku, hra neškube)
    var underTimer = setTimeout(function () { document.documentElement.classList.add('kpong-under'); }, 300);
    var court =root.querySelector('.kpong-court'), cx = court.getContext('2d');
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
      // tlačítko odstřelu plave nad strojem (position: fixed) a místo nezabírá
      var padW = getComputedStyle(padEl).position === 'fixed' ? 0 : padEl.offsetWidth, padH = padW ? padEl.offsetHeight : 0;
      var availW = innerWidth - 16 - (landscape ? topBar.offsetWidth + padW + 24 : 0);
      // skóre a křížek leží přes volné místo nad strojem (vedle Kevina), na výšku tedy nezabírají řádek
      var availH = innerHeight - 16 - (landscape ? 0 : (padH ? padH + 8 : 0)) - (looking ? 96 : 0);   // prohlídka: místo pro „Zpět ke hře“
      // telefon na výšku: sklo úplně nahoře přes celou šířku, pod ním pruh pro prst se spodním okénkem stroje
      // (prst pálku ani míček nezakrývá). Kevin stojí ve skle za svou pálkou (viz níž), horní část stroje je mimo.
      var phone = !landscape && innerWidth <= 600 && !looking;   // při prohlídce celý automat
      var all = { x0: 0, x1: FRAME_W, y0: -110, y1: FRAME_H };    // nad rámem místo pro Kevina
      var cut = { x0: GLASS.x - 62, x1: GLASS.x + GLASS.w + 62, y0: -110, y1: landscape ? 1070 : 1300 };
      root.classList.toggle('kp-phone', phone);
      if (phone) {
        var safeTop = parseFloat(getComputedStyle(root).paddingTop) || 0, screenH = innerHeight - safeTop;
        var uP = Math.min(innerWidth / (GLASS.w + 2 * PHONE_RIM_X), (screenH - PHONE_FINGER) / (GLASS.h + PHONE_RIM_Y));
        var midX = GLASS.x + GLASS.w / 2, y0 = GLASS.y - PHONE_RIM_Y;
        cut = { x0: midX - innerWidth / uP / 2, x1: midX + innerWidth / uP / 2, y0: y0, y1: y0 + screenH / uP };
        availW = innerWidth; availH = screenH;
        // pruh pod sklem v % okna: tady je tlačítko odstřelu a volitelná plocha pro pálku
        var stripTop = safeTop + (GLASS.y + GLASS.h - y0) * uP;
        strip = { top: stripTop / innerHeight * 100, h: (innerHeight - stripTop) / innerHeight * 100 };
      }
      var uAll = Math.min(availW / FRAME_W, availH / FRAME_H), uCut = Math.min(availW / (cut.x1 - cut.x0), availH / (cut.y1 - cut.y0));
      var v = !looking && (phone || uCut > uAll * 1.12) ? cut : all, u = v === cut ? uCut : uAll;   // prohlídka = vždy celý automat
      machine.classList.toggle('cut', v === cut);
      machine.classList.toggle('phone', phone);
      phoneView = phone;
      // Kevin na telefonu pod plátnem hřiště: míček a pálky letí vždycky před ním, nic nezakryje
      if (phone && kevCanvas.parentNode !== field) field.insertBefore(kevCanvas, court);
      else if (!phone && kevCanvas.parentNode !== frame) frame.insertBefore(kevCanvas, root.querySelector('.kpong-skin'));
      placeShot();
      placeGauge();
      machine.style.width = Math.floor((v.x1 - v.x0) * u) + 'px';
      machine.style.height = Math.floor((v.y1 - v.y0) * u) + 'px';
      frame.style.setProperty('--u', u);
      frame.style.left = -v.x0 * u + 'px';
      frame.style.top = -v.y0 * u + 'px';
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      mechEls.forEach(function (c) {
        var w = MECH ? MECH[c.dataset.win].win : c.dataset.win === 'top' ? WIN_TOP : WIN_BOT;
        c.width = Math.round(w[2] * u * dpr); c.height = Math.round(w[3] * u * dpr);
      });
    }
    var mechEls = [].slice.call(root.querySelectorAll('.kpong-mech')), phoneView = false, looking = false;
    // telefon: kolik obrázkových pixelů rámu nechat kolem skla a kolik px pod sklem nejméně nechat pro prst
    var PHONE_RIM_X = 14, PHONE_RIM_Y = 8, PHONE_FINGER = 96, strip = { top: 74, h: 20 };
    fit();
    addEventListener('resize', fit);

    // ---------- Kevin (3D) ----------
    var K = null, kevinReady;
    var kevinLoaded = new Promise(function (res) { kevinReady = res; });
    import('/js/kevin-model.js' + ver).then(function (m) {
      K = m.createKevin(kevCanvas, {
        src: '/kevin/kevin.glb' + ver, moves: '/kevin/pohyby.json' + ver,
        light: document.body.classList.contains('light'), overscan: 1.25, alwaysRender: true,
        onReady: function () { kevCanvas.classList.add('on'); K.turn(0); if (kevinSharpness()) K.setMaxPixelRatio(kevinSharpness()); kevinReady(); }
      });
    }).catch(function () { kevinReady(); /* hra jde i bez něj */ });

    var BADGE_ICON = D.BADGE_ICON;
    var CLAIMABLE = D.CLAIMABLE;
    var LOOKS = D.LOOKS;
    var badges = {};
    // 2. 11. 2026 přeskládané odměny = odznaky všem znovu od nuly (i počítadla v prohlížeči a vybrané vzhledy)
    if (store.get('kevinPongEra') !== '2') {
      ['kevinPongBadges', 'kevinPongWins', 'kevinPongHardWins', 'kevinPongScrews', 'kevinPongDays', 'kevinPongLegacy', 'kevinPongCelebLast', 'kevinPongCeleb',
        'kevinPongPad', 'kevinPongBallId', 'kevinPongBg'].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { /* nevadí */ } });
      store.set('kevinPongEra', '2');
    }
    try { (JSON.parse(store.get('kevinPongBadges') || '[]') || []).forEach(function (k) { if (BADGE_ICON[k]) badges[k] = true; }); } catch (e) { /* nic */ }
    // zkoušky jen na test.skeli.cz a na vlastním počítači (na www nefungují):
    // #vse = na tuhle návštěvu odemkne všechny pálky, míčky a pozadí (nic se neuloží, bez #vse je vše zase zamčené),
    // #klubko = Kevin hodí klubíčko hned na začátku zápasu (na jakékoli obtížnosti)
    var TRY_HOST = /^(test\.|localhost$|127\.)/.test(location.hostname);
    var PREVIEW_ALL = TRY_HOST && /\bvse\b/.test(location.hash), FORCE_YARN = TRY_HOST && /\bklubko\b/.test(location.hash);
    // jen test/localhost: kde je hráčova pálka (pro testy ovládání prstem)
    if (TRY_HOST) window.__kpPlayer = function () { return { x: Math.round(player.x), target: Math.round(player.target) }; };
    // jen na testu/localhost: stav míčku a superútoku pro automatické testy (TmpStickIT)
    if (TRY_HOST) window.__kpSet = function (y, k) { you = y; kev = k; youEl.textContent = y; kevEl.textContent = k; bigScore(); };
    if (TRY_HOST) window.__kpSay = function (t) { say(t); };   // test: Kevinova bublina na vyzkoušení
    if (TRY_HOST) window.__kpLen = function () { return WIN; };   // test: skóre těsně před koncem zápasu
    if (TRY_HOST) window.__kpHold = function (ms) { if (stick.active) stick.active.end += ms; };   // test: delší míření kvůli snímku
    if (TRY_HOST) window.__kpBall = function () { return { x: Math.round(ball.x), y: Math.round(ball.y), vy: Math.round(ball.vy), W: W, stick: { charges: stick.charges, pts: stick.pts, armed: stick.armed, active: !!stick.active }, screw: screw && screw.kind }; };
    function hasBadge(k) { return !k || PREVIEW_ALL || !!badges[k]; }
    function owns(kind, id, b) { return hasBadge(b); }
    // pořadí položek v seznamech: zdarma první, pak podle vzácnosti odznaku
    function itemOrder(kind) {
      var list = kind === 'pad' ? SKINS : kind === 'ball' ? BALLS : BGS, idx = list.map(function (x, i) { return i; });
      function rk(i) { var b = kind === 'bg' ? BG_BADGE[list[i]] : list[i].b; return b ? D.RANK.indexOf(b) : -1; }
      return idx.sort(function (a, c) { return rk(a) - rk(c) || a - c; });
    }
    // přidá odznaky, vrátí ty opravdu nové (v pořadí BADGE_ICON)
    function addBadges(list) {
      var fresh = [];
      list.forEach(function (k) { if (BADGE_ICON[k] && !badges[k]) { badges[k] = true; fresh.push(k); } });
      if (!badges.wardrobe && LOOKS.every(function (k) { return badges[k]; })) { badges.wardrobe = true; fresh.push('wardrobe'); }
      // SkeloSquad: všech 5 odznaků za nejtěžší obtížnost
      if (!badges.skelosquad && ['hwins5', 'hfast', 'hclean', 'hsniper', 'hcomeback'].every(function (k) { return badges[k]; })) { badges.skelosquad = true; fresh.push('skelosquad'); }
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
    var BG_BADGE = D.BG_BADGE;
    if (BGS.indexOf(bgName) < 0 || !owns('bg', bgName, BG_BADGE[bgName])) bgName = 'mesto';
    var parts = [], fxLast = 0, shoot0 = 0, fxW = 1, fxH = 1;
    var BG_POS = D.BG_POS;
    function setBg(name) {
      bgName = name;
      root.dataset.bg = name;
      bgEl.style.backgroundImage = name === 'tma' ? '' : 'url(/kevin/pong/pozadi-' + name + '.webp' + ver + ')';
      bgEl.style.backgroundPosition = (BG_POS[name] || '50%') + ' 50%';
      root.querySelector('.kpong-amb').style.backgroundImage = bgEl.style.backgroundImage;   // totéž rozmazaně kolem automatu
      seedFx();
    }
    function fxSize() {
      var dpr = phoneView ? 1 : Math.min(1.5, window.devicePixelRatio || 1);   // telefon: déšť a sníh stačí v nižším rozlišení
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
      if (lowFx >= 1) return;                            // šetření: pozadí hřiště stojí
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
      if ((setCard || item || supportEl || looking || menuEl) && kind === 'say') return;   // nastavení, náhled, podpora nebo prohlídka: Kevin mlčí, ať nic nepřekrývá
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
        var kr = kind === 'say' && root.querySelector('.kpong-kevin').getBoundingClientRect();
        if (kr && kr.width) {                           // Kevin mluví: bublina vlevo vedle něj (špička k němu), ať je jasné, kdo mluví;
          var sc = root.querySelector('.kpong-top').getBoundingClientRect();   // vpravo je skóre a křížek, nahoře řádek skóre
          el.className = 'kp-comic say l out';
          el.style.left = '';
          el.style.right = Math.round(innerWidth - (kr.left + kr.width * 0.36)) + 'px';
          el.style.top = Math.round(Math.max(kr.top + kr.height * 0.42, sc.bottom + 46)) + 'px';
          room = kr.left + kr.width * 0.36;
        }
        el.style.maxWidth = Math.round(Math.min(room - 16, 300)) + 'px';
      } else if (phoneView && kind === 'say' && panel.hidden) {
        // telefon při hře: Kevinova bublina ve skle pod ním, ale pod plátnem hřiště – míček letí před ní
        el.className = 'kp-comic say in-glass';
      } else {
        // telefon: nápis odstřelu v dolním okénku pod sklem; Kevinova bublina nad menu tamtéž (sklo zabírá menu),
        // úzké okno na PC má Kevinovu bublinu v horním okénku pod ním (špička k němu)
        var winName = kind === 'say' && !phoneView ? 'top' : 'bot';
        var win = root.querySelector('.kpong-mech[data-win="' + winName + '"]').getBoundingClientRect();
        el.className = 'kp-comic ' + kind + (kind === 'say' ? ' top' : ' bottom');
        el.style.left = Math.round(win.left + win.width / 2) + 'px';
        el.style.top = Math.round(Math.min(win.top + win.height / 2, innerHeight - 34)) + 'px';
        el.style.maxWidth = Math.round(win.width + 16) + 'px';
      }
      if (el.classList.contains('in-glass')) field.insertBefore(el, court); else root.appendChild(el);
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
    // délka zápasu (10 / 15 / 20 gólů): tabulka rekordů je pro každou délku zvlášť, obtížnost je v násobiči skóre
    var LENGTHS = [10, 20, 30], matchLen = LENGTHS.indexOf(+store.get('kevinPongLen')) >= 0 ? +store.get('kevinPongLen') : 10;
    // tabulka je jedna: přepínač Skóre / Čas (nejrychlejší výhra), délka zápasu a obtížnost (Lehká soupeří jen s Lehkou)
    var boardKind = store.get('kevinPongBoardKind') === 'time' ? 'time' : 'score', boardD = 0;
    // sezóna: věčná tabulka (all) nebo tento měsíc (month) – každý měsíc nová šance dostat se nahoru
    var boardSeason = store.get('kevinPongSeason') === 'month' ? 'month' : 'all';
    function monthName() { try { var m = new Date().toLocaleDateString(document.documentElement.lang || 'cs', { month: 'long' }); return m.charAt(0).toUpperCase() + m.slice(1); } catch (e) { return ''; } }
    function seasonQ() { return boardSeason === 'month' ? '&season=month' : ''; }
    function seasonHead() { return boardSeason === 'month' ? ' · ' + monthName() : ''; }
    function medal(place) { return place <= 3 ? ' p' + place : ''; }   // první tři: zlatá, stříbrná, bronzová korunka
    // místní rekord času na obtížnosti a délce (do 10 gólů starý klíč, ať se dřívější rekordy neztratí)
    function ptsKey(len, d) { return 'kevinPongPts' + len + 'd' + d; }   // místní rekord skóre (délka a obtížnost)
    function timeKey(d, len) { return 'kevinPongBest' + d + (len === 10 ? '' : 'x' + len); }
    var you = 0, kev = 0, running = false, paused = false, started = 0, serveAt = 0, serving = 1;
    var player = { x: W / 2, target: W / 2, w: PAD_W, shotAt: -1e9, shotUsed: true, stunUntil: 0, lastHit: -1e9, boosted: false };
    // šroubek ze stroje (chytí ho pálka = vylepšení na 8 s), Kevinovo klubíčko (trojka, jednou za zápas), Kevinova nálada:
    // vede o 3 a víc = líný (pomalejší, víc se splete, zívá), prohrává o 3 a víc = snaží se
    var screw = null, nextScrewAt = 0, powers = {}, yarn = null, yarnUsed = false, mood = 'calm';
    var MOOD = D.MOOD;   // [rychlost běhu, chyba odhadu]
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
    var MAT = D.MAT;
    // stav přívěsků zvlášť pro hráčovu a Kevinovu pálku (úhel a rychlost každého kyvadla, poslední poloha pálky)
    var playerRig = { hang: [], move: { last: null, v: 0, t: 0 } }, kevinRig = { hang: [], move: { last: null, v: 0, t: 0 } };
    var hangSkin = -1, HANG_G = 2200;
    function padSprite(i) { var s = SKINS[i]; return s && s.img && PAL && PAL[s.img] && palImg.complete && palImg.naturalWidth ? PAL[s.img] : null; }
    function matOf(i) { return MAT[SKINS[i] && SKINS[i].img] || { mode: 'rigid' }; }
    function partMode(mat, p) { return p.fixed || mat.mode === 'rigid' ? 'fixed' : p.mode || mat.mode; }
    // délka kyvadla v herních bodech: tuhý kus = od čepu k těžišti, provázek = provázek + půl klíčku,
    // měkký = celá délka, korálky = hloubka smyčky
    function pendLen(mat, p, s) {
      var m = partMode(mat, p);
      if (m === 'string') return (p.cord + Math.hypot(p.img[2], p.img[3]) * p.scale * 0.5) * s;
      if (m === 'swing') return Math.max(8, (p.y - p.py + p.img[3]) * s * 0.6);
      if (m === 'leg') return (mat.leg + p.img[3] * 0.5) * s * 0.8;
      return Math.max(8, (p.y + p.img[3]) * s * 0.85);
    }
    function hangTick(now) {
      if (hangSkin !== skin) { playerRig.hang = []; hangSkin = skin; drips = []; dripNext = []; pfx = []; padFlash = null; flight = null; }
      hangStep(playerRig, padSprite(skin), matOf(skin), player.x, now);
      hangStep(kevinRig, kevinSprite(), MAT.kevin, kevin.x, now);
    }
    function kevinSprite() { return PAL && PAL.kevin && palImg.complete && palImg.naturalWidth ? PAL.kevin : null; }
    function hangStep(rig, sp, mat, x, now) {
      var mv = rig.move, dt = mv.t ? Math.min(0.05, (now - mv.t) / 1000) : 0;
      mv.t = now;
      if (!sp || mat.mode === 'rigid' || dt <= 0 || now < hitStop) return;
      var v = mv.last == null ? 0 : (x - mv.last) / dt;
      var acc = clamp((v - mv.v) / dt, -30000, 30000) * mat.push;
      mv.last = x; mv.v = v;
      var s = PAD_W / sp.w;
      sp.parts.forEach(function (p, i) {
        if (partMode(mat, p) === 'fixed') return;
        if (mat.mode === 'beads') i = 0;                // korálky na jedné šňůrce = jedno kyvadlo
        var st = rig.hang[i] || (rig.hang[i] = { a: 0, w: 0, k: i % 2 ? rnd(1.06, 1.18) : rnd(0.84, 0.95), done: 0 });
        if (!st.L) st.L = pendLen(mat, p, s) * st.k;
        if (st.done === now) return;
        st.done = now;
        for (var k = 0; k < 3; k++) {
          var h = dt / 3;
          st.w += (-(HANG_G / st.L) * Math.sin(st.a) - mat.stiff * st.k * st.a - (acc / st.L) * Math.cos(st.a) - mat.damp * (2 - st.k) * st.w) * h;
          st.a = clamp(st.a + st.w * h, -1.1, 1.1);
        }
      });
    }
    function hangKick(strength, rig, mat) {
      rig = rig || playerRig; mat = mat || matOf(skin);
      rig.hang.forEach(function (st) { if (st) st.w += (Math.random() - 0.5) * strength * (mat.push || 0); });
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

    // ---------- efekty pálek a míčků: jen ozdoba – malé, krátké a průhledné, kreslí se pod míček, ať nezakrývají hřiště ----------
    var pfx = [], pfxT = 0, padGeo = null, padFlash = null, ballFx = { kind: null, until: 0 }, nextIdle = 0;
    var eqLv = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], eqT = 0;
    // sloupce ekvalizéru v obrázku pálky (souřadnice těla pálky): první sloupec, rozestup, šířka, spodek, nejvyšší výška
    var EQ = { x0: 75, step: 31.2, w: 25, bottom: 107, max: 42, bg: [68, 58, 322, 51] };
    function addP(o) { if (pfx.length < (lowFx >= 3 ? 30 : lowFx ? 70 : 180)) { o.age = 0; pfx.push(o); } }
    function curPad() { return SKINS[skin] && SKINS[skin].img; }
    // automat podle pálky (kevin/pong/stroje/, tools/catsmash-stroje.py): leží nad hřištěm a okénky s koly
    // (otvory jsou průhledné), dnešní automat ram.webp se pod ním schová. Vypínač = ⚙ „Atmosféra pálky“.
    var STROJE = null, skinEl = root.querySelector('.kpong-skin'), frameEl = root.querySelector('.kpong-frame');
    fetch('/kevin/pong/stroje/stroje.json' + ver).then(function (r) { return r.json(); }).then(function (j) { STROJE = j; setSkin(); }).catch(function () { /* bez automatů */ });
    function setSkin() {
      var id = curPad(), sk = atmoOn && STROJE && id && STROJE[id];
      frameEl.classList.toggle('themed', !!sk);
      frameEl.style.setProperty('--menu-tint', sk && SKINS[skin] && SKINS[skin].rim ? SKINS[skin].rim : '#e6b730');   // kov tlačítka MENU podle automatu
      skinEl.hidden = !sk;
      applyWins(sk ? id : null);
      if (!sk) return;
      skinEl.style.setProperty('--skin', 'url("/kevin/pong/stroje/' + id + '.webp' + ver + '")');
      skinEl.dataset.pad = id;
    }
    // výbuch u hráčovy pálky – čím lepší odpal, tím větší efekt: 1 = obyčejný odraz (menší), 1.5 = dobrý odstřel,
    // 2 = perfektní odstřel (velký efekt navíc), 3 = SUPER (ještě větší); pokažený odstřel efekt nemá
    function padBurst(level, now) {
      var id = curPad(), g = padGeo;
      if (!id || !g) return;
      var n = level >= 3 ? 1.5 : level >= 2 ? 1.2 : level >= 1.5 ? 1 : 0.6, cxp = g.x, top = g.top, i;
      function spread() { return cxp + rnd(-g.w * 0.45, g.w * 0.45); }
      if (level >= 2 && lowFx < 3) padEpic(id, g, now, level === 3 ? 1.45 : 1);
      switch (id) {
        case 'vetev':
          for (i = 0; i < 7 * n; i++) addP({ t: 'leaf', x: spread(), y: top + 4, vx: rnd(-120, 120), vy: rnd(-260, -120), g: 160, drag: 1.4, life: 1.5, size: rnd(3.5, 5), rot: rnd(0, 6), vr: rnd(-8, 8), c: Math.random() < 0.3 ? '#9fd65a' : '#5aa83a' });
          break;
        case 'led':
          for (i = 0; i < 14 * n; i++) addP({ t: 'flake', x: spread(), y: top, vx: rnd(-50, 50), vy: rnd(-420, -200), g: 0, drag: 2.2, life: 0.9, size: rnd(1.6, 3), rot: rnd(0, 6), vr: rnd(-3, 3), c: '#e6f7ff' });
          for (i = 0; i < 4 * n; i++) addP({ t: 'streak', x: spread(), y: top - 4, vx: 0, vy: -520, g: 0, drag: 1.5, life: 0.45, size: rnd(14, 26), c: 'rgba(210, 240, 255, .5)' });
          ballFx = { kind: 'frost', until: now + 1600 };
          break;
        case 'lava':
          for (i = 0; i < 16 * n; i++) addP({ t: 'spark', x: spread(), y: top + 2, vx: rnd(-160, 160), vy: rnd(-300, -80), g: 700, life: 0.7, size: rnd(1.2, 2.2), c: Math.random() < 0.5 ? '#ffd36b' : '#ff7a1e' });
          ballFx = { kind: 'burn', until: now + 1600 };
          break;
        case 'retez':
          padFlash = { kind: 'gold', at: now, dur: 380 };
          addP({ t: 'paw', x: cxp, y: top - 6, vx: 0, vy: -50, g: 0, drag: 0.5, life: 1.1, size: 9, c: '#ffd23f' });
          for (i = 0; i < 8 * n; i++) addP({ t: 'spark', x: spread(), y: top, vx: rnd(-80, 80), vy: rnd(-200, -60), g: 300, life: 0.6, size: 1.3, c: '#fff1a8' });
          hangKick(10);
          break;
        case 'graffiti':
          for (i = 0; i < 12 * n; i++) addP({ t: 'drop', x: spread(), y: top + 2, vx: rnd(-170, 170), vy: rnd(-280, -90), g: 900, life: 0.8, size: rnd(1.8, 3.2), c: ['#ff4fd8', '#ffd23f', '#3fb6ff', '#7cff6b'][i % 4] });
          ballFx = { kind: 'paint', until: now + 1400 };
          break;
        case 'plys':
          for (i = 0; i < 8 * n; i++) addP({ t: 'fluff', x: spread(), y: top + 6, vx: rnd(-70, 70), vy: rnd(-130, -40), g: -10, drag: 1.6, life: 1.2, size: rnd(2, 3.5), c: '#ffffff' });
          for (i = 0; i < 3 * n; i++) addP({ t: 'heart', x: spread(), y: top - 2, vx: rnd(-30, 30), vy: rnd(-110, -70), g: 0, drag: 0.6, life: 1.1, size: rnd(4, 5.5), c: '#ff8fb0' });
          break;
        case 'neon':
          padFlash = { kind: 'bolt', at: now, dur: 260, seed: Math.random() * 99 };
          ballFx = { kind: 'neon', until: now + 1400 };
          break;
        case 'ekvalizer':
          for (i = 0; i < eqLv.length; i++) eqLv[i] = 1;
          for (i = 0; i < 6 * n; i++) addP({ t: 'note', x: spread(), y: top - 4, vx: rnd(-40, 40), vy: rnd(-120, -70), g: 0, drag: 0.5, life: 1, size: 5, c: '#e6b730' });
          break;
        case 'jadeit':
          addP({ t: 'ring', x: cxp, y: top + 6, vx: 0, vy: 0, g: 0, life: 0.6, size: g.w * 0.5, c: '#7fd6a0' });
          addP({ t: 'ring', x: cxp, y: top + 6, vx: 0, vy: 0, g: 0, life: 0.85, size: g.w * 0.75, c: '#b9f0cc' });
          for (i = 0; i < 6 * n; i++) addP({ t: 'spark', x: spread(), y: top, vx: rnd(-60, 60), vy: rnd(-160, -60), g: 120, life: 0.8, size: 1.4, c: '#bff5d2' });
          break;
        case 'perly':
          padFlash = { kind: 'pearl', at: now, dur: 450 };
          for (i = 0; i < 6 * n; i++) addP({ t: 'bead', x: spread(), y: top + 10, vx: rnd(-90, 90), vy: rnd(-200, -90), g: 800, life: 0.8, size: rnd(1.6, 2.4), c: '#fff6fb' });
          break;
        case 'mince':
          for (i = 0; i < 6 * n; i++) addP({ t: 'coin', x: spread(), y: top + 2, vx: rnd(-110, 110), vy: rnd(-330, -180), g: 900, life: 0.9, size: rnd(3, 4), rot: rnd(0, 6), vr: rnd(10, 18), c: '#ffd23f' });
          coinChime();
          hangKick(8);
          break;
        case 'cip':
          padFlash = { kind: 'circuit', at: now, dur: 420 };
          for (i = 0; i < 7 * n; i++) addP({ t: 'pixel', x: spread(), y: top - 2, vx: rnd(-40, 40), vy: rnd(-140, -60), g: 0, drag: 0.8, life: 0.8, size: rnd(1.6, 2.6), c: Math.random() < 0.5 ? '#59f0a0' : '#ffd23f' });
          break;
        case 'kola':
          for (i = 0; i < 5 * n; i++) addP({ t: 'puff', x: g.x + g.w * (Math.random() < 0.5 ? -0.42 : 0.42), y: top + 10, vx: rnd(-30, 30), vy: rnd(-70, -30), g: -20, drag: 1.2, life: 1.1, size: rnd(5, 8), c: '#e9e4dc' });
          for (i = 0; i < 10 * n; i++) addP({ t: 'spark', x: spread(), y: top + 8, vx: rnd(-150, 150), vy: rnd(-220, -40), g: 700, life: 0.5, size: 1.3, c: '#ffb35c' });
          break;
      }
    }
    // ---------- atmosféra pálky: jemná vrstva přes vybrané pozadí, jen na krajích hřiště a na čarách ----------
    // (míček a pálky jsou nad ní; vypínač v ⚙ „Atmosféra pálky“, localStorage kevinPongAtmo)
    var atmoOn = store.get('kevinPongAtmo') !== '0', apfx = [], atmoT = 0, atmoNext = 0, atmoCache = {};
    // tvary, které se pro pálku vymyslí jednou (úponky, tagy, dráhy spoje, hvězdičky…)
    function atmoShapes(id) {
      if (atmoCache[id]) return atmoCache[id];
      var o = {}, i, j;
      if (id === 'led') {                               // námraza: krystaly z rohů
        o.cracks = [];
        [[0, 0], [W, 0], [0, H], [W, H]].forEach(function (c) {
          for (i = 0; i < 7; i++) {
            var a = Math.atan2(H / 2 - c[1], W / 2 - c[0]) + rnd(-0.9, 0.9), len = rnd(40, 120), pts = [[c[0], c[1]]];
            for (j = 1; j <= 4; j++) pts.push([c[0] + Math.cos(a + rnd(-0.25, 0.25)) * len * j / 4, c[1] + Math.sin(a + rnd(-0.25, 0.25)) * len * j / 4]);
            o.cracks.push(pts);
          }
        });
      } else if (id === 'graffiti') {                   // vybledlé tagy a cákance po stranách skla
        o.splats = [];
        for (i = 0; i < 9; i++) o.splats.push({ x: i % 2 ? rnd(W - 50, W - 8) : rnd(8, 50), y: rnd(120, H - 160), r: rnd(6, 16), c: ['#ff4fd8', '#ffd23f', '#3fb6ff', '#7cff6b'][i % 4], drip: rnd(10, 40), seed: rnd(0, 9) });
      } else if (id === 'mince') {                      // zlaté hvězdičky v rozích
        o.stars = [];
        for (i = 0; i < 16; i++) { var cx0 = i % 2 ? W : 0, cy0 = i % 4 < 2 ? 0 : H; o.stars.push({ x: Math.abs(cx0 - rnd(6, 90)), y: Math.abs(cy0 - rnd(6, 110)), ph: rnd(0, 6), size: rnd(1.5, 3) }); }
      } else if (id === 'cip') {                        // dráhy plošného spoje podél levého a pravého okraje
        o.traces = [];
        for (i = 0; i < 8; i++) {
          var left = i % 2 === 0, x = left ? 6 : W - 6, y = rnd(100, H - 100), pts = [[x, y]];
          for (j = 0; j < 3; j++) { x += (left ? 1 : -1) * rnd(14, 40); pts.push([x, y]); y += rnd(-50, 50); pts.push([x, y]); }
          o.traces.push({ pts: pts, ph: rnd(0, 1) });
        }
      } else if (id === 'kola') {                       // ozubená kola v rozích
        o.gears = [[0, 0, 46, 1], [W, 0, 38, -1], [0, H, 40, -1], [W, H, 50, 1], [W, H * 0.5, 26, 1]];
      }
      atmoCache[id] = o;
      return o;
    }
    function gearPath(x, y, r, teeth, rot) {
      cx.beginPath();
      for (var i = 0; i <= teeth * 2; i++) { var a = rot + i / (teeth * 2) * Math.PI * 2, rr = i % 2 ? r : r * 0.82; cx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      cx.closePath();
    }
    // vrstva pod vším: vrací true, když nakreslila vlastní prostřední čáru
    function drawAtmo(now) {
      var id = curPad();
      if (!atmoOn || !id || lowFx >= 2) return false;
      var mid = (KEVIN_Y + PLAYER_Y) / 2, o = atmoShapes(id), i, g, t = now / 1000, ownMid = false;
      cx.save();
      switch (id) {
        case 'led':
          [[0, 0], [W, 0], [0, H], [W, H]].forEach(function (c) {
            g = cx.createRadialGradient(c[0], c[1], 0, c[0], c[1], 150);
            g.addColorStop(0, 'rgba(220, 245, 255, .22)'); g.addColorStop(1, 'rgba(220, 245, 255, 0)');
            cx.fillStyle = g; cx.fillRect(c[0] ? W - 150 : 0, c[1] ? H - 150 : 0, 150, 150);
          });
          cx.strokeStyle = 'rgba(230, 248, 255, .32)'; cx.lineWidth = 1;
          o.cracks.forEach(function (pts) { cx.beginPath(); pts.forEach(function (p, k) { cx[k ? 'lineTo' : 'moveTo'](p[0], p[1]); }); cx.stroke(); });
          cx.strokeStyle = 'rgba(190, 235, 255, .35)'; cx.lineWidth = 2;
          cx.beginPath(); cx.moveTo(0, mid); cx.lineTo(W, mid); cx.stroke(); ownMid = true;
          break;
        case 'lava':
          g = cx.createLinearGradient(0, H, 0, H * 0.72);
          g.addColorStop(0, 'rgba(255, 90, 10, .26)'); g.addColorStop(1, 'rgba(255, 90, 10, 0)');
          cx.fillStyle = g; cx.fillRect(0, H * 0.72, W, H * 0.28);
          cx.strokeStyle = 'rgba(255, 170, 90, .1)'; cx.lineWidth = 2;   // tetelení vzduchu
          for (i = 0; i < 5; i++) {
            cx.beginPath();
            for (var y = H; y > H * 0.78; y -= 6) cx.lineTo(W * (0.1 + i * 0.2) + Math.sin(y / 18 + t * 3 + i) * 6, y);
            cx.stroke();
          }
          cx.strokeStyle = 'rgba(255, 120, 30, ' + (0.28 + 0.08 * Math.sin(t * 2)) + ')'; cx.lineWidth = 2;
          cx.beginPath(); cx.moveTo(0, mid); cx.lineTo(W, mid); cx.stroke(); ownMid = true;
          break;
        case 'vetev':
          cx.strokeStyle = 'rgba(120, 190, 80, .22)'; cx.lineWidth = 3; cx.setLineDash([14, 14]);
          cx.beginPath(); cx.moveTo(0, mid); cx.lineTo(W, mid); cx.stroke(); cx.setLineDash([]); ownMid = true;
          break;
        case 'neon':
          var fl = Math.random() < 0.012 ? 0.3 : 1;      // občas zabliká
          cx.shadowBlur = 12;
          cx.shadowColor = '#7df9ff'; cx.strokeStyle = 'rgba(125, 249, 255, ' + 0.3 * fl + ')'; cx.lineWidth = 2; cx.strokeRect(5, 5, W - 10, H - 10);
          cx.shadowColor = '#c76bff'; cx.strokeStyle = 'rgba(199, 107, 255, ' + 0.45 * fl + ')'; cx.lineWidth = 2.5;
          cx.beginPath(); cx.moveTo(14, mid); cx.lineTo(W - 14, mid); cx.stroke(); ownMid = true;
          break;
        case 'retez':                                   // zlato: teplé světlo od horní a dolní hrany, prostřední čára jako řetízek
          [[0, 1], [H, -1]].forEach(function (e) {
            g = cx.createLinearGradient(0, e[0], 0, e[0] + e[1] * 120);
            g.addColorStop(0, 'rgba(255, 200, 70, .16)'); g.addColorStop(1, 'rgba(255, 200, 70, 0)');
            cx.fillStyle = g; cx.fillRect(0, e[1] > 0 ? 0 : H - 120, W, 120);
          });
          cx.strokeStyle = 'rgba(255, 210, 63, .38)'; cx.lineWidth = 1.6;
          for (var lx = 8; lx < W; lx += 16) { cx.beginPath(); cx.ellipse(lx, mid, 6, 3.2, 0, 0, 7); cx.stroke(); }   // články
          ownMid = true;
          break;
        case 'graffiti':
          o.splats.forEach(function (p) {
            cx.globalAlpha = 0.2; cx.fillStyle = p.c;
            cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 7); cx.fill();
            for (var k = 0; k < 5; k++) { var a = p.seed + k * 1.3; cx.beginPath(); cx.arc(p.x + Math.cos(a) * p.r * 1.3, p.y + Math.sin(a) * p.r * 1.3, p.r * 0.25, 0, 7); cx.fill(); }
            cx.fillRect(p.x - 1.5, p.y, 3, p.drip);
          });
          cx.globalAlpha = 1;
          break;
        case 'plys':
          g = cx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.65);
          g.addColorStop(0, 'rgba(255, 180, 205, 0)'); g.addColorStop(1, 'rgba(255, 180, 205, .2)');
          cx.fillStyle = g; cx.fillRect(0, 0, W, H);
          break;
        case 'ekvalizer':                               // prostřední čára = zvuková vlna podle dění ve hře
          var lv = eqLv.reduce(function (a, b) { return a + b; }, 0) / eqLv.length;
          cx.strokeStyle = 'rgba(230, 183, 48, .4)'; cx.lineWidth = 2; cx.beginPath();
          for (var x = 0; x <= W; x += 6) cx.lineTo(x, mid + Math.sin(x / 22 + t * 6) * Math.sin(x / 70 - t * 2) * (4 + lv * 18));
          cx.stroke(); ownMid = true;
          break;
        case 'jadeit':
          g = cx.createLinearGradient(0, H, 0, H * 0.7);
          g.addColorStop(0, 'rgba(110, 210, 150, .2)'); g.addColorStop(1, 'rgba(110, 210, 150, 0)');
          cx.fillStyle = g; cx.fillRect(0, H * 0.7, W, H * 0.3);
          for (i = 0; i < 4; i++) {                      // pomalu plující obláčky oparu
            var mx = (W * (i * 0.3 + 0.1) + t * 12 * (i % 2 ? 1 : -1)) % (W + 120) - 60;
            g = cx.createRadialGradient(mx, H * 0.86, 0, mx, H * 0.86, 70);
            g.addColorStop(0, 'rgba(160, 235, 190, .1)'); g.addColorStop(1, 'rgba(160, 235, 190, 0)');
            cx.fillStyle = g; cx.fillRect(mx - 70, H * 0.86 - 70, 140, 140);
          }
          break;
        case 'perly':
          g = cx.createLinearGradient(0, 0, W, 0);
          for (i = 0; i <= 6; i++) g.addColorStop(i / 6, 'hsla(' + ((i * 60 + t * 40) % 360) + ', 80%, 85%, .35)');
          cx.strokeStyle = g; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(0, mid); cx.lineTo(W, mid); cx.stroke(); ownMid = true;
          g = cx.createLinearGradient(0, 0, 40, 0); g.addColorStop(0, 'rgba(255, 235, 250, .14)'); g.addColorStop(1, 'rgba(255, 235, 250, 0)');
          cx.fillStyle = g; cx.fillRect(0, 0, 40, H);
          g = cx.createLinearGradient(W, 0, W - 40, 0); g.addColorStop(0, 'rgba(225, 240, 255, .14)'); g.addColorStop(1, 'rgba(225, 240, 255, 0)');
          cx.fillStyle = g; cx.fillRect(W - 40, 0, 40, H);
          break;
        case 'mince':
          o.stars.forEach(function (p) {
            var a = Math.max(0, Math.sin(t * 2 + p.ph)) * 0.6;
            if (a < 0.05) return;
            cx.globalAlpha = a; cx.strokeStyle = '#ffe27a'; cx.lineWidth = 1;
            cx.beginPath(); cx.moveTo(p.x - p.size * 2, p.y); cx.lineTo(p.x + p.size * 2, p.y); cx.moveTo(p.x, p.y - p.size * 2); cx.lineTo(p.x, p.y + p.size * 2); cx.stroke();
          });
          cx.globalAlpha = 1;
          break;
        case 'cip':
          o.traces.forEach(function (tr) {
            cx.strokeStyle = 'rgba(89, 240, 160, .2)'; cx.lineWidth = 1.5; cx.beginPath();
            tr.pts.forEach(function (p, k) { cx[k ? 'lineTo' : 'moveTo'](p[0], p[1]); }); cx.stroke();
            var e = tr.pts[tr.pts.length - 1]; cx.fillStyle = 'rgba(89, 240, 160, .35)'; cx.fillRect(e[0] - 2, e[1] - 2, 4, 4);
            // puls běží po dráze
            var ph = (t * 0.35 + tr.ph) % 1, seg = Math.floor(ph * (tr.pts.length - 1)), u = ph * (tr.pts.length - 1) - seg, A = tr.pts[seg], B = tr.pts[seg + 1];
            cx.fillStyle = 'rgba(160, 255, 200, .7)'; cx.beginPath(); cx.arc(A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, 2, 0, 7); cx.fill();
          });
          cx.strokeStyle = 'rgba(89, 240, 160, .28)'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(0, mid); cx.lineTo(W, mid); cx.stroke();
          cx.fillStyle = 'rgba(89, 240, 160, .4)'; for (var cxs = 30; cxs < W; cxs += 60) cx.fillRect(cxs - 2, mid - 2, 4, 4);
          ownMid = true;
          break;
        case 'kola':
          o.gears.forEach(function (gg, k) {
            gearPath(gg[0], gg[1], gg[2], Math.round(gg[2] / 4), t * 0.35 * gg[3] * 40 / gg[2]);
            cx.fillStyle = 'rgba(120, 72, 36, .34)'; cx.fill();
            cx.strokeStyle = 'rgba(208, 138, 74, .4)'; cx.lineWidth = 1.4; cx.stroke();
            cx.fillStyle = 'rgba(40, 24, 12, .3)'; cx.beginPath(); cx.arc(gg[0], gg[1], gg[2] * 0.25, 0, 7); cx.fill();
          });
          break;
      }
      cx.restore();
      atmoParticles(now, id);
      return ownMid;
    }

    // občasné drobnosti ve vzduchu (vločka, uhlík, lístek, obláček páry) – málo a pomalu
    function atmoParticles(now, id) {
      var dt = atmoT ? Math.min(0.05, (now - atmoT) / 1000) : 0;
      atmoT = now;
      if (paused || now < hitStop) dt = 0;
      if (now > atmoNext && dt > 0) {
        atmoNext = now + rnd(700, 1600);
        var p = null;
        if (id === 'led') p = { t: 'flake', x: rnd(20, W - 20), y: -6, vx: rnd(-10, 10), vy: rnd(25, 45), size: rnd(1.5, 2.6), rot: 0, vr: rnd(-1, 1), c: '#e6f7ff', life: 14 };
        if (id === 'lava') p = { t: 'spark', x: rnd(20, W - 20), y: H + 4, vx: rnd(-8, 8), vy: rnd(-55, -30), size: rnd(1, 1.8), c: '#ffb35c', life: 5 };
        if (id === 'vetev' && Math.random() < 0.6) p = { t: 'leaf', x: rnd(20, W - 20), y: -6, vx: rnd(-10, 10), vy: rnd(20, 35), size: rnd(3, 4.5), rot: rnd(0, 6), vr: rnd(-2, 2), c: '#6fbf4a', life: 18 };
        if (id === 'kola' && Math.random() < 0.4) p = { t: 'puff', x: Math.random() < 0.5 ? 20 : W - 20, y: Math.random() < 0.5 ? 30 : H - 30, vx: rnd(-6, 6), vy: rnd(-14, -6), size: rnd(8, 12), c: '#ece6de', life: 3, a: 0.12 };
        if (id === 'plys' && Math.random() < 0.5) p = { t: 'fluff', x: rnd(20, W - 20), y: -6, vx: rnd(-8, 8), vy: rnd(12, 22), size: rnd(1.5, 2.5), c: '#ffffff', life: 16, a: 0.5 };
        if (p) { p.age = 0; p.a = p.a || 0.45; apfx.push(p); }
      }
      apfx = apfx.filter(function (p) {
        p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.vr) p.rot += p.vr * dt;
        if (p.t === 'leaf' || p.t === 'flake' || p.t === 'fluff') p.x += Math.sin(p.age * 1.7 + p.size) * 12 * dt;
        return p.age < p.life && p.y > -20 && p.y < H + 20;
      });
      if (apfx.length) drawPfx(apfx);
    }
    // perfektní odstřel „na steroidech“: velký efekt v duchu pálky (krátký, kolem pálky, míček zůstává vidět)
    function padEpic(id, g, now, big) {
      var cxp = g.x, top = g.top, i, a;
      function ring(c, size, life, flat) { addP({ t: 'ring', x: cxp, y: top + 4, vx: 0, vy: 0, g: 0, life: life, size: size * big, c: c, flat: flat || 0.28, a: 0.8 }); }
      function rays(c, size) { addP({ t: 'rays', x: cxp, y: top, vx: 0, vy: 0, g: 0, life: 0.45, size: size * big, c: c, rot: rnd(0, 1), a: 0.7 }); }
      switch (id) {
        case 'vetev':                                   // tornádo z listí kolem pálky + zelená tlaková vlna
          for (i = 0; i < 26 * big; i++) addP({ t: 'leaf', x: cxp, y: top, vx: 0, vy: 0, g: 0, orbit: { cx: cxp, cy: top - 4, ang: rnd(0, 6), rad: rnd(6, 30), va: rnd(7, 11) * (i % 2 ? 1 : -1), grow: rnd(25, 45), vx: 0, vy: rnd(-120, -60) }, life: 1.4, size: rnd(3.5, 5.5), rot: rnd(0, 6), vr: rnd(-10, 10), c: ['#5aa83a', '#86d152', '#9fd65a', '#3f8f2a'][i % 4] });
          ring('#9fd65a', g.w * 0.9, 0.7); ring('#5aa83a', g.w * 1.3, 0.9);
          break;
        case 'led':                                     // ledová exploze: střepy ledu na všechny strany, mrazivá vlna, záblesk
          for (i = 0; i < 18 * big; i++) { a = rnd(Math.PI * 1.05, Math.PI * 1.95); addP({ t: 'shard', x: cxp + rnd(-10, 10), y: top, vx: Math.cos(a) * rnd(160, 320), vy: Math.sin(a) * rnd(160, 320), g: 500, drag: 0.8, life: 0.9, size: rnd(3, 6), rot: a + Math.PI / 2, vr: rnd(-6, 6), c: '#d8f5ff' }); }
          for (i = 0; i < 20 * big; i++) addP({ t: 'flake', x: cxp + rnd(-g.w / 2, g.w / 2), y: top, vx: rnd(-60, 60), vy: rnd(-260, -80), g: 0, drag: 1.6, life: 1.1, size: rnd(2, 3.5), rot: rnd(0, 6), vr: rnd(-3, 3), c: '#ffffff' });
          ring('#c6f1ff', g.w * 1.2, 0.6); ring('#ffffff', g.w * 0.7, 0.4);
          padFlash = { kind: 'frost', at: now, dur: 500 };
          break;
        case 'lava':                                    // erupce: fontána žhavých kapek, ohnivý kruh, kouř
          for (i = 0; i < 34 * big; i++) addP({ t: Math.random() < 0.4 ? 'drop' : 'spark', x: cxp + rnd(-g.w * 0.3, g.w * 0.3), y: top, vx: rnd(-150, 150), vy: rnd(-460, -200), g: 900, life: 1, size: rnd(1.5, 3), c: ['#fff1a8', '#ffb02e', '#ff6a00', '#c22a00'][i % 4] });
          for (i = 0; i < 6; i++) addP({ t: 'puff', x: cxp + rnd(-g.w / 2, g.w / 2), y: top, vx: rnd(-20, 20), vy: rnd(-60, -30), g: 0, drag: 1, life: 1.3, size: rnd(6, 10), c: '#6b625a', a: 0.3 });
          ring('#ff6a00', g.w * 1.1, 0.55); rays('#ffb02e', 60);
          break;
        case 'retez':                                   // zlatá exploze: obří otisk tlapky, paprsky, déšť jisker
          addP({ t: 'paw', x: cxp, y: top - 22, vx: 0, vy: -20, g: 0, life: 0.9, size: 16 * big, grow: 0.6, c: '#ffd23f', a: 0.75 });
          rays('#fff1a8', 70);
          for (i = 0; i < 26 * big; i++) addP({ t: 'spark', x: cxp + rnd(-g.w / 2, g.w / 2), y: top, vx: rnd(-180, 180), vy: rnd(-320, -100), g: 400, life: 0.9, size: rnd(1.2, 2), c: i % 3 ? '#ffe27a' : '#ffffff' });
          padFlash = { kind: 'gold', at: now, dur: 420 };
          hangKick(16);
          break;
        case 'graffiti':                                // barevná bomba: velké cákance, kaňky na hřišti, duhový kruh
          for (i = 0; i < 30 * big; i++) addP({ t: 'drop', x: cxp + rnd(-g.w * 0.3, g.w * 0.3), y: top, vx: rnd(-280, 280), vy: rnd(-380, -100), g: 900, life: 0.9, size: rnd(2, 3.6), c: ['#ff4fd8', '#ffd23f', '#3fb6ff', '#7cff6b'][i % 4] });
          for (i = 0; i < 5; i++) addP({ t: 'splat', x: cxp + rnd(-g.w, g.w), y: top - rnd(20, 90), vx: 0, vy: 0, g: 0, life: 1, size: rnd(5, 9), seed: Math.random() * 9, c: ['#ff4fd8', '#ffd23f', '#3fb6ff', '#7cff6b'][i % 4], a: 0.55 });
          ring('#ff4fd8', g.w * 1.1, 0.6); ring('#3fb6ff', g.w * 0.8, 0.5);
          break;
        case 'plys':                                    // výbuch srdíček a chmýří, růžová vlna
          for (i = 0; i < 14 * big; i++) { a = rnd(Math.PI * 1.1, Math.PI * 1.9); addP({ t: 'heart', x: cxp, y: top, vx: Math.cos(a) * rnd(80, 200), vy: Math.sin(a) * rnd(80, 200), g: -20, drag: 1.4, life: 1.2, size: rnd(4, 7), c: i % 3 ? '#ff8fb0' : '#ffc2cf' }); }
          for (i = 0; i < 16 * big; i++) addP({ t: 'fluff', x: cxp + rnd(-g.w / 2, g.w / 2), y: top + 4, vx: rnd(-90, 90), vy: rnd(-160, -40), g: -10, drag: 1.4, life: 1.3, size: rnd(2.5, 4), c: '#ffffff' });
          ring('#ffc2cf', g.w * 1.1, 0.7);
          break;
        case 'neon':                                    // elektrická bouře: větvené blesky z pálky, neonový kruh
          for (i = 0; i < 4 + Math.round(2 * big); i++) addP({ t: 'bolt', x: cxp + rnd(-g.w * 0.4, g.w * 0.4), y: top, vx: 0, vy: 0, g: 0, life: 0.35, size: rnd(40, 80) * big, rot: rnd(-0.5, 0.5), seed: Math.random() * 99, c: i % 2 ? '#7df9ff' : '#c76bff', a: 1 });
          ring('#7df9ff', g.w * 1.2, 0.5); ring('#c76bff', g.w * 0.8, 0.4);
          for (i = 0; i < 16; i++) EMIT.zap(cxp + rnd(-g.w / 2, g.w / 2), top);
          padFlash = { kind: 'bolt', at: now, dur: 380, seed: Math.random() * 99 };
          break;
        case 'ekvalizer':                               // zvuková vlna: soustředné oblouky jako z reproduktoru, sloupce na maximum, déšť not
          for (i = 0; i < 4; i++) addP({ t: 'ring', x: cxp, y: top, vx: 0, vy: 0, g: 0, life: 0.5 + i * 0.12, size: (40 + i * 22) * big, c: '#ffd23f', flat: 0.55, a: 0.7 });
          for (i = 0; i < 14 * big; i++) addP({ t: 'note', x: cxp + rnd(-g.w / 2, g.w / 2), y: top, vx: rnd(-90, 90), vy: rnd(-220, -90), g: 60, drag: 0.6, life: 1.2, size: rnd(4, 6.5), c: i % 2 ? '#ffd23f' : '#fff1a8' });
          for (i = 0; i < eqLv.length; i++) eqLv[i] = 1;
          break;
        case 'jadeit':                                  // jadeitová spirála světla a tři vlny
          for (i = 0; i < 24 * big; i++) addP({ t: 'spark', x: cxp, y: top, vx: 0, vy: 0, g: 0, orbit: { cx: cxp, cy: top - 6, ang: i / 24 * Math.PI * 4, rad: 4, va: 9, grow: 60, vx: 0, vy: -90 }, life: 0.9, size: rnd(1.4, 2.4), c: i % 2 ? '#bff5d2' : '#7fd6a0' });
          ring('#7fd6a0', g.w * 0.7, 0.5); ring('#b9f0cc', g.w * 1.05, 0.7); ring('#4fae78', g.w * 1.4, 0.9);
          break;
        case 'perly':                                   // šňůra praskne: déšť perel, které poskakují, duhový kruh
          for (i = 0; i < 22 * big; i++) addP({ t: 'bead', x: cxp + rnd(-g.w * 0.4, g.w * 0.4), y: top + 8, vx: rnd(-200, 200), vy: rnd(-380, -140), g: 900, life: 1.1, size: rnd(1.8, 3), c: '#fff6fb', bounce: g.top + g.h + 10 });
          for (i = 0; i < 20; i++) EMIT.shimmer(cxp + rnd(-g.w / 2, g.w / 2), top - rnd(0, 30));
          ring('hsl(' + rnd(0, 360) + ', 80%, 85%)', g.w * 1.2, 0.7);
          padFlash = { kind: 'pearl', at: now, dur: 520 };
          break;
        case 'mince':                                   // jackpot: fontána mincí, zlatý kruh, hvězdičky
          for (i = 0; i < 26 * big; i++) addP({ t: 'coin', x: cxp + rnd(-12, 12), y: top, vx: rnd(-200, 200), vy: rnd(-480, -220), g: 950, life: 1.2, size: rnd(3, 4.5), rot: rnd(0, 6), vr: rnd(10, 20), c: '#ffd23f' });
          rays('#fff1a8', 60); ring('#ffd23f', g.w * 1.1, 0.6);
          coinChime(); setTimeout(coinChime, 120);
          hangKick(14);
          break;
        case 'cip':                                     // digitální výboj: sloupce 0/1 vyletí nahoru, čtvercová vlna, pixely
          for (i = 0; i < 12; i++) for (var j = 0; j < 3; j++) addP({ t: 'bit', x: cxp - g.w / 2 + (i + 0.5) * g.w / 12, y: top - j * 8, vx: 0, vy: rnd(-200, -120), g: 0, drag: 0.5, life: 0.8, size: 7, txt: Math.random() < 0.5 ? '0' : '1', c: j ? '#59f0a0' : '#ffd23f', a: 0.8 });
          addP({ t: 'square', x: cxp, y: top, vx: 0, vy: 0, g: 0, life: 0.6, size: g.w * 0.7 * big, c: '#59f0a0', a: 0.8 });
          for (i = 0; i < 18 * big; i++) EMIT.pixel(cxp + rnd(-g.w / 2, g.w / 2), top - rnd(0, 20));
          padFlash = { kind: 'circuit', at: now, dur: 520 };
          break;
        case 'kola':                                    // pára z obou konců, odletující kolečka, sprška jisker
          for (i = 0; i < 10; i++) addP({ t: 'puff', x: g.x + g.w * (i % 2 ? -0.45 : 0.45), y: top + 8, vx: (i % 2 ? -1 : 1) * rnd(40, 120), vy: rnd(-90, -30), g: -20, drag: 1.2, life: 1.2, size: rnd(6, 10), c: '#ece6de', a: 0.3 });
          for (i = 0; i < 8 * big; i++) addP({ t: 'gear', x: cxp + rnd(-g.w * 0.3, g.w * 0.3), y: top, vx: rnd(-160, 160), vy: rnd(-300, -120), g: 700, life: 1.1, size: rnd(3.5, 6), rot: 0, vr: rnd(-14, 14), c: i % 2 ? '#d08a4a' : '#c9a24a' });
          for (i = 0; i < 24 * big; i++) EMIT.copperSpark(cxp + rnd(-g.w / 2, g.w / 2), top);
          rays('#ffb35c', 50);
          break;
      }
    }
    function coinChime() {     // cinknutí mincí (jen když je zvuk zapnutý)
      if (!vol) return;
      tone(1568, 0.08, 'sine', 0.12); setTimeout(function () { tone(2093, 0.12, 'sine', 0.1); }, 70);
    }
    // ekvalizér: každý zvuk hry (i když je zvuk vypnutý) do sloupců pustí energii, v klidu jemně „hraje“ sám
    function eqPulse(e) {
      if (curPad() !== 'ekvalizer') return;
      for (var i = 0; i < eqLv.length; i++) eqLv[i] = Math.min(1, eqLv[i] + e * (0.5 + Math.random() * 0.7));
    }
    function pfxTick(now) {
      var dt = pfxT ? Math.min(0.05, (now - pfxT) / 1000) : 0;
      pfxT = now;
      if (paused || now < hitStop) return;
      flightTick(now, dt);
      var born = [];                                    // částice vzniklé při procházení (pára z tání) přidat až potom
      pfx = pfx.filter(function (p) {
        p.age += dt;
        var d = Math.exp(-(p.drag || 0) * dt);
        p.vx *= d; p.vy = p.vy * d + (p.g || 0) * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.vr) p.rot += p.vr * dt;
        if (p.bounce && p.vy > 0 && p.y > p.bounce) { p.y = p.bounce; p.vy *= -0.45; p.bounce = 0; }
        if (p.melt && p.age > p.melt) {                // vločka roztála: z ní kapka vody, která spadne (a obláček páry)
          p.t = 'drop'; p.c = '#8fd8ff'; p.size = rnd(1.1, 1.6); p.g = 700; p.drag = 0; p.vy = Math.max(p.vy, 15); p.vr = 0; p.rot = 0;
          p.age = 0; p.life = 0.75; p.melt = 0;
          if (Math.random() < 0.35) born.push({ t: 'puff', x: p.x, y: p.y, vx: rnd(-8, 8), vy: rnd(-25, -10), g: 0, drag: 1, life: 0.7, size: rnd(2, 3.5), c: '#eef6fa', a: 0.18 });
        }
        if (p.orbit) {                                  // tornádo: obíhá kolem středu, který stoupá, a kruh se zvětšuje
          var o = p.orbit;
          o.ang += o.va * dt; o.rad += o.grow * dt; o.cx += o.vx * dt; o.cy += o.vy * dt;
          p.x = o.cx + Math.cos(o.ang) * o.rad; p.y = o.cy + Math.sin(o.ang) * o.rad * 0.55;
        } else if (p.t === 'leaf') p.x += Math.sin(p.age * 7 + p.size) * 30 * dt;   // list se při pádu kolébá
        return p.age < p.life && p.y < H + 20;
      });
      born.forEach(addP);
      var t = (now - eqT) / 1000;
      if (t > 0.08) {                                   // ekvalizér: pokles + klidové „hraní“
        eqT = now;
        for (var i = 0; i < eqLv.length; i++) eqLv[i] = Math.max(0.12 + 0.18 * Math.abs(Math.sin(now / 260 + i * 1.7)) * Math.random(), eqLv[i] * 0.78);
      }
      // klidové drobnosti: z ledu občas vystoupá mráz, ze strojovny pára (slabé, pod pálkou)
      var id = curPad();
      if (padGeo && now > nextIdle && running) {
        nextIdle = now + rnd(1400, 2600);
        if (id === 'led') addP({ t: 'puff', x: padGeo.x + rnd(-padGeo.w * 0.4, padGeo.w * 0.4), y: padGeo.top + padGeo.h, vx: rnd(-10, 10), vy: rnd(10, 25), g: 0, drag: 1, life: 1.4, size: rnd(5, 8), c: 'rgba(220, 245, 255, 1)', a: 0.14 });
        if (id === 'kola') addP({ t: 'puff', x: padGeo.x + padGeo.w * (Math.random() < 0.5 ? -0.44 : 0.44), y: padGeo.top + 6, vx: rnd(-8, 8), vy: rnd(-40, -20), g: 0, drag: 0.8, life: 1.3, size: rnd(4, 6), c: '#ece6de', a: 0.16 });
      }
      // míček po odstřelu: mráz / hoření (jiskry a kouř) – a kouřící lávový kámen pořád
      var bid = BALLS[ballType] && BALLS[ballType].id;
      if (running && now >= serveAt && !awaitStart) {
        var held = fxGain() > 0.15, burning = ballFx.kind === 'burn' && now < ballFx.until && held;
        if ((burning || bid === 'lavak') && Math.random() < dt * (burning ? 40 : 9))
          addP({ t: 'puff', x: ball.x + rnd(-4, 4), y: ball.y + rnd(-4, 4), vx: rnd(-10, 10), vy: rnd(-25, -5), g: 0, drag: 1, life: 0.9, size: rnd(3, 5), c: '#8a8580', a: 0.22 });
        if (burning && Math.random() < dt * 30) addP({ t: 'spark', x: ball.x, y: ball.y, vx: rnd(-60, 60), vy: rnd(-60, 60), g: 200, life: 0.4, size: 1.3, c: '#ffb35c' });
        var frosty = ballFx.kind === 'frost' && now < ballFx.until && held;
        if ((frosty || bid === 'ledovka') && Math.random() < dt * (frosty ? 30 : 6))
          addP({ t: 'flake', x: ball.x + rnd(-6, 6), y: ball.y + rnd(-6, 6), vx: rnd(-15, 15), vy: rnd(-15, 15), g: 0, drag: 1, life: 0.6, size: rnd(1.2, 2), rot: rnd(0, 6), vr: 2, c: '#e6f7ff' });
      }
    }
    function drawPfx(list) {
      (list || pfx).forEach(function (p) {
        var k = p.age / p.life, a = (p.a || 0.85) * (k < 0.15 ? k / 0.15 : 1 - Math.max(0, (k - 0.5) / 0.5));
        if (a <= 0) return;
        cx.save(); cx.globalAlpha = a; cx.translate(p.x, p.y); if (p.rot) cx.rotate(p.rot);
        cx.fillStyle = p.c; cx.strokeStyle = p.c;
        var r = p.size;
        switch (p.t) {
          case 'leaf':                                  // lístek se žilkou
            cx.beginPath(); cx.ellipse(0, 0, r, r * 0.45, 0, 0, 7); cx.fill();
            cx.strokeStyle = 'rgba(30, 70, 20, .7)'; cx.lineWidth = 0.6; cx.beginPath(); cx.moveTo(-r, 0); cx.lineTo(r, 0); cx.stroke();
            break;
          case 'flake':                                 // vločka: šest paprsků
            cx.lineWidth = 0.7;
            for (var j = 0; j < 3; j++) { cx.rotate(Math.PI / 3); cx.beginPath(); cx.moveTo(-r, 0); cx.lineTo(r, 0); cx.stroke(); }
            break;
          case 'streak':                                // poryv ledového větru: svislá čárka
            var gs = cx.createLinearGradient(0, 0, 0, r); gs.addColorStop(0, p.c); gs.addColorStop(1, 'rgba(210, 240, 255, 0)');
            cx.strokeStyle = gs; cx.lineWidth = 1.2; cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(0, r); cx.stroke();
            break;
          case 'paw':                                   // zlatý otisk tlapky
            if (p.grow) r *= 1 + p.grow * k;
            cx.beginPath(); cx.ellipse(0, r * 0.25, r * 0.55, r * 0.45, 0, 0, 7); cx.fill();
            [[-0.55, -0.35], [-0.2, -0.65], [0.2, -0.65], [0.55, -0.35]].forEach(function (q) { cx.beginPath(); cx.arc(q[0] * r, q[1] * r, r * 0.2, 0, 7); cx.fill(); });
            break;
          case 'heart':
            cx.beginPath(); cx.moveTo(0, r * 0.35);
            cx.bezierCurveTo(-r, -r * 0.3, -r * 0.5, -r, 0, -r * 0.45); cx.bezierCurveTo(r * 0.5, -r, r, -r * 0.3, 0, r * 0.35); cx.fill();
            break;
          case 'ring':                                  // vlna: rozšiřující se tenká elipsa
            cx.lineWidth = 1.2; cx.beginPath(); cx.ellipse(0, 0, r * (0.4 + k), r * (0.4 + k) * (p.flat || 0.28), 0, 0, 7); cx.stroke();
            break;
          case 'square':                                // čtvercová vlna (čip)
            var sq = r * (0.3 + k); cx.lineWidth = 1.2; cx.strokeRect(-sq, -sq * 0.35, sq * 2, sq * 0.7);
            break;
          case 'shard':                                 // střep ledu
            cx.beginPath(); cx.moveTo(0, -r); cx.lineTo(r * 0.38, r * 0.7); cx.lineTo(-r * 0.3, r); cx.closePath(); cx.fill();
            cx.strokeStyle = 'rgba(255, 255, 255, .9)'; cx.lineWidth = 0.6; cx.stroke();
            break;
          case 'rays':                                  // paprsky ze středu
            cx.lineWidth = 1.4;
            for (var ri = 0; ri < 12; ri++) {
              var ra = Math.PI + ri / 11 * Math.PI, r0 = r * 0.25 * (0.5 + k), r1 = r * (0.4 + 0.8 * k);
              cx.beginPath(); cx.moveTo(Math.cos(ra) * r0, Math.sin(ra) * r0); cx.lineTo(Math.cos(ra) * r1, Math.sin(ra) * r1); cx.stroke();
            }
            break;
          case 'bolt':                                  // větvený blesk (každý snímek trochu jiný)
            cx.globalCompositeOperation = 'lighter'; cx.lineWidth = 1.3; cx.shadowColor = p.c; cx.shadowBlur = 8;
            var bx = 0, by = 0, steps = 7, bs = r / steps;
            cx.beginPath(); cx.moveTo(0, 0);
            for (var bi = 1; bi <= steps; bi++) {
              bx += Math.sin(p.seed + bi * 2.1 + p.age * 40) * bs * 0.7; by -= bs; cx.lineTo(bx, by);
              if (bi === 3 || bi === 5) { cx.moveTo(bx, by); cx.lineTo(bx + (bi === 3 ? 1 : -1) * bs * 1.4, by - bs * 0.9); cx.moveTo(bx, by); }
            }
            cx.stroke();
            break;
          case 'splat':                                 // kaňka barvy
            cx.beginPath(); cx.arc(0, 0, r, 0, 7); cx.fill();
            for (var si = 0; si < 6; si++) { var sa = p.seed + si * 1.05, sd = r * (1.1 + (si % 3) * 0.25); cx.beginPath(); cx.arc(Math.cos(sa) * sd, Math.sin(sa) * sd, r * 0.28, 0, 7); cx.fill(); }
            break;
          case 'coin':                                  // mince se točí (zúžení podle natočení)
            var sx = Math.abs(Math.cos(p.rot)) + 0.12;
            cx.rotate(-p.rot); cx.scale(sx, 1);
            cx.beginPath(); cx.arc(0, 0, r, 0, 7); cx.fill();
            cx.strokeStyle = '#a07400'; cx.lineWidth = 0.8; cx.beginPath(); cx.arc(0, 0, r * 0.7, 0, 7); cx.stroke();
            break;
          case 'pixel':
            cx.fillRect(-r / 2, -r / 2, r, r);
            break;
          case 'bit':                                   // 0 / 1 z čipu
            cx.font = r + 'px monospace'; cx.textAlign = 'center'; cx.fillText(p.txt, 0, r / 3);
            break;
          case 'bar':                                   // sloupek ekvalizéru, který se smršťuje
            cx.fillRect(-1.2, -r * (1 - k), 2.4, r * (1 - k));
            break;
          case 'gear':                                  // malé ozubené kolečko
            cx.beginPath();
            for (var gi = 0; gi < 16; gi++) { var gr = gi % 2 ? r : r * 0.72, ga = gi / 16 * Math.PI * 2; cx.lineTo(Math.cos(ga) * gr, Math.sin(ga) * gr); }
            cx.closePath(); cx.fill();
            cx.fillStyle = '#3a2410'; cx.beginPath(); cx.arc(0, 0, r * 0.3, 0, 7); cx.fill();
            break;
          case 'note':                                  // nota ♪
            cx.beginPath(); cx.ellipse(0, 0, r * 0.45, r * 0.32, -0.4, 0, 7); cx.fill();
            cx.lineWidth = 0.9; cx.beginPath(); cx.moveTo(r * 0.4, 0); cx.lineTo(r * 0.4, -r * 1.3); cx.lineTo(r * 0.9, -r * 1); cx.stroke();
            break;
          case 'puff':
            var gp = cx.createRadialGradient(0, 0, 0, 0, 0, r * (1 + k));
            gp.addColorStop(0, p.c); gp.addColorStop(1, 'rgba(255, 255, 255, 0)');
            cx.fillStyle = gp; cx.beginPath(); cx.arc(0, 0, r * (1 + k), 0, 7); cx.fill();
            break;
          default:                                      // jiskra, kapka, korálek, chomáček
            cx.beginPath(); cx.arc(0, 0, r, 0, 7); cx.fill();
            if (p.t === 'bead' || p.t === 'drop') { cx.fillStyle = 'rgba(255, 255, 255, .6)'; cx.beginPath(); cx.arc(-r * 0.35, -r * 0.35, r * 0.3, 0, 7); cx.fill(); }
        }
        cx.restore();
      });
    }
    // záblesky po těle pálky (zlato, perleť, neonový výboj, rozsvícené dráhy čipu)
    function drawPadFlash(now) {
      var f = padFlash, g = padGeo;
      if (!f || !g) return;
      var k = (now - f.at) / f.dur;
      if (k >= 1 || k < 0) { if (k >= 1) padFlash = null; return; }
      var L = g.x - g.w / 2, R = g.x + g.w / 2, T = g.top, B = g.top + g.h;
      cx.save(); cx.globalCompositeOperation = 'lighter';
      if (f.kind === 'frost') {
        cx.globalAlpha = 1 - k; cx.fillStyle = 'rgba(210, 240, 255, .55)'; cx.fillRect(L, T, g.w, g.h);
      } else if (f.kind === 'gold' || f.kind === 'pearl') {
        var bx = L - 30 + (g.w + 60) * k, gg = cx.createLinearGradient(bx - 22, 0, bx + 22, 0);
        if (f.kind === 'gold') { gg.addColorStop(0, 'rgba(255, 220, 120, 0)'); gg.addColorStop(0.5, 'rgba(255, 240, 180, .75)'); gg.addColorStop(1, 'rgba(255, 220, 120, 0)'); }
        else { gg.addColorStop(0, 'rgba(255, 180, 230, 0)'); gg.addColorStop(0.35, 'rgba(255, 200, 240, .45)'); gg.addColorStop(0.55, 'rgba(180, 230, 255, .5)'); gg.addColorStop(1, 'rgba(200, 255, 220, 0)'); }
        cx.beginPath(); cx.rect(L + 3, T, g.w - 6, g.h * 0.75); cx.clip();
        cx.fillStyle = gg; cx.fillRect(bx - 22, T, 44, g.h);
      } else if (f.kind === 'bolt') {
        cx.strokeStyle = 'rgba(160, 250, 255, ' + (1 - k) + ')'; cx.lineWidth = 1.4; cx.shadowColor = '#7df9ff'; cx.shadowBlur = 8;
        cx.beginPath(); cx.moveTo(L + 4, B - 3);
        for (var x = L + 4, j = 0; x < R - 4; x += 8, j++) cx.lineTo(x, B - 3 + Math.sin(f.seed + j * 2.3 + now / 30) * 3);
        cx.lineTo(R - 4, B - 3); cx.stroke();
      } else if (f.kind === 'circuit') {
        cx.fillStyle = 'rgba(120, 255, 180, ' + (1 - k) * 0.9 + ')'; cx.shadowColor = '#59f0a0'; cx.shadowBlur = 6;
        [T + g.h * 0.35, T + g.h * 0.6].forEach(function (yy, j) {
          var d = g.w * 0.45 * k;
          cx.fillRect(g.x - d - 2, yy, 4, 1.4); cx.fillRect(g.x + d - 2, yy, 4, 1.4);
          if (j) { cx.fillRect(g.x - d * 0.6 - 1, yy - 3, 1.4, 4); cx.fillRect(g.x + d * 0.6, yy - 3, 1.4, 4); }
        });
      }
      cx.restore();
    }
    // sloupce ekvalizéru přes obrázek (výška podle eqLv; v náhledu nastavení stojí)
    function drawEqBars(left, top, s, kx, still) {
      var bg = EQ.bg;
      cx.fillStyle = '#211f1c';
      cx.fillRect(left + bg[0] * s * kx, top + bg[1] * s, bg[2] * s * kx, bg[3] * s);
      for (var i = 0; i < 10; i++) {
        var lv = still ? 0.35 + 0.5 * Math.abs(Math.sin(i * 1.9)) : eqLv[i], hgt = Math.max(0.12, lv) * EQ.max;
        var x = left + (EQ.x0 + i * EQ.step) * s * kx, w = EQ.w * s * kx, seg = 5.2, n = Math.ceil(hgt / seg);
        for (var j = 0; j < n; j++) {
          var y = EQ.bottom - (j + 1) * seg;
          cx.fillStyle = j > 6 ? '#fff1a8' : j > 4 ? '#ffd23f' : '#d9a441';
          cx.fillRect(x, top + (y + 1) * s, w, (seg - 1.6) * s);
        }
      }
    }
    var FLIGHT = D.FLIGHT;
    var flight = null, flightLast = {}, FLIGHT_LIFE = 0.75;
    var BALL_FLIGHT = D.BALL_FLIGHT;
    var REACT = D.REACT;
    var BALL_KINDS = D.BALL_KINDS;
    function startFlight(now) {
      var id = curPad(), vs = FLIGHT[id], bid = BALLS[ballType] && BALLS[ballType].id, bs = BALL_FLIGHT[bid];
      if (!vs && !bs) { flight = null; return; }
      var st = null;
      if (vs) {
        var v = Math.floor(Math.random() * vs.length);
        if (v === flightLast[id]) v = (v + 1 + Math.floor(Math.random() * (vs.length - 1))) % vs.length;
        flightLast[id] = v; st = vs[v];
      }
      var bst = null;
      if (bs) {                                          // míček: tvar čáry se každým letem střídá (jiný než minule)
        var bk = Math.floor(Math.random() * BALL_KINDS.length);
        if (bk === flightLast['ball']) bk = (bk + 1) % BALL_KINDS.length;
        flightLast['ball'] = bk;
        bst = { line: bs.line, w: st ? 1.4 : 2.2, kind: st ? 'braid' : BALL_KINDS[bk], emit: bs.emit, rate: bs.rate, glow: bs.glow };
      }
      // „povaha“ tohoto letu: síla vlnění, rychlost točení, hustota částic, směr kroucení
      // led + oheň: vločky chvíli letí a pak roztají v kapky vody, které spadnou
      var melt = id === 'led' && bid === 'lavak' || id === 'lava' && bid === 'ledovka';
      flight = { st: st, bst: bst, react: REACT[id + '|' + bid], melt: melt, y0: ball.y, pts: [], amp: rnd(0.7, 1.35), freq: rnd(0.75, 1.3), dens: rnd(0.75, 1.3),
        spin: Math.random() < 0.5 ? -1 : 1, power: 0.8, acc: 0, ended: false, seed: Math.random() * 100 };
    }
    var EMIT = {
      flake: function (x, y) { addP({ t: 'flake', x: x + rnd(-4, 4), y: y + rnd(-4, 4), vx: rnd(-25, 25), vy: rnd(-10, 25), g: 0, drag: 1.2, life: 0.8, size: rnd(1.2, 2.2), rot: rnd(0, 6), vr: rnd(-3, 3), c: '#e6f7ff' }); },
      flakeBig: function (x, y) { addP({ t: 'flake', x: x, y: y, vx: rnd(-40, 40), vy: rnd(0, 40), g: 0, drag: 1, life: 1, size: rnd(2.4, 3.4), rot: rnd(0, 6), vr: rnd(-2, 2), c: '#d8f5ff' }); },
      tornado: function (x, y, f) { addP({ t: 'leaf', x: x, y: y, vx: 0, vy: 0, g: 0, orbit: { cx: x, cy: y, ang: rnd(0, 6), rad: 3, va: rnd(9, 13) * f.spin, grow: rnd(14, 22), vx: rnd(-10, 10), vy: rnd(-25, 5) }, life: 1.2, size: rnd(2.6, 3.8), rot: rnd(0, 6), vr: rnd(-8, 8), c: Math.random() < 0.3 ? '#9fd65a' : '#5aa83a' }); },
      leafDrop: function (x, y) { addP({ t: 'leaf', x: x, y: y, vx: rnd(-30, 30), vy: rnd(10, 40), g: 60, drag: 1.4, life: 1.3, size: rnd(3, 4), rot: rnd(0, 6), vr: rnd(-6, 6), c: '#6fbf4a' }); },
      leafSide: function (x, y, f, nx, ny) { var k = Math.random() < 0.5 ? -1 : 1; addP({ t: 'leaf', x: x, y: y, vx: nx * k * rnd(60, 110), vy: ny * k * rnd(60, 110), g: 40, drag: 2, life: 1, size: rnd(2.6, 3.6), rot: rnd(0, 6), vr: rnd(-9, 9), c: '#86d152' }); },
      ember: function (x, y) { addP({ t: 'spark', x: x + rnd(-3, 3), y: y + rnd(-3, 3), vx: rnd(-40, 40), vy: rnd(-30, 50), g: 160, life: 0.5, size: rnd(1, 1.7), c: Math.random() < 0.5 ? '#ffd36b' : '#ff7a1e' }); },
      lavaDrop: function (x, y) { addP({ t: 'drop', x: x, y: y, vx: rnd(-15, 15), vy: rnd(20, 60), g: 500, life: 0.7, size: rnd(1.6, 2.4), c: '#ff7a1e' }); },
      smoke: function (x, y) { addP({ t: 'puff', x: x, y: y, vx: rnd(-10, 10), vy: rnd(-20, 5), g: 0, drag: 1, life: 0.9, size: rnd(3, 5), c: '#8a8580', a: 0.22 }); },
      goldSpark: function (x, y) { addP({ t: 'spark', x: x + rnd(-4, 4), y: y + rnd(-4, 4), vx: rnd(-20, 20), vy: rnd(-20, 20), g: 0, life: 0.6, size: rnd(0.9, 1.5), c: '#fff1a8' }); },
      pawPrint: function (x, y, f, nx, ny) { var k = (f.acc++ % 2) ? 1 : -1; addP({ t: 'paw', x: x + nx * 5 * k, y: y + ny * 5 * k, vx: 0, vy: 0, g: 0, life: 0.9, size: 3.6, rot: Math.atan2(ny, nx) + Math.PI / 2, c: '#ffd23f', a: 0.6 }); },
      paintSplat: function (x, y) { addP({ t: 'drop', x: x, y: y, vx: rnd(-70, 70), vy: rnd(-40, 60), g: 400, life: 0.6, size: rnd(1.4, 2.4), c: ['#ff4fd8', '#ffd23f', '#3fb6ff', '#7cff6b'][Math.random() * 4 | 0] }); },
      paintDot: function (x, y) { addP({ t: 'dot', x: x + rnd(-6, 6), y: y + rnd(-6, 6), vx: 0, vy: 0, g: 0, life: 0.8, size: rnd(1, 2), c: ['#ff4fd8', '#ffd23f', '#3fb6ff', '#7cff6b'][Math.random() * 4 | 0], a: 0.7 }); },
      heart: function (x, y) { addP({ t: 'heart', x: x + rnd(-5, 5), y: y, vx: rnd(-15, 15), vy: rnd(-20, 10), g: 0, drag: 0.8, life: 0.9, size: rnd(2.6, 3.6), c: '#ff8fb0', a: 0.7 }); },
      fluff: function (x, y) { addP({ t: 'fluff', x: x + rnd(-4, 4), y: y + rnd(-4, 4), vx: rnd(-20, 20), vy: rnd(-15, 15), g: 0, drag: 1.5, life: 0.9, size: rnd(1.4, 2.4), c: '#ffffff', a: 0.7 }); },
      zap: function (x, y) { addP({ t: 'spark', x: x + rnd(-5, 5), y: y + rnd(-5, 5), vx: rnd(-50, 50), vy: rnd(-50, 50), g: 0, drag: 3, life: 0.3, size: rnd(0.9, 1.4), c: Math.random() < 0.5 ? '#c8fbff' : '#e6c2ff' }); },
      note: function (x, y) { addP({ t: 'note', x: x + rnd(-6, 6), y: y, vx: rnd(-15, 15), vy: rnd(-25, -5), g: 0, drag: 0.5, life: 0.9, size: rnd(3, 4), c: '#e6b730', a: 0.75 }); },
      bar: function (x, y, f, nx, ny) { var k = Math.random() < 0.5 ? -1 : 1; addP({ t: 'bar', x: x + nx * 6 * k, y: y + ny * 6 * k, vx: 0, vy: 0, g: 0, life: 0.5, size: rnd(3, 7), c: '#e6b730', a: 0.7 }); },
      jadeRing: function (x, y) { addP({ t: 'ring', x: x, y: y, vx: 0, vy: 0, g: 0, life: 0.6, size: rnd(10, 16), c: '#9fe6bb', a: 0.6 }); },
      jadeSpark: function (x, y) { addP({ t: 'spark', x: x + rnd(-4, 4), y: y + rnd(-4, 4), vx: rnd(-20, 20), vy: rnd(-20, 20), g: 0, life: 0.6, size: rnd(0.9, 1.4), c: '#d6ffe6' }); },
      pearl: function (x, y) { addP({ t: 'bead', x: x + rnd(-4, 4), y: y, vx: rnd(-30, 30), vy: rnd(-10, 40), g: 300, life: 0.7, size: rnd(1.3, 2), c: '#fff6fb' }); },
      shimmer: function (x, y) { addP({ t: 'spark', x: x + rnd(-6, 6), y: y + rnd(-6, 6), vx: 0, vy: 0, g: 0, life: 0.5, size: rnd(0.8, 1.3), c: 'hsl(' + rnd(0, 360) + ', 90%, 88%)' }); },
      coin: function (x, y) { addP({ t: 'coin', x: x, y: y, vx: rnd(-50, 50), vy: rnd(-30, 30), g: 350, life: 0.8, size: rnd(2, 2.8), rot: rnd(0, 6), vr: rnd(10, 16), c: '#ffd23f' }); },
      pixel: function (x, y) { addP({ t: 'pixel', x: Math.round((x + rnd(-6, 6)) / 3) * 3, y: Math.round(y / 3) * 3, vx: 0, vy: 0, g: 0, life: 0.6, size: rnd(1.4, 2.4), c: Math.random() < 0.6 ? '#59f0a0' : '#ffd23f', a: 0.75 }); },
      bit: function (x, y) { addP({ t: 'bit', x: x + rnd(-7, 7), y: y + rnd(-4, 4), vx: 0, vy: rnd(-10, 0), g: 0, life: 0.7, size: 6, txt: Math.random() < 0.5 ? '0' : '1', c: '#59f0a0', a: 0.7 }); },
      gearlet: function (x, y) { addP({ t: 'gear', x: x, y: y, vx: rnd(-40, 40), vy: rnd(-20, 40), g: 200, life: 0.9, size: rnd(2.6, 3.6), rot: 0, vr: rnd(-12, 12), c: '#d08a4a' }); },
      copperSpark: function (x, y) { addP({ t: 'spark', x: x, y: y, vx: rnd(-70, 70), vy: rnd(-40, 60), g: 400, life: 0.4, size: rnd(0.9, 1.4), c: '#ffb35c' }); },
      steam: function (x, y) { addP({ t: 'puff', x: x, y: y, vx: rnd(-10, 10), vy: rnd(-15, 5), g: -10, drag: 1, life: 1, size: rnd(3, 5), c: '#ece6de', a: 0.2 }); },
      nutChip: function (x, y) { addP({ t: 'spark', x: x + rnd(-3, 3), y: y + rnd(-3, 3), vx: rnd(-30, 30), vy: rnd(-10, 40), g: 200, life: 0.6, size: rnd(1, 1.6), c: Math.random() < 0.5 ? '#a8743e' : '#6fbf4a' }); },
      dust: function (x, y) { addP({ t: 'spark', x: x + rnd(-4, 4), y: y + rnd(-4, 4), vx: rnd(-15, 15), vy: rnd(-15, 15), g: 0, life: 0.6, size: rnd(0.8, 1.3), c: Math.random() < 0.5 ? '#ffffff' : '#9a9aa4' }); }
    };
    // síla efektu od pálky: 1 hned po odpalu, 0 ve 2/3 cesty ke Kevinovi (a když letí zpátky)
    function fxGain() {
      if (!flight || ball.vy >= 0) return 0;
      var span = Math.max(1, flight.y0 - KEVIN_Y);
      return clamp(1 - (flight.y0 - ball.y) / span / 0.65, 0, 1);
    }
    function flightTick(now, dt) {
      var f = flight;
      if (!f) return;
      var flying = running && now >= serveAt && !awaitStart && ball.vy < 0 && !f.ended;
      if (!flying && f.pts.length) f.ended = true;    // Kevin vrátil (nebo gól) → už jen dobledne
      if (flying) {
        f.pts.push({ x: ball.x, y: ball.y, t: now, g: fxGain() });
        if (f.pts.length > 90) f.pts.shift();
        var n = f.pts.length, a = f.pts[Math.max(0, n - 3)], dx = ball.x - a.x, dy = ball.y - a.y, d = Math.hypot(dx, dy) || 1;
        // částice pálky i míčku (když jsou obě, každá trochu řidší), plus reakce, kde se potkají
        var gain = fxGain();
        [['cp', f.st, (f.bst ? 0.65 : 1) * gain], ['cb', f.bst, f.st ? 0.6 : 1], ['cr', f.react ? { emit: f.react, rate: 7 } : null, gain]].forEach(function (e) {
          var st = e[1];
          if (!st) return;
          f[e[0]] = (f[e[0]] || 0) + st.rate * f.dens * f.power * e[2] * dt;
          while (f[e[0]] >= 1) {
            f[e[0]]--; EMIT[st.emit](ball.x, ball.y, f, -dy / d, dx / d);
            var last = pfx[pfx.length - 1];
            if (f.melt && last && last.t === 'flake' && last.age === 0) last.melt = rnd(0.12, 0.35);
          }
        });
      }
      f.pts = f.pts.filter(function (p) { return now - p.t < FLIGHT_LIFE * 1000; });
      if (f.ended && !f.pts.length) flight = null;
    }
    function drawFlight(now) {
      var f = flight;
      if (!f || f.pts.length < 2 || lowFx >= 3) return;   // Detaily: Nízké = bez stopy letu (kometa zůstane)
      var pts = f.pts, n = pts.length, span = Math.max(1, PLAYER_Y - KEVIN_Y);
      // body čáry posunuté podle tvaru (vlna, cik-cak, šroubovice, copánek, schody); off = posun kolmo ke směru letu
      function shaped(st, sign) {
        var out = [];
        for (var i = 0; i < n; i++) {
          var p = pts[i], q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)], dx = q.x - o.x, dy = q.y - o.y, d = Math.hypot(dx, dy) || 1;
          var nx = -dy / d, ny = dx / d, off = 0, ph = i * 0.55 * f.freq + f.seed;
          if (st.kind === 'wave') off = Math.sin(ph) * 3.5 * f.amp;
          else if (st.kind === 'zigzag') off = (i % 4 < 2 ? 1 : -1) * 2.6 * f.amp;
          else if (st.kind === 'helix') off = Math.sin(ph * 1.4) * 4 * f.amp * sign;
          else if (st.kind === 'braid') off = Math.sin(ph * 1.4 + Math.PI) * 4.5 * f.amp;            // míček kolem stopy pálky
          if (f.bst && st === f.st && st.kind === 'smooth') off = Math.sin(ph * 1.4) * 3 * f.amp;      // s míčkem se i hladká čára proplétá
          var x = p.x + nx * off, y = p.y + ny * off;
          if (st.kind === 'step') { x = Math.round(x / 9) * 9; y = Math.round(y / 9) * 9; }
          out.push([x, y, p.t, p.y, p.g == null ? 1 : p.g]);
        }
        return out;
      }
      var drawingPad = false;
      function alphaAt(q) {                              // slábne s časem a čím dál od pálky (čára pálky až do nuly)
        var age = (now - q[2]) / (FLIGHT_LIFE * 1000), far = clamp((PLAYER_Y - q[3]) / span, 0, 1);
        return Math.max(0, (1 - age) * (1 - 0.55 * far)) * (0.55 + 0.25 * (f.power - 1)) * (drawingPad ? q[4] : 1);
      }
      function colorAt(st, i, core) {
        if (st.line === 'multi') return ['#ff4fd8', '#ffd23f', '#3fb6ff', '#7cff6b'][((i / 5) | 0) % 4];
        if (st.line === 'iri') return 'hsl(' + ((i * 9 + now / 6) % 360) + ', 85%, ' + (core ? 88 : 70) + '%)';
        return st.line[core ? 0 : 1];
      }
      function stroke(st, line) {
        if (st.kind === 'dots') {
          for (var i = 0; i < line.length; i += 3) { cx.globalAlpha = alphaAt(line[i]); cx.fillStyle = colorAt(st, i, true); cx.beginPath(); cx.arc(line[i][0], line[i][1], st.w * 0.8, 0, 7); cx.fill(); }
          return;
        }
        for (var pass = 0; pass < 2; pass++) {          // záře pod čarou, pak jádro
          cx.lineWidth = pass ? st.w : st.w * 2.6;
          for (var j = 1; j < line.length; j++) {
            var al = alphaAt(line[j]) * (pass ? 1 : 0.28);
            if (al <= 0.01) continue;
            cx.globalAlpha = al; cx.strokeStyle = colorAt(st, j, pass === 1);
            cx.beginPath(); cx.moveTo(line[j - 1][0], line[j - 1][1]); cx.lineTo(line[j][0], line[j][1]); cx.stroke();
          }
        }
      }
      cx.save(); cx.lineCap = 'round'; cx.lineJoin = 'round';
      [f.st, f.bst].forEach(function (st) {
        if (!st) return;
        cx.globalCompositeOperation = st.glow || (f.st && f.bst) ? 'lighter' : 'source-over';   // dvě stopy se v křížení smíchají
        drawingPad = st === f.st;
        stroke(st, shaped(st, 1));
        if (st.kind === 'helix') stroke(st, shaped(st, -1));
      });
      cx.restore();
    }
    // ohon komety za míčkem: zužující se zářící pruh (záře kolem v barvě pálky, jádro v barvě míčku), pár třpytek uvnitř
    function cometColors(now) {
      var multi = ['#ff4fd8', '#ffd23f', '#3fb6ff', '#7cff6b'];
      if (ball.fire) return { core: ['#fff1a8', '#ffb02e', '#ff4a00'], halo: '#ff6a00', flick: true };
      var gain = fxGain(), fxOn = now < ballFx.until && gain > 0.2;
      if (fxOn && ballFx.kind === 'burn') return { core: ['#ffe08a', '#ff8a1a'], halo: '#ff4a00', flick: true };
      if (fxOn && ballFx.kind === 'frost') return { core: ['#ffffff', '#c6f1ff'], halo: '#7fd3ff' };
      if (fxOn && ballFx.kind === 'paint') return { core: multi, halo: '#ff4fd8' };
      if (fxOn && ballFx.kind === 'neon') return { core: ['#e8feff', '#7df9ff'], halo: '#c76bff' };
      var bid = BALLS[ballType] && BALLS[ballType].id, bs = BALL_FLIGHT[bid], ps = flight && flight.st;
      function col(line, i) {
        if (line === 'multi') return multi[i % 4];
        if (line === 'iri') return 'hsl(' + ((now / 6 + i * 70) % 360) + ', 85%, 85%)';
        return line[i ? 1 : 0];
      }
      var core = bs ? (bs.line === 'multi' ? multi : [col(bs.line, 0), col(bs.line, 1)]) : [SKINS[skin].rim, SKINS[skin].trail];
      if (player.boosted && ball.vy < 0) core = ['#fffbe0', core[0]];
      var own = bs ? col(bs.line, 1) : SKINS[skin].glow;
      return { core: core, halo: ps && gain > 0 ? col(ps.line, 0) : own, own: own, gain: ps ? gain : 0 };
    }
    function drawComet(now) {
      var tr = ball.trail.concat([[ball.x, ball.y]]), n = tr.length;
      if (n < 3) return;
      var c = cometColors(now), tail = tr[0], head = tr[n - 1];
      // obrys ohonu: body vlevo a vpravo od dráhy, šířka roste od konce k míčku
      function outline(scale) {
        var L = [], R = [];
        for (var i = 0; i < n; i++) {
          var a = tr[Math.max(0, i - 1)], b = tr[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
          var w = BALL_R * scale * Math.pow(i / (n - 1), 0.85) * (c.flick ? 0.85 + 0.3 * Math.sin(now / 45 + i) : 1);
          L.push([tr[i][0] - dy / d * w, tr[i][1] + dx / d * w]); R.push([tr[i][0] + dy / d * w, tr[i][1] - dx / d * w]);
        }
        cx.beginPath(); cx.moveTo(L[0][0], L[0][1]);
        for (var j = 1; j < n; j++) cx.lineTo(L[j][0], L[j][1]);
        for (var k = n - 1; k >= 0; k--) cx.lineTo(R[k][0], R[k][1]);
        cx.closePath();
      }
      function grad(colors, alpha) {
        var g = cx.createLinearGradient(tail[0], tail[1], head[0], head[1]);
        g.addColorStop(0, 'rgba(0, 0, 0, 0)');
        colors.forEach(function (cc, i) { g.addColorStop(0.35 + 0.65 * (i + 1) / colors.length, cc); });
        return g;
      }
      cx.save();
      cx.globalCompositeOperation = 'lighter';
      if (c.own && c.gain > 0) {                         // záře pálky se přelévá do vlastní záře míčku
        cx.globalAlpha = 0.32 * c.gain; cx.fillStyle = grad([c.halo, c.halo]); outline(1.6); cx.fill();
        cx.globalAlpha = 0.32 * (1 - c.gain); cx.fillStyle = grad([c.own, c.own]); outline(1.6); cx.fill();
      } else { cx.globalAlpha = 0.32; cx.fillStyle = grad([c.halo, c.halo]); outline(1.6); cx.fill(); }      // záře
      cx.globalAlpha = 0.7; cx.fillStyle = grad(c.core); outline(0.85); cx.fill();                // jádro
      cx.globalAlpha = 0.55; cx.fillStyle = grad(['rgba(255, 255, 255, .2)', '#ffffff']); outline(0.28); cx.fill();   // světlá žilka uprostřed
      // třpytky v ohonu (každý snímek jinde, ať ohon žije)
      cx.fillStyle = '#ffffff';
      for (var t = 0; t < 4; t++) {
        var u = 0.25 + Math.random() * 0.7, idx = Math.floor(u * (n - 1)), p = tr[idx];
        cx.globalAlpha = 0.5 * u;
        cx.beginPath(); cx.arc(p[0] + rnd(-3, 3) * u, p[1] + rnd(-3, 3) * u, 0.6 + u, 0, 7); cx.fill();
      }
      cx.restore();
    }
    // obrázková pálka: horní hrana těla = plocha odrazu (top). Koncovky se nenatahují, střed ano (velká pálka).
    function drawSpritePad(sp, x, top, w, glow, still, skinIdx, rig, matIn) {
      var mat = matIn || matOf(skinIdx == null ? skin : skinIdx), hang = (rig || playerRig).hang;
      var s = PAD_W / sp.w, kx = w / (sp.w * s), left = x - w / 2, b = sp.body;
      var cap = Math.min(sp.split * 0.6, b[2] / 3), capD = cap * s, bh = b[3] * s;
      if (glow) { cx.shadowColor = glow; cx.shadowBlur = 18; }
      cx.drawImage(palImg, b[0], b[1], cap, b[3], left, top, capD, bh);
      cx.drawImage(palImg, b[0] + cap, b[1], b[2] - 2 * cap, b[3], left + capD - 0.3, top, w - 2 * capD + 0.6, bh);
      cx.drawImage(palImg, b[0] + b[2] - cap, b[1], cap, b[3], left + w - capD, top, capD, bh);
      cx.shadowBlur = 0;
      if (PAL && sp === PAL.ekvalizer) drawEqBars(left, top, s, kx, still);
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
        if (m === 'leg') {
          // chlupatá nožička: u pálky skoro tuhá, níž se ohýbá (úhel roste s druhou mocninou hloubky), na konci tuhá tlapka
          var ll = mat.leg * s * (st.k || 1), lw = im[2] * 0.4 * s, N = 8, pts = [[px, y0 - 2 * s]], ang = 0;
          for (var j = 1; j <= N; j++) {
            ang = st.a * 1.25 * Math.pow(j / N, 1.8);
            var q = pts[j - 1];
            pts.push([q[0] + Math.sin(ang) * ll / N, q[1] + Math.cos(ang) * ll / N]);
          }
          cx.save(); cx.lineCap = 'round'; cx.lineJoin = 'round';
          [[lw, '#bcbcc3'], [lw * 0.78, '#ececef'], [lw * 0.42, '#fbfbfc']].forEach(function (pass, pi) {
            cx.strokeStyle = pass[1]; cx.lineWidth = pass[0];
            cx.beginPath(); cx.moveTo(pts[0][0] - (pi === 2 ? lw * 0.12 : 0), pts[0][1]);
            for (var j2 = 1; j2 <= N; j2++) cx.lineTo(pts[j2][0] - (pi === 2 ? lw * 0.12 : 0), pts[j2][1]);
            cx.stroke();
          });
          cx.fillStyle = 'rgba(255, 255, 255, .5)';     // chloupky po stranách
          for (var j3 = 1; j3 < N; j3 += 2) { cx.beginPath(); cx.arc(pts[j3][0] + (j3 % 4 === 1 ? 1 : -1) * lw * 0.5, pts[j3][1], lw * 0.16, 0, 7); cx.fill(); }
          var e = pts[N];
          cx.translate(e[0], e[1] - 3 * s); cx.rotate(-ang);
          cx.drawImage(palImg, im[0], im[1], im[2], im[3], (p.x - p.px) * s, 0, im[2] * s, im[3] * s);
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
      if (mat.drip && !still && !rig) { dripTick(mat, tips, performance.now()); drawDrips(mat.drip); }
      if (sp.gears && sp.full) {
        // ozubená kola Strojovny: kruh vyříznutý z obrázku se otočí; otáčí se, jak pálka jede (obvod ujede to co pálka),
        // a pomalu i v klidu
        var fu = sp.full, tnow = still ? 0 : performance.now();
        sp.gears.forEach(function (g) {
          var gx = left + g[0] * s * kx, gy = top + g[1] * s, r = g[2], ang = g[3] * (x / (r * s) + tnow / 1500 * 18 / r);
          cx.save(); cx.beginPath(); cx.arc(gx, gy, r * s, 0, 7); cx.clip();
          cx.translate(gx, gy); cx.rotate(ang);
          cx.drawImage(palImg, fu[0] + g[0] - r - 1, fu[1] + g[1] - r - 1, 2 * r + 2, 2 * r + 2, -(r + 1) * s, -(r + 1) * s, (2 * r + 2) * s, (2 * r + 2) * s);
          cx.restore();
        });
      }
      if (PAL && sp === PAL.neon && !still) neonExtra(left, top, s, w, sp);
    }
    // Neonová trubice navíc: záře na hřiště pod pálkou, občas zabliká (jako opravdový neon) a trubicí běží světelný puls
    var neonFlickUntil = 0, neonNext = 0;
    function neonExtra(left, top, s, w, sp) {
      var now = performance.now(), tubeY = top + (sp.split + 15) * s;
      if (now > neonNext) { neonNext = now + rnd(2500, 6000); neonFlickUntil = now + rnd(90, 220); }
      var flick = now < neonFlickUntil ? (Math.sin(now / 9) > 0 ? 0.25 : 0.8) : 1;
      cx.save(); cx.globalCompositeOperation = 'lighter';
      var hg = cx.createRadialGradient(left + w / 2, tubeY, 4, left + w / 2, tubeY, w * 0.62);
      hg.addColorStop(0, 'rgba(125, 249, 255, ' + 0.2 * flick + ')'); hg.addColorStop(0.5, 'rgba(200, 110, 255, ' + 0.09 * flick + ')'); hg.addColorStop(1, 'rgba(200, 110, 255, 0)');
      cx.fillStyle = hg; cx.beginPath(); cx.ellipse(left + w / 2, tubeY, w * 0.62, 24, 0, 0, 7); cx.fill();
      var ph = (now % 2200) / 1400;                      // puls běží 1,4 s, pak chvíli pauza
      if (ph < 1) {
        var pxp = left + w * (0.08 + 0.84 * ph), pg = cx.createRadialGradient(pxp, tubeY, 0, pxp, tubeY, 9);
        pg.addColorStop(0, 'rgba(255, 255, 255, ' + 0.9 * flick + ')'); pg.addColorStop(0.4, 'rgba(160, 250, 255, ' + 0.5 * flick + ')'); pg.addColorStop(1, 'rgba(200, 110, 255, 0)');
        cx.fillStyle = pg; cx.beginPath(); cx.arc(pxp, tubeY, 9, 0, 7); cx.fill();
      }
      if (flick < 1) { cx.globalCompositeOperation = 'source-over'; cx.fillStyle = 'rgba(0, 0, 0, ' + (1 - flick) * 0.35 + ')'; cx.fillRect(left + 10 * s, tubeY - 6, w - 20 * s, 12); }
      cx.restore();
    }
    var ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, speed: 0, trail: [], fire: false, mishit: false };
    var combo = 0, hitStop = 0, flash = null, awaitStart = false, pausedMs = 0;
    // superútok „Přilepení“: na začátku zápasu nabitý 1×, další nabití = 10 bodů; perfektní odpal 1 bod, série perfektních
    // (hráč perfektně, Kevin vrátí, hráč zase perfektně…) víc, obyčejný odraz čtvrt bodu (STICK_TOUCH); horší odpal sérii
    // zruší, gól od Kevina sebere polovinu bodů
    var STICK_TOUCH = 0.25, STICK_PTS = 10, STICK_AIM_MS = 1600, STICK_SLOW = 0.25, STICK_MAX_ANG = 55 * Math.PI / 180, STICK_STEP = [1, 1, 1.25, 1.5, 1.75, 2];
    var stick = { charges: 1, pts: 0, armed: false, active: null, streak: 0 };
    // co se v zápase stalo (pro odznaky): perfektní odstřely, SUPER, přehřátí kol, nejdelší výměna, klubíčko
    var mt = { perfect: 0, superHit: false, overheats: 0, maxRally: 0, yarn: false };
    var gamesPlayed = 0, streakP = 0, streakK = 0, maxDown = 0, comebackSaid = false, rally = 0, fastSaid = false;
    var lastTarget = 0, lastMoveAt = 0, idleSaid = false;
    var coarse = window.matchMedia('(pointer: coarse)').matches;
    // komár: během zápasu rušil (uživatel 2026-10-27) → sám už nepřiletí; ?komar=1 nebo #komar v adrese = zkouška scénky
    var MOSQUITO_CHANCE = /[?&]komar=1(&|$)/.test(location.search) || location.hash === '#komar' ? 1 : 0;
    var mosq = { done: false, active: false };
    var keys = { left: false, right: false }, raf = 0, last = 0, signedIn = false, csrf = null;
    // nepřihlášený hráč (web to ví hned: přihlášený má v hlavičce formulář na odhlášení; signedIn přijde až z /api/pong/me)
    function guest() { return !signedIn && !document.querySelector('form.logout-form'); }

    var TALK = D.TALK, TALK_KEYS = ['more', 'normal', 'less', 'mute'];
    var talk = TALK[store.get('kevinPongTalk')] ? store.get('kevinPongTalk') : 'normal';
    var vibOn = store.get('kevinPongVib') !== '0', lefty = store.get('kevinPongLefty') === '1';
    // citlivost klávesnice: násobek rychlosti pálky na šipkách (0,5 = pomalá a přesná, 2 = rychlá)
    var keySpeed = clamp(+(store.get('kevinPongKeys') || 1) || 1, 0.5, 2);
    root.classList.toggle('lefty', lefty);
    // vzhledy pálky: Klasik pro všechny, obrázkové pálky odemyká odznak (b); pamatuje se podle id
    var SKINS = [
      { id: 'klasik', pad: ['#f2f2f4', '#9a9aa4'], rim: '#ffd23f', glow: 'rgba(255, 200, 60, .9)', trail: '#e6b730' },
      // obrázkové pálky (img = klíč v kevin/pong/palky.json z tools/catsmash-sprites.py); pad = barvy pro záložní kreslení
      { b: 'first', img: 'vetev', pad: ['#c79a62', '#5a3a1c'], rim: '#8fd16a', glow: 'rgba(120, 200, 90, .9)', trail: '#9ccf6a' },
      { b: 'loyal', img: 'plys', pad: ['#ffffff', '#cfcfd6'], rim: '#ffc2cf', glow: 'rgba(255, 190, 205, .9)', trail: '#ffd6df' },
      { b: 'overheat', img: 'graffiti', pad: ['#3a3a40', '#111114'], rim: '#ff5fd2', glow: 'rgba(120, 220, 255, .9)', trail: '#ffcf3a' },
      { b: 'fast', img: 'jadeit', pad: ['#8fd6a8', '#2f7a4c'], rim: '#7fd6a0', glow: 'rgba(110, 210, 150, .9)', trail: '#6fcf97' },
      { b: 'close', img: 'mince', pad: ['#ffd76a', '#8a6400'], rim: '#ffd23f', glow: 'rgba(255, 200, 60, .95)', trail: '#d9a441' },
      { b: 'streak', img: 'led', pad: ['#eef8ff', '#8fc6e8'], rim: '#cdeeff', glow: 'rgba(170, 225, 255, .95)', trail: '#bfe6ff' },
      { b: 'yarn', img: 'cip', pad: ['#3a3330', '#0e0b0a'], rim: '#e6b730', glow: 'rgba(90, 255, 160, .8)', trail: '#59f0a0' },
      { b: 'super', img: 'perly', pad: ['#ffffff', '#d9cfe0'], rim: '#fff4fb', glow: 'rgba(255, 240, 250, .95)', trail: '#f3e6ff' },
      { b: 'marathon', img: 'ekvalizer', pad: ['#2a2a2a', '#050505'], rim: '#e6b730', glow: 'rgba(230, 183, 48, .9)', trail: '#e6b730' },
      { b: 'comeback', img: 'lava', pad: ['#5a5550', '#1c1a18'], rim: '#ff8a2a', glow: 'rgba(255, 110, 20, .95)', trail: '#ff6a1a' },
      { b: 'hwins5', img: 'retez', pad: ['#ffe27a', '#a67c00'], rim: '#ffd23f', glow: 'rgba(255, 210, 63, 1)', trail: '#e6b730' },
      { b: 'angry', img: 'neon', pad: ['#2a2a35', '#08080c'], rim: '#7df9ff', glow: 'rgba(200, 110, 255, .95)', trail: '#b46bff' },
      { b: 'wins50', img: 'ganja', pad: ['#4f7a3a', '#1f3a17'], rim: '#ffd23f', glow: 'rgba(110, 210, 90, .9)', trail: '#7fd36b' },
      { b: 'wins100', img: 'kola', pad: ['#e0a36a', '#7a4320'], rim: '#e0a36a', glow: 'rgba(224, 150, 90, .9)', trail: '#c9844a' },
      { b: 'skelosquad', img: 'skelosquad', pad: ['#2a2418', '#000000'], rim: '#ffd23f', glow: 'rgba(255, 210, 63, 1)', trail: '#ffd23f' }   // nejvzácnější
    ];
    SKINS.forEach(function (s) { s.id = s.id || s.img; s.ok = function () { return owns('pad', s.img, s.b); }; });
    // (staré číselné kevinPongSkin / kevinPongBall patřily ke zrušeným barevným pálkám a míčkům → začne se od základu)
    var skin = Math.max(0, SKINS.map(function (s) { return s.id; }).indexOf(store.get('kevinPongPad')));
    if (!SKINS[skin] || !SKINS[skin].ok()) skin = 0;
    // míčky: hopík pro všechny, ostatní odemkne odznak; kreslí je drawBall
    var BALLS = [{ id: 'hopik' },
      // obrázkové míčky (kevin/pong/micky.json): od nejobyčejnějšího po nejhezčí
      { id: 'mramor', b: 'overheat' }, { id: 'kastan', b: 'easy' }, { id: 'plysak', b: 'tinker' }, { id: 'jadeitak', b: 'sniper' },
      { id: 'ledovka', b: 'normal' }, { id: 'procesor', b: 'yarn' }, { id: 'sprej', b: 'night' }, { id: 'perla', b: 'super' },
      { id: 'repro', b: 'marathon' }, { id: 'lavak', b: 'comeback' }, { id: 'tlapka', b: 'wardrobe' }, { id: 'vir', b: 'angry' },
      { id: 'hodinky', b: 'wins100' }];
    var ballType = Math.max(0, BALLS.map(function (b) { return b.id; }).indexOf(store.get('kevinPongBallId')));
    if (!BALLS[ballType] || !owns('ball', BALLS[ballType].id, BALLS[ballType].b)) ballType = 0;
    function vibe(p) { if (vibOn && navigator.vibrate) try { navigator.vibrate(p); } catch (e) { /* nevadí */ } }

    // ---------- zvuky stroje (Web Audio, nic se nestahuje; hrají jen po zapnutí v ⚙) ----------
    // (js/catsmash/zvuky.js; hlasitost vol mění ⚙, eqPulse = pálka Ekvalizér reaguje na každý zvuk i potichu)
    var vol = +(store.get('kevinPongVol') || 0);
    var Z = window.CatSmash.zvuky(function () { return vol; }, function (p) { eqPulse(p); });
    var sfx = Z.sfx, tone = Z.tone, buzzStart = Z.buzzStart;

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
    // anonymní počítadlo pro admin (vyváženost obtížností): jen obtížnost, délka a výsledek, nic o hráči
    function pongHit(p) {
      p.k = 'pong'; p.d = level; p.len = WIN;
      try { fetch('/api/hit?' + new URLSearchParams(p), { credentials: 'same-origin', cache: 'no-store', keepalive: true }).catch(function () {}); } catch (e) { /* nevadí */ }
    }
    function kickOff() {
      if (!awaitStart || !running) return false;
      var first = awaitStart === 'start';
      if (first) { kevinPadGone = false; pongHit({ e: 'start' }); }
      awaitStart = false;
      serveAt = performance.now() + 1500;
      if (first) {
        started = performance.now(); pausedMs = 0;
        if (signedIn) post('/api/pong/start', { d: level, len: WIN }).catch(function () { /* hraje se i tak */ });
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
      if (stick.active) return stickFire(performance.now());   // během míření = vystřelit
      if (kickOff()) return;
      var now = performance.now();
      if (!running || paused || now - player.shotAt < 380) return;
      player.shotAt = now; player.shotUsed = false;
      // kliknuto chvilku PO dotyku: míček ještě zrychlí, ale slaběji (odchylka = zpoždění + SHOT_IDEAL)
      if (ball.vy < 0 && !player.boosted && now - player.lastHit < 160) { shotSign = 'late'; boost(now - player.lastHit + SHOT_IDEAL, now); }
    }

    // ---------- superútok „Přilepení“ ----------
    function gauge() {
      var g = root.querySelector('.kp-gauge'), btn = root.querySelector('.kpong-stickbtn'), full = stick.charges > 0;
      if (g) {
        g.style.setProperty('--charge', full ? 1 : Math.min(1, stick.pts / STICK_PTS).toFixed(3));
        g.classList.toggle('ready', full); g.classList.toggle('armed', stick.armed);
      }
      if (btn) { btn.classList.toggle('ready', full); btn.classList.toggle('armed', stick.armed); btn.disabled = !full && !stick.armed && !stick.active; }
    }
    function stickReset() {
      stick = { charges: 1, pts: 0, armed: false, active: null, streak: 0 };
      streakEnd(false);
      root.classList.remove('kp-bullet', 'stick-armed');
      gauge();
    }
    // série perfektních odstřelů: kovová cedulka vlevo dole ve skle (2× bronz, 3× stříbro, 4× zlato, od 5× hoří),
    // dopadne s rázovou vlnou a zlatá jiskra doletí po oblouku do ukazatele nabití; přerušená série cedulku rozlomí
    // (schválený náhled work/skeli-navrh/catsmash-serie)
    var ST_COL = ['#e09a5a', '#e6ebf2', '#ffd23f', '#ff7a1a'];
    function streakPop(n) {
      var el = root.querySelector('.kp-streak'), field = root.querySelector('.kpong-field');
      if (!el || !field) return;
      var col = ST_COL[Math.min(5, n) - 2], still = matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.querySelector('.kp-st-n span').textContent = n;
      el.className = 'kp-streak t' + Math.min(5, n);
      void el.offsetWidth; el.classList.add('in');
      tone(440 * Math.pow(2, Math.min(n - 2, 8) * 2 / 12), 0.35, 'triangle', 0.2, 660 * Math.pow(2, Math.min(n - 2, 8) * 2 / 12));
      if (n >= 4) {                                     // od 4× se automat otřese
        vibe(n >= 5 ? [18, 40, 18] : 15);
        var m = root.querySelector('.kpong-machine');
        if (m && !still) { m.classList.remove('kp-jolt'); void m.offsetWidth; m.classList.add('kp-jolt'); }
      }
      if (still) return;
      // rázová vlna kolem cedulky (v souřadnicích skla) – střed z rozměrů bez animace (cedulka právě dopadá zvětšená)
      var f = field.getBoundingClientRect(), cx = el.offsetLeft + el.offsetWidth / 2, cy = el.offsetTop + el.offsetHeight / 2;
      var ring = document.createElement('i');
      ring.className = 'kp-st-ring'; ring.style.left = cx + 'px'; ring.style.top = cy + 'px'; ring.style.setProperty('--c', col);
      field.appendChild(ring); setTimeout(function () { ring.remove(); }, 650);
      // jiskra: z cedulky obloukem do ukazatele nabití (ten je v rámu pod sklem) – v souřadnicích celé hry
      var g = root.querySelector('.kp-gauge'), r = root.getBoundingClientRect();
      if (!g || !g.offsetWidth) return;
      var gr = g.getBoundingClientRect(), x0 = f.left - r.left + cx, y0 = f.top - r.top + cy - el.offsetHeight * 0.2,
        x1 = gr.left - r.left + gr.width / 2, y1 = gr.top - r.top + gr.height / 2, qx = (x0 + x1) / 2 + 40, qy = Math.min(y0, y1) - 70, kf = [];
      for (var k = 0; k <= 14; k++) {
        var t = k / 14, u = 1 - t;
        kf.push({ transform: 'translate(' + (u * u * x0 + 2 * u * t * qx + t * t * x1).toFixed(1) + 'px,' + (u * u * y0 + 2 * u * t * qy + t * t * y1).toFixed(1) + 'px)' });
      }
      var sp = document.createElement('i');
      sp.className = 'kp-st-spark'; sp.style.setProperty('--c', col);
      root.appendChild(sp);
      var an = sp.animate(kf, { duration: 550, easing: 'ease-in' });
      an.onfinish = an.oncancel = function () {
        sp.remove();
        g.classList.remove('hit'); void g.offsetWidth; g.classList.add('hit');
        setTimeout(function () { g.classList.remove('hit'); }, 320);
      };
    }
    function streakEnd(broken) {                      // konec série: rozlomená cedulka (broken) nebo jen tiché zmizení
      var el = root.querySelector('.kp-streak'), field = root.querySelector('.kpong-field');
      if (!el || !/\bt\d/.test(el.className)) return;
      if (broken && field && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        var x = el.offsetLeft, y = el.offsetTop, w = el.offsetWidth, h = el.offsetHeight, cls = el.className.replace(/\b(in|hold)\b/g, '');
        ['l', 'r'].forEach(function (side) {
          var half = document.createElement('div'), c = el.cloneNode(true);
          half.className = 'kp-st-half ' + side;
          half.style.cssText = 'left:' + (x + (side === 'r' ? w / 2 : 0)) + 'px;top:' + y + 'px;width:' + w / 2 + 'px;height:' + h + 'px';
          c.className = cls; c.style.cssText = 'position:static;opacity:1;width:' + w + 'px;margin-left:' + (side === 'r' ? -w / 2 : 0) + 'px';
          half.appendChild(c); field.appendChild(half);
          setTimeout(function () { half.remove(); }, 1050);
        });
        var b = document.createElement('div');
        b.className = 'kp-st-broke'; b.textContent = T.streakBroken || 'SÉRIE PŘERUŠENA';
        b.style.left = x + 'px'; b.style.top = (y + h + 4) + 'px';
        field.appendChild(b); setTimeout(function () { b.remove(); }, 1400);
        tone(220, 0.25, 'sawtooth', 0.08, 110);
      }
      el.className = 'kp-streak';
    }
    function stickPerfect() {                         // perfektní odpal hráče: série a body do nabití
      stick.streak++;
      if (stick.streak >= 2) { streakPop(stick.streak); if (stick.streak >= 3) quip('serie_perfekt', 0.5); }
      stickAdd(STICK_STEP[Math.min(stick.streak, 5)]);
    }
    function stickTouch() { stickAdd(STICK_TOUCH); }  // obyčejný (ne pokažený) odraz hráče: malinko nabije
    function stickAdd(n) {
      if (stick.charges > 0) return gauge();          // už nabitý (víc než jedno nabití naráz se nedrží)
      stick.pts += n;
      if (stick.pts >= STICK_PTS) {
        stick.pts = 0; stick.charges = 1;
        comic('l', 'burst good', T.stickReady || 'SUPERÚTOK NABITÝ!', 1600);
        setTimeout(function () { quip('superutok_nabit', 0.8); }, 900);
        tone(660, 0.12, 'triangle', 0.2); tone(990, 0.2, 'triangle', 0.2, null, 0.1);
      }
      gauge();
    }
    function stickBreak(lostPoint) {
      if (stick.streak >= 3) quip('serie_prerusena', 0.6);
      if (stick.streak >= 2) { mt.streakPts += 10 * stick.streak; streakEnd(true); }   // série do skóre: 10 × délka
      stick.streak = 0; if (lostPoint) stick.pts /= 2; gauge();
    }
    // E / tlačítko s magnetem: připravit (další míček se přilepí), znovu = zrušit; během míření = vystřelit
    function useStick() {
      if (!running || awaitStart || paused) return;
      if (stick.active) return stickFire(performance.now());
      if (stick.armed) stick.armed = false;
      else if (stick.charges > 0) stick.armed = true;
      else return;
      root.classList.toggle('stick-armed', stick.armed);
      gauge();
    }
    function stickStart(now) {                         // míček se přilepil: čas se zpomalí, hráč míří
      stick.armed = false; stick.charges = 0;
      stick.active = { x: player.x, start: now, end: now + STICK_AIM_MS, ang: 0 };
      ball.vx = 0; ball.vy = 0; ball.fire = false; ball.trail = []; flight = null;   // stará stopa letu pryč
      root.classList.remove('stick-armed'); root.classList.add('kp-bullet');
      tone(520, 1.1, 'sine', 0.22, 70);                // zvuk se protáhne do hloubky
      if (K && !mosq.active) { K.once(K.has('shrug') ? 'shrug' : 'no'); K.expression(23, 1600); }   // Kevin se lekne
      quip('superutok_pouzit', 0.9, null, 0, true);
      gauge();
    }
    function stickAim() {                              // úhel podle toho, kam hráč táhne (myš, prst, šipky): ±55°
      var a = stick.active;
      a.ang = clamp((player.target - a.x) / (W * 0.3), -1, 1) * STICK_MAX_ANG;
    }
    function stickFire(now) {
      var a = stick.active;
      if (!a) return;
      if (tut && tut.step === 3) setTimeout(tutNext, 900);
      stick.active = null;
      root.classList.remove('kp-bullet');
      var sp = L.max * 1.5;                            // SUPER = vždy nejvyšší rychlost hry a ještě o polovinu víc (dřív jen 1,35× aktuální)
      ball.speed = sp; ball.vx = Math.sin(a.ang) * sp; ball.vy = -Math.cos(a.ang) * sp;
      ball.y = PLAYER_Y - PAD_H / 2 - BALL_R - 1; ball.fire = true; ball.superStick = true;
      player.target = player.x;
      // Kevin takový výstřel chytí jen někdy (Lehká 20 %, Normální 30 %, Naštvaný 40 %) – jinak se splete v odhadu
      // a doběhne o kus vedle (žádná kostka na konci: opravdu běží na špatné místo)
      kevin.whiff = Math.random() < [0.2, 0.3, 0.4][level - 1] ? 0 : (Math.random() < 0.5 ? -1 : 1) * (PAD_W / 2 + BALL_R + rnd(14, 40));
      kevin.planned = false; aimError(); startFlight(now); padBurst(3, now); sfx.shot(0.3);
      comic('l', 'burst good', T.stickGo || 'SUPERÚTOK!', 1300);
      gauge();
    }
    function boost(off, now) {
      player.shotUsed = true;
      var tier = SHOT.filter(function (s) { return off <= s[0]; })[0];
      if (!tier) return mishit(now);
      var mult = tier[1], kind = tier[2];
      if (kind === 'perfect') { combo++; if (combo >= 3) { kind = 'super'; mult = SHOT_SUPER; combo = 0; ball.fire = true; } }
      else combo = 0;
      if (kind === 'perfect' || kind === 'super') { mt.perfect++; stickPerfect(); } else { stickBreak(false); stickTouch(); }
      if (tut && tut.step === 2 && kind !== 'weak') setTimeout(tutNext, 700);
      if (kind === 'super') {
        mt.superHit = true; mt.supers++;
        if (K && !mosq.active) { K.once(K.has('stomp') && Math.random() < 0.5 ? 'stomp' : K.has('no') ? 'no' : 'shrug'); K.expression(23, 1200); }
      }
      player.boosted = true;
      ball.speed *= mult; ball.vx *= mult; ball.vy *= mult;
      aimError();
      flash = { kind: kind, text: (T.shots ? T.shots[kind] : kind) + timingNote(kind), at: now };
      showFlash(flash);
      sfx.shot(kind === 'super' ? 0.3 : kind === 'perfect' ? 0.22 : 0);
      if (kind === 'perfect' || kind === 'super') {
        padBurst(kind === 'super' ? 3 : 2, now);
        if (flight) flight.power = kind === 'super' ? 1.9 : 1.5;
        hitStop = now + (kind === 'super' ? 300 : 220);         // zastavení času = nabití energie (zvuk náboje), pak výstřel
        vibe(kind === 'super' ? [30, 40, 60] : 35);
      }
      else { padBurst(1.5, now); if (flight) flight.power = 1.2; }   // dobrý (ne perfektní) odstřel = plný efekt pálky
      field.classList.remove('shot', 'shot-super'); void field.offsetWidth; field.classList.add(kind === 'super' ? 'shot-super' : 'shot');
      ball.perfect = kind === 'perfect' || kind === 'super';
      if (kind === 'super') quip('odstrel_super', 1, null, 0, true);
      else if (kind === 'perfect') quip('odstrel_perfekt', 0.3);
      else quip('odstrel_dobry', 0.1);
    }

    // pokažený odstřel: míček nezrychlí (ani o běžné zrychlení odrazu), naopak trochu zpomalí – ne pod 90 % základní
    // rychlosti; Kevin ho vidí jasně (žádná chyba odhadu) a vrátí ho šikmo (viz punish)
    // k nápisu po ráně, která nebyla perfektní: „ · brzo“ / „ · pozdě“ (ať hráč ví, co zlepšit)
    function timingNote(kind) {
      if (kind === 'perfect' || kind === 'super' || !shotSign || !T.timing) return '';
      var s = ' · ' + (T.timing[shotSign] || ''); shotSign = '';
      return s;
    }
    // ukazatel načasování: když hopík letí k pálce, nad ní v místě dopadu svítí terčík a kolem stahující se kroužek;
    // kroužek se s terčíkem potká přesně ve chvíli ideálního kliknutí (SHOT_IDEAL před dopadem), v okně perfektní
    // rány (±35 ms) terčík zazáří zlatě. Po kliknutí zmizí. V ⚙ Ovládání jde vypnout.
    function drawAim(now) {
      if (!aimOn || !running || paused || awaitStart || replay || stick.active || now < serveAt || ball.vy <= 0) return;
      if (!player.shotUsed && now - player.shotAt < 380) return;
      var py = PLAYER_Y - PAD_H / 2 - BALL_R, t = (py - ball.y) / ball.vy;
      if (t < 0 || t > 0.75) return;
      var tIdeal = t - SHOT_IDEAL / 1000, R0 = 13;
      // kam hopík dopadne (i s odrazy od stěn)
      var span = W - 2 * BALL_R, per = 2 * span, xr = ((ball.x + ball.vx * t - BALL_R) % per + per) % per;
      var x = (xr > span ? per - xr : xr) + BALL_R, y = PLAYER_Y - PAD_H / 2 - 4;
      var hot = Math.abs(tIdeal) < 0.035, fade = Math.min(1, (0.75 - t) / 0.2);
      cx.save();
      cx.globalAlpha = fade;
      cx.lineWidth = hot ? 5 : 3;
      cx.strokeStyle = hot ? '#fff1a8' : 'rgba(255, 210, 63, .95)';          // terčík vždy zlatý, v okně perfektní rány světlý
      cx.shadowColor = 'rgba(255, 200, 60, .9)'; cx.shadowBlur = hot ? 20 : 8;
      cx.beginPath(); cx.ellipse(x, y, R0 * 1.6, R0 * 0.62, 0, 0, Math.PI * 2); cx.stroke();      // terčík (plochý, leží na pálce)
      if (tIdeal > 0) {
        var r = R0 + tIdeal * 260;                                                              // stahující se kroužek
        cx.shadowBlur = 0; cx.lineWidth = 2.5; cx.strokeStyle = 'rgba(255, 236, 190, ' + (0.5 + 0.5 * (1 - Math.min(1, tIdeal / 0.5))).toFixed(2) + ')';
        cx.beginPath(); cx.ellipse(x, y, r * 1.6, r * 0.62, 0, 0, Math.PI * 2); cx.stroke();
      }
      cx.restore();
    }
    function mishit(now) {
      combo = 0; player.boosted = true;
      flight = null; ballFx = { kind: null, until: 0 };   // pokažený odstřel: žádný efekt
      var k = Math.max(L.speed * 0.9, ball.speed / L.gain * 0.88) / ball.speed;
      ball.speed *= k; ball.vx *= k; ball.vy *= k;
      ball.mishit = true; kevin.miss = 0;
      flash = { kind: 'miss', text: (T.shots ? T.shots.miss : 'miss') + timingNote('miss'), at: now };
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
      if (phoneView || Math.random() >= MOSQUITO_CHANCE) return;   // telefon: horní hrana stroje, kde se honí, není vidět
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

    // jen test/localhost: #fps = počítadlo plynulosti přímo ve hře (na opravdovém telefonu se to jinak změřit nedá).
    // snímky za sekundu · nejhorší snímek · čas kódu na snímek · úroveň ubírání ozdob
    var fpsEl = null, fpsN = 0, fpsAt = 0, fpsWorst = 0, fpsJs = 0;
    if (TRY_HOST && /\bfps\b/.test(location.hash)) {
      fpsEl = document.createElement('div');
      fpsEl.className = 'kp-fps';
      root.appendChild(fpsEl);
    }
    function fpsTick(ms, now) {
      var t0 = performance.now();
      queueMicrotask(function () { fpsJs += performance.now() - t0; });   // proběhne hned po celém snímku
      fpsN++; if (ms > fpsWorst) fpsWorst = ms;
      if (now - fpsAt < 1000) return;
      fpsEl.textContent = Math.round(fpsN * 1000 / (now - fpsAt)) + ' fps · max ' + Math.round(fpsWorst) + ' ms · JS ' + (fpsJs / fpsN).toFixed(1) + ' ms · fx ' + lowFx;
      fpsAt = now; fpsN = 0; fpsWorst = 0; fpsJs = 0;
    }
    function step(now) {
      raf = requestAnimationFrame(step);
      var real = last ? now - last : 0, dt = Math.min(0.034, real / 1000); last = now;
      if (running && !paused && !awaitStart && real > 0 && real < 250) watchSmooth(real, now);
      if (fpsEl) fpsTick(real, now);
      if (running && (paused || awaitStart)) {
        pausedMs += real;
        if (hotUntil > now) hotUntil += real;
        for (var pk in powers) powers[pk] += real;   // bonusy během pauzy neubývají
        if (yarn) { yarn.until += real; yarn.land += real; yarn.at += real; }   // (nitka se mezitím jen nehýbe)
        nextScrewAt += real;
        if (stick.active) { stick.active.end += real; stick.active.start += real; }
      }   // pauzy, komár, nastavení, čekání na ťuknutí
      if (replay) { replayTick(now); draw(now); drawReplayMarks(now); return; }
      if (!running || paused) { draw(now); return; }
      // zastavení času po perfektním odstřelu: všechno stojí, jen se kreslí
      if (now < hitStop) { draw(now); return; }
      // Přilepení: čas běží na čtvrtinu (Kevin, kola, všechno), hráč míří; po 1,6 s výstřel sám
      if (stick.active) { dt *= STICK_SLOW; stickAim(); if (now >= stick.active.end) stickFire(now); }
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
      if (stickV) player.target += stickV * dt;          // páčka na dotyk: pálka jede, dokud je vychýlená
      player.target = clamp(player.target, player.w / 2, W - player.w / 2);
      if (!stick.active) player.x += (player.target - player.x) * Math.min(1, dt * (now < player.stunUntil ? 7 : 30));
      // šroubek: občas vypadne z horního okénka stroje a pomalu padá k hráči
      // součástky padají hlavně z příčin (dropPart); když se dlouho nic neděje, občas spadne náhodná
      if (!awaitStart && !screw && now > nextScrewAt) dropPart(['big', 'slow', 'calm'][Math.floor(Math.random() * 3)], rnd(60, W - 60));
      if (screw) {
        // padá rychle a rovně (jen se při pádu převrací) – vylepšení se musí vybojovat
        screw.y += 430 * dt; screw.a += (screw.nut ? 6 : 4) * dt;
        if (Math.abs(screw.y - PLAYER_Y) < PAD_H + 10 && Math.abs(screw.x - player.x) < player.w / 2 + 12) { powerUp(now, screw.kind); screw = null; nextScrewAt = now + rnd(30000, 45000); }
        else if (screw.y > H + 20) { screw = null; nextScrewAt = now + rnd(30000, 45000); }
      }
      for (var pk in powers) if (now > powers[pk]) { delete powers[pk]; if (pk === 'big') player.w = PAD_W; }
      // Kevin: přemýšlí jednou za „react“, cíl = kam přiletí míč (+ chyba); na těžké míří do protirohu
      if (now / 1000 >= kevin.nextThink) {
        kevin.nextThink = now / 1000 + L.react + (isHot ? 0.06 : 0);
        if (ball.vy < 0 && (ball.mishit || ball.y < KEVIN_Y + L.watch * (PLAYER_Y - KEVIN_Y))) {
          var hit = predictX(KEVIN_Y + PAD_H);
          var aimSide = player.x < W / 2 ? 1 : -1;     // pošle míč na stranu, kde hráč není
          kevin.target = hit - aimSide * (ball.mishit ? 0.9 : L.aim) * PAD_W * 0.42 + kevin.miss;
          if (ball.superStick && kevin.whiff) kevin.target = hit + kevin.whiff;   // superútok: splete se
        } else if (ball.vy < 0) {
          kevin.target = kevin.x + (W / 2 - kevin.x) * 0.2;   // míček letí k němu, ale ještě ho „nesleduje“
        } else {
          kevin.target = level === 3 ? W / 2 : kevin.x + (W / 2 - kevin.x) * 0.3;
        }
        kevin.target = clamp(kevin.target, PAD_W / 2, W - PAD_W / 2);
      }
      var dx = kevin.target - kevin.x, ran;
      // zpomalení se násobí (přehřátí, šroubek, nálada), ale Kevin nikdy pod polovinu rychlosti – aby měl šanci
      var maxStep = L.aiSpeed * Math.max(0.5, (isHot ? 0.7 : 1) * (powers.slow > now ? 0.65 : 1) * MOOD[mood][0]) * dt;
      ran = clamp(dx, -maxStep, maxStep);
      kevin.moving = Math.abs(dx) > 4 ? Math.sign(dx) : 0;
      kevin.x += ran;
      heatTick(Math.abs(ran), dt, now);
      // klubíčko na nitce se houpe pořád (i mezi body, než se podává)
      var yarnHit = yarn && yarnTick(now, dt);
      if (yarn && now > yarn.until) yarn = null;
      // míč
      if (stick.active) { ball.x = stick.active.x; ball.y = PLAYER_Y - PAD_H / 2 - BALL_R - 1; }   // přilepený na pálce
      else if (now >= serveAt) {
        var prevY = ball.y;                             // kde byl před krokem: rychlý míček (superútok, pomalý telefon) by jinak pálku přeskočil
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        ball.trail.push([ball.x, ball.y]); if (ball.trail.length > 16) ball.trail.shift();
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
        if (ball.vy > 0 && ball.y + BALL_R >= py - PAD_H / 2 && (ball.y < py + PAD_H || prevY < py) && Math.abs(ball.x - player.x) <= player.w / 2 + BALL_R) {
          if (stick.armed) { stickStart(now); hangKick(6); } else {
          bounce(player.x, -1, py, player.w);
          hangKick(4 + ball.speed / 300);                // ťuk rozhoupe přívěsky
          startFlight(now);
          if (player.shotUsed && now >= player.stunUntil + 200) padBurst(1, now);   // obyčejný odpal: efekt pálky (odstřel rozhodne boost níž)
          ball.fire = false; sfx.pad(false);
          player.lastHit = now; player.boosted = false; rallyTick();
          if (!player.shotUsed) { var off = now - player.shotAt - SHOT_IDEAL; shotSign = off > 0 ? 'early' : 'late'; boost(Math.abs(off), now); }
          else if (now < player.stunUntil + 200) { mishit(now); stickBreak(false); }   // pálka se po odstřelu naprázdno ještě nevzpamatovala
          else { combo = 0; aimError(); stickBreak(false); stickTouch(); }
          }
        }
        // Kevinova pálka
        if (ball.vy < 0 && ball.y - BALL_R <= KEVIN_Y + PAD_H / 2 && (ball.y > KEVIN_Y - PAD_H || prevY > KEVIN_Y) && Math.abs(ball.x - kevin.x) <= PAD_W / 2 + BALL_R) {
          bounce(kevin.x, 1); sfx.pad(true); hangKick(4 + ball.speed / 300, kevinRig, MAT.kevin);
          if (ball.superStick) quip('superutok_chycen', 1, null, 0, true);
          ball.fire = false; ball.superStick = false;
          if (ball.perfect || ball.fire) {                // tvrdá rána: stroj se otřese, po třetí vypadne šroubek (= velká pálka)
            shake += ball.fire ? 2 : 1;
            root.classList.remove('kp-shake'); void root.offsetWidth; root.classList.add('kp-shake');
            if (shake >= 3) { shake = 0; dropPart('big', kevin.x); }
          }
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
      if (!awaitStart && now >= serveAt) recordFrame(now);
      draw(now);
    }

    // součástka stroje padá k hráči; kind = co dá: big (šroubek – otřesy od perfektních ran), slow (matička – přehřátá kola),
    // calm (pružinka – dlouhá výměna). Najednou padá jen jedna.
    var shake = 0;
    function dropPart(kind, x) {
      if (screw || awaitStart) return;
      screw = { x: clamp(x, 60, W - 60), y: KEVIN_Y + 40, a: rnd(0, 6), kind: kind, nut: kind === 'slow', spring: kind === 'calm' };
    }
    function powerUp(now, kind) {
      var k = kind || ['big', 'slow', 'calm'][Math.floor(Math.random() * 3)];
      // bonusy platí naráz, každý má svých 8 s; stejný znovu = jen se mu prodlouží čas (nejvýš 16 s dopředu), účinek se nesčítá
      powers[k] = Math.min(now + 16000, Math.max(now, powers[k] || 0) + 8000);
      if (k === 'big') player.w = PAD_W * 1.5;
      if (k === 'calm') { var f = Math.min(1, Math.max(0.7, L.speed / ball.speed)); ball.speed *= f; ball.vx *= f; ball.vy *= f; }
      comic('l', 'burst good', (T.power || {})[k] || k, 1500);
      sfx.shot(0); vibe(30);
      if (level >= 2) store.set('kevinPongScrews', String(+(store.get('kevinPongScrews') || 0) + 1));
      mt.screws++;
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
        dropPart('slow', kevin.x);                    // z rozpálených kol vypadne matička (= Kevin zpomalí)
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

    // ---------- výuka (první zápas): Kevin trenér ----------
    // 1. posuň pálkou, 2. odstřel podle terčíku (stačí dobrý nebo perfektní), 3. superútok (E / magnet).
    // Během výuky se góly nepočítají (hopík se jen znovu podá). Hotová výuka = „VÝUKA HOTOVÁ“ a návrat do menu
    // (nic se nedohrává ani neukládá); „Přeskočit výuku“ = rovnou nový zápas naostro (čas výhry se počítá od začátku).
    // Hotová výuka = localStorage kevinPongTut; znovu ji pustí „Zopakovat výuku“ v Jak se hraje.
    var tut = null, tutEl = root.querySelector('.kp-tut');
    function tutStart() {
      tut = { step: 0, x0: player.x, tries: 0 };
      tutEl.querySelector('.kp-tut-skip').textContent = T.tutSkip || '';
      tutEl.hidden = false;
      tutNext();
    }
    function tutNext() {
      tut.step++;
      if (tut.step > 3) return tutDone();
      if (tut.step === 3) { stick.charges = Math.max(1, stick.charges); gauge(); }
      tutEl.querySelector('.kp-tut-step').textContent = (T.tutStep || '{n} / 3').replace('{n}', tut.step);
      tutEl.querySelector('.kp-tut-text').textContent = (tut.step === 3 && coarse ? T.tutSuperTouch : (T.tut || [])[tut.step - 1]) || '';
      tutEl.classList.remove('pop'); void tutEl.offsetWidth; tutEl.classList.add('pop');
      if (tut.step > 1) say(pick(T.tutGood || ['👍']), 2200);
      tut.x0 = player.x;
    }
    function tutDone(skipped) {
      tut = null; tutEl.hidden = true;
      store.set('kevinPongTut', '1');
      if (skipped) { begin(); return; }
      running = false; ball.vx = ball.vy = 0;          // hopík se zastaví, zápas z výuky se nedohrává
      comic('l', 'burst good', T.tutDone || '', 1800);
      say(T.tutEnd || T.tutGo || '', 3000);
      setTimeout(function () { if (!running) toMenu(); }, 1900);
    }
    tutEl.querySelector('.kp-tut-skip').addEventListener('click', function () { if (tut) tutDone(true); });
    // krok 1: pálka popojela; krok 2: odstřel (v boost), krok 3: superútok (stickFire)
    function tutTick() { if (tut && tut.step === 1 && Math.abs(player.x - tut.x0) > 140) tutNext(); }
    function goal(byPlayer) {
      if (tut) {                                         // během výuky se nepočítá – jen nové podání
        stickBreak(false); ball.superStick = false;
        if (!byPlayer && tut.step === 2 && ++tut.tries >= 3 && T.tutHint) say(T.tutHint, 3200);
        resetBall(byPlayer ? false : true);
        return;
      }
      if (!byPlayer) stickBreak(true);
      var superGoal = byPlayer && ball.superStick;
      if (superGoal) mt.stickGoals++;
      ball.superStick = false;
      if (byPlayer) { you++; youEl.textContent = you; } else { kev++; kevEl.textContent = kev; }
      bigScore(byPlayer ? 'you' : 'kev');
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
      if (superGoal) { quip('superutok_gol', 1, null, 0, true); if (you === WIN - 1 && kev === WIN - 1) root.classList.add('final'); }   // gól superútokem má přednost
      else if (you === WIN - 1 && kev === WIN - 1) { quip('9_9', 1, null, 0, true); root.classList.add('final'); }
      else if (kev === WIN - 1 && !byPlayer) quip('mecbol_kevin', 1, null, 0, true);
      else if (you === WIN - 1 && byPlayer) quip('mecbol_hrac', 1, null, 0, true);
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
    // okénka s koly přesně do průhledných okének vybraného automatu (bez automatu = původní rám)
    // kolečka se přeskládají do okénka: střed okénka, celá šířka, ve vyšším okénku větší (nejvýš o 35 %)
    var MECH_DEF = {
      top: { sizes: [30, 40, 24, 40], yA: 224, yB: 238, x0: 150, x1: 540, back: MECH.top.back.map(function (g) { return Object.assign({}, g); }) },
      bot: { sizes: [42, 56, 32, 56], yA: 1130, yB: 1150, x0: 160, x1: 545, back: MECH.bot.back.map(function (g) { return Object.assign({}, g); }) }
    };
    function layoutMech(k, w, def) {
      var d = MECH_DEF[k], s = clamp(w[3] / def[3], 1, 1.35), dy = (w[1] + w[3] / 2) - (def[1] + def[3] / 2), kx = w[2] / def[2];
      MECH[k].front = chain(w, d.sizes.map(function (r) { return r * s; }), d.yA + dy, d.yB + dy,
        w[0] + (d.x0 - def[0]) * kx, w[0] + (d.x1 - def[0]) * kx);
      MECH[k].back = d.back.map(function (g) { return { img: g.img, x: w[0] + (g.x - def[0]) * kx, y: g.y + dy, r: g.r * s, sign: g.sign, a: g.a }; });
    }
    var winMachine = null;
    function applyWins(id) {
      winMachine = id;
      if (!MECH) return;                                   // (setSkin může běžet dřív, než je mechanika připravená)
      var mw = id && D.MECH_WIN[id];
      [['top', WIN_TOP], ['bot', WIN_BOT]].forEach(function (x, n) {
        var w = mw ? mw[n] : x[1], c = root.querySelector('.kpong-mech[data-win="' + x[0] + '"]');
        MECH[x[0]].win = w;
        layoutMech(x[0], w, x[1]);
        if (c) { c.style.setProperty('--wx', w[0]); c.style.setProperty('--wy', w[1]); c.style.setProperty('--ww', w[2]); c.style.setProperty('--wh', w[3]); }
      });
      fit();
      placeGauge();
    }
    applyWins(winMachine);
    // manometr nabití superútoku sedí přímo na velkém kole vlevo v dolním okénku (druhé v řetězu): stejný střed,
    // průměr 84 % kola = kolem dokola koukají zuby, které se pod ním točí
    // velká čísla skóre ve skle (telefon): přepíše obě, kdo dal gól, ten se na chvíli rozsvítí
    function bigScore(who) {
      var b = root.querySelectorAll('.kp-bigscore b');
      if (!b.length) return;
      b[0].textContent = kev; b[1].textContent = you;
      if (who) { var el = b[who === 'kev' ? 0 : 1]; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
    }
    function placeGauge() {
      if (!MECH) return;                                  // (fit() běží dřív, než je mechanika připravená)
      // telefon: na velkém kole uprostřed a menší, vlevo je tlačítko odstřelu a nižší pruh by ho uřízl
      var g = MECH.bot.front[phoneView ? 3 : 1] || MECH.bot.front[1], el = root.querySelector('.kp-gauge');
      if (!g || !el) return;
      el.style.setProperty('--gx', g.x.toFixed(1));
      el.style.setProperty('--gy', g.y.toFixed(1));
      el.style.setProperty('--gd', (2 * g.r * (phoneView ? 0.7 : 0.84)).toFixed(1));
    }
    placeGauge();
    var mechWant = { top: 0, bot: 0 }, mechLast = 0, mechOdd = false;
    function mechTick(now) {
      var dt = mechLast ? Math.min(0.05, (now - mechLast) / 1000) : 0;
      mechLast = now;
      mechOdd = !mechOdd;
      mechEls.forEach(function (c) {
        if (phoneView && c.dataset.win === 'top') return;  // telefon: horní okénko není vidět, nekreslí se
        var m = MECH[c.dataset.win], want = running && !paused ? mechWant[c.dataset.win] : 0;
        if (Math.abs(want) > 1) m.dir = want > 0 ? 1 : -1;
        var target = Math.abs(want) + 9 + (running && rally >= 8 ? Math.min(rally, 30) * 5 : 0);   // 9 px/s = klidné tikání, dlouhá výměna kola roztočí
        m.v += (target - m.v) * Math.min(1, dt * 5);
        var step = m.v * dt * m.dir;
        if (Math.abs(want) > 20) { m.acc = (m.acc || 0) + Math.abs(step); if (m.acc > 28) { m.acc = 0; sfx.click(); } }
        m.front.forEach(function (g) { g.a += g.sign * step / g.r; });
        m.back.forEach(function (g) { g.a += g.sign * step * 0.45 / g.r; });
        if (!phoneView || mechOdd) drawMech(m, c);         // telefon: kolečkům stačí každý druhý snímek
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
      // píst: čep na horním paprsku posledního kola řetězu (kolo má 6 paprsků, obrázek je natočený o k.a – čep se
      // točí s paprskem, nikdy nevisí v díře), ojnice k pístu ve válci vpravo. Válec je přesně tak dlouhý, kolik
      // píst ujede (+ kostička), a ojnice se zkrátí, aby se celý vešel do okénka.
      var k = m.front[m.front.length - 1], pr = k.r * 0.45, ang = k.a - Math.PI / 2, pin = [k.x + Math.cos(ang) * pr, k.y + Math.sin(ang) * pr];
      var winR = m.win[0] + m.win[2] - 8, L = Math.max(pr * 1.6, Math.min(k.r * 1.9, winR - 18 - k.x - pr)), cyl = k.y;
      var px = pin[0] + Math.sqrt(Math.max(0, L * L - (cyl - pin[1]) * (cyl - pin[1])));
      var lo = k.x - pr + Math.sqrt(L * L - pr * pr), hi = k.x + pr + L;     // krajní polohy pístu
      g2.fillStyle = '#0f0e12'; g2.strokeStyle = 'rgba(230,183,48,.55)'; g2.lineWidth = 2;
      g2.beginPath(); g2.rect(lo - 6, cyl - 9, hi - lo + 22, 18); g2.fill(); g2.stroke();
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
      if (rally % 12 === 0) dropPart('calm', rnd(80, W - 80));   // dlouhá výměna: vyskočí pružinka (= hopík zpomalí)
      if (rally > mt.maxRally) mt.maxRally = rally;
      if (rally === 10) quip('dlouha_vymena', 1);
      else if (!fastSaid && ball.speed > L.max * 0.92) { fastSaid = true; quip('rychly_hopik', 0.35); }
    }
    // ---------- skóre zápasu (stejný vzorec počítá server: model/PongScore.java – ten je rozhodující) ----------
    var MULT = [1, 2, 3], lastScore = null;          // Lehká ×1, Normální ×2, Naštvaný ×3
    function scoreOf(ms, won) {
      var rows = [], raw = 0, SR = T.scoreRows || {};
      function row(key, n, pts) { if (!n) return; raw += pts; rows.push([(SR[key] || key) + (n > 1 || key === 'goals' ? ' × ' + n : ''), pts]); }
      row('goals', you, you * 100);
      row('perfect', mt.perfect - mt.supers, (mt.perfect - mt.supers) * 20);
      row('supers', mt.supers, mt.supers * 60);
      row('stick', mt.stickGoals, mt.stickGoals * 150);
      if (mt.streakPts) { raw += mt.streakPts; rows.push([SR.streaks || 'streaks', mt.streakPts]); }
      if (mt.maxRally) { raw += mt.maxRally * 5; rows.push([(SR.rally || 'rally') + ' (' + mt.maxRally + ')', mt.maxRally * 5]); }
      row('screws', mt.screws, mt.screws * 30);
      row('kevin', kev, -kev * 40);
      if (won) {
        raw += 500; rows.push([SR.win || 'win', 500]);
        // čas: 2000 × normální čas (20 s na gól) ÷ můj čas, nejvýš 8000 – čím déle, tím méně (stejně počítá server)
        var sp = Math.min(8000, Math.round(2000 * WIN * 20000 / Math.max(1000, ms))); raw += sp; rows.push([SR.speed || 'speed', sp]);
      }
      return { rows: rows, mult: MULT[level - 1], total: Math.max(0, Math.round(raw * MULT[level - 1])) };
    }
    function scoreHtml(sc) {
      if (!sc) return '';
      return '<div class="kp-score"><ul>' + sc.rows.map(function (r, i) {
        return '<li style="--i:' + i + '"><span>' + esc(r[0]) + '</span><b>' + (r[1] > 0 ? '+' : '') + r[1] + '</b></li>';
      }).join('') + '<li class="kp-score-mult" style="--i:' + sc.rows.length + '"><span>' + esc((T.scoreRows || {}).mult || '×') + '</span><b>× ' + String(sc.mult).replace('.', ',') + '</b></li></ul>' +
        '<p class="kp-score-total" style="--i:' + (sc.rows.length + 1) + '"><span>' + esc(T.scoreTotal || '') + '</span><b>' + sc.total + '</b></p>' +
        (sc.rec ? '<p class="kp-score-rec" style="--i:' + (sc.rows.length + 2) + '">' + esc(T.scoreRecord || '') + '</p>' : '') +
        (sc.loss && T.lossNote ? '<p class="kp-score-loss" style="--i:' + (sc.rows.length + 2) + '">' + esc(T.lossNote) + '</p>' : '') + '</div>';
    }

    // ---------- zpomalený záznam vítězného gólu ----------
    // Během hry se ukládají poslední ~2,4 s (míček, obě pálky); po posledním gólu zápasu se přehrají zpomaleně.
    // Aby bylo jasné, na co se díváš: nejdřív nápis, kdo gól dal; záznam začne až od posledního odpalu (rána,
    // která gól dala); hřiště celé bez přiblížení, míček v kroužku a za ním zlatá čára jeho dráhy, při gólu
    // velké GÓL!. Poslední 0,7 s ještě pomaleji.
    var rec = [], replay = null, REC_MS = 2400;
    function recordFrame(now) {
      rec.push({ t: now, bx: ball.x, by: ball.y, px: player.x, kx: kevin.x, f: !!ball.fire });
      while (rec.length > 2 && now - rec[0].t > REC_MS) rec.shift();
    }
    function startReplay(done, won) {
      var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (rec.length < 3 || rec[rec.length - 1].t - rec[0].t < 300 || reduce) return done();   // aspoň 0,3 s záznamu (i na pomalém zařízení)
      // od posledního odpalu: poslední místo, kde míček u pálky obrátil svislý směr, a 0,25 s před ním
      var fs = rec.slice(), from = 0;
      for (var i = fs.length - 2; i > 0; i--) {
        var d1 = fs[i].by - fs[i - 1].by, d2 = fs[i + 1].by - fs[i].by;
        if (d1 * d2 < 0 && (Math.abs(fs[i].by - PLAYER_Y) < 60 || Math.abs(fs[i].by - KEVIN_Y) < 60)) { from = i; break; }
      }
      var t0 = fs[from].t - 250;
      while (from > 0 && fs[from - 1].t >= t0) from--;
      if (fs[fs.length - 1].t - fs[from].t < 300) from = 0;   // moc krátké – celý záznam
      fs = fs.slice(from);
      var end = fs[fs.length - 1];
      replay = { frames: fs, clock: 0, last: 0, done: done, flashed: false, len: end.t - fs[0].t, intro: 900, won: won };
      root.querySelector('.kp-rp-title').textContent = won ? (T.replayYou || '') : (T.replayKevin || '');
      root.querySelector('.kp-rp-goal').textContent = T.replayGoal || '';
      root.classList.add('kp-replay');
      tone(300, 0.6, 'sine', 0.15, 120);                 // „přetočení“
      flight = null;
    }
    function replayTick(now) {
      var r = replay, dtr = r.last ? Math.min(250, now - r.last) : 0;   // i na pomalém počítači trvá stejně dlouho
      r.last = now;
      if (r.intro > 0) { r.intro -= dtr; dtr = 0; }       // nejdřív chvíli jen nápis, kdo gól dal (obraz stojí na začátku)
      var left = r.len - r.clock;
      r.clock += dtr * (left < 700 ? 0.18 : 0.45);         // poslední chvíle před gólem ještě pomaleji
      var t0 = r.frames[0].t + r.clock, i = 1;
      while (i < r.frames.length - 1 && r.frames[i].t < t0) i++;
      var a = r.frames[i - 1], b = r.frames[i], k = b.t > a.t ? clamp((t0 - a.t) / (b.t - a.t), 0, 1) : 1;
      ball.x = a.bx + (b.bx - a.bx) * k; ball.y = a.by + (b.by - a.by) * k; ball.fire = b.f;
      player.x = a.px + (b.px - a.px) * k; kevin.x = a.kx + (b.kx - a.kx) * k;
      ball.trail.push([ball.x, ball.y]); if (ball.trail.length > 16) ball.trail.shift();
      r.pos = i;
      if (r.clock >= r.len && !r.flashed) {               // gól: záblesk a hluboký zvuk
        r.flashed = true;
        root.classList.add('kp-replay-hit');
        tone(110, 0.7, 'triangle', 0.3, 70);
        setTimeout(stopReplay, 1100);
      }
    }
    // přes hřiště během záznamu: zlatá čára dráhy míčku od posledního odpalu a kroužek kolem míčku (štítky u pálek uživatel nechtěl)
    function drawReplayMarks(now) {
      var r = replay, f = r.frames;
      cx.save();
      cx.strokeStyle = 'rgba(255, 215, 90, .85)'; cx.lineWidth = 4; cx.setLineDash([10, 8]); cx.lineCap = 'round';
      cx.beginPath(); cx.moveTo(f[0].bx, f[0].by);
      for (var i = 1; i < (r.pos || 1); i++) cx.lineTo(f[i].bx, f[i].by);
      cx.lineTo(ball.x, ball.y); cx.stroke(); cx.setLineDash([]);
      var pulse = 1 + 0.18 * Math.sin(now / 120);
      cx.strokeStyle = '#ffe27a'; cx.lineWidth = 4; cx.shadowColor = 'rgba(255, 200, 60, .9)'; cx.shadowBlur = 14;
      cx.beginPath(); cx.arc(ball.x, ball.y, (BALL_R + 12) * pulse, 0, 7); cx.stroke();
      cx.shadowBlur = 0;
      cx.restore();
    }
    function stopReplay() {
      if (!replay) return;
      var done = replay.done;
      replay = null; rec = [];
      root.classList.remove('kp-replay', 'kp-replay-hit');
      done();
    }
    function finish(playerWon) {
      releaseMouse();
      root.classList.remove('final');
      running = false;
      var ms = Math.round(performance.now() - started - pausedMs);
      pongHit({ e: 'end', won: playerWon ? 1 : 0, you: you, kev: kev, ms: ms });
      if (K) { K.hold(null); if (playerWon) { K.once(K.has('defeat') ? 'defeat' : 'shrug'); K.expression(23, 3000); } else { K.hold(K.has('dance2') ? 'dance2' : 'cheer'); K.expression(2, 3000); } }
      var endKey = playerWon ? (level === 3 && !store.get('kevinPongBeat3') ? 'vyhra_hrac_3' : kev === WIN - 1 ? 'vyhra_hrac_tesne' : 'vyhra_hrac')
        : (you === 0 ? 'vyhra_kevin_10_0' : 'vyhra_kevin');
      if (playerWon && level === 3) store.set('kevinPongBeat3', '1');
      quip(endKey, 1, playerWon ? T.won : T.lost, 4200, true);
      var bestKey = timeKey(level, WIN), best = +(store.get(bestKey) || 0);
      if (playerWon && (!best || ms < best)) store.set(bestKey, String(ms));
      var fresh = earnBadges(playerWon, ms);
      var screwBest = +(store.get('kevinPongScrewBest') || 0), screwRec = mt.screws > screwBest;
      if (screwRec) store.set('kevinPongScrewBest', String(mt.screws));
      lastScrews = { n: mt.screws, best: Math.max(screwBest, mt.screws), rec: screwRec && screwBest > 0 };
      var newBest = playerWon && best && ms < best;               // nepřihlášený: rekord v prohlížeči
      var send = playerWon && signedIn ? post('/api/pong/win', { d: level, ms: ms, kevin: kev }) : Promise.resolve(null);
      if (stick.streak >= 2) { mt.streakPts += 10 * stick.streak; stick.streak = 0; }   // rozběhnutá série se taky počítá
      streakEnd(false);
      lastScore = scoreOf(ms, playerWon);
      var scoreKey = ptsKey(WIN, level), scoreBest = +(store.get(scoreKey) || 0);   // (nový klíč: dřív jiné bodování a i prohry)
      lastScore.rec = playerWon && lastScore.total > scoreBest && lastScore.total > 0;   // prohra je prohra – ani rekord, ani tabulka
      lastScore.loss = !playerWon;
      if (lastScore.rec) store.set(scoreKey, String(lastScore.total));
      if (signedIn && playerWon) post('/api/pong/score', { d: level, len: WIN, you: you, kevin: kev, ms: ms, perfect: mt.perfect, supers: mt.supers,
        stickGoals: mt.stickGoals, streakPts: mt.streakPts, rally: mt.maxRally, screws: mt.screws }).catch(function () { /* skóre se neuložilo */ });
      // nejdřív zpomalený záznam vítězného gólu, pak konec zápasu (výsledek ze serveru mezitím dorazí)
      var replayDone = false, result;
      (fresh || []).forEach(function (k) { if (CELEBS[k]) store.set('kevinPongCelebLast', k); });   // automaticky = za poslední získaný
      function showEnd() { if (replayDone && result !== undefined) { endScreen(playerWon, ms, result, fresh); if (playerWon) celebrate(); } }
      startReplay(function () { replayDone = true; showEnd(); }, playerWon);
      send.then(function (res) {
        if (newBest || (res && res.ok && res.best === ms)) setTimeout(function () { quip('rekord', 1, null, 3600, true); }, 4400);
        result = res && res.ok ? res : null; showEnd();
      }).catch(function () { result = null; showEnd(); });
    }
    // odznaky po zápase: co se stalo v zápase + počítadla v prohlížeči; vrací nové (ukáže je konec zápasu)
    // odznaky jen na Normální a nejtěžší (na Lehké se nesbírají ani výhry, šroubky a dny); h* = jen za nejtěžší
    function earnBadges(won, ms) {
      var e = [];
      if (level < 2) return e;
      if (won) {
        var wins = +(store.get('kevinPongWins') || 0) + 1;
        store.set('kevinPongWins', String(wins));
        e.push('first', level === 2 ? 'normal' : 'angry');
        if (wins >= 3) e.push('easy');
        if (level === 3) {
          var hard = +(store.get('kevinPongHardWins') || 0) + 1;
          store.set('kevinPongHardWins', String(hard));
          if (hard >= 5) e.push('hwins5');
          if (ms < 120000) e.push('hfast');
          if (kev <= 3) e.push('hclean');
          if (maxDown >= 5) e.push('hcomeback');
        }
        if (kev === 0) e.push('clean');
        if (kev === 9 && WIN === 10) e.push('close');
        if (ms < 75000) e.push('fast');
        if (wins >= 10) e.push('streak');
        if (wins >= 50) e.push('wins50');
        if (wins >= 100) e.push('wins100');
        if (mt.yarn) e.push('yarn');
        if (maxDown >= 5) e.push('comeback');
        if (new Date().getHours() < 4) e.push('night');
      }
      if (mt.perfect >= 3) e.push('sniper');
      if (mt.perfect >= 5 && level === 3) e.push('hsniper');
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

    var lastScrews = null;
    // počítadla v prohlížeči → odznak, který za ně přijde (jen Normální a nejtěžší, viz earnBadges)
    var PROGRESS = [['kevinPongWins', 'wins', [['streak', 10], ['wins50', 50], ['wins100', 100]]],
      ['kevinPongHardWins', 'hardWins', [['hwins5', 5]]], ['kevinPongScrews', 'screws', [['tinker', 10]]], ['kevinPongDays', 'days', [['loyal', 7]]]];
    function nextBadge() {
      var best = null;
      PROGRESS.forEach(function (p) {
        var have = +(store.get(p[0]) || 0);
        var goal = p[2].filter(function (g) { return !badges[g[0]]; })[0];
        if (!goal || have >= goal[1]) return;
        var part = have / goal[1];
        if (!best || part > best.part) best = { key: goal[0], unit: p[1], have: have, need: goal[1], part: part };
      });
      return best;
    }
    function progressHtml() {
      var n = nextBadge();
      if (!n || !T.progress) return '';
      return '<p class="kp-next"><span>' + esc(T.progress.replace('{badge}', (T.badgeNames || {})[n.key] || n.key)) + ' · ' + esc((T.progressUnits || {})[n.unit] || '') + '</span>' +
        '<b>' + n.have + ' / ' + n.need + '</b><i aria-hidden="true" style="--p:' + Math.round(n.part * 100) + '%"></i>' +
        ((T.rewards || {})[n.key] ? '<small><i class="fa-solid fa-gift" aria-hidden="true"></i> ' + esc(T.rewardLabel || '') + ': ' + esc(T.rewards[n.key]) + '</small>' : '') + '</p>';
    }

    // ---------- obrazovky (start, konec) a tabulka ----------
    // Kevinova hlava v přepínači obtížnosti: Lehká = s dudlíkem, Normální = v pohodě, Naštvaný = vzteklý
    // (kevin/pong/menu/kevin-1..3.webp, tools/catsmash-kevin-hlavy.py – stejné kolečko a šedé pozadí, kroužek kreslí CSS)
    function kevinHead(d) { return '/kevin/pong/menu/kevin-' + d + '.webp' + ver; }
    // pozvánka k účtu pro nepřihlášené (výsledky v tabulce, odemykání, odznaky, ozdoby profilu); po přihlášení zpět ke hře
    function guestCard() {
      return guest() && T.guest ? '<div class="kp-guest"><p>' + esc(T.guest) + '</p><p class="kp-guest-btns">' +
        '<a class="btn btn-primary" href="/register.jsp"><i class="fa-solid fa-user-plus" aria-hidden="true"></i> ' + esc(T.guestRegister || '') + '</a>' +
        '<a class="btn btn-ghost" href="/login.jsp?next=' + encodeURIComponent('/?kevin=pong') + '"><i class="fa-solid fa-right-to-bracket" aria-hidden="true"></i> ' + esc(T.guestLogin || '') + '</a></p></div>' : '';
    }
    // světelná tabule v menu: top 3 nejrychlejší výhry na zvolené obtížnosti a délce zápasu, běží zprava doleva
    var champSeq = 0;
    function champs() {
      var el = panel.querySelector('.kp-led span'), seq = ++champSeq;
      if (!el) return;
      function get(q) { return fetch('/api/pong/top?kind=time&d=' + level + '&len=' + matchLen + q, { credentials: 'same-origin' }).then(function (r) { return r.json(); }); }
      var label = T.champMonth || T.champ;
      get('&season=month').then(function (j) {
        if ((j.top || []).length) return j;
        label = T.champ; return get('');
      }).then(function (j) {
        if (seq !== champSeq) return;
        var top = (j.top || []).slice(0, 3);
        el.textContent = top.length
          ? '👑 ' + (label || 'ŠAMPION') + ': ' + top.map(function (r, i) { return (i ? (i + 1) + '. ' : '') + r.name + ' ' + time(r.ms); }).join(' · ') + ' · ' + (T.champCall || '')
          : (T.champEmpty || '');
      }).catch(function () { el.textContent = T.champEmpty || ''; });
    }
    // hlavička podstránky menu: mosazný medailon z dlaždice + zlatý nadpis (+ např. počet odznaků)
    function viewHead(icon, title, extra) {
      return '<div class="kp-vhead">' + (icon ? '<img src="/kevin/pong/menu/ikona-' + icon + '.webp' + ver + '" alt="" width="160" height="162">' : '') +
        '<h2>' + esc(title || '') + (extra || '') + '</h2></div>';
    }
    function startScreen() {
      panel.hidden = false;
      // bloky: nadpis · obtížnost · Hrát · ovládání (3 dlaždice + rada k odstřelu) · tabulka
      var icons = ['fa-arrows-left-right', 'fa-bolt', 'fa-pause', 'fa-magnet'];
      var controls = T.controls ? '<ul class="kp-controls">' + T.controls.map(function (c, i) {
          return '<li><i class="fa-solid ' + icons[i] + '" aria-hidden="true"></i><b>' + esc(c[0]) + '</b><span>' + esc(c[1]) + '</span></li>';
        }).join('') + '</ul><p class="kp-hint">' + esc(T.shotHint) + '</p>' : '<p class="kpong-help">' + esc(T.help) + '</p>';
      var short = T.levelsShort || T.levels;
      // rady a tipy: v menu jeden náhodný (ťuknutí = další), v „Jak se hraje?“ všechny; jen ty pro toto zařízení
      var tips = (T.tips || []).filter(function (x) { return x[1] === 'all' || x[1] === (coarse ? 'touch' : 'pc'); }).map(function (x) { return x[0]; });
      var tipList = tips.length ? '<h3 class="kp-label kp-tips-title">' + esc(T.tipsTitle || '') + '</h3><ul class="kp-tips">' +
        tips.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '';
      panel.dataset.view = 'main';
      panel.innerHTML = '<div class="kp-view kp-main"><h2 class="kpong-title kp-logo"><img src="/kevin/pong/menu/logo.webp' + ver + '" alt="' + esc(T.title) + '" width="900" height="277"></h2>' +
        '<div class="kp-seg" role="radiogroup" aria-label="' + esc(T.level) + '" style="--i:' + (level - 1) + '"><span class="kp-thumb" aria-hidden="true"></span>' +
        [1, 2, 3].map(function (d) {
          // Kevinova hlava podle obtížnosti (ospalý / v pohodě / naštvaný; zatím jeden obrázek přibarvený – kevinHead)
          return '<button type="button" role="radio" class="kpong-level" data-d="' + d + '" aria-checked="' + (d === level) + '" title="' + esc(T.levels[d - 1]) + '">' +
            '<img class="kp-kevhead" src="' + kevinHead(d) + '" alt="" width="64" height="64">' + esc(short[d - 1]) + '</button>';
        }).join('') + '</div>' +
        '<p class="kp-desc">' + esc(T.levelHints[level - 1]) + '</p>' +
        '<div class="kp-seg kp-lenseg" role="radiogroup" aria-label="' + esc(T.lenTitle || '') + '" style="--i:' + LENGTHS.indexOf(matchLen) + '"><span class="kp-thumb" aria-hidden="true"></span>' +
        LENGTHS.map(function (n) { return '<button type="button" role="radio" class="kpong-len" data-len="' + n + '" aria-checked="' + (n === matchLen) + '">' + esc((T.lenGoals || '{n}').replace('{n}', n)) + '</button>'; }).join('') + '</div>' +
        '<button type="button" class="kpong-play btn-primary"><i class="fa-solid fa-play" aria-hidden="true"></i> ' + esc(T.play) + '</button>' +
        // tři dlaždice s mosaznými medailony (kevin/pong/menu/, tools/catsmash-menu.py): jak se hraje · odznaky · tabulka
        '<div class="kp-tiles">' + [['how', 'jak', T.how || T.controlsTitle || ''], ['badges', 'odznaky', T.badgesTitle || ''], ['top', 'tabulka', T.board]].map(function (x) {
          return '<button type="button" class="kp-tile" data-go="' + x[0] + '"><img src="/kevin/pong/menu/ikona-' + x[1] + '.webp' + ver + '" alt="" width="160" height="162">' +
            '<b>' + esc(x[2]) + '</b><small>' + esc((T.tileSub || {})[x[0]] || '') + '</small></button>';
        }).join('') + '</div>' +
        // světelná tabule šampionů (nejrychlejší výhry na zvolené obtížnosti a délce, champs()) – motivace dostat se nahoru
        '<div class="kp-led" aria-hidden="true"><span></span></div>' + '</div>' +
        // menu se vejde na jednu obrazovku: popis hry, tipy a pozvánka k účtu jsou v „Jak se hraje?“, postup k odznaku v Odznacích
        '<div class="kp-view kp-how">' + viewHead('jak', T.how || T.controlsTitle) + '<p class="kpong-lead kp-rules">' + esc(T.lead.replace(/10/, matchLen)) + '</p>' + guestCard() +
        '<button type="button" class="kp-fullbtn kp-tut-again"><i class="fa-solid fa-graduation-cap" aria-hidden="true"></i> ' + esc(T.tutAgain || '') + '</button>' +
        '<h3 class="kp-label">' + esc(T.controlsTitle || '') + '</h3>' + controls + tipList + (T.credit ? '<p class="kp-credit">' + esc(T.credit) + '</p>' : '') + backBtn() + '</div>' +
        '<div class="kp-view kp-badges">' + badgeOverview(progressHtml()) + backBtn() + '</div>' +
        topView();
      panel.querySelectorAll('.kpong-level').forEach(function (b) {
        b.addEventListener('click', function () {
          level = +b.dataset.d; L = LEVELS[level]; store.set('kevinPongLevel', String(level));
          panel.querySelectorAll('.kpong-level').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
          panel.querySelector('.kp-seg').style.setProperty('--i', level - 1);
          panel.querySelector('.kp-desc').textContent = T.levelHints[level - 1];
          // tabulka a rekord v menu se přepnou na zvolenou obtížnost
          boardD = level; champs();
          panel.querySelectorAll('[data-bd]').forEach(function (x) { x.setAttribute('aria-pressed', String(+x.dataset.bd === level)); });
          board(boardLen());
          if (K) {                                        // Lehká = zívne, Normální = zajásá, Naštvaný = dupne a zamračí se
            if (level === 1) K.once(K.has('yawn') ? 'yawn' : 'shrug');
            else if (level === 2) { K.once(K.has('fistPump') ? 'fistPump' : 'cheer'); K.expression(2, 1400); }
            else { K.once(K.has('stomp') ? 'stomp' : 'no'); K.expression(23, 1800); }
          }
        });
      });
      // délka zápasu: tabulka a rekord se přepnou na tu délku
      panel.querySelectorAll('.kpong-len').forEach(function (b) {
        b.addEventListener('click', function () {
          matchLen = +b.dataset.len; store.set('kevinPongLen', String(matchLen)); champs();
          panel.querySelectorAll('.kpong-len').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
          panel.querySelector('.kp-lenseg').style.setProperty('--i', LENGTHS.indexOf(matchLen));
          var rules = panel.querySelector('.kp-rules'); if (rules) rules.textContent = T.lead.replace(/10/, matchLen);
          panel.querySelectorAll('[data-board]').forEach(function (x) { x.setAttribute('aria-pressed', String(+x.dataset.board === matchLen)); });
          board(matchLen);
        });
      });
      panel.querySelector('.kpong-play').addEventListener('click', begin);
      board(matchLen);
      var ta = panel.querySelector('.kp-tut-again');
      if (ta) ta.addEventListener('click', function () { tutAgain = true; begin(); });
      champs();
      drawGiftThumbs(panel);
      say(pick(guest() && T.guestSay ? T.guestSay : T.hello), guest() ? 5000 : 3000);   // nepřihlášenému Kevin nabídne účet
    }

    var RARITY = D.RARITY;
    function rar(k) { return k && RARITY[k] ? ' data-rar="' + RARITY[k] + '"' : ''; }
    var FRAMES = D.FRAMES;
    var BADGE_GROUPS = D.BADGE_GROUPS;
    // obrázky odměny za odznak: pálka a míček (náhled kreslí drawGiftThumbs), pozadí, rámeček fotky; text odměny v title
    function giftPics(k, rw) {
      var h = '';
      SKINS.forEach(function (x, i) { if (x.b === k && x.img) h += '<canvas class="kp-gift-pad" data-gift-pad="' + i + '" width="132" height="66"></canvas>'; });
      BALLS.forEach(function (x, i) { if (x.b === k) h += '<canvas class="kp-gift-ball" data-gift-ball="' + i + '" width="88" height="88"></canvas>'; });
      Object.keys(BG_BADGE).forEach(function (bg) { if (BG_BADGE[bg] === k) h += '<span class="kp-gift-bg" style="background-image:url(/kevin/pong/pozadi-' + bg + '-mini.webp' + ver + ')"></span>'; });
      if (FRAMES.indexOf(k) >= 0) h += '<span class="kp-gift-frame av-frame f-' + k + '"><img src="/img/avatar-default.svg" alt="" width="22" height="22"></span>';
      return '<span class="kp-gifts" role="img" title="' + esc(rw) + '" aria-label="' + esc((T.rewardLabel || '') + ': ' + rw) + '">' + h + '</span>';
    }
    function drawGiftThumbs(scope) {
      if (!scope) return;
      scope.querySelectorAll('canvas[data-gift-pad]').forEach(function (c) {
        var i = +c.dataset.giftPad, sp = padSprite(i), keep = cx;
        if (!sp) return;
        cx = c.getContext('2d'); cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, c.width, c.height);
        var kk = c.width / (PAD_W * 1.08); cx.scale(kk, kk);
        drawSpritePad(sp, PAD_W * 0.54, (c.height / kk - (sp.h * PAD_W / sp.w)) / 2, PAD_W, null, true, i);
        cx = keep;
      });
      scope.querySelectorAll('canvas[data-gift-ball]').forEach(function (c) {
        var i = +c.dataset.giftBall, keep = cx;
        if (!MIC || !MIC[BALLS[i].id]) return;
        cx = c.getContext('2d'); cx.setTransform(88 / (BALL_R * 2.6), 0, 0, 88 / (BALL_R * 2.6), 0, 0); cx.clearRect(0, 0, BALL_R * 2.6, BALL_R * 2.6);
        drawBall(BALLS[i].id, BALL_R * 1.3, BALL_R * 1.3, 0.4, 0);
        cx = keep;
      });
    }
    onSprites.push(function () { drawGiftThumbs(panel); });
    panel.addEventListener('click', function (e) {
      var g = e.target.closest('canvas[data-gift-pad], canvas[data-gift-ball]');
      if (!g) return;
      e.stopPropagation();
      if (g.dataset.giftPad != null) openItem('pad', +g.dataset.giftPad); else openItem('ball', +g.dataset.giftBall);
    });

    // ---------- karta položky (pálka, míček, pozadí) ----------
    // Jen samotný předmět ve velkém (bez karty), naklání se za prstem / myší jako dlaždice na webu, pod ním stín.
    // Odemčené: Použít (Používáš, když už je vybraná). Zamčené: 🔒, za jaký odznak, jak ho získat a kolik chybí.
    var item = null;
    function badgeProgress(k) {
      var out = null;
      PROGRESS.forEach(function (p) { p[2].forEach(function (g) { if (g[0] === k) out = { have: Math.min(+(store.get(p[0]) || 0), g[1]), need: g[1], unit: p[1] }; }); });
      return out;
    }
    function itemInfo(kind, i) {
      if (kind === 'pad') return { name: (T.skins || [])[i] || '', b: SKINS[i].b, on: i === skin, mach: SKINS[i].img };
      if (kind === 'ball') return { name: (T.balls || [])[i] || '', b: BALLS[i].b, on: i === ballType };
      return { name: (T.bgs || BGS)[i] || '', b: BG_BADGE[BGS[i]], on: BGS[i] === bgName };
    }
    // velké míčky (256 px) pro náhled – načtou se až při prvním otevření (tools/catsmash-micky-velke.py)
    var micBig = null, micBigImg = null;
    function loadMicBig(done) {
      if (micBig) return done();
      fetch('/kevin/pong/micky-velke.json' + ver).then(function (r) { return r.json(); }).then(function (j) {
        var im = new Image(); im.onload = function () { micBig = j; micBigImg = im; done(); }; im.src = '/kevin/pong/micky-velke.webp' + ver;
      }).catch(function () {});
    }
    function itemCount(kind) { return kind === 'pad' ? SKINS.length : kind === 'ball' ? BALLS.length : BGS.length; }
    // listování v náhledu: dokola (po poslední zase první)
    function stepItem(d) {
      if (!item) return;
      var ord = itemOrder(item.kind), n = ord.length;
      openItem(item.kind, ord[(ord.indexOf(item.i) + d + n) % n]);
    }
    function openItem(kind, i) {
      closeItem();
      var inf = itemInfo(kind, i), ok = kind === 'pad' ? SKINS[i].ok() : kind === 'ball' ? owns('ball', BALLS[i].id, inf.b) : owns('bg', BGS[i], inf.b), pr = !ok && badgeProgress(inf.b);
      var art = kind === 'bg'
        ? (BGS[i] === 'tma' ? '<div class="kp-item-bg tma"></div>' : '<img class="kp-item-bg" src="/kevin/pong/pozadi-' + BGS[i] + '.webp' + ver + '" alt="">')
        : '<canvas class="kp-item-cv ' + kind + '"></canvas>';
      item = { kind: kind, i: i, raf: 0, el: document.createElement('div') };
      item.el.className = 'kp-item ' + kind + (ok ? '' : ' locked');
      item.el.setAttribute('role', 'dialog'); item.el.setAttribute('aria-label', inf.name);
      item.el.innerHTML = '<button type="button" class="kp-item-x" aria-label="' + esc(T.close || '') + '"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
        // šipky ‹ › = předchozí / další ve stejné skupině (pálky, míčky, pozadí); jde i přejet prstem a šipkami
        '<button type="button" class="kp-item-nav prev" aria-label="' + esc(T.itemPrev || '') + '"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>' +
        '<button type="button" class="kp-item-nav next" aria-label="' + esc(T.itemNext || '') + '"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>' +
        '<div class="kp-item-obj">' + art + (ok ? '' : '<i class="fa-solid fa-lock kp-item-lockicon" aria-hidden="true"></i>') + '</div>' +
        '<div class="kp-item-info"><p class="kp-item-count">' + (itemOrder(kind).indexOf(i) + 1) + ' / ' + itemCount(kind) + '</p><h3>' + esc(inf.name) + '</h3>' +
        (inf.mach ? '<p class="kp-item-mach"><img src="/kevin/pong/stroje/' + inf.mach + '.webp' + ver + '" alt="" onerror="this.parentNode.remove()"> ' + esc(T.itemMachine || '') + '</p>' : '') +
        (ok
          ? '<button type="button" class="kpong-play btn-primary kp-item-use"' + (inf.on ? ' disabled' : '') + '><i class="fa-solid fa-' + (inf.on ? 'check' : 'hand-pointer') + '" aria-hidden="true"></i> ' + esc(inf.on ? T.itemUsing || '' : T.itemUse || '') + '</button>'
          : '<p class="kp-item-lock"><i class="fa-solid fa-lock" aria-hidden="true"></i> ' + esc(lockText(inf.b)) + '</p>' +
            '<p class="kp-item-how">' + esc(((T.badgeHow || {})[inf.b]) || '') + '</p>' +
            (pr ? '<p class="kp-item-prog"><span>' + esc((T.progressUnits || {})[pr.unit] || '') + '</span><b>' + pr.have + ' / ' + pr.need + '</b><i style="--p:' + Math.round(pr.have / pr.need * 100) + '%"></i></p>' : '')) +
        '</div>';
      root.appendChild(item.el);
      var box = item.el, obj = box.querySelector('.kp-item-obj');   // (handlery nesmí sahat na item – po zavření je null)
      box.querySelector('.kp-item-x').addEventListener('click', closeItem);
      box.addEventListener('click', function (e) { if (e.target === box) closeItem(); });
      var use = box.querySelector('.kp-item-use');
      if (use) use.addEventListener('click', function () { useItem(kind, i); closeItem(); });
      // předmět se naklání za prstem / myší (±18°), po opuštění se srovná
      box.addEventListener('pointermove', function (e) {
        var r = obj.getBoundingClientRect(), px = clamp((e.clientX - r.left) / r.width, -0.5, 1.5), py = clamp((e.clientY - r.top) / r.height, -0.5, 1.5);
        obj.style.setProperty('--ry', clamp((px - 0.5) * 36, -18, 18).toFixed(1) + 'deg');
        obj.style.setProperty('--rx', clamp((0.5 - py) * 28, -14, 14).toFixed(1) + 'deg');
      });
      box.addEventListener('pointerleave', function () { obj.style.setProperty('--rx', '0deg'); obj.style.setProperty('--ry', '0deg'); });
      box.querySelector('.kp-item-nav.prev').addEventListener('click', function () { stepItem(-1); });
      box.querySelector('.kp-item-nav.next').addEventListener('click', function () { stepItem(1); });
      // přejetí prstem doleva / doprava = další / předchozí
      var sx = null;
      box.addEventListener('pointerdown', function (e) { sx = e.target.closest('button') ? null : e.clientX; });
      box.addEventListener('pointerup', function (e) { if (sx != null && Math.abs(e.clientX - sx) > 50) stepItem(e.clientX < sx ? 1 : -1); sx = null; });
      // obraz v rozlišení displeje (ostrý): pálka se jemně houpe, míček se točí
      var cv = box.querySelector('.kp-item-cv');
      if (cv) {
        var dpr = Math.min(3, window.devicePixelRatio || 1), cw = cv.clientWidth || 280, ch = cv.clientHeight || 140;
        cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
        if (kind === 'ball') loadMicBig(function () {});
        var t0 = performance.now();
        (function tick(now) {
          if (!item || item.el !== box) return;
          paintObj(cv, kind, i, (now - t0) / 1000);
          item.raf = requestAnimationFrame(tick);
        })(t0);
      }
      (use || box.querySelector('.kp-item-x')).focus({ preventScroll: true });
    }
    function closeItem() {
      if (!item) return;
      cancelAnimationFrame(item.raf); item.el.remove(); item = null;
    }
    // Použít: totéž, co dřív dělalo ťuknutí v Nastavení (a když je Nastavení otevřené, přepne v něm výběr)
    function useItem(kind, i) {
      if (kind === 'pad') { skin = i; store.set('kevinPongPad', SKINS[i].id); setSkin(); }
      else if (kind === 'ball') { ballType = i; store.set('kevinPongBallId', BALLS[i].id); }
      else { setBg(BGS[i]); store.set('kevinPongBg', BGS[i]); }
      if (!setCard) return;
      refreshSlot(kind);
      if (kind !== 'bg') drawPreview();
    }
    function badgeOverview(progress) {
      var all = Object.keys(BADGE_ICON), got = all.filter(function (k) { return badges[k]; }).length;
      var html = viewHead('odznaky', T.badgesTitle, ' <small class="kp-count">' + got + '/' + all.length + '</small>') + (progress || '') +
        '<div class="kp-bdg-bar" style="--p:' + Math.round(got / all.length * 100) + '%"><span></span></div>' +
        '<p class="kp-bdg-rule">' + esc(T.badgesRule || '') + '</p><div class="kp-bdg-list">';
      BADGE_GROUPS.forEach(function (grp, gi) {
        html += '<p class="kp-bdg-group' + (gi === 2 ? ' hard' : '') + '">' + esc((T.badgeGroups || [])[gi] || '') + '</p>';
        grp.forEach(function (k) {
          var on = !!badges[k], tier = { streak: ' bronze', wins50: ' silver', wins100: ' gold' }[k] || '';
          var gifts = (SKINS.some(function (x) { return x.b === k; }) ? '<i class="fa-solid fa-table-tennis-paddle-ball"></i>' : '') +
            (BALLS.some(function (x) { return x.b === k; }) ? '<i class="fa-solid fa-circle"></i>' : '') +
            (Object.keys(BG_BADGE).some(function (b) { return BG_BADGE[b] === k; }) ? '<i class="fa-regular fa-image"></i>' : '') +
            (FRAMES.indexOf(k) >= 0 ? '<i class="fa-regular fa-circle-user"></i>' : '');
          var rw = (T.rewards || {})[k];
          html += '<details class="kp-bdg' + (on ? ' on' : '') + (gi === 2 ? ' hard' : '') + '"' + rar(k) + '><summary>' +
            '<span class="kp-bdg-icon' + tier + '"><i class="fa-solid ' + (on ? BADGE_ICON[k] : 'fa-lock') + '" aria-hidden="true"></i></span>' +
            '<span class="kp-bdg-name"><b>' + esc((T.badgeNames || {})[k] || k) + '</b>' + (rw ? giftPics(k, rw) : '') + '</span>' +
            '<span class="kp-bdg-gifts" aria-hidden="true">' + gifts + '</span></summary>' +
            '<p>' + esc((T.badgeHow || {})[k] || '') + '</p>' +
            (rw ? '' : '<p class="kp-bdg-reward"><i class="fa-solid fa-gift" aria-hidden="true"></i> ' + esc(T.badgeNoReward || '') + '</p>') + '</details>';
        });
      });
      return html + '</div>';
    }
    // pohled Tabulka: Skóre / Čas, délka zápasu, obtížnost + tabulka (board) + zpět
    function topView() {
      var short = T.levelsShort || T.levels;
      if (!boardD) boardD = level;
      return '<div class="kp-view kp-top">' + viewHead('tabulka', T.board) +
        '<div class="kp-seg kp-kindseg" role="radiogroup" aria-label="' + esc(T.board || '') + '" style="--i:' + (boardKind === 'time' ? 1 : 0) + '"><span class="kp-thumb" aria-hidden="true"></span>' +
        [['score', 'fa-star', T.tabScore], ['time', 'fa-stopwatch', T.tabTime]].map(function (x) {
          return '<button type="button" role="radio" data-bkind="' + x[0] + '" aria-checked="' + (x[0] === boardKind) + '"><i class="fa-solid ' + x[1] + '" aria-hidden="true"></i> ' + esc(x[2] || x[0]) + '</button>';
        }).join('') + '</div>' +
        '<div class="kp-seg kp-kindseg kp-seasonseg" role="radiogroup" aria-label="' + esc(T.seasonTitle || '') + '" style="--i:' + (boardSeason === 'month' ? 1 : 0) + '"><span class="kp-thumb" aria-hidden="true"></span>' +
        [['all', 'fa-infinity', T.seasonAll], ['month', 'fa-calendar', monthName()]].map(function (x) {
          return '<button type="button" role="radio" data-bseason="' + x[0] + '" aria-checked="' + (x[0] === boardSeason) + '"><i class="fa-solid ' + x[1] + '" aria-hidden="true"></i> ' + esc(x[2] || x[0]) + '</button>';
        }).join('') + '</div>' +
        '<div class="kp-boardtabs" role="group" aria-label="' + esc(T.lenTitle || '') + '">' + LENGTHS.map(function (n) {
          return '<button type="button" data-board="' + n + '" aria-pressed="' + (n === matchLen) + '">' + esc((T.lenGoals || '{n}').replace('{n}', n)) + '</button>';
        }).join('') + '</div>' +
        '<div class="kp-boardtabs kp-boardlv" role="group" aria-label="' + esc(T.level || '') + '"' + '>' + [1, 2, 3].map(function (d) {
          return '<button type="button" data-bd="' + d + '" aria-pressed="' + (d === boardD) + '" title="' + esc(T.levels[d - 1]) + '" aria-label="' + esc(T.levels[d - 1]) + '">' + '★★★'.slice(0, d) + '</button>';   // jen hvězdičky, jméno je v nadpisu
        }).join('') + '</div>' +
        '<section class="kpong-board"></section>' + backBtn() + '</div>';
    }
    function backBtn() { return '<button type="button" class="kp-link kp-backto" data-go="main"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> ' + esc(T.back || '') + '</button>'; }
    // odkazy v menu přepínají pohled: hlavní · jak se hraje · tabulka
    panel.addEventListener('click', function (e) {
      var bt = e.target.closest('[data-board]'), bk = e.target.closest('[data-bkind]'), bd = e.target.closest('[data-bd]'), bs = e.target.closest('[data-bseason]');
      if (bs) {
        boardSeason = bs.dataset.bseason; store.set('kevinPongSeason', boardSeason);
        panel.querySelectorAll('[data-bseason]').forEach(function (x) { x.setAttribute('aria-checked', String(x === bs)); });
        panel.querySelector('.kp-seasonseg').style.setProperty('--i', boardSeason === 'month' ? 1 : 0);
        board(boardLen());
      }
      if (bt) {
        panel.querySelectorAll('[data-board]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === bt)); });
        board(+bt.dataset.board);
      }
      if (bk) {
        boardKind = bk.dataset.bkind; store.set('kevinPongBoardKind', boardKind);
        panel.querySelectorAll('[data-bkind]').forEach(function (x) { x.setAttribute('aria-checked', String(x === bk)); });
        panel.querySelector('.kp-kindseg').style.setProperty('--i', boardKind === 'time' ? 1 : 0);
        board(boardLen());
      }
      if (bd) {
        boardD = +bd.dataset.bd;
        panel.querySelectorAll('[data-bd]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === bd)); });
        board(boardLen());
      }
    });
    panel.addEventListener('click', function (e) {
      var g = e.target.closest('[data-go]');
      if (!g) return;
      panel.dataset.view = g.dataset.go;
      panel.scrollTop = 0;
      var first = panel.querySelector('.kp-' + g.dataset.go + ' button');
      if (first) first.focus({ preventScroll: true });   // (bez skoku na konec pohledu – hráč má vidět začátek)
    });

    var boardSeq = 0;                                  // pozdní odpověď staršího dotazu nesmí přepsat novější tabulku
    // legendární znak u jména v tabulce (jen když si ho hráč zapnul)
    function markIcon(k) { return k && BADGE_ICON[k] ? ' <i class="fa-solid ' + BADGE_ICON[k] + ' kp-mark" title="' + esc((T.badgeNames || {})[k] || '') + '"></i>' : ''; }
    // Kevin řekne, kolik ti chybí na bednu (3. místo) – jednou za otevření hry, jen přihlášenému mimo top 3
    var podiumSaid = false;
    function podiumNeed(j, diff, fmt) {
      if (podiumSaid || !j.me || j.me.place <= 3 || !j.top || j.top.length < 3 || !T.podiumNeed || panel.dataset.view !== 'main') return;
      podiumSaid = true;
      var need = diff(j.top[2], j.me);
      if (need > 0) setTimeout(function () { say(T.podiumNeed.replace('{n}', fmt(need)), 4200); }, 3500);
    }
    function boardLen() { var b = panel.querySelector('[data-board][aria-pressed="true"]'); return b ? +b.dataset.board : matchLen; }
    function board(len) {
      if (boardKind === 'time') return timeBoard(len);
      var box = panel.querySelector('.kpong-board'), seq = ++boardSeq;
      if (!box) return;
      var d = boardD || level, short = T.levelsShort || T.levels;
      var head = '<h3 class="kp-label">' + esc(T.tabScore || T.board) + esc(seasonHead()) + ' · ' + esc((T.lenGoals || '{n}').replace('{n}', len)) + ' · ' + '★★★'.slice(0, d) + ' ' + esc(short[d - 1]) + '</h3>';
      box.innerHTML = head + '<p class="kpong-note">…</p>';
      fetch('/api/pong/top?len=' + len + '&d=' + d + seasonQ(), { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (j) {
        if (seq !== boardSeq) return;
        signedIn = !!j.signedIn; csrf = j.csrf || null;
        var rows = (j.top || []).map(function (r) {
          return '<li class="' + (r.me ? 'me' : '') + medal(r.place) + '"><span class="kpong-place">' + r.place + '.</span>' +
            (r.frame ? '<span class="av-frame f-' + esc(r.frame) + '">' : '') + '<img src="' + esc(r.avatar || '/img/avatar-default.svg') + '" alt="" width="24" height="24" loading="lazy">' + (r.frame ? '</span>' : '') +
            '<span class="kpong-name">' + profName(r) + markIcon(r.mark) + ' <small class="kp-row-meta">' + r.you + ':' + r.kevin + '</small></span>' +
            '<span class="kpong-time">' + r.score + '</span></li>';
        }).join('');
        var mine = j.me ? '<p class="kpong-note">' + esc((T.yourScore || '').replace('{place}', j.me.place).replace('{score}', j.me.score)) + '</p>' : '';
        podiumNeed(j, function (a, b) { return a.score - b.score + 1; }, function (n) { return n + ' ' + (T.points || ''); });
        var local = +(store.get(ptsKey(len, d)) || 0);
        var guest = !signedIn ? '<p class="kpong-note">' + esc(T.loginToRank) + ' <a href="/login.jsp?next=' + encodeURIComponent(location.pathname + location.search) + '">' + esc(T.login) + '</a>' +
          (local ? ' · ' + esc((T.localScore || '').replace('{score}', local)) : '') + '</p>' : '';
        box.innerHTML = head + (rows ? '<ol class="kpong-list">' + rows + '</ol>' : '<p class="kpong-note">' + esc(T.emptyScore || T.empty) + '</p>') + mine + guest;
        var rec = panel.querySelector('.kp-rec'), best = j.me ? j.me.score : local;
        if (rec && len === matchLen && d === level) {
          rec.hidden = !best;
          if (best) rec.innerHTML = '<i class="fa-solid fa-trophy" aria-hidden="true"></i> ' + esc(T.best || '') + ' <b>' + best + '</b> ' + esc(T.points || '');
        }
      }).catch(function () { box.innerHTML = '<p class="kpong-note">' + esc(T.boardFail) + '</p>'; });
    }
    // tabulka Času: kdo porazil Kevina nejrychleji (na zvolené obtížnosti a délce zápasu) – 1. místo = nejkratší čas
    function timeBoard(len) {
      var box = panel.querySelector('.kpong-board'), seq = ++boardSeq;
      if (!box) return;
      var d = boardD || level, short = T.levelsShort || T.levels;
      var head = '<h3 class="kp-label">' + esc(T.tabTime || '') + esc(seasonHead()) + ' · ' + esc((T.lenGoals || '{n}').replace('{n}', len)) + ' · ' + '★★★'.slice(0, d) + ' ' + esc(short[d - 1]) + '</h3>';
      box.innerHTML = head + '<p class="kpong-note">…</p>';
      fetch('/api/pong/top?kind=time&d=' + d + '&len=' + len + seasonQ(), { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (j) {
        if (seq !== boardSeq) return;
        signedIn = !!j.signedIn; csrf = j.csrf || null;
        var rows = (j.top || []).map(function (r) {
          return '<li class="' + (r.me ? 'me' : '') + medal(r.place) + '"><span class="kpong-place">' + r.place + '.</span>' +
            (r.frame ? '<span class="av-frame f-' + esc(r.frame) + '">' : '') + '<img src="' + esc(r.avatar || '/img/avatar-default.svg') + '" alt="" width="24" height="24" loading="lazy">' + (r.frame ? '</span>' : '') +
            '<span class="kpong-name">' + profName(r) + markIcon(r.mark) + ' <small class="kp-row-meta">' + len + ':' + r.kevin + '</small></span>' +
            '<span class="kpong-time">' + time(r.ms) + '</span></li>';
        }).join('');
        var mine = j.me ? '<p class="kpong-note">' + esc((T.yourBest || '').replace('{place}', j.me.place).replace('{time}', time(j.me.ms))) + '</p>' : '';
        podiumNeed(j, function (a, b) { return b.ms - a.ms + 1; }, function (n) { return (n / 1000).toFixed(1).replace('.', ',') + ' s'; });
        var local = +(store.get(timeKey(d, len)) || 0);
        var guest = !signedIn ? '<p class="kpong-note">' + esc(T.loginToRank) + ' <a href="/login.jsp?next=' + encodeURIComponent(location.pathname + location.search) + '">' + esc(T.login) + '</a>' +
          (local ? ' · ' + esc((T.localBest || '').replace('{time}', time(local))) : '') + '</p>' : '';
        box.innerHTML = head + (rows ? '<ol class="kpong-list">' + rows + '</ol>' : '<p class="kpong-note">' + esc(T.empty) + '</p>') + mine + guest;
      }).catch(function () { box.innerHTML = '<p class="kpong-note">' + esc(T.boardFail) + '</p>'; });
    }

    function endScreen(won, ms, res, fresh) {
      panel.hidden = false;
      var line = won ? T.winTime.replace('{time}', time(ms)) : T.loseLine;
      // (místo v tabulce teď ukazuje tabulka skóre – časy už pořadí nerozhodují)
      panel.dataset.view = 'main';
      panel.innerHTML = '<div class="kp-view kp-main"><h2 class="kpong-title">' + esc(won ? T.winTitle : T.loseTitle) + '</h2>' +
        '<p class="kpong-final">' + you + ' : ' + kev + '</p><p class="kpong-lead">' + esc(line) + '</p>' + scoreHtml(lastScore) +
        (fresh && fresh.length ? '<div class="kp-newbadges"><p class="kp-label">' + esc(T.newBadge || '') + '</p><ul>' + fresh.slice(0, 3).map(function (k) {
          var rw = (T.rewards || {})[k];
          return '<li' + rar(k) + '><span class="kp-nb-icon' + ({ streak: ' bronze', wins50: ' silver' }[k] || '') + '"><i class="fa-solid ' + BADGE_ICON[k] + '" aria-hidden="true"></i></span>' +
            '<span><b>' + esc((T.badgeNames || {})[k] || k) + '</b>' + (rw ? '<small><i class="fa-solid fa-gift" aria-hidden="true"></i> ' + esc(T.rewardLabel || '') + ': ' + esc(rw) + '</small>' : '') + '</span></li>';
        }).join('') + '</ul>' + (fresh.length > 3 && T.moreBadges ? '<p class="kp-more">' + esc(T.moreBadges.replace('{n}', fresh.length - 3)) + '</p>' : '') +
          (signedIn ? '<a class="kp-link" href="/uzivatel.jsp#pong">' + esc(T.seeProfile || '') + '</a>' : '') + '</div>' : '') +
        (lastScrews && lastScrews.n && T.screwsLine ? '<p class="kp-rec"><i class="fa-solid fa-screwdriver-wrench" aria-hidden="true"></i> ' +
          esc((lastScrews.rec ? T.screwsRecord : T.screwsLine).replace('{n}', lastScrews.n).replace('{best}', lastScrews.best)) + '</p>' : '') +
        progressHtml() +
        '<button type="button" class="kpong-play btn-primary"><i class="fa-solid fa-rotate-right" aria-hidden="true"></i> ' + esc(T.again) + '</button>' +
        '<p class="kp-links"><button type="button" class="kp-link kpong-back">' + esc(T.changeLevel) + '</button><span aria-hidden="true">·</span>' +
        '<button type="button" class="kp-link" data-go="top">' + esc(T.board) + '</button></p>' +
        // Kevinova reklama: víc her od Skeliho → podpora
        (T.supportAd ? '<a class="kp-support" href="/donate.jsp"><img src="/kevin/pong/menu/kevin.webp' + ver + '" alt="" width="40" height="40">' +
          '<span><b>' + esc(T.supportAd) + '</b><small>' + esc(T.supportCta || '') + '</small></span><i class="fa-solid fa-heart" aria-hidden="true"></i></a>' : '') +
        '</div>' +
        topView();
      panel.querySelector('.kpong-play').addEventListener('click', begin);
      panel.querySelector('.kpong-back').addEventListener('click', startScreen);
      board(WIN);
      if (fresh && fresh.length) { root.classList.add('badge-moment'); setTimeout(function () { root.classList.remove('badge-moment'); }, 2600); }
      if (fresh && fresh.length && (T.badgeLines || {})[fresh[0]]) setTimeout(function () { say(T.badgeLines[fresh[0]], 5200); }, 900);
      else if (T.supportSay && !sessionStorage.getItem('kpSupportSaid')) {   // jednou za návštěvu Kevin připomene podporu
        try { sessionStorage.setItem('kpSupportSaid', '1'); } catch (e) { /* nevadí */ }
        setTimeout(function () { say(T.supportSay, 5200); }, 6000);
      }
      else if (won && level === 1 && T.noBadges) setTimeout(function () { say(T.noBadges, 4200); }, 900);
    }

    function begin() {
      panel.hidden = true;
      you = 0; kev = 0; youEl.textContent = '0'; kevEl.textContent = '0'; bigScore();
      player.x = player.target = W / 2; kevin.x = kevin.target = W / 2;
      if (K) { K.hold(null); K.look(0, 0); }
      L = LEVELS[level];
      started = performance.now(); mosq.done = false;
      screw = null; nextScrewAt = performance.now() + rnd(30000, 45000); shake = 0; powers = {}; player.w = PAD_W;
      yarn = null; yarnUsed = false; mood = 'calm';
      WIN = matchLen;
      mt = { perfect: 0, superHit: false, overheats: 0, maxRally: 0, yarn: false, screws: 0, supers: 0, stickGoals: 0, streakPts: 0 };
      var today = new Date().toISOString().slice(0, 10);              // Věrný parťák: počet různých dní se hrou
      if (level >= 2 && store.get('kevinPongDay') !== today) { store.set('kevinPongDay', today); store.set('kevinPongDays', String(+(store.get('kevinPongDays') || 0) + 1)); }
      heat = 0; hotUntil = 0; isHot = false; root.classList.remove('hot', 'final');
      stickReset(); rec = []; frame.style.setProperty('--heat', 0); heatShown = 0;
      running = true; awaitStart = 'start';            // první hopík vyletí, až hráč ťukne / klikne / zmáčkne mezerník
      resetBall(Math.random() < 0.5);
      streakP = streakK = maxDown = 0; comebackSaid = false; lastMoveAt = performance.now(); idleSaid = false;
      quip(gamesPlayed > 0 ? 'odveta' : level === 3 ? 'start_3' : 'start', 1, T.start, 2800, true);
      if (FORCE_YARN) { yarnUsed = true; setTimeout(throwYarn, 1800); }   // zkouška #klubko: hned na začátku
      tut = null; tutEl.hidden = true;
      if (!store.get('kevinPongTut') || tutAgain) { tutAgain = false; tutStart(); }
      gamesPlayed++;
    }

    var POWER_COL = D.POWER_COL;
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
      var ownMid = drawAtmo(now);                       // atmosféra pálky (pod vším)
      rail(KEVIN_Y, kevin.x); rail(PLAYER_Y, player.x);
      // čáry: střed (pokud ho nenakreslila atmosféra), branky
      if (!ownMid) {
        cx.strokeStyle = light ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.1)';
        cx.lineWidth = 3; cx.setLineDash([14, 14]);
        cx.beginPath(); cx.moveTo(0, (KEVIN_Y + PLAYER_Y) / 2); cx.lineTo(W, (KEVIN_Y + PLAYER_Y) / 2); cx.stroke();
        cx.setLineDash([]);
      }
      // pálky (zlatá Kevinova, hráčova v barvě textu)
      var warn = kevin.shot && ball.vy < 0 && Math.sin(now / 70) > 0;
      var ksp = kevinSprite();
      if (kevinPadGone) { /* po výbuchu (oslava Noční můra) Kevinova pálka není */ } else if (ksp) {
        // Kevinova vlastní pálka: spodní hrana těla = plocha odrazu, přívěsky visí dolů jako klubíčko
        var kS = PAD_W / ksp.w;
        drawSpritePad(ksp, kevin.x, KEVIN_Y + PAD_H / 2 - ksp.split * kS, PAD_W, kevin.shot && ball.vy < 0 ? (warn ? 'rgba(255, 60, 0, 1)' : 'rgba(255, 140, 40, .9)') : null,
          false, null, kevinRig, MAT.kevin);
      } else {
        if (kevin.shot && ball.vy < 0) { cx.shadowColor = 'rgba(255, 90, 20, .95)'; cx.shadowBlur = 18 + 10 * Math.sin(now / 60); }
        pad(kevin.x, KEVIN_Y, warn ? '#ff7a2e' : '#e6b730', warn ? '#a32600' : '#8f6600');
      }
      cx.shadowBlur = 0;
      var lift = liftAt(now);
      if (lift > 0) { cx.shadowColor = 'rgba(230,183,48,.9)'; cx.shadowBlur = 24 * lift / LIFT; }
      // vylepšení obarví pálku (každé jinak); poslední 3 s bliká zpátky do normální barvy, čím blíž konec, tím rychleji
      // víc bonusů naráz: barvy se po 0,6 s střídají (každá bliká podle svého zbývajícího času)
      var act = Object.keys(powers).filter(function (k) { return powers[k] > now; }), pk = act.length ? act[Math.floor(now / 600) % act.length] : null;
      var pc = pk && powerLit(powers[pk] - now) ? POWER_COL[pk] : null;
      var sp = padSprite(skin);
      hangTick(now);
      if (sp) {
        // obrázková pálka: vylepšení ji neobarví, ale rozzáří její barvou (a záře bliká stejně jako barva)
        drawSpritePad(sp, player.x, PLAYER_Y - lift - PAD_H / 2, player.w, pc ? pc[2] : lift > 0 ? 'rgba(230,183,48,.9)' : null);
        padGeo = { x: player.x, top: PLAYER_Y - lift - PAD_H / 2, w: player.w, h: sp.split * PAD_W / sp.w };
        drawPadFlash(now);
      } else {
        if (pc) { cx.shadowColor = pc[2]; cx.shadowBlur = 18; }
        pad(player.x, PLAYER_Y - lift, pc ? pc[0] : SKINS[skin].pad[0], pc ? pc[1] : SKINS[skin].pad[1], player.w);
      }
      cx.shadowBlur = 0;
      pfxTick(now);
      drawFlight(now);
      drawPfx();
      drawAim(now);
      tutTick();
      if (screw) drawScrew(screw);
      if (yarn) {
        drawYarnThread();
        drawYarn(yarn.x, yarn.y, yarn.r * (0.55 + 0.45 * yarn.reel), yarn.a);
      }
      // Přilepení: kam míček poletí (i s odrazy od stěn), kolem míčku ubývající čas, od pálky se rozběhne vlna času
      if (stick.active) {
        var sa = stick.active, lx = ball.x, ly = ball.y, ddx = Math.sin(sa.ang), ddy = -Math.cos(sa.ang), left = 620;
        cx.save();
        cx.setLineDash([16, 11]); cx.lineDashOffset = -now / 22; cx.lineWidth = 4; cx.lineCap = 'round';
        cx.strokeStyle = 'rgba(255, 214, 90, .95)'; cx.shadowColor = 'rgba(255, 190, 60, .9)'; cx.shadowBlur = 14;
        cx.beginPath(); cx.moveTo(lx, ly);
        for (var bn = 0; bn < 4 && left > 0; bn++) {
          var tw = ddx > 0 ? (W - BALL_R - lx) / ddx : ddx < 0 ? (BALL_R - lx) / ddx : Infinity, seg = Math.min(tw, left);
          lx += ddx * seg; ly += ddy * seg; cx.lineTo(lx, ly); left -= seg;
          if (seg === tw) ddx = -ddx; else break;
        }
        cx.stroke(); cx.setLineDash([]);
        var leftT = Math.max(0, (sa.end - now) / STICK_AIM_MS);
        cx.lineWidth = 3; cx.strokeStyle = 'rgba(255, 241, 168, .9)';
        cx.beginPath(); cx.arc(ball.x, ball.y, BALL_R + 9, -Math.PI / 2, -Math.PI / 2 + leftT * Math.PI * 2); cx.stroke();
        var wave = (now - sa.start) / 700;
        if (wave < 1) {
          cx.shadowBlur = 0; cx.lineWidth = 3 * (1 - wave); cx.strokeStyle = 'rgba(255, 220, 120, ' + (0.7 * (1 - wave)).toFixed(3) + ')';
          cx.beginPath(); cx.arc(ball.x, ball.y, 20 + wave * 520, 0, Math.PI * 2); cx.stroke();
        }
        cx.restore();
      }
      // míč: zlatý hopík se stopou
      if ((running && now >= serveAt) || replay) drawComet(now);
      if (running || replay) {
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
    // barva kolejnic ladí s automatem vybrané pálky (jen když je automat podle pálky zapnutý), jinak zlatá
    var RAIL_COL = { vetev: '134,196,90', plys: '255,182,206', graffiti: '255,79,216', jadeit: '110,214,150', mince: '255,206,84',
      led: '200,236,255', cip: '89,240,160', perly: '236,224,255', ekvalizer: '255,160,40', lava: '255,110,30', retez: '255,214,90',
      neon: '125,249,255', kola: '224,150,90', ganja: '120,210,90', skelosquad: '255,210,63' };
    function rail(y, x) {
      var rc = (atmoOn && RAIL_COL[curPad()]) || '230,183,48';
      cx.lineWidth = 3; cx.strokeStyle = 'rgba(' + rc + ',.18)';
      cx.beginPath(); cx.moveTo(10, y); cx.lineTo(W - 10, y); cx.stroke();
      cx.strokeStyle = 'rgba(' + rc + ',.45)'; cx.setLineDash([8, 16]); cx.lineDashOffset = -x;
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
      if (s.spring) {                                  // pružinka: mosazný závit s očky na koncích
        cx.lineWidth = 3.2; cx.strokeStyle = brass; cx.beginPath();
        for (var sy = -16; sy <= 16; sy += 1) { var sx = Math.sin(sy * 0.82) * 9; cx[sy === -16 ? 'moveTo' : 'lineTo'](sx, sy); }
        cx.stroke(); cx.shadowBlur = 0;
        cx.lineWidth = 1; cx.strokeStyle = 'rgba(74, 51, 0, .6)'; cx.stroke();
        cx.lineWidth = 2.4; cx.strokeStyle = brass;
        cx.beginPath(); cx.arc(0, -19, 3.2, 0, Math.PI * 2); cx.stroke(); cx.beginPath(); cx.arc(0, 19, 3.2, 0, Math.PI * 2); cx.stroke();
      } else if (s.nut) {
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
    // počítač: během hry se myš „zamkne“ do hry (Pointer Lock) – kurzor zmizí a nemůže vyjet z hrací plochy (dřív
    // vyjela a hráč prohrál); pálka jede podle pohybu myši. Esc / přepnutí okna = uvolní a hra počká na kliknutí.
    // V ⚙ jde vypnout (kevinPongLock = 0).
    var lockOn = store.get('kevinPongLock') !== '0';
    var aimOn = store.get('kevinPongAim') !== '0';          // ukazatel načasování odstřelu (výchozí zapnutý)
    var shotSign = '', tutAgain = false;                   // tutAgain = „Zopakovat výuku“ v Jak se hraje                                       // 'early' / 'late' – kam se poslední odstřel netrefil
    function locked() { return document.pointerLockElement === root; }
    function lockMouse() {
      if (!lockOn || coarse || locked() || setCard || !root.requestPointerLock) return;
      try { var r = root.requestPointerLock(); if (r && r.catch) r.catch(function () { /* prohlížeč nepovolil */ }); } catch (e) { /* nevadí */ }
    }
    function releaseMouse() { if (locked() && document.exitPointerLock) document.exitPointerLock(); }
    var lockLostAt = 0;
    document.addEventListener('pointerlockchange', function () {
      if (!locked()) lockLostAt = Date.now();
      // zámek povolil (Esc, jiné okno): hra se zastaví a počká na kliknutí, které myš zase zamkne
      if (!locked() && running && !paused && !awaitStart && !setCard && window.KevinPong.isOpen) askToResume();
    });
    function onPointer(e) {
      if (!running || (e.type === 'pointerdown' && e.target.closest('.kpong-set'))) return;
      if (e.pointerType !== 'touch' && locked()) {         // zamčená myš: pálka podle pohybu, klik = odstřel
        if (e.type === 'pointerdown') { if (e.button === 0 && !setCard) shoot(); e.preventDefault(); return; }
        var cr = court.getBoundingClientRect();
        player.target = clamp(player.target + e.movementX * W / cr.width, player.w / 2, W - player.w / 2);
        return;
      }
      if (e.pointerType !== 'touch' && e.type === 'pointerdown' && e.button === 0 && !setCard && !e.target.closest('button, a, .kpong-panel, .kpong-settings')) lockMouse();
      if (e.pointerType === 'touch') {
        if (e.type === 'pointerdown') {
          if (mover !== null && mover !== e.pointerId) { shoot(); e.preventDefault(); return; }
          mover = e.pointerId;
          kickOff();
          try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) { /* nevadí */ }
          steerStart(e, 'field');
        } else if (e.pointerId !== mover) return;
        steer(e); e.preventDefault();
        return;
      } else if (e.type === 'pointerdown') {
        if (e.button !== 0 || setCard || e.target.closest('button, a, .kpong-panel, .kpong-settings')) return;
        shoot();
      }
      player.target = clamp(toField(e), player.w / 2, W - player.w / 2); e.preventDefault();
    }
    function onPointerEnd(e) { if (e.pointerId === mover) { mover = null; steerEnd(e); } }
    // ---------- pálka prstem: tři režimy (⚙ Ovládání → Pálka prstem, localStorage kevinPongTouch) ----------
    // direct = pálka je tam, kde je prst (jako dřív; s vlastní plochou přes její šířku);
    // stick = páčka jako na ovladači: kam prst dopadne, tam je střed, vychýlení do strany = rychlost (mrtvá zóna
    //   uprostřed, rychlost roste plynule, za okrajem páčky se střed posune s prstem, ať jde hned zacouvat);
    // pad = trackpad: pálka jede o posun prstu krát citlivost (krátké švihnutí = přes celé hřiště).
    // Citlivost (kevinPongTouchSens, 0,5–2,5) platí pro páčku a trackpad.
    var TOUCH_KEYS = ['direct', 'stick', 'pad'];
    var touchMode = TOUCH_KEYS.indexOf(store.get('kevinPongTouch')) >= 0 ? store.get('kevinPongTouch') : 'direct';
    var touchSens = clamp(+(store.get('kevinPongTouchSens') || 1) || 1, 0.5, 2.5);
    var st = null, stickV = 0;                           // st = prst, který zrovna vede pálku
    var STICK_DEAD = 6, STICK_MAX_V = 1500;              // px mrtvé zóny, nejvyšší rychlost (jednotky hřiště / s)
    function stickRange() { return 64 / touchSens; }     // o kolik px vychýlit na plnou rychlost
    var stickEl = document.createElement('div');
    stickEl.className = 'kp-stick'; stickEl.hidden = true;
    stickEl.innerHTML = '<span class="kp-stick-knob"></span>';
    root.appendChild(stickEl);
    function steerStart(e, area) {
      st = { id: e.pointerId, area: area, x0: e.clientX, last: e.clientX };
      stickV = 0;
      if (touchMode === 'stick') {
        stickEl.style.left = e.clientX + 'px'; stickEl.style.top = e.clientY + 'px';
        stickEl.style.setProperty('--r', stickRange() + 'px'); stickEl.style.setProperty('--k', '0px');
        stickEl.hidden = false;
      }
    }
    function steer(e) {
      if (!st || e.pointerId !== st.id || !running) return;
      if (touchMode === 'stick') {
        var range = stickRange(), off = e.clientX - st.x0;
        if (Math.abs(off) > range) { st.x0 = e.clientX - Math.sign(off) * range; off = Math.sign(off) * range; stickEl.style.left = st.x0 + 'px'; }
        var a = Math.max(0, Math.abs(off) - STICK_DEAD) / (range - STICK_DEAD);
        stickV = Math.sign(off) * Math.pow(a, 1.6) * STICK_MAX_V;
        stickEl.style.setProperty('--k', off + 'px');
      } else if (touchMode === 'pad') {
        var w = court.getBoundingClientRect().width || 1;
        player.target += (e.clientX - st.last) * W / w * 1.6 * touchSens;
      } else if (st.area === 'zone') {
        var r = zoneEl.getBoundingClientRect();
        player.target = (e.clientX - r.left) / r.width * W;
      } else player.target = toField(e);
      st.last = e.clientX;
      player.target = clamp(player.target, player.w / 2, W - player.w / 2);
    }
    function steerEnd(e) {
      if (!st || (e && e.pointerId !== st.id)) return;
      st = null; stickV = 0; stickEl.hidden = true;
    }
    function mouseOnly(e) { if (e.pointerType !== 'touch') onPointer(e); }
    function touchOnly(e) { if (e.pointerType === 'touch') onPointer(e); }
    root.addEventListener('pointermove', mouseOnly);
    root.addEventListener('pointerdown', mouseOnly);
    machine.addEventListener('pointermove', touchOnly);
    machine.addEventListener('pointerdown', touchOnly);
    machine.addEventListener('pointerup', onPointerEnd);
    machine.addEventListener('pointercancel', onPointerEnd);
    // ---------- ovládání na dotyk: tlačítko odstřelu a plocha pro pálku, obojí si hráč rozmístí v ⚙ ----------
    // Tlačítko ⚡ plave nad strojem (--sx/--sy v % okna, kevinPongShotPos). Plocha pro pálku (kevinPongZone, % okna)
    // je volitelná: funguje jako posuvník – přes celou její šířku jede pálka přes celé hřiště (stačí malá u palce);
    // bez ní vede pálku prst kdekoli na stroji jako dřív. Přesouvat jde jen v režimu „Upravit rozložení“.
    var shotPos = null, zone = null, layoutMode = false, zoneMover = null;
    function zoneDef() { return phoneView ? { x: 4, y: strip.top + 1, w: 92, h: Math.max(8, strip.h - 2) } : { x: 6, y: 74, w: 88, h: 20 }; }
    try { shotPos = JSON.parse(store.get('kevinPongShotPos') || 'null'); } catch (e) { shotPos = null; }
    try { zone = JSON.parse(store.get('kevinPongZone') || 'null'); } catch (e) { zone = null; }
    // 3. 11. 2026 sklo na telefonu šlo nahoru: dřív uložené rozmístění by leželo přes hřiště (jednou smazat)
    if (phoneView && store.get('kevinPongLayoutEra') !== '2') {
      shotPos = null; zone = null; store.set('kevinPongShotPos', ''); store.set('kevinPongZone', ''); store.set('kevinPongLayoutEra', '2');
    }
    var zoneEl = document.createElement('div');
    zoneEl.className = 'kpong-zone';
    zoneEl.innerHTML = '<i class="fa-solid fa-left-right" aria-hidden="true"></i><span class="kp-zone-name"></span><span class="kp-zone-grip" aria-hidden="true"></span>';
    padEl.appendChild(zoneEl);
    var layoutBar = document.createElement('div');
    layoutBar.className = 'kp-layout-bar';
    padEl.appendChild(layoutBar);
    // telefon: odstřel v pruhu pod sklem vlevo, magnet na opačném konci pruhu (u prostředka vedle odstřelu)
    function defShot() { return phoneView ? { x: 11, y: strip.top + strip.h / 2 } : { x: 12, y: 58 }; }
    function placeShot() {
      var p = shotPos || defShot(), sx = clamp(p.x, 6, 94);
      padEl.style.setProperty('--sx', sx);
      padEl.style.setProperty('--sy', clamp(p.y, 8, 94));
      padEl.style.setProperty('--mx', Math.abs(sx - 50) < 16 ? sx + 22 : 100 - sx);
    }
    function placeZone() {
      var z = zone || zoneDef();
      zoneEl.hidden = !zone && !layoutMode;
      zoneEl.style.cssText = '--zx:' + z.x + ';--zy:' + z.y + ';--zw:' + z.w + ';--zh:' + z.h;
    }
    placeShot(); placeZone();
    // záznam gólu: ťuknutí / klik kamkoli ho přeskočí
    root.addEventListener('pointerdown', function (e) { if (replay) { e.preventDefault(); e.stopPropagation(); stopReplay(); } }, true);
    root.querySelector('.kpong-stickbtn').addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (!layoutMode) useStick();
    });
    shotBtn.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (layoutMode) return dragLayout(e, 'shot');
      shoot();
    });
    // plocha pro pálku: první prst vede pálku, další prst v ploše = odstřel
    function zoneSteer(e) { steer(e); e.preventDefault(); }
    zoneEl.addEventListener('pointerdown', function (e) {
      e.stopPropagation();
      if (layoutMode) return dragLayout(e, e.target.closest('.kp-zone-grip') ? 'size' : 'zone');
      if (!running) return;
      if (zoneMover !== null && zoneMover !== e.pointerId) { shoot(); e.preventDefault(); return; }
      zoneMover = e.pointerId; kickOff();
      try { zoneEl.setPointerCapture(e.pointerId); } catch (x) { /* nevadí */ }
      steerStart(e, 'zone');
      zoneSteer(e);
    });
    zoneEl.addEventListener('pointermove', function (e) { if (e.pointerId === zoneMover && running) zoneSteer(e); });
    function zoneEnd(e) { if (e.pointerId === zoneMover) { zoneMover = null; steerEnd(e); } }
    zoneEl.addEventListener('pointerup', zoneEnd); zoneEl.addEventListener('pointercancel', zoneEnd);
    // přetahování v režimu úprav: tlačítko, celá plocha, nebo roh plochy (velikost)
    function dragLayout(e, what) {
      e.preventDefault(); e.stopPropagation();
      var id = e.pointerId, sx = e.clientX, sy = e.clientY, z0 = Object.assign({}, zone || zoneDef()), p0 = Object.assign({}, shotPos || defShot());
      function move(ev) {
        if (ev.pointerId !== id) return;
        ev.preventDefault();
        var dx = (ev.clientX - sx) / innerWidth * 100, dy = (ev.clientY - sy) / innerHeight * 100;
        if (what === 'shot') { shotPos = { x: clamp(p0.x + dx, 6, 94), y: clamp(p0.y + dy, 8, 94) }; placeShot(); return; }
        if (what === 'size') zone = { x: z0.x, y: z0.y, w: clamp(z0.w + dx, 20, 100 - z0.x), h: clamp(z0.h + dy, 8, 100 - z0.y) };
        else zone = { x: clamp(z0.x + dx, 0, 100 - z0.w), y: clamp(z0.y + dy, 0, 100 - z0.h), w: z0.w, h: z0.h };
        placeZone();
      }
      function up(ev) {
        if (ev.pointerId !== id) return;
        removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      }
      addEventListener('pointermove', move, { passive: false }); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    }
    function openLayout() {
      layoutMode = true;
      if (running && !paused) paused = true;
      root.classList.add('kp-layout');
      zoneEl.querySelector('.kp-zone-name').textContent = T.zoneLabel || '';
      layoutBar.innerHTML = '<p>' + esc(T.layoutHelp || '') + '</p><div class="kp-row">' +
        '<button type="button" class="kp-fullbtn" data-l="reset"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> ' + esc(T.layoutReset || '') + '</button>' +
        '<button type="button" class="btn-primary" data-l="done"><i class="fa-solid fa-check" aria-hidden="true"></i> ' + esc(T.layoutDone || '') + '</button></div>';
      layoutBar.querySelector('[data-l="reset"]').addEventListener('click', function () { shotPos = null; zone = null; placeShot(); placeZone(); });
      layoutBar.querySelector('[data-l="done"]').addEventListener('click', closeLayout);
      placeZone();
    }
    function closeLayout() {
      layoutMode = false;
      root.classList.remove('kp-layout');
      store.set('kevinPongShotPos', shotPos ? JSON.stringify(shotPos) : '');
      store.set('kevinPongZone', zone ? JSON.stringify(zone) : '');
      placeZone();
      if (running && paused) { paused = false; askToResume(); }
    }

    function onKey(e) {
      if (replay && e.type === 'keydown' && (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape')) { e.preventDefault(); return stopReplay(); }
      if (e.key === 'Escape' && Date.now() - lockLostAt < 400) return;   // Esc jen uvolnil myš – hru nezavírat
      if (e.key === 'Escape' && supportEl) return closeSupport();
      if (e.key === 'Escape' && menuEl) return closeMenu(true);
      if (menuEl) return;                                          // v menu hry klávesy nehrají
      if (e.key === 'Escape') return item ? closeItem() : looking ? closeLook() : setCard ? closeSettings() : close();
      if (item && e.type === 'keydown' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); return stepItem(e.key === 'ArrowLeft' ? -1 : 1); }
      if (item) return;                                            // v náhledu předmětu klávesy nehrají (šipky listují)
      if (looking) return;                                         // při prohlídce klávesy nehrají
      if (setCard) return;                                         // v nastavení klávesy nehrají
      // zkouška na testu: E = efekt perfektního odstřelu vybrané pálky, Shift+E = SUPER (obyčejný odpal = klávesa L)
      if ((e.key === 'e' || e.key === 'E') && e.type === 'keydown' && running) { if (!e.repeat) useStick(); e.preventDefault(); return; }
      if (TRY_HOST && e.type === 'keydown' && (e.key === 'x' || e.key === 'X')) { padBurst(e.shiftKey ? 3 : 2, performance.now()); return; }
      // L = míček vyletí z hráčovy pálky nahoru (zkouška stopy letu)
      if (TRY_HOST && e.type === 'keydown' && (e.key === 'l' || e.key === 'L') && running && !awaitStart) {
        ball.x = player.x; ball.y = PLAYER_Y - PAD_H / 2 - BALL_R - 1; ball.vx = rnd(-160, 160); ball.vy = -Math.sqrt(Math.max(1, ball.speed * ball.speed - ball.vx * ball.vx));
        serveAt = 0; ball.trail = []; startFlight(performance.now()); padBurst(1, performance.now()); return;
      }
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
    // odkaz ve hře na jinou stránku webu (Podpoř, Přihlásit, profil…): hru nejdřív zavřít, jinak se stránka otevře
    // pod ní a vypadá to, že odkaz nic neudělal. Navigace (i PJAX) pak proběhne normálně.
    root.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || a.target === '_blank' || /^#/.test(a.getAttribute('href'))) return;
      if (a.classList.contains('kp-support')) { e.preventDefault(); return openSupport(); }   // podpora: karta ve hře
      // zavřít hru a stránku otevřít sami (odkaz po zavření zmizí ze stránky a prohlížeč by ho už neotevřel)
      e.preventDefault();
      var href = a.href;
      close();
      location.href = href;
    });
    // karta podpory: hra zůstane (uživatel nechtěl, aby se zavírala), Revolut se otevře v novém okně
    var REVOLUT = 'https://revolut.me/skelimc', supportEl = null;
    function openSupport() {
      if (supportEl) return;
      Object.keys(comics).forEach(function (k) { if (comics[k]) { comics[k].remove(); comics[k] = null; } });   // Kevinova bublina pryč
      supportEl = document.createElement('div');
      supportEl.className = 'kp-support-card';
      supportEl.setAttribute('role', 'dialog'); supportEl.setAttribute('aria-label', T.supportCardTitle || '');
      supportEl.innerHTML = '<div class="kp-sc-box"><button type="button" class="kp-item-x" aria-label="' + esc(T.close || '') + '"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
        '<img src="/kevin/pong/menu/kevin-2.webp' + ver + '" alt="" width="72" height="72">' +
        '<h3>' + esc(T.supportCardTitle || '') + '</h3><p>' + esc(T.supportCardText || '') + '</p>' +
        '<a class="kpong-play btn-primary kp-sc-revolut" href="' + REVOLUT + '" target="_blank" rel="noopener"><i class="fa-solid fa-heart" aria-hidden="true"></i> Revolut</a>' +
        '<a class="kp-link kp-sc-more" href="/donate.jsp">' + esc(T.supportMore || '') + '</a></div>';
      root.appendChild(supportEl);
      supportEl.querySelector('.kp-item-x').addEventListener('click', closeSupport);
      supportEl.addEventListener('click', function (ev) { if (ev.target === supportEl) closeSupport(); });
      supportEl.querySelector('.kp-sc-revolut').addEventListener('click', function () { setTimeout(closeSupport, 300); });
      supportEl.querySelector('.kp-sc-revolut').focus({ preventScroll: true });
    }
    function closeSupport() { if (supportEl) { supportEl.remove(); supportEl = null; } }

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
    // only = 'look': jen Vzhled (samostatná položka v menu hry); jinak Nastavení bez Vzhledu (Zvuk, Ovládání, Obraz)
    function openSettings(only) {
      if (setCard) return closeSettings();
      releaseMouse();
      if (mosq.active) return;                                     // během scénky s komárem ne
      setPausedGame = running && !paused;
      if (setPausedGame) paused = true;
      Object.keys(comics).forEach(function (k) { if (comics[k]) { comics[k].remove(); comics[k] = null; } });
      setCard = document.createElement('div');
      setCard.className = 'kpong-settings';
      setCard.setAttribute('role', 'dialog');
      setCard.setAttribute('aria-label', T.settings || 'Settings');
      // nastavení ve čtyřech záložkách: Vzhled (náhled, pálky, míčky, pozadí, atmosféra pálky), Zvuk (hlasitost, vibrace,
      // Kevin mluví), Ovládání (jen pálka: prst / klávesnice / myš), Obraz (detaily, celá obrazovka)
      // Vzhled: z každé skupiny jen vybraná položka; ostatní ve vyskakovacím seznamu (openPicker)
      var secLook = '<section class="kp-sec kp-slots">' + SLOT_KINDS.map(slotHtml).join('') + '</section>';
      var secSound = '<section class="kp-sec"><h3 class="kp-label">' + esc(T.soundTitle || '') + '</h3><div class="kp-row">' +
        '<button type="button" class="kp-fullbtn kp-snd" aria-pressed="' + (vol > 0) + '"></button>' +
        '<input type="range" class="kp-vol" min="0.1" max="1" step="0.1" value="' + (vol || +(store.get('kevinPongVolLast') || 0.6)) + '" aria-label="' + esc(T.volume || '') + '"></div></section>';
      var secTalk = '<section class="kp-sec"><h3 class="kp-label">' + esc(T.talkTitle || '') + '</h3><div class="kp-talk" role="radiogroup" aria-label="' + esc(T.talkTitle || '') + '">' +
        TALK_KEYS.map(function (k, i) { return '<button type="button" role="radio" data-talk="' + k + '" aria-checked="' + (k === talk) + '">' + esc((T.talk || TALK_KEYS)[i]) + '</button>'; }).join('') + '</div></section>';
      // pálka prstem: tři režimy + citlivost (jen dotyk; citlivost nemá smysl u „Jako dřív“)
      var secTouch = !coarse ? '' : '<section class="kp-sec"><h3 class="kp-label">' + esc(T.touchTitle || '') + '</h3>' +
        '<div class="kp-talk kp-touchmodes" role="radiogroup" aria-label="' + esc(T.touchTitle || '') + '">' +
        TOUCH_KEYS.map(function (k, i) { return '<button type="button" role="radio" data-touch="' + k + '" aria-checked="' + (k === touchMode) + '">' + esc((T.touch || TOUCH_KEYS)[i]) + '</button>'; }).join('') +
        '</div><p class="kp-bgname kp-touchhint">' + esc((T.touchHints || [])[TOUCH_KEYS.indexOf(touchMode)] || '') + '</p>' +
        '<div class="kp-row kp-keyrow kp-sensrow"' + (touchMode === 'direct' ? ' hidden' : '') + '><i class="fa-solid fa-gauge-simple-high" aria-hidden="true"></i>' +
        '<input type="range" class="kp-sens" min="0.5" max="2.5" step="0.1" value="' + touchSens + '" aria-label="' + esc(T.touchSens || '') + '">' +
        '<output class="kp-sensval">' + Math.round(touchSens * 100) + ' %</output></div></section>';
      var secLayout = !coarse ? '' : '<section class="kp-sec"><button type="button" class="kp-fullbtn kp-layout-btn"><i class="fa-solid fa-up-down-left-right" aria-hidden="true"></i> ' +
        esc(T.layoutBtn || '') + '</button><p class="kp-bgname">' + esc(T.layoutTip || '') + '</p></section>';
      var secKeys = coarse ? '' : '<section class="kp-sec"><h3 class="kp-label">' + esc(T.keysTitle || '') + '</h3><div class="kp-row kp-keyrow">' +
        '<i class="fa-solid fa-gauge-simple-high" aria-hidden="true"></i>' +
        '<input type="range" class="kp-keys" min="0.5" max="2" step="0.1" value="' + keySpeed + '" aria-label="' + esc(T.keysTitle || '') + '">' +
        '<output class="kp-keysval">' + Math.round(keySpeed * 100) + ' %</output></div><p class="kp-bgname">' + esc(T.keysHint || '') + '</p></section>';
      // Detaily: pro slabší telefony (ruční volba vypne automatické ubírání)
      var secDetail = '<section class="kp-sec"><h3 class="kp-label">' + esc(T.detailTitle || '') + '</h3><div class="kp-talk" role="radiogroup" aria-label="' + esc(T.detailTitle || '') + '">' +
        DETAIL_KEYS.map(function (k, i) { return '<button type="button" role="radio" data-detail="' + k + '" aria-checked="' + (k === detail) + '">' + esc((T.detail || DETAIL_KEYS)[i]) + '</button>'; }).join('') +
        '</div><p class="kp-bgname">' + esc(T.detailHint || '') + '</p></section>';
      // přepínače, každý na svém místě: vibrace ke zvuku, atmosféra ke vzhledu, myš k ovládání, celá obrazovka k obrazu
      function checks(html) { return html ? '<div class="kp-checks">' + html + '</div>' : ''; }
      var btnVib = navigator.vibrate ? '<button type="button" class="kp-fullbtn kp-opt" data-opt="vib" aria-pressed="' + vibOn + '"><i class="fa-solid fa-mobile-screen" aria-hidden="true"></i> ' + esc(T.vibrate || '') + '</button>' : '';

      var btnAtmo = '<button type="button" class="kp-fullbtn kp-opt" data-opt="atmo" aria-pressed="' + atmoOn + '"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> ' + esc(T.atmo || '') + '</button>';
      var btnAim = '<button type="button" class="kp-fullbtn kp-opt" data-opt="aim" aria-pressed="' + aimOn + '"><i class="fa-solid fa-bullseye" aria-hidden="true"></i> ' + esc(T.aimOpt || '') + '</button>';
      var btnLock = coarse ? '' : '<button type="button" class="kp-fullbtn kp-opt" data-opt="lock" aria-pressed="' + lockOn + '"><i class="fa-solid fa-computer-mouse" aria-hidden="true"></i> ' + esc(T.lockMouse || '') + '</button>';
      var btnFull = canFull ? '<button type="button" class="kp-fullbtn kp-full"><i class="fa-solid ' + (isFull() ? 'fa-compress' : 'fa-expand') + '" aria-hidden="true"></i> ' + esc(T.fullscreen || '') + '</button>' : '';
      var TABS = [['look', 'fa-palette', T.tabLook], ['sound', 'fa-volume-high', T.tabSound], ['controls', 'fa-gamepad', T.tabControls], ['screen', 'fa-display', T.tabScreen]];
      var lookOnly = only === 'look';
      TABS = TABS.filter(function (x) { return lookOnly ? x[0] === 'look' : x[0] !== 'look'; });
      var tab = lookOnly ? 'look' : TABS.some(function (x) { return x[0] === store.get('kevinPongSetTab'); }) ? store.get('kevinPongSetTab') : 'sound';
      if (lookOnly) setCard.setAttribute('aria-label', T.tabLook || '');
      setCard.innerHTML = '<div class="kp-vhead"><span class="kp-vgear" aria-hidden="true"><i class="fa-solid ' + (lookOnly ? 'fa-palette' : 'fa-gear') + '"></i></span><h2>' + esc(lookOnly ? T.tabLook || '' : T.settings || '') + '</h2></div>' +
        '<div class="kp-tabs" role="tablist"' + (lookOnly ? ' hidden' : '') + '>' + TABS.map(function (x) {
          return '<button type="button" role="tab" id="kp-tab-' + x[0] + '" aria-controls="kp-pane-' + x[0] + '" data-tab="' + x[0] + '" aria-selected="' + (x[0] === tab) + '">' +
            '<i class="fa-solid ' + x[1] + '" aria-hidden="true"></i><span>' + esc(x[2] || x[0]) + '</span></button>';
        }).join('') + '</div>' +
        '<div class="kp-pane" role="tabpanel" id="kp-pane-look" aria-labelledby="kp-tab-look" data-pane="look"' + (tab === 'look' ? '' : ' hidden') + '>' +
        '<canvas class="kp-preview" width="600" height="200" aria-hidden="true"></canvas>' + secLook + checks(btnAtmo) + '<p class="kp-bgname">' + esc(T.atmoHint || '') + '</p></div>' +
        '<div class="kp-pane" role="tabpanel" id="kp-pane-sound" aria-labelledby="kp-tab-sound" data-pane="sound"' + (tab === 'sound' ? '' : ' hidden') + '>' + secSound + checks(btnVib) + secTalk + '</div>' +
        '<div class="kp-pane" role="tabpanel" id="kp-pane-controls" aria-labelledby="kp-tab-controls" data-pane="controls"' + (tab === 'controls' ? '' : ' hidden') + '>' + secTouch + secLayout + secKeys + checks(btnAim + btnLock) + '</div>' +
        '<div class="kp-pane" role="tabpanel" id="kp-pane-screen" aria-labelledby="kp-tab-screen" data-pane="screen"' + (tab === 'screen' ? '' : ' hidden') + '>' + secDetail + checks(btnFull) + '</div>' +
        '<button type="button" class="kpong-play btn-primary kp-resume"><i class="fa-solid fa-' + (setPausedGame ? 'play' : 'check') + '" aria-hidden="true"></i> ' + esc(setPausedGame ? T.resume || '' : T.done || '') + '</button>' +
        '';                                              // (Začít znovu je v menu hry)
      root.appendChild(setCard);
      setBtn.setAttribute('aria-expanded', 'true');
      setCard.querySelectorAll('.kp-tabs [data-tab]').forEach(function (b) {
        b.addEventListener('click', function () {
          var t = b.dataset.tab;
          store.set('kevinPongSetTab', t);
          setCard.querySelectorAll('.kp-tabs [data-tab]').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
          setCard.querySelectorAll('.kp-pane').forEach(function (p) { p.hidden = p.dataset.pane !== t; });
          centerPicked();
        });
      });
      // vybraná položka v každé řadě na střed (ať je hned vidět, co mám)
      function centerPicked() {
        setCard.querySelectorAll('.kp-strip').forEach(function (st) {
          var on = st.querySelector('[aria-checked="true"]');
          if (on && st.offsetParent) st.scrollLeft = on.offsetLeft - st.clientWidth / 2 + on.offsetWidth / 2;
        });
      }
      centerPicked();
      // sloty Vzhledu: klik / ťuknutí = seznam; myš: najetí otevře seznam vedle (jen když je vpravo místo)
      setCard.addEventListener('click', function (e) {
        var sl = e.target.closest('.kp-slot');
        if (!sl) return;
        if (picker && picker.slot === sl) { if (!picker.side) closePicker(); } else openPicker(sl, false);
      });
      setCard.addEventListener('pointerover', function (e) {
        var sl = e.pointerType === 'mouse' && e.target.closest('.kp-slot');
        if (sl) { if (picker) clearTimeout(picker.hide); openPicker(sl, true); }
      });
      setCard.addEventListener('pointerout', function (e) {
        if (e.pointerType === 'mouse' && e.target.closest('.kp-slot') && picker && picker.side) pickerLater();
      });
      var fb = setCard.querySelector('.kp-full');
      if (fb) fb.addEventListener('click', toggleFull);
      // náhledy ve slotech (nakreslí se znovu, až se obrázky načtou)
      paintThumbs(setCard);
      onSprites.push(function () { if (setCard) paintThumbs(setCard); });
      drawPreview();
      onSprites.push(drawPreview);
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
      setCard.querySelectorAll('[data-touch]').forEach(function (b) {
        b.addEventListener('click', function () {
          touchMode = b.dataset.touch; store.set('kevinPongTouch', touchMode); steerEnd();
          setCard.querySelectorAll('[data-touch]').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
          setCard.querySelector('.kp-touchhint').textContent = (T.touchHints || [])[TOUCH_KEYS.indexOf(touchMode)] || '';
          setCard.querySelector('.kp-sensrow').hidden = touchMode === 'direct';
        });
      });
      var sensEl = setCard.querySelector('.kp-sens');
      if (sensEl) sensEl.addEventListener('input', function () {
        touchSens = +sensEl.value; store.set('kevinPongTouchSens', String(touchSens));
        setCard.querySelector('.kp-sensval').textContent = Math.round(touchSens * 100) + ' %';
      });
      setCard.querySelectorAll('[data-detail]').forEach(function (b) {
        b.addEventListener('click', function () {
          detail = b.dataset.detail; store.set('kevinPongDetail', detail);
          setCard.querySelectorAll('[data-detail]').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
          applyDetail();
        });
      });
      setCard.querySelectorAll('.kp-opt').forEach(function (b) {
        b.addEventListener('click', function () {
          var on = b.getAttribute('aria-pressed') !== 'true';
          b.setAttribute('aria-pressed', String(on));
          if (b.dataset.opt === 'vib') { vibOn = on; store.set('kevinPongVib', on ? '1' : '0'); if (on) vibe(30); }
          else if (b.dataset.opt === 'atmo') { atmoOn = on; store.set('kevinPongAtmo', on ? '1' : '0'); apfx = []; setSkin(); }
          else if (b.dataset.opt === 'lock') { lockOn = on; store.set('kevinPongLock', on ? '1' : '0'); }
          else if (b.dataset.opt === 'aim') { aimOn = on; store.set('kevinPongAim', on ? '1' : '0'); }
          else { lefty = on; store.set('kevinPongLefty', on ? '1' : '0'); root.classList.toggle('lefty', on); shotPos = null; store.set('kevinPongShotPos', ''); placeShot(); setTimeout(fit, 50); }
        });
      });
      setCard.querySelector('.kp-resume').addEventListener('click', closeSettings);
      var rs = setCard.querySelector('.kp-restart');
      if (rs) rs.addEventListener('click', restartMatch);
      var lb = setCard.querySelector('.kp-layout-btn');
      if (lb) lb.addEventListener('click', function () { closeSettings(); openLayout(); });
      setCard.querySelector('.kp-resume').focus({ preventScroll: true });
    }
    // velký náhled v nastavení: vybraná pálka a nad ní vybraný míček
    function drawPreview() {
      var c = setCard && setCard.querySelector('.kp-preview');
      if (!c) return;
      var keep = cx, sp = padSprite(skin);
      cx = c.getContext('2d'); cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, c.width, c.height);
      var k = c.width / (PAD_W * 2.4), vw = c.width / k, vh = c.height / k;
      cx.scale(k, k);
      if (sp) drawSpritePad(sp, vw / 2, vh * 0.5, PAD_W, null, true, skin);
      else pad(vw / 2, vh * 0.5 + PAD_H / 2, SKINS[skin].pad[0], SKINS[skin].pad[1]);
      var bx = vw / 2, by = vh * 0.24;
      if (ballType > 0) drawBall(BALLS[ballType].id, bx, by, 0.4, 0);
      else if (hopik.naturalWidth) cx.drawImage(hopik, bx - BALL_R, by - BALL_R, BALL_R * 2, BALL_R * 2);
      cx = keep;
    }
    // Začít znovu: zavřít nastavení bez „pokračovat?“, uklidit rozehraný stav a nový zápas (čeká na ťuknutí jako na začátku)
    function restartMatch() {
      setPausedGame = false;
      closeSettings();
      if (replay) { replay = null; rec = []; root.classList.remove('kp-replay', 'kp-replay-hit'); }
      stick.active = null; root.classList.remove('kp-bullet');
      hitStop = 0; paused = false; pausedMs = 0;
      Object.keys(comics).forEach(function (k) { if (comics[k]) { comics[k].remove(); comics[k] = null; } });
      begin();
    }
    // ---------- prohlídka automatu ----------
    // Hra se pozastaví (jako u nastavení), automat se ukáže celý a naklání se za prstem / myší (±14°), když se ho
    // nikdo nedotýká, pomalu se pohupuje. „Zpět ke hře“ (nebo Esc) vrátí pohled a hra čeká na ťuknutí.
    var lookUi = root.querySelector('.kp-look-ui'), lookPaused = false, lookRaf = 0, lookAt = 0, tiltX = 0, tiltY = 0, aimX = 0, aimY = 0;
    function openLook() {
      if (looking || mosq.active) return;
      if (setCard) closeSettings();
      releaseMouse();
      lookPaused = running && !paused;
      if (lookPaused) paused = true;
      Object.keys(comics).forEach(function (k) { if (comics[k]) { comics[k].remove(); comics[k] = null; } });
      looking = true; root.classList.add('kp-look'); lookUi.hidden = false; fit();
      lookAt = 0; lookRaf = requestAnimationFrame(lookTick);
      lookUi.querySelector('.kp-look-back').focus({ preventScroll: true });
    }
    function closeLook() {
      if (!looking) return;
      looking = false; root.classList.remove('kp-look'); lookUi.hidden = true;
      cancelAnimationFrame(lookRaf); machine.style.transform = '';
      fit();
      if (lookPaused) askToResume();
      lookPaused = false;
    }
    function lookTick(now) {
      if (!looking) return;
      var still = now - lookAt > 1500, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (still && !reduce) { aimY = Math.sin(now / 1700) * 9; aimX = Math.sin(now / 2300) * 4; }   // v klidu se pohupuje
      tiltX += (aimX - tiltX) * 0.12; tiltY += (aimY - tiltY) * 0.12;
      machine.style.transform = 'perspective(1100px) rotateX(' + tiltX.toFixed(2) + 'deg) rotateY(' + tiltY.toFixed(2) + 'deg)';
      lookRaf = requestAnimationFrame(lookTick);
    }
    // naklánění: kam ukazuje prst / myš vůči středu automatu (zachytí se dřív, než by pohnul pálkou)
    root.addEventListener('pointermove', function (e) {
      if (!looking) return;
      var r = machine.getBoundingClientRect();
      aimY = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), -1, 1) * 14;
      aimX = clamp(-(e.clientY - (r.top + r.height / 2)) / (r.height / 2), -1, 1) * 10;
      lookAt = performance.now();
      e.stopPropagation();
    }, true);
    root.addEventListener('pointerdown', function (e) {
      if (!looking || e.target.closest('.kp-look-ui')) return;
      e.stopPropagation(); e.preventDefault();
    }, true);
    root.querySelector('.kpong-look').addEventListener('click', function () { if (looking) closeLook(); else openLook(); });
    lookUi.querySelector('.kp-look-back').addEventListener('click', closeLook);
    // ---------- vítězné oslavy (legendární odznaky) ----------
    // Po výhře přes hřiště 3 s efekt podle odznaku: 👑 padající korunky, ⚡ blesk do automatu, 💀 Kevinova pálka se
    // rozpadne, 🎯 zásah terče, 🔥 ohnivý fénix. Výběr v ⚙ Vzhled (kevinPongCeleb): auto = za poslední získaný
    // (kevinPongCelebLast), off = vypnuto. Vidí ji jen hráč; omezený pohyb = bez oslavy.
    var CELEBS = { hwins5: 'crown', hfast: 'bolt', hclean: 'shatter', hsniper: 'target', hcomeback: 'phoenix' };
    var celebPick = store.get('kevinPongCeleb') || 'auto';
    // ---------- výběr vzhledu v Nastavení ----------
    // Z každé skupiny (pálka, míček, pozadí, oslava) je vidět jen vybraná položka (slot). Klik / ťuknutí na ni (myší
    // stačí najet) otevře seznam se šipkami nahoru a dolů; najetí / ťuknutí na položku ukáže vedle zvětšený náhled.
    // PC (vpravo je místo): seznam vyskočí vedle slotu, klik vybere a zavře. Telefon: seznam přes nastavení, náhled
    // nahoře, ťuknutí na odemčenou položku ji rovnou vybere (seznam zůstane, zavírá se ✕). Oslavu jde přehrát i zamčenou.
    var SLOT_KINDS = ['pad', 'ball', 'bg', 'celeb'], picker = null;
    function celebOpts() { return ['auto', 'off'].concat(Object.keys(CELEBS)); }
    function slotCount(kind) { return kind === 'celeb' ? celebOpts().length : itemCount(kind); }
    function slotCur(kind) {
      return kind === 'pad' ? skin : kind === 'ball' ? ballType : kind === 'bg' ? Math.max(0, BGS.indexOf(bgName)) : Math.max(0, celebOpts().indexOf(celebPick));
    }
    function slotInfo(kind, i) {
      if (kind === 'celeb') {
        var k = celebOpts()[i], b = CELEBS[k] ? k : null;
        return { name: k === 'auto' ? T.celebAuto : k === 'off' ? T.celebOff : (T.badgeNames || {})[k] || k, b: b, on: k === celebPick, ok: !b || hasBadge(b), key: k };
      }
      var inf = itemInfo(kind, i);
      inf.ok = kind === 'pad' ? SKINS[i].ok() : kind === 'ball' ? owns('ball', BALLS[i].id, inf.b) : owns('bg', BGS[i], inf.b);
      return inf;
    }
    function slotTitle(kind) { return { pad: T.skinTitle, ball: T.ballTitle, bg: T.bgTitle, celeb: T.celebTitle }[kind] || ''; }
    function slotOwned(kind) { var n = 0, all = slotCount(kind); for (var i = 0; i < all; i++) if (slotInfo(kind, i).ok) n++; return n; }
    // malý obrázek položky: pálka / míček na plátně (paintThumbs), pozadí jako miniatura, oslava jako ikona
    function thumbInner(kind, i) {
      if (kind === 'bg') return BGS[i] === 'tma' ? '<span class="kp-tbg tma"></span>' : '<span class="kp-tbg" style="background-image:url(/kevin/pong/pozadi-' + BGS[i] + '-mini.webp' + ver + ')"></span>';
      if (kind === 'celeb') { var k = celebOpts()[i]; return '<i class="fa-solid ' + (CELEBS[k] ? BADGE_ICON[k] : k === 'off' ? 'fa-ban' : 'fa-wand-magic-sparkles') + '" aria-hidden="true"></i>'; }
      return '<canvas data-k="' + kind + '" data-i="' + i + '"></canvas>';
    }
    function slotHtml(kind) {
      var i = slotCur(kind), inf = slotInfo(kind, i);
      return '<button type="button" class="kp-slot" data-slot="' + kind + '" aria-haspopup="listbox" aria-expanded="false">' +
        '<span class="kp-tb ' + kind + '">' + thumbInner(kind, i) + '</span>' +
        '<span class="kp-slot-txt"><small>' + esc(slotTitle(kind)) + ' <span class="kp-count">' + slotOwned(kind) + '/' + slotCount(kind) + '</span></small>' +
        '<b>' + esc(inf.name || '') + '</b></span><i class="fa-solid fa-chevron-right kp-slot-arrow" aria-hidden="true"></i></button>';
    }
    function refreshSlot(kind) {
      var old = setCard && setCard.querySelector('.kp-slot[data-slot="' + kind + '"]');
      if (!old) return;
      var tmp = document.createElement('div'); tmp.innerHTML = slotHtml(kind);
      var nu = tmp.firstChild;
      if (picker && picker.slot === old) { picker.slot = nu; nu.setAttribute('aria-expanded', 'true'); }
      old.replaceWith(nu);
      paintThumbs(nu);
    }
    // pálka / míček do plátna c; t = čas v sekundách (pálka se houpe, míček se točí), 0 = v klidu
    function paintObj(c, kind, i, t) {
      var keep = cx;
      cx = c.getContext('2d'); cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, c.width, c.height);
      if (kind === 'pad') {
        var sp = padSprite(i), k = c.width / (PAD_W * 1.12);
        cx.translate(c.width / 2, c.height / 2); cx.rotate(Math.sin(t * 1.4) * 0.04); cx.translate(-c.width / 2, -c.height / 2);
        cx.scale(k, k);
        if (sp) drawSpritePad(sp, PAD_W * 0.56, (c.height / k - (sp.h * PAD_W / sp.w)) / 2, PAD_W, null, true, i);
        else pad(PAD_W * 0.56, c.height / k / 2, SKINS[i].pad[0], SKINS[i].pad[1], PAD_W);
      } else {
        var R = Math.min(c.width, c.height) / 2, big = micBig && i > 0 && micBig[BALLS[i].id];
        cx.translate(c.width / 2, c.height / 2); cx.rotate(t * 1.1);
        if (i === 0 && hopik.naturalWidth) cx.drawImage(hopik, -R, -R, R * 2, R * 2);
        else if (big) cx.drawImage(micBigImg, big[0], big[1], big[2], big[3], -R, -R, R * 2, R * 2);
        else if (i > 0) { var s2 = R / BALL_R / 1.15; cx.scale(s2, s2); drawBall(BALLS[i].id, 0, 0, 0); }
      }
      cx = keep;
    }
    function fitCanvas(c) {
      var dpr = Math.min(3, window.devicePixelRatio || 1);
      c.width = Math.max(1, Math.round((c.clientWidth || 56) * dpr)); c.height = Math.max(1, Math.round((c.clientHeight || 36) * dpr));
    }
    function paintThumbs(scope) {
      scope.querySelectorAll('.kp-tb canvas[data-k]').forEach(function (c) { fitCanvas(c); paintObj(c, c.dataset.k, +c.dataset.i, 0); });
    }
    function closePicker() {
      if (!picker) return;
      cancelAnimationFrame(picker.raf); clearTimeout(picker.hide);
      picker.el.remove(); picker.slot.setAttribute('aria-expanded', 'false');
      picker = null;
    }
    // myš odjela ze slotu i ze seznamu → zavřít (s malou prodlevou, ať jde přejet mezerou mezi nimi)
    function pickerLater() { if (picker) { clearTimeout(picker.hide); picker.hide = setTimeout(closePicker, 280); } }
    function openPicker(slot, viaHover) {
      if (picker && picker.slot === slot) return;
      var kind = slot.dataset.slot, n = slotCount(kind), cur = slotCur(kind);
      var r = slot.getBoundingClientRect(), rr = root.getBoundingClientRect();
      var side = !coarse && rr.right - r.right >= 520;
      if (viaHover && !side) return;                    // bez místa vpravo se seznam otvírá jen klikem
      closePicker();
      var el = document.createElement('div');
      el.className = 'kp-picker ' + kind + (side ? ' side' : ' sheet');
      el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', slotTitle(kind));
      var rows = '', ord = kind === 'celeb' ? celebOpts().map(function (x, i) { return i; }) : itemOrder(kind);
      ord.forEach(function (i) {
        var inf = slotInfo(kind, i);
        rows += '<li role="option" tabindex="-1" data-i="' + i + '" aria-selected="' + (i === cur) + '"' + (inf.ok ? '' : ' aria-disabled="true"') + rar(inf.b) + '>' +
          '<span class="kp-tb ' + kind + '">' + thumbInner(kind, i) + '</span><span class="kp-pick-name">' + esc(inf.name || '') + '</span>' +
          '<i class="fa-solid ' + (inf.ok ? 'fa-check kp-pick-on' : 'fa-lock') + '" aria-hidden="true"></i></li>';
      });
      el.innerHTML = '<div class="kp-pick-col">' +
        (side ? '' : '<div class="kp-pick-head"><b>' + esc(slotTitle(kind)) + '</b><button type="button" class="kp-pick-x" aria-label="' + esc(T.close || '') + '"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>') +
        '<button type="button" class="kp-pick-arrow up" aria-label="' + esc(T.itemPrev || '') + '"><i class="fa-solid fa-chevron-up" aria-hidden="true"></i></button>' +
        '<ul class="kp-pick-list" role="listbox" aria-label="' + esc(slotTitle(kind)) + '">' + rows + '</ul>' +
        '<button type="button" class="kp-pick-arrow down" aria-label="' + esc(T.itemNext || '') + '"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button></div>' +
        '<div class="kp-pick-big" aria-live="polite"></div>';
      root.appendChild(el);
      picker = { el: el, slot: slot, kind: kind, side: side, i: -1, raf: 0, hide: 0 };
      slot.setAttribute('aria-expanded', 'true');
      if (kind === 'ball') loadMicBig(function () { if (picker && picker.el === el) paintThumbs(el); });
      paintThumbs(el);
      var list = el.querySelector('.kp-pick-list');
      if (side) {                                        // vedle slotu, svisle podle něj (ale celý na obrazovce)
        var top = r.top - rr.top + r.height / 2 - el.offsetHeight / 2;
        el.style.left = (r.right - rr.left + 12) + 'px';
        el.style.top = Math.max(8, Math.min(rr.height - el.offsetHeight - 8, top)) + 'px';
        el.addEventListener('pointerenter', function () { clearTimeout(picker && picker.hide); });
        el.addEventListener('pointerleave', pickerLater);
      }
      var on = list.querySelector('[aria-selected="true"]') || list.firstChild;
      list.scrollTop = on.offsetTop - list.clientHeight / 2 + on.offsetHeight / 2;
      showBig(+on.dataset.i);
      var step = function () { return (list.firstChild && list.firstChild.offsetHeight + 4) || 52; };
      el.querySelector('.kp-pick-arrow.up').addEventListener('click', function () { list.scrollBy({ top: -step() * 2, behavior: 'smooth' }); });
      el.querySelector('.kp-pick-arrow.down').addEventListener('click', function () { list.scrollBy({ top: step() * 2, behavior: 'smooth' }); });
      function arrows() {
        el.querySelector('.kp-pick-arrow.up').disabled = list.scrollTop < 2;
        el.querySelector('.kp-pick-arrow.down').disabled = list.scrollTop + list.clientHeight > list.scrollHeight - 2;
      }
      list.addEventListener('scroll', arrows, { passive: true }); arrows();
      list.addEventListener('pointerover', function (e) {
        var li = e.pointerType === 'mouse' && e.target.closest('li');
        if (li && +li.dataset.i !== picker.i) showBig(+li.dataset.i);
      });
      list.addEventListener('click', function (e) { var li = e.target.closest('li'); if (li) choose(+li.dataset.i); });
      // klávesnice: ↑ ↓ projíždí, Enter vybere, Esc zavře
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); var sl = picker.slot; closePicker(); sl.focus({ preventScroll: true }); return; }
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'Enter') return;
        e.preventDefault(); e.stopPropagation();
        if (e.key === 'Enter') return choose(picker.i);
        var pos = ord.indexOf(picker.i), j = ord[Math.max(0, Math.min(n - 1, pos + (e.key === 'ArrowUp' ? -1 : 1)))];
        showBig(j);
        var li = list.querySelector('li[data-i="' + j + '"]'); li.focus({ preventScroll: true }); li.scrollIntoView({ block: 'nearest' });
      });
      var x = el.querySelector('.kp-pick-x');
      if (x) x.addEventListener('click', function () { var sl = picker.slot; closePicker(); sl.focus({ preventScroll: true }); });
      if (!viaHover) (list.querySelector('[aria-selected="true"]') || list.firstChild).focus({ preventScroll: true });
    }
    // zvětšený náhled položky vedle seznamu (na telefonu nad ním)
    function showBig(i) {
      if (!picker) return;
      var el = picker.el, kind = picker.kind, inf = slotInfo(kind, i), big = el.querySelector('.kp-pick-big');
      picker.i = i;
      cancelAnimationFrame(picker.raf);
      el.querySelectorAll('.kp-pick-list li').forEach(function (li) { li.classList.toggle('hot', +li.dataset.i === i); });
      var art = kind === 'bg'
        ? (BGS[i] === 'tma' ? '<div class="kp-big-bg tma"></div>' : '<img class="kp-big-bg" src="/kevin/pong/pozadi-' + BGS[i] + '.webp' + ver + '" alt="">')
        : kind === 'celeb' ? '<span class="kp-big-celeb">' + thumbInner(kind, i) + '</span>'
        : '<canvas class="kp-big-cv ' + kind + '"></canvas>';
      var pr = !inf.ok && badgeProgress(inf.b), key = kind === 'celeb' ? celebOpts()[i] : null;
      big.innerHTML = '<div class="kp-big-obj">' + art + (inf.ok ? '' : '<i class="fa-solid fa-lock kp-item-lockicon" aria-hidden="true"></i>') + '</div>' +
        '<h3>' + esc(inf.name || '') + '</h3>' +
        (inf.ok ? '' : '<p class="kp-item-lock"><i class="fa-solid fa-lock" aria-hidden="true"></i> ' + esc(lockText(inf.b)) + '</p>' +
          (pr ? '<p class="kp-item-prog"><span>' + esc((T.progressUnits || {})[pr.unit] || '') + '</span><b>' + pr.have + ' / ' + pr.need + '</b><i style="--p:' + Math.round(pr.have / pr.need * 100) + '%"></i></p>' : '')) +
        (key === 'auto' || key === 'off' ? '<p class="kp-bgname">' + esc(T.celebHint || '') + '</p>' : '') +
        '<div class="kp-big-acts">' +
        (key && CELEBS[key] ? '<button type="button" class="kp-fullbtn kp-big-play"><i class="fa-solid fa-play" aria-hidden="true"></i> ' + esc(T.pickPlay || '') + '</button>' : '') +
        (kind !== 'celeb' ? '<button type="button" class="kp-fullbtn kp-big-look"><i class="fa-solid fa-magnifying-glass-plus" aria-hidden="true"></i> ' + esc(T.pickInspect || '') + '</button>' : '') +
        (inf.on ? '<span class="kp-big-using"><i class="fa-solid fa-check" aria-hidden="true"></i> ' + esc(T.itemUsing || '') + '</span>' : '') + '</div>';
      var play = big.querySelector('.kp-big-play');
      if (play) play.addEventListener('click', function () { previewCeleb(key); });
      var look = big.querySelector('.kp-big-look');
      if (look) look.addEventListener('click', function () { closePicker(); openItem(kind, i); });
      var cv = big.querySelector('.kp-big-cv');
      if (cv) {
        fitCanvas(cv);
        var t0 = performance.now(), el0 = el;
        (function tick(now) {
          if (!picker || picker.el !== el0 || picker.i !== i) return;
          paintObj(cv, kind, i, (now - t0) / 1000);
          picker.raf = requestAnimationFrame(tick);
        })(t0);
      }
    }
    function choose(i) {
      if (!picker) return;
      var kind = picker.kind, inf = slotInfo(kind, i), li = picker.el.querySelector('li[data-i="' + i + '"]');
      showBig(i);
      if (!inf.ok) {                                      // zamčené: jen náhled, zatřese se
        li.classList.remove('nope'); void li.offsetWidth; li.classList.add('nope');
        return;
      }
      if (kind === 'celeb') { celebPick = celebOpts()[i]; store.set('kevinPongCeleb', celebPick); refreshSlot('celeb'); }
      else useItem(kind, i);
      picker.el.querySelectorAll('.kp-pick-list li').forEach(function (x) { x.setAttribute('aria-selected', String(+x.dataset.i === i)); });
      if (picker.side) { var sl = picker.slot; closePicker(); sl.focus({ preventScroll: true }); }
      else showBig(i);
    }
    // ukázka oslavy: nastavení na chvíli zmizí, přes hřiště se přehraje oslava a nastavení se vrátí
    function previewCeleb(key) {
      if (!CELEBS[key]) return;
      closePicker();
      root.classList.add('kp-peeking');
      celebrate(CELEBS[key]);
      setTimeout(function () { root.classList.remove('kp-peeking'); }, 3400);
    }
    function celebKind() {
      if (celebPick === 'off') return null;
      if (CELEBS[celebPick] && hasBadge(celebPick)) return CELEBS[celebPick];
      var last = store.get('kevinPongCelebLast');
      if (last && CELEBS[last] && hasBadge(last)) return CELEBS[last];
      var own = Object.keys(CELEBS).filter(function (k) { return hasBadge(k); });
      return own.length ? CELEBS[own[own.length - 1]] : null;
    }
    // Animace jsou hotové z LottieFiles (kevin/pong/oslavy/, licence Lottie Simple License – viz LICENCE.txt), přehrává je
    // lottie-web (js/vendor/lottie_light.min.js, načte se až při první oslavě). K legendární oslavě patří záblesk, otřes
    // automatu a nápis VÍTĚZSTVÍ!; obyčejná výhra = malý ohňostroj. Po výbuchu (Noční můra) Kevinova pálka zmizí až do
    // dalšího zápasu.
    var CELEB_ANIM = { crown: ['koruna'], bolt: ['blesk1', 'blesk2'], shatter: ['vybuch'], target: ['ohnostroj2'], phoenix: ['ohnostroj3'], win: ['ohnostroj1'] };
    var kevinPadGone = false, lottieWait = null;
    function loadLottie(done) {
      if (window.lottie) return done(window.lottie);
      if (lottieWait) return lottieWait.push(done);
      lottieWait = [done];
      var sc = document.createElement('script');
      sc.src = '/js/vendor/lottie_light.min.js' + ver;
      sc.onload = function () { var w = lottieWait; lottieWait = null; w.forEach(function (f) { f(window.lottie); }); };
      sc.onerror = function () { lottieWait = null; };
      document.head.appendChild(sc);
    }
    function celebrate(force) {
      if (!force && celebPick === 'off') return;
      var kind = force || celebKind() || 'win', names = CELEB_ANIM[kind];
      if (!names || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var box = document.createElement('div'), big = kind !== 'win', alive = true;
      box.className = 'kp-celeb kp-celeb-' + kind;
      field.appendChild(box);
      if (big) {
        box.innerHTML = '<i class="kp-celeb-flash"></i><b class="kp-celeb-text">' + esc(T.victory || '') + '</b>';
        machine.classList.remove('kp-quake'); void machine.offsetWidth; machine.classList.add('kp-quake');
        vibe([60, 40, 120]);
      }
      if (kind === 'shatter') setTimeout(function () { kevinPadGone = true; }, 220);
      setTimeout(function () { alive = false; box.remove(); }, big ? 4200 : 2200);
      loadLottie(function (lottie) {
        names.forEach(function (n, i) {
          setTimeout(function () {
            if (!alive) return;
            var el = document.createElement('div');
            el.className = 'kp-lottie kp-lottie-' + n;
            if (n === 'vybuch') { el.style.left = (kevin.x / W * 100).toFixed(1) + '%'; el.style.top = (KEVIN_Y / H * 100).toFixed(1) + '%'; }
            box.appendChild(el);
            var an = lottie.loadAnimation({ container: el, renderer: 'svg', loop: n.indexOf('ohnostroj') === 0, autoplay: true, path: '/kevin/pong/oslavy/' + n + '.json' + ver });
            if (n === 'vybuch') an.setSpeed(0.55);                // výbuch je krátký – zpomaleně víc vynikne
            an.addEventListener('complete', function () { el.remove(); });
          }, i * 450);
        });
      });
    }
    if (TRY_HOST) window.__kpCeleb = function (k) { celebrate(k); };   // test: přehrát oslavu
    // jméno v tabulce = odkaz na veřejný profil (/hrac/jméno), jen když ho hráč nemá skrytý; profil se otevře
    // normálním načtením stránky, aby hra nezůstala navrchu (PJAX by vyměnil jen obsah pod ní)
    function profName(r) { return r.pub ? '<a class="kp-prof" href="/hrac/' + encodeURIComponent(r.name) + '">' + esc(r.name) + '</a>' : esc(r.name); }
    root.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a.kp-prof');
      if (!a) return;
      e.preventDefault(); location.href = a.href;
    });
    if (TRY_HOST) window.__kpStreak = function (n) { if (n) streakPop(n); else streakEnd(true); };   // test: cedulka série (0 = rozlomit)
    if (TRY_HOST) window.__kpTutEnd = function () { if (tut) tutDone(); };   // test: dokončit výuku
    function closeSettings() {
      if (!setCard) return;
      closePicker();
      setCard.remove(); setCard = null;
      setBtn.setAttribute('aria-expanded', 'false');
      if (setPausedGame) askToResume();
      setPausedGame = false;
    }
    // ---------- menu hry (tlačítko MENU na automatu) ----------
    // Během zápasu hru pozastaví: Pokračovat, Začít znovu, Zpět do menu (změnit obtížnost / délku – rozehraný zápas
    // se nezapíše), Nastavení, Prohlídka automatu (telefon), Ukončit hru. V menu hry jen Nastavení, Prohlídka, Ukončit.
    var menuEl = null, menuPaused = false;
    function openMenu() {
      if (menuEl) return closeMenu(true);
      if (setCard) return closeSettings();
      if (mosq.active || replay) return;
      releaseMouse();
      var inGame = running && !panelShown();
      menuPaused = running && !paused;
      if (menuPaused) paused = true;
      Object.keys(comics).forEach(function (k) { if (comics[k]) { comics[k].remove(); comics[k] = null; } });
      var phoneNow = machine.classList.contains('phone');
      var items = (inGame ? [['resume', 'fa-play', T.resume], ['restart', 'fa-rotate-right', T.restart], ['back', 'fa-list', T.menuBack]] : [])
        .concat([['style', 'fa-palette', T.tabLook], ['settings', 'fa-gear', T.settings]], phoneNow ? [['look', 'fa-magnifying-glass', T.lookBtn]] : [], [['quit', 'fa-xmark', T.close]]);
      menuEl = document.createElement('div');
      menuEl.className = 'kp-support-card kp-menu-card';
      menuEl.setAttribute('role', 'dialog'); menuEl.setAttribute('aria-label', T.menuTitle || '');
      menuEl.innerHTML = '<div class="kp-sc-box"><h3><i class="fa-solid fa-pause" aria-hidden="true"></i> ' + esc(inGame ? T.menuTitle || '' : T.menuBtn || '') + '</h3>' +
        items.map(function (x, n) {
          return '<button type="button" class="' + (n === 0 && inGame ? 'kpong-play btn-primary' : 'kp-fullbtn') + ' kp-menu-' + x[0] + '" data-m="' + x[0] + '"><i class="fa-solid ' + x[1] + '" aria-hidden="true"></i> ' + esc(x[2] || '') + '</button>';
        }).join('') + '</div>';
      root.appendChild(menuEl);
      setBtn.setAttribute('aria-expanded', 'true');
      menuEl.addEventListener('click', function (e) {
        if (e.target === menuEl) return closeMenu(true);
        var b = e.target.closest('[data-m]');
        if (!b) return;
        var m = b.dataset.m;
        if (m === 'resume') return closeMenu(true);
        closeMenu(false);
        if (m === 'restart') { menuPaused = false; return restartMatch(); }
        if (m === 'back') return toMenu();
        if (m === 'quit') return close();
        // nastavení a prohlídka si hru pozastaví samy a po zavření se zeptají na pokračování
        if (paused && menuPaused) paused = false;
        menuPaused = false;
        if (m === 'settings') openSettings(); else if (m === 'style') openSettings('look'); else if (m === 'look') openLook();
      });
      menuEl.querySelector('[data-m]').focus({ preventScroll: true });
    }
    function closeMenu(resume) {
      if (!menuEl) return;
      menuEl.remove(); menuEl = null;
      setBtn.setAttribute('aria-expanded', 'false');
      if (resume && menuPaused) askToResume();
      if (resume) menuPaused = false;
    }
    function panelShown() { return !panel.hidden; }
    // Zpět do menu: rozehraný zápas zahodit (nic se nezapíše) a ukázat úvodní menu (obtížnost, délka…)
    function toMenu() {
      running = false; paused = false; awaitStart = false; menuPaused = false;
      stick.active = null; powers = {}; player.w = PAD_W; hitStop = 0;
      root.classList.remove('kp-bullet', 'final', 'hot', 'stick-armed');
      you = 0; kev = 0; youEl.textContent = '0'; kevEl.textContent = '0'; bigScore();
      if (K) { K.hold(null); K.look(0, 0); }
      startScreen();
    }
    setBtn.addEventListener('click', openMenu);
    document.addEventListener('fullscreenchange', onFull);
    document.addEventListener('webkitfullscreenchange', onFull);

    function close() {
      releaseMouse();
      Z.close();
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
      clearTimeout(underTimer);
      document.documentElement.classList.remove('kpong-open', 'kpong-under');
      window.KevinPong.isOpen = false;
      if (opts.onClose) opts.onClose();
    }

    // ---------- pomocníci ----------
    function post(url, data) {
      var body = new URLSearchParams(); Object.keys(data).forEach(function (k) { body.set(k, data[k]); });
      return fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'X-CSRF-Token': csrf || '' }, body: body }).then(function (r) { return r.json(); });
    }
    // ---------- plynulost: když počítač nestíhá (dlouhé snímky), hra sama ubere ozdoby ----------
    // lowFx 1 = bez stínů a záře na hřišti, bez života v pozadí, méně částic; 2 = navíc bez atmosféry pálky;
    // 3 (jen ručně „Nízké“) = navíc bez stopy letu a velkých efektů odstřelu, Kevin méně ostrý
    var lowFx = 0, frameAvg = 16.7, lowFxAt = 0, lateShare = 0;
    // volba v ⚙ Ovládání → Detaily (localStorage kevinPongDetail): auto = hra ubírá sama, jinak pevně
    var DETAIL_KEYS = ['auto', 'high', 'mid', 'low'], DETAIL_FX = { auto: 0, high: 0, mid: 1, low: 3 };
    var detail = DETAIL_KEYS.indexOf(store.get('kevinPongDetail')) >= 0 ? store.get('kevinPongDetail') : 'auto';
    function noShadows(off) {                            // stíny jsou na slabé grafice nejdražší: na hřišti je vypnout
      try {
        var hc = court.getContext('2d');                 // hřiště (cx se na chvíli půjčuje náhledům v ⚙)
        if (off) Object.defineProperty(hc, 'shadowBlur', { configurable: true, get: function () { return 0; }, set: function () {} });
        else delete hc.shadowBlur;                       // zpátky na běžné stíny plátna
      } catch (e) { /* nevadí */ }
    }
    function kevinSharpness() { return detail === 'low' ? 1 : detail === 'mid' ? 1.25 : 0; }   // 0 = výchozí
    function applyDetail() {
      lowFx = DETAIL_FX[detail];
      noShadows(lowFx >= 1);
      if (fx) fxc.clearRect(0, 0, fx.width, fx.height);
      if (lowFx >= 2) apfx = [];
      if (K && K.setMaxPixelRatio) K.setMaxPixelRatio(kevinSharpness());
      frameAvg = 16.7; lowFxAt = performance.now();
    }
    if (detail !== 'auto') applyDetail();
    function watchSmooth(ms, now) {
      if (detail !== 'auto') return;
      frameAvg = frameAvg * 0.95 + ms * 0.05;
      // škubání poznat i podle zpožděných snímků (průměr může být v pořádku, oko ale každý zpožděný snímek vidí)
      lateShare = lateShare * 0.98 + (ms > 24 ? 0.02 : 0);
      if ((frameAvg > 25 || lateShare > 0.12) && lowFx < 2 && now - lowFxAt > 3000 && now - started > 4000) {
        lowFx++; lowFxAt = now; frameAvg = 18; lateShare = 0;
        if (lowFx === 1) { noShadows(true); if (fx) fxc.clearRect(0, 0, fx.width, fx.height); }
      }
    }
    // ---------- načtení předem: stroj, kola, pálky, míčky, pozadí a Kevin – až pak menu (ať se nezačne hrát škubavě) ----------
    function preload() {
      var urls = [].slice.call(root.querySelectorAll('img')).map(function (i) { return i.currentSrc || i.src; })
        .concat(['/kevin/pong/hopik.webp' + ver, '/kevin/pong/palky.webp' + ver, '/kevin/pong/micky.webp' + ver]);
      var bgm = (getComputedStyle(bgEl).backgroundImage || '').match(/url\("?([^")]+)"?\)/);
      if (bgm) urls.push(bgm[1]);
      urls = urls.filter(function (u, i) { return u && urls.indexOf(u) === i; });
      var done = 0, total = urls.length + 1, bar = panel.querySelector('.kp-load span');
      function tick() { done++; if (bar) bar.style.width = Math.round(done / total * 100) + '%'; }
      var imgs = urls.map(function (u) {
        var im = new Image(); im.src = u;
        return (im.decode ? im.decode() : new Promise(function (r) { im.onload = r; })).catch(function () {}).then(tick);
      });
      var kev = Promise.race([kevinLoaded, new Promise(function (r) { setTimeout(r, 6000); })]).then(tick);
      return Promise.race([Promise.all(imgs.concat([kev])), new Promise(function (r) { setTimeout(r, 12000); })])
        .then(function () { return new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); }); });
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
    // nejdřív načíst všechno (ukazatel na skle stroje), pak menu
    panel.hidden = false; panel.dataset.view = 'main';
    panel.innerHTML = '<div class="kp-view kp-main kp-loading"><h2 class="kpong-title kp-logo"><img src="/kevin/pong/menu/logo.webp' + ver + '" alt="' + esc(T.title) + '" width="900" height="277"></h2><div class="kp-load"><span></span></div>' +
      '<p class="kp-bdg-rule">' + esc(T.loading || '') + '</p></div>';
    preload().then(function () {
      if (!window.KevinPong.isOpen || !panel.querySelector('.kp-loading')) return;
      startScreen();
      if (opts.view === 'top') panel.dataset.view = 'top';     // odkaz „Tabulka rekordů“ z úvodu
    });
    root.querySelector('.kpong-close').focus();
  }

  window.KevinPong = { open: open, isOpen: false };
})();
