(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var h = Lab.dom.h;
  var svg = Lab.dom.svg;
  var mount = Lab.dom.mount;

  var NODE_W = 240;
  var NODE_H = 66;
  var PITCH = 78;
  var TOP = 14;
  var LEFT = 14;
  var VIEW_W = 290;

  // ---- pure helpers -------------------------------------------------------

  function missionDone(n, missions) {
    if (n < 0) return true;
    var row = Lab.xp.MISSIONS[n];
    return !!(row && missions[row.id] && missions[row.id].complete);
  }

  // Returns the nodes to draw, in order, each with status 'unlocked' or 'preview'.
  function visibleNodes(nodes, missions, explore) {
    var out = [];
    nodes.forEach(function (n) {
      if (missionDone(n.after, missions)) out.push({ node: n, status: 'unlocked' });
      else if (explore) out.push({ node: n, status: 'preview' });
    });
    return out;
  }

  function wrap(text, max) {
    var lines = [];
    var cur = '';
    text.split(' ').forEach(function (w) {
      if (cur && (cur + ' ' + w).length > max) { lines.push(cur); cur = w; }
      else cur = cur ? cur + ' ' + w : w;
    });
    if (cur) lines.push(cur);
    return lines;
  }

  function layout(count) {
    var ys = [];
    for (var i = 0; i < count; i++) ys.push(TOP + i * PITCH);
    return { ys: ys, height: TOP * 2 + Math.max(0, count) * PITCH };
  }

  function loopClosed(missions) {
    return missionDone(14, missions);
  }

  function textAlternative(shown, closed) {
    var items = [];
    var unlocked = shown.filter(function (s) { return s.status === 'unlocked'; });
    unlocked.forEach(function (s, i) {
      var next = unlocked[i + 1];
      var text = s.node.label + (s.node.human ? ' (a person decides: ' + s.node.decides + ')' : '');
      if (next) text += ', connects to ' + next.node.label;
      items.push(text);
    });
    if (closed && unlocked.length) items.push('The loop closes: ' + unlocked[unlocked.length - 1].node.label + ' connects back to ' + unlocked[0].node.label);
    return items;
  }

  // ---- component ----------------------------------------------------------

  function create(opts) {
    var st = (opts && opts.store) || Lab.store;
    var previous = {};
    var root = h('div', { class: 'sys' });
    var selected = null;
    var showHumans = !!(opts && opts.showHumans);
    var prefix = Lab.dom.uid('sys');

    function render() {
      var state = st.getState();
      var explore = st.getSettings().explore;
      var explain = st.getSettings().explain;
      var nodes = Lab.content.systemNodes;
      var shown = visibleNodes(nodes, state.missions, explore);
      var lay = layout(shown.length);
      var closed = loopClosed(state.missions);
      var fresh = {};

      var parts = [];
      for (var i = 0; i < shown.length - 1; i++) {
        var x = LEFT + NODE_W / 2;
        var preview = shown[i + 1].status === 'preview';
        parts.push(svg('line', {
          class: 'sys-edge' + (preview ? ' sys-edge-preview' : ''),
          x1: x, y1: lay.ys[i] + NODE_H, x2: x, y2: lay.ys[i + 1],
          'marker-end': 'url(#' + prefix + '-arrow)'
        }));
      }
      if (closed && shown.length > 1) {
        var lx = LEFT + NODE_W + 14;
        var yTop = lay.ys[0] + NODE_H / 2;
        var yBot = lay.ys[shown.length - 1] + NODE_H / 2;
        parts.push(svg('path', {
          class: 'sys-edge sys-edge-loop',
          d: 'M ' + (LEFT + NODE_W) + ' ' + yBot + ' H ' + lx + ' V ' + yTop + ' H ' + (LEFT + NODE_W + 2),
          'marker-end': 'url(#' + prefix + '-arrow)'
        }));
      }

      shown.forEach(function (s, idx) {
        var n = s.node;
        var y = lay.ys[idx];
        var isNew = s.status === 'unlocked' && !previous[n.id] && n.after >= 0 && Object.keys(previous).length > 0;
        if (s.status === 'unlocked') fresh[n.id] = true;
        var lines = [
          svg('rect', { class: 'sys-box', x: LEFT, y: y, width: NODE_W, height: NODE_H, rx: 8 }),
          svg('text', { class: 'sys-label', x: LEFT + 12, y: y + (showHumans && n.human ? 22 : 40) }, n.label + (s.status === 'preview' ? ' (preview)' : ''))
        ];
        if (showHumans && n.human) {
          wrap('You decide: ' + n.decides, 27).forEach(function (line, li) {
            lines.push(svg('text', { class: 'sys-human', x: LEFT + 34, y: y + 42 + li * 16 }, line));
          });
          lines.push(svg('circle', { class: 'sys-person', cx: LEFT + 20, cy: y + 38, r: 4 }));
          lines.push(svg('path', { class: 'sys-person', d: 'M ' + (LEFT + 12) + ' ' + (y + 50) + ' a 8 8 0 0 1 16 0' }));
        }
        var g = svg('g', {
          class: 'sys-node' + (isNew ? ' sys-new' : '') + (selected === n.id ? ' sys-selected' : ''),
          'data-status': s.status,
          'data-node': n.id,
          tabindex: '0',
          role: 'button',
          'aria-pressed': selected === n.id ? 'true' : 'false',
          'aria-label': n.label + (s.status === 'preview' ? ', preview, not yet unlocked' : '') + (n.human ? ', a person decides: ' + n.decides : '')
        }, lines);
        function pick() { selected = selected === n.id ? null : n.id; render(); var again = root.querySelector('[data-node="' + n.id + '"]'); if (again) again.focus(); }
        g.addEventListener('click', pick);
        g.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
        });
        parts.push(g);
      });

      previous = fresh;

      var defs = svg('defs', null, svg('marker', { id: prefix + '-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 8, markerHeight: 8, orient: 'auto-start-reverse' }, svg('path', { class: 'sys-arrow', d: 'M 0 0 L 10 5 L 0 10 z' })));
      var picture = svg('svg', {
        class: 'sys-svg', viewBox: '0 0 ' + VIEW_W + ' ' + lay.height, width: VIEW_W, height: lay.height,
        role: 'group', 'aria-label': 'Your System diagram'
      }, [defs].concat(parts));

      var latest = null;
      shown.forEach(function (s) { if (s.status === 'unlocked' && s.node.after >= 0) latest = s.node; });
      var caption = latest
        ? h('p', { class: 'sys-caption' }, h('strong', null, 'Latest: '), latest.label + '. ' + latest.simple)
        : h('p', { class: 'sys-caption' }, 'Complete missions to add parts to your system.');

      var sel = shown.filter(function (s) { return s.node.id === selected; })[0];
      var def = sel
        ? h('div', { class: 'sys-def' },
            h('h3', null, sel.node.label),
            h('p', null, sel.node.simple + (explain === 'deeper' ? ' ' + sel.node.deeper : '')),
            sel.node.human ? h('p', null, h('strong', null, 'A person decides: '), sel.node.decides) : null)
        : null;

      var toggle = h('button', {
        type: 'button', class: 'btn sys-toggle', 'aria-pressed': showHumans ? 'true' : 'false',
        onclick: function () { showHumans = !showHumans; render(); var b = root.querySelector('.sys-toggle'); if (b) b.focus(); }
      }, 'Show where humans decide');

      var alt = h('details', { class: 'sys-alt' },
        h('summary', null, 'Text version of the diagram'),
        h('ol', null, textAlternative(shown, closed).map(function (t) { return h('li', null, t); }))
      );

      mount(root, [toggle, picture, caption, def, closed ? h('p', { class: 'sys-caption' }, Lab.content.systemLoopCaption) : null, alt]);
    }

    render();
    return { el: root, update: render };
  }

  Lab.ui.diagram = { create: create, visibleNodes: visibleNodes, layout: layout, wrap: wrap, textAlternative: textAlternative, loopClosed: loopClosed };
})();
