(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  Lab.content = Lab.content || {};

  // Every outbound link in the product comes from this list (SEC-03).
  // verified: null means the URL still has to be checked before release (spec 16.4).
  Lab.content.links = [
    {
      id: 'claude-code-overview',
      label: 'Claude Code overview',
      url: 'https://code.claude.com/docs/en/overview',
      verified: '2026-10-06'
    }
  ];
})();
