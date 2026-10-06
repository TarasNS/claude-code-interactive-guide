(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var h = Lab.dom.h;
  var mount = Lab.dom.mount;

  // config.changes: [{ id, title, detail, verdict: 'merge' | 'reject', explanation,
  //                    results: [{ task, outcome: 'pass' | 'regression', note }] }]
  // The results table is fixed scenario data, shown only after the learner runs the suite.

  function summary(results) {
    var bad = results.filter(function (r) { return r.outcome !== 'pass'; });
    return { total: results.length, regressions: bad.length };
  }

  function create(ctx) {
    var activity = ctx.activity;
    var changes = ctx.config.changes;
    var say = ctx.say || Lab.coach.say;
    var state = { ran: {}, decided: {}, mistakes: 0 };
    if (ctx.initialState) {
      state.ran = Object.assign({}, ctx.initialState.ran || {});
      state.decided = Object.assign({}, ctx.initialState.decided || {});
      state.mistakes = ctx.initialState.mistakes | 0;
    }
    if (ctx.done) changes.forEach(function (c) { state.ran[c.id] = true; state.decided[c.id] = c.verdict; });

    var root = h('div', { class: 'evalgate' });
    function snapshot() { return { ran: state.ran, decided: state.decided, mistakes: state.mistakes }; }
    function emit() { if (ctx.onState) ctx.onState(snapshot()); }

    function run(c) {
      state.ran[c.id] = true;
      var s = summary(c.results);
      emit();
      render();
      say('info', s.regressions
        ? c.title + ': REGRESSION on ' + s.regressions + ' of ' + s.total + ' tasks.'
        : c.title + ': all ' + s.total + ' tasks pass.');
      var again = root.querySelector('[data-decide="' + c.id + '"]');
      if (again) again.focus();
    }

    function decide(c, verdict) {
      if (state.decided[c.id]) return;
      if (!state.ran[c.id]) {
        say('info', 'Run the eval suite for this change before you decide.');
        return;
      }
      if (verdict === c.verdict) {
        state.decided[c.id] = verdict;
        say('correct', c.explanation);
        emit();
        render();
        if (changes.every(function (x) { return state.decided[x.id]; })) {
          ctx.onResult({ activityId: activity.id, correct: true, mistakes: state.mistakes, detail: { decided: state.decided } });
        }
      } else {
        state.mistakes += 1;
        say('wrong', c.explanation);
        emit();
        render();
        ctx.onResult({ activityId: activity.id, correct: false, mistakes: state.mistakes, detail: { changeId: c.id, verdict: verdict } });
      }
    }

    function render() {
      var cards = changes.map(function (c) {
        var ran = !!state.ran[c.id];
        var decided = state.decided[c.id];
        var table = ran
          ? h('table', { class: 'eg-table' },
              h('caption', null, 'Eval results (illustrative scenario data)'),
              h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Task'), h('th', { scope: 'col' }, 'Result'), h('th', { scope: 'col' }, 'Note'))),
              h('tbody', null, c.results.map(function (r) {
                var pass = r.outcome === 'pass';
                return h('tr', { 'data-outcome': pass ? 'pass' : 'regression' },
                  h('td', null, r.task),
                  h('td', null, Lab.ui.icon(pass ? 'check' : 'cross'), h('strong', null, ' ' + (pass ? 'PASSED' : 'REGRESSION'))),
                  h('td', null, r.note || ''));
              })))
          : null;
        return h('section', { class: 'eg-card', 'data-decided': decided ? 'true' : null },
          h('h3', null, c.title),
          h('p', null, c.detail),
          h('div', { class: 'eg-actions' },
            h('button', { type: 'button', class: 'btn', 'aria-disabled': ran ? 'true' : null, onclick: function () { if (!ran) run(c); } }, ran ? 'Eval suite has run' : 'Run eval suite'),
            h('button', { type: 'button', class: 'btn', 'data-decide': c.id, 'aria-disabled': decided ? 'true' : null, onclick: function () { decide(c, 'merge'); } }, 'Merge'),
            h('button', { type: 'button', class: 'btn', 'aria-disabled': decided ? 'true' : null, onclick: function () { decide(c, 'reject'); } }, 'Reject'),
            decided ? h('strong', { class: 'eg-decision' }, Lab.ui.icon('check'), ' Decision: ' + (decided === 'merge' ? 'merged' : 'rejected')) : null),
          table);
      });
      mount(root, cards);
    }

    render();
    Lab.coach.setHints(activity.hints || [
      'Run the eval suite first. A change that makes any check fail should not be merged.',
      'Look for the word REGRESSION in the results.'
    ], activity.id);
    return { el: root, getState: snapshot };
  }

  Lab.ui.register('evalgate', create);
  Lab.ui.evalgate = { summary: summary };
})();
