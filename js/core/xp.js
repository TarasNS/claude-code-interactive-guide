(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});

  var MISSIONS = [
    { id: 'orientation', n: 0, stage: 'Start', xp: 10 },
    { id: 'intent', n: 1, stage: 'Plan', xp: 30 },
    { id: 'spec', n: 2, stage: 'Design', xp: 30 },
    { id: 'plan', n: 3, stage: 'Build', xp: 40 },
    { id: 'context', n: 4, stage: 'Build', xp: 30 },
    { id: 'skills', n: 5, stage: 'Build', xp: 60 },
    { id: 'hooks', n: 6, stage: 'Build', xp: 30 },
    { id: 'agents', n: 7, stage: 'Build', xp: 40 },
    { id: 'feedback', n: 8, stage: 'Test', xp: 30 },
    { id: 'evals', n: 9, stage: 'Test', xp: 30 },
    { id: 'review', n: 10, stage: 'Deploy', xp: 30 },
    { id: 'gates', n: 11, stage: 'Deploy', xp: 30 },
    { id: 'pipeline', n: 12, stage: 'Deploy', xp: 30 },
    { id: 'loop', n: 13, stage: 'Maintain', xp: 30 },
    { id: 'final', n: 14, stage: 'Maintain', xp: 50 }
  ];

  // A level is reached once every mission up to and including `through` is complete.
  var LEVELS = [
    { level: 1, title: 'Intent Explorer', through: 1, cumulativeXp: 40 },
    { level: 2, title: 'Spec Designer', through: 2, cumulativeXp: 70 },
    { level: 3, title: 'Claude Planner', through: 3, cumulativeXp: 110 },
    { level: 4, title: 'Context Builder', through: 4, cumulativeXp: 140 },
    { level: 5, title: 'Skill Builder', through: 6, cumulativeXp: 230 },
    { level: 6, title: 'Agent Orchestrator', through: 7, cumulativeXp: 270 },
    { level: 7, title: 'Feedback Engineer', through: 8, cumulativeXp: 300 },
    { level: 8, title: 'Eval Engineer', through: 9, cumulativeXp: 330 },
    { level: 9, title: 'AI Reviewer', through: 10, cumulativeXp: 360 },
    { level: 10, title: 'Release Engineer', through: 12, cumulativeXp: 420 },
    { level: 11, title: 'Loop Architect', through: 14, cumulativeXp: 500 }
  ];

  var TOTAL_XP = MISSIONS.reduce(function (sum, m) { return sum + m.xp; }, 0);

  function activityXp(maxXp, wrongAttempts) {
    var wrong = Math.max(0, wrongAttempts | 0);
    var raw = Math.max(0.25 * maxXp, maxXp * (1 - 0.25 * wrong));
    return Math.round(raw);
  }

  function totalXp(activities) {
    var sum = 0;
    Object.keys(activities || {}).forEach(function (id) {
      var a = activities[id];
      if (a && a.done && typeof a.xp === 'number') sum += a.xp;
    });
    return sum;
  }

  function isComplete(completed, id) {
    return !!(completed && completed[id]);
  }

  function levelFor(completed) {
    var reached = 0;
    LEVELS.forEach(function (lv) {
      var all = MISSIONS.every(function (m) { return m.n > lv.through || isComplete(completed, m.id); });
      if (all && lv.level === reached + 1) reached = lv.level;
    });
    return reached;
  }

  function levelInfo(completed) {
    var level = levelFor(completed);
    var current = level > 0 ? LEVELS[level - 1] : null;
    var next = level < LEVELS.length ? LEVELS[level] : null;
    return {
      level: level,
      title: current ? current.title : 'Getting started',
      nextTitle: next ? next.title : null,
      floorXp: current ? current.cumulativeXp : 0,
      targetXp: next ? next.cumulativeXp : TOTAL_XP
    };
  }

  Lab.xp = {
    MISSIONS: MISSIONS,
    LEVELS: LEVELS,
    TOTAL_XP: TOTAL_XP,
    activityXp: activityXp,
    totalXp: totalXp,
    levelFor: levelFor,
    levelInfo: levelInfo
  };
})();
