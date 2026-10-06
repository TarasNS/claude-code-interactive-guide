(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var h = Lab.dom.h;
  var mount = Lab.dom.mount;

  function isCorrect(item) {
    return item.answer === true || item.answer === 'correct';
  }

  function create(ctx) {
    var activity = ctx.activity;
    var items = activity.items;
    var say = ctx.say || Lab.coach.say;
    var name = Lab.dom.uid('choice');
    var state = { chosen: null, mistakes: 0, tried: [] };
    var done = !!ctx.done;

    if (ctx.initialState) {
      state.chosen = ctx.initialState.chosen || null;
      state.mistakes = ctx.initialState.mistakes | 0;
      state.tried = (ctx.initialState.tried || []).slice();
    }
    if (done) {
      items.forEach(function (it) { if (isCorrect(it)) state.chosen = it.id; });
    }

    var root = h('div', { class: 'choice' });

    function pick(item) {
      if (done) return;
      if (state.tried.indexOf(item.id) < 0) state.tried.push(item.id);
      if (isCorrect(item)) {
        state.chosen = item.id;
        done = true;
        say('correct', item.explanation, item.consequence || null);
        if (ctx.onState) ctx.onState(snapshot());
        render();
        ctx.onResult({ activityId: activity.id, correct: true, mistakes: state.mistakes, detail: { chosen: item.id } });
      } else {
        state.mistakes += 1;
        say('wrong', item.explanation, item.consequence || null);
        if (ctx.onState) ctx.onState(snapshot());
        render();
        ctx.onResult({ activityId: activity.id, correct: false, mistakes: state.mistakes, detail: { chosen: item.id } });
      }
    }

    function snapshot() { return { chosen: state.chosen, mistakes: state.mistakes, tried: state.tried }; }

    function render() {
      var cards = items.map(function (it) {
        var tried = state.tried.indexOf(it.id) >= 0;
        var good = done && isCorrect(it);
        var input = h('input', {
          type: 'radio',
          name: name,
          id: name + '-' + it.id,
          value: it.id,
          checked: state.chosen === it.id,
          disabled: done && !good ? 'true' : null,
          onchange: function () { pick(it); }
        });
        var status = good ? 'Chosen: correct' : (tried ? 'Tried: not the best choice' : null);
        return h('div', { class: 'choice-card', 'data-state': good ? 'correct' : (tried ? 'tried' : 'open') },
          input,
          h('label', { for: name + '-' + it.id },
            h('span', { class: 'choice-text' }, it.text),
            status ? h('span', { class: 'choice-status' }, good ? Lab.ui.icon('check') : Lab.ui.icon('cross'), ' ' + status) : null
          ),
          tried && it.consequence ? h('p', { class: 'choice-consequence' }, it.consequence) : null
        );
      });
      mount(root, h('fieldset', { class: 'choice-set' },
        h('legend', null, activity.prompt || 'Choose one option'),
        cards
      ));
    }

    render();
    Lab.coach.setHints(activity.hints || ['Think about what each option costs you later, not only now.'], activity.id);
    return { el: root, getState: snapshot };
  }

  Lab.ui.register('choice', create);
  Lab.ui.choice = { isCorrect: isCorrect };
})();
