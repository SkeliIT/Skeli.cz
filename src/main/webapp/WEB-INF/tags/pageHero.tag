<%@ tag pageEncoding="UTF-8" body-content="scriptless" %>
<%@ attribute name="title" required="true" type="java.lang.String" %>
<%@ attribute name="kicker" required="false" type="java.lang.String" %>
<%@ attribute name="lead" required="false" type="java.lang.String" %>
<%@ attribute name="smoke" required="false" type="java.lang.String" %>
<%--
  The top of a page: a kicker with the equalizer, the page title in the colour of the background photo and a lead,
  on the site's usual background. Anything inside the tag (a search box, filter chips) goes under the lead.
  The texts come from the i18n files, so they are written out as they are.
  Vzhled „Ulice“: dole se fotka ztrácí kouřem (js/smoke.js) do plné barvy stránky (main.has-floor, js/effects.js).
  smoke="false" = bez kouře a bez plné barvy (Texty mají vlastní video pozadí).
--%>
<header class="page-hero<%= "false".equals(jspContext.getAttribute("smoke")) ? "" : " with-smoke" %>">
  <div class="page-hero-inner">
    <% if (jspContext.getAttribute("kicker") != null) { %>
    <p class="hero-kicker"><span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>${kicker}</p>
    <% } %>
    <h1 class="page-hero-title">${title}</h1>
    <% if (jspContext.getAttribute("lead") != null) { %>
    <p class="page-hero-lead">${lead}</p>
    <% } %>
    <jsp:doBody/>
  </div>
  <% if (!"false".equals(jspContext.getAttribute("smoke"))) { %><div class="smoke-edge b" aria-hidden="true"><canvas></canvas></div><% } %>
</header>
