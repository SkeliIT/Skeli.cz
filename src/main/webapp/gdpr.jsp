<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="includes/header.jsp" %>

<main>
    <div class="settings-wrap">
        <div class="settings-shell">
            <h2 class="text-center"><%= t.getProperty("gdpr.heading") %></h2>

            <section class="settings-section">
                <h3><%= t.getProperty("gdpr.title") %></h3>
                <p><%= t.getProperty("gdpr.intro") %></p>
                <ul>
                    <li><strong><%= t.getProperty("gdpr.email.label") %></strong> <%= t.getProperty("gdpr.email.text") %></li>
                    <li><strong><%= t.getProperty("gdpr.unsub.label") %></strong> <%= t.getProperty("gdpr.unsub.text") %></li>
                    <li><strong><%= t.getProperty("gdpr.third.label") %></strong> <%= t.getProperty("gdpr.third.text") %></li>
                    <li><strong><%= t.getProperty("gdpr.erase.label") %></strong> <%= t.getProperty("gdpr.erase.text") %></li>
                </ul>
                <p><%= t.getProperty("gdpr.questions") %></p>
            </section>

            <div class="text-center" style="margin-top: 20px;">
                <a href="/newsletter.jsp" class="link-btn"><%= t.getProperty("gdpr.backNewsletter") %></a>
                <a href="/index.jsp" class="link-btn"><%= t.getProperty("menu.home") %></a>
            </div>
        </div>
    </div>
</main>

<%@ include file="includes/footer.jsp" %>
