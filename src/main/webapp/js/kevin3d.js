// MC Kevin in 3D (Three.js, self-hosted in js/vendor/three). The look was approved by the user
// on the prototype (skeli-navrh/kevin-3d.html) – keep it. Loaded lazily by js/kevin.js.
//   const k = createKevin(canvas, { light: false });
//   k.setPose('idle'|'rap'|'beatbox'|'cool'|'point'|'sleep'|'sulk'); k.spin(); k.look(x, y);
//   k.setTalking(true); k.setLight(true); k.setPaused(true); k.dispose();
//   opts.yaw turns him to a fixed angle (preview shots from the side)
import * as THREE from './vendor/three/three.module.min.js';
import { RoomEnvironment } from './vendor/three/RoomEnvironment.js';

const BPM = 90;

// the site's logos as alpha maps (white = where the gold goes); bold > 0 thickens the thin
// hand-written strokes (drawn again around a small circle) so they stay readable on the cap
function logoTexture(src, w, h, bold = 0) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const tex = new THREE.CanvasTexture(c);
  const img = new Image();
  img.onload = () => {
    const g = c.getContext('2d');
    const k = Math.min(w / img.width, h / img.height), iw = img.width * k, ih = img.height * k;
    const x = (w - iw) / 2, y = (h - ih) / 2;
    g.drawImage(img, x, y, iw, ih);
    for (let i = 0; bold && i < 16; i++) {
      const a = i / 16 * Math.PI * 2;
      g.drawImage(img, x + Math.cos(a) * bold, y + Math.sin(a) * bold, iw, ih);
    }
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#fff';
    g.fillRect(0, 0, w, h);
    tex.needsUpdate = true;
  };
  img.src = src;
  return tex;
}

