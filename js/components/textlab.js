(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var h = Lab.dom.h;
  var mount = Lab.dom.mount;

  function download(name, text, say) {
    try {
      var blob = new Blob([text], { type: 'text/markdown' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    } catch (e) {
      say('info', 'Your browser blocked the download. Use Copy instead.');
    }
  }

  // The Skill description lab (spec 9.8.1). Free text is written only with textContent / .value.
  function create(ctx) {
    var activity = ctx.activity;
    var cfg = ctx.config || {};
    var st = ctx.store || Lab.store;
    var say = ctx.say || Lab.coach.say;
    var state = { failed: 0, result: null, solved: !!ctx.done };
    if (ctx.initialState) state.failed = ctx.initialState.failed | 0;

    var saved = st.getSkillDescription();
    var initial = saved || cfg.start || Lab.skills.START;
    var id = Lab.dom.uid('textlab');
    var root = h('div', { class: 'textlab' });
    var area = h('textarea', { id: id + '-area', rows: 5, 'aria-describedby': id + '-rules', maxlength: 2000 });
    area.value = initial;

    function emit() { if (ctx.onState) ctx.onState({ failed: state.failed }); }

    function run() {
      var text = area.value;
      st.setSkillDescription(text);
      var res = Lab.skills.evaluate(text);
      state.result = res;
      if (res.allPass) {
        state.solved = true;
        say('correct', 'All six rules and all four test prompts pass.');
        emit();
        render();
        ctx.onResult({ activityId: activity.id, correct: true, mistakes: state.failed, detail: { description: text } });
      } else {
        state.failed += 1;
        say('wrong', 'Not yet. Read the results below and edit the description.');
        emit();
        render();
        ctx.onResult({ activityId: activity.id, correct: false, mistakes: state.failed, detail: {} });
      }
    }

    function resultRow(pass, label, message) {
      return h('li', { class: 'tl-row', 'data-pass': pass ? 'true' : 'false' },
        Lab.ui.icon(pass ? 'check' : 'cross'),
        h('strong', { class: 'tl-state' }, ' ' + (pass ? 'PASSED' : 'FAILED') + ' '),
        h('span', null, label ? label + ': ' + message : message));
    }

    function render() {
      var keepFocus = document.activeElement === area;
      var value = area.value;
      var res = state.result;
      var rulesList = h('ul', { id: id + '-rules', class: 'tl-rules', 'aria-label': 'Validation results' },
        res ? res.rules.map(function (r) { return resultRow(r.pass, r.label, r.message); })
          : [h('li', null, 'Run the simulated trigger test to see which rules your description meets.')]);

      var tests = res
        ? h('div', { class: 'tl-tests' },
            h('h3', null, 'Simulated trigger test'),
            h('p', { class: 'tl-sim' }, h('strong', null, 'Simulated heuristic'), ' - a simple check, not a real model.'),
            h('ul', null, res.tests.map(function (t) {
              return resultRow(t.pass, '"' + t.prompt + '" (should ' + t.expected + ')', t.reason);
            })))
        : null;

      var example = state.failed >= 2 && !state.solved
        ? h('div', { class: 'tl-example' }, h('h3', null, 'An example of a good description'), h('p', null, Lab.skills.GOOD_EXAMPLE))
        : null;

      var guide = h('details', { class: 'tl-guide' },
        h('summary', null, 'Fix guide'),
        h('ul', null,
          h('li', null, h('strong', null, 'Under-triggering: '), 'add specific phrases a user would really say.'),
          h('li', null, h('strong', null, 'Over-triggering: '), 'narrow the scope and say what the Skill is not for.')));

      mount(root, [
        h('p', null, 'The Skill is named ', h('code', null, Lab.skills.SKILL_NAME), '. Its starting description is deliberately vague. Rewrite it so Claude loads the Skill at the right time.'),
        h('label', { for: id + '-area' }, 'Skill description'),
        area,
        h('p', { class: 'tl-count' }, h('span', { 'data-count': value.length }, value.length + ' characters (60 to 1024)')),
        h('button', { type: 'button', class: 'btn btn-primary', 'aria-disabled': state.solved ? 'true' : null, onclick: function () { if (!state.solved) run(); } }, state.solved ? 'Done' : 'Run simulated trigger test'),
        rulesList, tests, example, guide
      ]);
      area.addEventListener('input', function () {
        var c = root.querySelector('.tl-count span');
        if (c) c.textContent = area.value.length + ' characters (60 to 1024)';
      });
      if (keepFocus) area.focus();
    }

    render();
    Lab.coach.setHints(activity.hints || [
      'Say what the Skill does and when to use it. Start the second sentence with "Use when".',
      'Add at least two things a user would really say, each in double quotes.'
    ], activity.id);

    return { el: root, getState: function () { return { failed: state.failed }; } };
  }

  Lab.ui.register('textlab', create);
  Lab.ui.textlab = { download: download };
})();
