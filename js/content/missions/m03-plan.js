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
      "heading": "Planning first avoids rework",
      "simple": "Both paths start from the same request. Path A jumps straight to code and finds an architecture problem late. Path B uses the spec and Plan Mode to find files, risks and tests first, and a person approves before any code is written.",
      "terms": ["plan-mode"],
      "component": "stepper",
      "config": {
        "label": "Two paths to implementation",
        "paths": [
          { "id": "a", "label": "Path A: prompt and code" },
          { "id": "b", "label": "Path B: spec, plan, approve, build" }
        ],
        "nodes": [
          { "id": "a1", "path": "a", "label": "Prompt" },
          { "id": "a2", "path": "a", "label": "Code immediately" },
          { "id": "a3", "path": "a", "label": "Architecture problem found" },
          { "id": "a4", "path": "a", "label": "Rework" },
          { "id": "b1", "path": "b", "label": "spec.md" },
          { "id": "b2", "path": "b", "label": "Plan Mode" },
          { "id": "b3", "path": "b", "label": "Explore the repository" },
          { "id": "b4", "path": "b", "label": "Files, risks, tests" },
          { "id": "b5", "path": "b", "label": "plan.md" },
          { "id": "b6", "path": "b", "label": "Human approval" },
          { "id": "b7", "path": "b", "label": "Build" }
        ],
        "steps": [
          { "caption": "Path A starts with a prompt. Path B starts from the approved spec.", "reveal": ["a1", "b1"], "active": "a1" },
          { "caption": "Path A starts coding at once. Path B switches to Plan Mode and changes nothing yet.", "reveal": ["a2", "b2"], "active": "a2" },
          { "caption": "Path A hits an architecture problem halfway through. Path B explores the repository first.", "reveal": ["a3", "b3"], "active": "a3" },
          { "caption": "Path A has to redo work. Path B lists the files, risks and tests.", "reveal": ["a4", "b4"], "active": "a4" },
          { "caption": "Path B writes the plan down so it can be reviewed.", "reveal": ["b5"], "active": "b5" },
          { "caption": "A person approves the plan. This is the checkpoint Path A skipped.", "reveal": ["b6"], "active": "b6" },
          { "caption": "Only now does Path B build, in the direction already agreed.", "reveal": ["b7"], "active": "b7" }
        ]
      }
    },
    {
      "type": "show",
      "heading": "Watch Claude plan before it changes anything",
      "simple": "In Plan Mode Claude reads the files that matter, then writes a plan. Step through the replay. Files Claude reads light up in the tree. The plan appears at the end, and you will review it next.",
      "simulated": true,
      "caption": "Illustrative: a scripted replay, not real model output.",
      "component": "terminal",
      "config": {
        "label": "Simulated Claude Code session in claims-portal",
        "prompt": "$",
        "tree": "claimsportal",
        "script": [
          { "who": "cmd", "text": "claude" },
          { "who": "claude", "text": "Plan Mode is on. I will read the code first and change nothing." },
          { "who": "claude", "text": "Reading src/api/routes/claims.js", "highlight": ["src/api/routes/claims.js"] },
          { "who": "claude", "text": "Reading src/services/claimService.js", "highlight": ["src/services/claimService.js"] },
          { "who": "claude", "text": "Reading src/api/middleware/auth.js", "highlight": ["src/api/middleware/auth.js"] },
          { "who": "claude", "text": "Reading tests/claimService.test.js", "highlight": ["tests/claimService.test.js"] },
          { "who": "claude", "text": "Here is my plan for GET /claims/:id/status.", "turn": 1 },
          { "who": "out", "text": "1. Add a route GET /claims/:id/status in src/api/routes/claims.js.", "turn": 1 },
          { "who": "out", "text": "2. Change src/api/middleware/auth.js so status requests skip the ownership check.", "turn": 1 },
          { "who": "out", "text": "3. Return status, nextStep and expectedDate.", "turn": 1 },
          { "who": "out", "text": "4. Add one test: an authorised request returns 200 with those fields.", "turn": 1 },
          { "who": "out", "text": "5. Run npm test and fix anything that fails.", "turn": 1 }
        ]
      }
    },
    {
      "type": "try",
      "heading": "Review the plan",
      "simple": "The plan has two problems. Ask the plan questions, then flag the lines that are a problem. Approve is always available, but approving with a problem still in the plan sends you back to Path A.",
      "component": "flagger",
      "config": {
        "prompt": "Select a plan line to flag it as a problem.",
        "listLabel": "Plan lines",
        "questions": [
          { "q": "Which files will change?", "a": "src/api/routes/claims.js, src/api/middleware/auth.js and tests/claims.status.test.js." },
          { "q": "What could break?", "a": "Every route that uses the shared auth middleware, not just the status endpoint." },
          { "q": "Which test proves this works?", "a": "One test: an authorised request returns 200 with the three fields. Nothing covers an unauthorised request." },
          { "q": "Is there a simpler implementation?", "a": "Yes. Call claimService.getClaim(id) and return only the three fields, without touching auth." }
        ],
        "finish": {
          "label": "Approve plan",
          "blocked": "Path A: rework. The plan was approved with a problem still in it, Claude built it, and the auth change broke other routes, so the work had to be redone. Flag the problems and approve again.",
          "success": "Plan approved. The risky auth change and the missing test were caught before any code was written. That is Path B."
        }
      },
      "activity": {
        "id": "plan.review",
        "maxXp": 25,
        "completion": "both flaws flagged, then plan approved",
        "items": [
          {
            "id": "route",
            "text": "1. Add a route GET /claims/:id/status in src/api/routes/claims.js.",
            "answer": "ok",
            "explanation": "This step is fine. A new route is the natural place for a new endpoint."
          },
          {
            "id": "auth",
            "text": "2. Change src/api/middleware/auth.js so status requests skip the ownership check.",
            "answer": "flaw",
            "explanation": "Correct. This edits middleware that every route uses, so the blast radius is much bigger than the endpoint needs. A safer plan reuses claimService.getClaim and leaves auth alone."
          },
          {
            "id": "fields",
            "text": "3. Return status, nextStep and expectedDate.",
            "answer": "ok",
            "explanation": "This step is fine. It returns exactly the fields the spec names."
          },
          {
            "id": "test",
            "text": "4. Add one test: an authorised request returns 200 with those fields.",
            "answer": "flaw",
            "explanation": "Correct. Only the happy path is tested. The spec says unauthenticated requests receive 401, so the plan needs a test for that too."
          },
          {
            "id": "run",
            "text": "5. Run npm test and fix anything that fails.",
            "answer": "ok",
            "explanation": "This step is fine. Running the tests is the check that closes the work."
          }
        ]
      }
    },
    {
      "type": "try",
      "heading": "Plan or just do it?",
      "simple": "Planning has a cost. Decide which tasks are worth a plan first and which are small enough to do straight away.",
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
            "explanation": "The change is small and isolated, so Plan Mode would only add overhead."
          },
          {
            "id": "variable",
            "text": "Rename a local variable.",
            "answer": "Just do it",
            "explanation": "The change is local and low risk, so no plan is needed."
          },
          {
            "id": "endpoint",
            "text": "Add a new endpoint that touches authentication.",
            "answer": "Plan Mode first",
            "explanation": "It touches shared code, so plan the risks and the tests before writing anything."
          },
          {
            "id": "schema",
            "text": "Change a database schema with live data.",
            "answer": "Plan Mode first",
            "explanation": "The risk is high, so plan the migration, the rollback and the tests carefully first."
          }
        ]
      }
    },
    {
      "type": "debrief",
      "heading": "The plan is approved before any code is written",
      "simple": "Plan Mode lets Claude explore and propose an approach while nothing can be broken. The plan is cheap to correct, and a person reads it before the work becomes code.",
      "humanDecides": "Whether the plan safely delivers the spec, and whether its risks are acceptable.",
      "addsNode": "plan.md"
    }
  ],
  "links": [],
  "claims": [
    {
      "text": "Plan Mode is an interactive Claude Code mode in which Claude explores a repository and proposes a plan without changing files.",
      "verified": "2026-10-06",
      "source": "Claude Code docs, Best practices, Explore first, then plan, then code (code.claude.com/docs/en/best-practices)"
    },
    {
      "text": "Plan Mode is most useful when the approach is uncertain, the change touches several files, or the code is unfamiliar; small, clear changes can be done directly.",
      "verified": "2026-10-06",
      "source": "Claude Code docs, Best practices, Explore first, then plan, then code (code.claude.com/docs/en/best-practices)"
    }
  ]
});
