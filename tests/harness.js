(function () {
  'use strict';
  var T = (window.LabTests = { cases: [], results: [] });

  T.test = function (name, fn) { T.cases.push({ name: name, fn: fn }); };

  T.eq = function (actual, expected, label) {
    var a = JSON.stringify(actual);
    var e = JSON.stringify(expected);
    if (a !== e) throw new Error((label || 'eq') + ': expected ' + e + ' but got ' + a);
  };

  T.ok = function (cond, label) {
    if (!cond) throw new Error(label || 'expected truthy');
  };

  T.run = function () {
    T.cases.forEach(function (c) {
      try {
        c.fn();
        T.results.push({ name: c.name, pass: true });
      } catch (e) {
        T.results.push({ name: c.name, pass: false, error: String(e && e.message ? e.message : e) });
      }
    });
    return T.results;
  };
})();
