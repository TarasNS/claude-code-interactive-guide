(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var h = Lab.dom.h;
  var mount = Lab.dom.mount;

  function bucketsOf(activity) {
    if (activity.buckets && activity.buckets.length) return activity.buckets.slice();
    var seen = [];
    activity.items.forEach(function (it) { if (seen.indexOf(it.answer) < 0) seen.push(it.answer); });
    return seen;
  }

  function isCorrect(item, bucket) {
    if (bucket === item.answer) return true;
    return !!(item.acceptable && item.acceptable.indexOf(bucket) >= 0);
  }

  function remaining(activity, placed) {
    return activity.items.filter(function (it) { return !placed[it.id]; }).map(function (it) { return it.id; });
  }

  // Pure: build the generated file text from the learner's placements.
  function buildArtifact(artifact, items, placed) {
    var lines = ['# ' + artifact.title, ''];
    (artifact.sections || []).forEach(function (sec) {
      var here = items.filter(function (it) { return placed[it.id] === sec.bucket; });
      if (!here.length) return;
      lines.push('## ' + sec.heading);
      here.forEach(function (it) { lines.push('- ' + it.text); });
      lines.push('');
    });
    (artifact.extra || []).forEach(function (sec) {
      lines.push('## ' + sec.heading);
      sec.lines.forEach(function (l) { lines.push('- ' + l); });
      lines.push('');
    });
    return lines.join('\n').replace(/\n+$/, '\n');
  }

  function copyArtifact(pre, text, say) {
    function fallback() {
      try {
        var range = document.createRange();
        range.selectNodeContents(pre);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (e) { /* selection unavailable */ }
      say('info', 'The file text is selected. Press Ctrl+C (or Cmd+C) to copy it.');
    }
    try {
      navigator.clipboard.writeText(text).then(function () { say('info', 'Copied to the clipboard.'); }, fallback);
    } catch (e) {
      fallback();
    }
  }

  function create(ctx) {
    var activity = ctx.activity;
    var items = activity.items;
    var buckets = bucketsOf(activity);
    var say = ctx.say || Lab.coach.say;
    var state = { placed: {}, mistakes: 0 };
    var selected = null;
    var wrongId = null;

    if (ctx.initialState) {
      Object.keys(ctx.initialState.placed || {}).forEach(function (k) { state.placed[k] = ctx.initialState.placed[k]; });
      state.mistakes = ctx.initialState.mistakes | 0;
    }
    if (ctx.done) {
      items.forEach(function (it) { state.placed[it.id] = it.answer; });
    }

    var root = h('div', { class: 'classifier' });

    function itemById(id) {
      return items.filter(function (it) { return it.id === id; })[0];
    }

    function emitState() { if (ctx.onState) ctx.onState({ placed: state.placed, mistakes: state.mistakes }); }

    function choose(id) {
      selected = selected === id ? null : id;
      wrongId = null;
      render();
      var btn = root.querySelector('[data-card="' + id + '"]');
      if (btn) btn.focus();
    }

    function place(bucket) {
      if (ctx.done) return;
      if (!selected) { say('info', 'Select a card first, then choose where it belongs.'); return; }
      var item = itemById(selected);
      var id = item.id;
      if (isCorrect(item, bucket)) {
        state.placed[id] = bucket;
        selected = null;
        wrongId = null;
        say('correct', item.explanation, item.note || null);
        emitState();
        var left = remaining(activity, state.placed);
        render();
        if (left.length === 0) {
          ctx.onResult({ activityId: activity.id, correct: true, mistakes: state.mistakes, detail: { placed: state.placed } });
        } else {
          var next = root.querySelector('[data-card="' + left[0] + '"]');
          if (next) next.focus();
        }
      } else {
        state.mistakes += 1;
        wrongId = id;
        selected = null;
        say('wrong', 'Not in "' + bucket + '". ' + item.explanation);
        emitState();
        render();
        var back = root.querySelector('[data-card="' + id + '"]');
        if (back) back.focus();
        ctx.onResult({ activityId: activity.id, correct: false, mistakes: state.mistakes, detail: { itemId: id, bucket: bucket } });
      }
    }

    function hintFirstBucket() {
      var left = remaining(activity, state.placed);
      if (!left.length) return 'Everything is placed.';
      var item = itemById(left[0]);
      return '"' + item.text + '" belongs in "' + item.answer + '".';
    }

    function render() {
      var pool = remaining(activity, state.placed);
      var prompt = ctx.done || pool.length === 0
        ? 'All cards are placed.'
        : (selected ? 'Selected: ' + itemById(selected).text + '. Now choose a bucket.' : 'Select a card, then choose the bucket it belongs in.');

      var poolList = h('ul', { class: 'cl-pool', 'aria-label': 'Cards to place' },
        pool.map(function (id) {
          var it = itemById(id);
          return h('li', null, h('button', {
            type: 'button',
            class: 'cl-card',
            'data-card': id,
            'data-wrong': wrongId === id ? 'true' : null,
            'aria-pressed': selected === id ? 'true' : 'false',
            onclick: function () { choose(id); }
          },
            selected === id ? Lab.ui.icon('available') : null,
            h('span', null, it.text),
            wrongId === id ? h('span', { class: 'cl-flag' }, ' Not placed') : null
          ));
        })
      );

      var cols = buckets.map(function (b) {
        var placedHere = items.filter(function (it) { return state.placed[it.id] === b; });
        return h('section', { class: 'cl-bucket' },
          h('h3', { class: 'cl-bucket-title' }, b),
          h('button', {
            type: 'button',
            class: 'btn cl-place',
            'aria-label': 'Place selected card in ' + b,
            'aria-disabled': (!selected || ctx.done) ? 'true' : null,
            onclick: function () { place(b); }
          }, 'Place here'),
          h('ul', { class: 'cl-placed', 'aria-label': 'Placed in ' + b },
            placedHere.map(function (it) {
              return h('li', { class: 'cl-placed-item' }, Lab.ui.icon('check'), h('span', null, it.text), h('span', { class: 'sr-only' }, ' (correct)'));
            })
          )
        );
      });

      var request = ctx.config && ctx.config.request
        ? h('blockquote', { class: 'cl-request' }, ctx.config.request)
        : null;

      var artifact = null;
      var cfgArtifact = ctx.config && ctx.config.artifact;
      if (cfgArtifact && pool.length === 0) {
        var text = buildArtifact(cfgArtifact, items, state.placed);
        var pre = h('pre', { class: 'cl-artifact-text', tabindex: '0', 'aria-label': cfgArtifact.file }, text);
        artifact = h('section', { class: 'cl-artifact', 'aria-labelledby': 'cl-artifact-title' },
          h('h3', { id: 'cl-artifact-title' }, 'Your ' + cfgArtifact.file),
          pre,
          h('button', { type: 'button', class: 'btn', onclick: function () { copyArtifact(pre, text, say); } }, 'Copy ' + cfgArtifact.file)
        );
      }

      mount(root, [
        request,
        h('p', { class: 'cl-prompt' }, prompt),
        poolList,
        h('div', { class: 'cl-buckets', 'data-count': buckets.length }, cols),
        artifact
      ]);
    }

    render();
    if (ctx.coachHints !== false) {
      Lab.coach.setHints([
        'Pick a card, then choose the bucket that best matches it. The explanation after each placement tells you why.',
        hintFirstBucket
      ], activity.id);
    }

    return { el: root, getState: function () { return { placed: state.placed, mistakes: state.mistakes }; } };
  }

  Lab.ui.register('classifier', create);
  Lab.ui.classifier = { bucketsOf: bucketsOf, isCorrect: isCorrect, remaining: remaining, buildArtifact: buildArtifact };
})();
