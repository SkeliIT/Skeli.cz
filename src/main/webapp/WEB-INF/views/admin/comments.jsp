<%@ include file="/includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="com.github.skeliit.model.AdminComment, com.github.skeliit.model.CommentReport, com.github.skeliit.WebUtils" %>
<%
  @SuppressWarnings("unchecked") java.util.List<CommentReport> reports = (java.util.List<CommentReport>) request.getAttribute("reports");
  @SuppressWarnings("unchecked") java.util.List<AdminComment> comments = (java.util.List<AdminComment>) request.getAttribute("comments");
  java.text.SimpleDateFormat fmt = new java.text.SimpleDateFormat("d. M. yyyy HH:mm");
%>
<main class="admin-page">
  <%@ include file="/includes/admin-nav.jspf" %>
  <h2 class="admin-page-title">Komentáře</h2>

  <section class="admin-card admin-card-wide" id="reports">
    <h3>Nahlášené</h3>
    <% if (reports.isEmpty()) { %><p class="text-dim">Žádné nahlášené komentáře.</p><% } %>
    <% for (CommentReport rep : reports) { %>
      <div class="report-row">
        <div class="report-main">
          <div class="report-meta"><strong><%= WebUtils.escapeHtml(rep.author) %></strong> · ID <%= rep.commentId %>
            · <span class="report-count"><i class="fa-solid fa-flag"></i> <%= rep.reports %>×</span></div>
          <div class="report-text"><%= WebUtils.escapeHtml(rep.content) %></div>
        </div>
        <div class="report-actions">
          <form method="post" action="/admin/comment">
            <input type="hidden" name="csrf" value="${csrf}"><input type="hidden" name="kind" value="<%= rep.kind %>"><input type="hidden" name="comment_id" value="<%= rep.commentId %>">
            <button type="submit" class="btn-delete" onclick="return confirm('Smazat tento komentář?')">Smazat</button>
          </form>
          <form method="post" action="/admin/comment">
            <input type="hidden" name="csrf" value="${csrf}"><input type="hidden" name="kind" value="<%= rep.kind %>"><input type="hidden" name="comment_id" value="<%= rep.commentId %>"><input type="hidden" name="action" value="dismiss">
            <button type="submit" class="btn-dismiss">Zamítnout</button>
          </form>
        </div>
      </div>
    <% } %>
  </section>

  <section class="admin-card admin-card-wide">
    <h3>Všechny komentáře (vlákna s nejnovější aktivitou první, nejvýš ${limit})</h3>
    <%-- search by author, song or text; show only lyrics or only clips --%>
    <div class="admin-toolbar">
      <label class="admin-search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <input type="search" id="commentFilter" placeholder="Hledat autora, píseň nebo text…" aria-label="Hledat komentáře"></label>
      <select id="commentKind" aria-label="Kde">
        <option value="">Vše</option><option value="lyric">U textů</option><option value="video">U klipů</option>
      </select>
      <span class="text-dim" id="commentCount"></span>
    </div>
    <% if (comments.isEmpty()) { %><p class="text-dim">Zatím žádné komentáře.</p><% } %>
    <div id="commentList">
    <%-- one thread = the comment and the replies under it, so it is clear who answered whom --%>
    <% for (AdminComment th : comments) { %>
      <div class="admin-thread" data-kind="<%= th.kind %>">
      <% java.util.List<AdminComment> rows = new java.util.ArrayList<>(); rows.add(th); rows.addAll(th.replies);
         for (AdminComment c : rows) { boolean isReply = c != th || c.parentId != null; %>
        <div class="report-row<%= isReply ? " is-reply" : "" %>" data-kind="<%= c.kind %>" id="admin-comment-<%= c.kind %>-<%= c.id %>">
          <div class="report-main">
            <div class="report-meta">
              <% if (isReply) { %><span class="reply-mark" title="Odpověď"><i class="fa-solid fa-reply fa-rotate-180" aria-hidden="true"></i> odpověď<%= c != th && th.author != null ? " pro " + WebUtils.escapeHtml(th.author) : "" %> · </span><% } %>
              <strong><%= c.author == null ? "Smazaný účet" : WebUtils.escapeHtml(c.author) %></strong>
              · <%= c.createdAt == null ? "" : fmt.format(c.createdAt) %>
              <% if (c == th) { %>· <a href="<%= WebUtils.escapeHtml(c.link()) %>" target="_blank" rel="noopener"><%= c.isLyric() ? "text" : "klip" %>: <%= WebUtils.escapeHtml(c.where()) %></a><% } %>
              <% if (c.edited) { %> · upraveno<% } %>
              <% if (c.pinned) { %> · <i class="fa-solid fa-thumbtack" title="Připnuto"></i><% } %>
              <% if (c.hearted) { %> · <i class="fa-solid fa-heart text-heart" title="Srdíčko od Skeliho"></i><% } %>
              <% if (c.reports > 0) { %> · <span class="report-count"><i class="fa-solid fa-flag"></i> <%= c.reports %>×</span><% } %>
            </div>
            <div class="report-text"><%= WebUtils.escapeHtml(c.content) %></div>
          </div>
          <div class="report-actions">
            <form method="post" action="/admin/comment">
              <input type="hidden" name="csrf" value="${csrf}"><input type="hidden" name="kind" value="<%= c.kind %>"><input type="hidden" name="comment_id" value="<%= c.id %>">
              <button type="submit" class="btn-delete" onclick="return confirm('<%= c == th && !th.replies.isEmpty() ? "Smazat tento komentář i s odpověďmi?" : "Smazat tento komentář?" %>')">Smazat</button>
            </form>
          </div>
        </div>
      <% } %>
      </div>
    <% } %>
    </div>
    <script>
    (function () {
      var input = document.getElementById('commentFilter'), kind = document.getElementById('commentKind');
      var threads = [].slice.call(document.querySelectorAll('#commentList .admin-thread')), count = document.getElementById('commentCount');
      var total = document.querySelectorAll('#commentList .report-row').length;
      // a thread stays whole: shown when any of its comments matches
      function render() {
        var q = input.value.trim().toLowerCase(), k = kind.value, shown = 0;
        threads.forEach(function (th) {
          var ok = (!k || th.dataset.kind === k) && (!q || th.textContent.toLowerCase().indexOf(q) >= 0);
          th.hidden = !ok;
          if (ok) shown += th.querySelectorAll('.report-row').length;
        });
        count.textContent = shown + ' z ' + total;
      }
      input.addEventListener('input', render);
      kind.addEventListener('change', render);
      render();
    })();
    </script>
  </section>
</main>
<%@ include file="/includes/footer.jsp" %>
