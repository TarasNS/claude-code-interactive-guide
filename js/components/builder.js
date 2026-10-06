(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var h = Lab.dom.h;
  var mount = Lab.dom.mount;

  // config: { slots: [{ id, label }], ordered: bool, preview: { title, file }, check: 'Check', rules: [...] }
  // activity.items: palette [{ id, text, answer: slotId | 'none', explanation }]
  //   answer = the slot the item belongs in; 'none' marks a distractor that must stay out.
  // config.rules (optional, extra): [{ type: 'before', a, b, reason }] for ordered builders.

  // Pure: evaluate placements. placed: { itemId: slotId }; order: ids in placement order.
  function evaluate(activity, config, placed, order) {
    var problems = [];
    var items = activity.items;
    items.forEach(function (it) {
      var where = placed[it.id];
      if (it.answer === 'none') {
        if (where) problems.push({ id: it.id, reason: it.explanation });
      } else if (!where) {
        problems.push({ id: it.id, reason: 'Missing: ' + it.text + ' ' + it.explanation });
      } else if (where !== it.answer) {
        problems.push({ id: it.id, reason: it.text + ' belongs in a different place. ' + it.explanation });
      }
    });
    (config.rules || []).forEach(function (r) {
      if (r.type === 'before') {
        var ia = order.indexOf(r.a);
        var ib = order.indexOf(r.b);
        if (ia >= 0 && ib >= 0 && ia > ib) problems.push({ id: r.a, reason: r.reason });
      }
    });
    return { ok: problems.length === 0, problems: problems };
  }

  function create(ctx) {
    var activity = ctx.activity;
    var cfg = ctx.config || {};
    var items = activity.items;
    var slots = cfg.slots || [];
    var say = ctx.say || Lab.coach.say;
    var state = { placed: {}, order: [], mistakes: 0, selected: null, solved: !!ctx.done, problems: [] };

    if (ctx.initialState) {
      state.placed = Object.assign({}, ctx.initialState.placed || {});
      state.order = (ctx.initialState.order || []).slice();
      state.mistakes = ctx.initialState.mistakes | 0;
    }
    if (ctx.done) {
      items.forEach(function (it) { if (it.answer !== 'none') { state.placed[it.id] = it.answer; state.order.push(it.id); } });
    }

    var root = h('div', { class: 'builder' });

    function emit() { if (ctx.onState) ctx.onState({ placed: state.placed, order: state.order, mistakes: state.mistakes }); }
    function itemById(id) { return items.filter(function (it) { return it.id === id; })[0]; }

    function pick(id) {
      if (state.solved) return;
      state.selected = state.selected === id ? null : id;
      render();
      var b = root.querySelector('[data-pick="' + id + '"]');
      if (b) b.focus();
    }

    function put(slotId) {
      if (state.solved) return;
      if (!state.selected) { say('info', 'Pick an item from the palette first, then choose where to put it.'); return; }
      state.placed[state.selected] = slotId;
      state.order = state.order.filter(function (x) { return x !== state.selected; });
      state.order.push(state.selected);
      state.selected = null;
      state.problems = [];
      emit();
      render();
    }

    function remove(id) {
      if (state.solved) return;
      delete state.placed[id];
      state.order = state.order.filter(function (x) { return x !== id; });
      state.problems = [];
      emit();
      render();
      var b = root.querySelector('[data-pick="' + id + '"]');
      if (b) b.focus();
    }

    function check() {
      if (state.solved) return;
      var res = evaluate(activity, cfg, state.placed, state.order);
      if (res.ok) {
        state.solved = true;
        state.problems = [];
        say('correct', cfg.success || 'Everything is in the right place.');
        emit();
        render();
        ctx.onResult({ activityId: activity.id, correct: true, mistakes: state.mistakes, detail: { placed: state.placed } });
      } else {
        state.mistakes += 1;
        state.problems = res.problems;
        say('wrong', res.problems.length + (res.problems.length === 1 ? ' thing needs fixing.' : ' things need fixing.') + ' See the list below.');
        emit();
        render();
        ctx.onResult({ activityId: activity.id, correct: false, mistakes: state.mistakes, detail: { problems: res.problems.map(function (p) { return p.id; }) } });
      }
    }

    function previewText() {
      var p = cfg.preview;
      if (!p) return null;
      var lines = ['# ' + p.title, ''];
      slots.forEach(function (s) {
        var here = state.order.filter(function (id) { return state.placed[id] === s.id; });
        lines.push('## ' + s.label);
        if (!here.length) lines.push('(empty)');
        here.forEach(function (id) { lines.push('- ' + itemById(id).text); });
        lines.push('');
      });
      return lines.join('\n').replace(/\n+$/, '\n');
    }

    function render() {
      var palette = items.filter(function (it) { return !state.placed[it.id]; });

      var paletteList = h('ul', { class: 'bd-palette', 'aria-label': 'Palette' }, palette.map(function (it) {
        return h('li', null, h('button', {
          type: 'button', class: 'cl-card', 'data-pick': it.id,
          'aria-pressed': state.selected === it.id ? 'true' : 'false',
          onclick: function () { pick(it.id); }
        }, h('span', null, it.text)));
      }));

      var slotEls = slots.map(function (s) {
        var here = state.order.filter(function (id) { return state.placed[id] === s.id; });
        return h('section', { class: 'cl-bucket bd-slot', 'data-slot': s.id },
          h('h3', { class: 'cl-bucket-title' }, s.label),
          h('button', {
            type: 'button', class: 'btn cl-place', 'aria-label': 'Put selected item in ' + s.label,
            'aria-disabled': (!state.selected || state.solved) ? 'true' : null,
            onclick: function () { put(s.id); }
          }, 'Put here'),
          h('ul', { class: 'cl-placed', 'aria-label': 'In ' + s.label }, here.map(function (id) {
            var it = itemById(id);
            return h('li', { class: 'cl-placed-item' },
              h('span', null, it.text),
              state.solved ? Lab.ui.icon('check') : h('button', { type: 'button', class: 'btn bd-remove', 'aria-label': 'Remove: ' + it.text, onclick: function () { remove(id); } }, 'Remove'));
          })));
      });

      var problems = state.problems.length
        ? h('ul', { class: 'bd-problems', 'aria-label': 'Things to fix' }, state.problems.map(function (p) {
            return h('li', null, Lab.ui.icon('cross'), h('span', null, ' ' + p.reason));
          }))
        : null;

      var text = previewText();
      var preview = text
        ? h('section', { class: 'cl-artifact', 'aria-labelledby': 'bd-prev-title' },
            h('h3', { id: 'bd-prev-title' }, 'Live preview: ' + cfg.preview.file),
            h('pre', { class: 'cl-artifact-text', tabindex: '0', 'aria-label': 'Preview of ' + cfg.preview.file }, text))
        : null;

      mount(root, [
        h('p', { class: 'cl-prompt' }, state.solved ? 'Everything is in place.' : (state.selected ? 'Selected: ' + itemById(state.selected).text + '. Now choose where it goes.' : (cfg.prompt || 'Pick an item, then choose where it goes.'))),
        paletteList,
        h('div', { class: 'cl-buckets', 'data-count': slots.length }, slotEls),
        h('button', { type: 'button', class: 'btn btn-primary', 'aria-disabled': state.solved ? 'true' : null, onclick: check }, state.solved ? 'Done' : (cfg.check || 'Check')),
        problems,
        preview
      ]);
    }

    render();
    Lab.coach.setHints(activity.hints || [
      'Some palette items do not belong anywhere. Leave those out.',
      'Place the items you are sure about first, then press Check to see what is left.'
    ], activity.id);

    return { el: root, getState: function () { return { placed: state.placed, order: state.order, mistakes: state.mistakes }; } };
  }

  Lab.ui.register('builder', create);
  Lab.ui.builder = { evaluate: evaluate };
})();
