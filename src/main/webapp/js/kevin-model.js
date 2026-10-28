// Kevin – the ginger cat in his hoodie (kevin/kevin.glb): a model made from the user's pictures (Rodin),
// a skeleton and 38 moves from Mixamo, joined and compressed (meshopt, WebP) into one file of about 7 MB.
// Doplněno 2026-10-25 (nástroje v work/skeli-navrh/kevin-model/nastroje): vlastní kosti ocasu ocas0–ocas6
// (ocas se vlní a houpe kódem, pohyby z Mixamo na něj nesahají), kost brady „celist“ a pusa jako nálepka
// z 24 obrázků (kevin/pusy.webp + kevin/pusa.json) – mění tvar při řeči a výrazech, brada jde s ní dolů.
// The same controller as the old gold statue (js/kevin3d.js, still used by the karaoke cinema), so js/kevin.js
// drives either: setPose, setTalking, act, spin, look, setLight, setPaused, dispose; can(feature) says
// which surprises this model can show; opts.onReady is called once the model is on screen.
import * as THREE from './vendor/three/three.module.min.js';
import { GLTFLoader } from './vendor/three/GLTFLoader.js';
import { RoomEnvironment } from './vendor/three/RoomEnvironment.js';
import { MeshoptDecoder } from './vendor/three/meshopt_decoder.module.js';

// poses he stays in (looping clips)
const POSES = { idle: 'idle', rap: 'rap', beatbox: 'silly', cool: 'bored', point: 'idle', sleep: 'bored', sulk: 'bored' };
// one-shot acts for "Do something" (keys of KEVIN_LINES.surprise) → clips; null = done in code here
// (each surprise in js/lines/kevin-<jazyk>.js is one of his real moves; beatbox and the rhyme dance with a beat)
const ACTS = {
  beatbox: 'silly', rhyme: 'rap', dance: 'dance', dance2: 'dance2', dance3: 'dance3', robot: 'robot', silly: 'silly',
  breakdance: 'breakdance', flair: 'flair', jump: 'jump', dive: 'dive', kick: 'kick', cheer: 'cheer', clap: 'clap',
  fistPump: 'fistPump', laugh: 'laugh', sing: 'sing', rap: 'rap', typing: 'typing', stretchArms: 'stretchArms',
  neck: 'neck', lie: 'lie', thumbsUp: 'thumbsUp', wave: 'wave', nervous: 'nervous', shrug: 'shrug', lookAround: 'lookAround',
  hide: null, freeze: null, leave: 'walk'
};
// surprises whose words need something this model hasn't got, or whose move doesn't fit his picture
const CANNOT = new Set(['shades', 'tail', 'lick', 'lie']);   // lie: his tail sticks up into the air
// looping clips played as an act run this long (dances longer: they are the fun), then he goes back
const LOOP_ACT_S = 4.5, DANCE_S = 7.5;
const DANCES = new Set(['dance', 'dance2', 'dance3', 'robot', 'silly', 'breakdance', 'flair', 'sing', 'rap']);
const TALK = ['talk', 'talk2'];

