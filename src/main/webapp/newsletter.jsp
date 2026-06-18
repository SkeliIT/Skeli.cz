<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ include file="includes/header.jsp" %>

<main>
    <div class="auth-wrap">
        <div class="auth-card">
            <h2>Novinky e-mailem</h2>

            <% if (request.getParameter("success") != null) { %>
                <div class="form-success text-center">Děkujeme, byl Vám zaslán potvrzovací e-mail.</div>
            <% } else if (request.getParameter("unsubscribed") != null) { %>
                <div class="form-success text-center">Odběr byl úspěšně zrušen.</div>
            <% } else if (request.getParameter("error") != null) { %>
                <div class="form-alert text-center">Chyba: <% out.print(request.getParameter("error")); %></div>
            <% } %>

            <form method="post" action="/newsletter/subscribe">
                <label for="email">E-mailová adresa</label>
                <input type="email" name="email" id="email" placeholder="vas@email.cz" required>
                <button type="submit">Přihlásit se k odběru</button>
            </form>

            <div class="auth-footer">
                <p class="form-note">
                    Odesláním souhlasíte se zpracováním e-mailu pro zasílání novinek.
                    Kdykoli se můžete odhlásit pomocí odkazu v každém e-mailu.<br>
                    <a href="/gdpr.jsp">Zásady ochrany osobních údajů (GDPR)</a>
                </p>
            </div>
        </div>
    </div>
</main>

<%@ include file="includes/footer.jsp" %>
