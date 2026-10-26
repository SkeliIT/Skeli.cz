// Kevin Pong – pinkání s MC Kevinem do 10 gólů (otevírá se z Kevinova menu: „Zahraj si se mnou“).
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
  var W = 600, H = 900, PAD_W = 124, PAD_H = 16, BALL_R = 12, WIN = 10;
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
    1: { speed: 490, gain: 1.03, max: 1000, react: 0.26, err: 0.11, bounceErr: 0.6, watch: 0.6, aiSpeed: 340, aim: 0.1 },
    2: { speed: 580, gain: 1.04, max: 1250, react: 0.15, err: 0.065, bounceErr: 0.5, watch: 0.75, aiSpeed: 520, aim: 0.35 },
    3: { speed: 700, gain: 1.05, max: 1650, react: 0.045, err: 0.02, bounceErr: 0.3, watch: 1, aiSpeed: 1000, aim: 0.85 }
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
      '    <button type="button" class="kpong-set" aria-label="' + esc(T.settings || 'Settings') + '" aria-haspopup="dialog"><i class="fa-solid fa-gear" aria-hidden="true"></i></button>' +
      '    <button type="button" class="kpong-close" aria-label="' + esc(T.close) + '"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
      '  </div>' +
      '  <div class="kpong-machine"><div class="kpong-frame">' +
      '    <canvas class="kpong-mech" data-win="top" style="' + winVars(WIN_TOP) + '" aria-hidden="true"></canvas>' +
      '    <canvas class="kpong-mech" data-win="bot" style="' + winVars(WIN_BOT) + '" aria-hidden="true"></canvas>' +
      '    <div class="kpong-gears" data-set="kevin">' + GEARS_KEVIN.map(gear).join('') + '</div>' +
      '    <i class="kpong-slot" aria-hidden="true"></i>' +
      '    <i class="kpong-spk" data-side="l" aria-hidden="true"></i><i class="kpong-spk" data-side="r" aria-hidden="true"></i>' +
      '    <canvas class="kpong-kevin" aria-hidden="true"></canvas>' +
      '    <div class="kpong-field">' +
      '      <div class="kpong-bg" aria-hidden="true"></div><canvas class="kpong-bgfx" aria-hidden="true"></canvas>' +
      '      <canvas class="kpong-court" width="600" height="900" aria-hidden="true"></canvas>' +
      '    </div>' +
      '  </div></div>' +
      '  <div class="kpong-pad"><button type="button" class="kpong-shot"><i class="fa-solid fa-bolt" aria-hidden="true"></i> ' + esc(T.shot || 'Odstřel') + '</button></div>' +
      '</div>' +
      '<div class="kpong-panel"></div><p class="sr-only kpong-live" aria-live="polite"></p>';   // úvod a konec: karta uprostřed obrazovky před strojem
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

    // ---------- pozadí a jeho život ----------
    var bgEl = root.querySelector('.kpong-bg'), fx = root.querySelector('.kpong-bgfx'), fxc = fx.getContext('2d');
    var bgName = store.get('kevinPongBg'), still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // kdo si ještě nevybral, dostane při každé hře náhodný obrázek (volba v ⚙ se pak pamatuje)
    var bgPicked = BGS.indexOf(bgName) >= 0;
    if (!bgPicked) bgName = BGS[1 + Math.floor(Math.random() * (BGS.length - 1))];
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
      el.className = 'kp-comic ' + kind + ' ' + side + (out ? ' out' : ' in');
      el.innerHTML = (kind !== 'say' ? burstSvg() : '') + '<span>' + esc(text) + '</span>';
      el.style.top = Math.round(r.top + r.height / 2) + 'px';
      // bublina leží vlevo od reproduktoru (levý ven, pravý dovnitř) nebo vpravo od něj (levý dovnitř, pravý ven)
      if ((side === 'l') === out) el.style.right = Math.round(innerWidth - r.left + 4) + 'px';
      else el.style.left = Math.round(r.right + 4) + 'px';
      el.style.maxWidth = Math.round(out ? Math.min(room - 16, 300) : Math.min(260, machine.offsetWidth * 0.72)) + 'px';
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
      var now = performance.now();
      if (!force && now - lastQuip < 2200) return false;
      if (chance < 1 && Math.random() > chance) return false;
      var t = line(key, fallback);
      if (!t) return false;
      lastQuip = now;
      say(t, ms || Math.min(4200, 1800 + t.length * 30));
      return true;
    }
    function showFlash(f) { comic('l', 'burst ' + f.kind, f.text, f.kind === 'super' ? 1700 : 1300); }
    function say(t, ms) {
      if (!t) return;
      comic('r', 'say', t, ms || 2600);
      if (K) { K.setTalking(true); setTimeout(function () { if (K) K.setTalking(false); }, Math.min(2200, 600 + t.length * 45)); }
    }

    // ---------- stav hry ----------
    var level = +(store.get('kevinPongLevel') || 2), L = LEVELS[level];
    var you = 0, kev = 0, running = false, paused = false, started = 0, serveAt = 0, serving = 1;
    var player = { x: W / 2, target: W / 2, shotAt: -1e9, shotUsed: true, stunUntil: 0, lastHit: -1e9, boosted: false };
    var kevin = { x: W / 2, target: W / 2, nextThink: 0, moving: 0, miss: 0 };
    var ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, speed: 0, trail: [], fire: false, mishit: false };
    var combo = 0, hitStop = 0, flash = null, awaitStart = false, pausedMs = 0;
    var gamesPlayed = 0, streakP = 0, streakK = 0, maxDown = 0, comebackSaid = false, rally = 0, fastSaid = false;
    var lastTarget = 0, lastMoveAt = 0, idleSaid = false;
    var coarse = window.matchMedia('(pointer: coarse)').matches;
    // komár: náhodná událost, přiletí zhruba v každém třetím zápase; ?komar=1 nebo #komar v adrese = vždy (na zkoušení)
    var MOSQUITO_CHANCE = /[?&]komar=1(&|$)/.test(location.search) || location.hash === '#komar' ? 1 : 0.35;
    var mosq = { done: false, active: false };
    var keys = { left: false, right: false }, raf = 0, last = 0, signedIn = false, csrf = null;

    function resetBall(towardPlayer) {
      ball.x = W / 2; ball.y = H / 2; ball.trail = [];
      ball.speed = L.speed;
      var a = (Math.random() * 0.6 - 0.3);
      ball.vx = Math.sin(a) * ball.speed;
      ball.vy = (towardPlayer ? 1 : -1) * Math.cos(a) * ball.speed;
      ball.fire = false; ball.mishit = false; ball.perfect = false; player.boosted = false; rally = 0; fastSaid = false;
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
      kevin.miss = gauss() * L.err * W * (1 + L.bounceErr * walls) * Math.max(1, ball.speed / L.speed);
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
      player.boosted = true;
      ball.speed *= mult; ball.vx *= mult; ball.vy *= mult;
      aimError();
      flash = { kind: kind, text: T.shots ? T.shots[kind] : kind, at: now };
      showFlash(flash);
      if (kind === 'perfect' || kind === 'super') {
        hitStop = now + (kind === 'super' ? 160 : 100);
        if (navigator.vibrate) try { navigator.vibrate(kind === 'super' ? [30, 40, 60] : 35); } catch (e) { /* nevadí */ }
      }
      field.classList.remove('shot', 'shot-super'); void field.offsetWidth; field.classList.add(kind === 'super' ? 'shot-super' : 'shot');
      ball.perfect = kind === 'perfect' || kind === 'super';
      if (kind === 'super') quip('odstrel_super', 1, null, 0, true);
      else if (kind === 'perfect') quip('odstrel_perfekt', 0.45);
      else quip('odstrel_dobry', 0.25);
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
      quip('odstrel_pokazeny', 0.35);
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
      quip('trest', 0.7, null, 0, true);
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
        var u = parseFloat(frame.style.getPropertyValue('--u')) || 0.5;
        el.classList.remove('behind'); el.classList.add('hit');
        el.animate([{ transform: 'translate(-50%, -50%) rotate(0deg)' }, { transform: 'translate(-50%, calc(-50% + ' + Math.round(900 * u) + 'px)) rotate(200deg)', opacity: 0 }],
          { duration: 1300, easing: 'cubic-bezier(.5, 0, .9, .6)', fill: 'forwards' });
        if (navigator.vibrate) try { navigator.vibrate(25); } catch (e) { /* nevadí */ }
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
      if (running && (paused || awaitStart)) pausedMs += real;   // pauzy, komár, nastavení, čekání na ťuknutí
      if (!running || paused) { draw(now); return; }
      // zastavení času po perfektním odstřelu: všechno stojí, jen se kreslí
      if (now < hitStop) { draw(now); return; }
      // hráč se 10 s nehne (ne při čekání na start) a vzácná hláška zhruba jednou za minutu ticha
      if (Math.abs(player.target - lastTarget) > 1) { lastTarget = player.target; lastMoveAt = now; idleSaid = false; }
      if (!awaitStart && !idleSaid && now - lastMoveAt > 10000) { idleSaid = true; quip('nehybe_se', 1); }
      if (!awaitStart && now - lastQuip > 9000 && Math.random() < dt / 60) quip('vzacne', 1);
      // komár: přiletí jednou za zápas, nejdřív po 6 s hry a jen když míček letí k hráči (Kevin má volno)
      if (!mosq.done && now - started > 6000 && now >= serveAt) mosquito();
      // odstřel naprázdno: pálka chvíli „ve vzduchu“ – pomalejší a kombo je pryč
      if (!player.shotUsed && now - player.shotAt > 260) { player.shotUsed = true; player.stunUntil = now + 300; combo = 0; }
      // hráč: prst / myš (přímo) nebo šipky
      if (keys.left) player.target -= 900 * dt;
      if (keys.right) player.target += 900 * dt;
      player.target = clamp(player.target, PAD_W / 2, W - PAD_W / 2);
      player.x += (player.target - player.x) * Math.min(1, dt * (now < player.stunUntil ? 7 : 30));
      // Kevin: přemýšlí jednou za „react“, cíl = kam přiletí míč (+ chyba); na těžké míří do protirohu
      if (now / 1000 >= kevin.nextThink) {
        kevin.nextThink = now / 1000 + L.react;
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
      var dx = kevin.target - kevin.x, maxStep = L.aiSpeed * dt;
      kevin.moving = Math.abs(dx) > 4 ? Math.sign(dx) : 0;
      kevin.x += clamp(dx, -maxStep, maxStep);
      // míč
      if (now >= serveAt) {
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        ball.trail.push([ball.x, ball.y]); if (ball.trail.length > 10) ball.trail.shift();
        if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx); }
        if (ball.x > W - BALL_R) { ball.x = W - BALL_R; ball.vx = -Math.abs(ball.vx); }
        // pálka hráče (při odstřelu zvednutá)
        var py = PLAYER_Y - liftAt(now);
        if (ball.vy > 0 && ball.y + BALL_R >= py - PAD_H / 2 && ball.y < py + PAD_H && Math.abs(ball.x - player.x) <= PAD_W / 2 + BALL_R) {
          bounce(player.x, -1, py);
          player.lastHit = now; player.boosted = false; rallyTick();
          if (!player.shotUsed) boost(Math.abs(now - player.shotAt - SHOT_IDEAL), now);
          else if (now < player.stunUntil + 200) mishit(now);      // pálka se po odstřelu naprázdno ještě nevzpamatovala
          else { combo = 0; aimError(); }
        }
        // Kevinova pálka
        if (ball.vy < 0 && ball.y - BALL_R <= KEVIN_Y + PAD_H / 2 && ball.y > KEVIN_Y - PAD_H && Math.abs(ball.x - kevin.x) <= PAD_W / 2 + BALL_R) {
          bounce(kevin.x, 1);
          ball.fire = false;
          if (ball.perfect) { ball.perfect = false; quip('odstrel_chycen', 0.6); }
          if (ball.mishit) punish();
          rallyTick();
        }
        if (ball.y > H + BALL_R * 2) goal(false);
        else if (ball.y < KEVIN_Y - 70) goal(true);
      }
      animateKevin(dt);
      draw(now);
    }

    function bounce(px, dir, py) {
      var off = clamp((ball.x - px) / (PAD_W / 2), -1, 1), a = off * 1.05;   // až ±60°
      ball.speed = Math.min(L.max, ball.speed * L.gain);
      ball.vx = Math.sin(a) * ball.speed;
      ball.vy = dir * Math.cos(a) * ball.speed;
      ball.y = dir < 0 ? (py || PLAYER_Y) - PAD_H / 2 - BALL_R - 1 : KEVIN_Y + PAD_H / 2 + BALL_R + 1;
      field.classList.remove('hit'); void field.offsetWidth; field.classList.add('hit');
    }

    function goal(byPlayer) {
      if (byPlayer) { you++; youEl.textContent = you; } else { kev++; kevEl.textContent = kev; }
      bump(byPlayer ? youEl : kevEl);
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
      else quip(byPlayer ? 'gol_hrac' : 'gol_kevin', 0.55, byPlayer ? T.conceded : T.scored);
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
      if (rally === 10) quip('dlouha_vymena', 1);
      else if (!fastSaid && ball.speed > L.max * 0.92) { fastSaid = true; quip('rychly_hopik', 0.5); }
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
      var newBest = playerWon && best && ms < best;               // nepřihlášený: rekord v prohlížeči
      var send = playerWon && signedIn ? post('/api/pong/win', { d: level, ms: ms, kevin: kev }) : Promise.resolve(null);
      send.then(function (res) {
        if (newBest || (res && res.ok && res.best === ms)) setTimeout(function () { quip('rekord', 1, null, 3600, true); }, 4400);
        endScreen(playerWon, ms, res && res.ok ? res : null);
      }).catch(function () { endScreen(playerWon, ms, null); });
    }

    // ---------- obrazovky (start, konec) a tabulka ----------
    function startScreen() {
      panel.hidden = false;
      // bloky: nadpis · obtížnost · Hrát · ovládání (3 dlaždice + rada k odstřelu) · tabulka
      var icons = ['fa-arrows-left-right', 'fa-bolt', 'fa-pause'];
      var controls = T.controls ? '<ul class="kp-controls">' + T.controls.map(function (c, i) {
          return '<li><i class="fa-solid ' + icons[i] + '" aria-hidden="true"></i><b>' + esc(c[0]) + '</b><span>' + esc(c[1]) + '</span></li>';
        }).join('') + '</ul><p class="kp-hint">' + esc(T.shotHint) + '</p>' : '<p class="kpong-help">' + esc(T.help) + '</p>';
      panel.innerHTML = '<header class="kp-head"><h2 class="kpong-title">' + esc(T.title) + '</h2><p class="kpong-lead">' + esc(T.lead) + '</p></header>' +
        '<section class="kp-sec"><h3 class="kp-label">' + esc(T.level) + '</h3>' +
        '<div class="kpong-levels" role="group" aria-label="' + esc(T.level) + '">' + [1, 2, 3].map(function (d) {
          return '<button type="button" class="kpong-level' + (d === level ? ' on' : '') + '" data-d="' + d + '"><b>' + esc(T.levels[d - 1]) + '</b><small>' + esc(T.levelHints[d - 1]) + '</small></button>';
        }).join('') + '</div></section>' +
        '<button type="button" class="kpong-play btn-primary"><i class="fa-solid fa-play" aria-hidden="true"></i> ' + esc(T.play) + '</button>' +
        '<section class="kp-sec"><h3 class="kp-label">' + esc(T.controlsTitle || '') + '</h3>' + controls + '</section>' +
        '<section class="kp-sec kpong-board"></section>';
      panel.querySelectorAll('.kpong-level').forEach(function (b) {
        b.addEventListener('click', function () {
          level = +b.dataset.d; L = LEVELS[level]; store.set('kevinPongLevel', String(level));
          panel.querySelectorAll('.kpong-level').forEach(function (x) { x.classList.toggle('on', x === b); });
          board(level);
        });
      });
      panel.querySelector('.kpong-play').addEventListener('click', begin);
      board(level);
      say(pick(T.hello), 3000);
    }

    function board(d) {
      var box = panel.querySelector('.kpong-board');
      if (!box) return;
      box.innerHTML = '<h3 class="kp-label">' + esc(T.board) + ' · ' + esc(T.levels[d - 1]) + '</h3><p class="kpong-note">…</p>';
      fetch('/api/pong/top?d=' + d, { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (j) {
        signedIn = !!j.signedIn; csrf = j.csrf || null;
        var rows = (j.top || []).map(function (r) {
          return '<li class="' + (r.me ? 'me' : '') + '"><span class="kpong-place">' + r.place + '.</span>' +
            '<img src="' + esc(r.avatar || '/img/avatar-default.svg') + '" alt="" width="24" height="24" loading="lazy">' +
            '<span class="kpong-name">' + esc(r.name) + '</span><span class="kpong-time">' + time(r.ms) + '</span><span class="kpong-kgoals">' + r.kevin + ' ' + esc(T.kevinGoals) + '</span></li>';
        }).join('');
        var mine = j.me ? '<p class="kpong-note">' + esc(T.yourBest.replace('{place}', j.me.place).replace('{time}', time(j.me.ms))) + '</p>' : '';
        var local = +(store.get('kevinPongBest' + d) || 0);
        var guest = !signedIn ? '<p class="kpong-note">' + esc(T.loginToRank) + ' <a href="/login.jsp?next=' + encodeURIComponent(location.pathname + location.search) + '">' + esc(T.login) + '</a>' +
          (local ? ' · ' + esc(T.localBest.replace('{time}', time(local))) : '') + '</p>' : '';
        box.innerHTML = '<h3 class="kp-label">' + esc(T.board) + ' · ' + esc(T.levels[d - 1]) + '</h3>' +
          (rows ? '<ol class="kpong-list">' + rows + '</ol>' : '<p class="kpong-note">' + esc(T.empty) + '</p>') + mine + guest;
      }).catch(function () { box.innerHTML = '<p class="kpong-note">' + esc(T.boardFail) + '</p>'; });
    }

    function endScreen(won, ms, res) {
      panel.hidden = false;
      var line = won ? T.winTime.replace('{time}', time(ms)) : T.loseLine;
      if (won && res) line += ' ' + T.place.replace('{place}', res.place);
      panel.innerHTML = '<h2 class="kpong-title">' + esc(won ? T.winTitle : T.loseTitle) + '</h2>' +
        '<p class="kpong-final">' + you + ' : ' + kev + '</p><p class="kpong-lead">' + esc(line) + '</p>' +
        '<button type="button" class="kpong-play btn-primary"><i class="fa-solid fa-rotate-right" aria-hidden="true"></i> ' + esc(T.again) + '</button>' +
        '<button type="button" class="kpong-back">' + esc(T.changeLevel) + '</button>' +
        '<section class="kp-sec kpong-board"></section>';
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
      running = true; awaitStart = 'start';            // první hopík vyletí, až hráč ťukne / klikne / zmáčkne mezerník
      resetBall(Math.random() < 0.5);
      streakP = streakK = maxDown = 0; comebackSaid = false; lastMoveAt = performance.now(); idleSaid = false;
      quip(gamesPlayed > 0 ? 'odveta' : level === 3 ? 'start_3' : 'start', 1, T.start, 2800, true);
      gamesPlayed++;
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
      pad(kevin.x, KEVIN_Y, '#e6b730', '#8f6600');
      var lift = liftAt(now);
      if (lift > 0) { cx.shadowColor = 'rgba(230,183,48,.9)'; cx.shadowBlur = 24 * lift / LIFT; }
      pad(player.x, PLAYER_Y - lift, light ? '#2a2a30' : '#f2f2f4', light ? '#000' : '#9a9aa4');
      cx.shadowBlur = 0;
      // míč: zlatý hopík se stopou
      if (running && now >= serveAt) {
        ball.trail.forEach(function (p, i) {
          cx.globalAlpha = (i + 1) / ball.trail.length * 0.25;
          cx.fillStyle = ball.fire ? (i % 2 ? '#ff6a00' : '#ffb02e') : player.boosted && ball.vy < 0 ? '#fff3b0' : '#e6b730';
          cx.beginPath(); cx.arc(p[0], p[1], BALL_R * (ball.fire ? 0.9 + i / 12 : 0.5 + i / 20), 0, 7); cx.fill();
        });
        cx.globalAlpha = 1;
      }
      if (running) {
        var g = cx.createRadialGradient(ball.x - 4, ball.y - 5, 2, ball.x, ball.y, BALL_R);
        g.addColorStop(0, '#fff3b0'); g.addColorStop(0.45, '#e6b730'); g.addColorStop(1, '#6b4a00');
        cx.fillStyle = g; cx.beginPath(); cx.arc(ball.x, ball.y, BALL_R, 0, 7); cx.fill();
        cx.lineWidth = 2.5; cx.strokeStyle = 'rgba(25, 14, 0, .8)'; cx.stroke();   // tmavý obrys: hopík je vidět i na barevném pozadí
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
    function pad(x, y, c1, c2) {
      var g = cx.createLinearGradient(0, y - PAD_H / 2, 0, y + PAD_H / 2);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      cx.fillStyle = g;
      roundRect(x - PAD_W / 2, y - PAD_H / 2, PAD_W, PAD_H, PAD_H / 2);
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
      if (!running) return;
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
      player.target = clamp(toField(e), PAD_W / 2, W - PAD_W / 2); e.preventDefault();
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
      var i = setCard && setCard.querySelector('.kp-fullbtn i');
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
          return '<button type="button" role="radio" class="kp-bgopt" data-bg="' + b + '" aria-checked="' + (b === bgName) + '" title="' + esc((T.bgs || BGS)[i]) + '" aria-label="' + esc((T.bgs || BGS)[i]) + '"' +
            (b === 'tma' ? '' : ' style="background-image:url(/kevin/pong/pozadi-' + b + '-mini.webp' + ver + ')"') + '></button>';
        }).join('') + '</div><p class="kp-bgname">' + esc((T.bgs || BGS)[BGS.indexOf(bgName)]) + '</p></section>' +
        (canFull ? '<button type="button" class="kp-fullbtn"><i class="fa-solid ' + (isFull() ? 'fa-compress' : 'fa-expand') + '" aria-hidden="true"></i> ' + esc(T.fullscreen || '') + '</button>' : '') +
        '<button type="button" class="kpong-play btn-primary kp-resume"><i class="fa-solid fa-' + (setPausedGame ? 'play' : 'check') + '" aria-hidden="true"></i> ' + esc(setPausedGame ? T.resume || '' : T.done || '') + '</button>';
      root.appendChild(setCard);
      setBtn.setAttribute('aria-expanded', 'true');
      setCard.querySelectorAll('.kp-bgopt').forEach(function (b, i) {
        b.addEventListener('click', function () {
          setBg(b.dataset.bg); store.set('kevinPongBg', b.dataset.bg);
          setCard.querySelectorAll('.kp-bgopt').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
          setCard.querySelector('.kp-bgname').textContent = (T.bgs || BGS)[i];
        });
      });
      var fb = setCard.querySelector('.kp-fullbtn');
      if (fb) fb.addEventListener('click', toggleFull);
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
    startScreen();
    root.querySelector('.kpong-close').focus();
  }

  window.KevinPong = { open: open, isOpen: false };
})();
