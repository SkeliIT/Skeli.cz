// Profile photo: choose any picture, crop a square, save 512×512 JPG (uzivatel.jsp, profile.jsp).
// - any size works: a big photo is first scaled down in the browser (max 2400 px), so the
//   cropper stays smooth and only a small square goes to the server
// - messages appear under the file field (no browser alert boxes); texts come from data-* on #avatar-input
// - the cropper library is loaded only when needed, so the page also works after PJAX navigation
(function () {
  const input = document.getElementById('avatar-input');
  if (!input || input.dataset.bound) return;
  input.dataset.bound = '1';
  const wrap = document.getElementById('cropper-wrap');
  const img = document.getElementById('cropper-img');
  const preview = document.getElementById('avatar-preview-img');
  const form = document.getElementById('avatar-form');
  const btnSave = document.getElementById('btn-crop-save');
  const btnCancel = document.getElementById('btn-cancel');
  const btnFace = document.getElementById('btn-auto-face');
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const text = input.dataset;
  const MAX_SIDE = 2400;                   // longest side handed to the cropper
  const MAX_BYTES = 200 * 1024 * 1024;     // beyond this a browser tab could run out of memory
  let cropper = null, objectUrl = null;

  // the message line under the file field
  let msg = document.getElementById('avatar-msg');
  if (!msg) {
    msg = document.createElement('p');
    msg.id = 'avatar-msg';
    msg.className = 'avatar-msg';
    msg.setAttribute('role', 'status');
    msg.hidden = true;
    input.insertAdjacentElement('afterend', msg);
  }
  function say(textValue, kind) {
    msg.textContent = textValue || '';
    msg.className = 'avatar-msg' + (kind ? ' ' + kind : '');
    msg.hidden = !textValue;
  }

  function ensureCropper() {
    if (window.Cropper) return Promise.resolve();
    return new Promise(function (ok, fail) {
      const s = document.createElement('script');
      s.src = '/vendor/cropper/cropper.min.js';
      s.onload = ok;
      s.onerror = fail;
      document.head.appendChild(s);
    });
  }

  function loadImage(url) {
    return new Promise(function (ok, fail) {
      const i = new Image();
      i.onload = function () { ok(i); };
      i.onerror = fail;
      i.src = url;
    });
  }

  // a big photo is redrawn smaller; a small one is used as it is
  async function prepare(file) {
    const url = URL.createObjectURL(file);
    const pic = await loadImage(url);
    const w = pic.naturalWidth, h = pic.naturalHeight;
    if (Math.max(w, h) <= MAX_SIDE) return url;
    const k = MAX_SIDE / Math.max(w, h);
    const c = document.createElement('canvas');
    c.width = Math.round(w * k);
    c.height = Math.round(h * k);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(pic, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    const blob = await new Promise(function (ok) { c.toBlob(ok, 'image/jpeg', 0.92); });
    return URL.createObjectURL(blob);
  }

  async function loadFile(f) {
    if (!f) return;
    if (f.size > MAX_BYTES) { say(text.msgHuge, 'warn'); return; }
    say(text.msgPreparing);
    let url;
    try {
      url = await prepare(f);
      await ensureCropper();
    } catch (e) {
      say(text.msgFormat, 'warn');   // e.g. HEIC from an iPhone: the browser can't open it
      input.value = '';
      return;
    }
    say('');
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = url;
    if (cropper) { cropper.destroy(); cropper = null; }
    wrap.style.display = 'block';
    img.onload = function () {
      cropper = new Cropper(img, {
        aspectRatio: 1, viewMode: 1, dragMode: 'move', autoCropArea: 1, movable: true, zoomOnWheel: true,
        ready: function () { autoFace(); }
      });
    };
    img.src = url;
  }

  async function autoFace() {
    if (!cropper) return;
    const natural = { w: img.naturalWidth, h: img.naturalHeight };
    try {
      if (window.FaceDetector) {
        const faces = await new FaceDetector({ fastMode: true, maxDetectedFaces: 1 }).detect(img);
        if (faces && faces[0]) {
          const f = faces[0].boundingBox;
          const display = img.getBoundingClientRect();
          const cx = (f.x + f.width / 2) * natural.w / display.width;
          const cy = (f.y + f.height / 2) * natural.h / display.height;
          const width = Math.min(natural.w, natural.h) * 0.7;
          cropper.setData({ x: Math.max(0, cx - width / 2), y: Math.max(0, cy - width / 2), width: width, height: width });
          return;
        }
      }
    } catch (_) { /* no face detection in this browser: centre it */ }
    const width = Math.min(natural.w, natural.h) * 0.8;
    cropper.setData({ x: (natural.w - width) / 2, y: (natural.h - width) / 2, width: width, height: width });
  }

  function close() {
    if (cropper) { cropper.destroy(); cropper = null; }
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
    wrap.style.display = 'none';
    input.value = '';
  }

  input.addEventListener('change', function () { loadFile(this.files && this.files[0]); });
  ['dragenter', 'dragover'].forEach(function (ev) {
    wrap.addEventListener(ev, function (e) { e.preventDefault(); wrap.classList.add('drag'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    wrap.addEventListener(ev, function (e) {
      e.preventDefault();
      wrap.classList.remove('drag');
      if (ev === 'drop') loadFile(e.dataTransfer.files && e.dataTransfer.files[0]);
    });
  });
  btnCancel.addEventListener('click', function () { close(); say(''); });
  btnZoomIn.addEventListener('click', function () { if (cropper) cropper.zoom(0.1); });
  btnZoomOut.addEventListener('click', function () { if (cropper) cropper.zoom(-0.1); });
  btnFace.addEventListener('click', autoFace);

  btnSave.addEventListener('click', function () {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({ width: 512, height: 512, imageSmoothingQuality: 'high' });
    if (!canvas) return;
    btnSave.disabled = true;
    canvas.toBlob(async function (blob) {
      const fd = new FormData(form);
      fd.delete('avatar');
      fd.append('avatar', blob, 'avatar.jpg');
      try {
        const res = await fetch(form.action, { method: 'POST', body: fd });
        const data = await res.json().catch(function () { return {}; });
        if (!res.ok || !data.ok) { say(text.msgFailed, 'warn'); return; }
        preview.src = data.url;
        document.querySelectorAll('img.user-avatar').forEach(function (i) { i.src = data.url; }); // the header too
        close();
        say(text.msgSaved, 'ok');
        window.dispatchEvent(new CustomEvent('kevin', { detail: { avatar: 'saved' } }));
      } catch (e) {
        say(text.msgNetwork, 'warn');
      } finally {
        btnSave.disabled = false;
      }
    }, 'image/jpeg', 0.85);
  });
})();
