// m03-plan.js
Lab.content.registerMission({
  "id": "plan",
  "number": 3,
  "stage": "build",
  "title": "Plan Before Coding",
  "minutes": 10,
  "xp": 40,
  "reviewedBy": null,
  "reviewedOn": null,
  "beats": [
    {
      "type": "show",
      "heading": "Two paths to implementation",
      "simple": "Path A: prompt and code; find problems later. Path B: Plan Mode, explore, design, get approval; then code. Compare the outcomes.",
      "component": "stepper",
      "config": {}
    },
    {
      "type": "show",
      "heading": "Watch Claude plan",
      "simple": "Claude explores the repository, reads key files and outputs a detailed plan: which files change, what could break, which tests prove it works.",
      "component": "terminal",
      "config": {}
    },
    {
      "type": "try",
      "heading": "Review the plan",
      "simple": "Find and flag two deliberate flaws in the plan: a risky architectural choice and a missing test.",
      "component": "choice",
      "activity": {
        "id": "plan.review",
        "maxXp": 25,
        "completion": "both flaws flagged, then plan approved",
        "items": [
          {
            "id": "flaw1",
            "text": "The plan modifies the shared authentication middleware, which is used by every route. This increases blast radius.",
            "answer": true,
            "explanation": "Correct. This is a deliberate risk. A safer path would reuse claimService.getClaim instead."
          },
          {
            "id": "flaw2",
            "text": "The plan has no test for unauthorized requests (missing 401 test).",
            "answer": true,
            "explanation": "Correct. The spec requires a 401 response; the plan must verify it."
          }
        ]
      }
    },
    {
      "type": "try",
      "heading": "Plan or just do it?",
      "simple": "Decide which tasks need Plan Mode and which are small enough to code directly.",
      "component": "classifier",
      "activity": {
        "id": "plan.when",
        "maxXp": 15,
        "completion": "all items correctly placed",
        "buckets": ["Plan Mode first", "Just do it"],
        "items": [
          {
            "id": "typo",
            "text": "Fix a typo in an error message.",
            "answer": "Just do it",
            "explanation": "Small, isolated change. Plan Mode adds overhead here."
          },
          {
            "id": "variable",
            "text": "Rename a local variable.",
            "answer": "Just do it",
            "explanation": "Local, low-risk change. No planning needed."
          },
          {
            "id": "endpoint",
            "text": "Add a new endpoint that touches authentication.",
            "answer": "Plan Mode first",
            "explanation": "Affects shared infrastructure. Plan for risks and tests first."
          },
          {
            "id": "schema",
            "text": "Change a database schema with live data.",
            "answer": "Plan Mode first",
            "explanation": "High-risk. Must plan migration, rollback and tests carefully."
          }
        ]
      }
    },
    {
      "type": "debrief",
      "heading": "Plan is approved before any code is written",
      "simple": "Plan Mode is interactive exploration. It surfaces risks and architecture choices before you are committed to code.",
      "humanDecides": "Whether the plan safely implements the spec and whether any risks are acceptable.",
      "addsNode": "plan.md"
    }
  ],
  "links": [],
  "claims": [
    {
      "text": "Plan Mode is an interactive Claude Code feature for exploring a repository and designing a safe implementation.",
      "verified": null,
      "source": null
    },
    {
      "text": "Plan Mode is most valuable for changes that affect shared infrastructure, touch authentication or carry data risk.",
      "verified": null,
      "source": null
    }
  ]
});
