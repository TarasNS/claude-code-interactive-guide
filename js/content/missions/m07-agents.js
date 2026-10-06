// m07-agents.js
Lab.content.registerMission({
  "id": "agents",
  "number": 7,
  "stage": "build",
  "title": "Subagents and Parallel Work",
  "minutes": 8,
  "xp": 40,
  "reviewedBy": null,
  "reviewedOn": null,
  "beats": [
    {
      "type": "show",
      "heading": "Subagents are helpers; parallel sessions are separate streams",
      "simple": "A subagent is a scoped helper inside one task. Parallel sessions are several independent Claude sessions, each in its own worktree, on separate streams of work. They solve different problems.",
      "terms": ["subagent"],
      "component": "stepper",
      "config": {
        "label": "Subagents and parallel sessions",
        "paths": [
          { "id": "sub", "label": "Subagents: scoped helpers inside one task" },
          { "id": "par", "label": "Parallel sessions: independent development streams" }
        ],
        "nodes": [
          { "id": "s1", "path": "sub", "label": "Coordinator (one session)" },
          { "id": "s2", "path": "sub", "label": "Researcher" },
          { "id": "s3", "path": "sub", "label": "Verifier" },
          { "id": "s4", "path": "sub", "label": "Security reviewer" },
          { "id": "p1", "path": "par", "label": "One engineer" },
          { "id": "p2", "path": "par", "label": "Session A (own worktree)" },
          { "id": "p3", "path": "par", "label": "Session B (own worktree)" },
          { "id": "p4", "path": "par", "label": "Session C (own worktree)" }
        ],
        "steps": [
          { "caption": "Subagents sit inside one Claude Code session, under a coordinator. Parallel sessions start from one engineer.", "reveal": ["s1", "p1"], "active": "s1" },
          { "caption": "The coordinator hands reading and research to a scoped helper. The engineer starts a first independent session.", "reveal": ["s2", "p2"], "active": "s2" },
          { "caption": "A verifier checks the work separately. A second session works on something unrelated.", "reveal": ["s3", "p3"], "active": "s3" },
          { "caption": "A security reviewer checks the diff. A third session works on a third stream. Helpers share one task; sessions do not.", "reveal": ["s4", "p4"], "active": "s4" }
        ]
      }
    },
    {
      "type": "show",
      "heading": "Every extra agent adds coordination work",
      "simple": "More agents are not automatically better. Each one needs instructions, produces output to read, and adds context to manage. The meter shows the idea, not exact numbers.",
      "caption": "Illustrative, not numeric.",
      "component": "stepper",
      "config": {
        "label": "Adding agents",
        "meterLabel": "Coordination and context overhead",
        "nodes": [
          { "id": "c1", "label": "One agent" },
          { "id": "c2", "label": "Two agents" },
          { "id": "c3", "label": "Three agents" },
          { "id": "c4", "label": "Four agents" }
        ],
        "steps": [
          { "caption": "One agent: one conversation to follow and one result to review.", "reveal": ["c1"], "active": "c1", "meter": { "value": 10, "label": "low" } },
          { "caption": "Two agents: you now track two sets of instructions and two outputs.", "reveal": ["c2"], "active": "c2", "meter": { "value": 30, "label": "growing" } },
          { "caption": "Three agents: results can overlap or disagree, and someone has to reconcile them.", "reveal": ["c3"], "active": "c3", "meter": { "value": 55, "label": "high" } },
          { "caption": "Four agents: coordination can cost more than the work it saves.", "reveal": ["c4"], "active": "c4", "meter": { "value": 85, "label": "very high" } }
        ]
      }
    },
    {
      "type": "try",
      "heading": "How many agents?",
      "simple": "For each task, choose the simplest setup that works: one agent, a subagent, or a parallel session.",
      "component": "choice",
      "config": { "options": ["One agent", "Subagent", "Parallel session"] },
      "activity": {
        "id": "agents.choose",
        "maxXp": 40,
        "completion": "all five tasks answered correctly",
        "items": [
          { "id": "typo", "text": "Fix a typo in an error message.", "answer": "One agent", "explanation": "It is one small task, so more agents would only add overhead." },
          { "id": "research", "text": "Find everywhere claim status is computed across many files, then report back.", "answer": "Subagent", "explanation": "It is context-heavy reading. A researcher subagent keeps the main session clean." },
          { "id": "streams", "text": "Build the status API and, independently, the status page UI.", "answer": "Parallel session", "explanation": "These are independent streams, so separate sessions in separate worktrees fit." },
          { "id": "verify", "text": "Before opening the PR, independently check the diff for security issues.", "answer": "Subagent", "explanation": "A scoped reviewer or verifier inside the task gives an independent check." },
          { "id": "bugs", "text": "Fix three unrelated bugs in different modules, all needed today.", "answer": "Parallel session", "explanation": "The bugs are independent and share no files, so they can run side by side." }
        ]
      }
    },
    {
      "type": "debrief",
      "heading": "One task, one agent is the default",
      "simple": "Start with one agent. Add a subagent when reading or checking would clutter the main session, and add parallel sessions only for work that is truly independent.",
      "humanDecides": "Whether parallel work is worth the extra review load.",
      "addsNode": "Subagents"
    }
  ],
  "links": [],
  "claims": [
    {
      "text": "Subagents are scoped helpers inside one Claude Code task, while parallel sessions are independent sessions that can each use their own git worktree.",
      "verified": null,
      "source": null
    },
    {
      "text": "Adding agents adds coordination and context overhead, so a single agent is the default for a single task.",
      "verified": null,
      "source": null
    }
  ]
});
