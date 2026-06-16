<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="java.util.List" %>
<%@ page import="java.util.Arrays" %>
<!DOCTYPE html>
<html>
<head>
    <title>Správa odběratelů novinek</title>
</head>
<body>
<h1>Správa odběratelů novinek</h1>
<table border="1">
    <tr><th>E-mail</th><th>Přihlášeno</th><th>Odhlášeno</th><th>Akce</th></tr>
    <% List<String[]> emails = (List<String[]>)request.getAttribute("emails");
       if (emails != null) for (String[] row : emails) { %>
        <tr>
            <td><%= row[0] %></td>
            <td><%= row[1] %></td>
            <td><%= row[2] != null && !"null".equals(row[2]) ? row[2] : "" %></td>
            <td>
                <form method="post" action="/admin/newsletter" style="display:inline">
                    <input type="hidden" name="email" value="<%= row[0] %>">
                    <button type="submit" onclick="return confirm('Opravdu smazat?')">Smazat</button>
                </form>
            </td>
        </tr>
    <% } %>
</table>
<a href="/admin.jsp">Zpět do administrace</a>
</body>
</html>
