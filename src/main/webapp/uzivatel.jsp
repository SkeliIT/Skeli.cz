<%@ page import="com.github.skeliit.Db" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<main>
  <div class="settings-wrap">
    <div class="settings-shell">
      <h2 class="font-display text-center" style="margin-top:0;"><%= t.getProperty("settings.heading") %></h2>

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
        <div class="form-success text-center"><%= t.getProperty("settings.saved") %></div>
      <% } %>
      <% if ("true".equals(request.getParameter("password_changed"))) { %>
        <div class="form-success text-center"><%= t.getProperty("settings.passwordChanged") %></div>
      <% } %>
      <% if (request.getParameter("signedOut") != null) { %>
        <div class="form-success text-center"><%= t.getProperty("settings.signedOutOthers") %></div>
      <% } %>
      <%
        // Error codes sent by ChangePasswordServlet (?error=...) and ProfileDeleteServlet (?confirm=required)
        String settingsError = request.getParameter("error");
        String settingsErrorKey = null;
        if ("empty".equals(settingsError)) settingsErrorKey = "settings.error.empty";
        else if ("mismatch".equals(settingsError)) settingsErrorKey = "settings.error.mismatch";
        else if ("short".equals(settingsError)) settingsErrorKey = "auth.error.passwordStrength";
        else if ("invalid_chars".equals(settingsError)) settingsErrorKey = "auth.error.passwordInvalidChars";
        else if ("too_long".equals(settingsError)) settingsErrorKey = "auth.error.passwordTooLong";
        else if ("pwned".equals(settingsError)) settingsErrorKey = "auth.error.passwordPwned";
        else if ("wrong_old".equals(settingsError)) settingsErrorKey = "settings.error.wrongOld";
        else if (settingsError != null) settingsErrorKey = "settings.error.generic";
        if ("required".equals(request.getParameter("confirm"))) settingsErrorKey = "settings.deleteRequired";
        if (settingsErrorKey != null) {
      %>
        <div class="form-alert text-center"><%= t.getProperty(settingsErrorKey) %></div>
      <% } %>

      <section class="settings-section">
        <h3><%= t.getProperty("avatar.title") %></h3>
        <div class="avatar-edit-wrap">
          <div>
            <div id="avatar-preview" class="avatar-preview-box">
              <img id="avatar-preview-img" src="<%= (session.getAttribute("avatar_url")!=null)?session.getAttribute("avatar_url").toString():"/img/avatar-default.svg" %>" alt="preview">
            </div>
          </div>
          <div class="avatar-controls">
            <input id="avatar-input" type="file" accept="image/*">
            <div id="cropper-wrap" class="cropper-container">
              <img id="cropper-img" alt="crop image">
              <div id="cropper-overlay" style="position:absolute; inset:0; pointer-events:none; background:radial-gradient(circle at center, rgba(0,0,0,0) 46%, rgba(0,0,0,0.45) 48%, rgba(0,0,0,0.55) 100%);"></div>
            </div>
            <div class="avatar-btns">
              <button id="btn-auto-face" type="button" class="control-btn"><i class="fa-solid fa-user"></i> <%= t.getProperty("avatar.autoCenter") %></button>
              <button id="btn-zoom-in" type="button" class="control-btn">+</button>
              <button id="btn-zoom-out" type="button" class="control-btn">−</button>
              <span style="flex:1"></span>
              <button id="btn-crop-save" type="button" class="control-btn" style="background:transparent;color:var(--text);"><i class="fa-solid fa-floppy-disk"></i> <%= t.getProperty("common.save") %></button>
              <button id="btn-cancel" type="button" class="control-btn" style="background:transparent;color:var(--text);"><%= t.getProperty("common.cancel") %></button>
            </div>
            <p class="form-note" style="margin-top:6px;"><%= t.getProperty("avatar.tip") %></p>
          </div>
        </div>
        <form id="avatar-form" method="post" action="/profile/avatar" enctype="multipart/form-data" style="display:none;">
          <input type="hidden" name="csrf" value="${csrf}">
          <input id="avatar-file-hidden" type="file" name="avatar" accept="image/*">
        </form>
      </section>

      <section class="settings-section">
        <h3><%= t.getProperty("menu.profile") %></h3>
        <div class="settings-form">
          <form method="post" action="/profile/update" enctype="application/x-www-form-urlencoded">
            <input type="hidden" name="csrf" value="${csrf}">
            <label><%= t.getProperty("settings.displayName") %><br><input name="display_name" maxlength="60" value="<%= com.github.skeliit.WebUtils.escapeHtml(displayName) %>"></label>
            <label><%= t.getProperty("settings.age") %><br><input type="number" name="age" min="1" max="120" value="<%= (age!=null?age:"") %>"></label>
            <label><%= t.getProperty("settings.city") %><br><input name="city" maxlength="80" value="<%= com.github.skeliit.WebUtils.escapeHtml(city) %>"></label>
            <label><%= t.getProperty("settings.bio") %><br><textarea name="bio" rows="3"><%= com.github.skeliit.WebUtils.escapeHtml(bio) %></textarea></label>
            <label><%= t.getProperty("settings.theme") %><br>
              <select name="theme">
                <option value="dark" <%= "dark".equals(theme)?"selected":"" %>><%= t.getProperty("settings.theme.dark") %></option>
                <option value="light" <%= "light".equals(theme)?"selected":"" %>><%= t.getProperty("settings.theme.light") %></option>
              </select>
            </label>
            <label><%= t.getProperty("header.language") %><br>
              <select name="lang">
                <option value="cs" <%= "cs".equals(prefLang)?"selected":"" %>>Čeština</option>
                <option value="en" <%= "en".equals(prefLang)?"selected":"" %>>English</option>
                <option value="de" <%= "de".equals(prefLang)?"selected":"" %>>Deutsch</option>
                <option value="uk" <%= "uk".equals(prefLang)?"selected":"" %>>Українська</option>
                <option value="vi" <%= "vi".equals(prefLang)?"selected":"" %>>Tiếng Việt</option>
              </select>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" name="public_profile" value="1"> <%= t.getProperty("settings.public") %>
            </label>
            <div class="text-center" style="margin-top:8px;"><button type="submit"><%= t.getProperty("common.save") %></button></div>
          </form>
        </div>
      </section>

      <section class="settings-section">
        <h3><%= t.getProperty("settings.password") %></h3>
        <div class="settings-form">
          <form method="post" action="/profile/change-password">
            <input type="hidden" name="csrf" value="${csrf}">
            <label><%= t.getProperty("settings.oldPassword") %> <input type="password" name="old_password" required autocomplete="current-password"></label>
            <label><%= t.getProperty("settings.newPassword") %> <input type="password" name="new_password" minlength="8" required autocomplete="new-password" data-pw="new"></label>
            <label><%= t.getProperty("settings.confirmPassword") %> <input type="password" name="confirm_password" minlength="8" required autocomplete="new-password" data-pw="confirm"></label>
            <%@ include file="includes/password-rules.jspf" %>
            <div class="text-center" style="margin-top:8px;"><button type="submit"><%= t.getProperty("settings.changePassword") %></button></div>
          </form>
        </div>
      </section>

      <%-- signed in on a phone, a friend's computer…? end all the other sessions at once --%>
      <section class="settings-section">
        <h3><%= t.getProperty("settings.devices") %></h3>
        <div class="settings-form">
          <p class="text-dim"><%= t.getProperty("settings.devicesText") %></p>
          <form method="post" action="/profile/signout-others" class="text-center">
            <input type="hidden" name="csrf" value="${csrf}">
            <button type="submit"><i class="fa-solid fa-right-from-bracket"></i> <%= t.getProperty("settings.signOutOthers") %></button>
          </form>
        </div>
      </section>

      <section class="settings-section">
        <h3><%= t.getProperty("settings.privacy") %></h3>
        <div class="settings-form">
          <form method="get" action="/profile/export" class="text-center" style="margin:8px 0;">
            <button type="submit"  style="background:transparent; border:1px solid var(--panel-border);"><%= t.getProperty("settings.export") %></button>
          </form>
          <form method="post" action="/profile/delete" onsubmit="return confirm('<%= com.github.skeliit.WebUtils.escapeJs(t.getProperty("settings.deleteConfirm")) %>');">
            <input type="hidden" name="csrf" value="${csrf}">
            <label><%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("settings.deleteLabel")) %><br><input type="text" name="confirm" required></label>
            <div class="text-center" style="margin-top:8px;">
              <button type="submit" class="btn-delete" style="width:100%;"><%= t.getProperty("settings.deleteAccount") %></button>
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
      if (f.size > 15*1024*1024) { alert('<%= com.github.skeliit.WebUtils.escapeJs(t.getProperty("avatar.tooLarge")) %>'); return; }
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
          if (!res.ok || !data.ok){ alert('<%= com.github.skeliit.WebUtils.escapeJs(t.getProperty("avatar.saveFailed")) %>'); return; }
          preview.src = data.url;
          btnCancel.click();
        } catch(e){ alert('<%= com.github.skeliit.WebUtils.escapeJs(t.getProperty("common.networkError")) %>'); }
      }, 'image/jpeg', 0.85);
    });
  })();
</script>
<%@ include file="includes/footer.jsp" %>
