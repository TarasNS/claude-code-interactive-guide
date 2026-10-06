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
      "heading": "Instructions guide; hooks enforce",
      "simple": "A hook is an automatic rule that runs when Claude tries to do something. If the rule fails, the action is blocked and Claude is told why. That makes it different from advice, which Claude can miss.",
      "terms": ["hook"]
    },
    {
      "type": "show",
      "heading": "A Skill can miss; a Hook catches it",
      "simple": "Both views give Claude the same rule about personal data. With a Skill alone the rule is only advice. With a Hook, a check runs every time and blocks the edit.",
      "simulated": true,
      "caption": "Illustrative, not a measured rate. Scripted example, not real model output.",
      "component": "compare",
      "config": {
        "legend": "Compare a Skill with a Hook",
        "views": [
          {
            "id": "skill",
            "label": "Skill only",
            "heading": "Skill: Never expose PII in logs",
            "lines": [
              { "id": "s1", "text": "claude: Adds a log line that includes the customer's phone number." },
              { "id": "s2", "text": "Nothing checks it, so the edit is saved with the personal data in it." }
            ]
          },
          {
            "id": "hook",
            "label": "Hook",
            "heading": "Hook: run the PII checker whenever an API file changes",
            "lines": [
              { "id": "h1", "text": "claude: Adds a log line that includes the customer's phone number." },
              { "id": "h2", "text": "hook: PII checker FAILED. Edit blocked: customer data found in a log line." },
              { "id": "h3", "text": "claude: Removes the phone number and logs only the claim id." }
            ]
          }
        ]
      }
    },
    {
      "type": "try",
      "heading": "Build the hook",
      "simple": "A hook needs three decisions: when it runs, what it does, and what happens if it fails. Pick one choice for each. A wrong choice shows its consequence when you check.",
      "component": "builder",
      "config": {
        "prompt": "Pick a choice, then put it in its decision. Each decision holds one choice.",
        "check": "Check my hook",
        "success": "The hook fires on every API edit, runs the PII checker, and blocks the edit with a reason Claude can act on.",
        "preview": { "title": "Hook rule", "file": "the hook" },
        "slots": [
          { "id": "when", "label": "When it runs", "max": 1 },
          { "id": "action", "label": "What it does", "max": 1 },
          { "id": "outcome", "label": "If it fails", "max": 1 }
        ]
      },
      "activity": {
        "id": "hooks.build",
        "maxXp": 20,
        "completion": "the right choice in all three decisions",
        "items": [
          { "id": "w1", "text": "Before or after Claude edits a file matching src/api/**", "answer": "when", "explanation": "It fires on every API edit, which is where personal data could be written." },
          { "id": "w2", "text": "After Claude edits any file in the repository", "answer": "none", "explanation": "That is too broad. It would run on documents and tests too, and slow every edit down." },
          { "id": "w3", "text": "When the session ends", "answer": "none", "explanation": "That is too late. The personal data would already have been written." },
          { "id": "a1", "text": "Run the PII checker", "answer": "action", "explanation": "It is the check that actually finds personal data in code." },
          { "id": "a2", "text": "Run the code formatter", "answer": "none", "explanation": "A formatter fixes style, not personal data, so PII would still get through." },
          { "id": "a3", "text": "Remind Claude to be careful", "answer": "none", "explanation": "A reminder is advice again. It does not stop anything." },
          { "id": "o1", "text": "Deny the edit and tell Claude why", "answer": "outcome", "explanation": "Claude is blocked, sees the reason, and can fix the code." },
          { "id": "o2", "text": "Allow it and log a warning", "answer": "none", "explanation": "Allowing the edit lets the personal data through." },
          { "id": "o3", "text": "Ask the human every time", "answer": "none", "explanation": "Asking about every edit interrupts the work for something a machine can decide." }
        ]
      }
    },
    {
      "type": "show",
      "heading": "Watch the hook run",
      "simple": "Step through what happens when Claude edits an API file and the hook fires. The edit is blocked, Claude sees the reason, fixes the code, and the hook passes.",
      "caption": "Illustrative: a scripted example, not real model output.",
      "component": "stepper",
      "config": {
        "label": "A hook running",
        "nodes": [
          { "id": "e1", "label": "Claude edits an API file" },
          { "id": "e2", "label": "The hook fires" },
          { "id": "e3", "label": "PII found: BLOCKED" },
          { "id": "e4", "label": "Claude sees the reason" },
          { "id": "e5", "label": "Claude fixes the code" },
          { "id": "e6", "label": "The hook passes" }
        ],
        "steps": [
          { "caption": "Claude edits a file under src/api.", "reveal": ["e1"], "active": "e1" },
          { "caption": "The hook fires because the edit matches src/api/**.", "reveal": ["e2"], "active": "e2" },
          { "caption": "The PII checker finds a phone number in a log line. The edit is BLOCKED.", "reveal": ["e3"], "active": "e3" },
          { "caption": "The reason is passed back to Claude: customer data in a log line.", "reveal": ["e4"], "active": "e4" },
          { "caption": "Claude removes the phone number and logs only the claim id.", "reveal": ["e5"], "active": "e5" },
          { "caption": "The hook runs again and passes, so the edit is allowed.", "reveal": ["e6"], "active": "e6" }
        ]
      }
    },
    {
      "type": "try",
      "heading": "Skill or Hook?",
      "simple": "Some rules are guidance. Others must hold every single time. Decide which of these three needs a hook.",
      "component": "classifier",
      "activity": {
        "id": "hooks.choose",
        "maxXp": 10,
        "completion": "all items correctly placed",
        "buckets": ["Skill (guidance)", "Hook (must always hold)"],
        "items": [
          { "id": "style", "text": "Use single quotes for strings.", "answer": "Skill (guidance)", "explanation": "It is a style preference. A slip does no harm, so guidance is enough." },
          { "id": "deploy", "text": "Never deploy to production without approval.", "answer": "Hook (must always hold)", "explanation": "It must hold every time, so it needs an automatic check that cannot be skipped." },
          { "id": "small", "text": "Prefer small functions.", "answer": "Skill (guidance)", "explanation": "It is a preference, not a boundary, so guidance is enough." }
        ]
      }
    },
    {
      "type": "deeper",
      "heading": "Hooks run commands around Claude's actions",
      "deeper": "Hooks run deterministic commands around tool use and can allow, ask or deny an action. A denial reason is returned to Claude. They can act as approval gates and enforce organisational policy. Exact event names are shown only after checking current documentation."
    },
    {
      "type": "debrief",
      "heading": "Instructions reduce mistakes; guardrails enforce boundaries",
      "simple": "Instructions reduce mistakes. Guardrails enforce boundaries. Choose the rules that are important enough to enforce, and keep everything else as guidance.",
      "humanDecides": "Which rules are important enough to enforce.",
      "addsNode": "Hooks"
    }
  ],
  "links": [],
  "claims": [
    {
      "text": "Hooks run deterministic commands around Claude Code tool-use events and can allow, ask or deny an action.",
      "verified": "2026-10-06",
      "source": "Claude Code docs, Automate actions with hooks (code.claude.com/docs/en/hooks-guide)"
    },
    {
      "text": "When a hook denies an action, its reason is returned to Claude.",
      "verified": "2026-10-06",
      "source": "Claude Code docs, Automate actions with hooks (code.claude.com/docs/en/hooks-guide)"
    },
    {
      "text": "Hooks can enforce project rules and, with the ask decision, hand an action to a person to approve.",
      "verified": "2026-10-06",
      "source": "Claude Code docs, Automate actions with hooks (code.claude.com/docs/en/hooks-guide)"
    }
  ]
});
