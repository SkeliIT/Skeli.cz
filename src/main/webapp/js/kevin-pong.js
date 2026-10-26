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
// Hlášky a nápisy (PERFEKTNÍ ODSTŘEL…) nejsou na hřišti, jdou z „reproduktoru“ automatu: lišta nad strojem
// s mřížkami reproduktorů po stranách a jantarovým textem.
// Kevin dělá lidské chyby: míček „sleduje“ až od části hřiště, s každým odrazem od stěny a s rychlostí se víc splete.
// Výhra přihlášeného hráče jde do tabulky pořadí (/api/pong: server měří čas od startu, pořadí = nejrychlejší
// výhra). Nepřihlášenému se nejlepší čas uloží jen v prohlížeči. Texty: KEVIN_LINES[jazyk].pong (kevin-lines.js).
(function () {
  if (window.KevinPong) return;
  var W = 600, H = 900, PAD_W = 124, PAD_H = 16, BALL_R = 12, WIN = 10;
  var PLAYER_Y = H - 46, KEVIN_Y = 60;               // pálky (logické souřadnice hřiště)
  // rám: rozměr obrázku, sklo hřiště v něm a kola [obrázek, x, y, poloměr] (vše v pixelech obrázku)
  var FRAME_W = 768, FRAME_H = 1376, GLASS = { x: 138, y: 316, w: 492, h: 741 };
  var GEARS_KEVIN = [[1, 305.5, 232, 42], [2, 384, 212, 48], [3, 462.5, 232, 42]];
  var GEARS_YOU = [[3, 283, 1141, 56], [2, 384, 1141, 56], [1, 485, 1141, 56]];
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
      '    <div class="kpong-speaker"><i class="kp-grill" aria-hidden="true"></i>' +
      '      <div class="kp-screen"><p class="kp-msg" aria-live="polite"></p><p class="kp-flash" aria-hidden="true"></p></div>' +
      '      <i class="kp-grill" aria-hidden="true"></i></div>' +
      '    <button type="button" class="kpong-close" aria-label="' + esc(T.close) + '"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
      '  </div>' +
      '  <div class="kpong-machine"><div class="kpong-frame">' +
      '    <div class="kpong-gears" data-set="kevin">' + GEARS_KEVIN.map(gear).join('') + '</div>' +
      '    <div class="kpong-gears" data-set="you">' + GEARS_YOU.map(gear).join('') + '</div>' +
      '    <canvas class="kpong-kevin" aria-hidden="true"></canvas>' +
      '    <div class="kpong-field">' +
      '      <canvas class="kpong-court" width="600" height="900" aria-hidden="true"></canvas>' +
      '      <div class="kpong-panel"></div>' +
      '    </div>' +
      '  </div></div>' +
      '  <button type="button" class="kpong-shot"><i class="fa-solid fa-bolt" aria-hidden="true"></i> ' + esc(T.shot || 'Odstřel') + '</button>' +
      '</div>';
    document.body.appendChild(root);
    document.documentElement.classList.add('kpong-open');
    var court = root.querySelector('.kpong-court'), cx = court.getContext('2d');
    var field = root.querySelector('.kpong-field'), panel = root.querySelector('.kpong-panel');
    var speaker = root.querySelector('.kpong-speaker'), sayEl = root.querySelector('.kp-msg'), flashEl = root.querySelector('.kp-flash'), youEl = root.querySelector('.kpong-you'), kevEl = root.querySelector('.kpong-kev');
    var kevCanvas = root.querySelector('.kpong-kevin');
    var machine = root.querySelector('.kpong-machine'), frame = root.querySelector('.kpong-frame');
    var shotBtn = root.querySelector('.kpong-shot'), topBar = root.querySelector('.kpong-top');
    function gear(g) {
      return '<img class="kpong-gear" src="/kevin/pong/kolo-' + g[0] + '.webp' + ver + '" alt="" style="--x:' + g[1] + ';--y:' + g[2] + ';--r:' + g[3] + '">';
    }

    // velikost stroje: celý rám, a když je displej úzký (telefon), ořízne se kraj rámu a spodek pod koly hráče,
    // ať je hřiště co největší. --u = kolik pixelů obrazovky je jeden pixel obrázku.
    function fit() {
      var landscape = innerWidth > innerHeight && innerHeight < 500;
      var availW = innerWidth - 16 - (landscape ? topBar.offsetWidth + shotBtn.offsetWidth + 24 : 0);
      var availH = innerHeight - 16 - (landscape ? 0 : topBar.offsetHeight + 8 + (shotBtn.offsetHeight ? shotBtn.offsetHeight + 8 : 0));
      var all = { x0: 0, x1: FRAME_W, y0: 0, y1: FRAME_H };
      var cut = { x0: GLASS.x - 44, x1: GLASS.x + GLASS.w + 44, y0: 0, y1: landscape ? 1070 : 1236 };
      var uAll = Math.min(availW / FRAME_W, availH / FRAME_H), uCut = Math.min(availW / (cut.x1 - cut.x0), availH / (cut.y1 - cut.y0));
      var v = uCut > uAll * 1.12 ? cut : all, u = v === cut ? uCut : uAll;
      machine.style.width = Math.floor((v.x1 - v.x0) * u) + 'px';
      machine.style.height = Math.floor((v.y1 - v.y0) * u) + 'px';
      frame.style.setProperty('--u', u);
      frame.style.left = -v.x0 * u + 'px';
      frame.style.top = -v.y0 * u + 'px';
    }
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

    var sayTimer = 0, flashTimer = 0;
    // nápis z reproduktoru (PERFEKTNÍ ODSTŘEL…): na 1,2 s přes Kevinovu hlášku, mřížky zabouchají
    function showFlash(f) {
      flashEl.textContent = f.text; flashEl.className = 'kp-flash on ' + f.kind;
      speaker.classList.remove('boom'); void speaker.offsetWidth; speaker.classList.add('boom');
      clearTimeout(flashTimer); flashTimer = setTimeout(function () { flashEl.className = 'kp-flash'; }, 1200);
    }
    function say(t, ms) {
      if (!t) return;
      sayEl.textContent = t; speaker.classList.add('talk');
      clearTimeout(sayTimer); sayTimer = setTimeout(function () { sayEl.textContent = ''; speaker.classList.remove('talk'); }, ms || 2600);
      if (K) { K.setTalking(true); setTimeout(function () { if (K) K.setTalking(false); }, Math.min(2200, 600 + t.length * 45)); }
    }

    // ---------- stav hry ----------
    var level = +(store.get('kevinPongLevel') || 2), L = LEVELS[level];
    var you = 0, kev = 0, running = false, paused = false, started = 0, serveAt = 0, serving = 1;
    var player = { x: W / 2, target: W / 2, shotAt: -1e9, shotUsed: true, stunUntil: 0, lastHit: -1e9, boosted: false };
    var kevin = { x: W / 2, target: W / 2, nextThink: 0, moving: 0, miss: 0 };
    var ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, speed: 0, trail: [], fire: false, mishit: false };
    var combo = 0, hitStop = 0, flash = null;
    var MOSQUITO_CHANCE = 1;   // ZKOUŠKA: komár přiletí v každém zápase; potom z toho bude náhodná událost (např. 0.3)
    var mosq = { done: false, active: false };
    var keys = { left: false, right: false }, raf = 0, last = 0, signedIn = false, csrf = null;

    function resetBall(towardPlayer) {
      ball.x = W / 2; ball.y = H / 2; ball.trail = [];
      ball.speed = L.speed;
      var a = (Math.random() * 0.6 - 0.3);
      ball.vx = Math.sin(a) * ball.speed;
      ball.vy = (towardPlayer ? 1 : -1) * Math.cos(a) * ball.speed;
      ball.fire = false; ball.mishit = false; player.boosted = false;
      if (!towardPlayer) aimError();
      serveAt = performance.now() + 900;               // chvilka na nádech
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

    function shoot() {
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
    }

    // ---------- komár ----------
    // Dráha v pixelech obrázku rámu: přiletí z kraje, kličkuje kolem Kevinovy hlavy (Kevin se za ním otáčí),
    // pak Kevin vyskočí, komár omráčený spadne dolů přes hřiště a hra se po chvilce rozjede.
    function mosquito() {
      mosq.done = true;
      if (Math.random() >= MOSQUITO_CHANCE) return;
      mosq.active = true; paused = true;
      var M = T.mosquito || {};
      say(pick(M.pause), 2400);
      var el = document.createElement('div');
      el.className = 'kpong-mosq';
      frame.appendChild(el);
      var side = Math.random() < 0.5 ? 1 : -1, pts = [[side > 0 ? -30 : FRAME_W + 30, 70 + Math.random() * 60]];
      for (var i = 0; i < 5; i++) pts.push([384 + (i % 2 ? 1 : -1) * side * (40 + Math.random() * 80), 40 + Math.random() * 100]);
      var end = pts[pts.length - 1], t0 = performance.now(), dur = 3400, lastX = pts[0][0];
      function at(t) {   // hladká dráha přes body (Catmull-Rom)
        var n = pts.length - 1, f = Math.min(n - 1e-6, t * n), i = Math.floor(f), q = f - i;
        var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
        function c(k) { return 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * q + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * q * q + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * q * q * q); }
        return [c(0), c(1)];
      }
      (function fly() {
        if (!root.isConnected) return;
        var now = performance.now(), t = (now - t0) / dur;
        if (t >= 1) return pounce();
        var p = at(t);
        el.style.setProperty('--mx', p[0].toFixed(1));
        el.style.setProperty('--my', (p[1] + Math.sin(now / 70) * 3).toFixed(1));   // komáří pohupování
        if (Math.abs(p[0] - lastX) > 0.5) el.classList.toggle('left', p[0] < lastX);  // obrázek kouká doprava
        lastX = p[0];
        if (K && t > 0.25) K.turn(p[0] > 404 ? Math.PI / 2 : p[0] < 364 ? -Math.PI / 2 : 0);
        requestAnimationFrame(fly);
      })();
      function pounce() {
        var u = parseFloat(frame.style.getPropertyValue('--u')) || 0.5;
        var dx = (end[0] - 384) * u * 0.85, dy = (Math.min(end[1], 120) - 150) * u;
        if (K && K.has('jumpDown')) K.once('jumpDown');
        var jump = kevCanvas.animate([{ transform: 'translate(0, 0)' }, { transform: 'translate(' + dx + 'px, ' + dy + 'px)', offset: 0.45 }, { transform: 'translate(0, 0)' }],
          { duration: 950, easing: 'ease-in-out' });
        setTimeout(function () {   // trefa: omráčený komár padá přes hřiště
          el.classList.add('hit');
          el.animate([{ transform: 'translate(-50%, -50%) rotate(0deg)' }, { transform: 'translate(-50%, calc(-50% + ' + Math.round(900 * u) + 'px)) rotate(200deg)', opacity: 0 }],
            { duration: 1300, easing: 'cubic-bezier(.5, 0, .9, .6)', fill: 'forwards' });
          if (navigator.vibrate) try { navigator.vibrate(25); } catch (e) { /* nevadí */ }
        }, 430);
        jump.onfinish = function () {
          if (K) { K.turn(0); K.expression(2, 1400); }
          say(pick(M.after), 2600);
          setTimeout(function () {
            el.remove(); mosq.active = false;
            if (running) { paused = false; hitStop = performance.now() + 700; }
          }, 1500);
        };
      }
    }

    function step(now) {
      raf = requestAnimationFrame(step);
      var dt = Math.min(0.034, (now - last) / 1000); last = now;
      if (!running || paused) { draw(now); return; }
      // zastavení času po perfektním odstřelu: všechno stojí, jen se kreslí
      if (now < hitStop) { draw(now); return; }
      // komár: přiletí jednou za zápas, nejdřív po 6 s hry a jen když míček letí k hráči (Kevin má volno)
      if (!mosq.done && now - started > 6000 && now >= serveAt && ball.vy > 0) mosquito();
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
          player.lastHit = now; player.boosted = false;
          if (!player.shotUsed) boost(Math.abs(now - player.shotAt - SHOT_IDEAL), now);
          else if (now < player.stunUntil + 200) mishit(now);      // pálka se po odstřelu naprázdno ještě nevzpamatovala
          else { combo = 0; aimError(); }
        }
        // Kevinova pálka
        if (ball.vy < 0 && ball.y - BALL_R <= KEVIN_Y + PAD_H / 2 && ball.y > KEVIN_Y - PAD_H && Math.abs(ball.x - kevin.x) <= PAD_W / 2 + BALL_R) {
          bounce(kevin.x, 1);
          ball.fire = false;
          if (ball.mishit) punish();
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
      if (Math.random() < 0.6) say(pick(byPlayer ? T.conceded : T.scored), 2000);
      resetBall(!byPlayer);
    }

    // Kola: každé se otočí o tolik, kolik ujede pálka (převedeno na pixely obrázku) děleno jeho poloměrem.
    // Nahoře Kevin běží po vrcholu prostředního kola – běží doprava, vrch kola ujíždí doleva (kolo proti směru
    // hodinek), krajní kola se točí opačně. Dole prostřední kolo hráče jede jako kolo vozíku, krajní opačně.
    // Krajní kola mají posunutý začátek o půl zubu, ať zuby zapadají do mezer.
    var gearSets = ['kevin', 'you'].map(function (set) {
      return [].slice.call(root.querySelectorAll('[data-set="' + set + '"] .kpong-gear')).map(function (el, i) {
        return { el: el, r: +el.style.getPropertyValue('--r'), a: i === 1 ? 0 : 7, sign: (i === 1 ? 1 : -1) * (set === 'kevin' ? -1 : 1) };
      });
    });
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
      spin(gearSets[0], dxK); spin(gearSets[1], dxP);
      if (!K) return;
      if (kevin.moving !== lastMove) {
        lastMove = kevin.moving;
        K.hold(kevin.moving ? (K.has('jog') ? 'jog' : 'walk') : null, 0.18);
        K.turn(kevin.moving ? kevin.moving * Math.PI / 2 : 0);
      }
      var sp = kevin.moving ? clamp(Math.abs(dxK) / (dt || 0.016) / 420, 0.7, 1.8) : 1;
      if (Math.abs(sp - lastSpeed) > 0.08) { lastSpeed = sp; K.setSpeed(sp); }
    }

    function finish(playerWon) {
      running = false;
      var ms = Math.round(performance.now() - started);
      if (K) { K.hold(null); if (playerWon) { K.once(K.has('defeat') ? 'defeat' : 'shrug'); K.expression(23, 3000); } else { K.hold(K.has('dance2') ? 'dance2' : 'cheer'); K.expression(2, 3000); } }
      say(pick(playerWon ? T.won : T.lost), 4200);
      var bestKey = 'kevinPongBest' + level, best = +(store.get(bestKey) || 0);
      if (playerWon && (!best || ms < best)) store.set(bestKey, String(ms));
      var send = playerWon && signedIn ? post('/api/pong/win', { d: level, ms: ms, kevin: kev }) : Promise.resolve(null);
      send.then(function (res) {
        endScreen(playerWon, ms, res && res.ok ? res : null);
      }).catch(function () { endScreen(playerWon, ms, null); });
    }

    // ---------- obrazovky (start, konec) a tabulka ----------
    function startScreen() {
      panel.hidden = false;
      panel.innerHTML = '<h2 class="kpong-title">' + esc(T.title) + '</h2><p class="kpong-lead">' + esc(T.lead) + '</p>' +
        '<div class="kpong-levels" role="group" aria-label="' + esc(T.level) + '">' + [1, 2, 3].map(function (d) {
          return '<button type="button" class="kpong-level' + (d === level ? ' on' : '') + '" data-d="' + d + '"><b>' + esc(T.levels[d - 1]) + '</b><small>' + esc(T.levelHints[d - 1]) + '</small></button>';
        }).join('') + '</div>' +
        '<button type="button" class="kpong-play btn-primary"><i class="fa-solid fa-play" aria-hidden="true"></i> ' + esc(T.play) + '</button>' +
        '<p class="kpong-help">' + esc(T.help) + '</p>' +
        '<div class="kpong-board"></div>';
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
      box.innerHTML = '<h3>' + esc(T.board) + ' · ' + esc(T.levels[d - 1]) + '</h3><p class="kpong-note">…</p>';
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
        box.innerHTML = '<h3>' + esc(T.board) + ' · ' + esc(T.levels[d - 1]) + '</h3>' +
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
        '<div class="kpong-board"></div>';
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
      running = true;
      resetBall(Math.random() < 0.5);
      if (signedIn) post('/api/pong/start', { d: level }).catch(function () { /* hraje se i tak */ });
      say(pick(T.start), 1800);
    }

    // ---------- kreslení hřiště ----------
    function draw(now) {
      var light = false;   // hřiště je tmavé sklo stroje i ve světlém režimu
      rail(KEVIN_Y, kevin.x); rail(PLAYER_Y, player.x);
      cx.clearRect(0, 0, W, H);
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
        if (now < serveAt) {   // odpočet podání
          cx.fillStyle = light ? 'rgba(0,0,0,.5)' : 'rgba(255,255,255,.55)';
          cx.font = '700 64px system-ui, sans-serif'; cx.textAlign = 'center';
          cx.fillText(String(Math.ceil((serveAt - now) / 300)), W / 2, H / 2 + 90);
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
    // prst, který přišel první, vede pálku; další prst = odstřel. Myš: pohyb vede, levé tlačítko = odstřel.
    var mover = null;
    function onPointer(e) {
      if (!running) return;
      if (e.pointerType === 'touch') {
        if (e.type === 'pointerdown') { if (mover !== null && mover !== e.pointerId) { shoot(); e.preventDefault(); return; } mover = e.pointerId; }
        else if (e.pointerId !== mover) return;
      } else if (e.type === 'pointerdown' && e.button === 0) shoot();
      player.target = clamp(toField(e), PAD_W / 2, W - PAD_W / 2); e.preventDefault();
    }
    function onPointerEnd(e) { if (e.pointerId === mover) mover = null; }
    field.addEventListener('pointermove', onPointer);
    field.addEventListener('pointerdown', onPointer);
    field.addEventListener('pointerup', onPointerEnd);
    field.addEventListener('pointercancel', onPointerEnd);
    root.querySelector('.kpong-shot').addEventListener('pointerdown', function (e) { e.preventDefault(); shoot(); });
    function onKey(e) {
      if (e.key === 'Escape') return close();
      if (e.key === 'ArrowLeft' || e.key === 'a') { keys.left = e.type === 'keydown'; e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key === 'd') { keys.right = e.type === 'keydown'; e.preventDefault(); }
      if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && e.type === 'keydown' && running) { if (!e.repeat) shoot(); e.preventDefault(); }
      if (e.key === 'p' && e.type === 'keydown' && running && !mosq.active) { paused = !paused; e.preventDefault(); }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('keyup', onKey);
    function onHidden() { if (document.hidden && running) paused = true; }
    document.addEventListener('visibilitychange', onHidden);
    root.querySelector('.kpong-close').addEventListener('click', close);

    function close() {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey); document.removeEventListener('keyup', onKey);
      document.removeEventListener('visibilitychange', onHidden);
      removeEventListener('resize', fit);
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
