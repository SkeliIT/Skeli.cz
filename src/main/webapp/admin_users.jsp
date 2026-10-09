<%@ page import="com.github.skeliit.dao.AdminDao, com.github.skeliit.model.AdminUser, com.github.skeliit.WebUtils" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<main class="admin-page">
  <%@ include file="/includes/admin-nav.jspf" %>
  <h2 class="admin-page-title">Uživatelé</h2>
  <%
    String role = (String) session.getAttribute("role");
    if (!"ADMIN".equals(role)) { out.println("<p>Pouze pro ADMIN.</p>"); } else {
      java.util.List<AdminUser> users = new AdminDao().users();
  %>
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
          <tr><th>ID</th><th>Jméno</th><th>Email</th><th>Role</th><th>Vytvořen</th><th>Akce</th></tr>
        </thead>
        <tbody>
          <%
            for (AdminUser u : users) {
          %>
          <tr class="role-<%= WebUtils.escapeHtml(u.role).toLowerCase() %>">
            <td><%= u.id %></td>
            <td><%= WebUtils.escapeHtml(u.username) %></td>
            <td><%= WebUtils.escapeHtml(u.email) %></td>
            <td><span class="role-badge"><%= WebUtils.escapeHtml(u.role) %></span></td>
            <td><%= u.createdAt == null ? "" : new java.text.SimpleDateFormat("d. M. yyyy HH:mm").format(u.createdAt) %></td>
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