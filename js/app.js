(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var h = Lab.dom.h;
  var mount = Lab.dom.mount;
  var store = Lab.store;

  var STAGES = ['Start', 'Plan', 'Design', 'Build', 'Test', 'Deploy', 'Maintain'];
  var STATUS_TEXT = { locked: 'Locked', available: 'Available', 'in-progress': 'In progress', complete: 'Complete' };
  var STATUS_ICON = { locked: 'lock', available: 'available', 'in-progress': 'progress', complete: 'check' };

  var main, rail, railList, menuToggle, xpLabel, headerXp, controls;
  var settingsPanel, saveNote, confirmArea, explainBtn;
  var lastExplain = null;
  var currentRoute = null;
  var asideDiagram = null;
  var tabDiagram = null;
  var activeMap = null;

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

  function renderHeader() {
    var info = Lab.xp.levelInfo(completedMap());
    var total = store.totalXp();
    xpLabel.textContent = 'Level ' + info.level + ' ' + info.title + ' · XP ' + total + ' / ' + Lab.xp.TOTAL_XP;
    var old = headerXp.querySelector('.xp-bar');
    if (old) headerXp.removeChild(old);
    var pct = Math.min(100, Math.round((total / Lab.xp.TOTAL_XP) * 100));
    var fill = h('div', { class: 'xp-fill' });
    fill.style.width = pct + '%';
    headerXp.appendChild(h('div', { class: 'xp-bar', role: 'progressbar', 'aria-label': 'Total XP', 'aria-valuemin': 0, 'aria-valuemax': Lab.xp.TOTAL_XP, 'aria-valuenow': total }, fill));
    saveNote.textContent = store.isPersistent()
      ? 'Progress is saved in this browser.'
      : 'Progress will not be saved in this browser.';
  }

  function renderRail() {
    var state = store.getState();
    var explore = store.getSettings().explore;
    var activeId = currentRoute && currentRoute.name === 'mission' ? currentRoute.params.id : null;
    var groups = STAGES.map(function (stage) {
      var list = Lab.xp.MISSIONS.filter(function (m) { return m.stage === stage; });
      if (!list.length) return null;
      var items = list.map(function (m) {
        var status = Lab.unlock.missionStatus(m.id, state, explore);
        var text = 'Mission ' + m.n + ': ' + m.title;
        var inner = [
          Lab.ui.icon(STATUS_ICON[status]),
          h('span', { class: 'rail-text' }, text),
          h('span', { class: 'rail-status' }, STATUS_TEXT[status])
        ];
        if (status === 'locked') {
          return h('li', null, h('span', { class: 'rail-link', 'data-status': status }, inner));
        }
        return h('li', null, h('a', {
          class: 'rail-link',
          href: '#/m/' + m.id,
          'data-status': status,
          'aria-current': activeId === m.id ? 'page' : null
        }, inner));
      });
      return [h('h3', { class: 'rail-stage' }, stage), h('ul', { class: 'rail-list' }, items)];
    });
    var extras = h('ul', { class: 'rail-list' },
      h('li', null, h('a', { class: 'rail-link', href: '#/' }, h('span', { class: 'rail-text' }, 'Home'))),
      h('li', null, h('a', { class: 'rail-link', href: '#/map' }, h('span', { class: 'rail-text' }, 'Dependency map'))),
      h('li', null, h('a', { class: 'rail-link', href: '#/summary' }, h('span', { class: 'rail-text' }, 'Journey summary')))
    );
    mount(railList, [extras, groups]);
  }

  function refresh() {
    renderHeader();
    renderRail();
  }

  function renderLanding() {
    var explore = store.getSettings().explore;
    var actions = h('div', { class: 'actions' },
      h('a', { class: 'btn btn-primary', href: '#/m/orientation' }, 'Start the journey')
    );
    if (hasProgress()) {
      var last = store.getLastView();
      var target = /^#\/(m\/[a-z0-9-]+(\?beat=\d+)?|map|summary)$/.test(last) ? last : '#/m/orientation';
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
      Lab.ui.simulatedNotice(),
      Lab.ui.aiNotice()
    );
  }

  function renderPlaceholder(title, message) {
    return h('div', null,
      h('h1', null, title),
      h('p', null, message || 'This view is built in a later phase.'),
      h('p', null, h('a', { href: '#/' }, 'Back to the start'))
    );
  }

  function renderMapView() {
    activeMap = Lab.ui.map.create();
    return h('div', null,
      h('h1', null, 'Dependency map'),
      h('p', null, 'How the parts of an AI-native workflow depend on each other. Lines point from a prerequisite to what depends on it.'),
      activeMap.el
    );
  }

  function tabButton(id, label, panelId, selectedFlag) {
    return h('button', {
      type: 'button', role: 'tab', id: id, 'aria-controls': panelId,
      'aria-selected': selectedFlag ? 'true' : 'false', tabindex: selectedFlag ? '0' : '-1'
    }, label);
  }

  function withSystemTab(view) {
    tabDiagram = Lab.ui.diagram.create();
    var missionPanel = h('div', { role: 'tabpanel', id: 'tab-panel-mission', 'aria-labelledby': 'tab-mission', class: 'system-panel' }, view);
    var systemPanel = h('div', { role: 'tabpanel', id: 'tab-panel-system', 'aria-labelledby': 'tab-system', class: 'system-panel', hidden: 'true' },
      h('h2', null, 'Your System'), tabDiagram.el);
    var tabMission = tabButton('tab-mission', 'Mission', 'tab-panel-mission', true);
    var tabSystem = tabButton('tab-system', 'Your System', 'tab-panel-system', false);

    function activate(which, focus) {
      var sys = which === 'system';
      tabMission.setAttribute('aria-selected', sys ? 'false' : 'true');
      tabMission.setAttribute('tabindex', sys ? '-1' : '0');
      tabSystem.setAttribute('aria-selected', sys ? 'true' : 'false');
      tabSystem.setAttribute('tabindex', sys ? '0' : '-1');
      if (sys) { missionPanel.setAttribute('hidden', 'true'); systemPanel.removeAttribute('hidden'); }
      else { systemPanel.setAttribute('hidden', 'true'); missionPanel.removeAttribute('hidden'); }
      if (focus) (sys ? tabSystem : tabMission).focus();
    }
    tabMission.addEventListener('click', function () { activate('mission'); });
    tabSystem.addEventListener('click', function () { activate('system'); });
    [tabMission, tabSystem].forEach(function (t) {
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          activate(t === tabMission ? 'system' : 'mission', true);
        }
      });
    });
    return h('div', null, h('div', { class: 'system-tabs', role: 'tablist', 'aria-label': 'Mission or Your System' }, tabMission, tabSystem), missionPanel, systemPanel);
  }

  function missionRow(id) {
    return Lab.xp.MISSIONS.filter(function (x) { return x.id === id; })[0];
  }

  function renderMissionRoute(route) {
    var row = missionRow(route.params.id);
    var status = Lab.unlock.missionStatus(row.id, store.getState(), store.getSettings().explore);
    if (status === 'locked') {
      var prev = Lab.xp.MISSIONS[row.n - 1];
      return renderPlaceholder('Mission ' + row.n + ': ' + row.title,
        'This mission unlocks after "' + prev.title + '". You can also turn on Explore freely on the start page.');
    }
    var node = Lab.content.getMission(row.id) ? Lab.mission.view(row.id, route) : null;
    return node || renderPlaceholder('Mission ' + row.n + ': ' + row.title, 'This mission is built in a later phase.');
  }

  function renderRoute(route) {
    currentRoute = route;
    Lab.mission.leave();
    tabDiagram = null;
    activeMap = null;
    var view;
    if (route.name === 'landing') view = renderLanding();
    else if (route.name === 'map') view = renderMapView();
    else if (route.name === 'summary') view = renderPlaceholder('Journey summary');
    else view = withSystemTab(renderMissionRoute(route));
    mount(main, view);
    if (route.name !== 'landing' && route.name !== 'mission') store.setLastView(window.location.hash);
    Lab.a11y.focusHeading(main);
    closeRail();
    refresh();
    var titleEl = main.querySelector('h1');
    document.title = (route.name === 'landing' || !titleEl ? '' : titleEl.textContent + ' · ') + 'Claude Engineering Lab';
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

  function syncExplainButton() {
    var deeper = store.getSettings().explain === 'deeper';
    explainBtn.setAttribute('aria-pressed', deeper ? 'true' : 'false');
    explainBtn.textContent = deeper ? 'Go deeper' : 'Explain simply';
  }

  function buildControls() {
    var s = store.getSettings();
    lastExplain = s.explain;

    explainBtn = h('button', {
      type: 'button',
      class: 'btn',
      id: 'explain-toggle',
      onclick: function () {
        var next = store.getSettings().explain === 'deeper' ? 'simple' : 'deeper';
        store.setSetting('explain', next);
        Lab.a11y.announce(next === 'deeper' ? 'Showing deeper explanations.' : 'Showing simple explanations.');
      }
    });
    syncExplainButton();

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

  function onStoreChange() {
    var explain = store.getSettings().explain;
    refresh();
    if (asideDiagram) asideDiagram.update();
    if (tabDiagram) tabDiagram.update();
    if (activeMap) activeMap.update();
    if (explain !== lastExplain) {
      lastExplain = explain;
      syncExplainButton();
      Lab.mission.rerender();
    }
  }

  function boot() {
    main = document.getElementById('main');
    rail = document.getElementById('rail');
    railList = document.getElementById('rail-list');
    menuToggle = document.getElementById('menu-toggle');
    xpLabel = document.getElementById('xp-label');
    headerXp = document.getElementById('header-xp');
    controls = document.getElementById('header-controls');

    buildControls();
    Lab.a11y.applySettings(store.getSettings());

    var sysBox = document.getElementById('system');
    var sysIntro = sysBox.querySelector('p');
    if (sysIntro) sysBox.removeChild(sysIntro);
    asideDiagram = Lab.ui.diagram.create();
    sysBox.appendChild(asideDiagram.el);

    menuToggle.addEventListener('click', function () {
      if (rail.hasAttribute('data-open')) closeRail(); else openRail();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && rail.hasAttribute('data-open')) {
        closeRail();
        menuToggle.focus();
      }
    });

    store.subscribe(onStoreChange);
    Lab.router.start(renderRoute);
  }

  Lab.boot = boot;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
