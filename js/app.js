(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var h = Lab.dom.h;
  var mount = Lab.dom.mount;
  var store = Lab.store;

  var main, rail, menuToggle, xpLabel, headerXp, controls;
  var settingsPanel, saveNote, confirmArea;

  function renderHeader() {
    var info = Lab.xp.levelInfo(completedMap());
    var total = store.totalXp();
    xpLabel.textContent = 'Level ' + info.level + ' ' + info.title + ' · XP ' + total + ' / ' + Lab.xp.TOTAL_XP;
    var old = headerXp.querySelector('.xp-bar');
    if (old) headerXp.removeChild(old);
    var pct = Math.min(100, Math.round((total / Lab.xp.TOTAL_XP) * 100));
    var fill = h('div', { class: 'xp-fill', 'data-pct': pct });
    fill.style.width = pct + '%';
    headerXp.appendChild(h('div', { class: 'xp-bar', role: 'progressbar', 'aria-label': 'Total XP', 'aria-valuemin': 0, 'aria-valuemax': Lab.xp.TOTAL_XP, 'aria-valuenow': total }, fill));
    saveNote.textContent = store.isPersistent()
      ? 'Progress is saved in this browser.'
      : 'Progress will not be saved in this browser.';
  }

  function completedMap() {
    var map = {};
    var missions = store.getState().missions;
    Object.keys(missions).forEach(function (id) { if (missions[id].complete) map[id] = true; });
    return map;
  }

  function hasProgress() {
    var s = store.getState();
    return Object.keys(s.missions).length > 0 || Object.keys(s.activities).length > 0;
  }

  function aiNotice() {
    return h('section', { class: 'notice', 'aria-labelledby': 'ai-notice-title' },
      h('h2', { id: 'ai-notice-title' }, 'Using AI tools at Nordic Solar'),
      h('ul', null,
        h('li', null, 'Use only AI coding tools approved by the Head of IT & Digitalization.'),
        h('li', null, 'Never give them proprietary source code, internal system logic, confidential company information, personal data or credentials.'),
        h('li', null, 'Review AI-generated code with the same care as third-party code.')
      ),
      h('p', null, 'These points come from the Company Rules on Artificial Intelligence and the Company Rules on Secure Software Development.')
    );
  }

  function simulatedNotice() {
    return h('section', { class: 'notice', 'aria-labelledby': 'sim-notice-title' },
      h('h2', { id: 'sim-notice-title' }, 'No AI model is called'),
      h('p', null, 'Every "Claude" reply in this product is a scripted example labelled Simulated. The product makes no network requests.')
    );
  }

  function renderLanding() {
    var explore = store.getSettings().explore;
    var actions = h('div', { class: 'actions' },
      h('a', { class: 'btn btn-primary', href: '#/m/orientation' }, 'Start the journey')
    );
    if (hasProgress()) {
      var last = store.getLastView();
      var target = /^#\/(m\/[a-z0-9-]+|map|summary)$/.test(last) ? last : '#/m/orientation';
      actions.appendChild(h('a', { class: 'btn', href: target }, 'Continue'));
    }
    actions.appendChild(h('button', {
      type: 'button',
      class: 'btn',
      'aria-pressed': explore ? 'true' : 'false',
      onclick: function () {
        store.setSetting('explore', !store.getSettings().explore);
        renderRoute(Lab.router.current());
      }
    }, explore ? 'Explore freely: on' : 'Explore freely: off'));

    return h('div', null,
      h('h1', null, 'Claude Engineering Lab'),
      h('h3', null, 'Learn the AI-native software lifecycle with Claude Code, one short mission at a time.'),
      h('p', null, 'You work on one fictional project, ClaimsPortal, through 15 missions. XP is awarded only for verified understanding.'),
      actions,
      simulatedNotice(),
      aiNotice()
    );
  }

  function renderPlaceholder(title) {
    return h('div', null,
      h('h1', null, title),
      h('p', null, 'This view is built in a later phase.'),
      h('p', null, h('a', { href: '#/' }, 'Back to the start'))
    );
  }

  function missionTitle(id) {
    var m = Lab.xp.MISSIONS.filter(function (x) { return x.id === id; })[0];
    return 'Mission ' + m.n + ': ' + id;
  }

  function renderRoute(route) {
    var view;
    if (route.name === 'landing') view = renderLanding();
    else if (route.name === 'map') view = renderPlaceholder('Dependency map');
    else if (route.name === 'summary') view = renderPlaceholder('Journey summary');
    else view = renderPlaceholder(missionTitle(route.params.id));
    mount(main, view);
    if (route.name !== 'landing') store.setLastView(window.location.hash);
    Lab.a11y.focusHeading(main);
    closeRail();
    renderHeader();
    document.title = (route.name === 'landing' ? '' : main.querySelector('h1').textContent + ' · ') + 'Claude Engineering Lab';
  }

  function openRail() {
    rail.setAttribute('data-open', 'true');
    menuToggle.setAttribute('aria-expanded', 'true');
  }

  function closeRail() {
    rail.removeAttribute('data-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  function select(labelText, id, options, current, onChange) {
    var sel = h('select', { id: id });
    options.forEach(function (o) {
      var opt = h('option', { value: o[0] }, o[1]);
      if (o[0] === current) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', function () { onChange(sel.value); });
    return h('p', null, h('label', { for: id }, labelText + ' '), sel);
  }

  function buildControls() {
    var s = store.getSettings();

    var explainBtn = h('button', {
      type: 'button',
      class: 'btn',
      id: 'explain-toggle',
      'aria-pressed': s.explain === 'deeper' ? 'true' : 'false',
      onclick: function () {
        var next = store.getSettings().explain === 'deeper' ? 'simple' : 'deeper';
        store.setSetting('explain', next);
        explainBtn.setAttribute('aria-pressed', next === 'deeper' ? 'true' : 'false');
        explainBtn.textContent = next === 'deeper' ? 'Go deeper' : 'Explain simply';
        Lab.a11y.announce(next === 'deeper' ? 'Showing deeper explanations.' : 'Showing simple explanations.');
      }
    }, s.explain === 'deeper' ? 'Go deeper' : 'Explain simply');

    saveNote = h('p', { id: 'save-note' });
    confirmArea = h('div', { id: 'reset-confirm' });

    var resetBtn = h('button', { type: 'button', class: 'btn', onclick: askReset }, 'Reset progress');

    settingsPanel = h('details', { class: 'settings', id: 'settings' },
      h('summary', { class: 'btn' }, 'Settings'),
      h('div', { class: 'notice' },
        select('Theme', 'set-theme', [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']], s.theme, function (v) {
          store.setSetting('theme', v);
          Lab.a11y.applySettings(store.getSettings());
        }),
        select('Motion', 'set-motion', [['system', 'Follow system'], ['reduce', 'Reduce'], ['full', 'Full']], s.reducedMotion, function (v) {
          store.setSetting('reducedMotion', v);
          Lab.a11y.applySettings(store.getSettings());
        }),
        saveNote,
        resetBtn,
        confirmArea
      )
    );

    settingsPanel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && settingsPanel.open) {
        settingsPanel.open = false;
        settingsPanel.querySelector('summary').focus();
      }
    });

    controls.insertBefore(explainBtn, menuToggle);
    controls.insertBefore(settingsPanel, menuToggle);
  }

  function askReset() {
    mount(confirmArea, h('div', null,
      h('p', null, 'Reset all progress in this browser? This cannot be undone.'),
      h('button', {
        type: 'button',
        class: 'btn btn-primary',
        onclick: function () {
          store.reset();
          Lab.a11y.applySettings(store.getSettings());
          mount(confirmArea, null);
          Lab.a11y.announce('Progress reset.');
          Lab.router.go('#/');
        }
      }, 'Yes, reset'),
      ' ',
      h('button', { type: 'button', class: 'btn', onclick: function () { mount(confirmArea, null); } }, 'Cancel')
    ));
  }

  function boot() {
    main = document.getElementById('main');
    rail = document.getElementById('rail');
    menuToggle = document.getElementById('menu-toggle');
    xpLabel = document.getElementById('xp-label');
    headerXp = document.getElementById('header-xp');
    controls = document.getElementById('header-controls');

    buildControls();
    Lab.a11y.applySettings(store.getSettings());

    menuToggle.addEventListener('click', function () {
      if (rail.hasAttribute('data-open')) closeRail(); else openRail();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && rail.hasAttribute('data-open')) {
        closeRail();
        menuToggle.focus();
      }
    });

    Lab.router.start(renderRoute);
  }

  Lab.boot = boot;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
