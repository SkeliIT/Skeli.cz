/* Kouř na předělu mezi částmi stránky (vzhled „Ulice“): pomalu se valící kouř v barvě fotky v pozadí
   (--accent), dole splyne s barvou stránky (--bg). Pod myší nebo prstem jemně prosvítí („svítilna“).
   Vkládá se přes includes/smoke.jspf: <div class="smoke-edge b|t"><canvas></canvas></div>
   (b = pod obsahem, kouř nahoru do fotky; t = převrácený, nad obsahem).
   Kreslí se jen tehdy, když je předěl vidět. Na slabém telefonu (html.low-fx), při omezení pohybu
   a bez WebGL se nespustí – zůstane klidný přechod z CSS (css/effects.css, .smoke-edge). */
(function () {
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function low() { return document.documentElement.classList.contains('low-fx'); }

  var VS = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }';
  var FS = [
    'precision highp float;',
    'uniform vec2 res, mp; uniform float t, seed, base, ms; uniform vec3 acc, bg;',
    'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + seed) * 43758.5453); }',
    'float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);',
    '  return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }',
    'float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++) { v += a * n(p); p = p * 2.03 + 7.1; a *= .5; } return v; }',
    'void main(){',
    '  vec2 fc = gl_FragCoord.xy; vec2 uv = vec2(fc.x / res.x, fc.y / base); float x = fc.x / base;',
    '  float body = 0., wisp = 0., rim = 0.;',
    '  if (uv.y < 1.15) {',                                    // nad pásem kouře se nic nepočítá
    '    vec2 q = vec2(fbm(vec2(x * .9 + t * .02, uv.y * 1.6 - t * .05)), fbm(vec2(x * .9 - t * .015 + 3.1, uv.y * 1.6)));',
    '    float sm = fbm(vec2(x * 1.4, uv.y * 2.4 - t * .09) + q * 1.8);',                   // valící se kouř
    '    float edge = .42 + (fbm(vec2(x * .7 + t * .01, t * .03)) - .5) * .35;',             // hranice tmy
    '    float y = uv.y + (sm - .5) * .32;',
    '    body = smoothstep(edge + .06, edge - .14, y);',                                     // tmavá stránka dole
    '    wisp = smoothstep(.42, .85, sm) * smoothstep(edge + .55, edge - .02, y) * (1. - body);',
    '    rim = exp(-abs(y - edge) * 26.) * (1. - body * .6);',                               // žhavý lem
    '  }',
    '  vec2 md = (fc - mp) / base; float L = exp(-dot(md, md) * 5.) * ms;',                 // svítilna pod kurzorem
    '  wisp *= 1. + L * 1.3; rim *= 1. + L * 1.2;',
    '  vec3 col = mix(acc * (wisp * .9 + rim * 1.3), bg, body) + vec3(1.) * pow(rim, 3.) * .25 + acc * L * .2 * wisp;',
    '  float A = clamp(max(body, wisp * .75 + rim * .8), 0., 1.);',
    '  float top = smoothstep(res.y * .98, res.y * .45, fc.y); A *= top * top;',            // horní část se ztrácí
    '  gl_FragColor = vec4(col, A);',
    '}'].join('\n');
  var TALL = 1.6;   // plátno je o 60 % vyšší než pás kouře, aby se kouř neusekl

  function rgb(v) {
    v = (v || '').trim();
    if (v.charAt(0) === '#') { var x = v.length === 4 ? v.replace(/#(.)(.)(.)/, '#$1$1$2$2$3$3') : v; return [1, 3, 5].map(function (i) { return parseInt(x.substr(i, 2), 16) / 255; }); }
    var m = v.match(/[0-9.]+/g) || [230, 183, 48];
    return m.slice(0, 3).map(function (n) { return n / 255; });
  }

  // myš nebo prst (jedna poloha pro všechny předěly)
  var px = -1e5, py = -1e5, pAt = 0;
  addEventListener('pointermove', function (e) { px = e.clientX; py = e.clientY; pAt = performance.now(); }, { passive: true });
  addEventListener('touchmove', function (e) { var t = e.touches[0]; if (t) { px = t.clientX; py = t.clientY; pAt = performance.now(); } }, { passive: true });

  function start(cv, seed) {
    var gl = cv.getContext('webgl', { premultipliedAlpha: false, alpha: true, antialias: false });
    if (!gl) return false;
    function sh(type, src) { var o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; }
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return false;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['res', 'mp', 't', 'seed', 'base', 'ms', 'acc', 'bg'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
    var flip = cv.parentNode.classList.contains('t'), t0 = performance.now(), seen = false, raf = 0, ms = 0;
    new IntersectionObserver(function (en) {
      seen = en[0].isIntersecting;
      if (seen && !raf) raf = requestAnimationFrame(loop);
    }).observe(cv);
    function loop(now) {
      raf = 0;
      if (!cv.isConnected || low()) return;                 // stránka se změnila (PJAX) nebo se zapnul lehký režim
      if (!seen || document.hidden) return;                 // mimo obrazovku se nekreslí; IntersectionObserver ho znovu spustí
      var dpr = Math.min(1.5, devicePixelRatio || 1), W = Math.round(cv.clientWidth * dpr), H = Math.round(cv.clientHeight * dpr);
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; gl.viewport(0, 0, W, H); }
      var r = cv.getBoundingClientRect(), k = W / (r.width || 1);
      ms = now - pAt < 120 ? 1 : ms * .95;
      var cs = getComputedStyle(document.body);
      gl.uniform2f(U.res, W, H); gl.uniform1f(U.base, H / TALL); gl.uniform1f(U.t, (now - t0) / 1000); gl.uniform1f(U.seed, seed);
      gl.uniform2f(U.mp, (px - r.left) * k, (flip ? py - r.top : r.bottom - py) * k); gl.uniform1f(U.ms, ms);
      gl.uniform3fv(U.acc, rgb(cs.getPropertyValue('--accent'))); gl.uniform3fv(U.bg, rgb(cs.getPropertyValue('--bg')));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(loop);
    }
    return true;
  }

  var n = 0;
  function init() {
    if (reduced || low()) return;
    document.querySelectorAll('.smoke-edge canvas:not([data-on])').forEach(function (cv) {
      cv.setAttribute('data-on', '');
      if (start(cv, ++n * 3.7)) cv.parentNode.classList.add('live');
    });
  }
  init();
  document.addEventListener('pjax:done', init);
})();
