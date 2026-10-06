(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var h = Lab.dom.h;
  var mount = Lab.dom.mount;

  // config: { legend, views: [{ id, label, heading, lines: [{ id, text, mono, traces: [lineId] }] }] }
  function linkedIds(views, sel) {
    if (!sel) return {};
    var out = {};
    views.forEach(function (v) {
      v.lines.forEach(function (l) {
        if (v.id === sel.view) return;
        var forward = views.filter(function (x) { return x.id === sel.view; })[0]
          .lines.filter(function (x) { return x.id === sel.line; })[0];
        var targets = (forward && forward.traces) || [];
        var backward = (l.traces || []).indexOf(sel.line) >= 0;
        if (targets.indexOf(l.id) >= 0 || backward) out[l.id] = true;
      });
    });
    return out;
  }

  function create(ctx) {
    var cfg = ctx.config || {};
    var views = cfg.views || [];
    var name = Lab.dom.uid('compare');
    var state = { view: views.length ? views[0].id : null, sel: null };
    if (ctx.initialState) {
      if (ctx.initialState.view) state.view = ctx.initialState.view;
      state.sel = ctx.initialState.sel || null;
    }
    var root = h('div', { class: 'compare' });

    function emit() { if (ctx.onState) ctx.onState({ view: state.view, sel: state.sel }); }

    function render() {
      var current = views.filter(function (v) { return v.id === state.view; })[0] || views[0];
      var links = linkedIds(views, state.sel);
      var linkedAny = views.some(function (v) { return v.lines.some(function (l) { return l.traces && l.traces.length; }); });

      var radios = h('fieldset', { class: 'compare-switch' },
        h('legend', { class: 'sr-only' }, cfg.legend || 'View'),
        views.map(function (v) {
          return h('span', { class: 'compare-opt' },
            h('input', {
              type: 'radio', name: name, id: name + '-' + v.id, value: v.id,
              checked: v.id === current.id,
              onchange: function () { state.view = v.id; emit(); render(); focusRadio(v.id); }
            }),
            h('label', { for: name + '-' + v.id }, v.label)
          );
        })
      );

      var lines = h('ul', { class: 'compare-lines' }, current.lines.map(function (l) {
        var isSel = state.sel && state.sel.view === current.id && state.sel.line === l.id;
        var isLinked = !!links[l.id];
        var clickable = linkedAny && l.traces && l.traces.length;
        var content = [
          h(l.mono ? 'code' : 'span', null, l.text),
          isSel ? h('span', { class: 'compare-tag' }, ' Selected') : null,
          isLinked ? h('span', { class: 'compare-tag' }, ' Linked') : null
        ];
        var node = linkedAny
          ? h('button', {
              type: 'button',
              class: 'compare-line',
              'aria-pressed': isSel ? 'true' : 'false',
              'data-linked': isLinked ? 'true' : null,
              onclick: function () {
                state.sel = isSel ? null : { view: current.id, line: l.id };
                emit();
                render();
              }
            }, content)
          : h('span', { class: 'compare-line', 'data-linked': isLinked ? 'true' : null }, content);
        return h('li', { 'data-clickable': clickable ? 'true' : null }, node);
      }));

      var hint = linkedAny
        ? h('p', { class: 'compare-hint' }, 'Select a line to see which line in the other view it connects to.')
        : null;

      mount(root, [radios, h('h3', { class: 'compare-heading' }, current.heading || current.label), lines, hint]);
    }

    function focusRadio(id) {
      var r = root.querySelector('#' + name + '-' + id);
      if (r) r.focus();
    }

    render();
    return { el: root, getState: function () { return { view: state.view, sel: state.sel }; } };
  }

  Lab.ui.register('compare', create);
  Lab.ui.compare = { linkedIds: linkedIds };
})();