function buildKevin(imgBase) {
  const capLogo = logoTexture(imgBase + 'logo-skelosquad.svg', 1024, 260, 3);
  const squadLogo = logoTexture(imgBase + 'squad-logo.webp', 1024, 300, 3);
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xffc83a, metalness: 1, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.15 });
  const goldSoft = new THREE.MeshPhysicalMaterial({ color: 0xffe08a, metalness: 1, roughness: 0.38 });
  const printGold = (map) => new THREE.MeshPhysicalMaterial({ color: 0xffcf3a, metalness: 1, roughness: 0.25, alphaMap: map, transparent: true, side: THREE.DoubleSide });
  const cloth = new THREE.MeshStandardMaterial({ color: 0x17171b, roughness: 0.85, metalness: 0 });
  const clothDark = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.9 });
  const eyeMat = new THREE.MeshPhysicalMaterial({ color: 0x050403, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02 });
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const nose = new THREE.MeshPhysicalMaterial({ color: 0xb8665a, metalness: 0.6, roughness: 0.3 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xc9c9d0, metalness: 1, roughness: 0.35 });
  const lens = new THREE.MeshPhysicalMaterial({ color: 0x070709, metalness: 0.4, roughness: 0.05, clearcoat: 1 });

  const kevin = new THREE.Group();
  const body = new THREE.Group();
  kevin.add(body);

  // hoodie: a lathe from the hem up to the neck, the hood lying around the neck
  const prof = [[0, 0], [0.88, 0.02], [0.99, 0.25], [0.95, 0.7], [0.8, 1.05], [0.58, 1.28], [0.0, 1.32]].map(p => new THREE.Vector2(p[0], p[1]));
  body.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 64), cloth));
  const hood = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.17, 20, 48), cloth);
  hood.rotation.x = Math.PI / 2;
  hood.position.y = 1.27;
  body.add(hood);
  // gold SKELO SQUAD print on the chest and, bigger, on the back
  const front = new THREE.Mesh(new THREE.CylinderGeometry(0.975, 0.975, 0.3, 48, 1, true, -0.66, 1.32), printGold(squadLogo));
  front.position.y = 0.62;
  body.add(front);
  const back = new THREE.Mesh(new THREE.CylinderGeometry(0.975, 0.975, 0.36, 48, 1, true, Math.PI - 0.8, 1.6), printGold(squadLogo));
  back.position.y = 0.66;
  body.add(back);
  for (const x of [-0.16, 0.16]) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.7 }));
    s.position.set(x, 1.08, 0.78);
    s.rotation.x = -0.35;
    body.add(s);
  }
  // gold chain of small links with a cat-paw pendant
  const chainCurve = new THREE.EllipseCurve(0, 0, 0.55, 0.55, 0, Math.PI * 2);
  const link = new THREE.TorusGeometry(0.045, 0.016, 8, 16);
  for (let i = 0; i < 36; i++) {
    const t = i / 36, p = chainCurve.getPoint(t);
    const m = new THREE.Mesh(link, gold);
    m.position.set(p.x, 1.25 - Math.max(0, p.y) * 0.5, p.y * (p.y > 0 ? 1.62 : 0.9));
    m.rotation.set(Math.PI / 2, i % 2 ? Math.PI / 2 : 0, t * Math.PI * 2);
    body.add(m);
  }
  const pendant = new THREE.Group();
  pendant.position.set(0, 0.88, 0.92);
  pendant.rotation.x = -0.25;
  body.add(pendant);
  const pad = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), gold);
  pad.scale.set(1.2, 0.9, 0.45);
  pendant.add(pad);
  for (const [x, y] of [[-0.11, 0.1], [-0.04, 0.16], [0.04, 0.16], [0.11, 0.1]]) {
    const toe = new THREE.Mesh(new THREE.SphereGeometry(0.042, 16, 12), gold);
    toe.position.set(x, y, 0);
    toe.scale.z = 0.5;
    pendant.add(toe);
  }
  // hind feet and the tail
  for (const x of [-0.5, 0.5]) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 20), gold);
    f.scale.set(1, 0.62, 1.25);
    f.position.set(x, 0.15, 0.58);
    body.add(f);
  }
  const tailCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.5, 0.18, -0.8), new THREE.Vector3(1.2, 0.2, -0.55), new THREE.Vector3(1.5, 0.35, 0.1), new THREE.Vector3(1.3, 0.6, 0.55)]);
  const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 48, 0.15, 16), gold);
  body.add(tail);
  // the tube is open at both ends (you could see through the tip): round caps
  for (const t of [0, 1]) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), gold);
    cap.position.copy(tailCurve.getPoint(t));
    tail.add(cap);
  }

  // arms in sleeves with gold paws; the right one holds the mic
  function arm() {
    const g = new THREE.Group();
    const sl = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.55, 8, 16), cloth);
    sl.position.y = -0.4;
    g.add(sl);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.1, 20), clothDark);
    cuff.position.y = -0.72;
    g.add(cuff);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), gold);
    paw.scale.set(1, 0.9, 1.05);
    paw.position.y = -0.86;
    g.add(paw);
    return g;
  }
  const armL = arm();
  armL.position.set(-0.78, 1.08, 0.24);
  body.add(armL);
  const armR = arm();
  armR.position.set(0.78, 1.08, 0.24);
  body.add(armR);
  // a handheld mic: the paw grips the middle of the handle, the head with its wire mesh
  // sticks out in front of the paw (towards the mouth when he raps)
  const mic = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.05, 0.46, 20), new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.35, metalness: 0.5 }));
  mic.add(handle);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.072, 0.07, 20), gold);
  ring.position.y = 0.26;
  mic.add(ring);
  const grille = new THREE.Mesh(new THREE.SphereGeometry(0.17, 28, 20), steel);
  grille.position.y = 0.4;
  mic.add(grille);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.173, 14, 10), new THREE.MeshBasicMaterial({ color: 0x3a3a40, wireframe: true }));
  mesh.position.y = 0.4;
  mic.add(mesh);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.016, 8, 32), gold);
  band.position.y = 0.4;
  band.rotation.x = Math.PI / 2;
  mic.add(band);
  mic.position.set(0.02, -0.9, 0.26);
  mic.rotation.x = 0.45;           // the head leans forward, in front of the sleeve
  armR.add(mic);

  // head
  const head = new THREE.Group();
  head.position.y = 2.05;
  kevin.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), gold);
  skull.scale.set(1.14, 0.96, 0.98);
  head.add(skull);
  for (const m of [-1, 1]) {
    const ch = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 20), gold);
    ch.position.set(m * 0.84, -0.3, 0.22);
    ch.scale.set(0.7, 0.6, 0.75);
    head.add(ch);
    head.add(ear(m));
  }
  // one ear: a rounded gold shell at the back, a flat front face and the pink inside set
  // into that face (two cones one in front of the other looked like two triangles from the side)
  function ear(m) {
    const g = new THREE.Group();
    g.position.set(m * 0.7, 0.98, 0.04);
    g.rotation.z = -m * 0.38;
    const shell = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.9, 32, 1, false, Math.PI / 2, Math.PI), gold);
    shell.scale.z = 0.62;
    g.add(shell);
    const tri = (w, h, y0, r) => {
      const s = new THREE.Shape();
      s.moveTo(-w, y0);
      s.lineTo(-r, y0 + h - r * 2.2);
      s.quadraticCurveTo(0, y0 + h, r, y0 + h - r * 2.2);
      s.lineTo(w, y0);
      s.quadraticCurveTo(0, y0 + 0.06, -w, y0);
      return new THREE.ShapeGeometry(s, 8);
    };
    const face = new THREE.Mesh(tri(0.42, 0.9, -0.45, 0.04), gold);
    g.add(face);
    const inside = new THREE.Mesh(tri(0.27, 0.66, -0.4, 0.03), nose);
    inside.position.z = 0.004;
    g.add(inside);
    return g;
  }
  // big glossy eyes with catch lights (the eye group scales to blink / close)
  const eyes = [];
  for (const m of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(m * 0.4, 0.05, 0.84);
    head.add(eye);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.27, 32, 24), eyeMat);
    e.scale.set(1, 1.15, 0.55);
    eye.add(e);
    const c1 = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), white);
    c1.position.set(-0.08, 0.1, 0.14);
    eye.add(c1);
    const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), white);
    c2.position.set(0.09, -0.11, 0.14);
    eye.add(c2);
    eyes.push(eye);
  }
  for (const m of [-1, 1]) {
    const mz = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), goldSoft);
    mz.position.set(m * 0.13, -0.3, 0.86);
    mz.scale.set(1, 0.8, 0.7);
    head.add(mz);
  }
  const noseM = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), nose);
  noseM.scale.set(1.3, 0.8, 0.7);
  noseM.position.set(0, -0.17, 0.98);
  head.add(noseM);
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 12), new THREE.MeshStandardMaterial({ color: 0x2a0d08, roughness: 0.6 }));
  mouth.position.set(0, -0.48, 0.86);
  mouth.scale.set(1, 0.05, 0.5);
  head.add(mouth);
  const whisker = new THREE.MeshBasicMaterial({ color: 0xfff3c4 });
  for (const m of [-1, 1]) for (const k of [0, 1]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.7, 6), whisker);
    w.position.set(m * 0.62, -0.32 - k * 0.08, 0.82);
    w.rotation.z = Math.PI / 2 + m * (0.12 - k * 0.18);
    head.add(w);
  }
  // sunglasses for the "cool" pose
  const shades = new THREE.Group();
  shades.position.set(0, 0.06, 0.98);
  for (const m of [-1, 1]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.06), lens);
    l.position.x = m * 0.36;
    l.rotation.y = m * 0.18;
    shades.add(l);
  }
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.05), lens);
  bridge.position.y = 0.08;
  shades.add(bridge);
  shades.visible = false;
  head.add(shades);
  // cap: black crown, brim, button, gold SKELOSQUAD lettering on the front
  const cap = new THREE.Group();
  cap.position.y = 0.4;
  cap.rotation.z = -0.1;
  head.add(cap);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(1.03, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2.15), cloth);
  crown.scale.set(1.06, 0.74, 1.0);
  cap.add(crown);
  // brim: a half ring whose inner edge is the front of the crown's rim, so it grows out of the
  // cap; widest in front, tapering to nothing at the sides, the front tilted slightly up so the
  // eyes stay visible. Drawn from both sides (it is a thin sheet).
  const HEM_Y = Math.cos(Math.PI / 2.15) * 1.03 * 0.74;          // height of the crown's rim
  const HEM_X = Math.sin(Math.PI / 2.15) * 1.03 * 1.06, HEM_Z = Math.sin(Math.PI / 2.15) * 1.03;
  const OUT = 0.6;
  const brimGeo = new THREE.RingGeometry(1, 2, 48, 3, 0, Math.PI);
  const bp = brimGeo.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const x = bp.getX(i), y = bp.getY(i), a = Math.atan2(y, x), t = Math.hypot(x, y) - 1;   // t: 0 inner .. 1 outer
    const w = t * (0.04 + OUT * Math.pow(Math.max(0, Math.sin(a)), 1.3));
    bp.setXY(i, Math.cos(a) * HEM_X, Math.sin(a) * (HEM_Z + w));   // only forward, never wider than the head
  }
  brimGeo.computeVertexNormals();
  brimGeo.rotateX(Math.PI / 2);              // lie flat; the ring's +y half becomes the front (+z)
  const brim = new THREE.Mesh(brimGeo, new THREE.MeshStandardMaterial({ color: 0x101012, roughness: 0.85, side: THREE.DoubleSide }));
  brim.position.y = HEM_Y;
  brim.rotation.x = -0.1;                    // the front lifts a little
  cap.add(brim);
  const btn = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), cloth);
  btn.position.y = 0.76;
  cap.add(btn);
  // the lettering sits on the front panel above the brim (lower, the brim hid the letters' feet)
  const capPrint = new THREE.Mesh(new THREE.SphereGeometry(1.04, 48, 16, Math.PI / 2 - 0.62, 1.24, 0.5, 0.62), printGold(capLogo));
  capPrint.scale.set(1.06, 0.74, 1.0);
  cap.add(capPrint);

  kevin.userData = { head, body, armR, armL, mouth, eyes, shades, cap, tail };
  return kevin;
}

