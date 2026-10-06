(function () {
  'use strict';
  var T = window.LabTests;
  var Lab = window.Lab;

  var ACTIVITY = {
    id: 'demo.sort',
    maxXp: 20,
    buckets: ['A', 'B'],
    items: [
      { id: 'one', text: 'First', answer: 'A', explanation: 'First is A.' },
      { id: 'two', text: 'Second', answer: 'B', acceptable: ['A'], explanation: 'Second is B or A.', note: 'Nuance.' }
    ]
  };

  function ctx(extra) {
    var out = { results: [], says: [], states: [] };
    var base = {
      activity: ACTIVITY,
      config: {},
      done: false,
      coachHints: false,
      say: function (kind, text, more) { out.says.push([kind, text, more || null]); },
      onResult: function (r) { out.results.push(r); },
      onState: function (s) { out.states.push(s); }
    };
    Object.keys(extra || {}).forEach(function (k) { base[k] = extra[k]; });
    out.ctx = base;
    return out;
  }

  function attach(el) {
    document.body.appendChild(el);
    return el;
  }
  function detach(el) { if (el.parentNode) el.parentNode.removeChild(el); }

  function card(el, id) { return el.querySelector('[data-card="' + id + '"]'); }
  function bucketButton(el, name) {
    return Array.prototype.filter.call(el.querySelectorAll('.cl-place'), function (b) {
      return b.getAttribute('aria-label') === 'Place selected card in ' + name;
    })[0];
  }

  T.test('classifier: wrong placement counts a mistake, explains, and keeps the card in the pool', function () {
    var c = ctx();
    var made = Lab.ui.get('classifier')(c.ctx);
    card(made.el, 'one').click();
    bucketButton(made.el, 'B').click();
    T.eq(c.results.length, 1);
    T.eq(c.results[0].correct, false);
    T.eq(c.results[0].mistakes, 1);
    T.eq(c.says[0][0], 'wrong');
    T.ok(card(made.el, 'one'), 'card is still in the pool');
    T.ok(made.el.querySelector('.cl-flag'), 'wrong card is flagged with text');
  });

  T.test('classifier: completes after every card is placed, reporting total mistakes', function () {
    var c = ctx();
    var made = Lab.ui.get('classifier')(c.ctx);
    card(made.el, 'one').click();
    bucketButton(made.el, 'B').click();
    card(made.el, 'one').click();
    bucketButton(made.el, 'A').click();
    T.eq(c.results.length, 1);
    card(made.el, 'two').click();
    bucketButton(made.el, 'B').click();
    var last = c.results[c.results.length - 1];
    T.eq(last.correct, true);
    T.eq(last.mistakes, 1);
    T.eq(made.el.querySelectorAll('.cl-card').length, 0);
    T.eq(made.el.querySelectorAll('.cl-placed-item').length, 2);
    T.eq(c.says[c.says.length - 1], ['correct', 'Second is B or A.', 'Nuance.']);
  });

  T.test('classifier: an acceptable alternative bucket counts as correct', function () {
    var c = ctx();
    var made = Lab.ui.get('classifier')(c.ctx);
    card(made.el, 'two').click();
    bucketButton(made.el, 'A').click();
    T.eq(c.says[0][0], 'correct');
    T.eq(c.results.length, 0);
  });

  T.test('classifier: choosing a bucket with no card selected explains what to do', function () {
    var c = ctx();
    var made = Lab.ui.get('classifier')(c.ctx);
    bucketButton(made.el, 'A').click();
    T.eq(c.says[0][0], 'info');
    T.eq(c.results.length, 0);
  });

  T.test('classifier: state restores after a re-render, and a done activity shows everything placed', function () {
    var c = ctx();
    var first = Lab.ui.get('classifier')(c.ctx);
    card(first.el, 'one').click();
    bucketButton(first.el, 'A').click();
    var saved = first.getState();
    var c2 = ctx({ initialState: saved });
    var second = Lab.ui.get('classifier')(c2.ctx);
    T.eq(second.el.querySelectorAll('.cl-placed-item').length, 1);
    T.ok(!card(second.el, 'one'), 'placed card is not in the pool');
    var c3 = ctx({ done: true });
    var third = Lab.ui.get('classifier')(c3.ctx);
    T.eq(third.el.querySelectorAll('.cl-placed-item').length, 2);
    T.eq(third.el.querySelectorAll('.cl-card').length, 0);
    bucketButton(third.el, 'A').click();
    T.eq(c3.results.length, 0);
  });

  T.test('classifier: derives buckets from answers when none are given, and builds the artifact text', function () {
    var act = { id: 'd.t', maxXp: 5, buckets: [], items: [
      { id: 'a', text: 'x', answer: 'P', explanation: 'because x' },
      { id: 'b', text: 'y', answer: 'Q', explanation: 'because y' }
    ] };
    T.eq(Lab.ui.classifier.bucketsOf(act), ['P', 'Q']);
    var text = Lab.ui.classifier.buildArtifact(
      { title: 'T', sections: [{ heading: 'Ps', bucket: 'P' }, { heading: 'Qs', bucket: 'Q' }, { heading: 'Rs', bucket: 'R' }], extra: [{ heading: 'Who', lines: ['me'] }] },
      act.items, { a: 'P', b: 'Q' });
    T.eq(text, '# T\n\n## Ps\n- x\n\n## Qs\n- y\n\n## Who\n- me\n');
  });

  T.test('compare: radio group switches views and linked lines are highlighted both ways', function () {
    var cfg = { views: [
      { id: 'i', label: 'Intent', lines: [{ id: 'i1', text: 'goal', traces: ['s1'] }] },
      { id: 's', label: 'Spec', lines: [{ id: 's1', text: 'rule' }, { id: 's2', text: 'other' }] }
    ] };
    T.eq(Lab.ui.compare.linkedIds(cfg.views, { view: 'i', line: 'i1' }), { s1: true });
    T.eq(Lab.ui.compare.linkedIds(cfg.views, { view: 's', line: 's1' }), { i1: true });
    T.eq(Lab.ui.compare.linkedIds(cfg.views, null), {});
    var made = Lab.ui.get('compare')({ config: cfg });
    attach(made.el);
    T.eq(made.el.querySelectorAll('input[type="radio"]').length, 2);
    T.eq(made.el.querySelector('.compare-heading').textContent, 'Intent');
    made.el.querySelectorAll('input[type="radio"]')[1].click();
    T.eq(made.el.querySelector('.compare-heading').textContent, 'Spec');
    T.eq(made.getState().view, 's');
    detach(made.el);
  });

  T.test('stepper: reveals cumulatively, steps forward and resets', function () {
    var steps = [{ caption: 'a', reveal: ['x'] }, { caption: 'b', reveal: ['y'] }, { caption: 'c', reveal: ['z'] }];
    T.eq(Lab.ui.stepper.revealedAt(steps, 0), { x: true });
    T.eq(Lab.ui.stepper.revealedAt(steps, 2), { x: true, y: true, z: true });
    var says = [];
    var made = Lab.ui.get('stepper')({
      config: { nodes: [{ id: 'x', label: 'X' }, { id: 'y', label: 'Y' }, { id: 'z', label: 'Z' }], steps: steps },
      say: function (k, t) { says.push(t); }
    });
    function shown() { return Array.prototype.filter.call(made.el.querySelectorAll('.flow-node'), function (n) { return !n.hidden; }).length; }
    function button(label) {
      return Array.prototype.filter.call(made.el.querySelectorAll('.stepper-controls button'), function (b) { return b.textContent === label; })[0];
    }
    T.eq(shown(), 1);
    button('Step').click();
    T.eq(shown(), 2);
    button('Step').click();
    button('Step').click();
    T.eq(shown(), 3);
    T.eq(made.getState().index, 2);
    button('Reset').click();
    T.eq(shown(), 1);
    T.eq(says.slice(-1)[0], 'a');
    made.destroy();
  });

  T.test('choice: a wrong pick keeps the question open, the right pick completes it', function () {
    var act = { id: 'd.c', maxXp: 10, prompt: 'Pick', items: [
      { id: 'a', text: 'A', answer: 'wrong', explanation: 'No, because.', consequence: 'Rework.' },
      { id: 'b', text: 'B', answer: 'correct', explanation: 'Yes, because.' }
    ] };
    var c = ctx({ activity: act });
    var made = Lab.ui.get('choice')(c.ctx);
    attach(made.el);
    var radios = made.el.querySelectorAll('input[type="radio"]');
    radios[0].click();
    T.eq(c.results[0].correct, false);
    T.eq(c.results[0].mistakes, 1);
    T.ok(made.el.querySelector('.choice-consequence'), 'consequence is shown as text');
    made.el.querySelectorAll('input[type="radio"]')[1].click();
    T.eq(c.results[1].correct, true);
    T.eq(c.results[1].mistakes, 1);
    T.eq(c.says.map(function (s) { return s[0]; }), ['wrong', 'correct']);
    T.ok(Lab.ui.choice.isCorrect({ answer: 'correct' }));
    detach(made.el);
  });

  T.test('mission helpers: required activities, completion, visible beats and level', function () {
    var m = Lab.content.getMission('spec');
    T.eq(Lab.mission.requiredActivityIds(m), ['spec.trace', 'spec.which']);
    T.eq(Lab.mission.isMissionDone(m, function () { return null; }), false);
    T.eq(Lab.mission.isMissionDone(m, function (id) { return { done: id === 'spec.trace' }; }), false);
    T.eq(Lab.mission.isMissionDone(m, function () { return { done: true }; }), true);
    var withDeeper = { beats: [{ type: 'explain' }, { type: 'deeper' }, { type: 'debrief' }] };
    T.eq(Lab.mission.visibleIndices(withDeeper, 'simple'), [0, 2]);
    T.eq(Lab.mission.visibleIndices(withDeeper, 'deeper'), [0, 1, 2]);
    T.eq(Lab.mission.levelContributed(0).level, 1);
    T.eq(Lab.mission.levelContributed(5).level, 5);
    T.eq(Lab.mission.levelContributed(14).level, 11);
  });

  T.test('store: hints are recorded without affecting XP', function () {
    var storage = { d: {}, getItem: function (k) { return this.d[k] || null; }, setItem: function (k, v) { this.d[k] = v; }, removeItem: function (k) { delete this.d[k]; } };
    var s = Lab.store.create({ storage: storage });
    s.recordHint('x.y');
    s.recordHint('x.y');
    var again = Lab.store.create({ storage: storage });
    T.eq(again.getState().activities['x.y'].hints, 2);
    s.recordAttempt('x.y', { correct: true, maxXp: 20 });
    T.eq(s.totalXp(), 20);
  });
})();
