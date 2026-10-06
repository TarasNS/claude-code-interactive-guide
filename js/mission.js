(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var h = Lab.dom.h;
  var mount = Lab.dom.mount;

  var STAGE_LABEL = { start: 'Start', plan: 'Plan', design: 'Design', build: 'Build', test: 'Test', deploy: 'Deploy', maintain: 'Maintain' };

  // ---- pure helpers -------------------------------------------------------

  function requiredActivityIds(mission) {
    return mission.beats
      .filter(function (b) { return b.type === 'try' && b.required !== false && b.activity; })
      .map(function (b) { return b.activity.id; });
  }

  function isMissionDone(mission, getActivity) {
    return requiredActivityIds(mission).every(function (id) {
      var a = getActivity(id);
      return !!(a && a.done);
    });
  }

  function visibleIndices(mission, explain) {
    var out = [];
    mission.beats.forEach(function (b, i) {
      if (b.type !== 'deeper' || explain === 'deeper') out.push(i);
    });
    return out;
  }

  function levelContributed(n) {
    var levels = Lab.xp.LEVELS;
    for (var i = 0; i < levels.length; i++) if (n <= levels[i].through) return levels[i];
    return levels[levels.length - 1];
  }

  // ---- view ---------------------------------------------------------------

  var active = null;
  var componentState = {};

  function activityDone(id) {
    var a = Lab.store.getActivity(id);
    return !!(a && a.done);
  }

  function beatTitleBlock(mission) {
    var lv = levelContributed(mission.number);
    return h('header', { class: 'mission-head' },
      h('p', { class: 'mission-kicker' }, (STAGE_LABEL[mission.stage] || mission.stage) + ' · Mission ' + mission.number),
      h('h1', null, mission.title),
      h('p', { class: 'mission-meta' }, 'Counts toward level ' + lv.level + ': ' + lv.title + ' · about ' + mission.minutes + ' minutes · ' + mission.xp + ' XP')
    );
  }

  function proseFor(beat, explain) {
    var out = [];
    if (beat.simple) out.push(h('p', { class: 'beat-text' }, beat.simple));
    if (beat.type === 'deeper' && beat.deeper) {
      out.push(h('p', { class: 'beat-text' }, beat.deeper));
    } else if (explain === 'deeper' && beat.deeper) {
      out.push(h('p', { class: 'beat-text beat-deeper' }, h('strong', null, 'Deeper: '), beat.deeper));
    }
    return out;
  }

  function termsFor(beat, explain) {
    if (!beat.terms || !beat.terms.length) return null;
    var items = [];
    beat.terms.forEach(function (id) {
      var t = Lab.content.term(id);
      if (!t) return;
      items.push(h('dt', null, t.term));
      items.push(h('dd', null, explain === 'deeper' ? t.simple + ' ' + t.deeper : t.simple));
    });
    return items.length ? h('dl', { class: 'terms' }, items) : null;
  }

  function extrasFor(beat) {
    var out = [];
    (beat.notes || []).forEach(function (n) { out.push(h('p', { class: 'beat-text beat-note' }, n)); });
    if (beat.cards && beat.cards.length) {
      var items = [];
      beat.cards.forEach(function (c) {
        items.push(h('dt', null, c.title));
        items.push(h('dd', null, c.text));
      });
      out.push(h('dl', { class: 'cards' }, items));
    }
    return out;
  }

  function downloadBlock(beat) {
    if (beat.download !== 'skill-md') return null;
    var text = function () { return Lab.skills.buildSkillMd(Lab.store.getSkillDescription() || Lab.skills.START); };
    var problems = Lab.skills.checkSkillMd(text());
    return h('div', { class: 'download-box' },
      h('p', { class: 'beat-text' }, Lab.store.getSkillDescription()
        ? 'Your description is inside a complete SKILL.md.'
        : 'You have not written a description yet, so the file uses the vague starting one. Complete the description lab first.'),
      h('button', { type: 'button', class: 'btn btn-primary', onclick: function () { Lab.ui.textlab.download('SKILL.md', text(), Lab.coach.say); } }, 'Download SKILL.md'),
      problems.length ? h('p', { class: 'beat-note' }, 'The file has problems: ' + problems.join(', ')) : null
    );
  }

  function mountComponent(mission, beatIndex, beat, explain) {
    var factory = Lab.ui.get(beat.component);
    if (!factory) return h('p', null, 'This activity type is built in a later phase.');
    var key = mission.id + ':' + beatIndex;
    var activity = beat.activity || null;
    var done = activity ? activityDone(activity.id) : false;
    var made = factory({
      config: beat.config || {},
      activity: activity,
      explain: explain,
      done: done,
      initialState: componentState[key] || null,
      store: Lab.store,
      onState: function (s) { componentState[key] = s; },
      onResult: function (r) { handleResult(mission, beat, r); }
    });
    active.destroy = made.destroy || null;
    return made.el;
  }

  function handleResult(mission, beat, result) {
    var activity = beat.activity;
    var outcome = Lab.store.recordAttempt(activity.id, { correct: result.correct, maxXp: activity.maxXp });
    if (result.correct && outcome.awarded > 0) {
      var msg = '+' + outcome.awarded + ' XP: ' + beat.heading;
      Lab.coach.appendExtra(msg);
    }
    if (result.correct) updateNav();
  }

  function debriefBlock(mission, beat) {
    var parts = [];
    parts.push(h('p', { class: 'debrief-line' }, h('strong', null, 'Adds to Your System: '), beat.addsNode));
    parts.push(h('p', { class: 'debrief-line' }, h('strong', null, 'You still decide: '), beat.humanDecides));
    if (beat.notice === 'ai-tools') parts.push(Lab.ui.aiNotice());
    if (mission.links && mission.links.length) {
      var list = mission.links.map(function (l) {
        var link = Lab.content.link(l.linkId);
        if (!link) return null;
        return h('li', null, h('a', { href: link.url, target: '_blank', rel: 'noopener noreferrer' }, l.label || link.label));
      });
      parts.push(h('section', { class: 'readmore', 'aria-labelledby': 'readmore-title' },
        h('h3', { id: 'readmore-title' }, 'Read more'),
        h('ul', null, list)));
    }
    return parts;
  }

  function dots(mission, visible, current) {
    var pos = visible.indexOf(current);
    return h('div', { class: 'beat-progress' },
      h('p', { class: 'beat-count' }, 'Beat ' + (pos + 1) + ' of ' + visible.length),
      h('ol', { class: 'dots', 'aria-hidden': 'true' }, visible.map(function (i) {
        return h('li', { class: 'dot', 'data-state': i === current ? 'current' : (visible.indexOf(i) < pos ? 'past' : 'ahead') });
      }))
    );
  }

  function renderBeat(focus) {
    var s = active;
    var mission = s.mission;
    var explain = Lab.store.getSettings().explain;
    var visible = visibleIndices(mission, explain);
    if (visible.indexOf(s.beat) < 0) {
      var back = visible.filter(function (i) { return i <= s.beat; });
      s.beat = back.length ? back[back.length - 1] : visible[0];
    }
    if (s.destroy) { s.destroy(); s.destroy = null; }
    Lab.coach.reset();

    var beat = mission.beats[s.beat];
    var body = [h('h2', { class: 'beat-heading', tabindex: '-1' }, beat.heading)];
    body = body.concat(proseFor(beat, explain));
    var terms = termsFor(beat, explain);
    if (terms) body.push(terms);
    if (beat.caption) body.push(h('p', { class: 'beat-caption' }, beat.caption));
    if (beat.simulated) body.push(h('p', { class: 'beat-simulated' }, h('strong', null, 'Simulated'), ' - scripted example, no model is called.'));
    if (beat.component) body.push(mountComponent(mission, s.beat, beat, explain));
    body = body.concat(extrasFor(beat));
    if (beat.type === 'debrief') {
      var dl = downloadBlock(beat);
      if (dl) body.push(dl);
      body = body.concat(debriefBlock(mission, beat));
    }

    mount(s.beatBox, [dots(mission, visible, s.beat), h('section', { class: 'beat', 'data-type': beat.type }, body)]);
    if (beat.deeper && beat.type !== 'deeper') Lab.coach.setWhy(beat.deeper);

    if (beat.type === 'debrief') completeIfDone(mission);
    updateNav();
    Lab.store.setBeat(mission.id, s.beat);
    var hash = '#/m/' + mission.id + '?beat=' + s.beat;
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
    Lab.store.setLastView(hash);

    if (focus) {
      var hd = s.beatBox.querySelector('.beat-heading');
      if (hd) hd.focus();
    }
  }

  function completeIfDone(mission) {
    if (Lab.store.isMissionComplete(mission.id)) return;
    if (!isMissionDone(mission, Lab.store.getActivity)) return;
    var before = Lab.store.level();
    Lab.store.completeMission(mission.id);
    var after = Lab.store.level();
    if (after > before) {
      var lv = Lab.xp.LEVELS[after - 1];
      active.levelBanner = 'Level ' + after + ' reached: ' + lv.title;
      Lab.coach.say('info', active.levelBanner);
      var banner = h('div', { class: 'notice level-banner', role: 'status' }, h('strong', null, active.levelBanner));
      active.beatBox.insertBefore(banner, active.beatBox.firstChild);
    } else {
      Lab.coach.say('info', 'Mission complete.');
    }
  }

  function updateNav() {
    var s = active;
    var mission = s.mission;
    var explain = Lab.store.getSettings().explain;
    var visible = visibleIndices(mission, explain);
    var pos = visible.indexOf(s.beat);
    var beat = mission.beats[s.beat];
    var isLast = pos === visible.length - 1;
    var gated = beat.type === 'try' && beat.required !== false && beat.activity && !activityDone(beat.activity.id) && !s.skipped[beat.activity.id];
    var nextMission = Lab.xp.MISSIONS.filter(function (m) { return m.n === mission.number + 1; })[0];

    var next = {
      label: isLast ? (nextMission ? 'Next mission' : 'Finish') : 'Continue',
      enabled: !gated,
      reason: 'Complete the activity to continue.',
      onClick: function () {
        if (isLast) {
          Lab.router.go(nextMission ? '#/m/' + nextMission.id : '#/');
        } else {
          s.beat = visible[pos + 1];
          renderBeat(true);
        }
      }
    };
    var skip = null;
    if (gated && Lab.store.getSettings().explore) {
      skip = function () {
        s.skipped[beat.activity.id] = true;
        Lab.coach.say('info', 'Skipped. No XP is awarded for a skipped activity, and the mission stays open until you complete it.');
        updateNav();
      };
    }
    Lab.coach.setNav({
      back: pos > 0 ? function () { s.beat = visible[pos - 1]; renderBeat(true); } : null,
      next: next,
      skip: skip
    });
  }

  function view(id, route) {
    var mission = Lab.content.getMission(id);
    if (!mission) return null;
    var wrap = h('div', { class: 'mission' });
    var beatBox = h('div', { class: 'beat-box' });
    var startBeat = route && route.query && route.query.beat !== undefined ? parseInt(route.query.beat, 10) : (Lab.store.getState().missions[id] || {}).beat;
    if (!(startBeat >= 0 && startBeat < mission.beats.length)) startBeat = 0;
    active = { mission: mission, beat: startBeat, beatBox: beatBox, skipped: {}, destroy: null, levelBanner: null };
    wrap.appendChild(beatTitleBlock(mission));
    wrap.appendChild(beatBox);
    renderBeat(false);
    return wrap;
  }

  function rerender() {
    if (active && active.beatBox && active.beatBox.isConnected) renderBeat(false);
  }

  function leave() {
    if (active && active.destroy) active.destroy();
    active = null;
    Lab.coach.reset();
  }

  Lab.mission = {
    view: view,
    rerender: rerender,
    leave: leave,
    requiredActivityIds: requiredActivityIds,
    isMissionDone: isMissionDone,
    visibleIndices: visibleIndices,
    levelContributed: levelContributed
  };
})();
