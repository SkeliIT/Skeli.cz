<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<main>
  <section class="about-header">
    <h2 class="bruno-ace-sc-regular"><%= ((java.util.Properties)request.getAttribute("t")).getProperty("about.title","About me") %></h2>
    <div class="about-avatar-container">
      <img src="/img/IMG_0132.webp" alt="Skeli" class="about-avatar" onerror="this.style.display='none'">
    </div>
    <p><%= ((java.util.Properties)request.getAttribute("t")).getProperty("about.p1","Jsem Skeli – rapper, producent a nadšenec do webu. Baví mě tvořit hudbu i aplikace, které něco předají.") %></p>
  </section>
  <section class="about-grid">
    <div class="about-card">
      <h3><%= ((java.util.Properties)request.getAttribute("t")).getProperty("about.music.title","Music journey") %></h3>
      <p><%= ((java.util.Properties)request.getAttribute("t")).getProperty("about.music.text","From the first tracks to the current work. Find clips and playlists on the Music page.") %></p>
    </div>
    <div class="about-card">
      <h3><%= ((java.util.Properties)request.getAttribute("t")).getProperty("about.collab.title","Collaboration") %></h3>
      <p><%= ((java.util.Properties)request.getAttribute("t")).getProperty("about.collab.text","If you enjoy my work, get in touch. I welcome rap features, beat production and visuals.") %></p>
    </div>
    <div class="about-card">
      <h3><%= ((java.util.Properties)request.getAttribute("t")).getProperty("about.contact.title","Contact") %></h3>
      <p><%= ((java.util.Properties)request.getAttribute("t")).getProperty("about.contact.email","E-mail") %>: <a href="mailto:skelimc@seznam.cz">skelimc@seznam.cz</a></p>
    </div>
  </section>
  <section class="about-footer">
    <p> Sleduj novinky na mých sítích:</p>
    <div class="social-icons-large">
        <a href="https://www.facebook.com/mcskeli/" target="_blank">
            <i class="fab fa-facebook icon-facebook"></i>
        </a>
        <a href="https://www.instagram.com/skeli.official/" target="_blank">
            <i class="fab fa-instagram icon-instagram"></i>
        </a>
        <a href="https://www.youtube.com/@Skeli" target="_blank">
            <i class="fab fa-youtube icon-youtube"></i>
        </a>
        <a href="https://open.spotify.com/artist/5IouXw8U9uKCTwmncG5bUl?si=93iNOmPtT8u2l163tTkKeQ" target="_blank">
            <i class="fab fa-spotify icon-spotify"></i>
        </a>
    </div>
  </section>
</main>

<%@ include file="includes/footer.jsp" %>
