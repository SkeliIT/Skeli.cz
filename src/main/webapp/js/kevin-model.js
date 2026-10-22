// MC Kevin – the ginger cat in his hoodie (kevin/kevin.glb): a model made from the user's pictures (Rodin),
// a skeleton and 38 moves from Mixamo, joined and compressed (meshopt, WebP) into one file of about 5 MB.
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
// (each surprise in kevin-lines.js is one of his real moves; beatbox and the rhyme dance with a beat)
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
  let foot = null, walkSpeed = 0;   // walkSpeed: how fast the floor runs under his feet in the walk (world units a second)

  function wanted() {
    if (act) return act;
    if (held) return held;
    if (talking && (pose === 'idle' || pose === 'point' || pose === 'cool')) return talkClip;
    return POSES[pose] || 'idle';
  }
  function crossfade() {
    if (!mixer) return;
    const name = wanted(), next = actions[name] || actions.idle;
    if (!next || next === playing) return;
    next.reset().setEffectiveWeight(1).fadeIn(0.3).play();
    if (playing) playing.fadeOut(0.3);
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
    mixer = new THREE.AnimationMixer(model);
    for (const clip of g.animations) actions[clip.name] = mixer.clipAction(clip);
    walkSpeed = measureWalk(model);
    crossfade();
    renderer.render(scene, cam);
    if (opts.onReady) opts.onReady();
  }, undefined, err => { if (opts.onError) opts.onError(err); });

  // The walk is in place (the hips are held still), so a planted foot slides back under him at the speed he would
  // move: sampled once over the clip, the foot's speed while it is down on the floor. Moving him by just that much
  // keeps his feet from skating (js/kevin.js walk).
  function measureWalk(model) {
    const a = actions.walk;
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
    if (hips && hipsRest) { hips.position.x = hipsRest.x; hips.position.z = hipsRest.z; }
    // the head follows the mouse a little (on top of whatever the move does; the move resets it each frame)
    if (head && !frozen) {
      head.rotation.y += lookX * 0.45;
      head.rotation.x += lookY * 0.2;
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
    holder.rotation.y = spinT >= 0 || special ? yaw : holder.rotation.y + (yaw - holder.rotation.y) * 0.15;
    renderer.render(scene, cam);
  }
  requestAnimationFrame(frame);

  return {
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
    hold(name) { held = name && actions[name] ? name : null; crossfade(); },
    once(name) {
      if (!actions[name]) return 0;
      act = name;
      actEnd = clock + actions[name].getClip().duration;
      crossfade();
      return actions[name].getClip().duration * 1000;
    },
    turn(yaw) { turnTo = yaw || 0; },
    has(name) { return !!actions[name]; },
    look(x, y) { lookX = Math.max(-1, Math.min(1, x)); lookY = Math.max(-1, Math.min(1, y)); },
    setLight,
    setPaused(p) { paused = !!p; },
    // css pixels a second the walker must move so his feet don't skate (0 before the model is loaded)
    walkPxPerSec() {
      if (!walkSpeed) return 0;
      return walkSpeed * canvas.clientHeight / (2 * view.z * Math.tan(cam.fov * Math.PI / 360));
    },
    dispose() {
      disposed = true;
      ro.disconnect();
      renderer.dispose();
      pmrem.dispose();
    }
  };
}
