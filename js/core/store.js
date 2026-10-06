(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});

  var KEY = 'cclab.v1';
  var VERSION = 1;
  var THEMES = ['system', 'light', 'dark'];
  var EXPLAIN = ['simple', 'deeper'];
  var MOTION = ['system', 'reduce', 'full'];

  // Migrations keyed by the version they upgrade FROM. None exist yet.
  var MIGRATIONS = {};

  function defaults() {
    return {
      v: VERSION,
      settings: { explain: 'simple', theme: 'system', reducedMotion: 'system', explore: false },
      missions: {},
      activities: {},
      skillDescription: '',
      lastView: '#/',
      updatedAt: null
    };
  }

  function pick(value, allowed, fallback) {
    return allowed.indexOf(value) >= 0 ? value : fallback;
  }

  function isObject(x) {
    return x !== null && typeof x === 'object' && !Array.isArray(x);
  }

  function sanitize(raw) {
    var s = defaults();
    var st = isObject(raw.settings) ? raw.settings : {};
    s.settings.explain = pick(st.explain, EXPLAIN, 'simple');
    s.settings.theme = pick(st.theme, THEMES, 'system');
    s.settings.reducedMotion = pick(st.reducedMotion, MOTION, 'system');
    s.settings.explore = st.explore === true;
    if (isObject(raw.missions)) {
      Object.keys(raw.missions).forEach(function (id) {
        var m = raw.missions[id];
        if (!isObject(m)) return;
        s.missions[id] = { beat: Math.max(0, m.beat | 0), complete: m.complete === true };
      });
    }
    if (isObject(raw.activities)) {
      Object.keys(raw.activities).forEach(function (id) {
        var a = raw.activities[id];
        if (!isObject(a)) return;
        s.activities[id] = {
          attempts: Math.max(0, a.attempts | 0),
          done: a.done === true,
          xp: typeof a.xp === 'number' && a.xp >= 0 ? a.xp : 0
        };
        if (a.hints) s.activities[id].hints = Math.max(0, a.hints | 0);
      });
    }
    s.skillDescription = typeof raw.skillDescription === 'string' ? raw.skillDescription : '';
    s.lastView = typeof raw.lastView === 'string' ? raw.lastView : '#/';
    s.updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : null;
    return s;
  }

  function migrate(raw) {
    var cur = raw;
    while (isObject(cur) && cur.v !== VERSION) {
      var step = MIGRATIONS[cur.v];
      if (!step) return null;
      cur = step(cur);
    }
    return isObject(cur) ? sanitize(cur) : null;
  }

  function defaultStorage() {
    try { return window.localStorage; } catch (e) { return null; }
  }

  function create(options) {
    options = options || {};
    var key = options.key || KEY;
    var storage = options.storage === undefined ? defaultStorage() : options.storage;
    var persistent = !!storage;
    var needsReset = false;
    var listeners = [];
    var state = load();

    function load() {
      if (!storage) return defaults();
      var text;
      try {
        text = storage.getItem(key);
      } catch (e) {
        persistent = false;
        return defaults();
      }
      if (text === null || text === undefined) return defaults();
      var parsed;
      try { parsed = JSON.parse(text); } catch (e) { needsReset = true; return defaults(); }
      var migrated = migrate(parsed);
      if (!migrated) { needsReset = true; return defaults(); }
      return migrated;
    }

    function save() {
      state.updatedAt = new Date().toISOString();
      if (persistent && storage) {
        try { storage.setItem(key, JSON.stringify(state)); } catch (e) { persistent = false; }
      }
      listeners.slice().forEach(function (fn) { fn(state); });
    }

    function getSettings() {
      return {
        explain: state.settings.explain,
        theme: state.settings.theme,
        reducedMotion: state.settings.reducedMotion,
        explore: state.settings.explore
      };
    }

    function setSetting(k, v) {
      var allowed = { explain: EXPLAIN, theme: THEMES, reducedMotion: MOTION };
      if (k === 'explore') {
        state.settings.explore = v === true;
      } else if (allowed[k] && allowed[k].indexOf(v) >= 0) {
        state.settings[k] = v;
      } else {
        return false;
      }
      save();
      return true;
    }

    function getActivity(id) {
      var a = state.activities[id];
      return a ? { attempts: a.attempts, done: a.done, xp: a.xp } : null;
    }

    function recordHint(id) {
      var a = state.activities[id] || { attempts: 0, done: false, xp: 0 };
      a.hints = (a.hints | 0) + 1;
      state.activities[id] = a;
      save();
    }

    function recordAttempt(id, result) {
      var a = state.activities[id] || { attempts: 0, done: false, xp: 0 };
      if (a.done) return { awarded: 0, done: true };
      var awarded = 0;
      if (result && result.correct === true) {
        awarded = Lab.xp.activityXp(result.maxXp, a.attempts);
        a.done = true;
        a.xp = awarded;
      }
      a.attempts += 1;
      state.activities[id] = a;
      save();
      return { awarded: awarded, done: a.done };
    }

    function setBeat(id, beat) {
      var m = state.missions[id] || { beat: 0, complete: false };
      m.beat = Math.max(0, beat | 0);
      state.missions[id] = m;
      save();
    }

    function completeMission(id) {
      var m = state.missions[id] || { beat: 0, complete: false };
      m.complete = true;
      state.missions[id] = m;
      save();
    }

    function isMissionComplete(id) {
      return !!(state.missions[id] && state.missions[id].complete);
    }

    function completedMap() {
      var map = {};
      Object.keys(state.missions).forEach(function (id) {
        if (state.missions[id].complete) map[id] = true;
      });
      return map;
    }

    function setLastView(hash) {
      state.lastView = hash;
      save();
    }

    function reset() {
      state = defaults();
      needsReset = false;
      if (persistent && storage) {
        try { storage.removeItem(key); } catch (e) { persistent = false; }
      }
      listeners.slice().forEach(function (fn) { fn(state); });
    }

    return {
      getSettings: getSettings,
      setSetting: setSetting,
      getActivity: getActivity,
      recordAttempt: recordAttempt,
      recordHint: recordHint,
      setBeat: setBeat,
      completeMission: completeMission,
      isMissionComplete: isMissionComplete,
      totalXp: function () { return Lab.xp.totalXp(state.activities); },
      level: function () { return Lab.xp.levelFor(completedMap()); },
      subscribe: function (fn) {
        listeners.push(fn);
        return function () { listeners = listeners.filter(function (f) { return f !== fn; }); };
      },
      getState: function () { return state; },
      getSkillDescription: function () { return state.skillDescription; },
      setSkillDescription: function (text) { state.skillDescription = String(text); save(); },
      getLastView: function () { return state.lastView; },
      setLastView: setLastView,
      reset: reset,
      isPersistent: function () { return persistent; },
      needsReset: function () { return needsReset; }
    };
  }

  Lab.store = create();
  Lab.store.create = create;
  Lab.store.KEY = KEY;
  Lab.store.VERSION = VERSION;
})();
