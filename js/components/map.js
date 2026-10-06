(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var h = Lab.dom.h;
  var svg = Lab.dom.svg;
  var mount = Lab.dom.mount;

  var HW = 85;
  var HH = 22;

  // ---- pure helpers -------------------------------------------------------

  function anchor(from, to, gap) {
    var dx = to.x - from.x;
    var dy = to.y - from.y;
    var tx = dx === 0 ? Infinity : HW / Math.abs(dx);
    var ty = dy === 0 ? Infinity : HH / Math.abs(dy);
    var t = Math.min(tx, ty);
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var extra = (gap || 0) / len;
    return { x: from.x + (t + extra) * dx, y: from.y + (t + extra) * dy };
  }

  function neighbors(id, edges) {
    var out = [];
    edges.forEach(function (e) {
      if (e.from === id && out.indexOf(e.to) < 0) out.push(e.to);
    });
    edges.forEach(function (e) {
      if (e.to === id && out.indexOf(e.from) < 0) out.push(e.from);
    });
    return out;
  }

  function missionRow(id) {
    return Lab.xp.MISSIONS.filter(function (m) { return m.id === id; })[0];
  }

  function isUnlocked(node, missions, explore) {
    return Lab.unlock.nodeUnlocked(node.mission, { missions: missions }, explore);
  }

  // Prerequisites exclude the edge that closes the loop (monitoring back to intent).
  function prerequisites(id, edges) {
    return edges.filter(function (e) { return e.to === id && !(e.from === 'monitoring' && e.to === 'intent'); })
      .map(function (e) { return e.from; });
  }

  function isReadable(node, graph, missions, explore) {
    if (isUnlocked(node, missions, explore)) return true;
    var pre = prerequisites(node.id, graph.edges);
    if (!pre.length) return true;
    return pre.some(function (pid) {
      var p = graph.nodes.filter(function (n) { return n.id === pid; })[0];
      return p && isUnlocked(p, missions, explore);
    });
  }

  function edgePath(a, b) {
    if (a.x === b.x && Math.abs(a.y - b.y) > 150) {
      var sx = a.x - HW;
      return 'M ' + sx + ' ' + a.y + ' C ' + (sx - 80) + ' ' + a.y + ', ' + (sx - 80) + ' ' + b.y + ', ' + (sx - 4) + ' ' + b.y;
    }
    var p1 = anchor(a, b, 0);
    var p2 = anchor(b, a, 6);
    return 'M ' + Math.round(p1.x) + ' ' + Math.round(p1.y) + ' L ' + Math.round(p2.x) + ' ' + Math.round(p2.y);
  }

  function nodeById(graph, id) {
    return graph.nodes.filter(function (n) { return n.id === id; })[0];
  }

  // ---- component ----------------------------------------------------------

  function create(opts) {
    var st = (opts && opts.store) || Lab.store;
    var root = h('div', { class: 'map' });
    var selected = null;
    var prefix = Lab.dom.uid('map');
    var graph = Lab.content.mapGraph;

    function relatedText(id, dir) {
      var list = graph.edges.filter(function (e) { return dir === 'in' ? e.to === id : e.from === id; });
      if (!list.length) return 'Nothing in this map.';
      return list.map(function (e) {
        var other = nodeById(graph, dir === 'in' ? e.from : e.to);
        return other.label + (e.type === 'solid' ? ' (required)' : ' (helps, not required)');
      }).join('; ');
    }

    function panelFor(node, missions, explore, explain) {
      var row = missionRow(node.mission);
      var unlocked = isUnlocked(node, missions, explore);
      var tryIt = unlocked || Lab.unlock.isMissionUnlocked(node.mission, { missions: missions }, explore)
        ? h('a', { href: '#/m/' + row.id }, 'Open Mission ' + row.n + ': ' + row.title)
        : h('span', null, 'Unlocks after: ' + row.title);
      var fields = [
        ['What it is', node.whatItIs + (explain === 'deeper' ? ' ' + node.whatItIsDeeper : '')],
        ['Why it exists', node.why],
        ['When to use it', node.when],
        ['What it depends on', relatedText(node.id, 'in')],
        ['What it enables', relatedText(node.id, 'out')],
        ['Example', node.example]
      ];
      var dl = [];
      fields.forEach(function (f) { dl.push(h('dt', null, f[0])); dl.push(h('dd', null, f[1])); });
      dl.push(h('dt', null, 'Try it'));
      dl.push(h('dd', null, tryIt));
      return h('section', { class: 'map-panel', 'aria-labelledby': prefix + '-panel-title' },
        h('h2', { id: prefix + '-panel-title' }, node.label),
        unlocked ? null : h('p', { class: 'map-locked' }, Lab.ui.icon('lock'), ' Locked. Unlocks after: ' + row.title),
        h('dl', { class: 'map-fields' }, dl)
      );
    }

    function render() {
      var state = st.getState();
      var missions = state.missions;
      var explore = st.getSettings().explore;
      var explain = st.getSettings().explain;
      var nodes = graph.nodes;

      var edgeEls = graph.edges.map(function (e) {
        var a = nodeById(graph, e.from);
        var b = nodeById(graph, e.to);
        return svg('path', {
          class: 'map-edge map-edge-' + e.type,
          d: edgePath(a, b),
          'data-from': e.from,
          'data-to': e.to,
          fill: 'none',
          'marker-end': 'url(#' + prefix + '-arrow)'
        });
      });

      function highlight(id, on) {
        Array.prototype.forEach.call(root.querySelectorAll('.map-edge'), function (el) {
          var hit = on && (el.getAttribute('data-from') === id || el.getAttribute('data-to') === id);
          if (hit) el.classList.add('map-edge-hl'); else el.classList.remove('map-edge-hl');
        });
      }

      function select(id) {
        selected = selected === id ? null : id;
        render();
        var again = root.querySelector('[data-node="' + id + '"]');
        if (again) again.focus();
      }

      var nodeEls = nodes.map(function (n) {
        var unlocked = isUnlocked(n, missions, explore);
        var row = missionRow(n.mission);
        var kids = [
          svg('rect', { class: 'map-box', x: n.x - HW, y: n.y - HH, width: HW * 2, height: HH * 2, rx: 8 }),
          svg('text', { class: 'map-label', x: n.x, y: n.y + (unlocked ? 5 : 1), 'text-anchor': 'middle' }, n.label)
        ];
        if (!unlocked) {
          kids.push(svg('text', { class: 'map-sub', x: n.x, y: n.y + 16, 'text-anchor': 'middle' }, 'LOCKED'));
          kids.push(svg('rect', { class: 'map-lock', x: n.x - HW + 8, y: n.y - 4, width: 10, height: 8, rx: 1 }));
          kids.push(svg('path', { class: 'map-lock', d: 'M ' + (n.x - HW + 10) + ' ' + (n.y - 4) + ' v -3 a 3 3 0 0 1 6 0 v 3', fill: 'none' }));
        }
        var g = svg('g', {
          class: 'map-node' + (selected === n.id ? ' map-selected' : ''),
          'data-node': n.id,
          'data-status': unlocked ? 'unlocked' : 'locked',
          tabindex: '0',
          role: 'button',
          'aria-pressed': selected === n.id ? 'true' : 'false',
          'aria-label': n.label + ', ' + (unlocked ? 'unlocked' : 'locked, unlocks after ' + row.title)
        }, kids);
        g.addEventListener('click', function () { select(n.id); });
        g.addEventListener('mouseenter', function () { highlight(n.id, true); });
        g.addEventListener('mouseleave', function () { highlight(n.id, false); });
        g.addEventListener('focus', function () { highlight(n.id, true); });
        g.addEventListener('blur', function () { highlight(n.id, false); });
        g.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(n.id); return; }
          var step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0);
          if (!step) return;
          e.preventDefault();
          var list = neighbors(n.id, graph.edges);
          if (!list.length) return;
          var cur = root.getAttribute('data-nav-' + n.id);
          var idx = cur === null ? (step > 0 ? 0 : list.length - 1) : (parseInt(cur, 10) + step + list.length) % list.length;
          root.setAttribute('data-nav-' + n.id, String(idx));
          var target = root.querySelector('.map-svg [data-node="' + list[idx] + '"]');
          if (target) target.focus();
        });
        return g;
      });

      var defs = svg('defs', null, svg('marker', { id: prefix + '-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 8, markerHeight: 8, orient: 'auto' }, svg('path', { class: 'map-arrow', d: 'M 0 0 L 10 5 L 0 10 z' })));
      var picture = svg('svg', { class: 'map-svg', viewBox: '-70 0 940 440', role: 'group', 'aria-label': 'Dependency map. Use Tab to move between nodes and arrow keys to follow connections.' },
        [defs].concat(edgeEls).concat(nodeEls));

      var legend = h('ul', { class: 'map-legend' },
        h('li', null, svg('svg', { class: 'map-key', viewBox: '0 0 40 10', width: 40, height: 10, 'aria-hidden': 'true' }, svg('line', { class: 'map-edge map-edge-solid', x1: 2, y1: 5, x2: 38, y2: 5 })), ' Solid line: required'),
        h('li', null, svg('svg', { class: 'map-key', viewBox: '0 0 40 10', width: 40, height: 10, 'aria-hidden': 'true' }, svg('line', { class: 'map-edge map-edge-dotted', x1: 2, y1: 5, x2: 38, y2: 5 })), ' Dotted line: helps, not required'),
        h('li', null, Lab.ui.icon('lock'), ' Dotted box: locked until its mission is complete')
      );

      var list = h('ul', { class: 'map-list' }, nodes.map(function (n) {
        var unlocked = isUnlocked(n, missions, explore);
        var row = missionRow(n.mission);
        var readable = isReadable(n, graph, missions, explore);
        var body = readable
          ? panelFor(n, missions, explore, explain)
          : h('p', null, 'Unlocks after: ' + row.title);
        return h('li', { class: 'map-list-item', 'data-status': unlocked ? 'unlocked' : 'locked' },
          h('details', null,
            h('summary', null, unlocked ? null : Lab.ui.icon('lock'), ' ' + n.label + (unlocked ? '' : ' (locked)')),
            body));
      }));

      var sel = selected ? nodeById(graph, selected) : null;
      var panel = null;
      if (sel) {
        panel = isReadable(sel, graph, missions, explore)
          ? panelFor(sel, missions, explore, explain)
          : h('section', { class: 'map-panel' }, h('h2', null, sel.label), h('p', { class: 'map-locked' }, Lab.ui.icon('lock'), ' Locked. Unlocks after: ' + missionRow(sel.mission).title));
      }

      mount(root, [
        h('div', { class: 'map-graph' }, picture, legend, panel || h('p', { class: 'map-hint' }, 'Select a node to see what it is, why it exists and what it connects to.')),
        h('div', { class: 'map-listbox' }, h('p', null, 'Each item shows the same details as the diagram.'), list)
      ]);
    }

    render();
    return { el: root, update: render };
  }

  Lab.ui.map = { create: create, anchor: anchor, neighbors: neighbors, isReadable: isReadable, prerequisites: prerequisites, edgePath: edgePath };
})();
