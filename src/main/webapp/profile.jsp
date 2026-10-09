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
  <section class="profile-card">
    <%@ include file="/includes/avatar-editor.jspf" %>
  </section>

  <section class="profile-card">
    <h3 class="font-display"><%= t.getProperty("profile.posts") %></h3>
    <div class="profile-posts">
      <table>
        <thead>
          <tr>
            <th><%= t.getProperty("profile.col.date") %></th>
            <th><%= t.getProperty("profile.col.song") %></th>
            <th><%= t.getProperty("profile.col.comment") %></th>
            <th class="act"><%= t.getProperty("profile.col.actions") %></th>
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
            <td class="dim"><%= ts %></td>
            <td><a href="/lyrics/<%= lid %>"><%= com.github.skeliit.WebUtils.escapeHtml(sname) %></a></td>
            <td class="comment-cell">
              <form method="post" action="/comment" class="inline-edit">
                <input type="hidden" name="lyric_id" value="<%= lid %>">
                <input type="hidden" name="comment_id" value="<%= cid %>">
                <input type="hidden" name="action" value="update">
                <input type="hidden" name="csrf" value="${csrf}">
                <textarea name="content" rows="2"><%= com.github.skeliit.WebUtils.escapeHtml(ctext) %></textarea>
                <button type="submit"><%= t.getProperty("common.save") %></button>
              </form>
            </td>
            <td class="act">
              <form method="post" action="/comment" onsubmit="return confirm('<%= com.github.skeliit.WebUtils.escapeJs(t.getProperty("comment.deleteConfirm")) %>');">
                <input type="hidden" name="lyric_id" value="<%= lid %>">
                <input type="hidden" name="comment_id" value="<%= cid %>">
                <input type="hidden" name="action" value="delete">
                <input type="hidden" name="csrf" value="${csrf}">
                <button type="submit" class="btn-delete"><%= t.getProperty("common.delete") %></button>
              </form>
            </td>
          </tr>
        <%
            }
          } else { %>
          <tr><td colspan="4" class="dim"><%= t.getProperty("profile.loginRequired") %></td></tr>
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