// arm angles per pose: [right x, right z, left x, left z]
const ARMS = {
  idle: [0, 0.22, 0, -0.22],
  rap: [-2.45, 0.32, -1.6, -0.22],      // the mic in front of his mouth
  beatbox: [-2.25, -0.85, -2.25, 0.85],
  cool: [-1.15, 1.05, -1.25, -1.05],
  point: [0, 0.22, -1.45, 0.05],
  sleep: [0, 0.12, 0, -0.12],
  sulk: [0, 0.22, 0, -0.22]
};

export function createKevin(canvas, opts = {}) {
  const imgBase = opts.img || '/img/';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  cam.position.set(0, 1.95, 9.4);
  cam.lookAt(0, 1.62, 0);
  const key = new THREE.DirectionalLight(0xfff1d6, 1.6);
  key.position.set(-3, 5, 6);
  scene.add(key);
  // ember rim light from behind (the sparks in the smoke); sky blue in the light theme
  const rim = new THREE.DirectionalLight(0xff7a2a, 3.2);
  rim.position.set(3, 3, -5);
  scene.add(rim);
  const kevin = buildKevin(imgBase);
  scene.add(kevin);
  const u = kevin.userData;
  kevin.rotation.y = opts.yaw || 0;

  let pose = 'idle', talking = false, paused = false, lookX = 0, lookY = 0, spinT = -1, disposed = false, drawn = false;
  function setLight(light) {
    rim.color.set(light ? 0x9cc8ff : 0xff7a2a);
    rim.intensity = light ? 1.6 : 3.2;
    renderer.toneMappingExposure = light ? 1.0 : 1.15;
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

  // time from requestAnimationFrame itself (a THREE.Clock does not advance in headless test browsers)
  let start = -1, last = 0;
  function frame(now) {
    if (disposed) return;
    requestAnimationFrame(frame);
    // nothing to draw in a hidden tab or while minimised (the first frame is always drawn)
    if (drawn && (paused || (document.hidden && !opts.alwaysRender))) return;
    if (start < 0) start = now;
    const t = (now - start) / 1000;
    if (drawn && t - last < 1 / 32) return;   // ~30 fps is plenty for a mascot
    const dt = drawn ? Math.min(0.1, t - last) : 0;
    drawn = true;
    last = t;
    const beat = t * (BPM / 60) * Math.PI * 2;
    const ease = (cur, to, k) => cur + (to - cur) * k;
    const asleep = pose === 'sleep';
    // turn towards the mouse (away when sulking), a full spin on demand
    let yaw = pose === 'sulk' ? Math.PI : (opts.yaw ?? 0) + lookX * 0.6;
    if (spinT >= 0) {
      spinT += dt;
      const p = Math.min(1, spinT / 1.1);
      yaw += (1 - Math.cos(p * Math.PI)) * Math.PI;
      if (p >= 1) spinT = -1;
    }
    kevin.rotation.y = spinT >= 0 ? yaw : ease(kevin.rotation.y, yaw, 0.08);
    u.head.rotation.x = ease(u.head.rotation.x, asleep ? 0.38 : lookY * 0.25, 0.08);
    // nod to the beat (calm breathing when asleep)
    const nod = asleep ? Math.sin(t * 1.4) * 0.02 : Math.abs(Math.sin(beat / 2));
    u.body.position.y = asleep ? 0 : nod * 0.05;
    u.head.position.y = 2.05 + (asleep ? nod : nod * 0.09);
    u.head.rotation.z = asleep ? 0.12 : Math.sin(beat / 2) * 0.05;
    const a = ARMS[pose] || ARMS.idle;
    const wobble = pose === 'rap' ? Math.sin(beat) * 0.25 : 0;
    u.armR.rotation.x = ease(u.armR.rotation.x, a[0], 0.12);
    u.armR.rotation.z = ease(u.armR.rotation.z, a[1], 0.12);
    u.armL.rotation.x = ease(u.armL.rotation.x, a[2] + wobble, 0.12);
    u.armL.rotation.z = ease(u.armL.rotation.z, a[3], 0.12);
    const open = talking || pose === 'rap' || pose === 'beatbox';
    u.mouth.scale.y = ease(u.mouth.scale.y, open ? 0.35 + Math.abs(Math.sin(beat * 2)) * 0.6 : 0.05, 0.3);
    u.shades.visible = pose === 'cool';
    // blink every few seconds; closed when asleep, happy squint for beatbox
    const blink = (t % 4.2) < 0.12;
    const eyeY = asleep ? 0.08 : pose === 'beatbox' ? 0.35 : blink ? 0.1 : 1;
    u.eyes.forEach(e => { e.scale.y = ease(e.scale.y, eyeY, 0.5); });
    u.tail.rotation.y = Math.sin(t * 1.3) * 0.12;
    renderer.render(scene, cam);
  }
  requestAnimationFrame(frame);

  return {
    setPose(p) { if (ARMS[p]) pose = p; },
    get pose() { return pose; },
    setTalking(on) { talking = !!on; },
    spin() { spinT = 0; },
    look(x, y) { lookX = Math.max(-1, Math.min(1, x)); lookY = Math.max(-1, Math.min(1, y)); },
    setLight,
    setPaused(p) { paused = !!p; },
    dispose() {
      disposed = true;
      ro.disconnect();
      renderer.dispose();
      pmrem.dispose();
    }
  };
}
