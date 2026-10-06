(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  Lab.content = Lab.content || {};

  // The new intent.md generated at the end of the final challenge (fictional ClaimsPortal data).
  Lab.content.finalIntent = [
    '# Intent: keep the claim status endpoint healthy',
    '',
    '## Problem',
    '- After release, the error rate of GET /claims/{id}/status rose above its baseline.',
    '',
    '## Outcome',
    '- The status endpoint error rate returns to baseline and stays there.',
    '',
    '## Constraints',
    '- No new personal data may be written to logs while diagnosing.',
    '- Production changes still need release-manager approval.',
    '',
    '## Open questions',
    '- Should the endpoint degrade gracefully when the claims database is slow?',
    '',
    '## Affected users and systems',
    '- Customers',
    '- Support team',
    '- Claims system',
    ''
  ].join('\n');

  // The 23 success criteria from intent.md section 17, with the missions that cover each.
  Lab.content.criteria = [
    { n: 1, text: 'What an AI-native software lifecycle is.', missions: ['orientation'] },
    { n: 2, text: 'Why intent.md exists.', missions: ['intent'] },
    { n: 3, text: 'The difference between intent.md, spec.md and plan.md.', missions: ['spec'] },
    { n: 4, text: 'What Plan Mode is for.', missions: ['plan'] },
    { n: 5, text: 'What belongs in CLAUDE.md.', missions: ['context'] },
    { n: 6, text: 'The difference between CLAUDE.md, Skills, prompts and Hooks.', missions: ['skills', 'hooks'] },
    { n: 7, text: 'The difference between subagents and parallel sessions.', missions: ['agents'] },
    { n: 8, text: 'Why more agents are not automatically better.', missions: ['agents'] },
    { n: 9, text: 'What a feedback loop is.', missions: ['feedback'] },
    { n: 10, text: 'The difference between a feedback loop and a verifier subagent.', missions: ['feedback'] },
    { n: 11, text: 'The difference between tests and evals.', missions: ['evals'] },
    { n: 12, text: 'How Claude can take part in PR review.', missions: ['review'] },
    { n: 13, text: 'Why AI review does not replace human approval.', missions: ['review'] },
    { n: 14, text: 'How hooks create deterministic guardrails and approval gates.', missions: ['hooks', 'gates'] },
    { n: 15, text: 'How Claude can operate inside CI/CD.', missions: ['pipeline'] },
    { n: 16, text: 'Why production access should be scoped and gated.', missions: ['gates'] },
    { n: 17, text: 'How metrics and incidents can restart the lifecycle.', missions: ['loop'] },
    { n: 18, text: 'Where Claude Code ends and API-driven automation begins.', missions: ['orientation', 'pipeline'] },
    { n: 19, text: 'How all the pieces fit into one controlled system.', missions: ['final'] },
    { n: 20, text: 'How a Skill is structured and how progressive disclosure keeps it cheap.', missions: ['skills'] },
    { n: 21, text: 'Why a Skill description decides whether it triggers, and how to fix under- and over-triggering.', missions: ['skills'] },
    { n: 22, text: 'How Skills differ from MCP, and why a Skill does not need MCP.', missions: ['skills'] },
    { n: 23, text: 'How to test and iterate a Skill, and when a rule should move to a script or Hook.', missions: ['skills', 'hooks'] }
  ];

  // First-step advice (intent section 17): what to introduce first, why, and what comes next.
  Lab.content.firstSteps = [
    { title: 'Introduce first: intent.md and CLAUDE.md', text: 'They cost almost nothing, and they stop the most common mistakes: building the wrong thing, and repeating the same repository mistakes.' },
    { title: 'Next: a feedback loop', text: 'Once Claude can run tests and a build and read the result, it can fix its own errors before anyone reviews.' },
    { title: 'Then: Hooks for the rules that must always hold', text: 'Move personal-data and approval rules from guidance into enforcement, so they cannot be skipped.' },
    { title: 'After that: evals, review and gates', text: 'Protect behaviour with evals, clear mechanical findings with AI review, and put a person at every high-risk step.' },
    { title: 'Finally: monitoring', text: 'Production signals become the next intent, which closes the loop. Add Skills and subagents where a repeatable task or a large job calls for them.' }
  ];
})();
