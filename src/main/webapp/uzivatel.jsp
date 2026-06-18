<%@ page import="com.github.skeliit.Db" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<main>
  <div class="settings-wrap">
  <div class="settings-shell">
  <h2 class="bruno-ace-sc-regular" style="text-align:center;margin-top:0;">Nastavení účtu</h2>
  <%-- Načti profil z DB --%>
  <%
    Integer uid = (Integer) session.getAttribute("user_id");
    String displayName = null, city = null, bio = null, theme = "dark", prefLang = (String) session.getAttribute("lang");
    Integer age = null;
    if (uid != null) {
      try (java.sql.Connection c = Db.get();
           java.sql.PreparedStatement ps = c.prepareStatement("SELECT display_name, age, city, bio, theme, lang FROM user_profiles WHERE user_id=?")) {
        ps.setInt(1, uid);
        try (java.sql.ResultSet r = ps.executeQuery()) {
          if (r.next()) {
            displayName = r.getString(1);
            age = (Integer) r.getObject(2);
            city = r.getString(3);
            bio = r.getString(4);
            theme = r.getString(5);
            String l = r.getString(6); if (l != null) prefLang = l;
          }
        }
      } catch (Exception ignore) {}
    }
  %>

  <% if ("true".equals(request.getParameter("saved"))) { %>
    <div style="background: rgba(0,128,0,0.25); border:1px solid rgba(0,128,0,0.4); border-radius:8px; padding:10px; margin-bottom:10px; text-align:center;">Profil uložen.</div>
  <% } %>
  <% if ("true".equals(request.getParameter("password_changed"))) { %>
    <div style="background: rgba(0,128,0,0.25); border:1px solid rgba(0,128,0,0.4); border-radius:8px; padding:10px; margin-bottom:10px; text-align:center;">Heslo změněno.</div>
  <% } %>

  <section style="background: var(--panel); border: 1px solid var(--panel-border); border-radius: 12px; padding: 16px; box-shadow: 0 6px 18px rgba(0,0,0,0.20);">
    <h3>Avatar</h3>
    <div style="display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap;">
      <div>
        <div id="avatar-preview" style="width:120px; height:120px; border-radius:50%; overflow:hidden; border:1px solid var(--panel-border); background:rgba(0,0,0,0.2);">
          <img id="avatar-preview-img" src="<%= (session.getAttribute("avatar_url")!=null)?session.getAttribute("avatar_url").toString():"/img/avatar-default.png" %>" alt="preview" style="width:100%;height:100%;object-fit:cover;object-position:center center;display:block;">
        </div>
      </div>
      <div style="flex:1; min-width:280px;">
        <input id="avatar-input" type="file" accept="image/*">
        <div id="cropper-wrap" style="position:relative; margin-top:8px; max-width:420px; border:1px dashed var(--panel-border); border-radius:8px; overflow:hidden; display:none;">
          <img id="cropper-img" style="max-width:100%; display:block;">
          <div id="cropper-overlay" style="position:absolute; inset:0; pointer-events:none; background:radial-gradient(circle at center, rgba(0,0,0,0) 46%, rgba(0,0,0,0.45) 48%, rgba(0,0,0,0.55) 100%);"></div>
        </div>
        <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
          <button id="btn-auto-face" type="button" class="bruno-ace-sc-regular" style="border:1px solid var(--panel-border);border-radius:8px;padding:6px 10px;display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-user"></i> Auto center</button>
          <button id="btn-zoom-in" type="button" class="bruno-ace-sc-regular" style="border:1px solid var(--panel-border);border-radius:8px;padding:6px 10px;">+</button>
          <button id="btn-zoom-out" type="button" class="bruno-ace-sc-regular" style="border:1px solid var(--panel-border);border-radius:8px;padding:6px 10px;">−</button>
          <span style="flex:1"></span>
          <button id="btn-crop-save" type="button" class="bruno-ace-sc-regular" style="border:1px solid var(--panel-border);border-radius:8px;padding:6px 10px;display:inline-flex;align-items:center;gap:6px;background:transparent;color:#fff;"><i class="fa-solid fa-floppy-disk"></i> Uložit</button>
          <button id="btn-cancel" type="button" class="bruno-ace-sc-regular" style="border:1px solid var(--panel-border);border-radius:8px;padding:6px 10px;background:transparent;color:#fff;">Zrušit</button>
        </div>
        <small style="opacity:.8; display:block; margin-top:6px;">Tip: Zoom kolečkem myši, tažení myší pro posun. Výstup 512×512 JPG.</small>
      </div>
    </div>
    <form id="avatar-form" method="post" action="/profile/avatar" enctype="multipart/form-data" style="display:none;">
      <input type="hidden" name="csrf" value="${csrf}">
      <input id="avatar-file-hidden" type="file" name="avatar" accept="image/*">
    </form>
  </section>

  <section style="background: var(--panel); border: 1px solid var(--panel-border); border-radius: 12px; padding: 16px; margin-top: 14px; box-shadow: 0 6px 18px rgba(0,0,0,0.20);">
    <h3>Profil</h3>
    <div class="settings-form">
    <form method="post" action="/profile/update" enctype="application/x-www-form-urlencoded">
      <input type="hidden" name="csrf" value="${csrf}">
      <label>Zobrazované jméno<br><input name="display_name" maxlength="60" value="<%= (displayName!=null?displayName:"") %>"></label>
      <label>Věk<br><input type="number" name="age" min="1" max="120" value="<%= (age!=null?age:"") %>"></label>
      <label>Město<br><input name="city" maxlength="80" value="<%= (city!=null?city:"") %>"></label>
      <label>Bio<br><textarea name="bio" rows="3"><%= (bio!=null?bio:"") %></textarea></label>
      <label>Téma<br>
        <select name="theme">
          <option value="dark" <%= "dark".equals(theme)?"selected":"" %>>Dark</option>
          <option value="light" <%= "light".equals(theme)?"selected":"" %>>Light</option>
        </select>
      </label>
      <label>Jazyk<br>
        <select name="lang">
          <option value="cs" <%= "cs".equals(prefLang)?"selected":"" %>>Čeština</option>
          <option value="en" <%= "en".equals(prefLang)?"selected":"" %>>English</option>
          <option value="de" <%= "de".equals(prefLang)?"selected":"" %>>Deutsch</option>
          <option value="uk" <%= "uk".equals(prefLang)?"selected":"" %>>Українська</option>
        </select>
      </label>
      <label style="display:flex;align-items:center;gap:8px;">
        <input type="checkbox" name="public_profile" value="1" <%= "cs".equals(prefLang)?"":"" %>> Veřejný profil
      </label>
      <div style="margin-top:8px; text-align:center;"><button type="submit">Uložit</button></div>
    </form>
    </div>
  </section>

  <section style="background: var(--panel); border: 1px solid var(--panel-border); border-radius: 12px; padding: 16px; margin-top: 14px; box-shadow: 0 6px 18px rgba(0,0,0,0.20);">
    <h3>Změna hesla</h3>
    <form method="post" action="/profile/change-password">
      <label>Staré heslo: <input type="password" name="old_password" required></label><br>
      <label>Nové heslo: <input type="password" name="new_password" minlength="6" required></label><br>
      <label>Potvrzení: <input type="password" name="confirm_password" minlength="6" required></label><br>
      <div style="margin-top:8px"><button type="submit">Změnit heslo</button></div>
    </form>
  </section>
  <section style="background: var(--panel); border: 1px solid var(--panel-border); border-radius: 12px; padding: 16px; margin-top: 14px; box-shadow: 0 6px 18px rgba(0,0,0,0.20);">
    <h3>Soukromí</h3>
    <div class="settings-form">
      <form method="get" action="/profile/export" style="text-align:center; margin:8px 0;">
        <button type="submit" class="bruno-ace-sc-regular" style="border:1px solid var(--panel-border);border-radius:8px;background:transparent;padding:6px 10px;">Export dat (JSON)</button>
      </form>
      <form method="post" action="/profile/delete" onsubmit="return confirm('Opravdu smazat účet? Zadej DELETE a potvrď.');" style="display:grid; gap:8px;">
        <input type="hidden" name="csrf" value="${csrf}">
        <label>Potvrzení (napiš "DELETE")<br><input type="text" name="confirm" required></label>
        <button type="submit" style="background:#7b1e1e;color:#fff;border:none;padding:8px 12px;border-radius:8px;">Smazat účet</button>
      </form>
    </div>
  </section>
  </div>
  </div>
