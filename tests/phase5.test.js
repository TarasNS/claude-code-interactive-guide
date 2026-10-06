(function () {
  'use strict';
  var T = window.LabTests;
  var Lab = window.Lab;

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

  // ---- choice (multi-question) --------------------------------------------

  var QS = { id: 'demo.q', maxXp: 40, items: [
    { id: 'q1', text: 'Task one', answer: 'B', explanation: 'One because.' },
    { id: 'q2', text: 'Task two', answer: 'A', explanation: 'Two because.' }
  ] };

  T.test('choice multi: wrong answers count, completion needs every question right', function () {
    var c = ctx({ activity: QS, config: { options: ['A', 'B'] } });
    var made = Lab.ui.get('choice')(c.ctx);
    var el = attach(made.el);
    function pick(q, opt) {
      var set = el.querySelectorAll('.choice-set')[q];
      Array.prototype.filter.call(set.querySelectorAll('input'), function (i) { return i.value === opt; })[0].click();
    }
    pick(0, 'A');
    T.eq(c.results[0], { activityId: 'demo.q', correct: false, mistakes: 1, detail: { itemId: 'q1', option: 'A' } });
    T.eq(c.says[0][0], 'wrong');
    T.ok(document.activeElement && document.activeElement.value === 'A', 'focus stays on the answered option');
    pick(0, 'B');
    T.eq(document.activeElement.name.indexOf('-q2') > 0, true, 'focus moves to the next open question');
    T.eq(c.results.length, 1, 'no completion yet');
    pick(1, 'A');
    T.eq(c.results[c.results.length - 1], { activityId: 'demo.q', correct: true, mistakes: 1, detail: { done: { q1: 'B', q2: 'A' } } });
    T.ok(el.querySelector('.choice-status').textContent.length > 0, 'status shown as text');
    detach(el);
  });

  T.test('choice multi: a done activity shows everything answered', function () {
    var c = ctx({ activity: QS, config: { options: ['A', 'B'] }, done: true });
    var made = Lab.ui.get('choice')(c.ctx);
    var el = attach(made.el);
    T.eq(el.querySelectorAll('.choice-card[data-state="correct"]').length, 2);
    detach(el);
  });

  // ---- builder extensions --------------------------------------------------

  T.test('builder: a one-choice slot replaces the previous pick', function () {
    var act = { id: 'd.b', maxXp: 5, items: [
      { id: 'a', text: 'Alpha', answer: 'one', explanation: 'x' },
      { id: 'b', text: 'Beta', answer: 'none', explanation: 'y' }
    ] };
    var c = ctx({ activity: act, config: { slots: [{ id: 'one', label: 'One', max: 1 }] } });
    var made = Lab.ui.get('builder')(c.ctx);
    var el = attach(made.el);
    el.querySelector('[data-pick="b"]').click();
    el.querySelector('[data-slot="one"] .cl-place').click();
    el.querySelector('[data-pick="a"]').click();
    el.querySelector('[data-slot="one"] .cl-place').click();
    T.eq(el.querySelectorAll('[data-slot="one"] .cl-placed-item').length, 1);
    T.ok(el.querySelector('[data-pick="b"]'), 'the replaced item is back in the palette');
    detach(el);
  });

  T.test('builder: last rule and ordered numbering', function () {
    var act = { id: 'd.o', maxXp: 5, items: [
      { id: 'x', text: 'First', answer: 'loop', explanation: 'x' },
      { id: 'y', text: 'Last', answer: 'loop', explanation: 'y' }
    ] };
    var cfg = { slots: [{ id: 'loop', label: 'Loop', ordered: true }], rules: [{ type: 'last', a: 'y', reason: 'Last must be last.' }] };
    T.eq(Lab.ui.builder.evaluate(act, cfg, { x: 'loop', y: 'loop' }, ['y', 'x']).problems[0].reason, 'Last must be last.');
    T.eq(Lab.ui.builder.evaluate(act, cfg, { x: 'loop', y: 'loop' }, ['x', 'y']).ok, true);
    var made = Lab.ui.get('builder')(ctx({ activity: act, config: cfg }).ctx);
    var el = attach(made.el);
    el.querySelector('[data-pick="x"]').click();
    el.querySelector('[data-slot="loop"] .cl-place').click();
    T.eq(el.querySelector('ol.cl-placed li').textContent.indexOf('1. First'), 0);
    detach(el);
  });

  // ---- evalgate ------------------------------------------------------------

  var GATE = { id: 'd.g', maxXp: 20 };
  var GATE_CFG = { changes: [
    { id: 'bad', title: 'Bad change', detail: 'd', verdict: 'reject', explanation: 'Reject because.', results: [{ task: 't1', outcome: 'pass' }, { task: 't2', outcome: 'regression', note: 'n' }] },
    { id: 'good', title: 'Good change', detail: 'd', verdict: 'merge', explanation: 'Merge because.', results: [{ task: 't1', outcome: 'pass' }] }
  ] };

  T.test('evalgate: deciding before running the suite is refused; wrong verdicts are mistakes', function () {
    var c = ctx({ activity: GATE, config: GATE_CFG });
    var made = Lab.ui.get('evalgate')(c.ctx);
    var el = attach(made.el);
    function button(card, label) {
      return Array.prototype.filter.call(el.querySelectorAll('.eg-card')[card].querySelectorAll('button'), function (b) { return b.textContent.indexOf(label) === 0; })[0];
    }
    button(0, 'Merge').click();
    T.eq(c.results.length, 0);
    T.ok(c.says[c.says.length - 1][1].indexOf('Run the eval suite') === 0);
    button(0, 'Run eval suite').click();
    T.ok(el.querySelector('tr[data-outcome="regression"] strong').textContent.indexOf('REGRESSION') >= 0, 'regression is text, not colour');
    button(0, 'Merge').click();
    T.eq(c.results[0].correct, false);
    T.eq(c.results[0].mistakes, 1);
    button(0, 'Reject').click();
    T.eq(c.results.length, 1, 'completion waits for every change');
    button(1, 'Run eval suite').click();
    button(1, 'Merge').click();
    T.eq(c.results[c.results.length - 1].correct, true);
    T.eq(c.results[c.results.length - 1].mistakes, 1);
    detach(el);
  });

  // ---- Mission 6: Hooks ----------------------------------------------------

  T.test('mission 6: only when=API edit, action=PII checker, outcome=deny passes', function () {
    var b = beat('hooks', 'builder');
    var act = b.activity;
    T.eq(b.config.slots.length, 3);
    var good = { w1: 'when', a1: 'action', o1: 'outcome' };
    T.eq(Lab.ui.builder.evaluate(act, b.config, good, ['w1', 'a1', 'o1']).ok, true);
    ['w2', 'w3', 'a2', 'a3', 'o2', 'o3'].forEach(function (wrongId) {
      var slot = { w: 'when', a: 'action', o: 'outcome' }[wrongId.charAt(0)];
      var combo = {};
      Object.keys(good).forEach(function (k) { if (k.charAt(0) !== wrongId.charAt(0)) combo[k] = good[k]; });
      combo[wrongId] = slot;
      var res = Lab.ui.builder.evaluate(act, b.config, combo, Object.keys(combo));
      T.eq(res.ok, false, wrongId + ' must fail');
      T.ok(res.problems.some(function (p) { return p.reason.length > 10; }), wrongId + ' shows its consequence');
    });
  });

  T.test('mission 6: three rules, only the must-always-hold one is a Hook', function () {
    var items = beat('hooks', 'classifier', 'hooks.choose').activity.items;
    T.eq(items.length, 3);
    T.eq(items.filter(function (i) { return i.answer.indexOf('Hook') === 0; }).length, 1);
  });

  // ---- Mission 7: Agents ---------------------------------------------------

  T.test('mission 7: five tasks with the spec answers', function () {
    var items = beat('agents', 'choice').activity.items;
    T.eq(items.map(function (i) { return i.answer; }), ['One agent', 'Subagent', 'Parallel session', 'Subagent', 'Parallel session']);
    T.eq(beat('agents', 'choice').config.options, ['One agent', 'Subagent', 'Parallel session']);
  });

  // ---- Mission 8: Feedback loop -------------------------------------------

  T.test('mission 8: the feedback loop builder accepts only a valid order and rejects Done!', function () {
    var b = beat('feedback', 'builder');
    var all = {};
    b.activity.items.forEach(function (i) { if (i.answer !== 'none') all[i.id] = 'loop'; });
    var good = ['code', 'test1', 'inspect', 'fix', 'test2', 'build', 'review'];
    T.eq(Lab.ui.builder.evaluate(b.activity, b.config, all, good).ok, true);
    T.eq(Lab.ui.builder.evaluate(b.activity, b.config, all, ['test1', 'code', 'inspect', 'fix', 'test2', 'build', 'review']).ok, false);
    T.eq(Lab.ui.builder.evaluate(b.activity, b.config, all, ['code', 'test1', 'fix', 'inspect', 'test2', 'build', 'review']).ok, false);
    T.eq(Lab.ui.builder.evaluate(b.activity, b.config, all, ['code', 'test1', 'inspect', 'fix', 'build', 'test2', 'review']).ok, false);
    T.eq(Lab.ui.builder.evaluate(b.activity, b.config, all, ['review', 'code', 'test1', 'inspect', 'fix', 'test2', 'build']).ok, false);
    var withDone = Object.assign({ done: 'loop' }, all);
    var res = Lab.ui.builder.evaluate(b.activity, b.config, withDone, ['done'].concat(good));
    T.eq(res.ok, false);
    T.ok(res.problems.some(function (p) { return p.reason.indexOf('Without a check') === 0; }));
    var missingSecond = Object.assign({}, all);
    delete missingSecond.test2;
    T.eq(Lab.ui.builder.evaluate(b.activity, b.config, missingSecond, ['code', 'test1', 'inspect', 'fix', 'build', 'review']).ok, false, 'a second test run is required');
  });

  T.test('mission 8: XP is awarded only after both the test and the build pass', function () {
    var b = beat('feedback', 'terminal');
    var c = ctx({ activity: b.activity, config: b.config });
    var made = Lab.ui.get('terminal')(c.ctx);
    var el = attach(made.el);
    function type(text) {
      el.querySelector('input').value = text;
      el.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
    type('RUN TEST');
    T.ok(el.querySelector('.term-log').textContent.indexOf('received property: expected_date') >= 0, 'the test fails first');
    type('RUN BUILD');
    T.eq(c.results.length, 0, 'a passing build alone is not enough');
    type('Let Claude inspect');
    type('Apply fix');
    T.ok(el.querySelector('.term-log').textContent.indexOf('+  return { status, nextStep, expectedDate') >= 0, 'a visible diff');
    type('RUN TEST');
    T.ok(el.querySelector('.term-log').textContent.indexOf('PASS') >= 0);
    T.eq(c.results.length, 0, 'the build must run after the tests pass');
    type('RUN BUILD');
    T.eq(c.results.length, 1, 'both verifications have now passed');
    T.eq(c.results[0].correct, true);
    detach(el);
  });

  T.test('mission 8: build-first, then fix without re-testing, does not complete it', function () {
    var b = beat('feedback', 'terminal');
    var c = ctx({ activity: b.activity, config: b.config });
    var made = Lab.ui.get('terminal')(c.ctx);
    var el = attach(made.el);
    function type(text) {
      el.querySelector('input').value = text;
      el.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
    ['RUN BUILD', 'Apply fix', 'RUN BUILD'].forEach(type);
    T.eq(c.results.length, 0);
    detach(el);
  });

  // ---- Mission 9: Evals ----------------------------------------------------

  T.test('mission 9: results come from the fixed scenario table', function () {
    var changes = beat('evals', 'evalgate').config.changes;
    T.eq(changes.map(function (c) { return c.verdict; }), ['reject', 'merge', 'merge']);
    var shorten = changes[0];
    T.eq(shorten.results.length, 6);
    T.eq(Lab.ui.evalgate.summary(shorten.results), { total: 6, regressions: 2 });
    T.ok(shorten.results.filter(function (r) { return r.outcome === 'regression'; }).every(function (r) { return r.note.indexOf('personal data') >= 0; }));
    T.eq(Lab.ui.evalgate.summary(changes[1].results).regressions, 0);
    T.eq(Lab.ui.evalgate.summary(changes[2].results).regressions, 0);
  });

  T.test('missions 6 to 9: XP splits and the running total reaches 330 at level 8', function () {
    function xps(id) {
      return Lab.content.getMission(id).beats.filter(function (b) { return b.activity && b.type === 'try'; }).map(function (b) { return [b.activity.id, b.activity.maxXp]; });
    }
    T.eq(xps('hooks'), [['hooks.build', 20], ['hooks.choose', 10]]);
    T.eq(xps('agents'), [['agents.choose', 40]]);
    T.eq(xps('feedback'), [['feedback.arrange', 15], ['feedback.run', 15]]);
    T.eq(xps('evals'), [['evals.classify', 10], ['evals.gate', 20]]);
    var total = 0;
    Lab.content.allMissions().filter(function (m) { return m.number <= 9; }).forEach(function (m) { total += m.xp; });
    T.eq(total, 330);
    T.eq(Lab.xp.LEVELS[7].cumulativeXp, 330);
    T.eq(Lab.xp.LEVELS[7].title, 'Eval Engineer');
  });

  T.test('missions 6 to 9: Claude lines are always labelled Simulated', function () {
    Lab.content.allMissions().forEach(function (m) {
      m.beats.forEach(function (b, i) {
        var text = JSON.stringify(b.config || {});
        if (text.indexOf('"who":"claude"') >= 0 || (b.component === 'compare' && /"text":"claude:/.test(text))) {
          T.eq(b.simulated, true, m.id + ' beat ' + i + ' must be simulated');
        }
      });
    });
  });
})();
