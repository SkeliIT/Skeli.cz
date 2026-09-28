<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<main class="about-page">
  <section class="about-header">
    <h2><%= t.getProperty("about.title","About me") %></h2>
    <div class="about-intro">
      <%-- the portrait heads the story and fades out into the text below it --%>
      <%-- dark theme: the photo on its black background; light theme: the same photo with the
           background removed, so it dissolves into the light panel just like the dark one does.
           The script picks the version before anything is downloaded, so only one is fetched. --%>
      <figure class="about-portrait">
        <img id="aboutPortrait" sizes="(max-width: 820px) 100vw, 780px"
             data-dark="/img/skeli-portrait-760.webp 760w, /img/skeli-portrait-1400.webp 1400w"
             data-light="/img/skeli-portrait-light-760.webp?v=2 760w, /img/skeli-portrait-light-1400.webp?v=2 1400w"
             width="1400" height="934" alt="Skeli" fetchpriority="high" decoding="async">
        <noscript><img src="/img/skeli-portrait-1400.webp" width="1400" height="934" alt="Skeli"></noscript>
      </figure>
      <script>
        (function () {
          const img = document.getElementById('aboutPortrait');
          if (!img) return;
          const apply = () => {
            const set = document.body.classList.contains('light') ? img.dataset.light : img.dataset.dark;
            if (img.getAttribute('srcset') === set) return;
            img.srcset = set;
            img.src = set.split(', ').pop().split(' ')[0];
          };
          apply();
          new MutationObserver(apply).observe(document.body, { attributes: true, attributeFilter: ['class'] });
        })();
      </script>
      <p class="about-lead"><%= t.getProperty("about.intro1") %></p>
      <div class="about-text">
        <p><%= t.getProperty("about.intro2") %></p>
        <p><%= t.getProperty("about.selftaught.text") %></p>
        <p><%= t.getProperty("about.work.text") %></p>
        <blockquote class="about-quote"><%= t.getProperty("about.work.quote") %></blockquote>
        <p><%= t.getProperty("about.why.p1") %></p>
        <p><%= t.getProperty("about.why.p2") %></p>
        <p><%= t.getProperty("about.squad.p1") %></p>
        <p><%= t.getProperty("about.squad.p2") %></p>
        <p><%= t.getProperty("about.squad.p3") %></p>
        <p class="about-highlight"><%= t.getProperty("about.squad.p4") %><br><%= t.getProperty("about.squad.p5") %></p>
        <p><%= t.getProperty("about.squad.p6") %></p>
        <p class="about-outro"><%= t.getProperty("about.outro") %></p>
        <div class="about-signature"><span class="squad-mark" aria-hidden="true"></span><span class="sr-only"><%= t.getProperty("about.signature") %></span></div>
      </div>
    </div>
  </section>
  <section class="about-grid">
    <div class="about-card">
      <h3><%= t.getProperty("about.music.title","Music journey") %></h3>
      <p><%= t.getProperty("about.music.text","From the first tracks to the current work. Find clips and playlists on the Music page.") %></p>
    </div>
    <div class="about-card">
      <h3><%= t.getProperty("about.collab.title","Collaboration") %></h3>
      <p><%= t.getProperty("about.collab.text","If you enjoy my work, get in touch. I welcome rap features, beat production and visuals.") %></p>
    </div>
    <div class="about-card">
      <h3><%= t.getProperty("about.contact.title","Contact") %></h3>
      <p><%= t.getProperty("about.contact.email","E-mail") %>: <a href="mailto:skelimc@seznam.cz">skelimc@seznam.cz</a></p>
    </div>
  </section>
  <section class="about-footer">
    <p><%= t.getProperty("about.follow") %></p>
    <div class="social-icons-large">
        <a href="https://www.facebook.com/mcskeli/" target="_blank" rel="noopener" aria-label="Facebook">
            <i class="fab fa-facebook icon-facebook"></i>
        </a>
        <a href="https://www.instagram.com/skeli.official/" target="_blank" rel="noopener" aria-label="Instagram">
            <i class="fab fa-instagram icon-instagram"></i>
        </a>
        <a href="https://www.youtube.com/@Skeli" target="_blank" rel="noopener" aria-label="YouTube">
            <i class="fab fa-youtube icon-youtube"></i>
        </a>
        <a href="https://open.spotify.com/artist/5IouXw8U9uKCTwmncG5bUl?si=93iNOmPtT8u2l163tTkKeQ" target="_blank" rel="noopener" aria-label="Spotify">
            <i class="fab fa-spotify icon-spotify"></i>
        </a>
    </div>
  </section>
</main>

<%@ include file="includes/footer.jsp" %>
