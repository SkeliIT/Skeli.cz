<%@ tag pageEncoding="UTF-8" body-content="scriptless" %>
<%@ attribute name="title" required="true" type="java.lang.String" %>
<%@ attribute name="kicker" required="false" type="java.lang.String" %>
<%@ attribute name="lead" required="false" type="java.lang.String" %>
<%--
  The top of a page: a kicker with the equalizer, the page title in gold and a lead,
  on the site's usual background (a photo behind it was too busy on the photo background).
  Anything inside the tag (a search box, filter chips) goes under the lead.
  The texts come from the i18n files, so they are written out as they are.
--%>
<header class="page-hero">
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
</header>
