// Odpočet do premiéry písně nebo klipu (úvod i stránka písně): prvky s data-premiere = okamžik v ms.
// Uvnitř [data-u="d|h|m|s"] dostanou dny, hodiny, minuty a vteřiny; po nule prvek dostane třídu is-out
// (CSS pak místo odpočtu ukáže „Venku!“). Běží každou vteřinu, skončí, když prvek zmizí ze stránky.
(function () {
  document.querySelectorAll('[data-premiere]').forEach(function (box) {
    if (box.dataset.premiereOn) return;
    box.dataset.premiereOn = '1';
    var at = +box.dataset.premiere, timer = 0;
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function tick() {
      if (!document.body.contains(box)) return clearInterval(timer);
      var left = Math.max(0, at - Date.now()), s = Math.floor(left / 1000);
      var parts = { d: Math.floor(s / 86400), h: pad(Math.floor(s / 3600) % 24), m: pad(Math.floor(s / 60) % 60), s: pad(s % 60) };
      box.querySelectorAll('[data-u]').forEach(function (el) { el.textContent = parts[el.dataset.u]; });
      if (left <= 0) { box.classList.add('is-out'); clearInterval(timer); }
    }
    tick();
    timer = setInterval(tick, 1000);
  });
})();