</main>
<link href="https://unpkg.com/cropperjs@1.6.2/dist/cropper.min.css" rel="stylesheet">
<script src="https://unpkg.com/cropperjs@1.6.2/dist/cropper.min.js"></script>
<script>
  (function(){
    const input = document.getElementById('avatar-input');
    const wrap = document.getElementById('cropper-wrap');
    const img = document.getElementById('cropper-img');
    const btnSave = document.getElementById('btn-crop-save');
    const btnCancel = document.getElementById('btn-cancel');
    const btnFace = document.getElementById('btn-auto-face');
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const preview = document.getElementById('avatar-preview-img');
    const form = document.getElementById('avatar-form');
    const hidden = document.getElementById('avatar-file-hidden');
    let cropper = null;

    function loadFile(f){
      if(!f) return;
      if (f.size > 15*1024*1024) { alert('Soubor je příliš velký. Zvol menší (<= 15 MB)'); return; }
      const url = URL.createObjectURL(f);
      img.src = url; wrap.style.display='block';
      if (cropper) { cropper.destroy(); }
      cropper = new Cropper(img, { aspectRatio: 1, viewMode: 1, dragMode: 'move', autoCropArea: 1, movable: true, zoomOnWheel: true, ready(){ autoFace(); } });
    }

    // File select
    input.addEventListener('change', function(){ loadFile(this.files && this.files[0]); });

    // Drag & Drop
    ['dragenter','dragover'].forEach(ev=>wrap.addEventListener(ev, e=>{ e.preventDefault(); e.stopPropagation(); wrap.style.borderColor='var(--accent)'; }));
    ;['dragleave','drop'].forEach(ev=>wrap.addEventListener(ev, e=>{ e.preventDefault(); e.stopPropagation(); wrap.style.borderColor='var(--panel-border)'; if(ev==='drop'){ const f=e.dataTransfer.files&&e.dataTransfer.files[0]; loadFile(f);} }));

    btnCancel.addEventListener('click', ()=>{ if(cropper){ cropper.destroy(); cropper=null; } wrap.style.display='none'; input.value=''; });
    btnZoomIn.addEventListener('click', ()=>{ if(cropper) cropper.zoom(0.1); });
    btnZoomOut.addEventListener('click', ()=>{ if(cropper) cropper.zoom(-0.1); });
    btnFace.addEventListener('click', ()=>autoFace());

    async function autoFace(){
      if(!cropper) return;
      try{
        if (window.FaceDetector){
          const det = new FaceDetector({ fastMode:true, maxDetectedFaces:1 });
          const faces = await det.detect(img);
          if (faces && faces[0]){
            const f = faces[0].boundingBox; // in CSS pixels of the image element
            const natural = { w: img.naturalWidth, h: img.naturalHeight };
            const display = img.getBoundingClientRect();
            const scaleX = natural.w / display.width;
            const scaleY = natural.h / display.height;
            const cx = (f.x + f.width/2) * scaleX;
            const cy = (f.y + f.height/2) * scaleY;
            const width = Math.min(natural.w, natural.h) * 0.7;
            cropper.setData({ x: Math.max(0, cx - width/2), y: Math.max(0, cy - width/2), width: width, height: width });
            return;
          }
        }
      }catch(_){}
      // fallback: center
      const natural = { w: img.naturalWidth, h: img.naturalHeight };
      const width = Math.min(natural.w, natural.h) * 0.8;
      cropper.setData({ x: (natural.w-width)/2, y: (natural.h-width)/2, width: width, height: width });
    }

    btnSave.addEventListener('click', async ()=>{
      if(!cropper) return;
      const canvas = cropper.getCroppedCanvas({ width: 512, height: 512, imageSmoothingQuality: 'high' });
      if(!canvas) return;
      canvas.toBlob(async (blob)=>{
        const fd = new FormData(form);
        fd.delete('avatar');
        fd.append('avatar', blob, 'avatar.jpg');
        try {
          const res = await fetch(form.action, { method:'POST', body: fd });
          const data = await res.json();
          if (!res.ok || !data.ok){ alert('Uložení selhalo'); return; }
          preview.src = data.url;
          btnCancel.click();
        } catch(e){ alert('Chyba sítě'); }
      }, 'image/jpeg', 0.85);
    });
  })();
</script>
<%@ include file="includes/footer.jsp" %>
