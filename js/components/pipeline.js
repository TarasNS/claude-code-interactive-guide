(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var h = Lab.dom.h;
  var mount = Lab.dom.mount;

  // config.stages: [{ id, label, detail, state?, stateLabel? }]
  //   With `static: true` the stages are shown with their given state and no controls.
  // config.outcomes: { stageId: 'pass' | 'gate' | 'fail' }  (default pass; the scenario is fixed data)
  // config.gate: { stage, approver, summary: [lines], approve, reject }
  // config.incident: { stage, prompt, options: [{ id, label, correct, consequence }], rollback }
  // config.mode: 'run' (default) | 'demo' (the gate approves itself and nothing is graded)

  // ---- pure engine ---------------------------------------------------------

  function initial(stages) {
    var map = {};
    stages.forEach(function (s) { map[s.id] = 'waiting'; });
    return { stages: map, index: -1, phase: 'idle', mistakes: 0, rolledBack: false, note: null };
  }

  function outcomeOf(cfg, id) {
    return (cfg.outcomes && cfg.outcomes[id]) || 'pass';
  }

  function blockRest(state, stages, from) {
    for (var i = from; i < stages.length; i++) {
      if (state.stages[stages[i].id] === 'waiting') state.stages[stages[i].id] = 'blocked';
    }
  }

  // Begin: the first stage starts running.
  function start(cfg, state) {
    var next = JSON.parse(JSON.stringify(initial(cfg.stages)));
    next.stages[cfg.stages[0].id] = 'running';
    next.index = 0;
    next.phase = 'running';
    return next;
  }

  // Finish the stage that is running and move on. Returns a new state.
  function advance(cfg, state) {
    var s = JSON.parse(JSON.stringify(state));
    if (s.phase !== 'running') return s;
    var stage = cfg.stages[s.index];
    var out = outcomeOf(cfg, stage.id);
    if (out === 'gate') {
      if (cfg.mode === 'demo') {
        s.stages[stage.id] = 'passed';
      } else {
        s.stages[stage.id] = 'approval';
        s.phase = 'gate';
        return s;
      }
    } else if (out === 'fail') {
      s.stages[stage.id] = 'failed';
      blockRest(s, cfg.stages, s.index + 1);
      s.phase = cfg.incident ? 'incident' : 'stopped';
      return s;
    } else {
      s.stages[stage.id] = 'passed';
    }
    return moveOn(cfg, s);
  }

  function moveOn(cfg, s) {
    if (s.index >= cfg.stages.length - 1) { s.phase = 'done'; return s; }
    s.index += 1;
    s.stages[cfg.stages[s.index].id] = 'running';
    s.phase = 'running';
    return s;
  }

  function decideGate(cfg, state, approve) {
    var s = JSON.parse(JSON.stringify(state));
    if (s.phase !== 'gate') return s;
    var stage = cfg.stages[s.index];
    if (approve) {
      s.stages[stage.id] = 'passed';
      return moveOn(cfg, s);
    }
    s.stages[stage.id] = 'blocked';
    blockRest(s, cfg.stages, s.index + 1);
    s.phase = 'stopped';
    s.note = 'The release was rejected, so nothing was deployed.';
    return s;
  }

  function resolveIncident(cfg, state, optionId) {
    var s = JSON.parse(JSON.stringify(state));
    var opt = cfg.incident.options.filter(function (o) { return o.id === optionId; })[0];
    if (!opt) return { state: s, correct: false, option: null };
    if (opt.correct) {
      s.rolledBack = true;
      s.phase = 'done';
    } else {
      s.mistakes += 1;
    }
    return { state: s, correct: !!opt.correct, option: opt };
  }

  // ---- component -----------------------------------------------------------

  function create(ctx) {
    var cfg = ctx.config;
    var activity = ctx.activity || null;
    var say = ctx.say || Lab.coach.say;
    var state = ctx.initialState && ctx.initialState.stages ? JSON.parse(JSON.stringify(ctx.initialState)) : initial(cfg.stages);
    var root = h('div', { class: 'pipeline' });
    var reported = false;

    if (ctx.done && !cfg.static) {
      cfg.stages.forEach(function (s) { state.stages[s.id] = 'passed'; });
      if (cfg.incident) {
        var inc = cfg.incident.stage;
        var seen = false;
        cfg.stages.forEach(function (s) {
          if (s.id === inc) { state.stages[s.id] = 'failed'; seen = true; }
          else if (seen) state.stages[s.id] = 'blocked';
        });
        state.rolledBack = true;
      }
      state.phase = 'done';
      reported = true;
    }

    function emit() { if (ctx.onState) ctx.onState(JSON.parse(JSON.stringify(state))); }
    function labelOf(id) { return cfg.stages.filter(function (s) { return s.id === id; })[0].label; }

    function report(correct, detail) {
      if (!activity) return;
      ctx.onResult({ activityId: activity.id, correct: correct, mistakes: state.mistakes, detail: detail || {} });
    }

    function afterChange(prev) {
      emit();
      render();
      var changed = cfg.stages.filter(function (s) { return prev.stages[s.id] !== state.stages[s.id]; });
      var spoken = changed.map(function (s) {
        var def = Lab.ui.STATES[state.stages[s.id]];
        return s.label + ': ' + (def ? def.label : state.stages[s.id]);
      });
      if (spoken.length) say('info', spoken.join('. ') + '.');
      if (state.phase === 'done' && !reported && cfg.mode !== 'demo' && !cfg.incident) {
        reported = true;
        report(true, { stages: state.stages });
      }
    }

    function begin() { var prev = state; state = start(cfg, state); afterChange(prev); focusMain(); }
    function next() { var prev = state; state = advance(cfg, state); afterChange(prev); focusMain(); }
    function runToDecision() {
      var prev = state;
      var guard = 0;
      while (state.phase === 'running' && guard++ < 50) state = advance(cfg, state);
      afterChange(prev);
      focusMain();
    }
    function decide(approve) { var prev = state; state = decideGate(cfg, state, approve); afterChange(prev); focusMain(); }
    function reset() { var prev = state; state = initial(cfg.stages); reported = false; afterChange(prev); focusMain(); }

    function choose(optionId) {
      var res = resolveIncident(cfg, state, optionId);
      state = res.state;
      emit();
      render();
      if (res.correct) {
        say('correct', res.option.consequence);
        reported = true;
        report(true, { stages: state.stages, chosen: optionId });
      } else {
        say('wrong', res.option.consequence);
        report(false, { chosen: optionId });
      }
      focusMain();
    }

    function focusMain() {
      var b = root.querySelector('.pl-controls button:not([aria-disabled="true"])');
      if (b) b.focus();
    }

    function stageCard(s) {
      var st = state.stages[s.id] || 'waiting';
      var custom = s.stateLabel || null;
      return h('li', { class: 'pl-stage', 'data-state': st, 'data-stage': s.id },
        h('span', { class: 'pl-name' }, s.label),
        Lab.ui.stateChip(st, custom),
        s.detail ? h('span', { class: 'pl-detail' }, s.detail) : null,
        st === 'approval' && cfg.gate ? h('span', { class: 'pl-approver' }, 'Approver: ' + cfg.gate.approver) : null);
    }

    function render() {
      var list;
      if (cfg.static) {
        list = h('ol', { class: 'pl-list pl-static', 'aria-label': cfg.label || 'Stages' }, cfg.stages.map(function (s) {
          var st = s.state || 'waiting';
          return h('li', { class: 'pl-stage', 'data-state': st },
            h('span', { class: 'pl-name' }, s.label),
            Lab.ui.stateChip(st, s.stateLabel),
            s.detail ? h('span', { class: 'pl-detail' }, s.detail) : null);
        }));
        mount(root, list);
        return;
      }

      var extra = [];
      if (state.rolledBack) {
        extra.push(h('li', { class: 'pl-stage', 'data-state': 'passed', 'data-stage': 'rollback' },
          h('span', { class: 'pl-name' }, (cfg.incident && cfg.incident.rollback) || 'Rollback'),
          Lab.ui.stateChip('passed')));
      }
      list = h('ol', { class: 'pl-list', 'aria-label': cfg.label || 'Pipeline stages' }, cfg.stages.map(stageCard).concat(extra));

      var controls = [];
      if (state.phase === 'idle') {
        controls.push(h('button', { type: 'button', class: 'btn btn-primary', onclick: begin }, cfg.startLabel || 'Start the run'));
      } else if (state.phase === 'running') {
        controls.push(h('button', { type: 'button', class: 'btn btn-primary', onclick: next }, 'Next stage'));
        controls.push(h('button', { type: 'button', class: 'btn', onclick: runToDecision }, 'Run to the next decision'));
      } else if (state.phase === 'stopped') {
        controls.push(h('button', { type: 'button', class: 'btn', onclick: reset }, 'Reset the run'));
      } else if (state.phase === 'done' && cfg.mode === 'demo') {
        controls.push(h('button', { type: 'button', class: 'btn', onclick: reset }, 'Run again'));
      }

      var panel = null;
      if (state.phase === 'gate' && cfg.gate) {
        panel = h('section', { class: 'pl-panel', 'aria-labelledby': 'pl-gate-title' },
          h('h3', { id: 'pl-gate-title' }, 'Human approval: ' + labelOf(cfg.gate.stage)),
          h('ul', null, cfg.gate.summary.map(function (l) { return h('li', null, l); })),
          h('div', { class: 'pl-controls' },
            h('button', { type: 'button', class: 'btn btn-primary', onclick: function () { decide(true); } }, cfg.gate.approve || 'Approve'),
            h('button', { type: 'button', class: 'btn', onclick: function () { decide(false); } }, cfg.gate.reject || 'Reject')));
      } else if (state.phase === 'incident' && cfg.incident) {
        panel = h('section', { class: 'pl-panel', 'aria-labelledby': 'pl-inc-title' },
          h('h3', { id: 'pl-inc-title' }, cfg.incident.title || 'The health check failed'),
          h('p', null, cfg.incident.prompt),
          h('div', { class: 'pl-controls' }, cfg.incident.options.map(function (o) {
            return h('button', { type: 'button', class: 'btn', 'data-option': o.id, onclick: function () { choose(o.id); } }, o.label);
          })));
      }

      mount(root, [
        list,
        state.note ? h('p', { class: 'pl-note' }, state.note) : null,
        panel,
        h('div', { class: 'pl-controls' }, controls)
      ]);
    }

    render();
    if (activity) {
      Lab.coach.setHints(activity.hints || ['Step through the stages and read each state label. A stage that needs a person will stop and ask.'], activity.id);
    }
    return { el: root, getState: function () { return JSON.parse(JSON.stringify(state)); } };
  }

  Lab.ui.register('pipeline', create);
  Lab.ui.pipeline = { initial: initial, start: start, advance: advance, decideGate: decideGate, resolveIncident: resolveIncident };
})();
