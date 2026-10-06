(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var h = Lab.dom.h;
  var mount = Lab.dom.mount;

  var SEVERITY_LABEL = { critical: 'CRITICAL', major: 'ISSUE', note: 'NOTE' };
  var COVER_TILES = ['claude-md', 'skill', 'hook', 'eval', 'review', 'ci'];

  // config: { packet: [{ id, label, lines }], tiles: [{ id, label, hint }],
  //           policies: [{ id, label }], reasons: [{ id, label }], simulation: { nodes, steps } }
  function create(ctx) {
    var cfg = ctx.config;
    var activity = ctx.activity;
    var say = ctx.say || Lab.coach.say;
    var base = Lab.dom.uid('wf');
    var st = { lane: [], covers: {}, reason: 'none', failed: 0, solved: !!ctx.done, accepted: false, findings: null, selected: null, tab: cfg.packet[0].id };

    if (ctx.initialState) {
      st.lane = (ctx.initialState.lane || []).slice();
      st.covers = Object.assign({}, ctx.initialState.covers || {});
      st.reason = ctx.initialState.reason || 'none';
      st.failed = ctx.initialState.failed | 0;
      st.solved = st.solved || !!ctx.initialState.solved;
    }
    if (ctx.done && !st.lane.length) {
      st.lane = ['intent', 'spec', 'plan', 'claude-md', 'skill', 'subagent', 'feedback', 'eval', 'review', 'hook', 'ci', 'monitoring'];
      st.covers = { pii: 'hook', approval: 'hook' };
      st.reason = 'verify';
    }
    var root = h('div', { class: 'wf' });
    var simInst = null;

    function snapshot() { return { lane: st.lane, covers: st.covers, reason: st.reason, failed: st.failed, solved: st.solved }; }
    function emit() { if (ctx.onState) ctx.onState(snapshot()); }
    function labelOf(id) { return cfg.tiles.filter(function (t) { return t.id === id; })[0].label; }
    function selection() { return { order: st.lane, covers: st.covers, subagentReason: st.reason }; }

    function add() {
      if (!st.selected) { say('info', 'Pick a tile from the palette first.'); return; }
      if (st.lane.indexOf(st.selected) < 0) st.lane.push(st.selected);
      var picked = st.selected;
      st.selected = null;
      st.findings = null;
      emit();
      render();
      var el = root.querySelector('[data-lane="' + picked + '"]');
      if (el) el.focus();
    }

    function move(id, delta) {
      var i = st.lane.indexOf(id);
      var j = i + delta;
      if (i < 0 || j < 0 || j >= st.lane.length) return;
      var t = st.lane[i]; st.lane[i] = st.lane[j]; st.lane[j] = t;
      st.findings = null;
      emit();
      render();
      var el = root.querySelector('[data-lane="' + id + '"]');
      if (el) el.focus();
    }

    function removeTile(id) {
      st.lane = st.lane.filter(function (x) { return x !== id; });
      Object.keys(st.covers).forEach(function (p) { if (st.covers[p] === id) delete st.covers[p]; });
      if (id === 'subagent') st.reason = 'none';
      st.findings = null;
      emit();
      render();
      var pb = root.querySelector('[data-pick="' + id + '"]');
      if (pb) pb.focus();
    }

    function ready() {
      return cfg.policies.every(function (p) { return !!st.covers[p.id]; });
    }

    function run() {
      if (st.solved) return;
      if (!st.lane.length) { say('info', 'Add some tiles to the lane first.'); return; }
      if (!ready()) { say('info', 'Choose what covers each policy before you run the workflow.'); return; }
      var findings = Lab.workflow.evaluateWorkflow(selection());
      st.findings = findings;
      var full = Lab.workflow.isFullLoop(findings);
      if (full) {
        st.solved = true;
        say('correct', 'Full loop. Every rule is satisfied.');
        emit();
        render();
        ctx.onResult({ activityId: activity.id, correct: true, mistakes: st.failed, maxXp: activity.maxXp, detail: { findings: findings } });
      } else {
        st.failed += 1;
        var s = Lab.workflow.score(findings);
        say('wrong', findings.length + (findings.length === 1 ? ' problem' : ' problems') + ' found. Revise the workflow and run it again, or accept it for ' + s + ' XP.');
        emit();
        render();
        ctx.onResult({ activityId: activity.id, correct: false, mistakes: st.failed, detail: { findings: findings.map(function (f) { return f.id; }) } });
      }
    }

    function accept() {
      if (st.solved || !st.findings) return;
      st.solved = true;
      st.accepted = true;
      var s = Lab.workflow.score(st.findings);
      say('info', 'Accepted with ' + st.findings.filter(function (f) { return f.severity !== 'note'; }).length + ' open issues. Review the missions behind them before you ship this for real.');
      emit();
      render();
      ctx.onResult({ activityId: activity.id, correct: true, mistakes: st.failed, maxXp: s, detail: { accepted: true } });
    }

    function findingEl(f) {
      return h('li', { class: 'wf-finding', 'data-severity': f.severity },
        Lab.ui.icon(f.severity === 'note' ? 'hint' : 'cross'),
        h('strong', { class: 'wf-sev' }, ' ' + SEVERITY_LABEL[f.severity] + ' '),
        h('span', { class: 'wf-title' }, f.id + ': ' + f.title),
        h('p', { class: 'wf-conseq' }, f.consequence),
        f.details ? h('ul', null, f.details.map(function (d) { return h('li', null, d); })) : null,
        h('p', { class: 'wf-lesson' }, h('strong', null, 'Lesson: '), f.lesson));
    }

    function simulation() {
      var sim = cfg.simulation;
      if (!simInst) {
        simInst = Lab.ui.get('stepper')({ config: { label: 'The whole system running', nodes: sim.nodes, steps: sim.steps }, say: say });
      }
      return h('section', { class: 'wf-sim', 'aria-labelledby': base + '-sim' },
        h('h3', { id: base + '-sim' }, 'The whole system, running'),
        h('p', null, h('strong', null, 'Simulated'), ' - a scripted run of your workflow.'),
        simInst.el,
        h('h3', null, 'The new intent.md'),
        h('pre', { class: 'cl-artifact-text', tabindex: '0', 'aria-label': 'The generated intent.md' }, Lab.content.finalIntent),
        h('p', null, h('a', { class: 'btn btn-primary', href: '#/summary' }, 'See your Journey summary')));
    }

    function render() {
      var tabs = h('div', { class: 'wf-tabs', role: 'tablist', 'aria-label': 'Scenario packet' }, cfg.packet.map(function (p) {
        var on = st.tab === p.id;
        var b = h('button', { type: 'button', role: 'tab', id: base + '-tab-' + p.id, 'aria-controls': base + '-panel', 'aria-selected': on ? 'true' : 'false', tabindex: on ? '0' : '-1' }, p.label);
        b.addEventListener('click', function () { st.tab = p.id; render(); var t = root.querySelector('#' + base + '-tab-' + p.id); if (t) t.focus(); });
        b.addEventListener('keydown', function (e) {
          var i = cfg.packet.map(function (x) { return x.id; }).indexOf(p.id);
          var step = e.key === 'ArrowRight' ? 1 : (e.key === 'ArrowLeft' ? -1 : 0);
          if (!step) return;
          e.preventDefault();
          st.tab = cfg.packet[(i + step + cfg.packet.length) % cfg.packet.length].id;
          render();
          var t = root.querySelector('#' + base + '-tab-' + st.tab);
          if (t) t.focus();
        });
        return b;
      }));
      var current = cfg.packet.filter(function (p) { return p.id === st.tab; })[0];
      var panel = h('div', { class: 'wf-panel', role: 'tabpanel', id: base + '-panel', 'aria-labelledby': base + '-tab-' + st.tab },
        h('ul', null, current.lines.map(function (l) { return h('li', null, l); })));

      var palette = h('ul', { class: 'bd-palette', 'aria-label': 'Tiles' }, cfg.tiles.filter(function (t) { return st.lane.indexOf(t.id) < 0; }).map(function (t) {
        return h('li', null, h('button', {
          type: 'button', class: 'cl-card', 'data-pick': t.id, title: t.hint || null,
          'aria-pressed': st.selected === t.id ? 'true' : 'false',
          onclick: function () { st.selected = st.selected === t.id ? null : t.id; render(); var b = root.querySelector('[data-pick="' + t.id + '"]'); if (b) b.focus(); }
        }, h('span', null, t.label)));
      }));

      var lane = h('ol', { class: 'wf-lane', 'aria-label': 'Your workflow, in order' }, st.lane.map(function (id, i) {
        return h('li', { class: 'wf-step' },
          h('span', { class: 'wf-num' }, (i + 1) + '.'),
          h('span', { class: 'wf-name', 'data-lane': id, tabindex: '-1' }, labelOf(id)),
          st.solved ? Lab.ui.icon('check') : h('span', { class: 'wf-actions' },
            h('button', { type: 'button', class: 'btn', 'aria-label': 'Move ' + labelOf(id) + ' earlier', 'aria-disabled': i === 0 ? 'true' : null, onclick: function () { move(id, -1); } }, 'Earlier'),
            h('button', { type: 'button', class: 'btn', 'aria-label': 'Move ' + labelOf(id) + ' later', 'aria-disabled': i === st.lane.length - 1 ? 'true' : null, onclick: function () { move(id, 1); } }, 'Later'),
            h('button', { type: 'button', class: 'btn', 'aria-label': 'Remove ' + labelOf(id), onclick: function () { removeTile(id); } }, 'Remove')));
      }));

      var coverSection = h('fieldset', { class: 'wf-cover', disabled: st.solved ? 'true' : null },
        h('legend', null, 'What covers each policy?'),
        cfg.policies.map(function (p) {
          var sid = base + '-cover-' + p.id;
          var opts = [h('option', { value: '' }, 'Choose')].concat(COVER_TILES.filter(function (t) { return st.lane.indexOf(t) >= 0; }).map(function (t) {
            var o = h('option', { value: t }, labelOf(t));
            if (st.covers[p.id] === t) o.selected = true;
            return o;
          }));
          var sel = h('select', { id: sid }, opts);
          sel.addEventListener('change', function () { if (sel.value) st.covers[p.id] = sel.value; else delete st.covers[p.id]; st.findings = null; emit(); });
          return h('p', null, h('label', { for: sid }, p.label + ': '), sel);
        }));

      var reasonSection = st.lane.indexOf('subagent') >= 0
        ? h('p', null, h('label', { for: base + '-reason' }, 'Why is a subagent in the workflow? '), (function () {
            var sel = h('select', { id: base + '-reason', disabled: st.solved ? 'true' : null }, cfg.reasons.map(function (r) {
              var o = h('option', { value: r.id }, r.label);
              if (st.reason === r.id) o.selected = true;
              return o;
            }));
            sel.addEventListener('change', function () { st.reason = sel.value; st.findings = null; emit(); });
            return sel;
          })())
        : null;

      var results = null;
      if (st.findings) {
        var s = Lab.workflow.score(st.findings);
        results = h('section', { class: 'wf-results', 'aria-labelledby': base + '-res' },
          h('h3', { id: base + '-res' }, st.findings.length ? 'What happened when the workflow ran' : 'No findings'),
          st.findings.length ? h('ul', { class: 'wf-findings' }, st.findings.map(findingEl)) : h('p', null, 'Every rule is satisfied.'),
          !Lab.workflow.isFullLoop(st.findings) ? h('p', { class: 'wf-score' }, 'Score if you stop here: ' + s + ' XP (50 minus 10 per critical problem and 5 per other problem, never below 10).') : null,
          !Lab.workflow.isFullLoop(st.findings) && !st.solved
            ? h('button', { type: 'button', class: 'btn', onclick: accept }, 'Accept this workflow for ' + s + ' XP')
            : null);
      }

      mount(root, [
        h('p', { class: 'cl-prompt' }, 'Build the workflow for this scenario, then run it.'),
        tabs, panel,
        h('h3', null, 'Tiles'), palette,
        h('button', { type: 'button', class: 'btn', 'aria-disabled': st.selected ? null : 'true', onclick: add }, 'Add to the lane'),
        h('h3', null, 'Your workflow'),
        lane.children.length ? lane : h('p', { class: 'wf-empty' }, 'The lane is empty.'),
        coverSection, reasonSection,
        h('button', { type: 'button', class: 'btn btn-primary', 'aria-disabled': st.solved ? 'true' : null, onclick: run }, st.solved ? 'Done' : 'Run the workflow'),
        results,
        st.solved && !st.accepted ? simulation() : null
      ]);
    }

    render();
    Lab.coach.setHints(activity.hints || [
      'Think about which rules must always hold. Advice can be missed, so enforce them.',
      'Start with the order the course taught: intent, spec, plan. End with monitoring.'
    ], activity.id);
    return { el: root, getState: snapshot, destroy: function () { if (simInst && simInst.destroy) simInst.destroy(); } };
  }

  Lab.ui.register('workflow', create);
})();
