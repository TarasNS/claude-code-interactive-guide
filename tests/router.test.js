(function () {
  'use strict';
  var T = window.LabTests;
  var parse = window.Lab.router.parse;

  T.test('router parses the four routes', function () {
    T.eq(parse('#/').name, 'landing');
    T.eq(parse('').name, 'landing');
    T.eq(parse('#/map').name, 'map');
    T.eq(parse('#/summary').name, 'summary');
    var m = parse('#/m/context?beat=3');
    T.eq(m.name, 'mission');
    T.eq(m.params.id, 'context');
    T.eq(m.query.beat, '3');
  });

  T.test('router falls back to landing for unknown hashes', function () {
    T.eq(parse('#/m/not-a-mission').name, 'landing');
    T.eq(parse('#/nope').name, 'landing');
    T.eq(parse('#/m/').name, 'landing');
    T.eq(parse('#/m/context/extra').name, 'landing');
  });

  T.test('router survives a malformed query', function () {
    T.eq(parse('#/m/context?beat=%E0%A4%A').name, 'mission');
  });
})();
