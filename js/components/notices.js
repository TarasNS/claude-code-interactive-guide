(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  var h = Lab.dom.h;
  Lab.ui = Lab.ui || {};

  Lab.ui.aiNotice = function () {
    return h('section', { class: 'notice', 'aria-labelledby': 'ai-notice-title' },
      h('h2', { id: 'ai-notice-title' }, 'Using AI tools at Nordic Solar'),
      h('ul', null,
        h('li', null, 'Use only AI coding tools approved by the Head of IT & Digitalization.'),
        h('li', null, 'Never give them proprietary source code, internal system logic, confidential company information, personal data or credentials.'),
        h('li', null, 'Review AI-generated code with the same care as third-party code.')
      ),
      h('p', null, 'These points come from the Company Rules on Artificial Intelligence and the Company Rules on Secure Software Development.')
    );
  };

  Lab.ui.simulatedNotice = function () {
    return h('section', { class: 'notice', 'aria-labelledby': 'sim-notice-title' },
      h('h2', { id: 'sim-notice-title' }, 'No AI model is called'),
      h('p', null, 'Every "Claude" reply in this product is a scripted example labelled Simulated. The product makes no network requests.')
    );
  };
})();
