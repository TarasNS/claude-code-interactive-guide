(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var missions = {};

  Lab.content = Lab.content || {};
  Lab.content.glossary = Lab.content.glossary || [];
  Lab.content.links = Lab.content.links || [];

  Lab.content.registerMission = function (mission) {
    missions[mission.id] = mission;
  };
  Lab.content.getMission = function (id) {
    return missions[id] || null;
  };
  Lab.content.allMissions = function () {
    return Object.keys(missions).map(function (id) { return missions[id]; })
      .sort(function (a, b) { return a.number - b.number; });
  };
  Lab.content.term = function (id) {
    for (var i = 0; i < Lab.content.glossary.length; i++) {
      if (Lab.content.glossary[i].id === id) return Lab.content.glossary[i];
    }
    return null;
  };
  Lab.content.link = function (id) {
    for (var i = 0; i < Lab.content.links.length; i++) {
      if (Lab.content.links[i].id === id) return Lab.content.links[i];
    }
    return null;
  };
})();
