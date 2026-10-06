(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var h = Lab.dom.h;

  function missionTitle(id) {
    var row = Lab.xp.MISSIONS.filter(function (m) { return m.id === id; })[0];
    return 'Mission ' + row.n + ': ' + row.title;
  }

  // Pure: which of the 23 criteria are covered, given the state's missions map.
  function criteriaStatus(criteria, missions) {
    return criteria.map(function (c) {
      var done = c.missions.every(function (id) { return !!(missions[id] && missions[id].complete); });
      return { n: c.n, text: c.text, missions: c.missions, covered: done };
    });
  }

  // opts.store lets tests inject a store.
  function view(opts) {
    var st = (opts && opts.store) || Lab.store;
    var state = st.getState();
    var explore = st.getSettings().explore;
    var say = Lab.coach.say;

    if (!Lab.unlock.summaryAvailable(state, explore)) {
      return { el: h('div', null,
        h('h1', null, 'Journey summary'),
        h('p', null, 'The summary unlocks when you complete Mission 14, the final challenge. You can also turn on Explore freely on the start page.'),
        h('p', null, h('a', { href: '#/m/final' }, 'Go to the final challenge'), ' or ', h('a', { href: '#/' }, 'back to the start'))
      ), diagrams: [] };
    }

    var completed = {};
    Object.keys(state.missions).forEach(function (id) { if (state.missions[id].complete) completed[id] = true; });
    var info = Lab.xp.levelInfo(completed);
    var total = st.totalXp();
    var doneCount = Object.keys(completed).length;

    var diagram = Lab.ui.diagram.create({ store: st, showHumans: true });

    var intentPre = h('pre', { class: 'cl-artifact-text', tabindex: '0', 'aria-label': 'The final intent.md' }, Lab.content.finalIntent);
    var skillText = st.getSkillDescription();

    var status = criteriaStatus(Lab.content.criteria, state.missions);
    var covered = status.filter(function (s) { return s.covered; }).length;

    var el = h('div', { class: 'summary' },
      h('h1', null, 'Journey summary'),
      h('section', { class: 'sum-block', 'aria-labelledby': 'sum-where' },
        h('h2', { id: 'sum-where' }, 'Where you got to'),
        h('p', { class: 'sum-level' }, h('strong', null, 'Level ' + info.level + ': ' + info.title)),
        h('p', null, 'XP ' + total + ' of ' + Lab.xp.TOTAL_XP + '. ' + doneCount + ' of ' + Lab.xp.MISSIONS.length + ' missions complete.')),
      h('section', { class: 'sum-block', 'aria-labelledby': 'sum-system' },
        h('h2', { id: 'sum-system' }, 'Your System, with the human decisions shown'),
        diagram.el),
      h('section', { class: 'sum-block', 'aria-labelledby': 'sum-intent' },
        h('h2', { id: 'sum-intent' }, 'The new intent.md the loop produced'),
        intentPre,
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'btn', onclick: function () { Lab.ui.files.copyText(Lab.content.finalIntent, intentPre, say); } }, 'Copy intent.md'),
          h('button', { type: 'button', class: 'btn', onclick: function () { Lab.ui.files.downloadText('intent.md', Lab.content.finalIntent, say); } }, 'Download intent.md'))),
      h('section', { class: 'sum-block', 'aria-labelledby': 'sum-skill' },
        h('h2', { id: 'sum-skill' }, 'Your Skill'),
        skillText
          ? h('p', null, 'Your description is ready inside a complete SKILL.md.')
          : h('p', null, 'You have not written a Skill description yet. ', h('a', { href: '#/m/skills' }, 'Write one in Mission 5'), ' to export it here.'),
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'btn', 'aria-disabled': skillText ? null : 'true', onclick: function () {
            if (!skillText) { say('info', 'Write a description in Mission 5 first.'); return; }
            Lab.ui.files.downloadText('SKILL.md', Lab.skills.buildSkillMd(skillText), say);
          } }, 'Download SKILL.md'))),
      h('section', { class: 'sum-block', 'aria-labelledby': 'sum-criteria' },
        h('h2', { id: 'sum-criteria' }, 'What you can now explain'),
        h('p', null, covered + ' of ' + status.length + ' covered by the missions you completed.'),
        h('ul', { class: 'sum-criteria' }, status.map(function (s) {
          return h('li', { class: 'sum-criterion', 'data-covered': s.covered ? 'true' : 'false' },
            Lab.ui.icon(s.covered ? 'check' : 'circle'),
            h('strong', { class: 'sum-state' }, ' ' + (s.covered ? 'COVERED' : 'NOT YET') + ' '),
            h('span', null, s.n + '. ' + s.text),
            h('span', { class: 'sum-missions' }, ' (' + s.missions.map(missionTitle).join('; ') + ')'));
        }))),
      h('section', { class: 'sum-block', 'aria-labelledby': 'sum-first' },
        h('h2', { id: 'sum-first' }, 'What I should introduce first, why, and what comes next'),
        h('dl', { class: 'cards' }, Lab.content.firstSteps.reduce(function (acc, f) {
          return acc.concat([h('dt', null, f.title), h('dd', null, f.text)]);
        }, [])))
    );
    return { el: el, diagrams: [diagram] };
  }

  Lab.summary = { view: view, criteriaStatus: criteriaStatus };
})();
