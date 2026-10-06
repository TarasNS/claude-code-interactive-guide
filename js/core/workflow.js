(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});

  var TILES = ['intent', 'spec', 'plan', 'claude-md', 'skill', 'subagent', 'feedback', 'eval', 'review', 'hook', 'ci', 'monitoring'];

  // Rule text. severity: 'critical' (-10), 'major' (-5), 'note' (neutral, no penalty).
  var RULES = {
    R1: { severity: 'critical', title: 'A must-hold rule is covered only by a Skill',
      consequence: 'A Skill recommends the rule, Claude ignores or misses it, and an unsafe action becomes possible.',
      lesson: 'Use a deterministic Hook for a rule that must always hold.' },
    R2: { severity: 'critical', title: 'No feedback loop',
      consequence: 'Claude says "Done!" while the failing test is still failing, and a human finds it later.',
      lesson: 'Give Claude a way to run the tests and read the result.' },
    R3: { severity: 'major', title: 'CLAUDE.md or a Skill with no Eval',
      consequence: 'A later edit to that configuration silently regresses behaviour, and nobody notices.',
      lesson: 'Rerun an eval suite whenever the configuration changes.' },
    R4: { severity: 'critical', title: 'No Hook or approval gate before production',
      consequence: 'An unapproved production deploy goes straight through.',
      lesson: 'Put a gate in front of production so a person approves the release.' },
    R5: { severity: 'major', title: 'No production monitoring',
      consequence: 'Customers report the incident before the team sees it.',
      lesson: 'Metrics are the sensors that restart the loop.' },
    R6: { severity: 'critical', title: 'No spec.md or plan.md before building',
      consequence: 'An unexpected architecture problem appears halfway through, and the work is redone.',
      lesson: 'Specify and plan before Claude builds.' },
    R7: { severity: 'major', title: 'No CLAUDE.md',
      consequence: 'Claude repeats convention mistakes: the wrong test command and snake_case fields.',
      lesson: 'Teach Claude the repository once, in CLAUDE.md.' },
    R8: { severity: 'major', title: 'No PR review before CI/CD',
      consequence: 'Mechanical defects reach the pipeline and waste a run.',
      lesson: 'Let an independent review clear the mechanical findings first.' },
    O1: { severity: 'major', title: 'Steps are in an order that will not work',
      consequence: 'Each step depends on the one before it, so the order changes the result.',
      lesson: 'Intent, then spec, then plan; context before building; feedback before review; review and gates before CI/CD; monitoring last.' },
    N1: { severity: 'note', title: 'A subagent with no stated reason',
      consequence: 'A subagent is allowed, but it adds overhead for a task this small.',
      lesson: 'Add one when reading or checking would clutter the main session.' }
  };

  // Ordering constraints used by O1: [earlier, later, explanation]
  var ORDER = [
    ['intent', 'spec', 'The spec comes from the intent, so intent.md goes first.'],
    ['spec', 'plan', 'The plan builds on the spec, so spec.md goes before plan.md.'],
    ['claude-md', 'skill', 'Teach Claude the repository before it uses a Skill to build.'],
    ['claude-md', 'subagent', 'Teach Claude the repository before helpers start building.'],
    ['claude-md', 'feedback', 'Teach Claude the repository before it starts the build and test loop.'],
    ['feedback', 'review', 'Review checked work: the feedback loop comes before PR review.'],
    ['review', 'ci', 'PR review must come before the pipeline, or defects reach it.'],
    ['hook', 'ci', 'The gate must come before CI/CD, or the deploy is not gated.']
  ];

  function has(order, id) { return order.indexOf(id) >= 0; }

  function finding(id, extra) {
    var r = RULES[id];
    var out = { id: id, severity: r.severity, title: r.title, consequence: r.consequence, lesson: r.lesson };
    if (extra) Object.keys(extra).forEach(function (k) { out[k] = extra[k]; });
    return out;
  }

  // selection: { order: [tileId...], covers: { pii: tileId, approval: tileId }, subagentReason: string|null }
  function evaluateWorkflow(selection) {
    var order = (selection && selection.order) || [];
    var covers = (selection && selection.covers) || {};
    var out = [];

    var weakPolicies = Object.keys(covers).filter(function (p) {
      return covers[p] === 'skill' && has(order, 'skill');
    });
    if (weakPolicies.length) out.push(finding('R1', { policies: weakPolicies }));

    if (!has(order, 'feedback')) out.push(finding('R2'));
    if ((has(order, 'claude-md') || has(order, 'skill')) && !has(order, 'eval')) out.push(finding('R3'));
    if (!has(order, 'hook')) out.push(finding('R4'));
    if (!has(order, 'monitoring')) out.push(finding('R5'));
    if (!has(order, 'spec') || !has(order, 'plan')) out.push(finding('R6'));
    if (!has(order, 'claude-md')) out.push(finding('R7'));
    if (!has(order, 'review')) out.push(finding('R8'));

    var broken = [];
    ORDER.forEach(function (pair) {
      var a = order.indexOf(pair[0]);
      var b = order.indexOf(pair[1]);
      if (a >= 0 && b >= 0 && a > b) broken.push(pair[2]);
    });
    var mi = order.indexOf('monitoring');
    if (mi >= 0 && mi !== order.length - 1) broken.push('Monitoring watches what has shipped, so it goes last.');
    if (broken.length) out.push(finding('O1', { details: broken }));

    var reason = selection && selection.subagentReason;
    if (has(order, 'subagent') && (!reason || reason === 'none')) out.push(finding('N1'));

    return out;
  }

  // Start from 50, minus 10 per critical and 5 per other violation (notes are free), floor 10.
  function score(findings) {
    var s = 50;
    findings.forEach(function (f) {
      if (f.severity === 'critical') s -= 10;
      else if (f.severity === 'major') s -= 5;
    });
    return Math.max(10, s);
  }

  function isFullLoop(findings) {
    return findings.every(function (f) { return f.severity === 'note'; });
  }

  Lab.workflow = {
    TILES: TILES,
    RULES: RULES,
    ORDER: ORDER,
    evaluateWorkflow: evaluateWorkflow,
    score: score,
    isFullLoop: isFullLoop
  };
})();
