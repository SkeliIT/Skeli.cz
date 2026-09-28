<%@ tag pageEncoding="UTF-8" body-content="empty" %>
<%@ attribute name="cmt" required="true" type="com.github.skeliit.model.CommentView" %>
<%@ attribute name="lyricId" required="true" type="java.lang.Integer" %>
<%@ attribute name="t" required="true" type="java.util.Properties" %>
<%@ attribute name="lang" required="true" type="java.lang.String" %>
<%@ attribute name="canPost" required="true" type="java.lang.Boolean" %>
<%@ attribute name="isReply" required="false" type="java.lang.Boolean" %>
<%--
  One comment on a lyric page, used for top-level comments and their replies.
  The author and admins get edit/delete, other logged-in users can reply and report.
--%>
<%
  Integer me = (Integer) session.getAttribute("userId");
  boolean mine = me != null && me == cmt.userId;
  boolean admin = "ADMIN".equals(session.getAttribute("role"));
  boolean canEdit = mine || admin;
  boolean canReport = me != null && !mine;
  String csrf = com.github.skeliit.CsrfFilter.token(session);
  String max = String.valueOf(com.github.skeliit.WebUtils.COMMENT_MAX_LENGTH);
%>
<div class="comment-item<%= Boolean.TRUE.equals(isReply) ? " comment-reply" : "" %>" id="comment-<%= cmt.id %>">
  <% if (cmt.avatarUrl != null && !cmt.avatarUrl.isBlank()) { %>
    <img src="<%= com.github.skeliit.WebUtils.escapeHtml(com.github.skeliit.WebUtils.safeUrl(cmt.avatarUrl, "/img/avatar-default.svg")) %>" alt="" class="comment-avatar"/>
  <% } else { %>
    <span class="comment-avatar comment-avatar-empty"><i class="fa-solid fa-user"></i></span>
  <% } %>
  <div class="comment-content">
    <div class="comment-meta">
      <div>
        <strong class="comment-username"><%= com.github.skeliit.WebUtils.escapeHtml(cmt.username) %></strong>
        <span class="comment-date"><%= com.github.skeliit.WebUtils.formatDateTime(cmt.createdAt, lang) %></span>
        <% if (cmt.updatedAt != null) { %><span class="comment-edited" title="<%= com.github.skeliit.WebUtils.formatDateTime(cmt.updatedAt, lang) %>">· <%= t.getProperty("comment.edited") %></span><% } %>
      </div>
      <% if (canEdit || canReport) { %>
      <div class="comment-actions">
        <% if (canEdit) { %>
          <button type="button" class="comment-action comment-edit-toggle"
                  title="<%= t.getProperty("common.edit") %>" aria-label="<%= t.getProperty("common.edit") %>"><i class="fa-solid fa-pen"></i></button>
          <form method="post" action="/comment" class="vote-form">
            <input type="hidden" name="comment_id" value="<%= cmt.id %>">
            <input type="hidden" name="action" value="delete">
            <input type="hidden" name="lyric_id" value="<%= lyricId %>">
            <input type="hidden" name="csrf" value="<%= csrf %>">
            <button type="submit" class="comment-action comment-delete"
                    onclick="return confirm('<%= com.github.skeliit.WebUtils.escapeJs(t.getProperty("comment.deleteConfirm")) %>')"
                    title="<%= t.getProperty("common.delete") %>" aria-label="<%= t.getProperty("common.delete") %>"><i class="fa-solid fa-trash-can"></i></button>
          </form>
        <% } %>
        <% if (canReport) { %>
          <form method="post" action="/comment/report" class="vote-form">
            <input type="hidden" name="kind" value="lyric">
            <input type="hidden" name="comment_id" value="<%= cmt.id %>">
            <input type="hidden" name="csrf" value="<%= csrf %>">
            <button type="submit" class="comment-action comment-report"
                    onclick="return confirm('<%= com.github.skeliit.WebUtils.escapeJs(t.getProperty("comment.reportConfirm")) %>')"
                    title="<%= t.getProperty("comment.report") %>" aria-label="<%= t.getProperty("comment.report") %>"><i class="fa-solid fa-flag"></i></button>
          </form>
        <% } %>
      </div>
      <% } %>
    </div>
    <div class="comment-text"><%= com.github.skeliit.WebUtils.escapeHtml(cmt.content) %></div>
    <% if (canEdit) { %>
      <form method="post" action="/comment" class="comment-edit-form" hidden>
        <input type="hidden" name="comment_id" value="<%= cmt.id %>">
        <input type="hidden" name="action" value="update">
        <input type="hidden" name="lyric_id" value="<%= lyricId %>">
        <input type="hidden" name="csrf" value="<%= csrf %>">
        <textarea name="content" maxlength="<%= max %>" required><%= com.github.skeliit.WebUtils.escapeHtml(cmt.content) %></textarea>
        <div class="comment-edit-actions">
          <button type="button" class="comment-edit-cancel"><%= t.getProperty("common.cancel") %></button>
          <button type="submit"><%= t.getProperty("common.save") %></button>
        </div>
      </form>
    <% } %>
    <% if (me != null && canPost) { %>
      <button type="button" class="comment-reply-toggle"><i class="fa-solid fa-reply"></i> <%= t.getProperty("comment.reply") %></button>
      <form method="post" action="/comment" class="comment-reply-form" hidden>
        <input type="hidden" name="lyric_id" value="<%= lyricId %>">
        <input type="hidden" name="parent_id" value="<%= cmt.parentId != null ? cmt.parentId : cmt.id %>">
        <input type="hidden" name="csrf" value="<%= csrf %>">
        <div class="hp-field" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
        <textarea name="content" maxlength="<%= max %>" required placeholder="<%= t.getProperty("comment.replyPlaceholder") %>"></textarea>
        <div class="comment-edit-actions">
          <button type="button" class="comment-reply-cancel"><%= t.getProperty("common.cancel") %></button>
          <button type="submit"><%= t.getProperty("comment.reply") %></button>
        </div>
      </form>
    <% } %>
  </div>
</div>
