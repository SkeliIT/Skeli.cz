// Ořezávač obrázků v Nastavení: profilová fotka (čtverec 512×512) a záhlaví profilu (pruh 1500×500).
// - obrázek může být jakkoli velký: velký se nejdřív zmenší v prohlížeči (max 2400 px), takže ořezávání
//   jde plynule a na server jde jen malý výřez
// - hlášky se ukazují pod polem pro soubor (žádná okna prohlížeče), texty jsou v data-* na tom poli
// - knihovna Cropper se načte až když je potřeba, takže stránka funguje i po přechodu přes PJAX
(function () {
  const MAX_SIDE = 2400;                   // nejdelší strana, kterou dostane ořezávač
  const MAX_BYTES = 200 * 1024 * 1024;     // nad tím by prohlížeči mohla dojít paměť

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

  // velkou fotku překreslí menší, malá se použije, jak je
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

  // jedna hláška pod polem pro soubor
  function messenger(input, id) {
    let msg = document.getElementById(id);
    if (!msg) {
      msg = document.createElement('p');
      msg.id = id;
      msg.className = 'avatar-msg';
      msg.setAttribute('role', 'status');
      msg.hidden = true;
      input.insertAdjacentElement('afterend', msg);
    }
    return function say(textValue, kind) {
      msg.textContent = textValue || '';
      msg.className = 'avatar-msg' + (kind ? ' ' + kind : '');
      msg.hidden = !textValue;
    };
  }

  // Jeden ořezávač. cfg = id prvků, název pole (field), výsledná velikost (outW, outH),
  // ready = co udělat po načtení obrázku, saved = co udělat po uložení.
  function setup(cfg) {
    const input = document.getElementById(cfg.input);
    if (!input || input.dataset.bound) return null;
    input.dataset.bound = '1';
    const wrap = document.getElementById(cfg.wrap);
    const img = document.getElementById(cfg.img);
    const form = document.getElementById(cfg.form);
    const btnSave = document.getElementById(cfg.save);
    const text = input.dataset;
    const say = messenger(input, cfg.msg);
    let cropper = null, objectUrl = null;

    async function loadFile(f) {
      if (!f) return;
      if (f.size > MAX_BYTES) { say(text.msgHuge, 'warn'); return; }
      say(text.msgPreparing);
      let url;
      try {
        url = await prepare(f);
        await ensureCropper();
      } catch (e) {
        say(text.msgFormat, 'warn');   // třeba HEIC z iPhonu: prohlížeč ho neotevře
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
          aspectRatio: cfg.outW / cfg.outH, viewMode: 1, dragMode: 'move', autoCropArea: 1, movable: true, zoomOnWheel: true,
          ready: function () { if (cfg.ready) cfg.ready(cropper, img); }
        });
      };
      img.src = url;
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
    document.getElementById(cfg.cancel).addEventListener('click', function () { close(); say(''); });
    document.getElementById(cfg.zoomIn).addEventListener('click', function () { if (cropper) cropper.zoom(0.1); });
    document.getElementById(cfg.zoomOut).addEventListener('click', function () { if (cropper) cropper.zoom(-0.1); });

    btnSave.addEventListener('click', function () {
      if (!cropper) return;
      const canvas = cropper.getCroppedCanvas({ width: cfg.outW, height: cfg.outH, imageSmoothingQuality: 'high' });
      if (!canvas) return;
      btnSave.disabled = true;
      canvas.toBlob(async function (blob) {
        const fd = new FormData(form);
        fd.delete(cfg.field);
        fd.append(cfg.field, blob, cfg.field + '.jpg');
        try {
          const res = await fetch(form.action, { method: 'POST', body: fd });
          const data = await res.json().catch(function () { return {}; });
          // mezitím odhlášený (přihlášení vypršelo): řekneme to, ne jen „nepovedlo se“
          if (res.status === 401 || res.status === 403 || data.error === 'unauthorized') { say(text.msgSignedOut, 'warn'); return; }
          if (!res.ok || !data.ok) { say(text.msgFailed, 'warn'); return; }
          document.getElementById(cfg.preview).src = data.url;
          close();
          say(text.msgSaved, 'ok');
          if (cfg.saved) cfg.saved(data.url);
        } catch (e) {
          say(text.msgNetwork, 'warn');
        } finally {
          btnSave.disabled = false;
        }
      }, 'image/jpeg', 0.85);
    });

    return { cropper: function () { return cropper; }, img: img, say: say, text: text };
  }

  // profilová fotka: čtverec, umí najít obličej
  async function autoFace(cropper, img) {
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
    } catch (_) { /* tenhle prohlížeč obličej hledat neumí: dáme doprostřed */ }
    const width = Math.min(natural.w, natural.h) * 0.8;
    cropper.setData({ x: (natural.w - width) / 2, y: (natural.h - width) / 2, width: width, height: width });
  }

  const photo = setup({
    input: 'avatar-input', wrap: 'cropper-wrap', img: 'cropper-img', preview: 'avatar-preview-img', form: 'avatar-form', msg: 'avatar-msg',
    save: 'btn-crop-save', cancel: 'btn-cancel', zoomIn: 'btn-zoom-in', zoomOut: 'btn-zoom-out', field: 'avatar', outW: 512, outH: 512,
    ready: autoFace,
    saved: function (url) {
      document.querySelectorAll('img.user-avatar, img.acct-avatar').forEach(function (i) { i.src = url; }); // i v hlavičce
      window.dispatchEvent(new CustomEvent('kevin', { detail: { avatar: 'saved' } }));
    }
  });
  if (photo) {
    document.getElementById('btn-auto-face').addEventListener('click', function () { autoFace(photo.cropper(), photo.img); });
  }

  // záhlaví profilu: pruh 3:1; dokud žádné není, náhled ukazuje neutrální pozadí a Odebrat je schované
  const coverImg = document.getElementById('cover-preview-img');
  const coverRemove = document.getElementById('cover-remove');
  function showCover(url) {
    if (url) coverImg.src = url; else coverImg.removeAttribute('src');
    coverImg.hidden = !url;
    coverRemove.hidden = !url;
  }
  const cover = setup({
    input: 'cover-input', wrap: 'cover-crop-wrap', img: 'cover-crop-img', preview: 'cover-preview-img', form: 'cover-form', msg: 'cover-msg',
    save: 'cover-save', cancel: 'cover-cancel', zoomIn: 'cover-zoom-in', zoomOut: 'cover-zoom-out', field: 'cover', outW: 1500, outH: 500,
    saved: showCover
  });
  if (cover) {
    coverRemove.addEventListener('click', async function () {
      const fd = new FormData(document.getElementById('cover-form'));
      fd.delete('cover');
      fd.append('action', 'remove');
      coverRemove.disabled = true;
      try {
        const res = await fetch('/profile/cover', { method: 'POST', body: fd });
        const out = await res.json().catch(function () { return {}; });
        if (res.status === 401 || res.status === 403) { cover.say(cover.text.msgSignedOut, 'warn'); return; }
        if (!res.ok || !out.ok) { cover.say(cover.text.msgFailed, 'warn'); return; }
        showCover(null);
        cover.say(cover.text.msgRemoved, 'ok');
      } catch (e) {
        cover.say(cover.text.msgNetwork, 'warn');
      } finally {
        coverRemove.disabled = false;
      }
    });
  }
})();
