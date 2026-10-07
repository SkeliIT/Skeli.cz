<%@ tag pageEncoding="UTF-8" body-content="scriptless" %>
<%@ attribute name="photo" required="true" type="java.lang.String" %>
<%@ attribute name="title" required="true" type="java.lang.String" %>
<%@ attribute name="kicker" required="false" type="java.lang.String" %>
<%@ attribute name="lead" required="false" type="java.lang.String" %>
<%@ attribute name="pos" required="false" type="java.lang.String" %>
<%@ attribute name="day" required="false" type="java.lang.String" %>
<%@ attribute name="dayPos" required="false" type="java.lang.String" %>
<%--
  The wide band at the top of a page: one of Skeli's photos (img/photos/<photo>-lg|md.webp,
  in the light theme a daylight one: <day>, default point) in black and gold, fading into the page, with a kicker, the page title and a lead.
  Anything inside the tag (a search box, filter chips) goes under the lead.
  The texts come from the i18n files, so they are written out as they are.
--%>
<header class="page-hero">
  <div class="page-hero-photo" aria-hidden="true"
       style="--hero: url('/img/photos/${photo}-lg.webp'); --hero-sm: url('/img/photos/${photo}-md.webp'); --hero-pos: ${empty pos ? 'center' : pos};
              --hero-day: url('/img/photos/${empty day ? 'point' : day}-lg.webp'); --hero-day-sm: url('/img/photos/${empty day ? 'point' : day}-md.webp'); --hero-day-pos: ${empty dayPos ? 'center' : dayPos}"></div>
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
