// Dlaždice profilu (uzivatel.jsp, player.jsp): za myší se lehce nakloní a jde po nich odlesk.
// Jen s opravdovou myší – na telefonu nic neběží, aby slabší mobily nebrzdilo a prst nerušil posouvání.
(function () {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.pt[data-tilt]').forEach(function (tile) {
    var frame = 0, x = 0.5, y = 0.5;
    function paint() {
      frame = 0;
      tile.style.setProperty('--mx', x * 100 + '%');
      tile.style.setProperty('--my', y * 100 + '%');
      if (calm) return;
      tile.style.setProperty('--ry', (x - 0.5) * 8 + 'deg');
      tile.style.setProperty('--rx', (0.5 - y) * 8 + 'deg');
    }
    tile.addEventListener('pointermove', function (e) {
      var r = tile.getBoundingClientRect();
      x = (e.clientX - r.left) / r.width;
      y = (e.clientY - r.top) / r.height;
      if (!frame) frame = requestAnimationFrame(paint);
    });
    tile.addEventListener('pointerleave', function () {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      tile.style.removeProperty('--rx');
      tile.style.removeProperty('--ry');
    });
  });
})();
