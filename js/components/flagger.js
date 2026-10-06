(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var h = Lab.dom.h;
  var mount = Lab.dom.mount;

  // activity.items: [{ id, text, answer: 'flaw' | 'ok', explanation }]
  // config.questions: [{ q, a }]   config.finish: { label, blocked, success }

  function isFlaw(item) { return item.answer === 'flaw'; }

  function unflagged(items, flagged) {
    return items.filter(function (it) { return isFlaw(it) && !flagged[it.id]; });
  }

  function create(ctx) {
    var activity = ctx.activity;
    var cfg = ctx.config || {};
    var items = activity.items;
    var say = ctx.say || Lab.coach.say;
    var finish = cfg.finish || { label: 'Approve', blocked: 'There is still a problem you have not flagged.', success: 'Approved.' };
    var state = { flagged: {}, wrong: {}, asked: {}, mistakes: 0, finished: !!ctx.done };

    if (ctx.initialState) {
      state.flagged = Object.assign({}, ctx.initialState.flagged || {});
      state.asked = Object.assign({}, ctx.initialState.asked || {});
      state.mistakes = ctx.initialState.mistakes | 0;
    }
    if (ctx.done) items.forEach(function (it) { if (isFlaw(it)) state.flagged[it.id] = true; });

    var root = h('div', { class: 'flagger' });

    function emit() { if (ctx.onState) ctx.onState({ flagged: state.flagged, asked: state.asked, mistakes: state.mistakes }); }

    function flag(it) {
      if (state.finished || state.flagged[it.id]) return;
      if (isFlaw(it)) {
        state.flagged[it.id] = true;
        state.wrong = {};
        say('correct', it.explanation);
      } else {
        state.mistakes += 1;
        state.wrong = {};
        state.wrong[it.id] = true;
        say('wrong', it.explanation);
        emit();
        render();
        ctx.onResult({ activityId: activity.id, correct: false, mistakes: state.mistakes, detail: { itemId: it.id } });
        return;
      }
      emit();
      render();
      var btn = root.querySelector('[data-item="' + it.id + '"]');
      if (btn) btn.focus();
    }

    function finishNow() {
      if (state.finished) return;
      var missing = unflagged(items, state.flagged);
      if (missing.length) {
        state.mistakes += 1;
        say('wrong', finish.blocked);
        emit();
        render();
        ctx.onResult({ activityId: activity.id, correct: false, mistakes: state.mistakes, detail: { missing: missing.map(function (m) { return m.id; }) } });
        return;
      }
      state.finished = true;
      say('correct', finish.success);
      emit();
      render();
      ctx.onResult({ activityId: activity.id, correct: true, mistakes: state.mistakes, detail: { flagged: state.flagged } });
    }

    function ask(i) {
      state.asked[i] = true;
      emit();
      render();
      var b = root.querySelector('[data-question="' + i + '"]');
      if (b) b.focus();
    }

    function render() {
      var qs = cfg.questions && cfg.questions.length
        ? h('section', { class: 'fl-questions', 'aria-labelledby': 'fl-q-title' },
            h('h3', { id: 'fl-q-title' }, 'Ask the plan'),
            h('ul', null, cfg.questions.map(function (q, i) {
              return h('li', null,
                h('button', { type: 'button', class: 'btn', 'data-question': i, 'aria-expanded': state.asked[i] ? 'true' : 'false', onclick: function () { ask(i); } }, q.q),
                state.asked[i] ? h('p', { class: 'fl-answer' }, h('strong', null, 'Answer: '), q.a) : null);
            })))
        : null;

      var list = h('ul', { class: 'fl-list', 'aria-label': cfg.listLabel || 'Lines to inspect' }, items.map(function (it) {
        var on = !!state.flagged[it.id];
        return h('li', { class: 'fl-item', 'data-flagged': on ? 'true' : null, 'data-wrong': state.wrong[it.id] ? 'true' : null },
          h('button', {
            type: 'button', class: 'fl-flag', 'data-item': it.id,
            'aria-pressed': on ? 'true' : 'false',
            'aria-disabled': (on || state.finished) ? 'true' : null,
            onclick: function () { flag(it); }
          },
            h('span', { class: 'fl-text' }, it.mono ? h('code', null, it.text) : it.text),
            on ? h('span', { class: 'fl-mark' }, Lab.ui.icon('cross'), ' Flagged') : null,
            state.wrong[it.id] ? h('span', { class: 'fl-mark' }, ' Not a flaw') : null
          ));
      }));

      var total = items.filter(isFlaw).length;
      var count = Object.keys(state.flagged).length;
      var status = h('p', { class: 'fl-status' }, count + ' of ' + total + ' problems flagged.');
      var action = h('button', {
        type: 'button', class: 'btn btn-primary', 'aria-disabled': state.finished ? 'true' : null, onclick: finishNow
      }, state.finished ? 'Done' : finish.label);

      mount(root, [
        h('p', { class: 'fl-prompt' }, cfg.prompt || 'Select every line that is a problem to flag it.'),
        qs, list, status, action
      ]);
    }

    render();
    Lab.coach.setHints(activity.hints || [
      'Read each line and ask what could go wrong if it is left as written.',
      function () {
        var m = unflagged(items, state.flagged)[0];
        return m ? 'Look again at: "' + m.text + '"' : 'You have flagged every problem.';
      }
    ], activity.id);

    return { el: root, getState: function () { return { flagged: state.flagged, asked: state.asked, mistakes: state.mistakes }; } };
  }

  Lab.ui.register('flagger', create);
  Lab.ui.flagger = { isFlaw: isFlaw, unflagged: unflagged };
})();
