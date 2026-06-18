<%@ page import="com.github.skeliit.Db" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<main>
  <div class="settings-wrap">
    <div class="settings-shell">
      <h2 class="bruno-ace-sc-regular text-center" style="margin-top:0;">Nastavení účtu</h2>

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
        <div class="form-success text-center">Profil uložen.</div>
      <% } %>
      <% if ("true".equals(request.getParameter("password_changed"))) { %>
        <div class="form-success text-center">Heslo změněno.</div>
      <% } %>

      <section class="settings-section">
        <h3>Avatar</h3>
        <div class="avatar-edit-wrap">
          <div>
            <div id="avatar-preview" class="avatar-preview-box">
              <img id="avatar-preview-img" src="<%= (session.getAttribute("avatar_url")!=null)?session.getAttribute("avatar_url").toString():"/img/avatar-default.png" %>" alt="preview">
            </div>
          </div>
          <div class="avatar-controls">
            <input id="avatar-input" type="file" accept="image/*">
            <div id="cropper-wrap" class="cropper-container">
              <img id="cropper-img" alt="crop image">
              <div id="cropper-overlay" style="position:absolute; inset:0; pointer-events:none; background:radial-gradient(circle at center, rgba(0,0,0,0) 46%, rgba(0,0,0,0.45) 48%, rgba(0,0,0,0.55) 100%);"></div>
            </div>
            <div class="avatar-btns">
              <button id="btn-auto-face" type="button" class="bruno-ace-sc-regular control-btn"><i class="fa-solid fa-user"></i> Auto center</button>
              <button id="btn-zoom-in" type="button" class="bruno-ace-sc-regular control-btn">+</button>
              <button id="btn-zoom-out" type="button" class="bruno-ace-sc-regular control-btn">−</button>
              <span style="flex:1"></span>
              <button id="btn-crop-save" type="button" class="bruno-ace-sc-regular control-btn" style="background:transparent;color:#fff;"><i class="fa-solid fa-floppy-disk"></i> Uložit</button>
              <button id="btn-cancel" type="button" class="bruno-ace-sc-regular control-btn" style="background:transparent;color:#fff;">Zrušit</button>
            </div>
            <p class="form-note" style="margin-top:6px;">Tip: Zoom kolečkem myši, tažení myší pro posun. Výstup 512×512 JPG.</p>
          </div>
        </div>
        <form id="avatar-form" method="post" action="/profile/avatar" enctype="multipart/form-data" style="display:none;">
          <input type="hidden" name="csrf" value="${csrf}">
          <input id="avatar-file-hidden" type="file" name="avatar" accept="image/*">
        </form>
      </section>

      <section class="settings-section">
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
            <label class="checkbox-label">
              <input type="checkbox" name="public_profile" value="1"> Veřejný profil
            </label>
            <div class="text-center" style="margin-top:8px;"><button type="submit">Uložit</button></div>
          </form>
        </div>
      </section>

      <section class="settings-section">
        <h3>Změna hesla</h3>
        <div class="settings-form">
          <form method="post" action="/profile/change-password">
            <label>Staré heslo: <input type="password" name="old_password" required></label>
            <label>Nové heslo: <input type="password" name="new_password" minlength="6" required></label>
            <label>Potvrzení: <input type="password" name="confirm_password" minlength="6" required></label>
            <div class="text-center" style="margin-top:8px;"><button type="submit">Změnit heslo</button></div>
          </form>
        </div>
      </section>

      <section class="settings-section">
        <h3>Soukromí</h3>
        <div class="settings-form">
          <form method="get" action="/profile/export" class="text-center" style="margin:8px 0;">
            <button type="submit" class="bruno-ace-sc-regular" style="background:transparent; border:1px solid var(--panel-border);">Export dat (JSON)</button>
          </form>
          <form method="post" action="/profile/delete" onsubmit="return confirm('Opravdu smazat účet? Zadej DELETE a potvrď.');">
            <input type="hidden" name="csrf" value="${csrf}">
            <label>Potvrzení (napiš "DELETE")<br><input type="text" name="confirm" required></label>
            <div class="text-center" style="margin-top:8px;">
              <button type="submit" class="btn-delete" style="width:100%;">Smazat účet</button>
            </div>
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

    input.addEventListener('change', function(){ loadFile(this.files && this.files[0]); });

    ['dragenter','dragover'].forEach(ev=>wrap.addEventListener(ev, e=>{ e.preventDefault(); e.stopPropagation(); wrap.style.borderColor='var(--accent)'; }));
    ['dragleave','drop'].forEach(ev=>wrap.addEventListener(ev, e=>{ e.preventDefault(); e.stopPropagation(); wrap.style.borderColor='var(--panel-border)'; if(ev==='drop'){ const f=e.dataTransfer.files&&e.dataTransfer.files[0]; loadFile(f);} }));

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
            const f = faces[0].boundingBox;
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
