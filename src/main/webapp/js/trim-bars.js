// Old clips have black (or white) bars baked into their YouTube thumbnail. For every
// img[data-trim-bars] on the page: find the plain columns at the edges and swap in a copy without
// them (the thumbnails come from our own server, so the canvas may read them). Used by the Texty
// list and by the picture editor in admin, so both show the same picture.
(function () {
  function trimBars(img) {
    var w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h || img.dataset.trimmed) return;
    img.dataset.trimmed = '1';
    try {
      var c = document.createElement('canvas'), sw = 96, sh = Math.round(96 * h / w);
      c.width = sw; c.height = sh;
      var x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(img, 0, 0, sw, sh);
      var d = x.getImageData(0, 0, sw, sh).data;
      var plain = function (col) {
        var sum = 0, sq = 0;
        for (var r = 0; r < sh; r++) {
          var i = (r * sw + col) * 4, l = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
          sum += l; sq += l * l;
        }
        var mean = sum / sh, sd = Math.sqrt(Math.max(0, sq / sh - mean * mean));
        return sd < 7 && (mean < 32 || mean > 232);
      };
      var left = 0, right = 0;
      while (left < sw / 2 && plain(left)) left++;
      while (right < sw / 2 && plain(sw - 1 - right)) right++;
      if (left < 4 && right < 4) return;                       // no real bars
      if (left + right > sw * 0.6) return;                     // a plain picture, not bars
      var l = Math.round(left / sw * w), r = Math.round(right / sw * w);
      var out = document.createElement('canvas');
      out.width = w - l - r; out.height = h;
      out.getContext('2d').drawImage(img, l, 0, w - l - r, h, 0, 0, w - l - r, h);
      img.src = out.toDataURL('image/jpeg', 0.88);
    } catch (e) { /* leave the thumbnail as it is */ }
  }
  document.querySelectorAll('img[data-trim-bars]').forEach(function (img) {
    if (img.complete) trimBars(img); else img.addEventListener('load', function () { trimBars(img); }, { once: true });
  });
})();
