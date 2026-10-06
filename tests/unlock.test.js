(function () {
  'use strict';
  var T = window.LabTests;
  var unlock = window.Lab.unlock;

  T.test('first mission is available, the rest are locked', function () {
    var s = { missions: {} };
    T.eq(unlock.missionStatus('orientation', s, false), 'available');
    T.eq(unlock.missionStatus('intent', s, false), 'locked');
  });

  T.test('completing a mission unlocks the next', function () {
    var s = { missions: { orientation: { beat: 4, complete: true } } };
    T.eq(unlock.missionStatus('orientation', s, false), 'complete');
    T.eq(unlock.missionStatus('intent', s, false), 'available');
    T.eq(unlock.missionStatus('spec', s, false), 'locked');
  });

  T.test('a started mission is in progress', function () {
    var s = { missions: { orientation: { beat: 2, complete: false } } };
    T.eq(unlock.missionStatus('orientation', s, false), 'in-progress');
  });

  T.test('explore mode unlocks everything but keeps completion', function () {
    var s = { missions: { intent: { beat: 1, complete: true } } };
    T.eq(unlock.missionStatus('final', s, true), 'available');
    T.eq(unlock.missionStatus('intent', s, true), 'complete');
  });

  T.test('unknown mission id is locked', function () {
    T.eq(unlock.missionStatus('nope', { missions: {} }, true), 'locked');
  });

  T.test('summary needs the final mission or explore', function () {
    T.eq(unlock.summaryAvailable({ missions: {} }, false), false);
    T.eq(unlock.summaryAvailable({ missions: { final: { beat: 5, complete: true } } }, false), true);
    T.eq(unlock.summaryAvailable({ missions: {} }, true), true);
  });

  T.test('map nodes unlock when their mission is complete or in explore', function () {
    var s = { missions: { intent: { beat: 3, complete: true } } };
    T.eq(unlock.nodeUnlocked('intent', s, false), true);
    T.eq(unlock.nodeUnlocked('spec', s, false), false);
    T.eq(unlock.nodeUnlocked('spec', s, true), true);
  });
})();
