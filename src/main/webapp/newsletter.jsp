<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html>
<head>
    <title>Novinky e-mailem</title>
</head>
<body>
<h1>Přihlášení k odběru novinek</h1>
<% if (request.getParameter("success") != null) { %>
    <p style="color:green">Děkujeme, byl Vám zaslán potvrzovací e-mail s odkazem pro odhlášení.</p>
<% } else if (request.getParameter("unsubscribed") != null) { %>
    <p style="color:green">Odběr byl úspěšně zrušen a e-mail vymazán.</p>
<% } else if (request.getParameter("error") != null) { %>
    <p style="color:red">Chyba: <% out.print(request.getParameter("error")); %></p>
<% } %>
<form method="post" action="/newsletter/subscribe">
    <label for="email">E-mail:</label>
    <input type="email" name="email" id="email" required>
    <button type="submit">Přihlásit se</button>
</form>
<p>Odesláním souhlasíte se zpracováním e-mailu pro zasílání novinek. <br>
Kdykoli se můžete odhlásit pomocí odkazu v každém e-mailu. <br>
Vaše adresa nebude sdílena s třetími stranami. <br>
<a href="/gdpr.jsp">Zásady ochrany osobních údajů (GDPR)</a></p>
</body>
</html>