export function createKevin(canvas, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  // a phone short of memory (an iPhone) may take the 3D away from the page: then the still picture (opts.onError),
  // never an empty spot where he was
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); if (opts.onError) opts.onError(e); }, { once: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.8;
  // opts.overscan: the canvas is that many times larger than the shot (around its middle), so a dance, a lean or
  // a breakdance never runs out of the picture; the wider lens keeps him the same size in the same place
  const overscan = opts.overscan || 1;
  const cam = new THREE.PerspectiveCamera(2 * Math.atan(overscan * Math.tan(15 * Math.PI / 180)) * 180 / Math.PI, 1, 0.05, 50);
  // opts.view = { y, z, look }: another shot (the cinema frames him wider, for swimming)
  const view = Object.assign({ y: 1.08, z: 4.7, look: 1.0 }, opts.view || {});
  cam.position.set(0, view.y, view.z);
  cam.lookAt(0, view.look, 0);
  const key = new THREE.DirectionalLight(0xfff1d6, 1.8);
  key.position.set(-2, 4, 5);
  scene.add(key);
  // ember rim light from behind (the sparks in the smoke); sky blue in the light theme
  const rim = new THREE.DirectionalLight(0xff9a40, 2.2);
  rim.position.set(3, 2, -4);
  scene.add(rim);
  const holder = new THREE.Group();   // turned for spin, moved for hide / leave
  scene.add(holder);
  function setLight(light) {
    rim.color.set(light ? 0x9cc8ff : 0xff9a40);
    rim.intensity = light ? 1.4 : 2.2;
    renderer.toneMappingExposure = light ? 1.0 : 1.08;
  }
  setLight(!!opts.light);

  function resize() {
    const w = canvas.clientWidth || 160, h = canvas.clientHeight || 180;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // ---------- state: what he should be doing ----------
  let pose = 'idle', talking = false, talkClip = 'talk', act = null, actEnd = 0, paused = false, disposed = false;
  let lookX = 0, lookY = 0, spinT = -1, special = null, specialT = 0, frozenUntil = 0, held = null, turnTo = 0;
  let mixer = null, actions = {}, playing = null, head = null, hips = null, hipsRest = null, clock = 0;
  let foot = null, walkSpeed = 0, speeds = {}, travel = {}, hipsH = 1, fbxK = 0, anchor = {};   // walkSpeed: how fast the floor runs under his feet in the walk (world units a second)
  let legs = [], tail = [], jaw = null, jawRest = null, mouth = null, forcedFace = null, forcedUntil = 0;
  let feet = [], footRest = null, groundY = 0, groundK = 0;

  function wanted() {
    if (act) return act;
    if (held) return held;
    if (talking && (pose === 'idle' || pose === 'point' || pose === 'cool')) return talkClip;
    return POSES[pose] || 'idle';
  }
  let nextFade = 0.3;   // délka prolnutí do dalšího pohybu (hold(name, fade) ji změní jednou)
  function crossfade() {
    if (!mixer) return;
    const name = wanted(), next = actions[name] || actions.idle;
    if (!next || next === playing) return;
    const f = nextFade; nextFade = 0.3;
    next.reset().setEffectiveWeight(1).fadeIn(f).play();
    if (playing) playing.fadeOut(f);
    playing = next;
  }

  // ---------- the model ----------
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  loader.load(opts.src || '/kevin/kevin.glb', g => {
    if (disposed) return;
    const model = g.scene;
    model.traverse(o => {
      // Mixamo's bones are 'mixamorig:Hips' …; the loader drops the ':' from node names (mixamorigHips), so match the end
      if (o.isBone && /mixamorig:?Head$/.test(o.name)) head = o;
      if (o.isBone && /mixamorig:?Hips$/.test(o.name)) hips = o;
      if (o.isBone && /mixamorig:?LeftFoot$/.test(o.name)) foot = o;
      if (o.isBone && /mixamorig:?(Left|Right)Leg$/.test(o.name)) legs.push(o);
      if (o.isBone && /mixamorig:?Neck$/.test(o.name)) neckBones.push(o);
      if (o.isBone && /mixamorig:?(Left|Right)(Foot|ToeBase)$/.test(o.name)) feet.push(o);
      if (o.isBone && /^ocas[1-9]$/.test(o.name)) tail.push(o);
      if (o.isBone && o.name === 'celist') jaw = o;
      if (!o.isMesh) return;
      o.frustumCulled = false;   // the moves take him out of his resting box
      const m = o.material;
      if (m && 'roughness' in m) { m.metalness = 0; m.roughness = 0.85; }   // fur and cloth are matte
    });
    // stand him on the floor, centred, 2 units tall
    const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const s = 2 / size.y;
    model.scale.setScalar(s);
    model.position.set(-c.x * s, -box.min.y * s, -c.z * s);
    holder.add(model);
    if (hips) hipsRest = hips.position.clone();
    tail.sort((a, b) => a.name.localeCompare(b.name));
    if (jaw && head) { jawRest = jaw.quaternion.clone(); loadMouth(); }
    mixer = new THREE.AnimationMixer(model);
    for (const clip of g.animations) actions[clip.name] = mixer.clipAction(clip);
    walkSpeed = measureWalk(model);
    footRest = lowestFoot(model, 'idle');
    crossfade();
    // další pohyby (běh, pády, sezení na hraně…) z kevin/pohyby.json – jen když o ně volající požádá (procházka)
    if (opts.moves) fetch(opts.moves).then(r => r.ok ? r.json() : []).then(list => {
      if (disposed) return;
      for (const j of list) if (j.userData && j.userData.travel) travel[j.name] = j.userData.travel;
      api.addClips(list.map(j => THREE.AnimationClip.parse(j)));
      for (const n of ['jog', 'run', 'run2', 'run3', 'runA', 'runM', 'sprint']) if (actions[n]) speeds[n] = measureWalk(model, n);
      // výška boků ve stoje (jednotky scény) – posun z pohybu se udává v násobcích výšky boků
      if (hips) { model.updateMatrixWorld(true); hipsH = hips.getWorldPosition(new THREE.Vector3()).y; }
      if (opts.onMoves) opts.onMoves();
    }).catch(() => {});
    renderer.render(scene, cam);
    if (opts.onReady) opts.onReady();
  }, undefined, err => { if (opts.onError) opts.onError(err); });

  // The walk is in place (the hips are held still), so a planted foot slides back under him at the speed he would
  // move: sampled once over the clip, the foot's speed while it is down on the floor. Moving him by just that much
  // keeps his feet from skating (js/kevin.js walk).
  function measureWalk(model, name = 'walk') {
    const a = actions[name];
    if (!a || !foot || !hips) return 0;
    const d = a.getClip().duration, n = 60, v = new THREE.Vector3(), z = [], y = [];
    a.reset().play();
    for (let i = 0; i <= n; i++) {
      mixer.setTime(d * i / n);
      hips.position.x = hipsRest.x;
      hips.position.z = hipsRest.z;
      model.updateMatrixWorld(true);
      foot.getWorldPosition(v);
      z.push(v.z);
      y.push(v.y);
    }
    a.stop();
    mixer.setTime(0);
    const floor = Math.min(...y), dt = d / n;
    let sum = 0, steps = 0;
    for (let i = 1; i <= n; i++) {
      // both samples with the foot down (within 2 % of his height of its lowest point)
      if (y[i] - floor < 0.04 && y[i - 1] - floor < 0.04) { sum += Math.abs(z[i] - z[i - 1]) / dt; steps++; }
    }
    if (steps >= 3) return sum / steps;
    return 1.7 * (Math.max(...z) - Math.min(...z)) / d;   // stance about 60 % of the cycle
  }

  // ---------- pusa: nálepka z 24 tvarů (dvě vrstvy přes sebe = plynulé prolnutí), spodek jde s bradou ----------
  // tvary v pořadí obrázku kevin/pusy.webp; hodnota = jak moc spadne brada (0–1)
  const SHAPES = [0, 0, .1, .9, .8, .35, .6, .1, .25, .6, .15, .1, 0, .1, .2, .25, 1, 0, .55, .45, .1, .2, 0, .1];
  const VOWELS = [3, 4, 5, 6, 7, 8, 9, 10, 11], CONS = [12, 13, 14, 0, 7];
  // výraz podle pohybu (jméno klipu → tvar pusy; -1 = jako při řeči)
  const FACE = { laugh: 2, cheer: 3, fistPump: 4, clap: 1, wave: 1, thumbsUp: 1, shrug: 23, nervous: 21, sing: -1, rap: -1, silly: 19 };
  const JAW_MAX = 6 * Math.PI / 180;
  function loadMouth() {
    const q = (opts.src || '').split('?')[1], v = q ? '?' + q : '';
    Promise.all([
      fetch('/kevin/pusa.json' + v).then(r => r.ok ? r.json() : null),
      new THREE.TextureLoader().loadAsync('/kevin/pusy.webp' + v)
    ]).then(([d, tex]) => {
      if (!d || disposed) return;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(d.pos, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(d.uv, 2));
      geo.setIndex(d.idx);
      tex.colorSpace = THREE.SRGBColorSpace;
      const layer = order => {
        const t = tex.clone(); t.repeat.set(1, 1 / SHAPES.length); t.needsUpdate = true;
        const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, color: 0xe8e2dc,
          polygonOffset: true, polygonOffsetFactor: -2 - order, polygonOffsetUnits: -2 - order });
        const mesh = new THREE.Mesh(geo, m); mesh.renderOrder = 5 + order; mesh.frustumCulled = false;
        head.add(mesh);                                  // body nálepky jsou v souřadnicích hlavy
        return { t, m };
      };
      const pa = geo.attributes.position;
      mouth = { A: layer(0), B: layer(1), pa, rest: pa.array.slice(), w: d.jaw, a: 0, b: 0, mix: 1, cur: 0, syll: 0, nextAt: 0, wordEnd: 0, pauseEnd: 0,
        jawRestInv: new THREE.Matrix4().compose(jaw.position, jawRest, jaw.scale).invert() };
    }).catch(() => {});
  }
  const tmpM = new THREE.Matrix4(), tmpV = new THREE.Vector3(), X_AXIS = new THREE.Vector3(1, 0, 0), jawTurn = new THREE.Quaternion();
  const Y_AXIS = new THREE.Vector3(0, 1, 0), lookQ = new THREE.Quaternion();
  function updateMouth(t, dt) {
    const M = mouth;
    let want = 0;
    const face = forcedFace !== null && t < forcedUntil ? forcedFace : FACE[act || (talking ? '' : POSES[pose])];
    if ((talking && !(forcedFace !== null && t < forcedUntil)) || face === -1) {
      // řeč: střídání souhláska → samohláska po slabikách, mezi slovy krátce zavřená
      if (t > M.wordEnd && t > M.pauseEnd) { M.pauseEnd = t + 0.12 + Math.random() * 0.3; M.wordEnd = M.pauseEnd + 0.4 + Math.random() * 0.9; }
      if (t >= M.nextAt) { M.syll++; M.nextAt = t + 0.075 + Math.random() * 0.06; }
      want = t < M.pauseEnd ? 0 : M.syll % 2 ? VOWELS[(M.syll * 7 + (M.syll >> 1)) % VOWELS.length] : CONS[(M.syll * 3) % CONS.length];
    } else if (face > 0) want = face;
    if (want !== M.b) { M.a = M.mix > .5 ? M.b : M.a; M.b = want; M.mix = 0; }
    M.mix = Math.min(1, M.mix + dt * 16);
    const k = M.mix * M.mix * (3 - 2 * M.mix), n = SHAPES.length;
    M.A.t.offset.y = (n - 1 - M.a) / n; M.B.t.offset.y = (n - 1 - M.b) / n; M.B.m.opacity = k;
    const goal = SHAPES[M.a] * (1 - k) + SHAPES[M.b] * k;
    M.cur += (goal - M.cur) * Math.min(1, dt * (goal > M.cur ? 22 : 14));
    // brada dolů; spodek nálepky se natočí stejně (v souřadnicích hlavy)
    jaw.quaternion.copy(jawRest).multiply(jawTurn.setFromAxisAngle(X_AXIS, -JAW_MAX * M.cur));
    jaw.updateMatrix();
    tmpM.multiplyMatrices(jaw.matrix, M.jawRestInv);
    const r = M.rest, pa = M.pa;
    for (let i = 0; i < pa.count; i++) {
      const w = M.w[i]; if (!w) continue;
      tmpV.set(r[i * 3], r[i * 3 + 1], r[i * 3 + 2]).applyMatrix4(tmpM);
      pa.setXYZ(i, r[i * 3] + (tmpV.x - r[i * 3]) * w, r[i * 3 + 1] + (tmpV.y - r[i * 3 + 1]) * w, r[i * 3 + 2] + (tmpV.z - r[i * 3 + 2]) * w);
    }
    pa.needsUpdate = true;
  }

  // ---------- ocas: vlní se od kořene ke špičce, při skoku a dopadu se setrvačností zhoupne ----------
  const hipW = new THREE.Vector3();
  let lastHipY = null, swing = 0, swingV = 0;
  function updateTail(t, dt) {
    hips.getWorldPosition(hipW);
    const vy = lastHipY === null || dt <= 0 ? 0 : (hipW.y - lastHipY) / dt;
    lastHipY = hipW.y;
    swingV += (-vy * 0.35 - swing * 18 - swingV * 4.5) * dt;
    swing = Math.max(-0.6, Math.min(0.6, swing + swingV * dt));
    tail.forEach((b, i) => {
      const k = (i + 1) / tail.length;
      b.rotation.set((0.03 + 0.06 * k) * Math.sin(t * 1.1 - i * 0.45) + swing * (0.4 + k), (0.05 + 0.16 * k) * Math.sin(t * 1.7 - i * 0.6), 0);
    });
  }

  // ---------- kolena: pohyby z Mixamo jsou pro lidské nohy – lýtko se nesmí přetočit kolem své osy (kůže by se zlomila) ----------
  const twQ = new THREE.Quaternion(), twInv = new THREE.Quaternion(), swQ = new THREE.Quaternion(), TWIST_MAX = 12 * Math.PI / 180;
  // hlava a krk: pohyby z Mixamo (mluví vsedě, rozhlíží se) otáčejí hlavou až o 90° a rychle zpátky – s natáčením
  // za myší to vypadalo jako otočka dokola. Otočení kolem osy krku se omezí (hlava ±35°, krk ±18°).
  const neckBones = [];
  function limitTwist(b, max) {
    const q = b.quaternion;
    twQ.set(0, q.y, 0, q.w).normalize();
    swQ.copy(q).multiply(twInv.copy(twQ).invert());
    let a = 2 * Math.atan2(twQ.y, twQ.w);
    if (a > Math.PI) a -= 2 * Math.PI;
    if (a < -Math.PI) a += 2 * Math.PI;
    a = Math.max(-max, Math.min(max, a));
    twQ.set(0, Math.sin(a / 2), 0, Math.cos(a / 2));
    q.copy(swQ).multiply(twQ);
  }
  function fixHead() {
    if (head) limitTwist(head, 35 * Math.PI / 180);
    for (const n of neckBones) limitTwist(n, 18 * Math.PI / 180);
  }
  function fixKnees() {
    fixHead();
    for (const b of legs) {
      const q = b.quaternion;
      twQ.set(0, q.y, 0, q.w).normalize();
      swQ.copy(q).multiply(twInv.copy(twQ).invert());
      let a = 2 * Math.atan2(twQ.y, twQ.w);
      if (a > Math.PI) a -= 2 * Math.PI;
      if (a < -Math.PI) a += 2 * Math.PI;
      a = Math.max(-TWIST_MAX, Math.min(TWIST_MAX, a));
      twQ.set(0, Math.sin(a / 2), 0, Math.cos(a / 2));
      q.copy(swQ).multiply(twQ);
    }
  }

  // ---------- přichycení k zemi ----------
  // Pohyby z Mixamo jsou pro delší nohy, Kevinovi chodidla v chůzi a běhu propadají pod podlahu nebo se vznášejí
  // a dopady začínají ve vzduchu. Každý snímek: nejnižší kost chodidla (Foot/ToeBase) se srovná na výšku,
  // jakou má v klidu – kromě pohybů, kde má být ve vzduchu nebo mu nohy visí (skok, pád, visení, šplh, sezení).
  const AIR = new Set(['dropHang', 'jump', 'fallLoop', 'fall', 'hang', 'hangJump', 'climbUp', 'climb', 'sitUp', 'sitEdge', 'sit', 'sitTalk', 'thumbsUp',
    'swim', 'lie', 'lyingPose', 'flair', 'breakdance', 'dive', 'shimmy', 'typing', 'sitting']);
  const fw = new THREE.Vector3();
  function lowestFoot(model, name) {
    if (!feet.length) return null;
    if (name && actions[name]) { const a = actions[name]; a.reset().play(); mixer.setTime(0); }
    model.updateMatrixWorld(true);
    let m = Infinity;
    for (const b of feet) m = Math.min(m, b.getWorldPosition(fw).y);
    if (name && actions[name]) { actions[name].stop(); mixer.setTime(0); }
    return m;
  }
  function groundLock(dt) {
    if (opts.groundLock === false || footRest == null || !feet.length) return;
    const clip = wanted();
    const on = !AIR.has(String(clip).split('@')[0]) && !special && spinT < 0;
    // plynulé zapnutí a vypnutí (0,2 s), ať při přechodu do skoku a z něj necukne
    groundK = Math.max(0, Math.min(1, groundK + (on ? 1 : -1) * dt / 0.2));
    holder.updateMatrixWorld(true);
    let m = Infinity;
    for (const b of feet) m = Math.min(m, b.getWorldPosition(fw).y);
    groundY = (footRest - (m - holder.position.y)) * groundK;
    holder.position.y += groundY;
  }

  // ---------- drawing ----------
  let last = -1, drawn = false;
  function frame(now) {
    if (disposed) return;
    requestAnimationFrame(frame);
    if (drawn && (paused || (document.hidden && !opts.alwaysRender))) { last = now; return; }
    const t = now / 1000;
    if (last < 0) last = now;
    const dt = Math.min(0.1, (now - last) / 1000);
    if (drawn && dt < 1 / 32) return;   // ~30 fps is plenty for a mascot
    last = now;
    clock = t;
    if (!mixer) return;
    drawn = true;
    if (act && t >= actEnd) { act = null; special = null; crossfade(); }
    const frozen = t < frozenUntil;
    if (!frozen) mixer.update(dt);
    // he stays on his spot: the moves may sway the hips but never carry him out of the window
    if (hips && hipsRest) {
      // boky drží na místě; pohyby s ukotvením ke konci (sednutí a vstávání) se posunou tak, aby konec
      // (stoj) byl přesně na místě – jinak nohy při sedání ujížděly dopředu
      const an = anchor[wanted()];
      hips.position.x = hipsRest.x + (an ? hips.position.x - an.x : 0);
      hips.position.z = hipsRest.z + (an ? hips.position.z - an.z : 0);
    }
    // the head follows the mouse a little (on top of whatever the move does; the move resets it each frame)
    if (!frozen) fixKnees();
    if (tail.length && hips) updateTail(t, frozen ? 0 : dt);
    if (mouth) updateMouth(t, dt);
    if (head && !frozen) {
      // když mluví, kouká na diváka: s otevřenou pusou se hlava natáčí jen málo (pusa je obrázek zepředu)
      const calm = mouth ? 1 - 0.75 * Math.min(1, mouth.cur * 2.5) : 1;
      // natočení za myší jako malé pootočení navíc (kvaternion) – přičítání k Eulerovým úhlům hlavu
      // v některých polohách (mluví vsedě) otočilo o 360°
      lookQ.setFromAxisAngle(Y_AXIS, lookX * 0.45 * calm);
      head.quaternion.multiply(lookQ);
      lookQ.setFromAxisAngle(X_AXIS, lookY * 0.2);
      head.quaternion.multiply(lookQ);
    }
    // a full spin on demand, hiding and walking off for two surprises (sulking he shrugs, never turns his back)
    let yaw = turnTo;
    if (spinT >= 0) {
      spinT += dt;
      const p = Math.min(1, spinT / 1.1);
      yaw += (1 - Math.cos(p * Math.PI)) * Math.PI;
      if (p >= 1) spinT = -1;
    }
    holder.position.set(0, 0, 0);
    if (special) {
      specialT += dt;
      const p = Math.min(1, specialT / special.len), h = Math.min(1, p / 0.2, (1 - p) / 0.2);
      if (special.name === 'hide') holder.position.y = -2.6 * h;
      if (special.name === 'leave') { holder.position.x = 3 * h; yaw += Math.PI / 2 * Math.min(1, h * 3); }
    }
    if (spinT >= 0 || special) holder.rotation.y = yaw;
    else {
      // vždy kratší cestou (po otočce dokola zůstávalo +360° a Kevin se pak celý otočil zpátky)
      let d = yaw - holder.rotation.y;
      d = ((d + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
      holder.rotation.y = yaw - d + d * 0.15;
    }
    groundLock(frozen ? 0 : dt);
    renderer.render(scene, cam);
  }
  requestAnimationFrame(frame);

  const api = {
    setPose(p) {
      if (!POSES[p]) return;
      // sulking: a shrug first, then he leans back bored
      if (p === 'sulk' && pose !== 'sulk' && actions.shrug && !act) { act = 'shrug'; actEnd = clock + actions.shrug.getClip().duration; }
      pose = p;
      crossfade();
    },
    get pose() { return pose; },
    setTalking(on) {
      on = !!on;
      if (on && !talking) talkClip = TALK[Math.floor(Math.random() * TALK.length)];
      talking = on;
      crossfade();
    },
    spin() { spinT = 0; },
    // a one-shot act from "Do something"; returns how long it takes (ms), 0 for one he can't do
    act(name) {
      if (CANNOT.has(name) || !(name in ACTS)) return 0;
      if (name === 'freeze') { frozenUntil = clock + 3; return 3000; }
      const clipName = ACTS[name];
      let len = 3;
      if (name === 'hide') { special = { name, len: 3.2 }; specialT = 0; len = 3.2; }
      if (clipName && actions[clipName]) {
        const clip = actions[clipName].getClip();
        len = name === 'leave' ? 3.6 : DANCES.has(clipName) ? Math.max(clip.duration < 6 ? clip.duration : 0, DANCE_S) : clip.duration < 6 ? clip.duration : LOOP_ACT_S;
        if (name === 'leave') { special = { name, len }; specialT = 0; }
        act = clipName;
        crossfade();
      }
      actEnd = clock + len;
      return len * 1000;
    },
    can(feature) { return !CANNOT.has(feature); },
    // any of his clips by name (the cinema): hold(name) keeps it going until hold(null); once(name) plays it
    // through and returns its length in ms; turn(yaw) turns him (radians, 0 = facing us)
    hold(name, fade) { held = name && actions[name] ? name : null; if (held) actions[held].timeScale = 1; if (fade) nextFade = fade; crossfade(); },
    // výřez z pohybu (vteřiny od–do) jako nový pohyb: z delšího se dá vzít jen užitečný kousek
    cut(name, from, to, newName) {
      if (!actions[name] || !mixer) return false;
      const c = actions[name].getClip(), fps = 30;
      const sub = THREE.AnimationUtils.subclip(c, newName, Math.round(from * fps), Math.max(Math.round(from * fps) + 1, Math.round(to * fps)), fps);
      actions[newName] = mixer.clipAction(sub);
      if (anchor[name]) anchor[newName] = anchor[name];
      return true;
    },
    // ukotvit pohyb ke konci: boky se posunou tak, aby jeho poslední snímek byl na místě (sednutí / vstávání)
    anchorEnd(name) {
      const a = actions[name]; if (!a) return;
      const tr = a.getClip().tracks.find(t => /Hips\.position$/.test(t.name)); if (!tr) return;
      const v = tr.values, k = v.length / 3;
      anchor[name] = { x: v[(k - 1) * 3], z: v[(k - 1) * 3 + 2] };
    },
    // zůstat v jednom okamžiku pohybu (např. poslední snímek slézání = vis, první snímek vstávání = sed)
    holdAt(name, t) {
      const a = actions[name]; if (!a) return;
      const key = name + '@' + t.toFixed(2);
      if (!actions[key]) api.cut(name, Math.max(0, t), t + 1 / 30, key);
      api.hold(key);
    },
    // otočit hned (bez dotáčení) – po pohybu, který tělo sám otočil (otočka na místě)
    turnNow(yaw) { turnTo = yaw || 0; holder.rotation.y = turnTo; },
    get yaw() { return turnTo; },
    // o kolik css px pohyb posune tělo dopředu (pohyby, které nejsou „In Place“) – okénko jede stejně, nohy nekloužou
    travelPx(name) {
      const v = travel[name] || 0;
      return v * hipsH * canvas.clientHeight / (2 * view.z * Math.tan(cam.fov * Math.PI / 360));
    },
    // reverse: pozpátku (např. „Sit To Stand“ pozpátku = sedá si)
    once(name, reverse) {
      if (!actions[name]) return 0;
      actions[name].timeScale = reverse ? -1 : 1;
      act = name;
      actEnd = clock + actions[name].getClip().duration;
      crossfade();
      return actions[name].getClip().duration * 1000;
    },
    turn(yaw) { turnTo = yaw || 0; },
    has(name) { return !!actions[name]; },
    // výraz pusy na chvíli (index tvaru v kevin/pusy.webp: 1 úsměv, 2 zubí se, 15 olízne se, 16 zívá, 18 mňau,
    // 19 jazyk, 20 šibal, 21 překvapený, 23 naštvaný)
    expression(k, ms = 1600) { forcedFace = k; forcedUntil = clock + ms / 1000; },
    // další pohyby (AnimationClip z Mixamo, např. FBXLoader): jen stopy kostí, které Kevin má; posun boků
    // z centimetrů FBX na měřítko modelu podle výšky boků v prvním snímku
    addClips(clips) {
      const fbxScale = () => {
        if (fbxK) return fbxK;
        const it = actions.idle && actions.idle.getClip().tracks.find(t => /Hips\.position$/.test(t.name));
        fbxK = (it ? it.values[1] : hipsRest ? hipsRest.y : 1) / 0.6826;
        return fbxK;
      };
      if (!mixer) return [];
      const names = new Set(); mixer.getRoot().traverse(o => { if (o.isBone) names.add(o.name); });
      return clips.map(c => {
        c.tracks = c.tracks.filter(tr => names.has(tr.name.split('.')[0]));
        const hp = c.tracks.find(tr => /Hips\.position$/.test(tr.name));
        // jedno měřítko pro všechny pohyby: FBX z Mixamo jsou v metrech, Kevin v klidu (Breathing Idle) má boky
        // ve 0,68 m – to odpovídá výšce boků v jeho klidovém pohybu z modelu (dřív se každý pohyb srovnal podle
        // svého prvního snímku, takže pohyby začínající v podřepu ho zvedaly a jiné propadaly pod hranu)
        if (hp && hp.values[1] > 0) { for (let i = 0; i < hp.values.length; i++) hp.values[i] *= fbxScale(); }
        actions[c.name] = mixer.clipAction(c);
        return c.name;
      });
    },
    look(x, y) { lookX = Math.max(-1, Math.min(1, x)); lookY = Math.max(-1, Math.min(1, y)); },
    setLight,
    setPaused(p) { paused = !!p; },
    setSpeed(s) { if (mixer) mixer.timeScale = s; },   // zpomalení pohybů (přehlídka)
    // css pixels a second the walker must move so his feet don't skate (0 before the model is loaded)
    walkPxPerSec(name) {
      const v = name && name !== 'walk' ? speeds[name] : walkSpeed;
      if (!v) return 0;
      return v * canvas.clientHeight / (2 * view.z * Math.tan(cam.fov * Math.PI / 360));
    },
    // kde je kost na obrázku: y v css px od horního okraje plátna (např. 'LeftHand', 'Hips') – podle toho se
    // Kevin zavěsí rukama na hranu karty nebo si sedne zadkem na hranu
    boneY(name) {
      let b = null;
      if (mixer) mixer.getRoot().traverse(o => { if (!b && o.isBone && new RegExp('mixamorig:?' + name + '$').test(o.name)) b = o; });
      if (!b) return null;
      b.updateWorldMatrix(true, false);
      const v = b.getWorldPosition(new THREE.Vector3()).project(cam);
      return (1 - v.y) / 2 * canvas.clientHeight;
    },
    // kontrola (testy): pohyb `name` zastavený v čase t (vteřiny) – pak boneY ukáže, kde v tu chvíli kost je
    poseAt(name, t) {
      if (!actions[name] || !mixer) return false;
      mixer.stopAllAction();
      const a = actions[name]; a.reset().setEffectiveWeight(1).play(); a.time = t; mixer.update(0); fixKnees();
      if (hips && hipsRest) { hips.position.x = hipsRest.x; hips.position.z = hipsRest.z; }
      playing = null;
      return true;
    },
    // kontrola (testy): natočení hlavy vůči bokům ve stupních (kolem svislé osy) – hlídá „otočení hlavy dokola“
    headYaw() {
      if (!head || !hips) return 0;
      const hq = head.getWorldQuaternion(new THREE.Quaternion()), bq = hips.getWorldQuaternion(new THREE.Quaternion());
      const f = new THREE.Vector3(0, 0, 1).applyQuaternion(bq.invert().multiply(hq));
      return Math.round(Math.atan2(f.x, f.z) * 180 / Math.PI);
    },
    // o kolik se tělo v pohybu otočí od začátku do konce (radiány kolem svislé osy)
    clipYaw(name) {
      if (!actions[name] || !hips) return 0;
      const yawOf = () => { const f = new THREE.Vector3(0, 0, 1).applyQuaternion(hips.getWorldQuaternion(new THREE.Quaternion())); return Math.atan2(f.x, f.z); };
      api.poseAt(name, 0); const a = yawOf();
      api.poseAt(name, actions[name].getClip().duration - 0.01); const b = yawOf();
      api.poseAt('idle', 0);
      let d = b - a; d = ((d + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
      return d;
    },
    // délka klipu v ms (0 = nemá ho)
    clipMs(name) { return actions[name] ? actions[name].getClip().duration * 1000 : 0; },
    // ostrost obrazu (slabý telefon: méně pixelů = plynulejší hra); 0 = výchozí
    setMaxPixelRatio(r) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, r || 1.75));
      resize();
    },
    dispose() {
      disposed = true;
      ro.disconnect();
      renderer.dispose();
      pmrem.dispose();
    }
  };
  return api;
}
