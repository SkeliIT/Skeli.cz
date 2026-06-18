<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="java.util.List" %>
<%@ include file="includes/header.jsp" %>

<main>
    <h2>Správa odběratelů novinek</h2>

    <div class="admin-card">
        <table class="admin-table">
            <thead>
                <tr>
                    <th>E-mail</th>
                    <th>Přihlášeno</th>
                    <th>Odhlášeno</th>
                    <th>Akce</th>
                </tr>
            </thead>
            <tbody>
                <% List<String[]> emails = (List<String[]>)request.getAttribute("emails");
                   if (emails != null) for (String[] row : emails) { %>
                    <tr>
                        <td><%= row[0] %></td>
                        <td><%= row[1] %></td>
                        <td><%= row[2] != null && !"null".equals(row[2]) ? row[2] : "" %></td>
                        <td>
                            <form method="post" action="/admin/newsletter" style="display:inline">
                                <input type="hidden" name="email" value="<%= row[0] %>">
                                <button type="submit" class="btn-delete" onclick="return confirm('Opravdu smazat?')">Smazat</button>
                            </form>
                        </td>
                    </tr>
                <% } %>
            </tbody>
        </table>
    </div>

    <div style="margin-top: 20px;">
        <a href="/admin.jsp" class="link-btn">Zpět do administrace</a>
    </div>
</main>

<%@ include file="includes/footer.jsp" %>
