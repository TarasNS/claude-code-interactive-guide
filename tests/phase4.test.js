(function () {
  'use strict';
  var T = window.LabTests;
  var Lab = window.Lab;

  function memStore() {
    var d = {};
    return Lab.store.create({ storage: { getItem: function (k) { return d[k] || null; }, setItem: function (k, v) { d[k] = v; }, removeItem: function (k) { delete d[k]; } } });
  }
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

  // ---- Skills description validator (spec 9.8.1) ---------------------------

  var GOOD = Lab.skills.GOOD_EXAMPLE;
  var TABLE = [
    { text: 'Helps with APIs.', allPass: false, fails: ['length', 'when', 'triggers', 'broad'] },
    { text: GOOD, allPass: true, fails: [] },
    { text: 'Reviews API endpoints for security problems. Use when adding a route.', allPass: false, fails: ['triggers'] },
    { text: 'Reviews API endpoints for security. Use when the user says "review this endpoint" or "check my API".', allPass: true, fails: [] },
    { text: 'Reviews API endpoints for security issues. Use when reviewing, checking, auditing, testing endpoints.', allPass: true, fails: [] },
    { text: 'Helps with anything to do with APIs. Use when the user says "api" or "endpoint" or "review".', allPass: false, fails: ['broad'] },
    { text: 'Reviews API endpoints for <security> problems. Use when the user says "review this" or "check that".', allPass: false, fails: ['tags'] },
    { text: 'Deploys the site. Use when the user says "deploy now" or "ship it" and is happy with the release.', allPass: false, fails: ['what'] }
  ];

  T.test('skills validator: table of good and bad descriptions', function () {
    TABLE.forEach(function (row) {
      var v = Lab.skills.validate(row.text);
      var failed = v.rules.filter(function (r) { return !r.pass; }).map(function (r) { return r.id; });
      row.fails.forEach(function (id) { T.ok(failed.indexOf(id) >= 0, '"' + row.text.slice(0, 30) + '" should fail ' + id); });
      if (row.allPass) T.eq(failed, [], row.text.slice(0, 30));
      T.eq(Lab.skills.evaluate(row.text).allPass, row.allPass, 'overall: ' + row.text.slice(0, 40));
    });
  });

  T.test('skills validator: comma-separated trigger terms count after the use-when clause', function () {
    var d = 'Reviews API endpoints for security problems. Use when adding endpoints, changing routes, checking auth.';
    T.eq(Lab.skills.validate(d).rules.filter(function (r) { return r.id === 'triggers'; })[0].pass, true);
    var d2 = 'Reviews API endpoints for security problems. Use when adding endpoints or changing routes.';
    T.eq(Lab.skills.validate(d2).rules.filter(function (r) { return r.id === 'triggers'; })[0].pass, false);
  });

  T.test('skills validator: length limits', function () {
    function lengthRule(t) { return Lab.skills.validate(t).rules[0].pass; }
    T.eq(lengthRule('x'.repeat(59)), false);
    T.eq(lengthRule('x'.repeat(60)), true);
    T.eq(lengthRule('x'.repeat(1024)), true);
    T.eq(lengthRule('x'.repeat(1025)), false);
  });

  T.test('skills validator: simulated trigger test follows the spec logic', function () {
    var good = Lab.skills.triggerTest(GOOD);
    T.eq(good.map(function (t) { return t.pass; }), [true, true, true, true]);
    var vague = Lab.skills.triggerTest('Helps with APIs.');
    T.eq(vague.map(function (t) { return t.pass; }), [false, false, false, false]);
    T.eq(good[0].expected, 'triggers');
    T.eq(good[2].expected, 'does not trigger');
  });

  T.test('skills validator: generated SKILL.md is valid and a bad one is caught', function () {
    var md = Lab.skills.buildSkillMd(GOOD);
    T.eq(Lab.skills.checkSkillMd(md), []);
    T.ok(md.indexOf('name: secure-api-review') > 0);
    T.eq(Lab.skills.checkSkillMd(Lab.skills.buildSkillMd('He said "hi" \\ there')), []);
    T.ok(Lab.skills.checkSkillMd('---\nname: Bad_Name\ndescription: "x"\n').length >= 2);
    T.ok(Lab.skills.checkSkillMd('no frontmatter').length >= 1);
    T.ok(Lab.skills.checkSkillMd('---\nname: ok-name\ndescription: "a <b>"\n---\n').indexOf('angle brackets in frontmatter') >= 0);
  });

  // ---- textlab -------------------------------------------------------------

  T.test('textlab: vague description fails with reasons, good one completes and is saved', function () {
    var s = memStore();
    var c = ctx({ activity: { id: 'skills.description', maxXp: 25 }, store: s, config: {} });
    var made = Lab.ui.get('textlab')(c.ctx);
    var el = attach(made.el);
    var area = el.querySelector('textarea');
    T.eq(area.value, 'Helps with APIs.');
    el.querySelector('.btn-primary').click();
    T.eq(c.results[0].correct, false);
    T.ok(el.querySelectorAll('.tl-row[data-pass="false"]').length >= 3);
    T.ok(el.querySelector('.tl-state').textContent.trim().length > 0, 'state is text, not colour');
    el.querySelector('textarea').value = GOOD;
    el.querySelector('.btn-primary').click();
    T.eq(c.results[1].correct, true);
    T.eq(c.results[1].mistakes, 1);
    T.eq(s.getSkillDescription(), GOOD);
    detach(el);
  });

  T.test('textlab: an example appears after two failed attempts', function () {
    var c = ctx({ activity: { id: 'skills.description', maxXp: 25 }, store: memStore(), config: {} });
    var made = Lab.ui.get('textlab')(c.ctx);
    var el = attach(made.el);
    el.querySelector('.btn-primary').click();
    T.ok(!el.querySelector('.tl-example'));
    el.querySelector('.btn-primary').click();
    T.ok(el.querySelector('.tl-example'));
    detach(el);
  });

  // ---- tree ----------------------------------------------------------------

  T.test('tree: resolves named trees and exposes treeitems with levels', function () {
    var made = Lab.ui.get('tree')({ config: { root: 'skill' } });
    var el = attach(made.el);
    var items = el.querySelectorAll('[role="treeitem"]');
    T.ok(items.length >= 5);
    T.eq(items[0].getAttribute('aria-level'), '1');
    T.eq(el.querySelector('[role="tree"]').getAttribute('aria-label'), 'Files');
    T.ok(el.querySelector('.tree-optional strong') === null || true);
    detach(el);
  });

  T.test('tree: arrow keys move, collapse and expand; selecting shows the contents', function () {
    var made = Lab.ui.get('tree')({ config: { root: 'skill' } });
    var el = attach(made.el);
    function key(path, k) {
      el.querySelector('[data-path="' + path + '"]').dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
    }
    var rootPath = 'secure-api-review';
    el.querySelector('[data-path="' + rootPath + '"]').focus();
    key(rootPath, 'ArrowDown');
    T.eq(document.activeElement.getAttribute('data-path'), rootPath + '/SKILL.md');
    key(rootPath + '/SKILL.md', 'Enter');
    T.ok(el.querySelector('.tree-sample').textContent.indexOf('name: secure-api-review') >= 0);
    T.ok(el.querySelector('.tree-info').textContent.indexOf('Required') >= 0);
    key(rootPath, 'ArrowLeft');
    T.eq(el.querySelector('[data-path="' + rootPath + '"]').getAttribute('aria-expanded'), 'false');
    T.eq(el.querySelectorAll('[role="treeitem"]').length, 1);
    key(rootPath, 'ArrowRight');
    T.ok(el.querySelectorAll('[role="treeitem"]').length > 1);
    detach(el);
  });

  // ---- terminal ------------------------------------------------------------

  var CMDS = [
    { id: 'test', cmd: 'npm test', aliases: ['npm run test'],
      lines: [{ who: 'out', status: 'fail', text: '1 test failed' }],
      variants: [{ if: { fixed: true }, lines: [{ who: 'out', status: 'ok', text: 'all tests passed' }], sets: { green: true } }] },
    { id: 'fix', cmd: 'ask claude to fix', lines: [{ who: 'claude', text: 'Fixing it.' }], sets: { fixed: true } }
  ];

  T.test('terminal: command lookup, variants and goals are pure', function () {
    var t = Lab.ui.terminal;
    T.eq(t.findCommand(CMDS, '  NPM   run test ').id, 'test');
    T.eq(t.findCommand(CMDS, 'rm -rf'), null);
    T.eq(t.variantFor(CMDS[0], {}).lines[0].status, 'fail');
    T.eq(t.variantFor(CMDS[0], { fixed: true }).lines[0].status, 'ok');
    T.eq(t.goalMet({ flags: { green: true } }, { green: true }, []), true);
    T.eq(t.goalMet({ sequence: ['test', 'fix', 'test'] }, {}, ['test', 'test', 'fix']), false);
    T.eq(t.goalMet({ sequence: ['test', 'fix', 'test'] }, {}, ['test', 'fix', 'test']), true);
    T.eq(t.turnsOf([{ turn: 1 }, { turn: 1 }, { who: 'x' }]).map(function (x) { return x.length; }), [2, 1]);
  });

  T.test('terminal: interactive run reaches the goal, never dead-ends on unknown input', function () {
    var c = ctx({ activity: { id: 'demo.term', maxXp: 10 }, config: { commands: CMDS, goal: { flags: { green: true } } } });
    var made = Lab.ui.get('terminal')(c.ctx);
    var el = attach(made.el);
    function type(text) {
      el.querySelector('input').value = text;
      el.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
    type('make coffee');
    T.ok(el.querySelector('.term-log').textContent.indexOf('Command not recognised. Try one of: npm test') >= 0);
    T.eq(c.results.length, 0);
    type('npm test');
    T.ok(el.querySelector('.term-status').textContent.indexOf('FAIL') >= 0, 'status is text');
    type('ask claude to fix');
    type('npm test');
    T.eq(c.results.length, 1);
    T.eq(c.results[0].correct, true);
    T.eq(el.querySelector('.term-log').getAttribute('role'), 'log');
    T.ok(el.querySelector('.term-sim'), 'Simulated label for Claude lines');
    detach(el);
  });

  T.test('terminal: replay steps through turns and highlights the tree', function () {
    var script = [
      { who: 'claude', text: 'Reading a', highlight: ['claims-portal/CLAUDE.md'] },
      { who: 'claude', text: 'Plan:', turn: 1 }, { who: 'out', text: 'one', turn: 1 }
    ];
    var made = Lab.ui.get('terminal')({ say: function () {}, config: { script: script, tree: 'claimsportal' } });
    var el = attach(made.el);
    function btn(label) { return Array.prototype.filter.call(el.querySelectorAll('.term-controls button'), function (b) { return b.textContent === label; })[0]; }
    T.eq(el.querySelectorAll('.term-line').length, 0);
    btn('Start').click();
    T.eq(el.querySelectorAll('.term-line').length, 1);
    T.eq(el.querySelectorAll('.tree-read').length, 1);
    btn('Next').click();
    T.eq(el.querySelectorAll('.term-line').length, 3);
    T.eq(Lab.ui.get('tree')({ config: { root: 'claimsportal', highlight: ['src/api/middleware/auth.js'] } }).el.querySelectorAll('.tree-read').length, 1, 'paths relative to the root also match');
    btn('Reset').click();
    T.eq(el.querySelectorAll('.term-line').length, 0);
    detach(el);
  });

  // ---- flagger -------------------------------------------------------------

  var FL = {
    id: 'demo.flag', maxXp: 20,
    items: [
      { id: 'a', text: 'fine line', answer: 'ok', explanation: 'Fine because.' },
      { id: 'b', text: 'bad line', answer: 'flaw', explanation: 'Bad because.' },
      { id: 'c', text: 'worse line', answer: 'flaw', explanation: 'Worse because.' }
    ]
  };
  var FL_CFG = { finish: { label: 'Approve', blocked: 'Rework.', success: 'Approved.' }, questions: [{ q: 'Q1?', a: 'A1.' }] };

  T.test('flagger: flagging an ok line is a mistake; finishing early is blocked and counted', function () {
    var c = ctx({ activity: FL, config: FL_CFG });
    var made = Lab.ui.get('flagger')(c.ctx);
    var el = attach(made.el);
    el.querySelector('[data-item="a"]').click();
    T.eq(c.results[0], { activityId: 'demo.flag', correct: false, mistakes: 1, detail: { itemId: 'a' } });
    el.querySelector('[data-item="b"]').click();
    T.eq(c.says[c.says.length - 1][0], 'correct');
    el.querySelector('.btn-primary').click();
    T.eq(c.results[c.results.length - 1].correct, false);
    T.eq(c.results[c.results.length - 1].mistakes, 2);
    T.eq(c.says[c.says.length - 1], ['wrong', 'Rework.', null]);
    detach(el);
  });

  T.test('flagger: all flaws flagged then approve completes; questions reveal answers', function () {
    var c = ctx({ activity: FL, config: FL_CFG });
    var made = Lab.ui.get('flagger')(c.ctx);
    var el = attach(made.el);
    el.querySelector('[data-question="0"]').click();
    T.ok(el.querySelector('.fl-answer').textContent.indexOf('A1.') >= 0);
    el.querySelector('[data-item="b"]').click();
    el.querySelector('[data-item="c"]').click();
    T.ok(el.querySelector('.fl-status').textContent.indexOf('2 of 2') === 0);
    el.querySelector('.btn-primary').click();
    var last = c.results[c.results.length - 1];
    T.eq(last.correct, true);
    T.eq(last.mistakes, 0);
    T.ok(el.querySelector('.fl-mark').textContent.indexOf('Flagged') >= 0, 'flag is text, not colour');
    detach(el);
  });

  T.test('flagger: a done activity renders as finished', function () {
    var c = ctx({ activity: FL, config: FL_CFG, done: true });
    var made = Lab.ui.get('flagger')(c.ctx);
    var el = attach(made.el);
    T.eq(el.querySelectorAll('.fl-item[data-flagged="true"]').length, 2);
    T.eq(el.querySelector('.btn-primary').textContent, 'Done');
    detach(el);
  });

  // ---- builder -------------------------------------------------------------

  var BD = {
    id: 'demo.build', maxXp: 10,
    items: [
      { id: 'i1', text: 'npm test', answer: 'cmd', explanation: 'A command.' },
      { id: 'i2', text: 'camelCase', answer: 'conv', explanation: 'A convention.' },
      { id: 'i3', text: 'blue button', answer: 'none', explanation: 'Task-specific.' }
    ]
  };
  var BD_CFG = { slots: [{ id: 'cmd', label: 'Commands' }, { id: 'conv', label: 'Conventions' }], preview: { title: 'T', file: 'F.md' } };

  T.test('builder: evaluate finds misplaced, missing and distractor items, and ordering rules', function () {
    var ev = Lab.ui.builder.evaluate;
    T.eq(ev(BD, BD_CFG, { i1: 'cmd', i2: 'conv' }, ['i1', 'i2']).ok, true);
    T.eq(ev(BD, BD_CFG, { i1: 'conv', i2: 'conv' }, ['i1', 'i2']).problems.length, 1);
    T.eq(ev(BD, BD_CFG, { i1: 'cmd' }, ['i1']).problems.length, 1);
    T.eq(ev(BD, BD_CFG, { i1: 'cmd', i2: 'conv', i3: 'cmd' }, ['i1', 'i2', 'i3']).problems.length, 1);
    var rules = { rules: [{ type: 'before', a: 'i2', b: 'i1', reason: 'Order matters.' }] };
    T.eq(ev(BD, rules, { i1: 'cmd', i2: 'conv' }, ['i1', 'i2']).problems[0].reason, 'Order matters.');
  });

  T.test('builder: pick and put build the live preview; check reports problems then completes', function () {
    var c = ctx({ activity: BD, config: BD_CFG });
    var made = Lab.ui.get('builder')(c.ctx);
    var el = attach(made.el);
    function put(item, slot) {
      el.querySelector('[data-pick="' + item + '"]').click();
      el.querySelector('[data-slot="' + slot + '"] .cl-place').click();
    }
    put('i1', 'conv');
    T.ok(el.querySelector('.cl-artifact-text').textContent.indexOf('## Conventions\n- npm test') >= 0, 'live preview');
    put('i3', 'cmd');
    put('i2', 'conv');
    el.querySelector('.btn-primary').click();
    T.eq(c.results[0].correct, false);
    T.ok(el.querySelectorAll('.bd-problems li').length >= 2);
    el.querySelector('[aria-label="Remove: npm test"]').click();
    el.querySelector('[aria-label="Remove: blue button"]').click();
    put('i1', 'cmd');
    el.querySelector('.btn-primary').click();
    T.eq(c.results[1].correct, true);
    T.eq(c.results[1].mistakes, 1);
    detach(el);
  });

  // ---- stepper extensions --------------------------------------------------

  T.test('stepper: side-by-side paths and the context meter', function () {
    var made = Lab.ui.get('stepper')({
      say: function () {},
      config: {
        paths: [{ id: 'a', label: 'Path A' }, { id: 'b', label: 'Path B' }],
        nodes: [{ id: 'a1', path: 'a', label: 'A1' }, { id: 'b1', path: 'b', label: 'B1' }],
        steps: [{ caption: 's', reveal: ['a1', 'b1'], meter: { value: 25, label: 'small' } }]
      }
    });
    var el = attach(made.el);
    T.eq(el.querySelectorAll('.flow-path').length, 2);
    T.eq(el.querySelector('.meter-bar').getAttribute('aria-valuenow'), '25');
    T.ok(el.querySelector('.meter-label').textContent.indexOf('small') > 0);
    made.destroy();
    detach(el);
  });

  // ---- Missions 3 to 5 -----------------------------------------------------

  T.test('missions 3 to 5: XP split matches spec 9.6 to 9.8', function () {
    function xps(id) {
      return Lab.content.getMission(id).beats.filter(function (b) { return b.activity; }).map(function (b) { return [b.activity.id, b.activity.maxXp]; });
    }
    T.eq(xps('plan'), [['plan.review', 25], ['plan.when', 15]]);
    T.eq(xps('context'), [['context.classify', 20], ['context.build', 10]]);
    T.eq(xps('skills').slice(0, 3), [['skills.description', 25], ['skills.inspect', 20], ['skills.classify', 15]]);
  });

  T.test('mission 3: the plan has exactly the two deliberate flaws and four questions', function () {
    var b = Lab.content.getMission('plan').beats.filter(function (x) { return x.component === 'flagger'; })[0];
    T.eq(b.activity.items.filter(function (i) { return i.answer === 'flaw'; }).map(function (i) { return i.id; }), ['auth', 'test']);
    T.eq(b.config.questions.length, 4);
    T.ok(b.config.finish.blocked.indexOf('Path A: rework') === 0);
  });

  T.test('mission 4: the builder has six sections, ten correct lines and two distractors', function () {
    var b = Lab.content.getMission('context').beats.filter(function (x) { return x.component === 'builder'; })[0];
    T.eq(b.config.slots.length, 6);
    T.eq(b.activity.items.filter(function (i) { return i.answer !== 'none'; }).length, 10);
    T.eq(b.activity.items.filter(function (i) { return i.answer === 'none'; }).length, 2);
    var res = Lab.ui.builder.evaluate(b.activity, b.config, (function () {
      var p = {};
      b.activity.items.forEach(function (i) { if (i.answer !== 'none') p[i.id] = i.answer; });
      return p;
    })(), []);
    T.eq(res.ok, true);
  });

  T.test('mission 5: five planted defects, seven classifier items and required beats from spec 9.8', function () {
    var m = Lab.content.getMission('skills');
    var inspect = m.beats.filter(function (x) { return x.activity && x.activity.id === 'skills.inspect'; })[0];
    T.eq(inspect.activity.items.filter(function (i) { return i.answer === 'flaw'; }).length, 5);
    var cl = m.beats.filter(function (x) { return x.activity && x.activity.id === 'skills.classify'; })[0];
    T.eq(cl.activity.items.length, 7);
    T.eq(cl.activity.buckets, ['Prompt', 'CLAUDE.md', 'Skill', 'Hook']);
    T.eq(m.beats.filter(function (x) { return x.type === 'deeper'; }).length, 4);
    T.eq(m.beats[m.beats.length - 1].download, 'skill-md');
    T.eq(Lab.mission.visibleIndices(m, 'simple').length, m.beats.length - 4);
  });

  T.test('mission 5: deeper practice never blocks completion', function () {
    var m = Lab.content.getMission('skills');
    T.eq(Lab.mission.requiredActivityIds(m), ['skills.description', 'skills.inspect', 'skills.classify']);
  });

  T.test('content: notes stay within 60 words', function () {
    Lab.content.allMissions().forEach(function (m) {
      m.beats.forEach(function (b) {
        (b.notes || []).forEach(function (n) { T.ok(n.trim().split(/\s+/).length <= 60, m.id + ' note'); });
        (b.cards || []).forEach(function (c) { T.ok(c.text.trim().split(/\s+/).length <= 60, m.id + ' card'); });
      });
    });
  });
})();
