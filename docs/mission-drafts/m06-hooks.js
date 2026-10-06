// m06-hooks.js
Lab.content.registerMission({
  "id": "hooks",
  "number": 6,
  "stage": "build",
  "title": "Hooks",
  "minutes": 10,
  "xp": 30,
  "reviewedBy": null,
  "reviewedOn": null,
  "beats": [
    {
      "type": "explain",
      "heading": "A hook is an automatic rule that runs when Claude tries to do something",
      "simple": "A Skill recommends: 'Never log PII.' A Hook enforces it: when Claude edits an API file, automatically run the PII checker. If PII is found, block the edit and tell Claude why. A Hook is a deterministic check that cannot be skipped."
    },
    {
      "type": "show",
      "heading": "Skill vs Hook",
      "simple": "A Skill recommends best practices. A Hook enforces them automatically and blocks violations.",
      "component": "compare",
      "config": {}
    },
    {
      "type": "try",
      "heading": "Build the hook",
      "simple": "Choose when to check (after edits), what to check (PII), and what to do if it fails (deny and explain).",
      "component": "builder",
      "activity": {
        "id": "hooks.build",
        "maxXp": 20,
        "completion": "correct hook configuration chosen: match API files, run PII checker, deny with reason",
        "items": []
      }
    },
    {
      "type": "show",
      "heading": "Run it",
      "simple": "Watch Claude edit a file. The hook fires. PII is detected. The edit is blocked. Claude sees the reason and fixes it.",
      "component": "stepper",
      "config": {}
    },
    {
      "type": "try",
      "heading": "Skill or Hook?",
      "simple": "Which rules are good advice versus which must always hold?",
      "component": "classifier",
      "activity": {
        "id": "hooks.choose",
        "maxXp": 10,
        "completion": "all items correctly placed",
        "buckets": ["Skill", "Hook"],
        "items": [
          {
            "id": "style",
            "text": "Prefer small functions.",
            "answer": "Skill",
            "explanation": "Good advice, but can be ignored. A Skill is enough."
          },
          {
            "id": "production",
            "text": "Never deploy to production without approval.",
            "answer": "Hook",
            "explanation": "Must hold every time. A Hook enforces it."
          },
          {
            "id": "dryness",
            "text": "Do not repeat yourself; extract duplication into helper functions.",
            "answer": "Skill",
            "explanation": "A practice recommendation. It does not need enforcement."
          }
        ]
      }
    },
    {
      "type": "debrief",
      "heading": "Instructions reduce mistakes. Guardrails enforce boundaries.",
      "simple": "Skills recommend. Hooks enforce. A Hook cannot be skipped; it is automatic.",
      "humanDecides": "Which rules are important enough to enforce, and what action to take if they are broken.",
      "addsNode": "Hooks"
    }
  ],
  "links": [],
  "claims": [
    {
      "text": "Hooks run deterministic commands around Claude Code tool-use events: before or after file edits, before tests or deploys, etc.",
      "verified": null,
      "source": null
    },
    {
      "text": "A hook can allow an action, ask a human for approval, or deny the action and return a reason to Claude.",
      "verified": null,
      "source": null
    },
    {
      "text": "Hooks enforce organizational policy and safety rules that must hold regardless of whether Claude remembers them.",
      "verified": null,
      "source": null
    }
  ]
});
