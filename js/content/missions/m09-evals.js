// m09-evals.js
Lab.content.registerMission({
  "id": "evals",
  "number": 9,
  "stage": "test",
  "title": "Evals",
  "minutes": 8,
  "xp": 30,
  "reviewedBy": null,
  "reviewedOn": null,
  "beats": [
    {
      "type": "show",
      "heading": "Tests check the software; evals check Claude's setup",
      "simple": "A test asks whether the software behaves, such as whether the status endpoint returns 200. An eval asks whether Claude, with its current instructions, still behaves well across a set of sample tasks.",
      "terms": ["eval"],
      "component": "compare",
      "config": {
        "legend": "Compare a test with an eval",
        "views": [
          {
            "id": "test",
            "label": "Test",
            "heading": "Test: does the software work?",
            "lines": [
              { "id": "t1", "text": "Does GET /status return HTTP 200?" },
              { "id": "t2", "text": "Does getClaim return the right claim?" }
            ]
          },
          {
            "id": "eval",
            "label": "Eval",
            "heading": "Eval: does Claude still behave well?",
            "lines": [
              { "id": "e1", "text": "Does Claude still pass the tests?" },
              { "id": "e2", "text": "Does it keep lint clean and keep existing tests?" },
              { "id": "e3", "text": "Does it still avoid exposing personal data?" },
              { "id": "e4", "text": "Does it still follow project policy?" }
            ]
          }
        ]
      }
    },
    {
      "type": "try",
      "heading": "Test or eval?",
      "simple": "Sort each statement. A test checks the software. An eval checks Claude's behaviour over sample tasks.",
      "component": "classifier",
      "activity": {
        "id": "evals.classify",
        "maxXp": 10,
        "completion": "all items correctly placed",
        "buckets": ["Test", "Eval"],
        "items": [
          { "id": "endpoint", "text": "The status endpoint returns nextStep.", "answer": "Test", "explanation": "It checks one behaviour of the software itself." },
          { "id": "getclaim", "text": "getClaim returns a claim for a valid id.", "answer": "Test", "explanation": "It checks one function of the software." },
          { "id": "pii", "text": "After a CLAUDE.md edit, Claude still avoids logging personal data on a set of sample tasks.", "answer": "Eval", "explanation": "It checks Claude's behaviour after a configuration change, across several tasks." },
          { "id": "lint", "text": "Across six sample tasks, Claude's changes still keep lint clean.", "answer": "Eval", "explanation": "It measures Claude's behaviour over a set of tasks." }
        ]
      }
    },
    {
      "type": "show",
      "heading": "Five things can change how Claude behaves",
      "simple": "Any of these can shift Claude's behaviour, for better or worse: CLAUDE.md, a Skill, a Hook, the model, or the prompt. Step through them. Each is a change worth testing before it ships.",
      "component": "stepper",
      "config": {
        "label": "What can change",
        "nodes": [
          { "id": "c1", "label": "CLAUDE.md" },
          { "id": "c2", "label": "A Skill" },
          { "id": "c3", "label": "A Hook" },
          { "id": "c4", "label": "The model" },
          { "id": "c5", "label": "The prompt" }
        ],
        "steps": [
          { "caption": "CLAUDE.md: removing or rewording a rule can quietly change what Claude does.", "reveal": ["c1"], "active": "c1" },
          { "caption": "A Skill: a new description can make it trigger more, less, or at the wrong time.", "reveal": ["c2"], "active": "c2" },
          { "caption": "A Hook: a changed check can block too much or too little.", "reveal": ["c3"], "active": "c3" },
          { "caption": "The model: a different model can behave differently on the same instructions.", "reveal": ["c4"], "active": "c4" },
          { "caption": "The prompt: different wording can steer Claude somewhere else.", "reveal": ["c5"], "active": "c5" }
        ]
      }
    },
    {
      "type": "try",
      "heading": "Gate the change",
      "simple": "Three changes are proposed. For each one, run the eval suite first, then decide whether to merge or reject it. Do not merge a change that makes a check fail.",
      "caption": "Illustrative: the results are fixed scenario data.",
      "component": "evalgate",
      "config": {
        "changes": [
          {
            "id": "claudemd",
            "title": "Shorten CLAUDE.md to save space",
            "detail": "The proposal removes several lines from CLAUDE.md, including the PII rule.",
            "verdict": "reject",
            "explanation": "Correct to reject. The shortened file dropped the PII rule, so Claude regressed on the PII check in two of six tasks.",
            "results": [
              { "task": "Add the status endpoint", "outcome": "pass" },
              { "task": "Fix a typo", "outcome": "pass" },
              { "task": "Add request logging", "outcome": "regression", "note": "Logged personal data" },
              { "task": "Rename a field", "outcome": "pass" },
              { "task": "Write a test", "outcome": "pass" },
              { "task": "Refactor the claim service", "outcome": "regression", "note": "Logged personal data" }
            ]
          },
          {
            "id": "skill",
            "title": "Rewrite a Skill description to be clearer",
            "detail": "The secure-api-review description gets specific trigger phrases.",
            "verdict": "merge",
            "explanation": "Correct to merge. Every task passed, so the clearer description did not make anything worse.",
            "results": [
              { "task": "Add the status endpoint", "outcome": "pass" },
              { "task": "Fix a typo", "outcome": "pass" },
              { "task": "Add request logging", "outcome": "pass" },
              { "task": "Rename a field", "outcome": "pass" },
              { "task": "Write a test", "outcome": "pass" },
              { "task": "Refactor the claim service", "outcome": "pass" }
            ]
          },
          {
            "id": "model",
            "title": "Switch to a different model",
            "detail": "The team wants to try a newer model for the same instructions.",
            "verdict": "merge",
            "explanation": "Correct to merge. All six tasks passed, so behaviour held. You would keep running the suite on future changes.",
            "results": [
              { "task": "Add the status endpoint", "outcome": "pass" },
              { "task": "Fix a typo", "outcome": "pass" },
              { "task": "Add request logging", "outcome": "pass" },
              { "task": "Rename a field", "outcome": "pass" },
              { "task": "Write a test", "outcome": "pass" },
              { "task": "Refactor the claim service", "outcome": "pass" }
            ]
          }
        ]
      },
      "activity": {
        "id": "evals.gate",
        "maxXp": 20,
        "completion": "the eval is run for each change, the regression is rejected and the passing changes are merged",
        "items": []
      }
    },
    {
      "type": "debrief",
      "heading": "Claude's configuration deserves regression tests like code",
      "simple": "When you change CLAUDE.md, a Skill, a Hook, the model or the prompt, rerun the same eval suite and compare. A person decides which behaviours the suite must protect.",
      "humanDecides": "Which behaviours the eval suite must protect.",
      "addsNode": "Evals"
    }
  ],
  "links": [],
  "claims": [
    {
      "text": "Evals measure Claude's behaviour across a fixed set of sample tasks and are rerun after changes to instructions, Skills, Hooks, the model or the prompt.",
      "verified": null,
      "source": null
    }
  ]
});
