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
    <h3>Všechny komentáře (nejnovější první, nejvýš ${limit})</h3>
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
    <% for (AdminComment c : comments) { %>
      <div class="report-row" data-kind="<%= c.kind %>">
        <div class="report-main">
          <div class="report-meta">
            <strong><%= c.author == null ? "Smazaný účet" : WebUtils.escapeHtml(c.author) %></strong>
            · <%= c.createdAt == null ? "" : fmt.format(c.createdAt) %>
            · <a href="<%= WebUtils.escapeHtml(c.link()) %>" target="_blank" rel="noopener"><%= c.isLyric() ? "text" : "klip" %>: <%= WebUtils.escapeHtml(c.where()) %></a>
            <% if (c.reply) { %> · odpověď<% } %><% if (c.edited) { %> · upraveno<% } %>
            <% if (c.reports > 0) { %> · <span class="report-count"><i class="fa-solid fa-flag"></i> <%= c.reports %>×</span><% } %>
          </div>
          <div class="report-text"><%= WebUtils.escapeHtml(c.content) %></div>
        </div>
        <div class="report-actions">
          <form method="post" action="/admin/comment">
            <input type="hidden" name="csrf" value="${csrf}"><input type="hidden" name="kind" value="<%= c.kind %>"><input type="hidden" name="comment_id" value="<%= c.id %>">
            <button type="submit" class="btn-delete" onclick="return confirm('Smazat tento komentář?')">Smazat</button>
          </form>
        </div>
      </div>
    <% } %>
    </div>
    <script>
    (function () {
      var input = document.getElementById('commentFilter'), kind = document.getElementById('commentKind');
      var rows = [].slice.call(document.querySelectorAll('#commentList .report-row')), count = document.getElementById('commentCount');
      function render() {
        var q = input.value.trim().toLowerCase(), k = kind.value, shown = 0;
        rows.forEach(function (r) {
          var ok = (!k || r.dataset.kind === k) && (!q || r.textContent.toLowerCase().indexOf(q) >= 0);
          r.hidden = !ok;
          if (ok) shown++;
        });
        count.textContent = shown + ' z ' + rows.length;
      }
      input.addEventListener('input', render);
      kind.addEventListener('change', render);
      render();
    })();
    </script>
  </section>
</main>
<%@ include file="/includes/footer.jsp" %>
