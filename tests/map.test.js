(function () {
  'use strict';
  var T = window.LabTests;
  var Lab = window.Lab;
  var graph = Lab.content.mapGraph;

  function memStore() {
    var d = {};
    return Lab.store.create({ storage: { getItem: function (k) { return d[k] || null; }, setItem: function (k, v) { d[k] = v; }, removeItem: function (k) { delete d[k]; } } });
  }

  function mounted(made) {
    document.body.appendChild(made.el);
    return made.el;
  }

  T.test('map: graph has the 13 nodes and 17 edges from spec 10.2, with valid references', function () {
    T.eq(graph.nodes.length, 13);
    T.eq(graph.edges.length, 17);
    var ids = graph.nodes.map(function (n) { return n.id; });
    T.eq(ids.length, new Set(ids).size);
    graph.edges.forEach(function (e) {
      T.ok(ids.indexOf(e.from) >= 0 && ids.indexOf(e.to) >= 0, e.from + '->' + e.to);
      T.ok(e.type === 'solid' || e.type === 'dotted', 'edge type');
    });
    graph.nodes.forEach(function (n) {
      T.ok(Lab.xp.MISSIONS.some(function (m) { return m.id === n.mission; }), n.id + ' mission');
      T.ok(n.whatItIs && n.why && n.when && n.example, n.id + ' panel fields');
    });
  });

  T.test('map: the edge set is recorded as checked against the playbook, with a date and source', function () {
    T.eq(graph.verified, '2026-10-06');
    T.ok(graph.source.indexOf('playbook') >= 0);
  });

  T.test('map: the playbook prerequisites are edges, and the unsupported links are gone', function () {
    function has(a, b) { return graph.edges.some(function (e) { return e.from === a && e.to === b; }); }
    ['intent>spec', 'claude-md>evals', 'feedback-loop>evals', 'claude-md>pr-review', 'skills>pr-review', 'pr-review>ci-cd', 'approval-gates>ci-cd', 'claude-md>subagents'].forEach(function (k) {
      var p = k.split('>');
      T.ok(has(p[0], p[1]), k + ' is a stated prerequisite');
    });
    ['claude-md>feedback-loop', 'feedback-loop>ci-cd', 'feedback-loop>pr-review', 'evals>ci-cd', 'subagents>feedback-loop'].forEach(function (k) {
      var p = k.split('>');
      T.ok(!has(p[0], p[1]), k + ' has no basis in the playbook');
    });
    T.eq(graph.edges.filter(function (e) { return e.to === 'feedback-loop'; }).length, 0, 'the feedback loop has no prerequisites');
  });

  T.test('map: edges are drawn from box edge to box edge', function () {
    var p = Lab.ui.map.anchor({ x: 0, y: 0 }, { x: 200, y: 0 }, 0);
    T.eq(p, { x: 85, y: 0 });
    var q = Lab.ui.map.anchor({ x: 0, y: 0 }, { x: 0, y: 200 }, 0);
    T.eq(q, { x: 0, y: 22 });
  });

  T.test('map: neighbours list outgoing edges first, then incoming', function () {
    T.eq(Lab.ui.map.neighbors('intent', graph.edges), ['spec', 'monitoring']);
    T.eq(Lab.ui.map.neighbors('ci-cd', graph.edges), ['monitoring', 'pr-review', 'approval-gates']);
  });

  T.test('map: panel is readable once a prerequisite node is unlocked', function () {
    var s = memStore();
    var spec = graph.nodes.filter(function (n) { return n.id === 'spec'; })[0];
    var plan = graph.nodes.filter(function (n) { return n.id === 'plan-mode'; })[0];
    var intent = graph.nodes.filter(function (n) { return n.id === 'intent'; })[0];
    T.eq(Lab.ui.map.isReadable(intent, graph, s.getState().missions, false), true);
    T.eq(Lab.ui.map.isReadable(spec, graph, s.getState().missions, false), false);
    s.completeMission('orientation');
    s.completeMission('intent');
    T.eq(Lab.ui.map.isReadable(spec, graph, s.getState().missions, false), true);
    T.eq(Lab.ui.map.isReadable(plan, graph, s.getState().missions, false), false);
    T.eq(Lab.ui.map.isReadable(plan, graph, s.getState().missions, true), true);
  });

  T.test('map: locked nodes show the lock text, and explore unlocks every node', function () {
    var s = memStore();
    var made = Lab.ui.map.create({ store: s });
    var el = mounted(made);
    T.eq(el.querySelectorAll('.map-svg .map-node').length, 13);
    T.eq(el.querySelectorAll('.map-svg .map-node[data-status="locked"]').length, 13);
    T.ok(el.querySelector('.map-svg .map-node[data-status="locked"]').getAttribute('aria-label').indexOf('locked, unlocks after') > 0);
    T.ok(el.querySelector('.map-sub').textContent === 'LOCKED');
    s.setSetting('explore', true);
    made.update();
    T.eq(el.querySelectorAll('.map-svg .map-node[data-status="locked"]').length, 0);
    el.parentNode.removeChild(el);
  });

  T.test('map: selecting a node opens the seven-field panel; solid and dotted edges differ', function () {
    var s = memStore();
    s.setSetting('explore', true);
    var made = Lab.ui.map.create({ store: s });
    var el = mounted(made);
    el.querySelector('.map-svg [data-node="ci-cd"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    var terms = Array.prototype.map.call(el.querySelectorAll('.map-graph .map-fields dt'), function (d) { return d.textContent; });
    T.eq(terms, ['What it is', 'Why it exists', 'When to use it', 'What it depends on', 'What it enables', 'Example', 'Try it']);
    var dd = el.querySelectorAll('.map-graph .map-fields dd');
    T.ok(dd[3].textContent.indexOf('PR review (required)') >= 0 && dd[3].textContent.indexOf('Approval gates (required)') >= 0, 'dependencies are listed as text with their type');
    T.ok(dd[4].textContent.indexOf('Monitoring (required)') >= 0);
    T.ok(el.querySelector('.map-graph .map-fields a').getAttribute('href') === '#/m/pipeline');
    T.ok(el.querySelector('.map-edge-solid'));
    T.ok(el.querySelector('.map-edge-dotted'));
    el.parentNode.removeChild(el);
  });

  T.test('map: arrow keys move focus along connections', function () {
    var s = memStore();
    s.setSetting('explore', true);
    var made = Lab.ui.map.create({ store: s });
    var el = mounted(made);
    el.querySelector('.map-graph').style.setProperty('display', 'block', 'important');
    var intent = el.querySelector('.map-svg [data-node="intent"]');
    intent.focus();
    intent.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    T.eq(document.activeElement.getAttribute('data-node'), 'spec');
    el.querySelector('.map-svg [data-node="spec"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    T.eq(document.activeElement.getAttribute('data-node'), 'intent');
    el.querySelector('.map-svg [data-node="spec"]').focus();
    el.querySelector('.map-svg [data-node="spec"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    T.eq(document.activeElement.getAttribute('data-node'), 'plan-mode');
    el.parentNode.removeChild(el);
  });

  T.test('map: a list fallback carries the same nodes for narrow screens', function () {
    var s = memStore();
    var made = Lab.ui.map.create({ store: s });
    var el = mounted(made);
    T.eq(el.querySelectorAll('.map-list-item').length, 13);
    T.ok(el.querySelector('.map-list-item[data-status="locked"] summary').textContent.indexOf('(locked)') > 0);
    el.parentNode.removeChild(el);
  });
})();
