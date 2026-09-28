<%@ page contentType="text/html; charset=UTF-8" language="java" %>
<%@ include file="includes/header.jsp" %>

<main>
    <div class="auth-wrap">
        <div class="auth-card">
            <h2><%= t.getProperty("home.newsletter.title") %></h2>

            <% if (request.getParameter("success") != null) { %>
                <div class="form-success text-center"><%= t.getProperty("newsletter.success") %></div>
            <% } else if (request.getParameter("confirmed") != null) { %>
                <div class="form-success text-center"><%= t.getProperty("newsletter.confirmed") %></div>
            <% } else if (request.getParameter("unsubscribed") != null) { %>
                <div class="form-success text-center"><%= t.getProperty("newsletter.unsubscribed") %></div>
            <% } else if (request.getParameter("error") != null) {
                   // Never echo the raw parameter (reflected XSS) - map known codes to fixed messages
                   String errorCode = request.getParameter("error");
                   String errorKey;
                   if ("missing".equals(errorCode)) errorKey = "newsletter.error.missing";
                   else if ("token".equals(errorCode)) errorKey = "newsletter.error.token";
                   else if ("notfound".equals(errorCode)) errorKey = "newsletter.error.notfound";
                   else if ("invalid".equals(errorCode)) errorKey = "newsletter.error.invalid";
                   else if ("limit".equals(errorCode)) errorKey = "newsletter.error.limit";
                   else if ("confirm".equals(errorCode)) errorKey = "newsletter.error.confirm";
                   else errorKey = "newsletter.error.generic";
            %>
                <div class="form-alert text-center"><%= t.getProperty("common.error") %> <%= t.getProperty(errorKey) %></div>
            <% } %>

            <form method="post" action="/newsletter/subscribe">
                <input type="hidden" name="csrf" value="${csrf}">
                <label for="email"><%= t.getProperty("newsletter.email") %></label>
                <input type="email" name="email" id="email" placeholder="<%= t.getProperty("newsletter.placeholder") %>" required>
                <div class="hp-field" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
                <button type="submit"><%= t.getProperty("newsletter.submit") %></button>
            </form>

            <div class="auth-footer">
                <p class="form-note">
                    <%= t.getProperty("newsletter.consent") %><br>
                    <a href="/gdpr.jsp"><%= t.getProperty("newsletter.gdprLink") %></a>
                </p>
            </div>
        </div>
    </div>
</main>

<%@ include file="includes/footer.jsp" %>
