(function () {
  'use strict';
  var T = window.LabTests;
  var xp = window.Lab.xp;

  function done(upTo) {
    var map = {};
    xp.MISSIONS.forEach(function (m) { if (m.n <= upTo) map[m.id] = true; });
    return map;
  }

  T.test('mission XP totals exactly 500', function () {
    T.eq(xp.TOTAL_XP, 500);
    T.eq(xp.MISSIONS.length, 15);
  });

  T.test('XP decay: first try, one wrong, floor at 25%', function () {
    T.eq(xp.activityXp(20, 0), 20);
    T.eq(xp.activityXp(20, 1), 15);
    T.eq(xp.activityXp(20, 2), 10);
    T.eq(xp.activityXp(20, 3), 5);
    T.eq(xp.activityXp(20, 9), 5);
    T.eq(xp.activityXp(30, 1), 23);
  });

  T.test('total XP sums only finished activities', function () {
    T.eq(xp.totalXp({ a: { done: true, xp: 15 }, b: { done: false, xp: 9 }, c: { done: true, xp: 5 } }), 20);
    T.eq(xp.totalXp({}), 0);
  });

  T.test('level thresholds match the level table', function () {
    T.eq(xp.levelFor({}), 0);
    T.eq(xp.levelFor(done(0)), 0);
    T.eq(xp.levelFor(done(1)), 1);
    T.eq(xp.levelFor(done(2)), 2);
    T.eq(xp.levelFor(done(5)), 4);
    T.eq(xp.levelFor(done(6)), 5);
    T.eq(xp.levelFor(done(12)), 10);
    T.eq(xp.levelFor(done(13)), 10);
    T.eq(xp.levelFor(done(14)), 11);
  });

  T.test('a level needs every earlier mission, not just its own', function () {
    var skipped = done(14);
    delete skipped.intent;
    T.eq(xp.levelFor(skipped), 0);
  });

  T.test('cumulative XP per level equals the sum of missions up to it', function () {
    xp.LEVELS.forEach(function (lv) {
      var sum = xp.MISSIONS.filter(function (m) { return m.n <= lv.through; })
        .reduce(function (s, m) { return s + m.xp; }, 0);
      T.eq(lv.cumulativeXp, sum, 'level ' + lv.level);
    });
    T.eq(xp.LEVELS.length, 11);
  });

  T.test('levelInfo reports title and next target', function () {
    var info = xp.levelInfo(done(1));
    T.eq(info.level, 1);
    T.eq(info.title, 'Intent Explorer');
    T.eq(info.nextTitle, 'Spec Designer');
    T.eq(info.targetXp, 70);
    T.eq(xp.levelInfo(done(14)).nextTitle, null);
  });
})();
