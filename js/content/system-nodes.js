(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  Lab.content = Lab.content || {};

  // `after` is the mission number whose completion reveals the node (-1 = always shown).
  Lab.content.systemNodes = [
    { id: 'start', label: 'You, Claude and Code', after: -1, human: false,
      simple: 'The starting point: you work with Claude inside a repository.',
      deeper: 'Everything else in the diagram is added around this working relationship.' },
    { id: 'intent-md', label: 'intent.md', after: 1, human: true, decides: 'Defines the outcome',
      simple: 'Says what you want and why, before any code exists.',
      deeper: 'The reference that specifications, plans and reviews are all checked against.' },
    { id: 'spec-md', label: 'spec.md', after: 2, human: true, decides: 'Approves the specification',
      simple: 'Describes how the system will behave to deliver the intent.',
      deeper: 'The contract between the intent and the implementation, approved before planning.' },
    { id: 'plan-md', label: 'plan.md', after: 3, human: true, decides: 'Approves the plan',
      simple: 'The agreed steps and files for building the specification.',
      deeper: 'Agreed in a planning step so direction is corrected before code is written.' },
    { id: 'claude-md', label: 'CLAUDE.md', after: 4, human: false,
      simple: 'Tells Claude how this project works, every session.',
      deeper: 'Holds commands, conventions and rules so they are not repeated each time.' },
    { id: 'skills', label: 'Skills', after: 5, human: false,
      simple: 'Reusable instructions for tasks you want done the same way each time.',
      deeper: 'Packaged instructions that Claude uses when a task matches their description.' },
    { id: 'hooks', label: 'Hooks', after: 6, human: true, decides: 'Chooses which rules are enforced',
      simple: 'Automatic rules that block actions that break your policy.',
      deeper: 'Deterministic checks that run around Claude\'s actions, unlike guidance that can be missed.' },
    { id: 'subagents', label: 'Subagents', after: 7, human: false,
      simple: 'Helpers that take on separate parts of a job.',
      deeper: 'Each works in its own context, which keeps large or independent jobs apart.' },
    { id: 'tests', label: 'Tests (feedback loop)', after: 8, human: true, decides: 'Defines what "working" means',
      simple: 'Lets Claude run tests and a build and fix what fails.',
      deeper: 'Claude checks its own work against results a person defined as success.' },
    { id: 'evals', label: 'Evals', after: 9, human: true, decides: 'Chooses behaviours to protect',
      simple: 'A fixed set of checks that show whether a change made things worse.',
      deeper: 'Run before and after changes to instructions or Skills to catch regressions.' },
    { id: 'pr-review', label: 'PR review', after: 10, human: true, decides: 'Reviews intent and risk',
      simple: 'Claude flags problems in a pull request; a person decides.',
      deeper: 'AI review widens coverage, while reviewers judge intent and risk.' },
    { id: 'gates', label: 'Approval gates', after: 11, human: true, decides: 'Approves production release',
      simple: 'Points where a named person must approve before the pipeline continues.',
      deeper: 'Protects high-impact steps, such as a production release, with a human decision.' },
    { id: 'ci-cd', label: 'CI/CD', after: 12, human: false,
      simple: 'The pipeline that builds, tests and releases every change the same way.',
      deeper: 'Runs the tests, review and gates automatically for each change.' },
    { id: 'production', label: 'Production and metrics', after: 13, human: true, decides: 'Triages incidents',
      simple: 'The released system, watched through its metrics.',
      deeper: 'What you learn here becomes the next intent, which closes the loop.' }
  ];

  Lab.content.systemLoopCaption = 'The loop is closed: what you learn in production becomes the next intent.';
})();
