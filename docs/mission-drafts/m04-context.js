// m04-context.js
Lab.content.registerMission({
  "id": "context",
  "number": 4,
  "stage": "build",
  "title": "Teach Claude About the Repository",
  "minutes": 8,
  "xp": 30,
  "reviewedBy": null,
  "reviewedOn": null,
  "beats": [
    {
      "type": "explain",
      "heading": "CLAUDE.md is the repository onboarding document",
      "simple": "When you start working in a repository, Claude reads CLAUDE.md. It says how the code is organized, which commands to run, what conventions to follow and which mistakes to avoid. Without it, Claude makes predictable mistakes."
    },
    {
      "type": "show",
      "heading": "The difference CLAUDE.md makes",
      "simple": "Watch the same task run twice: once without CLAUDE.md (Claude makes predictable mistakes), once with it (none occur).",
      "component": "compare",
      "config": {}
    },
    {
      "type": "try",
      "heading": "What belongs in CLAUDE.md?",
      "simple": "Classify statements: which are repository-specific, and which are task-specific or enforcement rules?",
      "component": "classifier",
      "activity": {
        "id": "context.classify",
        "maxXp": 20,
        "completion": "all items correctly placed",
        "buckets": ["CLAUDE.md", "Not CLAUDE.md"],
        "items": [
          {
            "id": "cmd",
            "text": "Use `npm test` before finishing.",
            "answer": "CLAUDE.md",
            "explanation": "A repository command. Claude should know it."
          },
          {
            "id": "convention",
            "text": "API responses use camelCase.",
            "answer": "CLAUDE.md",
            "explanation": "A project convention. Claude should follow it."
          },
          {
            "id": "rule",
            "text": "Never log customer PII.",
            "answer": "CLAUDE.md",
            "explanation": "Claude should know it. But knowing is not enforcing; a Hook will enforce it."
          },
          {
            "id": "taskspecific",
            "text": "This task should add a blue button.",
            "answer": "Not CLAUDE.md",
            "explanation": "Task-specific direction. It belongs in your prompt, not in CLAUDE.md."
          },
          {
            "id": "gate",
            "text": "Deployments require release-manager approval.",
            "answer": "CLAUDE.md",
            "explanation": "Claude should know it. But a rule that must hold is enforced by a Hook, not just written down."
          }
        ]
      }
    },
    {
      "type": "try",
      "heading": "Write the CLAUDE.md",
      "simple": "Arrange statements into six sections: Architecture, Commands, Conventions, Important rules, Known mistakes, Verification requirements.",
      "component": "builder",
      "activity": {
        "id": "context.build",
        "maxXp": 10,
        "completion": "all six sections filled with correct statements",
        "items": []
      }
    },
    {
      "type": "debrief",
      "heading": "CLAUDE.md teaches Claude about this repository; a Skill teaches how to do a kind of work",
      "simple": "CLAUDE.md is the repository onboarding document. It is loaded by Claude Code at the start of every session.",
      "humanDecides": "What conventions and rules Claude should be aware of when working in your codebase.",
      "addsNode": "CLAUDE.md"
    }
  ],
  "links": [],
  "claims": [
    {
      "text": "CLAUDE.md is read by Claude Code at the start of a session in the repository.",
      "verified": null,
      "source": null
    },
    {
      "text": "CLAUDE.md covers repository-specific commands, conventions, rules and known mistakes, not task-specific directions.",
      "verified": null,
      "source": null
    }
  ]
});
