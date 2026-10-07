<!-- includes/footer.jsp -->
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <a href="<%= request.getContextPath() %>/index.jsp" class="brand"><span class="logo-mark" aria-hidden="true"></span><span class="sr-only">SKELOSQUAD</span></a>
      <p><%= t.getProperty("index.hero") %></p>
    </div>
    <div>
      <h4 class="footer-title"><%= t.getProperty("footer.menu") %></h4>
      <nav class="footer-nav">
        <a href="<%= request.getContextPath() %>/aktuality.jsp"><%= t.getProperty("menu.news") %></a>
        <a href="<%= request.getContextPath() %>/music.jsp"><%= t.getProperty("menu.music") %></a>
        <a href="<%= request.getContextPath() %>/texty.jsp"><%= t.getProperty("menu.lyrics") %></a>
        <a href="<%= request.getContextPath() %>/bio.jsp"><%= t.getProperty("menu.about") %></a>
        <a href="<%= request.getContextPath() %>/donate.jsp"><%= t.getProperty("btn.donate") %></a>
      </nav>
    </div>
    <div>
      <h4 class="footer-title"><%= t.getProperty("home.social") %></h4>
      <div class="social-row">
        <a class="social-btn fb" href="https://www.facebook.com/mcskeli/" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
        <a class="social-btn ig" href="https://www.instagram.com/skeli.official/" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
        <a class="social-btn yt" href="https://www.youtube.com/@Skeli" target="_blank" rel="noopener" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
        <a class="social-btn sp" href="https://open.spotify.com/artist/5IouXw8U9uKCTwmncG5bUl" target="_blank" rel="noopener" aria-label="Spotify"><i class="fab fa-spotify"></i></a>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <span>&copy; <%= java.time.Year.now() %> Skeli</span>
    <nav>
      <a href="<%= request.getContextPath() %>/privacy.jsp"><%= t.getProperty("cookie.policy","Privacy") %></a>
      <a href="<%= request.getContextPath() %>/terms.jsp"><%= t.getProperty("cookie.terms","Terms") %></a>
      <a href="<%= request.getContextPath() %>/gdpr.jsp">GDPR</a>
    </nav>
  </div>
</footer>

<div id="cookieBar" class="cookie-bar" role="dialog" aria-live="polite">
  <p><%= t.getProperty("cookie.message","This site uses cookies and third-party platforms (YouTube/Spotify).") %>
    <a href="<%= request.getContextPath() %>/privacy.jsp"><%= t.getProperty("cookie.policy","Privacy") %></a> ·
    <a href="<%= request.getContextPath() %>/terms.jsp"><%= t.getProperty("cookie.terms","Terms") %></a></p>
  <div class="cookie-actions">
    <button id="cookieAccept" type="button" class="btn-primary"><%= t.getProperty("cookie.accept","Accept") %></button>
    <button id="cookieReject" type="button"><%= t.getProperty("cookie.reject","Reject") %></button>
  </div>
</div>
<script>
  (function(){
    const k='cookieConsent'; const v=localStorage.getItem(k);
    if(!v) document.getElementById('cookieBar').style.display='block';
    document.getElementById('cookieAccept').onclick=function(){ localStorage.setItem(k,'true'); document.getElementById('cookieBar').style.display='none'; document.dispatchEvent(new Event('consent-granted')); if(window._paq) window._paq.push(['setConsentGiven']); };
    document.getElementById('cookieReject').onclick=function(){ localStorage.setItem(k,'false'); document.getElementById('cookieBar').style.display='none'; if(window._paq) window._paq.push(['forgetConsentGiven']); };
  })();
</script>
<script>
  // Eye button in every password field to show / hide what was typed
  (function(){
    const show = '<%= com.github.skeliit.WebUtils.escapeJs(t.getProperty("auth.password.show")) %>';
    const hide = '<%= com.github.skeliit.WebUtils.escapeJs(t.getProperty("auth.password.hide")) %>';
    document.querySelectorAll('input[type=password]').forEach(function(input){
      const wrap = document.createElement('span');
      wrap.className = 'pw-wrap';
      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(input);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pw-toggle';
      btn.setAttribute('aria-label', show);
      btn.title = show;
      btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
      btn.addEventListener('click', function(){
        const visible = input.type === 'text';
        input.type = visible ? 'password' : 'text';
        btn.innerHTML = visible ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>';
        btn.setAttribute('aria-label', visible ? show : hide);
        btn.title = visible ? show : hide;
        input.focus();
      });
      wrap.appendChild(btn);
    });
  })();
  // sign-in, sign-up, password and newsletter forms: once sent, the button says so and
  // can't be pressed twice (a listener on document runs after the form's own checks)
  document.addEventListener('submit', function (e) {
    const form = e.target;
    if (e.defaultPrevented || !form.closest('.auth-card, .newsletter-form, .settings-form')) return;
    const btn = form.querySelector('button[type=submit], button:not([type])');
    if (!btn || btn.classList.contains('is-sending')) return;
    btn.dataset.label = btn.innerHTML;
    btn.classList.add('is-sending');
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i> '
      + '<%= com.github.skeliit.WebUtils.escapeJs(t.getProperty("form.sending")) %>';
    setTimeout(function () { btn.disabled = true; }, 0);   // after the browser has collected the form
  });
  // back to the page from the browser's cache: the buttons work again
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    document.querySelectorAll('button.is-sending').forEach(function (b) {
      b.disabled = false;
      b.classList.remove('is-sending');
      if (b.dataset.label) b.innerHTML = b.dataset.label;
    });
  });
</script>
<script src="<%= request.getContextPath() %>/js/password-helper.js?v=<%= assetVersion %>" defer></script>
<script src="<%= request.getContextPath() %>/js/effects.js?v=<%= assetVersion %>" defer></script>
<script src="<%= request.getContextPath() %>/js/kevin-lines.js?v=<%= assetVersion %>" defer></script>
<script src="<%= request.getContextPath() %>/js/kevin.js?v=<%= assetVersion %>" defer></script>
<!-- Matomo -->
<script>
  var _paq = window._paq = window._paq || [];
  _paq.push(['requireConsent']);
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);
  (function() {
    var u="https://matomo.vitexsoftware.com/";
    _paq.push(['setTrackerUrl', u+'matomo.php']);
    _paq.push(['setSiteId', '18']);
    var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
    g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
  })();
  /* honor existing cookie consent */
  if(localStorage.getItem('cookieConsent')==='true'){ _paq.push(['setConsentGiven']); }
  document.addEventListener('consent-granted', function(){ _paq.push(['setConsentGiven']); });
  /* track PJAX soft navigations */
  document.addEventListener('pjax:done', function(e){
    _paq.push(['setCustomUrl', e.detail && e.detail.url ? e.detail.url : location.href]);
    _paq.push(['setDocumentTitle', document.title]);
    _paq.push(['trackPageView']);
  });
</script>
<noscript><p><img referrerpolicy="no-referrer-when-downgrade" src="https://matomo.vitexsoftware.com/matomo.php?idsite=18&amp;rec=1" style="border:0;" alt="" /></p></noscript>
<!-- End Matomo Code -->

</body>
</html>
