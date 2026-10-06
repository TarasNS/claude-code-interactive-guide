(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  Lab.content = Lab.content || {};

  // x, y are the node centre in a 800 x 460 coordinate space.
  Lab.content.mapGraph = {
    verified: '2026-10-06',
    source: 'Anthropic AI-native SDLC playbook (claude.com/blog/the-ai-native-sdlc-playbook), prerequisites by play',
    nodes: [
      { id: 'intent', label: 'intent.md', mission: 'intent', x: 90, y: 50,
        whatItIs: 'A short file that says what you want and why: the problem, the outcome, the limits and what is still unknown.',
        whatItIsDeeper: 'It states the problem, desired outcome, constraints and open questions, and leaves solution details for later.',
        why: 'Everyone, including Claude, works toward the same goal before any code exists.',
        when: 'At the start of any piece of work.',
        example: 'ClaimsPortal: customers can see their claim status without calling support.' },
      { id: 'spec', label: 'spec.md', mission: 'spec', x: 300, y: 50,
        whatItIs: 'A description of how the system will behave to deliver the intent.',
        whatItIsDeeper: 'It names endpoints, responses, constraints and error cases, written against company policy.',
        why: 'It turns a goal into something precise that can be checked.',
        when: 'After the intent is agreed and before planning.',
        example: 'GET /claims/{id}/status returns status, nextStep and expectedDate.' },
      { id: 'plan-mode', label: 'Plan Mode', mission: 'plan', x: 510, y: 50,
        whatItIs: 'A way of working where Claude proposes an approach and you approve it before any files change.',
        whatItIsDeeper: 'The plan lists the files to change and the risks, so direction is fixed before code is written.',
        why: 'A wrong plan is cheap to fix. Wrong code is not.',
        when: 'Before changes that touch more than a file or two.',
        example: 'Claude lists the files it would change for the status endpoint and waits for approval.' },
      { id: 'claude-md', label: 'CLAUDE.md', mission: 'context', x: 90, y: 160,
        whatItIs: 'A file in the repository that tells Claude how the project works: commands, conventions and rules.',
        whatItIsDeeper: 'Claude reads it at the start of a session, so the project\'s rules do not need repeating.',
        why: 'Claude starts every session knowing the project instead of guessing.',
        when: 'When you notice you keep giving the same instructions.',
        example: 'Run npm test before finishing. API responses use camelCase.' },
      { id: 'skills', label: 'Skills', mission: 'skills', x: 300, y: 160,
        whatItIs: 'Reusable instructions that Claude uses when a task calls for them.',
        whatItIsDeeper: 'A Skill is a folder with a SKILL.md whose description tells Claude when to use it.',
        why: 'A repeatable way of working is done the same way each time.',
        when: 'When a task has steps you want done consistently.',
        example: 'A secure-api-review Skill that checks new endpoints against the team\'s rules.' },
      { id: 'hooks', label: 'Hooks', mission: 'hooks', x: 510, y: 160,
        whatItIs: 'Automatic rules that run when Claude tries to do something, and can block it.',
        whatItIsDeeper: 'Hooks run deterministic commands around tool use and can allow, ask or deny an action.',
        why: 'Instructions guide, hooks enforce. Some rules must hold every time.',
        when: 'For rules that must never be skipped.',
        example: 'A hook that blocks a deploy command until a release manager has approved.' },
      { id: 'approval-gates', label: 'Approval gates', mission: 'gates', x: 710, y: 160,
        whatItIs: 'Points in the pipeline where a named person must approve before it continues.',
        whatItIsDeeper: 'A gate pairs an automatic block with a human decision about a specific action.',
        why: 'Some actions, such as a production release, need a person to decide.',
        when: 'Before irreversible or high-impact steps.',
        example: 'Production deploys wait for release-manager approval.' },
      { id: 'subagents', label: 'Subagents', mission: 'agents', x: 90, y: 270,
        whatItIs: 'Helpers that Claude can hand part of a job to, each working on its own.',
        whatItIsDeeper: 'Each subagent has its own context, which keeps large or independent jobs from crowding one conversation.',
        why: 'Big jobs stay organised and independent parts can run side by side.',
        when: 'When work splits into independent parts, or needs a focused specialist.',
        example: 'One helper reviews security while another writes tests for the status endpoint.' },
      { id: 'feedback-loop', label: 'Feedback loop', mission: 'feedback', x: 300, y: 270,
        whatItIs: 'A way for Claude to run tests and a build and read the results, so it can fix its own mistakes.',
        whatItIsDeeper: 'Claude acts on the results of checks that a person defined as success.',
        why: 'Claude checks its own work instead of relying on you to spot every error.',
        when: 'Whenever Claude writes or changes code.',
        example: 'Claude runs npm test, sees claims.status.test.js fail, and fixes the code.' },
      { id: 'evals', label: 'Evals', mission: 'evals', x: 510, y: 270,
        whatItIs: 'A fixed set of checks that show whether behaviour still meets the bar after a change.',
        whatItIsDeeper: 'Run before and after an edit to instructions, Skills or a model to catch regressions.',
        why: 'Instructions change. Evals tell you whether a change made things worse.',
        when: 'After changing instructions, Skills or models.',
        example: 'A table of sample requests with expected outcomes, run before and after an edit.' },
      { id: 'pr-review', label: 'PR review', mission: 'review', x: 710, y: 270,
        whatItIs: 'Claude reviews a pull request and flags problems, and a person decides what to act on.',
        whatItIsDeeper: 'AI review widens coverage, while human reviewers judge intent and risk.',
        why: 'A second pair of eyes catches issues earlier, and humans keep the final say.',
        when: 'On every pull request.',
        example: 'Claude notes that a new route skips the shared auth middleware.' },
      { id: 'ci-cd', label: 'CI/CD', mission: 'pipeline', x: 400, y: 380,
        whatItIs: 'An automatic pipeline that builds, tests and releases changes.',
        whatItIsDeeper: 'Runs the tests, review and approval gates for each change in the same order.',
        why: 'Every change passes the same checks before it reaches users.',
        when: 'On every change that should be released.',
        example: 'Tests, build, review, approval, then deploy.' },
      { id: 'monitoring', label: 'Monitoring', mission: 'loop', x: 90, y: 380,
        whatItIs: 'Watching how the released system behaves, then feeding what you learn back in.',
        whatItIsDeeper: 'Production data becomes the next intent, which closes the loop.',
        why: 'It closes the loop between what you shipped and what you do next.',
        when: 'Continuously after release.',
        example: 'The error rate of the status endpoint rises, and a new intent is opened.' }
    ],
    // Edges point from a prerequisite to what depends on it. Checked on 2026-10-06 against the playbook's
    // "Prerequisites" for each play: stated = a prerequisite the playbook names; spec = a link the spec
    // defines that the playbook does not state as a prerequisite.
    edges: [
      { from: 'intent', to: 'spec', type: 'solid' },            // stated: spec.md needs intent.md
      { from: 'spec', to: 'plan-mode', type: 'dotted' },        // stated: plan needs the intent or spec, if one exists
      { from: 'claude-md', to: 'plan-mode', type: 'dotted' },   // stated: CLAUDE.md helps
      { from: 'claude-md', to: 'skills', type: 'dotted' },      // stated: having a CLAUDE.md helps
      { from: 'claude-md', to: 'subagents', type: 'solid' },    // stated: all sessions read CLAUDE.md
      { from: 'feedback-loop', to: 'subagents', type: 'dotted' }, // stated: the feedback loop also helps
      { from: 'claude-md', to: 'evals', type: 'solid' },        // stated: evals need CLAUDE.md
      { from: 'feedback-loop', to: 'evals', type: 'solid' },    // stated: and the feedback loop
      { from: 'claude-md', to: 'pr-review', type: 'solid' },    // stated: an updated CLAUDE.md
      { from: 'skills', to: 'pr-review', type: 'dotted' },      // stated: skills if the review enforces policies
      { from: 'hooks', to: 'approval-gates', type: 'solid' },   // spec: approval gates are built with hooks
      { from: 'pr-review', to: 'ci-cd', type: 'solid' },        // stated: Claude in the PR review loop
      { from: 'approval-gates', to: 'ci-cd', type: 'solid' },   // stated: hooks as approval gates
      { from: 'ci-cd', to: 'monitoring', type: 'solid' },       // stated: a rollback path for CI/CD
      { from: 'pr-review', to: 'monitoring', type: 'solid' },   // stated: Claude-accelerated PR reviews
      { from: 'approval-gates', to: 'monitoring', type: 'solid' }, // stated: hooks as an action boundary
      { from: 'monitoring', to: 'intent', type: 'dotted' }      // spec: closes the loop (intent.md is the loop's output)
    ]
  };
})();
