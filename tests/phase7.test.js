(function () {
  'use strict';
  var T = window.LabTests;
  var Lab = window.Lab;
  var W = Lab.workflow;

  var ALL = ['intent', 'spec', 'plan', 'claude-md', 'skill', 'subagent', 'feedback', 'eval', 'review', 'hook', 'ci', 'monitoring'];

  function good(over) {
    var sel = { order: ALL.slice(), covers: { pii: 'hook', approval: 'hook' }, subagentReason: 'verify' };
    Object.keys(over || {}).forEach(function (k) { sel[k] = over[k]; });
    return sel;
  }
  function without(id, over) {
    return good(Object.assign({ order: ALL.filter(function (t) { return t !== id; }) }, over || {}));
  }
  function ids(findings) { return findings.map(function (f) { return f.id; }); }

  function ctx(extra) {
    var out = { results: [], says: [] };
    var base = {
      coachHints: false,
      say: function (k, t) { out.says.push([k, t]); },
      onResult: function (r) { out.results.push(r); }
    };
    Object.keys(extra || {}).forEach(function (k) { base[k] = extra[k]; });
    out.ctx = base;
    return out;
  }
  function attach(el) { document.body.appendChild(el); return el; }
  function detach(el) { if (el.parentNode) el.parentNode.removeChild(el); }
  function memStore() {
    var d = {};
    return Lab.store.create({ storage: { getItem: function (k) { return d[k] || null; }, setItem: function (k, v) { d[k] = v; }, removeItem: function (k) { delete d[k]; } } });
  }
  function btn(el, label) {
    return Array.prototype.filter.call(el.querySelectorAll('button'), function (b) { return b.textContent === label; })[0];
  }

  // ---- rules engine (spec 9.17) ---------------------------------------------

  T.test('evaluateWorkflow: the correct workflow yields no findings', function () {
    T.eq(W.evaluateWorkflow(good()), []);
    T.eq(W.score([]), 50);
    T.eq(W.isFullLoop([]), true);
  });

  T.test('evaluateWorkflow: R1 alone, a Skill covering a must-hold rule', function () {
    var f = W.evaluateWorkflow(good({ covers: { pii: 'skill', approval: 'hook' } }));
    T.eq(ids(f), ['R1']);
    T.eq(f[0].severity, 'critical');
    T.ok(f[0].lesson.indexOf('deterministic Hook') >= 0);
    T.eq(f[0].policies, ['pii']);
    T.eq(ids(W.evaluateWorkflow(good({ covers: { pii: 'skill', approval: 'skill' } }))), ['R1']);
  });

  T.test('evaluateWorkflow: R2 to R8, each violated alone, produce exactly their consequence', function () {
    var cases = [
      ['R2', without('feedback'), 'critical'],
      ['R3', without('eval'), 'major'],
      ['R4', without('hook', { covers: { pii: 'review', approval: 'ci' } }), 'critical'],
      ['R5', without('monitoring'), 'major'],
      ['R6', without('plan'), 'critical'],
      ['R7', without('claude-md'), 'major'],
      ['R8', without('review'), 'major']
    ];
    cases.forEach(function (c) {
      var f = W.evaluateWorkflow(c[1]);
      T.eq(ids(f), [c[0]], c[0] + ' alone');
      T.eq(f[0].severity, c[2], c[0] + ' severity');
      T.ok(f[0].consequence.length > 20, c[0] + ' consequence');
    });
    T.eq(ids(W.evaluateWorkflow(without('spec'))), ['R6'], 'a missing spec also triggers R6');
  });

  T.test('evaluateWorkflow: the four critical rules are R1, R2, R4 and R6', function () {
    var crit = Object.keys(W.RULES).filter(function (k) { return W.RULES[k].severity === 'critical'; });
    T.eq(crit.sort(), ['R1', 'R2', 'R4', 'R6']);
  });

  T.test('evaluateWorkflow: O1 ordering feedback with an explanation', function () {
    function swap(a, b) {
      var o = ALL.slice();
      var i = o.indexOf(a), j = o.indexOf(b);
      o[i] = b; o[j] = a;
      return good({ order: o });
    }
    var f = W.evaluateWorkflow(swap('spec', 'plan'));
    T.eq(ids(f), ['O1']);
    T.ok(f[0].details[0].indexOf('plan.md') >= 0);
    T.eq(ids(W.evaluateWorkflow(good({ order: ['monitoring'].concat(ALL.filter(function (t) { return t !== 'monitoring'; })) }))), ['O1']);
    var hookLate = ALL.filter(function (t) { return t !== 'hook'; });
    hookLate.splice(hookLate.indexOf('ci') + 1, 0, 'hook');
    hookLate = hookLate.filter(function (t) { return t !== 'monitoring'; }).concat('monitoring');
    var hf = W.evaluateWorkflow(good({ order: hookLate }));
    T.eq(ids(hf), ['O1']);
    T.ok(hf[0].details.join(' ').indexOf('gate must come before CI/CD') >= 0);
    var several = W.evaluateWorkflow(swap('intent', 'plan'));
    T.eq(ids(several), ['O1'], 'several broken pairs are still one finding');
    T.ok(several[0].details.length >= 2);
  });

  T.test('evaluateWorkflow: N1 is a neutral note about a subagent with no reason', function () {
    var f = W.evaluateWorkflow(good({ subagentReason: 'none' }));
    T.eq(ids(f), ['N1']);
    T.eq(f[0].severity, 'note');
    T.eq(W.score(f), 50, 'a note costs nothing');
    T.eq(W.isFullLoop(f), true);
    T.eq(ids(W.evaluateWorkflow(without('subagent', { subagentReason: 'none' }))), []);
  });

  T.test('scoring: 10 off per critical, 5 off per other, floor 10', function () {
    T.eq(W.score(W.evaluateWorkflow(without('feedback'))), 40);
    T.eq(W.score(W.evaluateWorkflow(without('eval'))), 45);
    T.eq(W.score(W.evaluateWorkflow(good({ covers: { pii: 'skill', approval: 'hook' } }))), 40);
    T.eq(W.score([{ severity: 'critical' }, { severity: 'critical' }]), 30);
    var wreck = W.evaluateWorkflow({ order: ['ci'], covers: { pii: 'skill', approval: 'skill' }, subagentReason: null });
    T.ok(wreck.length >= 6, 'many violations at once');
    T.eq(W.score(wreck), 10, 'the floor is 10');
    T.eq(W.isFullLoop(wreck), false);
  });

  // ---- the workflow component ------------------------------------------------

  var CFG = Lab.content.getMission('final').beats.filter(function (b) { return b.component === 'workflow'; })[0].config;
  var ACT = { id: 'final.workflow', maxXp: 50 };

  function build(el, order, covers, reason) {
    order.forEach(function (id) {
      el.querySelector('[data-pick="' + id + '"]').click();
      btn(el, 'Add to the lane').click();
    });
    Object.keys(covers).forEach(function (p) {
      var sel = el.querySelector('#' + el.querySelector('select').id.replace(/-cover-.*$/, '-cover-' + p));
      sel.value = covers[p];
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    if (reason) {
      var r = el.querySelector('select[id$="-reason"]');
      r.value = reason;
      r.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  T.test('workflow component: a poor workflow shows consequences and can be accepted for a partial score', function () {
    var c = ctx({ activity: ACT, config: CFG });
    var made = Lab.ui.get('workflow')(c.ctx);
    var el = attach(made.el);
    btn(el, 'Run the workflow').click();
    T.eq(c.results.length, 0, 'an empty lane is not run');
    build(el, ['intent', 'spec', 'plan', 'claude-md', 'skill', 'feedback', 'eval', 'review', 'hook', 'ci', 'monitoring'], { pii: 'skill', approval: 'hook' }, null);
    btn(el, 'Run the workflow').click();
    T.eq(c.results[0].correct, false);
    T.ok(el.querySelector('.wf-finding .wf-sev').textContent.indexOf('CRITICAL') >= 0, 'severity is text');
    T.ok(el.querySelector('.wf-lesson').textContent.indexOf('deterministic Hook') >= 0);
    T.ok(el.querySelector('.wf-score').textContent.indexOf('40 XP') >= 0);
    btn(el, 'Accept this workflow for 40 XP').click();
    var last = c.results[c.results.length - 1];
    T.eq(last.correct, true);
    T.eq(last.maxXp, 40);
    T.ok(!el.querySelector('.wf-sim'), 'no simulation for an accepted workflow with problems');
    detach(el);
  });

  T.test('workflow component: a violation-free run awards the full 50 XP and runs the simulation', function () {
    var c = ctx({ activity: ACT, config: CFG });
    var made = Lab.ui.get('workflow')(c.ctx);
    var el = attach(made.el);
    build(el, ALL, { pii: 'hook', approval: 'hook' }, 'verify');
    btn(el, 'Run the workflow').click();
    T.eq(c.results.length, 1);
    T.eq(c.results[0], { activityId: 'final.workflow', correct: true, mistakes: 0, maxXp: 50, detail: { findings: [] } });
    T.ok(el.querySelector('.wf-sim'), 'the whole system runs');
    T.ok(el.querySelector('.wf-sim pre').textContent.indexOf('# Intent: keep the claim status endpoint healthy') === 0, 'a new intent.md is generated');
    T.eq(el.querySelector('.wf-sim a').getAttribute('href'), '#/summary');
    detach(el);
  });

  T.test('workflow component: keyboard-operable lane controls and the packet tabs', function () {
    var c = ctx({ activity: ACT, config: CFG });
    var made = Lab.ui.get('workflow')(c.ctx);
    var el = attach(made.el);
    T.eq(el.querySelectorAll('[role="tab"]').length, 6);
    el.querySelectorAll('[role="tab"]')[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    T.eq(el.querySelector('[role="tab"][aria-selected="true"]').textContent, 'Product request');
    build(el, ['intent', 'spec'], {}, null);
    el.querySelector('[aria-label="Move intent.md later"]').click();
    T.eq(el.querySelector('.wf-name').textContent, 'spec.md');
    el.querySelector('[aria-label="Remove spec.md"]').click();
    T.eq(el.querySelectorAll('.wf-step').length, 1);
    T.ok(el.querySelector('[data-pick="spec"]'), 'removed tile returns to the palette');
    detach(el);
  });

  // ---- Journey summary -------------------------------------------------------

  T.test('summary: the 23 criteria each name real missions, and coverage follows completion', function () {
    var crit = Lab.content.criteria;
    T.eq(crit.length, 23);
    T.eq(crit.map(function (c) { return c.n; }), crit.map(function (c, i) { return i + 1; }));
    crit.forEach(function (c) {
      T.ok(c.missions.length > 0 && c.missions.every(function (id) { return Lab.content.getMission(id); }), 'criterion ' + c.n);
    });
    var none = Lab.summary.criteriaStatus(crit, {});
    T.eq(none.filter(function (s) { return s.covered; }).length, 0);
    var some = Lab.summary.criteriaStatus(crit, { orientation: { complete: true }, intent: { complete: true } });
    T.eq(some.filter(function (s) { return s.covered; }).map(function (s) { return s.n; }), [1, 2]);
    var all = {};
    Lab.xp.MISSIONS.forEach(function (m) { all[m.id] = { complete: true }; });
    T.eq(Lab.summary.criteriaStatus(crit, all).every(function (s) { return s.covered; }), true);
  });

  T.test('summary: locked until Mission 14 or Explore', function () {
    var s = memStore();
    var v = Lab.summary.view({ store: s });
    T.ok(v.el.textContent.indexOf('unlocks when you complete Mission 14') >= 0);
    T.eq(v.diagrams.length, 0);
    s.setSetting('explore', true);
    T.ok(Lab.summary.view({ store: s }).el.querySelector('.sum-criteria'));
  });

  T.test('summary: shows level, XP, the humans layer, the new intent and the first-step advice', function () {
    var s = memStore();
    Lab.xp.MISSIONS.forEach(function (m) { s.completeMission(m.id); });
    s.recordAttempt('final.workflow', { correct: true, maxXp: 50 });
    s.setSkillDescription(Lab.skills.GOOD_EXAMPLE);
    var v = Lab.summary.view({ store: s });
    var el = attach(v.el);
    T.ok(el.querySelector('.sum-level').textContent.indexOf('Level 11: Loop Architect') === 0);
    T.ok(el.textContent.indexOf('XP 50 of 500') >= 0);
    T.ok(el.querySelectorAll('circle.sys-person').length >= 1, 'the humans layer is on');
    T.ok(el.querySelector('.sys-svg .sys-edge-loop'), 'the loop arrow is drawn');
    T.ok(el.textContent.indexOf('Copy intent.md') >= 0 && el.textContent.indexOf('Download intent.md') >= 0);
    T.eq(el.querySelectorAll('.sum-criterion[data-covered="true"]').length, 23);
    T.ok(el.textContent.indexOf('What I should introduce first, why, and what comes next') >= 0);
    T.ok(el.querySelector('.sum-state').textContent.trim().length > 0, 'coverage is text, not colour');
    var skillBtn = btn(el, 'Download SKILL.md');
    T.ok(skillBtn && skillBtn.getAttribute('aria-disabled') === null, 'the Skill export is available');
    detach(el);
  });

  // ---- whole course ----------------------------------------------------------

  T.test('course: all 15 missions are registered in order and the activities total exactly 500 XP', function () {
    var all = Lab.content.allMissions();
    T.eq(all.map(function (m) { return m.id; }), Lab.xp.MISSIONS.map(function (m) { return m.id; }));
    var grand = 0;
    all.forEach(function (m) {
      var sum = m.beats.filter(function (b) { return b.type === 'try' && b.required !== false; }).reduce(function (s, b) { return s + b.activity.maxXp; }, 0);
      T.eq(sum, m.xp, m.id + ' activities add up to the mission XP');
      grand += sum;
    });
    T.eq(grand, 500);
    T.eq(Lab.xp.TOTAL_XP, 500);
  });

  T.test('course: completing missions in order reaches all 11 levels with the right cumulative XP', function () {
    var done = {};
    var seen = {};
    var xp = 0;
    Lab.content.allMissions().forEach(function (m) {
      done[m.id] = true;
      xp += m.xp;
      var lv = Lab.xp.levelFor(done);
      if (lv > 0 && seen[lv] === undefined) seen[lv] = xp;
    });
    T.eq(Object.keys(seen).length, 11);
    Lab.xp.LEVELS.forEach(function (l) { T.eq(seen[l.level], l.cumulativeXp, 'level ' + l.level); });
  });

  T.test('course: no mission file is marked reviewed by a person who did not review it', function () {
    Lab.content.allMissions().forEach(function (m) {
      T.eq(m.reviewedBy, null, m.id + ' reviewedBy stays null until a named reviewer fills it in');
      T.eq(m.reviewedOn, null, m.id + ' reviewedOn');
    });
  });

  T.test('course: every technical claim is still unverified, awaiting the spec 16.4 check', function () {
    var count = 0;
    Lab.content.allMissions().forEach(function (m) { m.claims.forEach(function (c) { count += 1; T.eq(c.verified, null, m.id); }); });
    T.ok(count >= 30, 'there are claims to verify: ' + count);
  });
})();
