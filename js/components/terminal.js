(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var h = Lab.dom.h;
  var mount = Lab.dom.mount;

  var STATUS_TEXT = { ok: 'PASS', fail: 'FAIL', info: 'INFO' };

  // ---- pure helpers -------------------------------------------------------

  function normalise(text) {
    return String(text || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  function findCommand(commands, input) {
    var n = normalise(input);
    if (!n) return null;
    for (var i = 0; i < commands.length; i++) {
      var c = commands[i];
      if (normalise(c.cmd) === n) return c;
      var al = c.aliases || [];
      for (var j = 0; j < al.length; j++) if (normalise(al[j]) === n) return c;
    }
    return null;
  }

  function variantFor(command, flags) {
    var variants = command.variants || [];
    for (var i = 0; i < variants.length; i++) {
      var cond = variants[i].if || {};
      var ok = Object.keys(cond).every(function (k) { return flags[k] === cond[k]; });
      if (ok) return variants[i];
    }
    return { lines: command.lines || [], sets: command.sets || {} };
  }

  function goalMet(goal, flags, history) {
    if (!goal) return false;
    var okFlags = Object.keys(goal.flags || {}).every(function (k) { return flags[k] === goal.flags[k]; });
    var okSeq = true;
    if (goal.sequence) {
      var at = 0;
      history.forEach(function (id) { if (id === goal.sequence[at]) at += 1; });
      okSeq = at >= goal.sequence.length;
    }
    return okFlags && okSeq;
  }

  // Group replay lines into turns: lines share a `turn`, otherwise each line is its own turn.
  function turnsOf(script) {
    var turns = [];
    var last = null;
    script.forEach(function (line) {
      if (line.turn !== undefined && line.turn === last) turns[turns.length - 1].push(line);
      else turns.push([line]);
      last = line.turn === undefined ? null : line.turn;
    });
    return turns;
  }

  // ---- component ----------------------------------------------------------

  function lineEl(line, prompt) {
    var cls = 'term-line term-' + line.who + (line.status ? ' term-s-' + line.status : '');
    var kids = [];
    if (line.who === 'cmd') kids.push(h('span', { class: 'term-prompt' }, prompt + ' '));
    if (line.who === 'claude') kids.push(h('span', { class: 'term-who' }, 'claude › '));
    if (line.status && STATUS_TEXT[line.status] && line.status !== 'info') {
      kids.push(Lab.ui.icon(line.status === 'ok' ? 'check' : 'cross'));
      kids.push(h('span', { class: 'term-status' }, ' ' + STATUS_TEXT[line.status] + ' '));
    }
    kids.push(h('span', { class: 'term-text' }, line.text));
    return h('div', { class: cls }, kids);
  }

  function create(ctx) {
    var cfg = ctx.config || {};
    var activity = ctx.activity || null;
    var say = ctx.say || Lab.coach.say;
    var prompt = cfg.prompt || '$';
    var interactive = !!cfg.commands;
    var done = !!ctx.done;
    var state = { shown: 0, lines: [], flags: {}, history: [], highlight: [], mistakes: 0, solved: false };
    var turns = interactive ? [] : turnsOf(cfg.script || []);
    var treeInst = null;

    if (ctx.initialState) {
      state.shown = ctx.initialState.shown | 0;
      state.lines = (ctx.initialState.lines || []).slice();
      state.flags = Object.assign({}, ctx.initialState.flags || {});
      state.history = (ctx.initialState.history || []).slice();
      state.highlight = (ctx.initialState.highlight || []).slice();
      state.solved = !!ctx.initialState.solved;
    }
    if (!interactive && done) state.shown = turns.length;

    var root = h('div', { class: 'terminal' });
    var logEl = h('div', { class: 'term-log', role: 'log', 'aria-label': cfg.label || 'Terminal output', tabindex: '0' });
    var controls = h('div', { class: 'term-controls' });

    function snapshot() {
      return { shown: state.shown, lines: state.lines, flags: state.flags, history: state.history, highlight: state.highlight, solved: state.solved };
    }
    function emit() { if (ctx.onState) ctx.onState(snapshot()); }

    function logLines() {
      if (interactive) return state.lines;
      var out = [];
      for (var i = 0; i < state.shown && i < turns.length; i++) out = out.concat(turns[i]);
      return out;
    }

    function drawLog() {
      var lines = logLines();
      mount(logEl, lines.map(function (l) { return lineEl(l, prompt); }));
      logEl.scrollTop = logEl.scrollHeight;
    }

    function revealHighlights() {
      var hl = [];
      logLines().forEach(function (l) { (l.highlight || []).forEach(function (p) { if (hl.indexOf(p) < 0) hl.push(p); }); });
      state.highlight = hl;
      if (treeInst) treeInst.setHighlight(hl);
    }

    function step() {
      if (state.shown >= turns.length) return;
      state.shown += 1;
      drawLog();
      revealHighlights();
      emit();
      var turn = turns[state.shown - 1];
      var last = turn[turn.length - 1];
      say('info', last.text.length > 140 ? last.text.slice(0, 137) + '...' : last.text);
      drawControls();
    }

    function showAll() {
      state.shown = turns.length;
      drawLog();
      revealHighlights();
      emit();
      drawControls();
    }

    function resetReplay() {
      state.shown = 0;
      drawLog();
      revealHighlights();
      emit();
      drawControls();
    }

    function run(raw) {
      var text = String(raw || '').trim();
      if (!text) return;
      var cmd = findCommand(cfg.commands, text);
      state.lines.push({ who: 'cmd', text: text });
      if (!cmd) {
        state.lines.push({ who: 'out', status: 'info', text: 'Command not recognised. Try one of: ' + cfg.commands.map(function (c) { return c.cmd; }).join(', ') });
        drawLog(); emit();
        return;
      }
      var v = variantFor(cmd, state.flags);
      (v.lines || []).forEach(function (l) { state.lines.push(l); });
      Object.keys(v.sets || {}).forEach(function (k) { state.flags[k] = v.sets[k]; });
      state.history.push(cmd.id || cmd.cmd);
      revealHighlights();
      drawLog();
      var met = goalMet(cfg.goal, state.flags, state.history);
      if (met && !state.solved && !done) {
        state.solved = true;
        emit();
        if (activity) ctx.onResult({ activityId: activity.id, correct: true, mistakes: state.mistakes, detail: { history: state.history } });
      } else {
        emit();
      }
    }

    function drawControls() {
      if (interactive) {
        var input = h('input', { type: 'text', id: 'term-input-' + root.id, list: 'term-list-' + root.id, autocomplete: 'off', 'aria-label': 'Type a command' });
        var datalist = h('datalist', { id: 'term-list-' + root.id }, cfg.commands.map(function (c) { return h('option', { value: c.cmd }); }));
        var form = h('form', { class: 'term-form', action: '#' },
          h('label', { for: 'term-input-' + root.id }, 'Command '),
          input, datalist,
          h('button', { type: 'submit', class: 'btn' }, 'Run')
        );
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          run(input.value);
          input.value = '';
          input.focus();
        });
        var chips = h('div', { class: 'term-chips' }, [h('span', { class: 'term-chips-label' }, 'Suggested: ')].concat(cfg.commands.slice(0, 6).map(function (c) {
          return h('button', { type: 'button', class: 'btn term-chip', title: c.hint || null, onclick: function () { run(c.cmd); } }, c.cmd);
        })));
        mount(controls, [chips, form]);
      } else {
        var atEnd = state.shown >= turns.length;
        mount(controls, [
          h('button', { type: 'button', class: 'btn', 'aria-disabled': atEnd ? 'true' : null, onclick: step }, state.shown === 0 ? 'Start' : 'Next'),
          h('button', { type: 'button', class: 'btn', onclick: showAll }, 'Show all'),
          h('button', { type: 'button', class: 'btn', onclick: resetReplay }, 'Reset')
        ]);
      }
    }

    root.id = Lab.dom.uid('term');
    var hasClaude = (cfg.script || []).some(function (l) { return l.who === 'claude'; }) || (interactive && cfg.commands.some(function (c) {
      return (c.lines || []).concat((c.variants || []).reduce(function (a, v) { return a.concat(v.lines || []); }, [])).some(function (l) { return l.who === 'claude'; });
    }));

    var header = h('div', { class: 'term-header' },
      h('span', { class: 'term-title' }, cfg.label || 'Terminal'),
      hasClaude ? h('span', { class: 'term-sim' }, 'Simulated') : null
    );

    var panel = h('div', { class: 'term-panel' }, header, logEl, controls);
    var kids = [panel];
    if (cfg.tree) {
      treeInst = Lab.ui.get('tree')({ config: { root: cfg.tree, label: 'Repository files', highlight: state.highlight } });
      kids.push(treeInst.el);
    }
    mount(root, h('div', { class: 'term-layout', 'data-tree': cfg.tree ? 'true' : null }, kids));

    drawLog();
    revealHighlights();
    drawControls();

    if (interactive && activity) {
      Lab.coach.setHints(activity.hints || ['Use the suggested commands. If you type something else, the terminal lists what it understands.'], activity.id);
    }

    return { el: root, getState: snapshot };
  }

  Lab.ui.register('terminal', create);
  Lab.ui.terminal = { findCommand: findCommand, variantFor: variantFor, goalMet: goalMet, turnsOf: turnsOf };
})();
