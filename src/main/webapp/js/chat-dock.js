// Zprávy odkudkoli: lišta na počítači, kolečko na telefonu. Okno je obyčejná stránka /zpravy?embed=1 v rámečku,
// načte se až po prvním otevření a zůstává otevřené i při přechodu mezi stránkami (je mimo <main>).
(function () {
  var dock = document.getElementById('chatDock');
  if (!dock || dock.dataset.ready) return;
  dock.dataset.ready = '1';
  var btn = dock.querySelector('.chat-dock-btn'), panel = dock.querySelector('.chat-dock-panel');
  var frame = panel.querySelector('iframe'), close = panel.querySelector('.chat-dock-close');

  function setOpen(open) {
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open && !frame.getAttribute('src')) frame.src = frame.dataset.src;
    document.documentElement.classList.toggle('chat-dock-open', open);
  }
  btn.addEventListener('click', function () { setOpen(panel.hidden); });
  close.addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) setOpen(false); });

  // na telefonu při psaní do pole na stránce zmizí, ať nepřekáží
  var coarse = window.matchMedia('(pointer: coarse)');
  document.addEventListener('focusin', function (e) {
    if (coarse.matches && e.target.matches('input, textarea, select')) dock.classList.add('ducked');
  });
  document.addEventListener('focusout', function () { dock.classList.remove('ducked'); });
})();
