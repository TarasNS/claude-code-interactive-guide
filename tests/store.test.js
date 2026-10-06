(function () {
  'use strict';
  var T = window.LabTests;
  var Lab = window.Lab;

  function memoryStorage(initial) {
    var data = {};
    if (initial) Object.keys(initial).forEach(function (k) { data[k] = initial[k]; });
    return {
      data: data,
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
      setItem: function (k, v) { data[k] = String(v); },
      removeItem: function (k) { delete data[k]; }
    };
  }

  function throwingStorage() {
    function boom() { throw new Error('SecurityError'); }
    return { getItem: boom, setItem: boom, removeItem: boom };
  }

  T.test('store round-trip: state survives a reload', function () {
    var storage = memoryStorage();
    var a = Lab.store.create({ storage: storage });
    a.setSetting('theme', 'dark');
    a.setBeat('intent', 2);
    a.recordAttempt('intent.build', { correct: true, maxXp: 20 });
    a.completeMission('orientation');
    a.setSkillDescription('Reviews endpoints. Use when adding an API.');
    var b = Lab.store.create({ storage: storage });
    T.eq(b.getSettings().theme, 'dark');
    T.eq(b.getState().missions.intent.beat, 2);
    T.eq(b.getActivity('intent.build'), { attempts: 1, done: true, xp: 20 });
    T.eq(b.isMissionComplete('orientation'), true);
    T.eq(b.getSkillDescription(), 'Reviews endpoints. Use when adding an API.');
    T.eq(b.totalXp(), 20);
  });

  T.test('store writes under the versioned key cclab.v1', function () {
    var storage = memoryStorage();
    var s = Lab.store.create({ storage: storage });
    s.setSetting('explain', 'deeper');
    T.ok(storage.data['cclab.v1'], 'key written');
    T.eq(JSON.parse(storage.data['cclab.v1']).v, 1);
  });

  T.test('XP is derived and never awarded twice', function () {
    var s = Lab.store.create({ storage: memoryStorage() });
    var first = s.recordAttempt('context.classify', { correct: false, maxXp: 20 });
    T.eq(first, { awarded: 0, done: false });
    var second = s.recordAttempt('context.classify', { correct: true, maxXp: 20 });
    T.eq(second, { awarded: 15, done: true });
    var replay = s.recordAttempt('context.classify', { correct: true, maxXp: 20 });
    T.eq(replay, { awarded: 0, done: true });
    T.eq(s.totalXp(), 15);
    T.ok(!('totalXp' in s.getState()), 'total XP is not stored');
  });

  T.test('level is derived from completed missions', function () {
    var s = Lab.store.create({ storage: memoryStorage() });
    T.eq(s.level(), 0);
    s.completeMission('orientation');
    s.completeMission('intent');
    T.eq(s.level(), 1);
  });

  T.test('unknown schema version asks for reset instead of crashing', function () {
    var storage = memoryStorage({ 'cclab.v1': JSON.stringify({ v: 99, settings: {} }) });
    var s = Lab.store.create({ storage: storage });
    T.eq(s.needsReset(), true);
    T.eq(s.totalXp(), 0);
    s.reset();
    T.eq(s.needsReset(), false);
    T.eq(storage.getItem('cclab.v1'), null);
  });

  T.test('corrupt JSON asks for reset', function () {
    var s = Lab.store.create({ storage: memoryStorage({ 'cclab.v1': '{not json' }) });
    T.eq(s.needsReset(), true);
  });

  T.test('migration hook: current version loads and bad fields are sanitised', function () {
    var raw = { v: 1, settings: { theme: 'neon', explain: 'deeper', explore: 'yes' }, missions: { x: 5 }, activities: { a: { attempts: -3, done: 'true', xp: 'lots' } } };
    var s = Lab.store.create({ storage: memoryStorage({ 'cclab.v1': JSON.stringify(raw) }) });
    T.eq(s.needsReset(), false);
    T.eq(s.getSettings(), { explain: 'deeper', theme: 'system', reducedMotion: 'system', explore: false });
    T.eq(s.getActivity('a'), { attempts: 0, done: false, xp: 0 });
    T.eq(s.getState().missions, {});
  });

  T.test('in-memory fallback when storage is missing', function () {
    var s = Lab.store.create({ storage: null });
    T.eq(s.isPersistent(), false);
    s.completeMission('orientation');
    T.eq(s.isMissionComplete('orientation'), true);
  });

  T.test('in-memory fallback when storage throws', function () {
    var s = Lab.store.create({ storage: throwingStorage() });
    T.eq(s.isPersistent(), false);
    s.setSetting('theme', 'light');
    s.recordAttempt('a.b', { correct: true, maxXp: 10 });
    T.eq(s.getSettings().theme, 'light');
    T.eq(s.totalXp(), 10);
  });

  T.test('storage that fails on write keeps working in memory', function () {
    var storage = memoryStorage();
    storage.setItem = function () { throw new Error('QuotaExceededError'); };
    var s = Lab.store.create({ storage: storage });
    s.completeMission('orientation');
    T.eq(s.isPersistent(), false);
    T.eq(s.isMissionComplete('orientation'), true);
  });

  T.test('setSetting rejects invalid values and subscribe notifies', function () {
    var s = Lab.store.create({ storage: memoryStorage() });
    var calls = 0;
    var off = s.subscribe(function () { calls += 1; });
    T.eq(s.setSetting('theme', 'neon'), false);
    T.eq(s.setSetting('bogus', 'x'), false);
    T.eq(calls, 0);
    s.setSetting('theme', 'dark');
    T.eq(calls, 1);
    off();
    s.setSetting('theme', 'light');
    T.eq(calls, 1);
  });

  T.test('reset clears the key', function () {
    var storage = memoryStorage();
    var s = Lab.store.create({ storage: storage });
    s.completeMission('orientation');
    T.ok(storage.getItem('cclab.v1') !== null);
    s.reset();
    T.eq(storage.getItem('cclab.v1'), null);
    T.eq(s.isMissionComplete('orientation'), false);
  });
})();
