(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var svg = Lab.dom.svg;
  Lab.ui = Lab.ui || {};

  var base = { viewBox: '0 0 24 24', width: 20, height: 20, fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false', class: 'icon' };

  var shapes = {
    circle: function () { return [svg('circle', { cx: 12, cy: 12, r: 9, 'stroke-dasharray': '3 3' })]; },
    available: function () { return [svg('circle', { cx: 12, cy: 12, r: 9 })]; },
    progress: function () { return [svg('circle', { cx: 12, cy: 12, r: 9 }), svg('path', { d: 'M12 12V3a9 9 0 0 1 9 9z', fill: 'currentColor' })]; },
    check: function () { return [svg('path', { d: 'M4 12l5 5L20 6' })]; },
    cross: function () { return [svg('path', { d: 'M6 6l12 12M18 6L6 18' })]; },
    lock: function () { return [svg('rect', { x: 5, y: 11, width: 14, height: 9, rx: 2 }), svg('path', { d: 'M8 11V8a4 4 0 0 1 8 0v3' })]; },
    arrow: function () { return [svg('path', { d: 'M5 12h14M13 6l6 6-6 6' })]; },
    person: function () { return [svg('circle', { cx: 12, cy: 8, r: 4 }), svg('path', { d: 'M4 21a8 8 0 0 1 16 0' })]; },
    blocked: function () { return [svg('circle', { cx: 12, cy: 12, r: 9 }), svg('path', { d: 'M7 12h10' })]; },
    hint: function () { return [svg('circle', { cx: 12, cy: 12, r: 9 }), svg('path', { d: 'M12 11v6M12 7.5v.5' })]; }
  };

  Lab.ui.icon = function (name) {
    var parts = (shapes[name] || shapes.circle)();
    return svg.apply(null, ['svg', base].concat(parts));
  };

  // Shared state vocabulary (spec 14.5): every state has an icon, a text label and a border style.
  var STATES = {
    waiting: { icon: 'circle', label: 'WAITING' },
    running: { icon: 'progress', label: 'RUNNING' },
    passed: { icon: 'check', label: 'PASSED' },
    failed: { icon: 'cross', label: 'FAILED' },
    blocked: { icon: 'blocked', label: 'BLOCKED' },
    approval: { icon: 'person', label: 'APPROVAL REQUIRED' },
    locked: { icon: 'lock', label: 'LOCKED' }
  };
  Lab.ui.STATES = STATES;
  Lab.ui.stateChip = function (state, labelOverride) {
    var def = STATES[state] || STATES.waiting;
    return Lab.dom.h('span', { class: 'state-chip', 'data-state': state },
      Lab.ui.icon(def.icon), Lab.dom.h('span', { class: 'state-label' }, ' ' + (labelOverride || def.label)));
  };

  var registry = {};
  Lab.ui.register = function (name, factory) { registry[name] = factory; };
  Lab.ui.get = function (name) { return registry[name] || null; };
})();
