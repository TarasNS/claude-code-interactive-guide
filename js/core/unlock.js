(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});

  function indexOf(id) {
    var list = Lab.xp.MISSIONS;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return i;
    return -1;
  }

  // state: { missions: { id: { beat, complete } } }
  function missionStatus(id, state, explore) {
    var i = indexOf(id);
    if (i < 0) return 'locked';
    var rec = state && state.missions && state.missions[id];
    if (rec && rec.complete) return 'complete';
    var list = Lab.xp.MISSIONS;
    var prev = i === 0 ? null : state && state.missions && state.missions[list[i - 1].id];
    var available = !!explore || i === 0 || !!(prev && prev.complete);
    if (!available) return 'locked';
    if (rec) return 'in-progress';
    return 'available';
  }

  function isMissionUnlocked(id, state, explore) {
    return missionStatus(id, state, explore) !== 'locked';
  }

  function summaryAvailable(state, explore) {
    var rec = state && state.missions && state.missions.final;
    return !!explore || !!(rec && rec.complete);
  }

  function nodeUnlocked(missionId, state, explore) {
    var rec = state && state.missions && state.missions[missionId];
    return !!explore || !!(rec && rec.complete);
  }

  Lab.unlock = {
    missionStatus: missionStatus,
    isMissionUnlocked: isMissionUnlocked,
    summaryAvailable: summaryAvailable,
    nodeUnlocked: nodeUnlocked
  };
})();
