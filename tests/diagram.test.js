(function () {
  'use strict';
  var T = window.LabTests;
  var Lab = window.Lab;

  function memStore() {
    var d = {};
    return Lab.store.create({ storage: { getItem: function (k) { return d[k] || null; }, setItem: function (k, v) { d[k] = v; }, removeItem: function (k) { delete d[k]; } } });
  }

  function completeThrough(s, n) {
    Lab.xp.MISSIONS.forEach(function (m) { if (m.n <= n) s.completeMission(m.id); });
  }

  function mounted(made) {
    document.body.appendChild(made.el);
    return made.el;
  }

  T.test('diagram: nodes unlock as missions complete', function () {
    var nodes = Lab.content.systemNodes;
    function ids(missions, explore) {
      return Lab.ui.diagram.visibleNodes(nodes, missions, explore).filter(function (s) { return s.status === 'unlocked'; }).map(function (s) { return s.node.id; });
    }
    T.eq(ids({}, false), ['start']);
    var s = memStore();
    s.completeMission('orientation');
    s.completeMission('intent');
    T.eq(ids(s.getState().missions, false), ['start', 'intent-md']);
    completeThrough(s, 14);
    T.eq(ids(s.getState().missions, false).length, nodes.length);
  });

  T.test('diagram: explore shows later nodes as previews, never as unlocked', function () {
    var s = memStore();
    var shown = Lab.ui.diagram.visibleNodes(Lab.content.systemNodes, s.getState().missions, true);
    T.eq(shown.length, Lab.content.systemNodes.length);
    T.eq(shown.filter(function (x) { return x.status === 'unlocked'; }).length, 1);
    T.ok(shown.slice(1).every(function (x) { return x.status === 'preview'; }));
  });

  T.test('diagram: system nodes match spec section 12 and reference real missions', function () {
    var nodes = Lab.content.systemNodes;
    T.eq(nodes.length, 14);
    T.eq(nodes.filter(function (n) { return n.human; }).map(function (n) { return n.id; }),
      ['intent-md', 'spec-md', 'plan-md', 'hooks', 'tests', 'evals', 'pr-review', 'gates', 'production']);
    nodes.forEach(function (n) {
      T.ok(n.after >= -1 && n.after <= 14, n.id + ' after');
      T.ok(n.simple && n.deeper && n.label, n.id + ' text');
      if (n.human) T.ok(n.decides, n.id + ' decides');
    });
  });

  T.test('diagram: decision text wraps into lines that fit the box', function () {
    Lab.content.systemNodes.filter(function (n) { return n.human; }).forEach(function (n) {
      var lines = Lab.ui.diagram.wrap('You decide: ' + n.decides, 27);
      T.ok(lines.length <= 2, n.id + ' wraps to ' + lines.length + ' lines');
      lines.forEach(function (l) { T.ok(l.length <= 30, n.id + ' line too long: ' + l); });
    });
  });

  T.test('diagram: layout, loop closing and text alternative', function () {
    T.eq(Lab.ui.diagram.layout(3).ys.length, 3);
    T.eq(Lab.ui.diagram.loopClosed({}), false);
    var s = memStore();
    completeThrough(s, 14);
    T.eq(Lab.ui.diagram.loopClosed(s.getState().missions), true);
    var shown = Lab.ui.diagram.visibleNodes(Lab.content.systemNodes, s.getState().missions, false);
    var alt = Lab.ui.diagram.textAlternative(shown, true);
    T.eq(alt.length, shown.length + 1);
    T.ok(alt[0].indexOf('connects to intent.md') > 0);
    T.ok(alt[alt.length - 1].indexOf('loop closes') >= 0);
  });

  T.test('diagram: renders focusable nodes, a text version, and the humans toggle adds text labels', function () {
    var s = memStore();
    completeThrough(s, 2);
    var made = Lab.ui.diagram.create({ store: s });
    var el = mounted(made);
    var nodes = el.querySelectorAll('.sys-node');
    T.eq(nodes.length, 3);
    T.ok(Array.prototype.every.call(nodes, function (n) { return n.getAttribute('tabindex') === '0'; }));
    T.ok(el.querySelector('.sys-alt ol li'), 'text alternative present');
    T.eq(el.querySelectorAll('circle.sys-person').length, 0);
    el.querySelector('.sys-toggle').click();
    T.eq(el.querySelectorAll('circle.sys-person').length, 2);
    T.ok(el.querySelector('.sys-human').textContent.indexOf('You decide:') === 0);
    el.querySelector('.sys-toggle').click();
    T.eq(el.querySelectorAll('circle.sys-person').length, 0);
    el.removeChild && el.parentNode.removeChild(el);
  });

  T.test('diagram: selecting a node shows its definition; updates follow the store', function () {
    var s = memStore();
    var made = Lab.ui.diagram.create({ store: s });
    var el = mounted(made);
    T.eq(el.querySelectorAll('.sys-node').length, 1);
    el.querySelector('.sys-node').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    T.ok(el.querySelector('.sys-def'), 'definition shown');
    completeThrough(s, 1);
    made.update();
    T.eq(el.querySelectorAll('.sys-node').length, 2);
    el.parentNode.removeChild(el);
  });
})();
