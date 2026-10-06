(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  Lab.content = Lab.content || {};

  Lab.content.glossary = [
    {
      id: 'sdlc-loop',
      term: 'The loop',
      simple: 'The software lifecycle as one cycle: decide what to build, plan, build, test, review, release, measure, then start again.',
      deeper: 'An AI-native lifecycle keeps the same stages but lets Claude assist at each one, with a human deciding at the points that carry risk.'
    },
    {
      id: 'claude-code',
      term: 'Claude Code',
      simple: 'Claude working with you, interactively, inside a code repository.',
      deeper: 'An interactive agentic coding tool that reads and edits files and runs commands in your repository, under permissions you control.'
    },
    {
      id: 'claude-api',
      term: 'Claude API',
      simple: 'A way for your own software to send requests to Claude and get answers back, with nobody typing.',
      deeper: 'Programmatic model access from applications and pipelines. It is a separate route to Claude, not a requirement for using Claude Code.'
    },
    {
      id: 'claude-md',
      term: 'CLAUDE.md',
      simple: 'A file in your repository that tells Claude how your project works.',
      deeper: 'A memory file that Claude Code reads for project conventions, commands and rules, so they do not have to be repeated each session.'
    },
    {
      id: 'intent',
      term: 'Intent',
      simple: 'What you are trying to achieve and why: the problem, the outcome you want, the limits, and what is still unknown.',
      deeper: 'The input to specification. It states the problem, desired outcome, constraints and open questions, and leaves out solution details.'
    },
    {
      id: 'specification',
      term: 'Specification',
      simple: 'A description of how the system will behave to deliver the intent.',
      deeper: 'The contract between intent and implementation: endpoints, responses, constraints and error cases, written against company policy.'
    },
    {
      id: 'plan',
      term: 'Plan',
      simple: 'The steps and files needed to build the specification, with the risks noted.',
      deeper: 'An implementation approach agreed before code is written, naming the files to change and the trade-offs involved.'
    }
  ];
})();
