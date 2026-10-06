// Accessibility and layout audit for every view. Never shipped.
//
// How to run: open index.html (over http or file://) in a browser, open the console,
// paste this whole file, and press Enter. To test a narrow screen, set the browser
// viewport to 320 px wide first. The report lists only views with findings.
//
// It checks, per view: one h1, no skipped heading levels, the four landmarks, exactly one
// polite live region, a name on every control, no duplicate ids, 44 px touch targets,
// no positive tabindex, and no horizontal page scroll.
(async function () {
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function visible(e) {
    var r = e.getBoundingClientRect();
    var cs = getComputedStyle(e);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && e.closest('[hidden]') === null && (r.width > 0 || r.height > 0);
  }

  function nameOf(e) {
    var labelled = e.getAttribute('aria-labelledby') && document.getElementById(e.getAttribute('aria-labelledby'));
    var forLabel = e.id && document.querySelector('label[for="' + e.id + '"]');
    return (e.getAttribute('aria-label') || (labelled && labelled.textContent) || e.textContent || (forLabel && forLabel.textContent) || e.getAttribute('title') || '').trim();
  }

  function auditView() {
    var issues = [];
    var h1s = $$('h1').filter(visible);
    if (h1s.length !== 1) issues.push('h1 count ' + h1s.length);

    var prev = 0;
    $$('h1,h2,h3,h4').filter(visible).forEach(function (h) {
      var level = Number(h.tagName[1]);
      if (prev && level > prev + 1) issues.push('heading skips from h' + prev + ' to h' + level);
      prev = level;
    });

    ['nav', 'main', 'aside'].forEach(function (t) { if ($$(t).length !== 1) issues.push('landmark ' + t + ' x' + $$(t).length); });
    var banners = $$('header').filter(function (h) { return !h.closest('main, article, section, aside, nav'); });
    if (banners.length !== 1) issues.push('banner landmarks ' + banners.length);

    var polite = $$('[aria-live=polite], [role=status]');
    if (polite.length !== 1) issues.push('polite live regions: ' + polite.length);

    $$('button, a[href], select, textarea, input:not([type=hidden]), summary, [role=button], [role=tab], [role=treeitem]').filter(visible).forEach(function (e) {
      if (!nameOf(e)) issues.push('control without a name: ' + e.tagName + ' ' + (e.className || e.id));
    });

    var ids = {};
    $$('[id]').forEach(function (e) { ids[e.id] = (ids[e.id] || 0) + 1; });
    Object.keys(ids).filter(function (k) { return ids[k] > 1; }).forEach(function (k) { issues.push('duplicate id ' + k); });

    $$('[tabindex]').forEach(function (e) { if (Number(e.getAttribute('tabindex')) > 0) issues.push('positive tabindex'); });

    $$('button, .btn, select, input:not([type=radio]):not([type=checkbox]), summary, [role=tab]').filter(visible).forEach(function (e) {
      var r = e.getBoundingClientRect();
      var wide = r.width < 43.5 && !e.matches('.compare-opt input');
      if (r.height < 43.5 || wide) issues.push('small target ' + e.tagName + ' "' + nameOf(e).slice(0, 24) + '" ' + Math.round(r.width) + 'x' + Math.round(r.height));
    });

    if (document.documentElement.scrollWidth > innerWidth + 1) issues.push('horizontal overflow ' + document.documentElement.scrollWidth + ' > ' + innerWidth);
    return issues;
  }

  // Unlock every view so each one can be reached, then restore nothing: reset progress afterwards if you care.
  Lab.xp.MISSIONS.forEach(function (m) { Lab.store.completeMission(m.id); });
  Lab.store.setSetting('explore', true);

  var routes = ['#/', '#/map', '#/summary'];
  Lab.content.allMissions().forEach(function (m) {
    m.beats.forEach(function (b, i) { routes.push('#/m/' + m.id + '?beat=' + i); });
  });

  var report = {};
  for (var n = 0; n < routes.length; n++) {
    location.hash = routes[n];
    await sleep(90);
    var found = auditView();
    if (found.length) report[routes[n]] = found;
  }
  console.log('Audited ' + routes.length + ' views at ' + innerWidth + ' px wide. Views with findings: ' + Object.keys(report).length);
  console.log(report);
  return report;
})();
