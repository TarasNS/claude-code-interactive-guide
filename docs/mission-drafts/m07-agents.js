// m07-agents.js
Lab.content.registerMission({
  "id": "agents",
  "number": 7,
  "stage": "build",
  "title": "Subagents and Parallel Work",
  "minutes": 10,
  "xp": 40,
  "reviewedBy": null,
  "reviewedOn": null,
  "beats": [
    {
      "type": "show",
      "heading": "One task, one agent, or more?",
      "simple": "Subagents are scoped helpers inside one session. Parallel sessions are independent development streams.",
      "component": "stepper",
      "config": {}
    },
    {
      "type": "show",
      "heading": "The cost of coordination",
      "simple": "Each added agent adds overhead. More agents are valuable only when they save more time than they cost.",
      "component": "stepper",
      "config": {}
    },
    {
      "type": "try",
      "heading": "How many agents?",
      "simple": "Decide which tasks need one agent, a subagent, or parallel sessions. 8 XP per task.",
      "component": "choice",
      "activity": {
        "id": "agents.choose",
        "maxXp": 40,
        "completion": "all five tasks answered correctly",
        "items": [
          {
            "id": "typo",
            "text": "Fix a typo in an error message.",
            "answer": "One agent",
            "explanation": "One small task; more agents only add coordination overhead and delay."
          },
          {
            "id": "search",
            "text": "Find everywhere claim status is computed across many files, then report back.",
            "answer": "Subagent",
            "explanation": "Context-heavy exploration. A subagent researcher keeps the main session clean and focused."
          },
          {
            "id": "parallel",
            "text": "Build the status API and, independently, the status page UI.",
            "answer": "Parallel session",
            "explanation": "Independent streams with no shared files. Parallel sessions avoid blocking each other."
          },
          {
            "id": "review",
            "text": "Before opening the PR, independently check the diff for security issues.",
            "answer": "Subagent",
            "explanation": "A scoped verifier subagent can review the work without context overhead."
          },
          {
            "id": "bugs",
            "text": "Fix three unrelated bugs in different modules, all needed today.",
            "answer": "Parallel session",
            "explanation": "Independent bugs in separate files. Parallel sessions let teams work on different bugs in parallel."
          }
        ]
      }
    },
    {
      "type": "debrief",
      "heading": "One task, one agent is the default",
      "simple": "Start with one agent. Add subagents or parallel sessions only when the coordination cost is less than the serialization cost.",
      "humanDecides": "Whether parallel work or subagents are worth the review overhead for this task.",
      "addsNode": "Subagents"
    }
  ],
  "links": [],
  "claims": [
    {
      "text": "A subagent is a scoped helper inside one Claude Code session, used for context-heavy or independent verification work.",
      "verified": null,
      "source": null
    },
    {
      "text": "Parallel sessions are independent Claude Code sessions, each in its own worktree, used for independent development streams.",
      "verified": null,
      "source": null
    },
    {
      "text": "Adding more agents adds coordination overhead. More agents are valuable only when the cost of coordination is less than the cost of serializing the work.",
      "verified": null,
      "source": null
    }
  ]
});
