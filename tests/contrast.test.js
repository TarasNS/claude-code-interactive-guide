(function () {
  'use strict';
  var T = window.LabTests;

  function parseColor(text) {
    var m = /^rgba?\(([^)]+)\)$/.exec(text);
    if (m) {
      var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
      return [p[0], p[1], p[2]];
    }
    m = /^color\(srgb ([^)]+)\)$/.exec(text);
    if (m) {
      var q = m[1].split(/[\s\/]+/).filter(Boolean).map(Number);
      return [q[0] * 255, q[1] * 255, q[2] * 255];
    }
    throw new Error('cannot parse colour: ' + text);
  }

  function channel(c) {
    var s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }

  function luminance(rgb) {
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
  }

  function ratio(a, b) {
    var la = luminance(a);
    var lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  function resolve(token, prop) {
    var el = document.createElement('div');
    el.style.setProperty(prop, 'var(' + token + ')');
    document.body.appendChild(el);
    var value = getComputedStyle(el).getPropertyValue(prop);
    document.body.removeChild(el);
    return parseColor(value);
  }

  function color(token) { return resolve(token, 'color'); }
  function bg(token) { return resolve(token, 'background-color'); }

  function check(theme) {
    var root = document.documentElement;
    var previous = root.getAttribute('data-theme');
    root.setAttribute('data-theme', theme);
    try {
      var failures = [];
      function need(label, a, b, min) {
        var r = ratio(a, b);
        if (r < min) failures.push(label + ' ' + r.toFixed(2) + ' < ' + min);
      }
      var surfaces = ['--bg', '--surface-1', '--surface-2', '--code-bg'];
      surfaces.forEach(function (s) {
        need('text on ' + s, color('--text'), bg(s), 4.5);
        need('border on ' + s, color('--border'), bg(s), 3);
        need('focus on ' + s, color('--focus'), bg(s), 3);
      });
      need('text on fill', color('--text-on-fill'), bg('--fill-primary'), 4.5);
      need('text on fill hover', color('--text-on-fill'), bg('--fill-primary-hover'), 4.5);
      need('fill border on bg', color('--ns-white'), bg('--bg'), 1);
      return failures;
    } finally {
      if (previous === null) root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', previous);
    }
  }

  T.test('contrast: light theme tokens meet UX-06', function () {
    T.eq(check('light'), []);
  });

  T.test('contrast: dark theme tokens meet UX-06', function () {
    T.eq(check('dark'), []);
  });

  T.test('contrast: approved pairings match the spec table', function () {
    var white = [255, 255, 255], black = [28, 28, 28], off = [244, 242, 235], green = [26, 92, 0];
    T.ok(Math.abs(ratio(white, black) - 17.04) < 0.05, 'white on almost black');
    T.ok(Math.abs(ratio(black, off) - 15.21) < 0.05, 'almost black on off white');
    T.ok(Math.abs(ratio(white, green) - 8.16) < 0.05, 'white on green');
    T.ok(Math.abs(ratio(green, off) - 7.28) < 0.05, 'green on off white');
    T.ok(ratio(green, black) < 3, 'green on almost black must stay a known failure');
  });

  T.test('contrast: focus colour is never Nordic Green on dark surfaces', function () {
    var root = document.documentElement;
    root.setAttribute('data-theme', 'dark');
    var focus = color('--focus');
    root.removeAttribute('data-theme');
    T.ok(focus[0] > 200 && focus[1] > 200 && focus[2] > 200, 'dark focus is white');
  });
})();
