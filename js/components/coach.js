(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var h = Lab.dom.h;
  var mount = Lab.dom.mount;

  var LABELS = { correct: 'Correct', wrong: 'Not quite', info: 'Note', xp: 'XP' };
  var ICONS = { correct: 'check', wrong: 'cross', info: 'hint', xp: 'check' };

  var hintState = { provider: [], used: 0, activityId: null };

  function region() { return document.getElementById('coach'); }
  function tools() { return document.getElementById('coach-tools'); }
  function nav() { return document.getElementById('coach-nav'); }

  function say(kind, text, extra) {
    var el = region();
    if (!el) return;
    var kids = [
      Lab.ui.icon(ICONS[kind] || 'hint'),
      h('strong', { class: 'coach-label' }, (LABELS[kind] || 'Note') + ': '),
      h('span', null, text)
    ];
    if (extra) kids.push(h('span', { class: 'coach-extra' }, ' ' + extra));
    mount(el, h('p', { class: 'coach-msg', 'data-kind': kind }, kids));
  }

  function appendExtra(text) {
    var el = region();
    if (!el) return;
    var msg = el.querySelector('.coach-msg');
    if (!msg) { say('xp', text); return; }
    msg.appendChild(h('span', { class: 'coach-extra' }, ' ' + text));
  }

  function clear() {
    var el = region();
    if (el) mount(el, null);
  }

  function renderTools(why) {
    var box = tools();
    if (!box) return;
    var parts = [];
    if (hintState.provider.length) {
      var left = hintState.provider.length - hintState.used;
      parts.push(h('button', {
        type: 'button',
        class: 'btn',
        'aria-disabled': left === 0 ? 'true' : null,
        onclick: function () { useHint(); }
      }, left > 0 ? 'Hint (' + left + ' left)' : 'No hints left'));
    }
    if (why) {
      parts.push(h('details', { class: 'coach-why' }, h('summary', { class: 'btn' }, 'Why?'), h('p', null, why)));
    }
    mount(box, parts);
  }

  function setHints(list, activityId) {
    hintState = { provider: list || [], used: 0, activityId: activityId || null };
    renderTools(currentWhy);
  }

  var currentWhy = null;

  function setWhy(text) {
    currentWhy = text || null;
    renderTools(currentWhy);
  }

  function useHint() {
    if (hintState.used >= hintState.provider.length) return;
    var fn = hintState.provider[hintState.used];
    hintState.used += 1;
    if (hintState.activityId) Lab.store.recordHint(hintState.activityId);
    say('info', typeof fn === 'function' ? fn() : String(fn));
    renderTools(currentWhy);
    var again = tools() && tools().querySelector('button');
    if (again) again.focus();
  }

  // opts: { back: fn|null, next: { label, enabled, reason, onClick }, skip: fn|null }
  function setNav(opts) {
    var box = nav();
    if (!box) return;
    var parts = [];
    if (opts.back) parts.push(h('button', { type: 'button', class: 'btn', onclick: opts.back }, 'Back'));
    if (opts.next) {
      var n = opts.next;
      var btn = h('button', {
        type: 'button',
        id: 'coach-continue',
        class: 'btn btn-primary',
        'aria-disabled': n.enabled ? null : 'true',
        'aria-describedby': n.enabled ? null : 'coach-reason',
        onclick: function () {
          if (!n.enabled) { say('info', n.reason || 'Finish the activity to continue.'); return; }
          n.onClick();
        }
      }, n.label || 'Continue');
      parts.push(btn);
      if (!n.enabled) parts.push(h('span', { id: 'coach-reason', class: 'coach-reason' }, n.reason || 'Finish the activity to continue.'));
    }
    if (opts.skip) parts.push(h('button', { type: 'button', class: 'btn', onclick: opts.skip }, 'Skip for now'));
    mount(box, parts);
  }

  function reset() {
    clear();
    hintState = { provider: [], used: 0, activityId: null };
    currentWhy = null;
    renderTools(null);
    var box = nav();
    if (box) mount(box, null);
  }

  Lab.coach = { say: say, appendExtra: appendExtra, clear: clear, setHints: setHints, setWhy: setWhy, setNav: setNav, reset: reset };
})();
