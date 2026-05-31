<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<main>
  <section style="text-align:center; margin-bottom:18px;">
    <h2 class="bruno-ace-sc-regular"><%= ((java.util.Properties)request.getAttribute("t")).getProperty("about.title","About me") %></h2>
    <div style="display:flex; justify-content:center; margin: 12px 0;">
      <img src="/img/IMG_0132.webp" alt="Skeli" style="width:220px;height:220px;border-radius:50%;object-fit:cover;box-shadow:0 12px 30px rgba(0,0,0,.35);border:2px solid var(--panel-border);" onerror="this.style.display='none'">
    </div>
    <p><%= ((java.util.Properties)request.getAttribute("t")).getProperty("about.p1","Jsem Skeli – rapper, producent a nadšenec do webu. Baví mě tvořit hudbu i aplikace, které něco předají.") %></p>
  </section>
  <style>
    .about-card { background:rgba(0,0,0,0.65); border:1px solid var(--panel-border); border-radius:12px; padding:16px; transition: all 0.3s ease; }
    .about-card:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.45); }
    .about-card h3 { color: var(--accent); }
    .about-card a { color: var(--accent); font-weight: 600; text-decoration: none; }
    .about-card a:hover { text-shadow: 0 0 8px var(--accent); text-decoration: underline; }
    body.light .about-card { background:rgba(255,255,255,0.85); border-color: rgba(0,0,0,0.15); }
  </style>
  <section style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:16px;">
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
  <section style="text-align:center; margin-top:18px;">
    <p> Sleduj novinky na mých sítích:</p>
    <div style="font-size:3em; text-align:center;">
        <a href="https://www.facebook.com/mcskeli/" target="_blank" style="margin:0 10px; color:inherit; text-decoration:none;">
            <i class="fab fa-facebook" style="color:#4267B2;"></i>
        </a>
        <a href="https://www.instagram.com/skeli.official/" target="_blank" style="margin:0 10px; color:inherit; text-decoration:none;">
            <i class="fab fa-instagram" style="color:#E1306C;"></i>
        </a>
        <a href="https://www.youtube.com/@Skeli" target="_blank" style="margin:0 10px; color:inherit; text-decoration:none;">
            <i class="fab fa-youtube" style="color:#FF0000;"></i>
        </a>
        <a href="https://open.spotify.com/artist/5IouXw8U9uKCTwmncG5bUl?si=93iNOmPtT8u2l163tTkKeQ" target="_blank" style="margin:0 10px; color:inherit; text-decoration:none;">
            <i class="fab fa-spotify" style="color:#1DB954;"></i>
        </a>
    </div>
</main>

<%@ include file="includes/footer.jsp" %>