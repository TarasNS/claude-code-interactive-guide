(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var h = Lab.dom.h;
  var mount = Lab.dom.mount;

  function isCorrect(item) {
    return item.answer === true || item.answer === 'correct';
  }

  // Several questions sharing one option list: config.options = ['One agent', ...];
  // activity.items = [{ id, text, answer: <option>, explanation }].
  function createMulti(ctx) {
    var activity = ctx.activity;
    var options = ctx.config.options;
    var items = activity.items;
    var say = ctx.say || Lab.coach.say;
    var base = Lab.dom.uid('choices');
    var state = { done: {}, tried: {}, mistakes: 0 };
    if (ctx.initialState) {
      state.done = Object.assign({}, ctx.initialState.done || {});
      state.tried = Object.assign({}, ctx.initialState.tried || {});
      state.mistakes = ctx.initialState.mistakes | 0;
    }
    if (ctx.done) items.forEach(function (it) { state.done[it.id] = it.answer; });
    var root = h('div', { class: 'choice choice-multi' });

    function snapshot() { return { done: state.done, tried: state.tried, mistakes: state.mistakes }; }
    function emit() { if (ctx.onState) ctx.onState(snapshot()); }

    function focusOption(it, option) {
      var idx = (it.options || options).indexOf(option);
      var el = root.querySelector('#' + base + '-' + it.id + '-' + idx);
      if (el) el.focus();
    }

    function focusNextOpen() {
      var next = items.filter(function (x) { return !state.done[x.id]; })[0];
      var el = next && root.querySelector('#' + base + '-' + next.id + '-0');
      if (el) el.focus();
    }

    function pick(it, option) {
      if (state.done[it.id]) return;
      state.tried[it.id] = (state.tried[it.id] || []).concat(option);
      if (option === it.answer) {
        state.done[it.id] = option;
        say('correct', it.explanation);
        emit();
        render();
        focusNextOpen();
        var all = items.every(function (x) { return state.done[x.id]; });
        if (all) ctx.onResult({ activityId: activity.id, correct: true, mistakes: state.mistakes, detail: { done: state.done } });
      } else {
        state.mistakes += 1;
        say('wrong', 'Not "' + option + '". ' + it.explanation);
        emit();
        render();
        focusOption(it, option);
        ctx.onResult({ activityId: activity.id, correct: false, mistakes: state.mistakes, detail: { itemId: it.id, option: option } });
      }
    }

    function render() {
      var sets = items.map(function (it) {
        var finished = !!state.done[it.id];
        var opts = it.options || options;
        var radios = opts.map(function (opt, i) {
          var rid = base + '-' + it.id + '-' + i;
          var tried = (state.tried[it.id] || []).indexOf(opt) >= 0;
          var good = finished && state.done[it.id] === opt;
          var input = h('input', {
            type: 'radio', name: base + '-' + it.id, id: rid, value: opt,
            checked: good,
            disabled: finished && !good ? 'true' : null,
            onchange: function () { pick(it, opt); }
          });
          return h('div', { class: 'choice-card', 'data-state': good ? 'correct' : (tried ? 'tried' : 'open') },
            input,
            h('label', { for: rid },
              h('span', { class: 'choice-text' }, opt),
              good ? h('span', { class: 'choice-status' }, Lab.ui.icon('check'), ' Chosen: correct')
                : (tried ? h('span', { class: 'choice-status' }, Lab.ui.icon('cross'), ' Tried: not this one') : null)));
        });
        return h('fieldset', { class: 'choice-set' }, h('legend', null, it.text), radios);
      });
      var intro = ctx.config.intro
        ? h('dl', { class: 'cards choice-intro' }, ctx.config.intro.reduce(function (acc, c) {
            return acc.concat([h('dt', null, c.title), h('dd', null, c.text)]);
          }, []))
        : null;
      mount(root, [intro].concat(sets));
    }

    render();
    Lab.coach.setHints(activity.hints || ['Ask whether the extra agents save you time, or only add coordination work.'], activity.id);
    return { el: root, getState: snapshot };
  }

  function create(ctx) {
    if (ctx.config && ctx.config.options) return createMulti(ctx);
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

    function focusSingle(item) {
      var el = root.querySelector('#' + name + '-' + item.id);
      if (el) el.focus();
    }

    function pick(item) {
      if (done) return;
      if (state.tried.indexOf(item.id) < 0) state.tried.push(item.id);
      if (isCorrect(item)) {
        state.chosen = item.id;
        done = true;
        say('correct', item.explanation, item.consequence || null);
        if (ctx.onState) ctx.onState(snapshot());
        render();
        focusSingle(item);
        ctx.onResult({ activityId: activity.id, correct: true, mistakes: state.mistakes, detail: { chosen: item.id } });
      } else {
        state.mistakes += 1;
        say('wrong', item.explanation, item.consequence || null);
        if (ctx.onState) ctx.onState(snapshot());
        render();
        focusSingle(item);
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
