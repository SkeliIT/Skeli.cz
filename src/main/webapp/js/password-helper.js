// Live password helper for forms with data-pw="new" (+ optional data-pw="confirm") and
// includes/password-rules.jspf: ticks the rules while typing, shows the strength, the
// characters that can't be used and whether both fields match. The server checks the
// same rules (WebUtils.passwordProblems), this is only for the user's convenience.
(function () {
  var MIN = 12, MAX = 64, MAX_BYTES = 72;
  var REQUIRED = ['length', 'lower', 'upper', 'digit', 'special', 'invalid', 'long'];
  // easy-to-guess parts: only a hint, the password is still accepted
  var COMMON = /(passw|heslo|пароль|matkhau|qwert|asdf|yxcv|1234|2345|3456|4567|5678|6789|7890|abcd|skeli|(.)\2\2)/i;

  function forbidden(ch) {
    var cp = ch.codePointAt(0);
    return /[\s\p{Z}\p{Cc}\p{Cf}]/u.test(ch) || (cp >= 0xFE00 && cp <= 0xFE0F) || cp > 0xFFFF;
  }

  function check(p) {
    var chars = Array.from(p), bad = [];
    var r = { lower: false, upper: false, digit: false, special: false };
    chars.forEach(function (ch) {
      if (forbidden(ch)) { if (bad.indexOf(ch) < 0) bad.push(ch); }
      else if (/\p{Uppercase}/u.test(ch)) r.upper = true;
      else if (/\p{Lowercase}/u.test(ch)) r.lower = true;
      else if (/\p{Nd}/u.test(ch)) r.digit = true;
      else r.special = true;
    });
    r.length = chars.length >= MIN;
    r.invalid = bad.length === 0;
    r.long = chars.length <= MAX && new TextEncoder().encode(p).length <= MAX_BYTES;
    r.common = !COMMON.test(p);
    r.bad = bad;
    r.count = chars.length;
    r.ok = REQUIRED.every(function (k) { return r[k]; });
    return r;
  }

  function level(r) {
    if (!r.ok) return 1;
    var l = r.count >= 20 ? 4 : r.count >= 16 ? 3 : 2;
    return r.common ? l : Math.max(2, l - 1);
  }

  function bind(form) {
    var pw = form.querySelector('[data-pw="new"]');
    var helper = form.querySelector('[data-pw-helper]');
    if (!pw || !helper || form.dataset.pwBound) return;
    form.dataset.pwBound = '1';
    var confirm = form.querySelector('[data-pw="confirm"]');
    var meter = helper.querySelector('[data-pw-meter]');
    var levelEl = helper.querySelector('[data-pw-level]');
    var match = helper.querySelector('[data-pw-match]');
    var touched = false, confirmTouched = false;
    // the helper explains the rules, so the browser's own "too short" bubble is not needed
    [pw, confirm].forEach(function (i) { if (i) i.removeAttribute('minlength'); });

    function render() {
      var p = pw.value, r = check(p);
      helper.querySelectorAll('[data-rule]').forEach(function (li) {
        var met = r[li.dataset.rule];
        if (li.hasAttribute('data-only-bad')) {
          li.hidden = met || p === '';
          li.classList.toggle('bad', !met && !li.hasAttribute('data-hint'));
          li.classList.toggle('hint', !met && li.hasAttribute('data-hint'));
          if (li.dataset.rule === 'invalid' && !met) {
            var names = r.bad.map(function (ch) { return /[\s\p{Z}]/u.test(ch) ? li.dataset.space : '„' + ch + '“'; });
            li.textContent = li.dataset.text.replace('{chars}', names.join(', '));
          }
        } else {
          li.classList.toggle('ok', met);
          li.classList.toggle('bad', !met && touched);
        }
      });
      meter.hidden = p === '';
      var l = level(r);
      meter.dataset.level = l;
      levelEl.textContent = levelEl.getAttribute('data-l' + l);

      if (match && confirm) {
        var c = confirm.value;
        // stay quiet while the second field is still being typed and matches so far
        var typing = !confirmTouched && c.length < p.length && p.indexOf(c) === 0;
        match.hidden = c === '' || typing;
        var same = c === p;
        match.textContent = same ? match.dataset.ok : match.dataset.bad;
        match.classList.toggle('ok', same);
        match.classList.toggle('bad', !same);
      }
      return r.ok && (!confirm || confirm.value === p);
    }

    pw.addEventListener('input', render);
    pw.addEventListener('blur', function () { if (pw.value) { touched = true; render(); } });
    if (confirm) {
      confirm.addEventListener('input', render);
      confirm.addEventListener('blur', function () { if (confirm.value) { confirmTouched = true; render(); } });
    }
    form.addEventListener('submit', function (e) {
      touched = true; confirmTouched = true;
      if (!render()) {
        e.preventDefault();
        (check(pw.value).ok && confirm ? confirm : pw).focus();
        helper.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
    render();
  }

  function init() { document.querySelectorAll('form').forEach(bind); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  document.addEventListener('pjax:done', init);
})();
