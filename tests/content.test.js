(function () {
  'use strict';
  var T = window.LabTests;
  var Lab = window.Lab;

  var EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
  var COMPONENTS = ['choice', 'classifier', 'compare', 'stepper', 'terminal', 'pipeline', 'builder', 'tree'];

  function words(text) {
    return String(text || '').trim().split(/\s+/).filter(Boolean).length;
  }

  function eachMission(fn) {
    Lab.content.allMissions().forEach(fn);
  }

  function tryBeats(m) {
    return m.beats.filter(function (b) { return b.type === 'try'; });
  }

  T.test('content: Missions 0 to 2 are registered with ids from the curriculum', function () {
    var ids = Lab.content.allMissions().map(function (m) { return m.id; });
    T.eq(ids, ['orientation', 'intent', 'spec']);
    eachMission(function (m) {
      var row = Lab.xp.MISSIONS.filter(function (x) { return x.id === m.id; })[0];
      T.ok(row, m.id + ' is in the curriculum');
      T.eq(m.number, row.n, m.id + ' number');
      T.eq(m.xp, row.xp, m.id + ' xp matches the curriculum');
    });
  });

  T.test('content: required activity XP sums to the mission XP', function () {
    eachMission(function (m) {
      var sum = tryBeats(m).filter(function (b) { return b.required !== false; })
        .reduce(function (s, b) { return s + b.activity.maxXp; }, 0);
      T.eq(sum, m.xp, m.id);
    });
  });

  T.test('content: activities have prefixed unique ids, and every item has an explanation', function () {
    var seen = {};
    eachMission(function (m) {
      tryBeats(m).forEach(function (b) {
        var a = b.activity;
        T.ok(a.id.indexOf(m.id + '.') === 0, a.id + ' starts with the mission id');
        T.ok(!seen[a.id], a.id + ' is unique');
        seen[a.id] = true;
        T.ok(a.maxXp > 0, a.id + ' maxXp');
        T.ok(a.items.length > 0, a.id + ' has items');
        var itemIds = {};
        a.items.forEach(function (it) {
          T.ok(!itemIds[it.id], a.id + '/' + it.id + ' unique');
          itemIds[it.id] = true;
          T.ok(it.explanation && it.explanation.length > 10, a.id + '/' + it.id + ' explanation');
          T.ok(it.text && it.answer, a.id + '/' + it.id + ' text and answer');
        });
      });
    });
  });

  T.test('content: classifier answers always name one of the buckets', function () {
    eachMission(function (m) {
      tryBeats(m).filter(function (b) { return b.component === 'classifier'; }).forEach(function (b) {
        var buckets = Lab.ui.classifier.bucketsOf(b.activity);
        T.ok(buckets.length >= 2 && buckets.length <= 5, b.activity.id + ' has 2 to 5 buckets');
        b.activity.items.forEach(function (it) {
          T.ok(buckets.indexOf(it.answer) >= 0, b.activity.id + '/' + it.id + ' answer is a bucket');
          (it.acceptable || []).forEach(function (a) { T.ok(buckets.indexOf(a) >= 0, it.id + ' acceptable'); });
        });
      });
    });
  });

  T.test('content: every beat has at most 60 words of prose (spec 14.7)', function () {
    eachMission(function (m) {
      m.beats.forEach(function (b, i) {
        T.ok(words(b.simple) <= 60, m.id + ' beat ' + i + ' simple has ' + words(b.simple) + ' words');
        T.ok(words(b.deeper) <= 60, m.id + ' beat ' + i + ' deeper has ' + words(b.deeper) + ' words');
      });
    });
  });

  T.test('content: beat structure, components and debrief fields', function () {
    eachMission(function (m) {
      T.ok(m.beats.length >= 3, m.id + ' has beats');
      var last = m.beats[m.beats.length - 1];
      T.eq(last.type, 'debrief', m.id + ' ends with a debrief');
      T.ok(last.humanDecides && last.addsNode, m.id + ' debrief fields');
      m.beats.forEach(function (b, i) {
        T.ok(['explain', 'show', 'try', 'debrief', 'deeper'].indexOf(b.type) >= 0, m.id + ' beat type');
        T.ok(b.heading, m.id + ' beat ' + i + ' heading');
        if (b.type === 'show' || b.type === 'try') T.ok(COMPONENTS.indexOf(b.component) >= 0, m.id + ' beat ' + i + ' component');
        if (b.type === 'try') T.ok(b.activity, m.id + ' beat ' + i + ' activity');
        if (b.component && b.component !== 'terminal' && b.component !== 'pipeline' && b.component !== 'builder' && b.component !== 'tree') {
          T.ok(Lab.ui.get(b.component), m.id + ' component ' + b.component + ' is registered');
        }
      });
    });
  });

  T.test('content: review metadata fields exist (values may be null until review, GOV-08)', function () {
    eachMission(function (m) {
      T.ok('reviewedBy' in m && 'reviewedOn' in m, m.id);
      T.ok(m.reviewedBy === null || typeof m.reviewedBy === 'string', m.id + ' reviewedBy');
    });
  });

  T.test('content: no emoji or pictographs in mission, glossary or link text', function () {
    T.ok(!EMOJI.test(JSON.stringify(Lab.content.allMissions())), 'missions');
    T.ok(!EMOJI.test(JSON.stringify(Lab.content.glossary)), 'glossary');
    T.ok(!EMOJI.test(JSON.stringify(Lab.content.links)), 'links');
  });

  T.test('content: every glossary term has simple and deeper text', function () {
    T.ok(Lab.content.glossary.length > 0);
    Lab.content.glossary.forEach(function (t) {
      T.ok(t.id && t.term && t.simple && t.deeper, t.id);
    });
    eachMission(function (m) {
      m.beats.forEach(function (b) {
        (b.terms || []).forEach(function (id) { T.ok(Lab.content.term(id), m.id + ' term ' + id); });
      });
    });
  });

  T.test('content: links are https, listed once, and mission links resolve (SEC-03)', function () {
    var ids = {};
    Lab.content.links.forEach(function (l) {
      T.ok(/^https:\/\//.test(l.url), l.id + ' is https');
      T.ok(!ids[l.id], l.id + ' unique');
      ids[l.id] = true;
    });
    eachMission(function (m) {
      m.links.forEach(function (l) { T.ok(Lab.content.link(l.linkId), m.id + ' link ' + l.linkId); });
    });
  });

  T.test('content: every technical claim is recorded with a verified field (spec 16.4)', function () {
    eachMission(function (m) {
      T.ok(m.claims.length > 0, m.id + ' has claims');
      m.claims.forEach(function (c) { T.ok(c.text && 'verified' in c && 'source' in c, m.id + ' claim'); });
    });
  });

  T.test('content: Mission 0 debrief carries the verbatim pinned sentence and the AI notice', function () {
    var m = Lab.content.getMission('orientation');
    var d = m.beats[m.beats.length - 1];
    T.eq(d.simple, 'You do not need any API integration to use CLAUDE.md, Skills, Plan Mode, Hooks or subagents in normal Claude Code work.');
    T.eq(d.notice, 'ai-tools');
  });
})();
