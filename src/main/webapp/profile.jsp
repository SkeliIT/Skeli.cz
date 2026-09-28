<%@ page import="com.github.skeliit.Db" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<main>
  <h2><%= t.getProperty("menu.profile") %></h2>
  <section style="background: var(--panel); border: 1px solid var(--panel-border); border-radius: 12px; padding: 16px; box-shadow: 0 6px 18px rgba(0,0,0,0.20);">
    <h3><%= t.getProperty("avatar.title") %></h3>
    <div style="display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap;">
      <div>
        <div id="avatar-preview" style="width:120px; height:120px; border-radius:50%; overflow:hidden; border:1px solid var(--panel-border); background:rgba(0,0,0,0.2);">
          <img id="avatar-preview-img" src="<%= (request.getSession().getAttribute("avatar_url")!=null)?request.getSession().getAttribute("avatar_url").toString():"/img/avatar-default.svg" %>" alt="preview" style="width:100%;height:100%;object-fit:cover;object-position:center center;display:block;">
        </div>
      </div>
      <div style="flex:1; min-width:280px;">
        <input id="avatar-input" type="file" accept="image/*">
        <div id="cropper-wrap" style="position:relative; margin-top:8px; max-width:420px; border:1px dashed var(--panel-border); border-radius:8px; overflow:hidden; display:none;">
          <img id="cropper-img" style="max-width:100%; display:block;">
          <div id="cropper-overlay" style="position:absolute; inset:0; pointer-events:none; background:radial-gradient(circle at center, rgba(0,0,0,0) 46%, rgba(0,0,0,0.45) 48%, rgba(0,0,0,0.55) 100%);"></div>
        </div>
        <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
          <button id="btn-auto-face" type="button"  style="border:1px solid var(--panel-border);border-radius:8px;padding:6px 10px;display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-user"></i> <%= t.getProperty("avatar.autoCenter") %></button>
          <button id="btn-zoom-in" type="button"  style="border:1px solid var(--panel-border);border-radius:8px;padding:6px 10px;">+</button>
          <button id="btn-zoom-out" type="button"  style="border:1px solid var(--panel-border);border-radius:8px;padding:6px 10px;">−</button>
          <span style="flex:1"></span>
          <button id="btn-crop-save" type="button"  style="border:1px solid var(--panel-border);border-radius:8px;padding:6px 10px;display:inline-flex;align-items:center;gap:6px;background:transparent;color:var(--text);"><i class="fa-solid fa-floppy-disk"></i> <%= t.getProperty("common.save") %></button>
          <button id="btn-cancel" type="button"  style="border:1px solid var(--panel-border);border-radius:8px;padding:6px 10px;background:transparent;color:var(--text);"><%= t.getProperty("common.cancel") %></button>
        </div>
        <small style="opacity:.8; display:block; margin-top:6px;"><%= t.getProperty("avatar.tip") %></small>
      </div>
    </div>
    <form id="avatar-form" method="post" action="/profile/avatar" enctype="multipart/form-data" style="display:none;">
      <input type="hidden" name="csrf" value="${csrf}">
      <input id="avatar-file-hidden" type="file" name="avatar" accept="image/*">
    </form>
  </section>

  <section style="background: var(--panel); border: 1px solid var(--panel-border); border-radius: 12px; padding: 16px; box-shadow: 0 6px 18px rgba(0,0,0,0.20); margin-top:14px;">
    <h3 class="font-display"><%= t.getProperty("profile.posts") %></h3>
    <div style="overflow:auto;" class="profile-posts">
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th style="border-bottom:1px solid var(--panel-border); text-align:left; padding:6px;"><%= t.getProperty("profile.col.date") %></th>
            <th style="border-bottom:1px solid var(--panel-border); text-align:left; padding:6px;"><%= t.getProperty("profile.col.song") %></th>
            <th style="border-bottom:1px solid var(--panel-border); text-align:left; padding:6px;"><%= t.getProperty("profile.col.comment") %></th>
            <th style="border-bottom:1px solid var(--panel-border); padding:6px;"><%= t.getProperty("profile.col.actions") %></th>
          </tr>
        </thead>
        <tbody>
        <%
          Object __uidObj = session.getAttribute("userId");
          if (__uidObj == null) __uidObj = session.getAttribute("user_id");
          if (__uidObj != null) {
            int __uid2 = (Integer) __uidObj;
            try (java.sql.Connection c = Db.get();
                 java.sql.PreparedStatement ps = c.prepareStatement(
                   "SELECT c.id, c.content, c.created_at, c.lyric_id, s.name " +
                   "FROM comments c JOIN lyrics l ON l.id=c.lyric_id JOIN songs s ON s.id=l.song_id " +
                   "WHERE c.user_id=? ORDER BY c.created_at DESC LIMIT 50")
            ) {
              ps.setInt(1, __uid2);
              try (java.sql.ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                  int cid = rs.getInt(1);
                  String ctext = rs.getString(2);
                  java.sql.Timestamp ts = rs.getTimestamp(3);
                  int lid = rs.getInt(4);
                  String sname = rs.getString(5);
        %>
          <tr>
            <td style="padding:6px; opacity:.8;"><%= ts %></td>
            <td style="padding:6px;"><a href="/lyric.jsp?id=<%= lid %>"><%= com.github.skeliit.WebUtils.escapeHtml(sname) %></a></td>
            <td style="padding:6px; max-width:420px;">
              <form method="post" action="/comment" style="display:flex; gap:6px; align-items:flex-start;">
                <input type="hidden" name="lyric_id" value="<%= lid %>">
                <input type="hidden" name="comment_id" value="<%= cid %>">
                <input type="hidden" name="action" value="update">
                <input type="hidden" name="csrf" value="${csrf}">
                <textarea name="content" rows="2" style="flex:1; width:100%; border:1px solid var(--panel-border); border-radius:6px; background:rgba(0,0,0,0.12); color:inherit;"><%= com.github.skeliit.WebUtils.escapeHtml(ctext) %></textarea>
                <button type="submit"  style="border:1px solid var(--panel-border); border-radius:6px; background:transparent; padding:6px 10px; color:var(--text);"><%= t.getProperty("common.save") %></button>
              </form>
            </td>
            <td style="padding:6px; text-align:center;">
              <form method="post" action="/comment" onsubmit="return confirm('<%= com.github.skeliit.WebUtils.escapeJs(t.getProperty("comment.deleteConfirm")) %>');">
                <input type="hidden" name="lyric_id" value="<%= lid %>">
                <input type="hidden" name="comment_id" value="<%= cid %>">
                <input type="hidden" name="action" value="delete">
                <input type="hidden" name="csrf" value="${csrf}">
                <button type="submit" style="background:#7b1e1e;color:var(--text);border:none;padding:6px 10px;border-radius:8px;"><%= t.getProperty("common.delete") %></button>
              </form>
            </td>
          </tr>
        <%
                }
              }
            } catch (Exception ignore) {}
          } else { %>
          <tr><td colspan="4" style="padding:6px; opacity:.8;"><%= t.getProperty("profile.loginRequired") %></td></tr>
        <% } %>
        </tbody>
      </table>
    </div>
  </section>

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
            if (!res.ok || !data.ok){ alert('<%= com.github.skeliit.WebUtils.escapeJs(t.getProperty("avatar.saveFailed")) %>'); return; }
            preview.src = data.url;
            btnCancel.click();
          } catch(e){ alert('<%= com.github.skeliit.WebUtils.escapeJs(t.getProperty("common.networkError")) %>'); }
        }, 'image/jpeg', 0.85);
      });
    })();
  </script>
</main>
<%@ include file="includes/footer.jsp" %>
