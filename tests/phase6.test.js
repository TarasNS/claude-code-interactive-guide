(function () {
  'use strict';
  var T = window.LabTests;
  var Lab = window.Lab;
  var P = Lab.ui.pipeline;

  function ctx(extra) {
    var out = { results: [], says: [] };
    var base = {
      coachHints: false,
      say: function (k, t, m) { out.says.push([k, t, m || null]); },
      onResult: function (r) { out.results.push(r); }
    };
    Object.keys(extra || {}).forEach(function (k) { base[k] = extra[k]; });
    out.ctx = base;
    return out;
  }
  function attach(el) { document.body.appendChild(el); return el; }
  function detach(el) { if (el.parentNode) el.parentNode.removeChild(el); }
  function beat(id, component, activityId) {
    return Lab.content.getMission(id).beats.filter(function (b) {
      return b.component === component && (!activityId || (b.activity && b.activity.id === activityId));
    })[0];
  }
  function stagesOf(id) { return Lab.content.getMission(id).beats.filter(function (b) { return b.component === 'pipeline' && b.activity; }); }
  function btn(el, label) {
    return Array.prototype.filter.call(el.querySelectorAll('button'), function (b) { return b.textContent === label; })[0];
  }

  var CFG = {
    outcomes: { approval: 'gate' },
    gate: { stage: 'approval', approver: 'Release manager', summary: ['ok'], approve: 'Approve', reject: 'Reject' },
    stages: [{ id: 'a', label: 'Build' }, { id: 'approval', label: 'Human approval' }, { id: 'c', label: 'Deploy' }, { id: 'd', label: 'Health' }]
  };
  var INC = Object.assign({}, CFG, {
    outcomes: { approval: 'gate', d: 'fail' },
    stages: CFG.stages.concat([{ id: 'e', label: 'Success' }]),
    incident: { stage: 'd', prompt: 'p', rollback: 'Rollback', options: [
      { id: 'wait', label: 'Wait', consequence: 'Bad wait.' },
      { id: 'roll', label: 'Roll back', correct: true, consequence: 'Good.' }
    ] }
  });

  // ---- pure engine -----------------------------------------------------------

  T.test('pipeline engine: start, advance, gate and approve reach done', function () {
    var s = P.start(CFG, P.initial(CFG.stages));
    T.eq(s.stages, { a: 'running', approval: 'waiting', c: 'waiting', d: 'waiting' });
    s = P.advance(CFG, s);
    T.eq(s.stages.a, 'passed');
    T.eq(s.stages.approval, 'running');
    s = P.advance(CFG, s);
    T.eq(s.phase, 'gate');
    T.eq(s.stages.approval, 'approval');
    s = P.decideGate(CFG, s, true);
    T.eq(s.stages, { a: 'passed', approval: 'passed', c: 'running', d: 'waiting' });
    s = P.advance(CFG, s);
    s = P.advance(CFG, s);
    T.eq(s.phase, 'done');
    T.eq(Object.keys(s.stages).every(function (k) { return s.stages[k] === 'passed'; }), true);
  });

  T.test('pipeline engine: rejecting the gate blocks the rest and stops', function () {
    var s = P.start(CFG, P.initial(CFG.stages));
    s = P.advance(CFG, P.advance(CFG, s));
    s = P.decideGate(CFG, s, false);
    T.eq(s.phase, 'stopped');
    T.eq(s.stages, { a: 'passed', approval: 'blocked', c: 'blocked', d: 'blocked' });
  });

  T.test('pipeline engine: demo mode approves its own gate', function () {
    var demo = Object.assign({}, CFG, { mode: 'demo' });
    var s = P.start(demo, P.initial(demo.stages));
    for (var i = 0; i < 4; i++) s = P.advance(demo, s);
    T.eq(s.phase, 'done');
  });

  T.test('pipeline engine: a failed stage blocks what follows; only rolling back completes the incident', function () {
    var s = P.start(INC, P.initial(INC.stages));
    s = P.advance(INC, s);
    s = P.advance(INC, s);
    s = P.decideGate(INC, s, true);
    s = P.advance(INC, s);
    s = P.advance(INC, s);
    T.eq(s.phase, 'incident');
    T.eq(s.stages.d, 'failed');
    T.eq(s.stages.e, 'blocked');
    var wrong = P.resolveIncident(INC, s, 'wait');
    T.eq(wrong.correct, false);
    T.eq(wrong.state.mistakes, 1);
    T.eq(wrong.state.phase, 'incident');
    var right = P.resolveIncident(INC, wrong.state, 'roll');
    T.eq(right.correct, true);
    T.eq(right.state.phase, 'done');
    T.eq(right.state.rolledBack, true);
    T.eq(right.state.stages.d, 'failed');
    T.eq(right.state.stages.e, 'blocked');
  });

  // ---- component -------------------------------------------------------------

  T.test('pipeline component: stage states show icon, text label and border style; gate asks the person', function () {
    var c = ctx({ activity: { id: 'demo.pl', maxXp: 10 }, config: CFG });
    var made = Lab.ui.get('pipeline')(c.ctx);
    var el = attach(made.el);
    T.eq(el.querySelectorAll('.pl-stage[data-state="waiting"]').length, 4);
    btn(el, 'Start the run').click();
    T.ok(el.querySelector('.pl-stage[data-state="running"] .state-label').textContent.indexOf('RUNNING') >= 0);
    btn(el, 'Run to the next decision').click();
    T.ok(el.querySelector('.pl-stage[data-state="approval"] .state-label').textContent.indexOf('APPROVAL REQUIRED') >= 0);
    T.ok(el.querySelector('.pl-approver').textContent.indexOf('Release manager') >= 0);
    T.ok(el.querySelector('.pl-panel h3').textContent.indexOf('Human approval') >= 0);
    T.eq(c.results.length, 0, 'nothing is reported before the decision');
    btn(el, 'Approve').click();
    btn(el, 'Run to the next decision').click();
    T.eq(c.results.length, 1);
    T.eq(c.results[0].correct, true);
    T.eq(el.querySelectorAll('.pl-stage[data-state="passed"]').length, 4);
    detach(el);
  });

  T.test('pipeline component: rejecting stops the run without a result; reset starts over', function () {
    var c = ctx({ activity: { id: 'demo.pl', maxXp: 10 }, config: CFG });
    var made = Lab.ui.get('pipeline')(c.ctx);
    var el = attach(made.el);
    btn(el, 'Start the run').click();
    btn(el, 'Run to the next decision').click();
    btn(el, 'Reject').click();
    T.eq(c.results.length, 0);
    T.ok(el.querySelector('.pl-note').textContent.indexOf('nothing was deployed') >= 0);
    T.eq(el.querySelectorAll('.pl-stage[data-state="blocked"]').length, 3);
    btn(el, 'Reset the run').click();
    T.eq(el.querySelectorAll('.pl-stage[data-state="waiting"]').length, 4);
    detach(el);
  });

  T.test('pipeline component: the incident path reports wrong choices, then completes on rollback', function () {
    var c = ctx({ activity: { id: 'demo.inc', maxXp: 20 }, config: INC });
    var made = Lab.ui.get('pipeline')(c.ctx);
    var el = attach(made.el);
    btn(el, 'Start the run').click();
    btn(el, 'Run to the next decision').click();
    btn(el, 'Approve').click();
    btn(el, 'Run to the next decision').click();
    T.ok(el.querySelector('.pl-stage[data-state="failed"] .state-label').textContent.indexOf('FAILED') >= 0);
    T.eq(el.querySelectorAll('.pl-stage[data-state="blocked"]').length, 1);
    el.querySelector('[data-option="wait"]').click();
    T.eq(c.results[0], { activityId: 'demo.inc', correct: false, mistakes: 1, detail: { chosen: 'wait' } });
    T.eq(c.says[c.says.length - 1][0], 'wrong');
    el.querySelector('[data-option="roll"]').click();
    T.eq(c.results[1].correct, true);
    T.eq(c.results[1].mistakes, 1);
    T.ok(el.querySelector('.pl-stage[data-stage="rollback"][data-state="passed"]'), 'the rollback shows PASSED');
    detach(el);
  });

  T.test('pipeline component: static cards show the given state and label', function () {
    var made = Lab.ui.get('pipeline')({ config: { static: true, stages: [
      { id: 'a', label: 'Dev', state: 'passed', stateLabel: 'ALLOWED' },
      { id: 'b', label: 'Prod', state: 'locked' }
    ] } });
    var el = attach(made.el);
    T.eq(el.querySelectorAll('.pl-stage').length, 2);
    T.eq(el.querySelector('.pl-stage[data-state="passed"] .state-label').textContent.trim(), 'ALLOWED');
    T.eq(el.querySelector('.pl-stage[data-state="locked"] .state-label').textContent.trim(), 'LOCKED');
    T.eq(el.querySelectorAll('button').length, 0);
    detach(el);
  });

  T.test('UX-02: every state is told apart by its icon and its text label alone', function () {
    var names = Object.keys(Lab.ui.STATES);
    T.eq(names.length, 7);
    var labels = names.map(function (n) { return Lab.ui.STATES[n].label; });
    T.eq(new Set(labels).size, 7, 'labels are unique');
    var icons = names.map(function (n) { return Lab.ui.icon(Lab.ui.STATES[n].icon).outerHTML; });
    T.eq(new Set(icons).size, 7, 'icons are unique');
    names.forEach(function (n) {
      var chip = Lab.ui.stateChip(n);
      T.ok(chip.querySelector('svg') && chip.querySelector('.state-label').textContent.trim().length > 0, n + ' has icon and label');
    });
  });

  T.test('UX-02: border styles differ between the states that share an icon-free look', function () {
    var made = Lab.ui.get('pipeline')({ config: { static: true, stages: ['waiting', 'running', 'passed', 'failed', 'blocked', 'approval', 'locked'].map(function (s) { return { id: s, label: s, state: s }; }) } });
    var el = attach(made.el);
    var sig = {};
    Array.prototype.forEach.call(el.querySelectorAll('.pl-stage'), function (n) {
      var cs = getComputedStyle(n);
      sig[n.getAttribute('data-state')] = cs.borderTopStyle + ' ' + cs.borderTopWidth;
    });
    T.eq(sig.waiting.indexOf('dashed'), 0);
    T.eq(sig.locked.indexOf('dotted'), 0);
    T.eq(sig.failed.indexOf('double'), 0);
    T.eq(sig.blocked, 'solid 4px');
    T.ok(sig.passed !== sig.blocked && sig.failed !== sig.blocked && sig.waiting !== sig.locked);
    detach(el);
  });

  // ---- policy grid -----------------------------------------------------------

  var PG = beat('gates', 'policygrid').config;

  T.test('policy grid: production deploys and data changes must be Ask or Deny', function () {
    var full = function (over) {
      var p = {};
      PG.actions.forEach(function (a) { PG.envs.forEach(function (e) { p[a.id + ':' + e.id] = 'allow'; }); });
      Object.keys(over || {}).forEach(function (k) { p[k] = over[k]; });
      return p;
    };
    var ev = Lab.ui.policygrid.evaluate;
    T.eq(ev(PG, full({})).problems.length, 2);
    T.eq(ev(PG, full({ 'deploy:production': 'ask' })).problems.length, 1);
    T.eq(ev(PG, full({ 'deploy:production': 'ask', 'migrate:production': 'deny' })).ok, true);
    T.eq(ev(PG, PG.solution).ok, true);
    var missing = full({ 'deploy:production': 'ask', 'migrate:production': 'ask' });
    delete missing['logs:dev'];
    T.eq(ev(PG, missing).ok, false, 'every cell needs a choice');
    T.ok(ev(PG, full({})).problems[0].reason.length > 20, 'violations explain the risk');
  });

  T.test('policy grid component: check reports problems, then completes', function () {
    var c = ctx({ activity: { id: 'gates.policy', maxXp: 10 }, config: PG });
    var made = Lab.ui.get('policygrid')(c.ctx);
    var el = attach(made.el);
    function set(label, value) {
      var sel = el.querySelector('select[aria-label="' + label + '"]');
      sel.value = value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    PG.actions.forEach(function (a) { PG.envs.forEach(function (e) { set(a.label + ' in ' + e.label, 'allow'); }); });
    btn(el, 'Check my policy').click();
    T.eq(c.results[0].correct, false);
    T.eq(el.querySelectorAll('.bd-problems li').length, 2);
    T.ok(el.querySelector('.pg-flag').textContent.indexOf('Fix this') >= 0, 'flag is text');
    set('Deploy in Production', 'ask');
    set('Run a database migration in Production', 'deny');
    btn(el, 'Check my policy').click();
    T.eq(c.results[1].correct, true);
    T.eq(c.results[1].mistakes, 1);
    detach(el);
  });

  // ---- classifier context and choice intro ---------------------------------

  T.test('classifier: a diff or log block is shown as a labelled figure', function () {
    var c = ctx({ activity: { id: 'd.c', maxXp: 5, buckets: ['A', 'B'], items: [{ id: 'i', text: 't', answer: 'A', explanation: 'x' }] }, config: { diffLabel: 'The diff', diff: '+ a line' } });
    var made = Lab.ui.get('classifier')(c.ctx);
    T.eq(made.el.querySelector('figcaption').textContent, 'The diff');
    T.eq(made.el.querySelector('.cl-context-text').textContent, '+ a line');
  });

  T.test('choice multi: per-question options and an intro list', function () {
    var act = { id: 'd.q', maxXp: 5, items: [
      { id: 'a', text: 'Q1', answer: 'X', explanation: 'x' },
      { id: 'b', text: 'Q2', answer: 'P', options: ['P', 'Q'], explanation: 'y' }
    ] };
    var made = Lab.ui.get('choice')(ctx({ activity: act, config: { options: ['X', 'Y', 'Z'], intro: [{ title: 'T', text: 'Body' }] } }).ctx);
    var el = attach(made.el);
    T.eq(el.querySelectorAll('.choice-set')[0].querySelectorAll('input').length, 3);
    T.eq(el.querySelectorAll('.choice-set')[1].querySelectorAll('input').length, 2);
    T.eq(el.querySelector('.choice-intro dt').textContent, 'T');
    detach(el);
  });

  // ---- missions 10 to 13 -----------------------------------------------------

  T.test('mission 10: three findings with the spec answers; the auth finding is a false positive', function () {
    var items = beat('review', 'classifier', 'review.triage').activity.items;
    T.eq(items.map(function (i) { return i.answer; }), ['Important', 'Nit', 'Not an issue']);
    T.ok(beat('review', 'classifier', 'review.triage').config.diff.indexOf('router.use(requireAuth)') >= 0, 'the reason is visible in the diff context');
    T.eq(beat('review', 'classifier', 'review.who').activity.buckets, ['Mechanical review', 'Human judgment']);
  });

  T.test('mission 11: three environments with the spec labels, and a gate-detection task with one unsafe pipeline', function () {
    var env = beat('gates', 'pipeline').config.stages;
    T.eq(env.map(function (s) { return s.stateLabel; }), ['ALLOWED', 'APPROVAL MAY BE REQUIRED', 'RELEASE APPROVAL REQUIRED']);
    T.eq(env.map(function (s) { return s.state; }), ['passed', 'approval', 'locked']);
    var q = beat('gates', 'choice').activity.items;
    T.eq(q[0].answer, 'Pipeline B');
    T.ok(beat('gates', 'choice').config.intro[1].text.indexOf('broad production credentials') >= 0);
    T.ok(q[1].options.indexOf(q[1].answer) >= 0);
  });

  T.test('mission 12: the nine stages, a fixed incident scenario, and only rollback is correct', function () {
    var m = Lab.content.getMission('pipeline');
    var happy = stagesOf('pipeline')[0];
    var incident = stagesOf('pipeline')[1];
    T.eq(happy.config.stages.map(function (s) { return s.label; }), ['Push', 'Build', 'Tests', 'Evals', 'AI PR review', 'Human approval', 'Deploy', 'Health check', 'Success']);
    T.eq(incident.config.outcomes, { approval: 'gate', health: 'fail' });
    T.eq(incident.config.incident.options.filter(function (o) { return o.correct; }).map(function (o) { return o.id; }), ['rollback']);
    var reminder = m.beats.filter(function (b) { return (b.notes || []).join(' ').indexOf('you do not need any API integration') >= 0; });
    T.eq(reminder.length, 1, 'the Mission 0 reminder reappears');
  });

  T.test('mission 12: the happy path ends in Success only after approval', function () {
    var cfg = stagesOf('pipeline')[0].config;
    var s = P.start(cfg, P.initial(cfg.stages));
    var guard = 0;
    while (s.phase === 'running' && guard++ < 20) s = P.advance(cfg, s);
    T.eq(s.phase, 'gate');
    T.eq(s.stages.success, 'waiting');
    s = P.decideGate(cfg, s, true);
    while (s.phase === 'running' && guard++ < 40) s = P.advance(cfg, s);
    T.eq(s.phase, 'done');
    T.eq(s.stages.success, 'passed');
  });

  T.test('mission 13: the intent has four statements that belong and two to leave out', function () {
    var b = beat('loop', 'classifier', 'loop.intent');
    var items = b.activity.items;
    T.eq(items.filter(function (i) { return i.answer === 'Leave out'; }).length, 2);
    T.eq(items.filter(function (i) { return i.answer !== 'Leave out'; }).map(function (i) { return i.answer; }), ['Problem', 'Outcome', 'Constraint', 'Open Question']);
    T.ok(b.config.diff.indexOf('claude:') >= 0);
    var placed = {};
    items.forEach(function (i) { placed[i.id] = i.answer; });
    var text = Lab.ui.classifier.buildArtifact(b.config.artifact, items, placed);
    T.ok(text.indexOf('## Outcome\n- The status endpoint error rate returns to its baseline.') > 0);
    T.ok(text.indexOf('retry loop') < 0, 'solution detail is left out of the intent');
  });

  T.test('missions 10 to 13: XP splits, and the running total through Mission 12 is 420 at level 10', function () {
    function xps(id) {
      return Lab.content.getMission(id).beats.filter(function (b) { return b.activity && b.type === 'try'; }).map(function (b) { return [b.activity.id, b.activity.maxXp]; });
    }
    T.eq(xps('review'), [['review.triage', 20], ['review.who', 10]]);
    T.eq(xps('gates'), [['gates.policy', 10], ['gates.detect', 20]]);
    T.eq(xps('pipeline'), [['pipeline.happy', 10], ['pipeline.incident', 20]]);
    T.eq(xps('loop'), [['loop.intent', 30]]);
    var total = 0;
    Lab.content.allMissions().filter(function (m) { return m.number <= 12; }).forEach(function (m) { total += m.xp; });
    T.eq(total, 420);
    T.eq(Lab.xp.LEVELS[9].cumulativeXp, 420);
    T.eq(Lab.xp.LEVELS[9].title, 'Release Engineer');
  });
})();
