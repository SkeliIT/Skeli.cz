<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%-- Ukázka Kevinových kousků (jen na zkoušku, v menu není): na volných kartách pořád dokola předvádí
     rozběh, sezení na hraně a pád z rohu karty s náhodným dopadem (js/kevin.js, událost kevin {walk:'all'}).
     Jen na počítači – na telefonu Kevin nechodí (není místo). --%>
<main class="kevin-show">
  <p class="kevin-show-note">Kevin – ukázka nových kousků. Sleduj karty: vyleze zpoza karty, rozejde se a rozběhne, zastaví, sedne si na hranu, zavěsí se na roh a spadne. Opakuje se to dokola.</p>
  <p class="kevin-show-step" id="kevinShowStep" aria-live="polite"></p>
  <div class="card kevin-show-card kevin-show-a"></div>
  <div class="card kevin-show-card kevin-show-b"></div>
</main>
<script>
(function () {
  // co Kevin právě dělá (js/kevin.js nastavuje window.__kevinStage) → popisek; po konci procházky další kolo
  var step = document.getElementById('kevinShowStep');
  var NAMES = { 'otáčí': 'Otáčí se zády k okraji', 'leze přes': 'Leze přes hranu', 'leze': 'Leze zpoza karty', 'visí': 'Visí na rohu karty…', 'padá': 'Padá!', 'sedí': 'Sedí na hraně', 'rozhlíží': 'Rozhlíží se, jestli to někdo viděl',
    'tempo walk': 'Jde', 'tempo jog': 'Klusá', 'tempo run': 'Běží', 'tempo sprint': 'Sprintuje' };
  var last = '', lastRun = 0;
  var t = setInterval(function () {
    if (!document.querySelector('main.kevin-show')) return clearInterval(t);
    var s = window.__kevinStage || '';
    var key = Object.keys(NAMES).find(function (k) { return s.indexOf(k) === 0; });
    if (s.indexOf('dopad') === 0) step.textContent = 'Dopad: ' + ({ landSoft: 'měkký', land: 'normální', landHard: 'tvrdý', roll: 'kotoul' }[s.split(' ')[1]] || '');
    else if (key) step.textContent = NAMES[key];
    // nová procházka: na začátku a vždy po konci té minulé
    if ((s === 'konec' || !s) && Date.now() - lastRun > 4000) {
      lastRun = Date.now(); window.__kevinStage = 'čeká';
      step.textContent = 'Kevin se chystá…';
      window.dispatchEvent(new CustomEvent('kevin', { detail: { walk: 'all' } }));
    }
  }, 400);
})();
</script>
<%@ include file="includes/footer.jsp" %>
