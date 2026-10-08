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
        <a href="<%= request.getContextPath() %>/about.jsp"><%= t.getProperty("menu.about") %></a>
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
        <a class="social-btn am" href="https://music.apple.com/cz/artist/skeli/1820513581" target="_blank" rel="noopener" aria-label="Apple Music"><i class="fab fa-apple"></i></a>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <span>&copy; <%= java.time.Year.now() %> Skeli</span>
    <%-- filled in by js/presence.js; stays hidden without JavaScript --%>
    <span id="onlineNow" class="online-now" title="<%= t.getProperty("footer.onlineHint") %>" hidden><i class="online-dot" aria-hidden="true"></i> <%= t.getProperty("footer.online") %> <b>1</b></span>
    <nav>
      <a href="<%= request.getContextPath() %>/privacy.jsp"><%= t.getProperty("cookie.policy","Privacy") %></a>
      <a href="<%= request.getContextPath() %>/terms.jsp"><%= t.getProperty("cookie.terms","Terms") %></a>
      <a href="<%= request.getContextPath() %>/gdpr.jsp">GDPR</a>
      <a href="<%= request.getContextPath() %>/privacy.jsp#cookies" data-cookie-settings><%= t.getProperty("cookie.settingsLink") %></a>
    </nav>
  </div>
</footer>

<div id="cookieBar" class="cookie-bar" role="dialog" aria-labelledby="cookieTitle" aria-live="polite">
  <p id="cookieTitle"><%= t.getProperty("cookie.message") %>
    <a href="<%= request.getContextPath() %>/privacy.jsp#cookies"><%= t.getProperty("cookie.policy") %></a></p>
  <%-- the choices, opened by "Settings" (and by the footer link) --%>
  <div class="cookie-prefs" hidden>
    <label class="cookie-cat">
      <input type="checkbox" checked disabled>
      <span><b><%= t.getProperty("cookie.cat.necessary") %></b><small><%= t.getProperty("cookie.cat.necessaryDesc") %></small></span>
    </label>
    <label class="cookie-cat">
      <input type="checkbox" id="consentAnalytics">
      <span><b><%= t.getProperty("cookie.cat.analytics") %></b><small><%= t.getProperty("cookie.cat.analyticsDesc") %></small></span>
    </label>
    <label class="cookie-cat">
      <input type="checkbox" id="consentMedia">
      <span><b><%= t.getProperty("cookie.cat.media") %></b><small><%= t.getProperty("cookie.cat.mediaDesc") %></small></span>
    </label>
    <button type="button" class="cookie-btn" data-consent="save"><%= t.getProperty("cookie.save") %></button>
  </div>
  <%-- "Accept all" and "Reject all" look the same: refusing is as easy as agreeing --%>
  <div class="cookie-actions">
    <button type="button" class="cookie-btn" data-consent="all"><%= t.getProperty("cookie.accept") %></button>
    <button type="button" class="cookie-btn" data-consent="none"><%= t.getProperty("cookie.reject") %></button>
    <button type="button" class="cookie-btn cookie-btn-ghost" data-consent="settings" aria-expanded="false"><%= t.getProperty("cookie.settings") %></button>
  </div>
</div>
<script>
  // "Skip to content": the pages have no id on <main>, so the focus is moved here
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.skip-link')) return;
    const main = document.querySelector('main');
    if (!main) return;
    e.preventDefault();
    main.setAttribute('tabindex', '-1');
    main.focus();
  });
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
<script src="<%= request.getContextPath() %>/js/presence.js?v=<%= assetVersion %>" defer></script>
<script src="<%= request.getContextPath() %>/js/consent.js?v=<%= assetVersion %>" defer></script>
<script src="<%= request.getContextPath() %>/js/kevin-lines.js?v=<%= assetVersion %>" defer></script>
<script src="<%= request.getContextPath() %>/js/kevin.js?v=<%= assetVersion %>" defer></script>
<script>
  // third-party players (YouTube, Spotify) in .consent-embed: they load after consent in the
  // cookie bar, or when the visitor clicks "Load the player" on one of them
  (function () {
    function load(frame) {
      if (!frame || !frame.dataset.consentSrc) return;
      frame.src = frame.dataset.consentSrc;
      frame.removeAttribute('data-consent-src');
      var box = frame.closest('.consent-embed');
      if (box) box.classList.add('loaded');
    }
    function loadAll() {
      if (window.skeliConsent && window.skeliConsent()) document.querySelectorAll('iframe[data-consent-src]').forEach(load);
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.consent-embed-btn');
      if (b) load(b.closest('.consent-embed').querySelector('iframe[data-consent-src]'));
    });
    document.addEventListener('consent-granted', loadAll);
    document.addEventListener('pjax:done', loadAll);
    loadAll();
  })();
</script>
<%-- Matomo is loaded by js/consent.js, only after consent to analytics --%>

</body>
</html>
