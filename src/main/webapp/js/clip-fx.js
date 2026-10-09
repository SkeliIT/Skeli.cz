/* Water and fire around a clip (song page and the Music page's player): blue water flows out of the left of the
   video, fire out of the right, they meet under it, and everything fades out at an invisible
   ellipse round the video (never above it). It swells with the music: bass at the bottom,
   treble up the sides.

   The YouTube player can't be listened to from our page, so the music comes from data made
   in advance (/eq/<clip>.json: loudness of 16 bands 20x a second, the colours of the
   picture's edges 4x a second). A clip without data still gets the effect in a calm steady
   rhythm, with the colours of its thumbnail. The player tells us where it is (the same
   messages the YouTube IFrame API uses), so the data stays in step with the clip.

   Switch: Full / Soft / Off (remembered in this browser); reduced motion = soft and slow. */
(function () {
  // the page marks the room for the effect [data-clip-fx] and the player in it [data-clip-player];
  // the player says which clip it shows in data-yt
  var stage = document.querySelector('[data-clip-fx]');
  var player = stage && stage.querySelector('[data-clip-player]');
  if (!player || stage.dataset.fx) return;
  stage.dataset.fx = '1';
  var glCanvas = stage.querySelector('.clip-fx-gl'), cv = stage.querySelector('.clip-fx-2d');
  var gl = glCanvas && glCanvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl || !cv) { stage.classList.add('no-fx'); return; }
  var ctx = cv.getContext('2d');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- the switch ----------
  var mode = 'on';
  try { mode = localStorage.getItem('eqMode') || 'on'; } catch (e) {}
  var switcher = stage.querySelector('.clip-fx-switch');
  function paintSwitch() {
    stage.classList.toggle('fx-off', mode === 'off');
    if (switcher) switcher.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === mode)); });
  }
  if (switcher) switcher.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]'); if (!b) return;
    mode = b.dataset.mode; paintSwitch();
    try { localStorage.setItem('eqMode', mode); } catch (er) {}
  });
  paintSwitch();

  // ---------- data of the clip (or the colours of its thumbnail) ----------
  var clipId = null, data = null, thumb = null;
  function unb64(s) { var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  function loadClip(id) {
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(id || '') || id === clipId) return;
    clipId = id; data = null; thumb = null;
    fetch('/eq/' + id + '.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || clipId !== id) return;
      d.energy = unb64(d.energy); d.l = unb64(d.l); d.r = unb64(d.r); d.b = unb64(d.b); data = d;
    }).catch(function () {});
    var img = new Image();
    img.onload = function () {
      if (clipId !== id) return;
      var W = 16, c = document.createElement('canvas'); c.width = W; c.height = 64;
      var x = c.getContext('2d'); x.drawImage(img, 0, 0, W, 64);
      var px = x.getImageData(0, 0, W, 64).data;
      var lum = function (y) { var s = 0; for (var i = 0; i < W; i++) { var o = (y * W + i) * 4; s += px[o] + px[o + 1] + px[o + 2]; } return s / W / 3; };
      var top = 0, bot = 63; while (top < 30 && lum(top) < 14) top++; while (bot > 34 && lum(bot) < 14) bot--;   // skip black bars
      x.drawImage(img, 0, img.height * top / 64, img.width, img.height * (bot - top + 1) / 64, 0, 0, W, 12);
      px = x.getImageData(0, 0, W, 12).data;
      var get = function (X, Y, k) { return px[(Y * W + X) * 4 + k]; }, t = { rows: 12, cols: 16, l: [], r: [], b: [] };
      for (var y = 0; y < 12; y++) for (var k = 0; k < 3; k++) { t.l.push((get(0, y, k) + get(1, y, k)) / 2); t.r.push((get(W - 1, y, k) + get(W - 2, y, k)) / 2); }
      for (var X = 0; X < W; X++) for (k = 0; k < 3; k++) t.b.push((get(X, 11, k) + get(X, 10, k)) / 2);
      thumb = t;
    };
    img.src = '/yt-thumb/' + id + '/hqdefault.jpg';
  }
  loadClip(player.getAttribute('data-yt'));

  // ---------- where the player is: it reports its time and state by postMessage ----------
  var playing = false, base = 0, baseAt = 0, frame = null, frameSrc = null, hello = null;
  function listen() {
    var f = player.querySelector('iframe[src]');
    if (f && !f.getAttribute('src')) f = null;
    if (f !== frame || (f && f.src !== frameSrc)) {
      frame = f; frameSrc = f && f.src; playing = false; base = 0; baseAt = performance.now();
      clearInterval(hello);
      if (frame) {
        loadClip(player.getAttribute('data-yt'));
        var say = function () { try { frame.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*'); } catch (e) {} };
        frame.addEventListener('load', say);
        hello = setInterval(say, 1000); say();
      } else {
        loadClip(player.getAttribute('data-yt'));
      }
    }
  }
  new MutationObserver(listen).observe(player, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-yt', 'src'] });
  window.addEventListener('message', function (e) {
    if (!frame || e.source !== frame.contentWindow || !/youtube(-nocookie)?\.com$/.test(e.origin.replace(/^https?:\/\/(www\.)?/, ''))) return;
    var m; try { m = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (er) { return; }
    if (!m) return;
    clearInterval(hello);
    var info = m.info;
    if (m.event === 'onStateChange' && typeof info === 'number') { playing = info === 1; base = clipTime(performance.now()); baseAt = performance.now(); }
    if (info && typeof info === 'object') {
      if (typeof info.playerState === 'number') playing = info.playerState === 1;
      if (typeof info.currentTime === 'number') { base = info.currentTime; baseAt = performance.now(); }
    }
  });
  function clipTime(now) { return base + (playing ? (now - baseAt) / 1000 : 0); }

  // ---------- the liquid (WebGL) ----------
  var fs = [
    'precision highp float;',
    'uniform float uQ; uniform vec2 uRes; uniform vec4 uRect; uniform vec2 uEll; uniform float uTime, uKick, uScale, uLight, uTopFade; uniform sampler2D uTex;',
    'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}',
    'vec4 row(float r,float x){return texture2D(uTex,vec2((clamp(x,0.,1.)*31.+.5)/32.,(r+.5)/4.));}',
    'void main(){',
    '  vec2 P=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);',
    '  vec2 C=(uRect.xy+uRect.zw)*.5, hs=(uRect.zw-uRect.xy)*.5;',
    '  vec2 E=clamp(P,uRect.xy,uRect.zw); vec2 D=P-E; float dist=length(D);',
    '  if(dist<.5*uQ){gl_FragColor=vec4(0.);return;}',
    // 0 at the edge of the video .. 1 at the ellipse, along the line from the centre
    '  vec2 d=P-C; float r=length(d/uEll);',
    '  vec2 dn=normalize(d); float sr=min(hs.x/max(abs(dn.x),1e-4),hs.y/max(abs(dn.y),1e-4)); float rr=length(dn*sr/uEll);',
    '  float u=clamp((r-rr)/max(1.-rr,.05),0.,1.5);',
    '  float side=(P.x-C.x)/uEll.x;',
    '  float e=row(0.,clamp(acos(clamp(dn.y,-1.,1.))/2.6,0.,1.)).r;',          // bass at the bottom, treble up the sides
    '  float t=uTime;',
    '  vec2 p=P/(150.*uQ)-dn*t*.7;',                                             // the liquid flows away from the video
    '  vec2 q=vec2(fbm(p+vec2(0.,t*.15)),fbm(p+vec2(5.2,1.3)-t*.12));',
    '  vec2 q2=vec2(fbm(p+3.5*q+vec2(1.7,9.2)+t*.2),fbm(p+3.5*q+vec2(8.3,2.8)-t*.18));',
    '  float n=fbm(p+3.*q2);',
    '  float ridge=1.-abs(2.*fbm(p*1.8+2.5*q2+t*.1)-1.);',                        // thin bright edges, like flames and splashes
    '  float reach=(.28+.72*e+.25*uKick)*uScale;',
    '  float body=clamp(n*1.9-u/max(reach,.05)*1.05+.25,0.,1.);',
    '  body*=1.-smoothstep(.72,1.,u);',                                            // everything ends at the ellipse
    '  body*=smoothstep(uRect.y+4.*uQ,uRect.y+uTopFade,P.y);',                     // nothing above the video
    '  float hi=pow(ridge,6.)*body;',
    '  float mixF=smoothstep(-.28,.28,side+(n-.5)*.7);',                           // water left, fire right, a wavy border under the video
    '  vec3 water=mix(vec3(.02,.16,.36),vec3(.2,.62,.95),body); water=mix(water,vec3(.85,.97,1.),hi);',
    '  vec3 fire=mix(vec3(.45,.07,0.),vec3(1.,.42,.04),body); fire=mix(fire,vec3(1.,.86,.45),hi);',
    '  vec3 col=mix(water,fire,mixF);',
    // next to the video the liquid takes the picture's own colour, if it has one
    '  float sideW=abs(D.x)/(abs(D.x)+abs(D.y)+.001); float ey=(E.y-uRect.y)/(hs.y*2.), ex=(E.x-uRect.x)/(hs.x*2.);',
    '  vec3 vc=mix(row(3.,ex).rgb,P.x<C.x?row(1.,ey).rgb:row(2.,ey).rgb,sideW);',
    '  float mx=max(max(vc.r,vc.g),vc.b), mn=min(min(vc.r,vc.g),vc.b);',
    '  float vid=smoothstep(.05,.18,mx-mn)*(1.-smoothstep(0.,.45,u));',
    '  col=mix(col,vc/max(mx,.06)*mix(.6,1.,body),vid*.8);',
    '  if(uLight>.5){col=col*.85;}',
    '  float a=clamp(pow(body,.85)*1.05+hi*.4,0.,1.);',
    '  gl_FragColor=vec4(col*a,a);',
    '}'].join('\n');
  function sh(type, src) { var o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; }
  var prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { stage.classList.add('no-fx'); return; }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var aLoc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(aLoc); gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
  var U = {}; ['uQ', 'uRes', 'uRect', 'uEll', 'uTime', 'uKick', 'uScale', 'uLight', 'uTopFade', 'uTex'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
  var tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(function (p) { gl.texParameteri(gl.TEXTURE_2D, p, gl.LINEAR); });
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  var pix = new Uint8Array(32 * 4 * 4);

  // ---------- state ----------
  var energy = new Float32Array(32), cols = { l: new Float32Array(96), r: new Float32Array(96), b: new Float32Array(96) };
  var kick = 0, bassSlow = 0, alive = 0, last = performance.now(), fxTime = 0, speed = .3, carry = 0, bits = [], show = 0;
  var quality = 1, slowFrames = 0, visible = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(stage);
  function resample(src, n, frameNo, out) {        // n colours along an edge -> 32, eased so cuts don't flash
    for (var i = 0; i < 32; i++) { var f = i / 31 * (n - 1), a = Math.floor(f), b = Math.min(n - 1, a + 1), w = f - a;
      for (var k = 0; k < 3; k++) { var v = (src[(frameNo * n + a) * 3 + k] * (1 - w) + src[(frameNo * n + b) * 3 + k] * w) / 255; out[i * 3 + k] += (v - out[i * 3 + k]) * .12; } }
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')'; }

  function draw(now) {
    if (!document.body.contains(stage)) return;            // the page was left (PJAX)
    requestAnimationFrame(draw);
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!visible || document.hidden) return;
    listen();
    // fade the whole effect out while off or while the clip floats as the small player
    var want = mode !== 'off' && !player.classList.contains('is-mini') ? 1 : 0;
    show += (want - show) * Math.min(1, dt * 4);
    stage.style.setProperty('--fx-show', show.toFixed(3));
    if (show < .01) { if (want === 0) { ctx.clearRect(0, 0, cv.width, cv.height); bits.length = 0; } return; }

    if (dt > .026) { if (++slowFrames > 45 && quality > .5) { quality -= .25; slowFrames = 0; } } else slowFrames = Math.max(0, slowFrames - 1);
    var dpr = Math.min(2, devicePixelRatio || 1), w = glCanvas.clientWidth, h = glCanvas.clientHeight, q = Math.max(.75, dpr * quality);
    if (glCanvas.width !== Math.round(w * q) || glCanvas.height !== Math.round(h * q)) { glCanvas.width = Math.round(w * q); glCanvas.height = Math.round(h * q); }
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    ctx.clearRect(0, 0, cv.width, cv.height);
    var light = document.body.classList.contains('light'), soft = mode === 'soft' || reduce;
    var t = clipTime(now);
    alive += ((playing ? 1 : 0) - alive) * Math.min(1, dt * 2.5);
    speed += ((reduce ? .12 : (.25 + .5 * alive + .35 * Math.min(1, kick))) * (soft ? .6 : 1) - speed) * Math.min(1, dt * 2.5);
    fxTime += dt * speed;

    // loudness: the clip's data while it plays, otherwise a calm steady breathing
    var bands = new Float32Array(16), b;
    if (data && playing) {
      var f = Math.min(data.frames - 1, Math.max(0, t * data.fps)), i0 = Math.floor(f), i1 = Math.min(data.frames - 1, i0 + 1), fw = f - i0;
      for (b = 0; b < 16; b++) bands[b] = (data.energy[i0 * 16 + b] * (1 - fw) + data.energy[i1 * 16 + b] * fw) / 255;
    } else {
      var ft = now / 1000;
      for (b = 0; b < 16; b++) bands[b] = .4 + .18 * Math.sin(ft * 1.1 + b * .55) * Math.sin(ft * .43 + b * .21);
      if (playing && Math.sin(ft * Math.PI * 1.5) > .97) bands[0] = bands[1] = bands[2] = 1;
    }
    for (var i = 0; i < 32; i++) {
      var bf = i / 31 * 15, a0 = Math.floor(bf), a1 = Math.min(15, a0 + 1);
      var v = (bands[a0] * (1 - (bf - a0)) + bands[a1] * (bf - a0)) * (.45 + .55 * alive);
      energy[i] += (v - energy[i]) * Math.min(1, dt * (v > energy[i] ? 30 : 9));
    }
    var level = 0; for (i = 0; i < 32; i++) level += energy[i]; level /= 32;
    var bass = (bands[0] + bands[1] + bands[2]) / 3 * alive;
    bassSlow += (bass - bassSlow) * Math.min(1, dt * 1.5);
    kick = Math.max(kick * Math.exp(-dt * 6), Math.max(0, bass - bassSlow) * 3);

    var src = data && playing ? data : (thumb || data);
    if (src) {
      var cf = src === data ? Math.min(data.cframes - 1, Math.max(0, Math.floor(t * data.cfps))) : 0;
      resample(src.l, src.rows, cf, cols.l); resample(src.r, src.rows, cf, cols.r); resample(src.b, src.cols, cf, cols.b);
    }
    for (i = 0; i < 32; i++) {
      var e8 = Math.round(Math.min(1, energy[i]) * 255); pix[i * 4] = pix[i * 4 + 1] = pix[i * 4 + 2] = e8; pix[i * 4 + 3] = 255;
      ['l', 'r', 'b'].forEach(function (k, r) { for (var c = 0; c < 3; c++) pix[((r + 1) * 32 + i) * 4 + c] = Math.round(cols[k][i * 3 + c] * 255); pix[((r + 1) * 32 + i) * 4 + 3] = 255; });
    }

    // the room: an ellipse round the video (through its corners when there is space)
    var sr = glCanvas.getBoundingClientRect(), vr = player.getBoundingClientRect();
    var X0 = vr.left - sr.left, Y0 = vr.top - sr.top, X1 = vr.right - sr.left, Y1 = vr.bottom - sr.top, vw = X1 - X0, vh = Y1 - Y0;
    var ea = Math.min(vw / Math.SQRT2 * 1.12, vw / 2 + X0 * .95), eb = Math.min(vh / Math.SQRT2 * 1.18, vh / 2 + (h - Y1) * .95);
    if (X0 < 60) eb = vh / 2 + (h - Y1) * .92;                 // phone: no room beside the video, so it all flows down under it
    var scale = soft ? .55 : 1;

    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 32, 4, 0, gl.RGBA, gl.UNSIGNED_BYTE, pix);
    gl.uniform1f(U.uQ, q); gl.uniform2f(U.uRes, glCanvas.width, glCanvas.height);
    gl.uniform4f(U.uRect, X0 * q, Y0 * q, X1 * q, Y1 * q); gl.uniform2f(U.uEll, ea * q, eb * q);
    gl.uniform1f(U.uTime, fxTime); gl.uniform1f(U.uKick, Math.min(1, kick)); gl.uniform1f(U.uScale, scale);
    gl.uniform1f(U.uLight, light ? 1 : 0); gl.uniform1f(U.uTopFade, vh * .28 * q); gl.uniform1i(U.uTex, 0);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);

    // embers fly off the fire, bubbles rise from the water; gone at the ellipse
    var cx = (X0 + X1) / 2 * dpr, cy = (Y0 + Y1) / 2 * dpr, EA = ea * dpr, EB = eb * dpr, top = (Y0 + vh * .12) * dpr;
    carry += dt * (14 + 150 * level + 220 * kick) * (soft ? .4 : 1) * (.25 + .75 * alive);
    while (carry >= 1) {
      carry--;
      var L = vh * 2 + vw, d0 = Math.random() * L, px, py, nx, ny;
      if (d0 < vh) { px = X0; py = Y0 + d0; nx = -1; ny = 0; } else if (d0 < vh + vw) { px = X0 + d0 - vh; py = Y1; nx = 0; ny = 1; } else { px = X1; py = Y1 - (d0 - vh - vw); nx = 1; ny = 0; }
      if (py < Y0 + vh * .2) continue;
      var fire = px > (X0 + X1) / 2 ? Math.random() < .85 : Math.random() < .15;
      var sp = (50 + 160 * level + 140 * kick) * dpr * (.5 + Math.random()), ang = Math.atan2(ny, nx) + (Math.random() - .5) * 1.1;
      bits.push({ x: px * dpr, y: py * dpr, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - (fire ? 30 * dpr : 0), fire: fire, age: 0,
        size: (fire ? .8 + Math.random() * 1.6 : 1 + Math.random() * 2.4) * dpr, tw: Math.random() * 6.28 });
    }
    ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';
    ctx.lineCap = 'round';
    for (i = bits.length - 1; i >= 0; i--) {
      var k = bits[i]; k.age += dt;
      k.vx *= Math.exp(-dt * .8); k.vy *= Math.exp(-dt * .8);
      if (k.fire) k.vy -= 40 * dpr * dt;
      var ox = k.x, oy = k.y; k.x += k.vx * dt; k.y += k.vy * dt;
      var er = Math.hypot((k.x - cx) / EA, (k.y - cy) / EB);
      if (er > 1.02 || k.age > 3.5 || k.y < top - 20) { bits[i] = bits[bits.length - 1]; bits.pop(); continue; }
      var fade = Math.min(1, k.age * 5) * (1 - Math.max(0, (er - .78) / .24)) * Math.max(0, Math.min(1, (k.y - top) / (40 * dpr)));
      fade *= .6 + .4 * Math.sin(k.tw + k.age * 9);
      if (fade <= .01) continue;
      if (k.fire) {
        ctx.strokeStyle = rgba(light ? [190, 70, 0] : [255, 170 + Math.round(60 * fade), 60], .9 * fade); ctx.lineWidth = k.size;
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(k.x + .01, k.y); ctx.stroke();
      } else {
        var wc = light ? [10, 90, 160] : [190, 235, 255];
        ctx.strokeStyle = rgba(wc, .7 * fade); ctx.lineWidth = .8 * dpr;
        ctx.beginPath(); ctx.arc(k.x, k.y, k.size, 0, 6.283); ctx.stroke();
        ctx.fillStyle = rgba(wc, .5 * fade); ctx.fillRect(k.x - k.size * .45, k.y - k.size * .45, k.size * .35, k.size * .35);
      }
    }
  }
  requestAnimationFrame(draw);
})();
