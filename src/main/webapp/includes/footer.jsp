<!-- includes/footer.jsp -->
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<footer>
 <p><br clear="all"></p>
    <p class = "cpy">&copy; 2025 Skeli</p>

    <div style="font-size:1em; text-align:center;">
            <a href="https://www.facebook.com/mcskeli/" target="_blank" style="margin:0 2px; color:inherit; text-decoration:none;">
                <i class="fab fa-facebook" style="color:#4267B2;"></i>
            </a>
            <a href="https://www.instagram.com/skeli.official/" target="_blank" style="margin:0 2px; color:inherit; text-decoration:none;">
                <i class="fab fa-instagram" style="color:#E1306C;"></i>
            </a>
            <a href="https://www.youtube.com/@Skeli" target="_blank" style="margin:0 2px; color:inherit; text-decoration:none;">
                <i class="fab fa-youtube" style="color:#FF0000;"></i>
            </a>
            <a href="https://open.spotify.com/artist/5IouXw8U9uKCTwmncG5bUl?si=93iNOmPtT8u2l163tTkKeQ" target="_blank" style="margin:0 2px; color:inherit; text-decoration:none;">
                <i class="fab fa-spotify" style="color:#1DB954;"></i>
            </a>
        </div>
</footer>
<div class="smoke-veil"></div>

<div id="cookieBar" style="position:fixed; left:20px; right:20px; bottom:20px; background:#111; color:#fff; padding:12px 16px; border-radius:10px; box-shadow:0 10px 30px rgba(0,0,0,.25); display:none;">
  <%= ((java.util.Properties)request.getAttribute("t")).getProperty("cookie.message","This site uses cookies and third-party platforms (YouTube/Spotify).") %> <a href="<%= request.getContextPath() %>/privacy.jsp" style="color:#ffd700;"><%= ((java.util.Properties)request.getAttribute("t")).getProperty("cookie.policy","Privacy") %></a> | <a href="<%= request.getContextPath() %>/terms.jsp" style="color:#ffd700;"><%= ((java.util.Properties)request.getAttribute("t")).getProperty("cookie.terms","Terms") %></a>
  <div style="float:right;">
    <button id="cookieAccept" style="margin-right:8px;"><%= ((java.util.Properties)request.getAttribute("t")).getProperty("cookie.accept","Accept") %></button>
    <button id="cookieReject"><%= ((java.util.Properties)request.getAttribute("t")).getProperty("cookie.reject","Reject") %></button>
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
