(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var h = Lab.dom.h;
  var mount = Lab.dom.mount;

  var SPEEDS = { slow: 2400, normal: 1500, fast: 800 };

  // Pure: which node ids are revealed at a step index (steps reveal cumulatively).
  function revealedAt(steps, index) {
    var out = {};
    for (var i = 0; i <= index && i < steps.length; i++) {
      (steps[i].reveal || []).forEach(function (id) { out[id] = true; });
    }
    return out;
  }

  // config: { nodes: [{ id, label, detail }], steps: [{ caption, reveal: [id], active: id }] }
  function create(ctx) {
    var cfg = ctx.config || {};
    var nodes = cfg.nodes || [];
    var steps = cfg.steps || [];
    var say = ctx.say || Lab.coach.say;
    var reduced = Lab.a11y.prefersReducedMotion(Lab.store.getSettings().reducedMotion);
    var state = { index: 0, playing: false, speed: 'normal' };
    var timer = null;
    if (ctx.initialState) state.index = Math.min(steps.length - 1, Math.max(0, ctx.initialState.index | 0));

    var root = h('div', { class: 'stepper' });

    function emit() { if (ctx.onState) ctx.onState({ index: state.index }); }

    function stop() {
      state.playing = false;
      if (timer) { window.clearTimeout(timer); timer = null; }
    }

    function announce() {
      if (steps[state.index]) say('info', steps[state.index].caption);
    }

    function go(index, speak) {
      state.index = Math.max(0, Math.min(steps.length - 1, index));
      emit();
      render();
      if (speak) announce();
    }

    function tick() {
      if (!state.playing) return;
      if (state.index >= steps.length - 1) { stop(); render(); return; }
      go(state.index + 1, true);
      timer = window.setTimeout(tick, SPEEDS[state.speed]);
    }

    function play() {
      if (reduced || !steps.length) return;
      if (state.index >= steps.length - 1) state.index = 0;
      state.playing = true;
      render();
      timer = window.setTimeout(tick, SPEEDS[state.speed]);
    }

    function render() {
      var shown = revealedAt(steps, state.index);
      var active = steps[state.index] && steps[state.index].active;
      var shownNodes = nodes.filter(function (n) { return shown[n.id]; });

      function flowFor(list, label) {
        return h('ol', { class: 'flow', 'aria-label': label || cfg.label || 'Flow' },
          list.map(function (n, i) {
            var visible = !!shown[n.id];
            return h('li', {
              class: 'flow-node',
              hidden: visible ? null : 'true',
              'data-active': active === n.id ? 'true' : null
            },
              h('span', { class: 'flow-label' }, n.label),
              n.detail ? h('span', { class: 'flow-detail' }, n.detail) : null,
              active === n.id ? h('span', { class: 'flow-now' }, ' Now') : null,
              i < list.length - 1 ? Lab.ui.icon('arrow') : null
            );
          })
        );
      }
      var flow;
      if (cfg.paths && cfg.paths.length) {
        flow = h('div', { class: 'flow-paths' }, cfg.paths.map(function (p) {
          var list = nodes.filter(function (n) { return n.path === p.id; });
          return h('section', { class: 'flow-path', 'aria-label': p.label },
            h('h3', { class: 'flow-path-title' }, p.label), flowFor(list, p.label));
        }));
      } else {
        flow = flowFor(nodes);
      }

      var meter = null;
      var m = steps[state.index] && steps[state.index].meter;
      if (m) {
        var fill = h('div', { class: 'meter-fill' });
        fill.style.width = Math.max(0, Math.min(100, m.value)) + '%';
        meter = h('div', { class: 'meter' },
          h('span', { class: 'meter-label' }, (cfg.meterLabel || 'Context used') + ': ' + m.label),
          h('div', { class: 'meter-bar', role: 'meter', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': m.value, 'aria-label': cfg.meterLabel || 'Context used' }, fill));
      }

      var caption = steps[state.index]
        ? h('p', { class: 'stepper-caption' }, h('strong', null, 'Step ' + (state.index + 1) + ' of ' + steps.length + ': '), steps[state.index].caption)
        : null;

      var controls = [];
      if (!reduced) {
        controls.push(state.playing
          ? h('button', { type: 'button', class: 'btn', onclick: function () { stop(); render(); focusBtn('pause'); } }, 'Pause')
          : h('button', { type: 'button', class: 'btn', onclick: function () { play(); focusBtn('pause'); } }, 'Play'));
      }
      controls.push(h('button', {
        type: 'button', class: 'btn',
        'aria-disabled': state.index >= steps.length - 1 ? 'true' : null,
        onclick: function () { stop(); if (state.index < steps.length - 1) { go(state.index + 1, true); } focusBtn('step'); }
      }, 'Step'));
      controls.push(h('button', { type: 'button', class: 'btn', onclick: function () { stop(); go(0, true); } }, 'Reset'));
      if (!reduced) {
        var sel = h('select', { id: 'stepper-speed-' + root.id }, ['slow', 'normal', 'fast'].map(function (s) {
          var o = h('option', { value: s }, s.charAt(0).toUpperCase() + s.slice(1));
          if (s === state.speed) o.selected = true;
          return o;
        }));
        sel.addEventListener('change', function () { state.speed = sel.value; });
        controls.push(h('label', { class: 'stepper-speed' }, 'Speed ', sel));
      }

      var mark = shownNodes.length;
      mount(root, [flow, meter, caption, h('div', { class: 'stepper-controls', 'data-revealed': mark }, controls)]);
    }

    function focusBtn() {
      var b = root.querySelector('.stepper-controls button');
      if (b) b.focus();
    }

    root.id = Lab.dom.uid('stepper');
    render();
    if (steps.length) announce();

    return {
      el: root,
      getState: function () { return { index: state.index }; },
      destroy: stop
    };
  }

  Lab.ui.register('stepper', create);
  Lab.ui.stepper = { revealedAt: revealedAt };
})();
