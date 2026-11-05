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
      String adminMsg = request.getParameter("msg");
  %>
    <% if ("image_removed".equals(adminMsg)) { %><p class="admin-flash">Obrázek je odebraný a smazaný z disku. Kdo měl nevhodnou fotku, je odhlášený.</p><% } %>
    <% if ("self".equals(adminMsg)) { %><p class="admin-flash error">Sám sebe smazat nemůžeš. Svůj účet smažeš v Nastavení.</p><% } %>
    <% if ("last_admin".equals(adminMsg)) { %><p class="admin-flash error">Tohle je poslední admin. Web musí mít aspoň jednoho.</p><% } %>
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
            <td><%= WebUtils.escapeHtml(u.username) %></td>
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