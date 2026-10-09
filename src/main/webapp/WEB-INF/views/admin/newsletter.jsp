<%@ page contentType="text/html; charset=UTF-8" language="java" %>
<%@ page import="java.util.List" %>
<%@ include file="/includes/header.jsp" %>

<main class="admin-page">
    <%@ include file="/includes/admin-nav.jspf" %>
    <h2 class="admin-page-title">Správa odběratelů novinek</h2>

    <div class="admin-card">
        <table class="admin-table">
            <thead>
                <tr>
                    <th>E-mail</th>
                    <th>Přihlášeno</th>
                    <th>Potvrzeno</th>
                    <th>Odhlášeno</th>
                    <th>Akce</th>
                </tr>
            </thead>
            <tbody>
                <% List<String[]> emails = (List<String[]>)request.getAttribute("emails");
                   if (emails != null) for (String[] row : emails) { %>
                    <tr>
                        <td><%= com.github.skeliit.WebUtils.escapeHtml(row[0]) %></td>
                        <td><%= com.github.skeliit.WebUtils.escapeHtml(row[1]) %></td>
                        <%-- double opt-in: only confirmed addresses are real subscribers --%>
                        <td><%= row[3] != null && !"null".equals(row[3]) ? com.github.skeliit.WebUtils.escapeHtml(row[3]) : "<span class=\"text-dim\">čeká na potvrzení</span>" %></td>
                        <td><%= row[2] != null && !"null".equals(row[2]) ? com.github.skeliit.WebUtils.escapeHtml(row[2]) : "" %></td>
                        <td>
                            <form method="post" action="/admin/newsletter" class="inline-form">
                                <input type="hidden" name="csrf" value="${csrf}">
                                <input type="hidden" name="email" value="<%= com.github.skeliit.WebUtils.escapeHtml(row[0]) %>">
                                <button type="submit" class="btn-delete" onclick="return confirm('Opravdu smazat?')">Smazat</button>
                            </form>
                        </td>
                    </tr>
                <% } %>
            </tbody>
        </table>
    </div>

</main>

<%@ include file="/includes/footer.jsp" %>
