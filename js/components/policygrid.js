(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var h = Lab.dom.h;
  var mount = Lab.dom.mount;

  // config.actions: [{ id, label }]  config.envs: [{ id, label }]
  // config.rules: [{ action, env, allow: ['ask', 'deny'], reason }]  (cells the learner must not leave too open)
  var CHOICES = [['allow', 'Allow'], ['ask', 'Ask'], ['deny', 'Deny']];

  // Pure: picks is { 'action:env': 'allow' | 'ask' | 'deny' }.
  function evaluate(cfg, picks) {
    var problems = [];
    cfg.actions.forEach(function (a) {
      cfg.envs.forEach(function (e) {
        if (!picks[a.id + ':' + e.id]) problems.push({ cell: a.id + ':' + e.id, reason: 'Choose Allow, Ask or Deny for ' + a.label + ' in ' + e.label + '.' });
      });
    });
    (cfg.rules || []).forEach(function (r) {
      var pick = picks[r.action + ':' + r.env];
      if (pick && r.allow.indexOf(pick) < 0) problems.push({ cell: r.action + ':' + r.env, reason: r.reason });
    });
    return { ok: problems.length === 0, problems: problems };
  }

  function create(ctx) {
    var cfg = ctx.config;
    var activity = ctx.activity;
    var say = ctx.say || Lab.coach.say;
    var state = { picks: {}, mistakes: 0, solved: !!ctx.done, problems: [] };
    if (ctx.initialState) {
      state.picks = Object.assign({}, ctx.initialState.picks || {});
      state.mistakes = ctx.initialState.mistakes | 0;
    }
    if (ctx.done && cfg.solution) state.picks = Object.assign({}, cfg.solution);
    var root = h('div', { class: 'policygrid' });
    var base = Lab.dom.uid('pg');

    function snapshot() { return { picks: state.picks, mistakes: state.mistakes }; }
    function emit() { if (ctx.onState) ctx.onState(snapshot()); }

    function check() {
      if (state.solved) return;
      var res = evaluate(cfg, state.picks);
      if (res.ok) {
        state.solved = true;
        state.problems = [];
        say('correct', cfg.success || 'The policy is safe: the risky actions are gated.');
        emit();
        render();
        ctx.onResult({ activityId: activity.id, correct: true, mistakes: state.mistakes, detail: { picks: state.picks } });
      } else {
        state.mistakes += 1;
        state.problems = res.problems;
        say('wrong', res.problems.length + (res.problems.length === 1 ? ' cell needs attention.' : ' cells need attention.') + ' See the list below.');
        emit();
        render();
        ctx.onResult({ activityId: activity.id, correct: false, mistakes: state.mistakes, detail: { cells: res.problems.map(function (p) { return p.cell; }) } });
      }
    }

    function render() {
      var head = h('tr', null, [h('th', { scope: 'col' }, 'Action')].concat(cfg.envs.map(function (e) { return h('th', { scope: 'col' }, e.label); })));
      var rows = cfg.actions.map(function (a) {
        return h('tr', null, [h('th', { scope: 'row' }, a.label)].concat(cfg.envs.map(function (e) {
          var key = a.id + ':' + e.id;
          var id = base + '-' + a.id + '-' + e.id;
          var bad = state.problems.some(function (p) { return p.cell === key; });
          var sel = h('select', {
            id: id, 'aria-label': a.label + ' in ' + e.label, disabled: state.solved ? 'true' : null,
            'data-bad': bad ? 'true' : null
          }, [h('option', { value: '' }, 'Choose')].concat(CHOICES.map(function (c) {
            var o = h('option', { value: c[0] }, c[1]);
            if (state.picks[key] === c[0]) o.selected = true;
            return o;
          })));
          sel.addEventListener('change', function () {
            if (sel.value) state.picks[key] = sel.value; else delete state.picks[key];
            state.problems = [];
            emit();
          });
          return h('td', { class: 'pg-cell', 'data-bad': bad ? 'true' : null }, sel, bad ? h('span', { class: 'pg-flag' }, ' Fix this') : null);
        })));
      });

      var problems = state.problems.length
        ? h('ul', { class: 'bd-problems', 'aria-label': 'Things to fix' }, state.problems.map(function (p) {
            return h('li', null, Lab.ui.icon('cross'), h('span', null, ' ' + p.reason));
          }))
        : null;

      mount(root, [
        h('p', { class: 'cl-prompt' }, cfg.prompt || 'Choose Allow, Ask or Deny for every cell.'),
        h('div', { class: 'pg-scroll', tabindex: '0', role: 'region', 'aria-label': 'Policy table, scrolls sideways on a narrow screen' },
          h('table', { class: 'pg-table' }, h('caption', { class: 'sr-only' }, 'Policy for each action in each environment'), h('thead', null, head), h('tbody', null, rows))),
        h('button', { type: 'button', class: 'btn btn-primary', 'aria-disabled': state.solved ? 'true' : null, onclick: check }, state.solved ? 'Done' : 'Check my policy'),
        problems
      ]);
    }

    render();
    Lab.coach.setHints(activity.hints || [
      'Reading logs changes nothing, so it can be allowed. Think about what each action could break in production.',
      'In production, deploying and changing data should always need a person: choose Ask or Deny.'
    ], activity.id);
    return { el: root, getState: snapshot };
  }

  Lab.ui.register('policygrid', create);
  Lab.ui.policygrid = { evaluate: evaluate };
})();
