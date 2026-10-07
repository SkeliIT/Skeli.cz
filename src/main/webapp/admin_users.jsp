<%@ page import="java.sql.*" %>
<%@ page import="com.github.skeliit.Db" %>
<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<main class="admin-page">
  <%@ include file="/includes/admin-nav.jspf" %>
  <h2 class="admin-page-title">Uživatelé</h2>
  <%
    String role = (String) session.getAttribute("role");
    if (!"ADMIN".equals(role)) { out.println("<p>Pouze pro ADMIN.</p>"); } else {
      try (Connection conn = Db.get();
           PreparedStatement ps = conn.prepareStatement("SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC");
           ResultSet rs = ps.executeQuery()) {
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
            while (rs.next()) {
          %>
          <tr class="role-<%= com.github.skeliit.WebUtils.escapeHtml(rs.getString("role")).toLowerCase() %>">
            <td><%= rs.getInt("id") %></td>
            <td><%= com.github.skeliit.WebUtils.escapeHtml(rs.getString("username")) %></td>
            <td><%= com.github.skeliit.WebUtils.escapeHtml(rs.getString("email")) %></td>
            <td><span class="role-badge"><%= com.github.skeliit.WebUtils.escapeHtml(rs.getString("role")) %></span></td>
            <td><%= rs.getTimestamp("created_at") == null ? "" : new java.text.SimpleDateFormat("d. M. yyyy HH:mm").format(rs.getTimestamp("created_at")) %></td>
            <td class="act">
              <form method="post" action="/admin/users">
                <input type="hidden" name="csrf" value="${csrf}">
                <input type="hidden" name="user_id" value="<%= rs.getInt("id") %>">
                <input type="hidden" name="action" value="role">
                <select name="role">
                  <option<%= "USER".equals(rs.getString("role"))?" selected":"" %>>USER</option>
                  <option<%= "ADMIN".equals(rs.getString("role"))?" selected":"" %>>ADMIN</option>
                </select>
                <button type="submit">Uložit</button>
              </form>
              <form method="post" action="/admin/users" onsubmit="return confirm('Smazat uživatele?');">
                <input type="hidden" name="csrf" value="${csrf}">
                <input type="hidden" name="user_id" value="<%= rs.getInt("id") %>">
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
    }
  %>
</main>
<%@ include file="includes/footer.jsp" %>