<%@ page import="com.github.skeliit.dao.UserDao, com.github.skeliit.model.UserComment" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<main>
  <h2><%= t.getProperty("menu.profile") %></h2>
  <% if (session.getAttribute("userId") == null) { %>
  <%-- signed out (e.g. the sign-in expired): nothing to edit, just a way back in --%>
  <section class="card prose-card">
    <p><%= t.getProperty("profile.loginRequired") %></p>
    <a class="btn btn-primary" href="/login.jsp?next=%2Fprofile.jsp"><i class="fa-solid fa-right-to-bracket"></i> <%= t.getProperty("auth.submit.login") %></a>
  </section>
  <% } else { %>
  <section style="background: var(--panel); border: 1px solid var(--panel-border); border-radius: 12px; padding: 16px; box-shadow: 0 6px 18px rgba(0,0,0,0.20);">
    <h3><%= t.getProperty("avatar.title") %></h3>
    <div style="display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap;">
      <div>
        <div id="avatar-preview" style="width:120px; height:120px; border-radius:50%; overflow:hidden; border:1px solid var(--panel-border); background:rgba(0,0,0,0.2);">
          <img id="avatar-preview-img" src="<%= (request.getSession().getAttribute("avatar_url")!=null)?request.getSession().getAttribute("avatar_url").toString():"/img/avatar-default.svg" %>" alt="preview" style="width:100%;height:100%;object-fit:cover;object-position:center center;display:block;">
        </div>
      </div>
      <div style="flex:1; min-width:280px;">
        <input id="avatar-input" type="file" accept="image/*" data-msg-huge="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("avatar.tooLarge")) %>" data-msg-format="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("avatar.badFormat")) %>" data-msg-preparing="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("avatar.preparing")) %>" data-msg-saved="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("avatar.saved")) %>" data-msg-failed="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("avatar.saveFailed")) %>" data-msg-signed-out="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("avatar.signedOut")) %>" data-msg-network="<%= com.github.skeliit.WebUtils.escapeHtml(t.getProperty("common.networkError")) %>">
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
            java.util.List<UserComment> myComments = java.util.List.of();
            try {
              myComments = new UserDao().recentComments((Integer) __uidObj);   // dao/UserDao
            } catch (Exception ignore) {}
            for (UserComment uc : myComments) {
              int cid = uc.id, lid = uc.lyricId;
              String ctext = uc.content, sname = uc.songName;
              java.sql.Timestamp ts = uc.createdAt;
        %>
          <tr>
            <td style="padding:6px; opacity:.8;"><%= ts %></td>
            <td style="padding:6px;"><a href="/lyrics/<%= lid %>"><%= com.github.skeliit.WebUtils.escapeHtml(sname) %></a></td>
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
          } else { %>
          <tr><td colspan="4" style="padding:6px; opacity:.8;"><%= t.getProperty("profile.loginRequired") %></td></tr>
        <% } %>
        </tbody>
      </table>
    </div>
  </section>

  <% } %>
  <%-- the photo cropper (inside <main>, so it also runs after PJAX navigation) --%>
  <link href="/vendor/cropper/cropper.min.css" rel="stylesheet">
  <script src="/js/avatar-editor.js?v=<%= assetVersion %>"></script>
</main>
<%@ include file="includes/footer.jsp" %>
