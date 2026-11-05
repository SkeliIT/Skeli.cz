<%@ page import="com.github.skeliit.dao.AdminDao, com.github.skeliit.dao.ModerationDao, com.github.skeliit.model.AdminUser, com.github.skeliit.model.UserReport, com.github.skeliit.WebUtils" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<main class="admin-page">
  <%@ include file="/includes/admin-nav.jspf" %>
  <h2 class="admin-page-title">Uživatelé</h2>
  <%
    String role = (String) session.getAttribute("role");
    if (!"ADMIN".equals(role)) { out.println("<p>Pouze pro ADMIN.</p>"); } else {
      java.util.List<AdminUser> users = new AdminDao().users();
      String adminMsg = request.getParameter("msg");
      java.util.List<UserReport> reports = new ModerationDao().openReports();
  %>
    <% if ("image_removed".equals(adminMsg)) { %><p class="admin-flash">Obrázek je odebraný a smazaný z disku. Kdo měl nevhodnou fotku, je odhlášený.</p><% } %>
    <% if ("blocked".equals(adminMsg)) { %><p class="admin-flash">Účet je zablokovaný a odhlášený. Nepřihlásí se a profil není vidět, data zůstávají.</p><% } %>
    <% if ("unblocked".equals(adminMsg)) { %><p class="admin-flash">Účet je zase odblokovaný.</p><% } %>
    <% if ("report_done".equals(adminMsg)) { %><p class="admin-flash">Nahlášení je vyřízené.</p><% } %>
    <% if ("self_block".equals(adminMsg)) { %><p class="admin-flash error">Sám sebe zablokovat nemůžeš.</p><% } %>
    <% if ("self".equals(adminMsg)) { %><p class="admin-flash error">Sám sebe smazat nemůžeš. Svůj účet smažeš v Nastavení.</p><% } %>
    <% if ("last_admin".equals(adminMsg)) { %><p class="admin-flash error">Tohle je poslední admin. Web musí mít aspoň jednoho.</p><% } %>
    <%-- nahlášené profily: co se děje, náhled obrázků je v řádku uživatele níž --%>
    <% if (!reports.isEmpty()) { %>
    <section class="admin-card" id="reports">
      <h3><i class="fa-solid fa-flag" aria-hidden="true"></i> Nahlášené profily (<%= reports.size() %>)</h3>
      <div class="note-list">
      <% for (UserReport r : reports) { %>
        <article class="note-item">
          <div class="note-item-text">
            <strong><%= WebUtils.escapeHtml(r.username) %><% if (r.blocked) { %> · <span class="user-blocked">zablokovaný</span><% } %></strong>
            <span class="note-item-say"><%= WebUtils.escapeHtml(r.getReasonText()) %><% if (r.note != null) { %>: „<%= WebUtils.escapeHtml(r.note) %>“<% } %></span>
            <small class="text-dim"><%= r.createdAt == null ? "" : new java.text.SimpleDateFormat("d. M. yyyy HH:mm").format(r.createdAt) %></small>
          </div>
          <form method="post" action="/admin/users">
            <input type="hidden" name="csrf" value="${csrf}">
            <input type="hidden" name="action" value="resolve_report">
            <input type="hidden" name="report_id" value="<%= r.id %>">
            <button type="submit">Vyřízeno</button>
          </form>
        </article>
      <% } %>
      </div>
    </section>
    <% } %>
    <%-- find someone by name or e-mail; deleted (anonymised) accounts are hidden unless asked for --%>
    <div class="admin-toolbar">
      <label class="admin-search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <input type="search" id="userFilter" placeholder="Hledat jméno nebo e-mail…" aria-label="Hledat uživatele"></label>
      <label class="admin-check"><input type="checkbox" id="showDeleted"> Ukázat smazané účty</label>
      <span class="text-dim" id="userCount"></span>
    </div>
    <div class="admin-card admin-table-card">
      <table class="admin-table" id="userTable">
        <thead>
          <tr><th>Jméno</th><th>E-mail</th><th>Registrace</th><th>Obrázky</th><th>Role</th><th></th></tr>
        </thead>
        <tbody>
          <%
            for (AdminUser u : users) {
          %>
          <tr class="role-<%= WebUtils.escapeHtml(u.role).toLowerCase() %>">
            <td><%= WebUtils.escapeHtml(u.username) %><% if (u.blocked) { %><br><span class="user-blocked" title="<%= WebUtils.escapeHtml(u.blockedReason) %>"><i class="fa-solid fa-ban" aria-hidden="true"></i> zablokovaný</span><% } %></td>
            <td><%= WebUtils.escapeHtml(WebUtils.maskEmail(u.email)) %></td>
            <td><%= u.createdAt == null ? "" : new java.text.SimpleDateFormat("d. M. yyyy HH:mm").format(u.createdAt) %></td>
            <%-- nevhodná fotka nebo záhlaví: náhled a odebrání (smaže soubor, zápis je v Záznamu změn) --%>
            <td class="admin-images">
              <% if (u.avatarUrl != null) { %>
              <form method="post" action="/admin/users" onsubmit="return confirm('Odebrat fotku tohoto uživatele? Soubor se smaže a uživatel se odhlásí.');">
                <input type="hidden" name="csrf" value="${csrf}">
                <input type="hidden" name="user_id" value="<%= u.id %>">
                <input type="hidden" name="action" value="remove_avatar">
                <a href="<%= WebUtils.escapeHtml(WebUtils.safeUrl(u.avatarUrl, "")) %>" target="_blank" rel="noopener noreferrer"><img class="admin-thumb round" src="<%= WebUtils.escapeHtml(WebUtils.safeUrl(u.avatarUrl, "")) %>" alt="Fotka" loading="lazy" referrerpolicy="no-referrer"></a>
                <button type="submit" class="btn-delete">Odebrat fotku</button>
              </form>
              <% } %>
              <% if (u.coverUrl != null) { %>
              <form method="post" action="/admin/users" onsubmit="return confirm('Odebrat záhlaví tohoto uživatele? Soubor se smaže.');">
                <input type="hidden" name="csrf" value="${csrf}">
                <input type="hidden" name="user_id" value="<%= u.id %>">
                <input type="hidden" name="action" value="remove_cover">
                <a href="<%= WebUtils.escapeHtml(WebUtils.safeUrl(u.coverUrl, "")) %>" target="_blank" rel="noopener noreferrer"><img class="admin-thumb wide" src="<%= WebUtils.escapeHtml(WebUtils.safeUrl(u.coverUrl, "")) %>" alt="Záhlaví" loading="lazy"></a>
                <button type="submit" class="btn-delete">Odebrat záhlaví</button>
              </form>
              <% } %>
            </td>
            <%-- role jen jednou: výběr, Uložit ji změní (žádný štítek navíc) --%>
            <td class="act">
              <form method="post" action="/admin/users">
                <input type="hidden" name="csrf" value="${csrf}">
                <input type="hidden" name="user_id" value="<%= u.id %>">
                <input type="hidden" name="action" value="role">
                <select name="role">
                  <option<%= "USER".equals(u.role) ? " selected" : "" %>>USER</option>
                  <option<%= "ADMIN".equals(u.role) ? " selected" : "" %>>ADMIN</option>
                </select>
                <button type="submit">Uložit</button>
              </form>
            </td>
            <td class="act">
              <% if ("DELETED".equals(u.role)) { %>
              <% } else if (u.blocked) { %>
              <form method="post" action="/admin/users">
                <input type="hidden" name="csrf" value="${csrf}">
                <input type="hidden" name="user_id" value="<%= u.id %>">
                <input type="hidden" name="action" value="unblock">
                <button type="submit">Odblokovat</button>
              </form>
              <% } else { %>
              <details class="user-block">
                <summary>Zablokovat</summary>
                <form method="post" action="/admin/users">
                  <input type="hidden" name="csrf" value="${csrf}">
                  <input type="hidden" name="user_id" value="<%= u.id %>">
                  <input type="hidden" name="action" value="block">
                  <input name="reason" maxlength="200" placeholder="Důvod (uvidíš jen ty)" aria-label="Důvod zablokování">
                  <button type="submit" class="btn-delete">Zablokovat</button>
                </form>
              </details>
              <% } %>
              <form method="post" action="/admin/users" onsubmit="return confirm('Smazat uživatele?');">
                <input type="hidden" name="csrf" value="${csrf}">
                <input type="hidden" name="user_id" value="<%= u.id %>">
                <input type="hidden" name="action" value="delete">
                <button type="submit" class="btn-delete">Smazat</button>
              </form>
            </td>
          </tr>
          <%
            }
          %>
        </tbody>
      </table>
    </div>
    <script>
    (function () {
      var input = document.getElementById('userFilter'), deleted = document.getElementById('showDeleted');
      var rows = [].slice.call(document.querySelectorAll('#userTable tbody tr')), count = document.getElementById('userCount');
      function render() {
        var q = input.value.trim().toLowerCase(), shown = 0;
        rows.forEach(function (r) {
          var ok = (deleted.checked || !r.classList.contains('role-deleted')) && (!q || r.textContent.toLowerCase().indexOf(q) >= 0);
          r.hidden = !ok;
          if (ok) shown++;
        });
        count.textContent = shown + ' z ' + rows.length;
      }
      input.addEventListener('input', render);
      deleted.addEventListener('change', render);
      render();
    })();
    </script>
  <%
    }
  %>
</main>
<%@ include file="includes/footer.jsp" %>