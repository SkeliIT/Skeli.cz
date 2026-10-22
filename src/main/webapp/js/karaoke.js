/* Karaoke on the song page, the light version: while the clip plays, the line being sung fills with gold
   from left to right, the lines already sung stay gold; the lyrics scroll in a window under the clip. (A full karaoke
   with its own place in the menu comes later.)

   Timings: /api/karaoke?yt=<clip> = [start, end] for every non-empty line of the lyrics (made by
   tools/karaoke-align.py, corrected in the admin). They count lines of the Czech text; a translation
   with the same lines uses them too, otherwise karaoke stays off. Time: the YouTube player reports it
   by postMessage (the same messages the IFrame API uses). The microphone button or the K key turns it off. */
(function () {
  var pre = document.querySelector('.lyric-page .lyrics-text pre');
  var player = document.getElementById('ytFacade');
  var button = document.getElementById('karaokeToggle');
  if (!pre || !player || !button || pre.dataset.karaoke) return;
  pre.dataset.karaoke = '1';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // zpívaný text: u překladu s českým originálem (js/lyric-bilingual.js) čeština, jinak to, co je na stránce
  var original = window.LyricText ? LyricText.primary() : pre.textContent;
  var lines = [];            // the spans of the non-empty lines, in order
  var data = null, clipId = null, on = true, cur = -1;
  try { on = localStorage.getItem('karaoke') !== 'off'; } catch (e) {}

  // ---------- the lyrics as one span per line ----------
  function split() {
    lines = [];
    if (window.LyricText) {
      // řádky skládá lyric-bilingual.js (v režimu Obojí pod každým zpívaným řádkem překlad)
      LyricText.build(pre, function (line) {
        var s = document.createElement('span');
        s.className = 'k-line';
        s.textContent = line;
        lines.push(s);
        return s;
      });
      return;
    }
    pre.textContent = '';
    original.split('\n').forEach(function (line, i, all) {
      if (line.trim()) {
        var s = document.createElement('span');
        s.className = 'k-line';
        s.textContent = line;
        pre.appendChild(s);
        lines.push(s);
      } else if (line) {
        pre.appendChild(document.createTextNode(line));
      }
      if (i < all.length - 1) pre.appendChild(document.createTextNode('\n'));
    });
  }
  function unsplit() { lines = []; if (window.LyricText) LyricText.build(pre); else pre.textContent = original; }

  // ---------- word by word: each word fills with gold on its own (a wrapped line no longer fills both rows) ----------
  // The words of line i get their sung times from data.words; without them the line's time is shared by length.
  function wordTimes(i, count, text) {
    var w = data && data.words && data.words[i];
    if (w && w.length === count) return w;
    var t = data.times[i], toks = text.trim().split(/\s+/), total = toks.join('').length || 1, at = t[0], out = [];
    toks.forEach(function (tok) { var d = (t[1] - t[0]) * tok.length / total; out.push([at, at + d]); at += d; });
    return out;
  }
  // puts the line's text into el as one span per word (the spaces stay as they are)
  function wordSpans(el, text) {
    el.textContent = '';
    text.split(/(\s+)/).forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(part)); return; }
      var w = document.createElement('span');
      w.className = 'k-w';
      w.textContent = part;
      el.appendChild(w);
    });
    return el.querySelectorAll('.k-w');
  }
  // every word of line i at this time: 0 % before it is sung, filling while it is, 100 % after
  function paintWords(words, i, time) {
    var t = wordTimes(i, words.length, Array.prototype.map.call(words, function (w) { return w.textContent; }).join(' '));
    for (var n = 0; n < words.length; n++) {
      var p = Math.max(0, Math.min(1, (time - t[n][0]) / Math.max(0.12, t[n][1] - t[n][0])));
      words[n].style.setProperty('--k', (p * 100).toFixed(0) + '%');
    }
  }

  // ---------- timings of the clip that shows ----------
  function load(id) {
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(id || '') || id === clipId) return;
    clipId = id; data = null; stop();
    button.hidden = true;
    if (fsBtn) fsBtn.hidden = true;
    fetch('/api/karaoke?yt=' + encodeURIComponent(id)).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || clipId !== id || !d.times) return;
      var count = original.split('\n').filter(function (l) { return l.trim(); }).length;
      if (count !== d.lines || d.times.length !== d.lines) return;   // another text than the timings were made for
      data = d;
      button.hidden = false;
      if (fsBtn) fsBtn.hidden = false;   // full screen with the lyrics only makes sense with timings
      paintButton();
      if (playing && on) start();
    }).catch(function () {});
  }

  function paintButton() {
    button.setAttribute('aria-pressed', String(on));
    button.classList.toggle('on', on);
  }
  button.addEventListener('click', function () {
    on = !on;
    try { localStorage.setItem('karaoke', on ? 'on' : 'off'); } catch (e) {}
    paintButton();
    if (!on) stop();
  });

  // ---------- where the player is (js/yt-clock.js) ----------
  var playing = false, frame = null, clock = null;
  function watchFrame() {
    var f = player.querySelector('iframe[src]');
    if (f === frame) return;
    if (clock) clock.stop();
    frame = f; clock = null; playing = false;
    if (!frame) { stop(); return; }
    clock = window.YtClock(frame, function (c) {
      playing = c.playing();
      if (playing && on && data) start();
    });
  }
  new MutationObserver(function () { watchFrame(); load(player.getAttribute('data-yt')); })
    .observe(player, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-yt'] });
  function now() { return clock ? clock.time() : 0; }

  // ---------- the karaoke window: the clip stays big where it is, the lyrics scroll inside a box under it ----------
  // On start the page lines up once (the clip just under the header bar) and then keeps still; the box
  // fills the rest of the screen. The sung line sits in its upper third, the sung ones slide up and fade.
  // Scrolling the box yourself stops the following and shows "Back to the song" (it comes back by itself
  // after a few seconds). A tap on a line plays the clip from that line.
  var box = pre.closest('.lyric-body') || pre.parentNode;
  var grid = pre.closest('.lyric-grid');
  var backBtn = null, running = false, userAt = 0, ourAt = 0;
  var RESUME_MS = 6000;

  function sizeBox() {
    var top = box.getBoundingClientRect().top;
    box.style.setProperty('--k-win', Math.max(220, Math.round(innerHeight - Math.max(top, 0) - 14)) + 'px');
  }
  function lineUp() {
    var stage = player.closest('.lyric-stage') || player;
    var head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 68;
    var y = stage.getBoundingClientRect().top - head - 8;
    if (Math.abs(y) > 4) scrollBy({ top: y, behavior: 'auto' });
  }
  function start() {
    if (running) return;
    running = true;
    if (!lines.length) split();
    lines.forEach(function (l, n) { l.dataset.i = n; });
    pre.classList.add('karaoke');
    if (grid) grid.classList.add('k-mode');   // PC: a smaller clip, the lyrics window under it (pages.css)
    lineUp();
    box.classList.add('k-window');
    sizeBox();
    requestAnimationFrame(sizeBox);   // again once the smaller clip has settled
    setTimeout(sizeBox, 450);
    if (!backBtn) {
      backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.className = 'k-back';
      backBtn.hidden = true;
      backBtn.innerHTML = '<i class="fa-solid fa-arrow-down" aria-hidden="true"></i> ';
      backBtn.appendChild(document.createTextNode(button.dataset.back || '↓'));
      backBtn.addEventListener('click', function () { userAt = 0; backBtn.hidden = true; follow(true); });
    }
    var tools = document.querySelector('.lyric-tools');
    if (tools) tools.insertBefore(backBtn, tools.firstChild); else box.appendChild(backBtn);
    requestAnimationFrame(tick);
  }
  function stop() {
    running = false; cur = -1;
    pre.classList.remove('karaoke');
    box.classList.remove('k-window');
    if (grid) grid.classList.remove('k-mode');
    box.style.removeProperty('--k-win');
    if (backBtn) { backBtn.hidden = true; backBtn.remove(); }
    if (lines.length) unsplit();
  }
  addEventListener('resize', function () { if (running) sizeBox(); });

  // the visitor's own scrolling inside the box (ours is told apart by the time it was started)
  function userScroll() {
    if (!running || performance.now() < ourAt) return;
    userAt = performance.now();
    if (backBtn) backBtn.hidden = false;
  }
  box.addEventListener('wheel', userScroll, { passive: true });
  box.addEventListener('touchmove', userScroll, { passive: true });
  box.addEventListener('scroll', function () { if (performance.now() >= ourAt) userScroll(); }, { passive: true });

  function follow(force) {
    var el = lines[cur];
    if (!el || !running) return;
    if (!force && userAt && performance.now() - userAt < RESUME_MS) return;
    if (userAt && backBtn) backBtn.hidden = true;
    userAt = 0;
    var target = el.offsetTop - box.clientHeight * 0.33;
    if (Math.abs(box.scrollTop - target) < 4) return;
    ourAt = performance.now() + 700;
    box.scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' });
  }

  // a tap on a line: the clip jumps to it (the IFrame API's seekTo, by postMessage)
  pre.addEventListener('click', function (e) {
    if (!running || !data || !frame) return;
    var l = e.target.closest && e.target.closest('.k-line');
    if (!l || l.dataset.i == null) return;
    var t = data.times[+l.dataset.i][0];
    if (!clock) return;
    clock.seek(t);
    userAt = 0;
    if (backBtn) backBtn.hidden = true;
  });

  var curWords = null;
  function tick() {
    if (!running) return;
    if (!document.body.contains(pre)) { stop(); return; }    // the page was left (PJAX)
    if (!on || !data || !frame) { stop(); return; }
    var time = now(), times = data.times;

    // which line is sung now: the last one that has started
    var i = -1;
    for (var k = 0; k < times.length; k++) { if (times[k][0] <= time) i = k; else break; }
    if (i !== cur) {
      if (lines[cur]) { lines[cur].classList.remove('k-now'); lines[cur].textContent = lines[cur].textContent; }
      cur = i;
      lines.forEach(function (l, n) { l.classList.toggle('k-past', n < i); });
      if (lines[i]) { lines[i].classList.add('k-now'); curWords = wordSpans(lines[i], lines[i].textContent); }
      follow(false);
    } else if (userAt && performance.now() - userAt >= RESUME_MS) {
      follow(false);   // a while after the visitor's own scrolling: back to the song
    }
    // how far into each word the singing is: one CSS variable per word, the gradient does the rest
    if (lines[cur] && curWords) paintWords(curWords, cur, time);
    requestAnimationFrame(tick);
  }

  // ---------- full screen with the lyrics ----------
  // YouTube's own full-screen button shows only the clip (nothing of ours can lie over it), so that stays
  // the "just the video" way. Our button under the clip puts the whole clip box on the screen with the
  // sung line over its bottom (gold fill like the lyrics, the next line dim under it); "Lyrics" at the
  // top hides them. Where a box cannot go full screen (iPhone), it is stretched over the whole window.
  var media = player.closest('.lyric-media') || player.parentNode;
  var allLines = original.split('\n').filter(function (l) { return l.trim(); });
  var fsWords = null, fsBtn = null, fsBox = null, fsNow = null, fsNext = null, fsText = null, fsShow = true, fsIdx = -2, fsLoop = false;
  try { fsShow = localStorage.getItem('fsLyrics') !== 'off'; } catch (e) {}
  function isFs() { return document.fullscreenElement === media || media.classList.contains('fake-fs'); }
  function makeFs() {
    var under = document.querySelector('.lyric-stage .stage-under');
    fsBtn = document.createElement('button');
    fsBtn.type = 'button';
    fsBtn.className = 'fs-lyrics-btn';
    fsBtn.hidden = true;
    fsBtn.innerHTML = '<i class="fa-solid fa-expand" aria-hidden="true"></i> ';
    fsBtn.appendChild(document.createTextNode(button.dataset.fs || ''));
    fsBtn.addEventListener('click', enterFs);
    if (under) under.insertBefore(fsBtn, under.firstChild);
    fsBox = document.createElement('div');
    fsBox.className = 'fs-lyrics';
    fsBox.setAttribute('aria-live', 'polite');
    fsNow = document.createElement('p'); fsNow.className = 'fs-now';
    fsNext = document.createElement('p'); fsNext.className = 'fs-next';
    fsBox.appendChild(fsNow); fsBox.appendChild(fsNext);
    var bar = document.createElement('div');
    bar.className = 'fs-bar';
    fsText = document.createElement('button');
    fsText.type = 'button';
    fsText.innerHTML = '<i class="fa-solid fa-closed-captioning" aria-hidden="true"></i> ';
    fsText.appendChild(document.createTextNode(button.dataset.fsText || ''));
    fsText.addEventListener('click', function () {
      fsShow = !fsShow;
      try { localStorage.setItem('fsLyrics', fsShow ? 'on' : 'off'); } catch (e) {}
      paintFs();
    });
    var exit = document.createElement('button');
    exit.type = 'button';
    exit.title = button.dataset.fsExit || '';
    exit.setAttribute('aria-label', button.dataset.fsExit || '');
    exit.innerHTML = '<i class="fa-solid fa-compress" aria-hidden="true"></i>';
    exit.addEventListener('click', exitFs);
    bar.appendChild(fsText); bar.appendChild(exit);
    media.appendChild(fsBox); media.appendChild(bar);
    paintFs();
  }
  function paintFs() {
    fsText.setAttribute('aria-pressed', String(fsShow));
    fsBox.hidden = !fsShow;
  }
  function enterFs() {
    function fake() { media.classList.add('fake-fs'); document.documentElement.classList.add('fs-lock'); fsChanged(); }
    if (media.requestFullscreen) media.requestFullscreen().catch(fake); else fake();
  }
  function exitFs() {
    if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
    media.classList.remove('fake-fs');
    document.documentElement.classList.remove('fs-lock');
    fsChanged();
  }
  function fsChanged() {
    media.classList.toggle('is-fs', isFs());
    if (isFs() && !fsLoop) { fsLoop = true; fsIdx = -2; requestAnimationFrame(fsTick); }
  }
  document.addEventListener('fullscreenchange', fsChanged);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && media.classList.contains('fake-fs')) exitFs(); });
  function fsTick() {
    if (!isFs() || !document.body.contains(media)) { fsLoop = false; return; }
    if (data && fsShow) {
      var time = now(), times = data.times, i = -1;
      for (var k = 0; k < times.length; k++) { if (times[k][0] <= time) i = k; else break; }
      if (i !== fsIdx) {
        fsIdx = i;
        fsWords = wordSpans(fsNow, i >= 0 ? allLines[i] : '');
        // v režimu Obojí je pod zpívaným řádkem jeho překlad (titulky), jinak další řádek
        var trLine = window.LyricText && i >= 0 ? LyricText.translation(i) : '';
        fsNext.textContent = trLine || allLines[i + 1] || '';
        fsNext.classList.toggle('fs-tr', !!trLine);
      }
      if (i >= 0 && fsWords) paintWords(fsWords, i, time);
    }
    requestAnimationFrame(fsTick);
  }
  makeFs();
  // návštěvník přepnul Originál · Překlad · Obojí: když karaoke běží, přeskládá řádky samo (se svými značkami)
  window.addEventListener('lyric:mode', function (e) {
    original = LyricText.primary();
    allLines = original.split('\n').filter(function (l) { return l.trim(); });
    fsIdx = -2;
    if (lines.length) { e.preventDefault(); cur = -1; split(); }
  });

  // K turns it on and off (not while typing)
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'k' && e.key !== 'K') return;
    if (e.ctrlKey || e.metaKey || e.altKey || button.hidden || !document.body.contains(pre)) return;
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
    button.click();
  });

  paintButton();
  watchFrame();
  load(player.getAttribute('data-yt'));
})();
