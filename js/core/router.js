(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});

  // Pure: turn a hash into { name, params, query }. Unknown hashes fall back to the landing route.
  function parse(hash) {
    var raw = String(hash || '').replace(/^#/, '');
    var qIndex = raw.indexOf('?');
    var path = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
    var queryText = qIndex >= 0 ? raw.slice(qIndex + 1) : '';
    var query = {};
    queryText.split('&').forEach(function (pair) {
      if (!pair) return;
      var eq = pair.indexOf('=');
      var k = eq >= 0 ? pair.slice(0, eq) : pair;
      var v = eq >= 0 ? pair.slice(eq + 1) : '';
      try { query[decodeURIComponent(k)] = decodeURIComponent(v); } catch (e) { /* ignore malformed pair */ }
    });

    if (path === '' || path === '/') return { name: 'landing', params: {}, query: query };
    if (path === '/map') return { name: 'map', params: {}, query: query };
    if (path === '/summary') return { name: 'summary', params: {}, query: query };
    var m = /^\/m\/([a-z0-9-]+)$/.exec(path);
    if (m) {
      var known = Lab.xp.MISSIONS.some(function (x) { return x.id === m[1]; });
      if (known) return { name: 'mission', params: { id: m[1] }, query: query };
    }
    return { name: 'landing', params: {}, query: {} };
  }

  var handler = null;

  function current() {
    return parse(window.location.hash);
  }

  function go(hash) {
    if (window.location.hash === hash) dispatch();
    else window.location.hash = hash;
  }

  function dispatch() {
    if (handler) handler(current());
  }

  function start(fn) {
    handler = fn;
    window.addEventListener('hashchange', dispatch);
    dispatch();
  }

  Lab.router = { parse: parse, current: current, go: go, start: start };
})();
