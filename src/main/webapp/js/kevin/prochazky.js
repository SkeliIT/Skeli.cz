// Kevinovy procházky po horních hranách karet (a po spodním okraji okna): rozběh, běh, sezení na hraně, pád
// z konce karty, vylézání zpoza karty. Načítá ho js/kevin.js jen na širokých obrazovkách (od 1025 px) – telefon
// tenhle soubor vůbec nestáhne. K = co procházky potřebují z Kevina (viz loadWalk v js/kevin.js).
window.KevinWalk = function (K) {
  var root = K.root, paw = K.paw, store = K.store, L = K.L, version = K.version, wideMq = K.wideMq,
    reduced = K.reduced, saveData = K.saveData, adminPage = K.adminPage, isField = K.isField;
  // ---------- now and then he takes a walk along the bottom edge of the window ----------
  // A second, small Kevin (his own canvas; the model comes from the browser's cache) jumps up onto the top edge of a card
  // low in the window and walks along it (or, with no card there, along the bottom edge of the window), sometimes
  // stops to look round or wave, and walks out on the other. PC only (no room on a phone), never while the visitor
  // types, while Kevin is out talking, in the admin, when he was sent away with the cross, with reduced motion or
  // save-data. A click on him opens his menu.
  var walker = null, walkK = null, walking = false, movesReady = false, walkLoading = false;
  // what he dances when he stops on his walk
  var WALK_DANCES = ['dance', 'dance2', 'dance3', 'robot', 'silly', 'breakdance', 'flair', 'cheer', 'fistPump'];
  // where his feet are in his picture (the walker's camera: view below), as a share of its height
  var WALK_FEET = (1 + 1 / (5.0 * Math.tan(15 * Math.PI / 180))) / 2;
  // the surfaces he can walk on: cards and panels of the page, the footer
  var SURFACES = '.card, .admin-card, .prose-card, .side-card, .about-card, .card-gold, .acct-card, .auth-card, .feature-card, '
    + '.song-row, .disco-card, .news-card, .quote-card, .donate-card, .feedback-card, .site-footer, footer';
  // the lowest top edge in the window (not under the header bar) with a free stretch above it, where he covers
  // nothing: columns every 20 px are probed every 12 px up to his height over the edge (Kevin never covers content); he walks
  // only along the longest free run
  // free for a walk: empty space, also inside a section or column that only holds the cards (the gap between them);
  // another card, text, a picture, a control, the header or the tapes are not
  function walkFree(el) {
    if (!el || el === document.documentElement || el === document.body) return true;
    if (el.closest('.kevin, .kevin-paw, .bg-slides')) return true;
    return !el.closest(SURFACES + ', a, button, input, select, textarea, label, img, picture, video, iframe, canvas, svg, '
      + 'p, h1, h2, h3, h4, h5, li, pre, blockquote, figure, table, .site-header, nav, form, .tape, .photo-band, '
      + '.cookie-bar, [class*="spotify"], .sp-bar, .sp-minbar, #sp-min, .notif-panel');
  }
  // the longest free stretch over a horizontal edge at y (window coordinates) between from and to, 260 px at least
  function freeRun(y, from, to) {
    var run = null, cur = null;
    for (var x = from + 10; x <= to - 10; x += 20) {
      var free = [6, 18, 30, 42, 54, 66, 78, 90, 102, 114, 124].every(function (dy) { return walkFree(document.elementFromPoint(x, y - dy)); });
      if (free) { if (!cur) cur = { left: x - 10 }; cur.right = x + 10; if (!run || cur.right - cur.left > run.right - run.left) run = { left: cur.left, right: cur.right }; }
      else cur = null;
    }
    return run && run.right - run.left >= 260 ? run : null;
  }
  // { el, r: {top, left, right} }: a card's edge (el) or the window's bottom edge (el null), null = no free ground now
  function findSurface() {
    var best = null, H = window.innerHeight, W = window.innerWidth, top = (document.querySelector('.site-header') || { getBoundingClientRect: function () { return { bottom: 0 }; } }).getBoundingClientRect().bottom;
    document.querySelectorAll(SURFACES).forEach(function (el) {
      if (root.contains(el) || !el.offsetParent) return;
      var b = el.getBoundingClientRect();
      if (b.top < top + 150 || b.top > H - 30 || (best && b.top <= best.r.top)) return;
      // only the part of the edge inside the window (a card in a carousel may stick out)
      var run = freeRun(b.top, Math.max(b.left, 8), Math.min(b.right, W - 8));
      if (run) best = { el: el, r: { top: b.top, left: run.left, right: run.right } };
    });
    if (best) return best;
    var low = freeRun(H, 0, W);
    return low ? { el: null, r: { top: H, left: low.left, right: low.right } } : null;
  }
  // pod hranou karty je jen její volný okraj (ne text, obrázek ani tlačítko) – může si tam sednout s nohama dolů
  function edgeIsPadding(card, x, top) {
    // jeho vlastní okénko při měření nepočítat (stojí přímo nad tím místem)
    if (walker) walker.style.pointerEvents = 'none';
    try { return padding(card, x, top); } finally { if (walker) walker.style.pointerEvents = ''; }
  }
  function padding(card, x, top) {
    return [8, 20, 34].every(function (dy) { var el = document.elementFromPoint(x - window.scrollX, top + dy); return el === card; })
      && [-24, 24].every(function (dx) { var el = document.elementFromPoint(x - window.scrollX + dx, top + 20); return el === card; });
  }
  // kam spadne, když se zavěsí na konec karty: tam, kde visí (vedle karty, do výšky jeho postavy), musí být volno
  // – visí tam pár vteřin a nikdy nezakryje obsah; pak padá a krátký pád přes jiné karty nevadí. Dopadne na
  // nejbližší kartu pod sebou, jinak na spodek okna.
  // { x: střed v souřadnicích stránky, edge: hrana karty (stránka), land: kam dopadne (stránka) } nebo null
  function dropPlan(card, dir, h) {
    var b = card.getBoundingClientRect(), H = window.innerHeight, W = window.innerWidth;
    var xc = dir > 0 ? b.right + 18 : b.left - 18;
    window.__kevinDrop = 'ok';   // proč nespadl (pro testy)
    if (xc < 40 || xc > W - 40 || b.top < 60) return (window.__kevinDrop = 'okraj', null);
    for (var y = b.top + 10; y < b.top + h * 0.9 && y < H; y += 14)
      for (var k = 0; k <= 2; k++) if (!walkFree(document.elementFromPoint(xc - dir * 8 + dir * k * 16, y))) return (window.__kevinDrop = 'obsah u ' + Math.round(y), null);
    var land = H;
    for (var y2 = b.top + h * 0.9; y2 < H - 4; y2 += 10) {
      var el = document.elementFromPoint(xc, y2), surf = el && el.closest(SURFACES);
      if (surf && surf !== card && !surf.contains(card)) { land = surf.getBoundingClientRect().top; break; }
    }
    if (land - b.top < 120) return (window.__kevinDrop = 'nízko', null);   // moc nízko, to není pád
    return { x: xc + window.scrollX, edge: b.top + window.scrollY, land: land + window.scrollY };
  }
  function canWalk() {
    return !adminPage && !K.userHidden() && !reduced && !saveData && wideMq.matches && !document.hidden && !(window.KevinPong && window.KevinPong.isOpen)
      && root.hidden && !K.busy() && !isField(document.activeElement) && store.get('kevinLite') !== '1';
  }
  function scheduleWalk() {
    setTimeout(function () { if (canWalk()) walk(); else scheduleWalk(); }, 90000 + Math.random() * 90000);
  }
  function walk() {
    var gl = null;
    try { gl = document.createElement('canvas').getContext('webgl2'); } catch (e) { gl = null; }
    if (!gl) return;
    if (!walker) {
      walker = document.createElement('button');
      walker.type = 'button';
      walker.className = 'kevin-walker';
      walker.hidden = true;
      walker.setAttribute('aria-label', L.ui.call);
      walker.innerHTML = '<canvas aria-hidden="true"></canvas>';
      walker.addEventListener('click', function () { endWalk(); paw.click(); });
      document.body.appendChild(walker);
    }
    var go = function () {
      if (walking) return;   // dvě procházky naráz by se praly o jednoho Kevina (přeskakoval by)
      walking = true;
      // the ground: the top edge of a card or panel low in the window (he walks on it and moves with the page), or
      // else the bottom edge of the window itself; the feet stand exactly on it (WALK_FEET = where they are in his picture)
      // (looked for while he is still hidden: he isn't in the way). Nowhere free: no walk this time.
      var s = findSurface(), x0, x1, ground = null, sy = window.scrollY, fromSide = false, toSide = false;
      if (!s) { walking = false; return scheduleWalk(); }
      walker.hidden = false;
      var w = walker.offsetWidth || 130, h = walker.offsetHeight || 150, c = walker.querySelector('canvas');
      x0 = s.r.left - w * 0.3;
      x1 = s.r.right - w * 0.7;
      if (s.el) {
        x0 += window.scrollX;
        x1 += window.scrollX;
        ground = s.r.top + window.scrollY;
        Object.assign(walker.style, { position: 'absolute', top: (ground - WALK_FEET * h + 1) + 'px', bottom: 'auto' });
      } else {
        // the window's edge: where the free stretch reaches the side of the window he walks in or out from there
        if (s.r.left < 20) { x0 = -w; fromSide = true; }
        if (s.r.right > window.innerWidth - 20) { x1 = window.innerWidth; toSide = true; }
        Object.assign(walker.style, { position: 'fixed', top: 'auto', bottom: (-(1 - WALK_FEET) * h) + 'px' });
      }
      var dir = Math.random() < 0.5 ? 1 : -1, x = dir > 0 ? x0 : x1;
      var inFromSide = dir > 0 ? fromSide : toSide, outToSide = dir > 0 ? toSide : fromSide;
      var stopAt = x0 + w / 2 + (x1 - x0) * (0.25 + Math.random() * 0.5), last = performance.now();
      // the box (160 px) must stand whole on the free stretch
      var rl = s.r.left + (s.el ? window.scrollX : 0), rr = s.r.right + (s.el ? window.scrollX : 0);
      stopAt = Math.min(Math.max(stopAt, rl + 85), rr - 85);
      // a cardboard box on the way now and then (cats and boxes), on the same ground
      var box = boxNext && x1 - x0 > 320 ? cardboardBox(stopAt, ground) : null;   // only on request (tests) until the box has a real look
      boxNext = false;
      // where he stops on the way (in the order he reaches them): one stop, two on a long stretch – mostly to dance
      var stops = !box && x1 - x0 > 700
        ? [x0 + w / 2 + (x1 - x0) * (0.22 + Math.random() * 0.15), x0 + w / 2 + (x1 - x0) * (0.6 + Math.random() * 0.15)]
        : [stopAt];
      if (dir < 0) stops.reverse();
      // his pace: as fast as the floor runs under his planted foot in the walk, so the feet don't skate
      var speed = walkK.walkPxPerSec() || 95;
      walker.dataset.speed = Math.round(speed);   // (for the tests)
      walker.style.transform = 'translateX(' + x + 'px)';
      walkK.setPaused(false);
      // tempo: na delší hraně se z chůze rozběhne (klus, běh; v noci nebo občas kočičí sprint) a před zastávkou
      // a koncem zase zpomalí do chůze; rychlost podle nohou daného pohybu, ať neklouzají
      var hour = new Date().getHours(), len = x1 - x0;
      // pokaždé jiný rovný běh (Run Forward, sprint); „Running“ a „Running (1)“ se v pohybu stáčejí o 62° a 166°,
      // při rovné cestě by to vypadalo, že se točí
      function runStyle() { var r = ['run3', 'runA', 'runM', 'sprint'].filter(function (n) { return walkK.has(n); }); return r[Math.floor(Math.random() * r.length)]; }
      var cruise = (walkForce === 'run' || walkForce === 'all') && walkK.has('run3') ? runStyle() : len > 900 && walkK.has('sprint') && (hour >= 23 || hour < 4 || Math.random() < 0.15) ? 'sprint'
        : len > 650 && walkK.has('run3') && Math.random() < 0.6 ? runStyle()
        : len > 420 && walkK.has('jog') && Math.random() < 0.7 ? 'jog' : 'walk';
      window.__kevinCruise = cruise + ' (délka ' + Math.round(len) + ') ' + ['walk', 'jog', 'run3', 'runA', 'runM', 'sprint'].map(function (n) { return n + ':' + (walkK.has(n) ? Math.round(walkK.walkPxPerSec(n)) : '-'); }).join(' ');   // pro testy
      var stillUntil = 0, braked = false, gait = 'walk', gaitAt = 0, FALLBACK = { walk: 1, jog: 1.8, run: 2.6, run2: 2.6, run3: 2.6, runA: 2.6, runM: 2.6, sprint: 3.6 };
      function setGait(g, now) {
        if (g === gait) return;
        gait = g; gaitAt = now; window.__kevinStage = 'tempo ' + g;
        walkK.hold(g);
        // přikrčí se a vystřelí – během přikrčení stojí na místě (nesmí klouzat)
        if (g === 'sprint' && walkK.has('sprintStart')) stillUntil = now + walkK.once('sprintStart') * 0.8;
        // rychlost podle nohou v pohybu; u běhů měření z dotyku chodidla vychází moc nízko (klus 28, běh ~50 při chůzi 53
        // = běžel stejně rychle jako šel), takže když je měření pod 75 % očekávané rychlosti, bere se poměr k chůzi
        var base = walkK.walkPxPerSec() || 95, meas = walkK.walkPxPerSec(g);
        speed = meas >= base * FALLBACK[g] * 0.75 ? meas : base * FALLBACK[g];
        window.__kevinSpeed = g + ' ' + Math.round(speed) + ' (chůze ' + Math.round(base) + ')';   // pro testy
      }
      // přechod (rozejde se, zastaví): hraje pohyb jednou a okénko jede přesně o tolik, kolik v něm ujde
      var trans = null;
      function transition(name, after) {
        var ms = walkK.clipMs(name);
        if (!ms) return after();
        walkK.hold(null); walkK.once(name);
        gait = name; speed = walkK.travelPx(name) / (ms / 1000);
        trans = { until: performance.now() + ms - 60, after: after };
      }
      var goOn = function () {
        if (!walking) return;
        var dy = walkK.yaw - dir * Math.PI / 2; dy = ((dy + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
        if (Math.abs(dy) > 0.3 && !goOn.turning) {
          goOn.turning = true;
          return turnTo(dir * Math.PI / 2, function (ms) { setTimeout(function () { goOn.turning = false; goOn(); }, ms); });
        }
        walkK.turn(dir * Math.PI / 2);
        gait = ''; braked = false;
        if (walkK.has('walkStart')) transition('walkStart', function () { gait = ''; setGait('walk', performance.now()); });
        else setGait('walk', performance.now());
        last = performance.now(); requestAnimationFrame(step);
      };
      // občas vyleze zpoza karty: nad hranou nejdřív jen tlapky a hlava, zbytek těla je „za kartou“ (pod hranou
      // se plátno ořízne), vyšplhá nahoru (Braced Hang To Crouch) a rozejde se
      if (!inFromSide && s.el && walkK.has('climbUp') && (walkForce === 'climb' || walkForce === 'all' || Math.random() < 0.4)) {
        window.__kevinStage = 'leze zpoza karty';
        walkK.turn(0);
        var feetC = WALK_FEET * h - c.offsetTop, hipsY0 = walkK.boneY('Hips') || feetC - h * 0.4;
        var ledge = (feetC - hipsY0) * (0.98 / 0.68);      // hrana je v pohybu ~0,98 m nad zemí (boky ve stoje 0,68 m)
        c.style.clipPath = 'inset(0 0 ' + (c.offsetHeight - (feetC - ledge)) + 'px 0)';
        c.style.transform = 'translateY(' + ledge + 'px)';
        walker.classList.add('airborne');
        var climbMs = walkK.once('climbUp');
        setTimeout(function () {
          if (!walking) return;
          c.style.clipPath = ''; c.style.transform = '';
          walker.classList.remove('airborne');
          goOn();
        }, climbMs - 40);
      } else if (!inFromSide) {
        walkK.turn(dir * Math.PI / 2);
        walkK.once('jump');
        walker.classList.add('airborne');
        c.animate([{ transform: 'translateY(' + h * 0.5 + 'px)', opacity: 0 }, { transform: 'translateY(' + -h * 0.22 + 'px)', opacity: 1, offset: 0.55 }, { transform: 'translateY(0)', opacity: 1 }],
          { duration: 900, easing: 'ease-out', fill: 'forwards' });
        setTimeout(function () { walker.classList.remove('airborne'); goOn(); }, 900);
      } else { walker.classList.remove('airborne'); goOn(); }
      // sedne si na hranu: zadek přesně na hranu karty (poloha boků se změří na obrázku), nohy visí dolů
      // otočka na místě opravdovým pohybem (Left/Right Turn z Mixamo), pak se natočení přenese do celého těla;
      // bez vhodného pohybu se dotočí plynule. then(ms) = za kolik ms je otočený
      function turnTo(target, then) {
        var from = walkK.yaw, need = target - from;
        need = ((need + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
        if (Math.abs(need) < 0.3) { walkK.turn(target); return then(150); }
        var clip = null, best = 0.6;
        ['turnL90', 'turnR90', 'turnR', 'turn180'].forEach(function (n) { if (walkK.has(n)) { var e = Math.abs(walkK.clipYaw(n) - need); if (e < best) { best = e; clip = n; } } });
        if (!clip) { walkK.turn(target); return then(600); }
        var turned = walkK.clipYaw(clip);
        walkK.hold(null);
        var ms = walkK.once(clip);
        setTimeout(function () { if (!walking) return; walkK.turnNow(from + turned); walkK.turn(target); walkK.hold('idle', 0.15); }, ms - 30);
        then(ms);
      }
      // sedne si na hranu karty čelem k tobě, nohy visí přes okraj: otočí se, pak plynulé prolnutí ze stoje do
      // sedu (Male Sitting Pose) a okénko se zároveň sníží, aby seděl zadkem na hraně; vstává stejně pozpátku
      function sitOnEdge(then) {
        window.__kevinStage = 'sedí';
        var feetC = WALK_FEET * h - c.offsetTop, hipsY0 = walkK.boneY('Hips');
        if (hipsY0 == null || !walkK.has('sitEdge')) return then();
        var seatC = feetC - (feetC - hipsY0) * 0.56;
        var shift = ground - (parseFloat(walker.style.top) + c.offsetTop + seatC) + h * 0.02;
        turnTo(0, function (ms) {
          setTimeout(function () {
            if (!walking) return;
            walker.classList.add('airborne');              // stín pod nohama pryč (sedí)
            walkK.hold('sitEdge', 0.6);
            c.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(' + shift + 'px)' }], { duration: 600, easing: 'ease-in-out', fill: 'forwards' });
            setTimeout(function () {
              if (!walking) return;
              walkK.hold('idle', 0.6);                     // vstane
              c.animate([{ transform: 'translateY(' + shift + 'px)' }, { transform: 'translateY(0)' }], { duration: 600, easing: 'ease-in-out', fill: 'forwards' });
              setTimeout(function () { walker.classList.remove('airborne'); then(); }, 620);
            }, 4800 + Math.random() * 1500);
          }, ms);
        });
      }
      // na konci karty se zavěsí rukama na její roh (bokem ke kartě, tělo venku vedle ní), chvíli visí,
      // pustí se a padá na kartu pod sebou nebo na spodek okna; dopad podle výšky: nízko měkce, vysoko
      // spíš tvrdě nebo kotoul (náhodně), pak se nervózně rozhlédne, jestli to někdo viděl
      function hangAndDrop(d) {
        // na konci karty: stojí ještě NA kartě u okraje, otočí se zády k okraji (pohyb otočky), pak se jedním
        // plynulým pohybem přehoupne přes hranu a chytí se jí (prolnutí do visu + posun okénka), jeden vis
        var edgeX = d.x - dir * 18;                        // hrana karty (souřadnice stránky)
        var standX = edgeX - dir * 22 - w / 2, hangX = d.x - w / 2;
        walker.style.transform = 'translateX(' + standX + 'px)';
        var hangYaw = -dir * Math.PI / 2;                  // ve visu čelem ke kartě
        walkK.poseAt('hang', 0);
        var handY = Math.min(walkK.boneY('LeftHand') || 0, walkK.boneY('RightHand') || 0) + c.offsetTop;
        var hangTop = d.edge - handY + 2, standTop = parseFloat(walker.style.top);
        walkK.hold('idle');
        window.__kevinStage = 'otáčí se';
        turnTo(hangYaw, function (ms) {
          setTimeout(function () {
            if (!walking) return;
            window.__kevinStage = 'leze přes hranu';
            walker.classList.add('airborne');
            walkK.hold('hang', 0.45);
            walker.animate([{ transform: 'translateX(' + standX + 'px)', top: standTop + 'px' }, { transform: 'translateX(' + hangX + 'px)', top: hangTop + 'px' }],
              { duration: 450, easing: 'ease-in-out', fill: 'forwards' }).onfinish = function (e) {
              walker.style.transform = 'translateX(' + hangX + 'px)'; walker.style.top = hangTop + 'px';
              walker.getAnimations().forEach(function (a) { a.cancel(); });
            };
            setTimeout(function () {
              if (!walking) return;
              window.__kevinStage = 'visí';   // fáze pro testy
          setTimeout(function () {
            if (!walking) return;
            walkK.look(-dir * 0.5, 0.6);                   // podívá se dolů
            setTimeout(function () {
              if (!walking) return;
              walkK.look(0, 0);
              walkK.hold('fallLoop'); window.__kevinStage = 'padá';
              var feet = WALK_FEET * h, landTop = d.land - feet + 1, fall = Math.max(0, landTop - hangTop);
              var ms = Math.max(320, Math.sqrt(2 * fall / 2600) * 1000);
              walker.animate([{ top: hangTop + 'px' }, { top: landTop + 'px' }], { duration: ms, easing: 'cubic-bezier(.45,0,.9,.6)' }).onfinish = function () {
                if (!walking) return;
                walker.style.top = landTop + 'px';
                walker.classList.remove('airborne');
                var height = fall / h, r = Math.random();
                var land = height < 1.2 ? (r < 0.6 ? 'landSoft' : 'land') : height < 2.6 ? (r < 0.35 ? 'landSoft' : r < 0.7 ? 'land' : 'landHard') : (r < 0.5 ? 'landHard' : 'roll');
                if (!walkK.has(land)) land = 'land';
                walkK.hold(null);
                var landMs = walkK.once(land) || 1200; window.__kevinStage = 'dopad ' + land + ' ' + landMs;
                setTimeout(function () {
                  if (!walking) return;
                  walkK.turn(0);
                  var lookMs = walkK.once('nervous') || 2500; window.__kevinStage = 'rozhlíží se ' + lookMs;
                  setTimeout(function () {
                    if (!walking) return;
                    window.__kevinStage = 'mizí';
                    c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, fill: 'forwards' }).onfinish = endWalk;
                  }, Math.min(lookMs, 3000));
                }, Math.max(600, landMs - 250));
              };
            }, 900);
          }, 900 + Math.random() * 900);
            }, 460);
          }, ms);
        });
      }
      // at the far end he jumps off the card and is gone
      function jumpOff() {
        walkK.once('jump');
        walker.classList.add('airborne');
        c.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(' + -h * 0.22 + 'px)', opacity: 1, offset: 0.4 }, { transform: 'translateY(' + h * 0.6 + 'px)', opacity: 0 }],
          { duration: 900, easing: 'ease-in', fill: 'forwards' }).onfinish = endWalk;
      }
      // the card stays his ground: it moved (an image loaded above it) → he moves with it; it is gone (another
      // page) or scrolled far out of sight → the walk is over. On the window's edge the page must not scroll under
      // him (he would cover it).
      function onGround() {
        if (ground == null) return Math.abs(window.scrollY - sy) < 30;
        if (!s.el.isConnected) return false;
        var top = s.el.getBoundingClientRect().top;
        if (top < -200 || top > window.innerHeight + 200) return false;
        if (Math.abs(top + window.scrollY - ground) > 0.5) {
          ground = top + window.scrollY;
          walker.style.top = (ground - WALK_FEET * h + 1) + 'px';
          if (box) box.moveTo(ground);
        }
        return true;
      }
      function step(now) {
        if (!walking) return;
        if (!onGround()) return ground != null && !s.el.isConnected ? endWalk() : jumpOff();
        var dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        var there = stops.length && (dir > 0 ? x + w / 2 >= stops[0] : x + w / 2 <= stops[0]);
        // konec přechodu → další krok (chůze po rozejití, příchod na zastávku po zastavení)
        if (trans && now >= trans.until) { var after = trans.after; trans = null; after(); }
        // kolik zbývá do zastávky nebo konce: daleko = cestovní tempo (po chvíli chůze), blízko = chůze
        var left = stops.length ? Math.abs(stops[0] - (x + w / 2)) : (dir > 0 ? x1 - x : x - x0);
        // před zastávkou zastaví (Stop Walking) – začne tak daleko, kolik v něm ujde
        if (!trans && stops.length && gait === 'walk' && walkK.has('walkStop') && left <= walkK.travelPx('walkStop') + 2) {
          transition('walkStop', function () { stops[0] = x + w / 2; speed = 0; });   // zastávka je tam, kde zastavil (žádný skok zpátky)
        }
        // rozběhne se jen s dostatkem místa před sebou; jakmile začne brzdit, do zastávky už znovu nevyrazí
        // (dřív se běh a chůze střídaly po snímcích = škubání)
        if (cruise !== 'walk' && !trans) {
          if (gait === 'walk' && !braked && now - gaitAt > 400 && left > (cruise === 'sprint' ? 420 : 300)) setGait(cruise, now);
          else if (gait === cruise && left < 150 && now - gaitAt > 500) { braked = true; setGait('walk', now); }
        }
        if (there) {
          stops.shift();
          walker.style.transform = 'translateX(' + x + 'px)';
          // the box: he jumps in, peeks out over its edge for a while, jumps out and goes on
          if (box) return intoTheBox(box, goOn);
          // občas si sedne na hranu karty s nohama dolů (jen když je pod hranou volný okraj karty, ne text);
          // otočku k tobě si udělá sám pohybem otočky
          if (s.el && walkK.has('sitEdge') && (walkForce === 'sit' || walkForce === 'all' || Math.random() < 0.3) && edgeIsPadding(s.el, x + w / 2, s.el.getBoundingClientRect().top)) return sitOnEdge(goOn);
          walkK.turn(0);
          // mostly a dance (5–7 s), else a wave or a look round – then on his way
          var moves = WALK_DANCES.filter(function (d) { return walkK.has(d); });
          if (moves.length && Math.random() < 0.65) {
            walkK.hold(moves[Math.floor(Math.random() * moves.length)]);
            return setTimeout(goOn, 5000 + Math.random() * 2000);
          }
          return setTimeout(goOn, walkK.once(Math.random() < 0.5 ? 'wave' : 'lookAround') || 2500);
        }
        if (now >= stillUntil) x += dir * speed * dt;
        walker.style.transform = 'translateX(' + x + 'px)';
        if ((dir > 0 && x >= x1) || (dir < 0 && x <= x0)) {
          if (outToSide) return endWalk();
          var drop = s.el && walkK.has('fallLoop') && (walkForce === 'drop' || walkForce === 'all' || Math.random() < 0.6) ? dropPlan(s.el, dir, h) : null;
          return drop ? hangAndDrop(drop) : jumpOff();
        }
        requestAnimationFrame(step);
      }
    };
    if (walkK) return go();
    if (walkLoading) return;   // model se už načítá – druhý by se vytvořil na stejném plátně a Kevin by přeskakoval
    walkLoading = true;
    import('/js/kevin-model.js' + (version ? '?' + version : '')).then(function (m) {
      walkK = m.createKevin(walker.querySelector('canvas'), {
        light: document.body.classList.contains('light'),
        src: '/kevin/kevin.glb' + (version ? '?' + version : ''),
        view: { y: 1.0, z: 5.0, look: 1.0 },
        overscan: 1.8,   // the canvas reaches 40 % past his box (effects.css): a dance never gets cut off
        moves: '/kevin/pohyby.json' + (version ? '?' + version : ''),   // běh, pády, sezení na hraně (načtou se po modelu)
        onReady: function () {
          new MutationObserver(function () { walkK.setLight(document.body.classList.contains('light')); })
            .observe(document.body, { attributes: true, attributeFilter: ['class'] });
          // počká na pohyby navíc (běh, pády…), nejdéle 4 s – pak jde i bez nich
          setTimeout(function () { if (!movesReady) { movesReady = true; go(); } }, 4000);
        },
        onMoves: function () { if (!movesReady) { movesReady = true; go(); } },
        onError: function () { walker.remove(); walker = null; }
      });
    }).catch(function () { /* no walk this time */ });
  }
  // a cardboard box on his ground (a card's top edge in the page at `ground`, or null = the window's bottom edge),
  // its middle at x: the back (inside and back flaps) behind Kevin, the front panel in front of him, so in the box
  // only his head shows over its edge
  var boxNext = false, walkForce = null;
  function cardboardBox(x, ground) {
    var back = document.createElement('div'), front = document.createElement('div');
    back.className = 'kevin-box kevin-box-back';
    front.className = 'kevin-box kevin-box-front';
    back.setAttribute('aria-hidden', 'true');
    front.setAttribute('aria-hidden', 'true');
    back.innerHTML = '<svg viewBox="0 0 160 120"><path d="M14 52 L30 22 L130 22 L146 52 Z" fill="#6e4a24"/>'
      + '<path d="M30 22 L18 4 L74 10 L80 22 Z" fill="#c69a63"/><path d="M130 22 L142 6 L88 10 L80 22 Z" fill="#b8884f"/></svg>';
    front.innerHTML = '<svg viewBox="0 0 160 120"><path d="M14 52 L146 52 L146 118 L14 118 Z" fill="#b98a52"/>'
      + '<path d="M14 52 L146 52 L146 60 L14 60 Z" fill="#a2743f"/><path d="M14 52 L4 74 L60 70 L72 52 Z" fill="#d3a56b"/>'
      + '<path d="M146 52 L156 74 L100 70 L88 52 Z" fill="#c99b60"/><rect x="72" y="52" width="16" height="66" fill="#d9c08f" opacity=".75"/>'
      + '<text x="80" y="98" text-anchor="middle" font-size="11" font-family="Arial Black, sans-serif" fill="#5a3a18" opacity=".7" transform="rotate(-4 80 98)">SKELO SQUAD</text></svg>';
    // its bottom (y 118 of 120 in the picture) stands on the edge
    var moveTo = function (g) { [back, front].forEach(function (el) { el.style.top = (g - 118) + 'px'; }); };
    [back, front].forEach(function (el) {
      el.style.left = (x - 80) + 'px';
      if (ground != null) el.classList.add('on-card');
      document.body.appendChild(el);
    });
    if (ground != null) moveTo(ground);
    return { back: back, front: front, moveTo: moveTo, remove: function () { [back, front].forEach(function (el) { el.classList.add('gone'); setTimeout(function () { el.remove(); }, 900); }); } };
  }
  // up, then down into the box (only the head over its edge), a look round, up and out again
  function intoTheBox(box, then) {
    var c = walker.querySelector('canvas');
    walkK.turn(0);
    walkK.once('jump');
    c.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-60px)', offset: 0.45 }, { transform: 'translateY(12px)' }],
      { duration: 1100, easing: 'ease-in-out', fill: 'forwards' });
    setTimeout(function () {
      if (!walking) return;
      // he stands in it and only turns his head: left, right, at you (the lookAround clip bends him down out of sight)
      walkK.hold('idle');
      [[-0.9, 0.1, 0], [0.9, 0.1, 1100], [0, 0.25, 2300]].forEach(function (l) { setTimeout(function () { if (walking) walkK.look(l[0], l[1]); }, l[2]); });
      setTimeout(function () {
        if (!walking) return;
        walkK.once('jump');
        c.animate([{ transform: 'translateY(12px)' }, { transform: 'translateY(-60px)', offset: 0.5 }, { transform: 'translateY(0)' }],
          { duration: 1100, easing: 'ease-in-out', fill: 'forwards' });
        setTimeout(function () { box.remove(); then(); }, 1100);
      }, 3600);
    }, 1100);
  }
  function endWalk() {
    walking = false;
    window.__kevinStage = 'konec';
    document.querySelectorAll('.kevin-box').forEach(function (el) { el.remove(); });
    if (walker) { walker.hidden = true; walker.querySelector('canvas').getAnimations().forEach(function (a) { a.cancel(); }); }
    if (walkK) { walkK.hold(null); walkK.setPaused(true); }
    scheduleWalk();
  }

  return {
    schedule: scheduleWalk,
    end: endWalk,
    isWalking: function () { return walking; },
    // procházka hned (testy, ukázky): 'box' = s krabicí, 'drop' | 'sit' | 'run' | … = vynucený kousek
    force: function (kind) { boxNext = kind === 'box'; walkForce = kind; walk(); }
  };
};
