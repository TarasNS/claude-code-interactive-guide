(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});

  function liveRegion() {
    return document.getElementById('coach');
  }

  function announce(message) {
    var region = liveRegion();
    if (!region) return;
    region.textContent = '';
    window.setTimeout(function () { region.textContent = message; }, 20);
  }

  function focusHeading(root) {
    var h1 = (root || document).querySelector('h1');
    if (!h1) return;
    h1.setAttribute('tabindex', '-1');
    h1.focus({ preventScroll: false });
  }

  function prefersReducedMotion(setting) {
    if (setting === 'reduce') return true;
    if (setting === 'full') return false;
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function applySettings(settings) {
    var root = document.documentElement;
    if (settings.theme === 'light' || settings.theme === 'dark') root.setAttribute('data-theme', settings.theme);
    else root.removeAttribute('data-theme');
    if (settings.reducedMotion === 'reduce') root.setAttribute('data-motion', 'reduce');
    else root.removeAttribute('data-motion');
  }

  Lab.a11y = {
    announce: announce,
    focusHeading: focusHeading,
    prefersReducedMotion: prefersReducedMotion,
    applySettings: applySettings
  };
})();
