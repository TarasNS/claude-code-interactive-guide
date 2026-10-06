// m08-feedback.js
Lab.content.registerMission({
  "id": "feedback",
  "number": 8,
  "stage": "test",
  "title": "Give Claude a Feedback Loop",
  "minutes": 12,
  "xp": 30,
  "reviewedBy": null,
  "reviewedOn": null,
  "beats": [
    {
      "type": "show",
      "heading": "Claude should be able to see whether its work succeeded",
      "simple": "Without a check, Claude writes code, says Done, and a person finds the error later. With a feedback loop, Claude runs the test, sees the failure, fixes it, and runs the test again before anyone reviews.",
      "terms": ["feedback-loop"],
      "caption": "Illustrative: a scripted example.",
      "component": "stepper",
      "config": {
        "label": "Before and after a feedback loop",
        "paths": [
          { "id": "before", "label": "Before: no feedback" },
          { "id": "after", "label": "After: a feedback loop" }
        ],
        "nodes": [
          { "id": "b1", "path": "before", "label": "Claude writes code" },
          { "id": "b2", "path": "before", "label": "Claude says: Done!" },
          { "id": "b3", "path": "before", "label": "A human finds the error" },
          { "id": "a1", "path": "after", "label": "Write the code" },
          { "id": "a2", "path": "after", "label": "Run the test: FAILED" },
          { "id": "a3", "path": "after", "label": "Inspect the failure" },
          { "id": "a4", "path": "after", "label": "Fix the code" },
          { "id": "a5", "path": "after", "label": "Run the test: PASSED" },
          { "id": "a6", "path": "after", "label": "Run the build: PASSED" },
          { "id": "a7", "path": "after", "label": "Human review" }
        ],
        "steps": [
          { "caption": "Both paths start with Claude writing the code.", "reveal": ["b1", "a1"], "active": "b1" },
          { "caption": "Before: Claude declares the work done without checking. After: the test is run and FAILS.", "reveal": ["b2", "a2"], "active": "b2" },
          { "caption": "Before: a person finds the error. After: Claude inspects the failure.", "reveal": ["b3", "a3"], "active": "b3" },
          { "caption": "After: Claude fixes the code.", "reveal": ["a4"], "active": "a4" },
          { "caption": "After: the test is run again and PASSES.", "reveal": ["a5"], "active": "a5" },
          { "caption": "After: the build is run and PASSES.", "reveal": ["a6"], "active": "a6" },
          { "caption": "Only then does a person review work that has already been checked.", "reveal": ["a7"], "active": "a7" }
        ]
      }
    },
    {
      "type": "show",
      "heading": "Different work needs different feedback",
      "simple": "The right check depends on the kind of work. Select a kind of work to see which feedback signal fits it.",
      "component": "compare",
      "config": {
        "legend": "Match work to its feedback",
        "views": [
          {
            "id": "work",
            "label": "Kind of work",
            "heading": "Kind of work",
            "lines": [
              { "id": "w1", "text": "Backend", "traces": ["f1"] },
              { "id": "w2", "text": "Build system", "traces": ["f2"] },
              { "id": "w3", "text": "User interface", "traces": ["f3"] },
              { "id": "w4", "text": "API", "traces": ["f4"] },
              { "id": "w5", "text": "Performance", "traces": ["f5"] },
              { "id": "w6", "text": "Data", "traces": ["f6"] }
            ]
          },
          {
            "id": "feedback",
            "label": "Feedback signal",
            "heading": "Feedback signal",
            "lines": [
              { "id": "f1", "text": "Tests" },
              { "id": "f2", "text": "The build command" },
              { "id": "f3", "text": "A screenshot or browser comparison" },
              { "id": "f4", "text": "A request and response check" },
              { "id": "f5", "text": "A benchmark" },
              { "id": "f6", "text": "A validation query" }
            ]
          }
        ]
      }
    },
    {
      "type": "try",
      "heading": "Build the loop",
      "simple": "Put the steps in the right order. The test comes after the code, a fix follows an inspection, a second test run follows the fix, and a person reviews last. Leave out anything that skips a check.",
      "component": "builder",
      "config": {
        "prompt": "Pick a step, then add it to your loop. Order matters.",
        "check": "Check my loop",
        "success": "That is a complete feedback loop: every fix is verified before a person reviews it.",
        "slots": [
          { "id": "loop", "label": "Your loop, in order", "ordered": true }
        ],
        "rules": [
          { "type": "before", "a": "code", "b": "test1", "reason": "Run the test only after the code is written, otherwise there is nothing to test." },
          { "type": "before", "a": "test1", "b": "inspect", "reason": "Inspect a failure only after the test has run and shown one." },
          { "type": "before", "a": "inspect", "b": "fix", "reason": "Fix after inspecting the failure, so you fix the real cause." },
          { "type": "before", "a": "fix", "b": "test2", "reason": "A second test run must follow the fix, otherwise nobody knows the fix worked." },
          { "type": "before", "a": "test2", "b": "build", "reason": "Run the build after the tests pass." },
          { "type": "last", "a": "review", "reason": "Human review comes last, on work that has already been checked." }
        ]
      },
      "activity": {
        "id": "feedback.arrange",
        "maxXp": 15,
        "completion": "all steps in a valid order with no skipped check",
        "items": [
          { "id": "review", "text": "Human review", "answer": "loop", "explanation": "A person reviews checked work." },
          { "id": "fix", "text": "Fix the code", "answer": "loop", "explanation": "The loop needs a fix step." },
          { "id": "test1", "text": "Run the test", "answer": "loop", "explanation": "The loop needs a first test run." },
          { "id": "done", "text": "Say Done! without running anything", "answer": "none", "explanation": "Without a check nobody knows whether it works. That is how errors reach the human." },
          { "id": "build", "text": "Run the build", "answer": "loop", "explanation": "The loop needs a build check." },
          { "id": "code", "text": "Write the code", "answer": "loop", "explanation": "The loop starts with the code." },
          { "id": "test2", "text": "Run the test again", "answer": "loop", "explanation": "The loop needs a second test run after the fix." },
          { "id": "inspect", "text": "Inspect the failure", "answer": "loop", "explanation": "The loop needs an inspection step." }
        ]
      }
    },
    {
      "type": "try",
      "heading": "Run the loop",
      "simple": "A function returns expected_date, but the test expects expectedDate. Run the test, let Claude inspect, apply the fix, then run the test and the build. XP is awarded only when both pass.",
      "simulated": true,
      "caption": "Illustrative: the test, the diff and Claude's reasoning are scripted.",
      "component": "terminal",
      "config": {
        "label": "Simulated session in claims-portal",
        "prompt": "$",
        "goal": { "flags": { "testPass": true, "buildPass": true }, "sequence": ["test", "inspect", "fix", "test", "build"] },
        "commands": [
          {
            "id": "test", "cmd": "RUN TEST", "aliases": ["npm test"], "hint": "Run the tests",
            "lines": [
              { "who": "out", "text": "> npm test" },
              { "who": "out", "status": "fail", "text": "tests/claims.status.test.js" },
              { "who": "out", "text": "  expected property: expectedDate" },
              { "who": "out", "text": "  received property: expected_date" }
            ],
            "variants": [
              {
                "if": { "fixed": true },
                "lines": [
                  { "who": "out", "text": "> npm test" },
                  { "who": "out", "status": "ok", "text": "tests/claims.status.test.js" }
                ],
                "sets": { "testPass": true }
              }
            ]
          },
          {
            "id": "inspect", "cmd": "Let Claude inspect", "aliases": ["inspect"], "hint": "Ask Claude to read the failure",
            "lines": [
              { "who": "claude", "text": "The test expects expectedDate, but getClaimStatus returns expected_date." },
              { "who": "claude", "text": "This project uses camelCase for API fields, so the field name is the bug." }
            ]
          },
          {
            "id": "fix", "cmd": "Apply fix", "aliases": ["fix"], "hint": "Apply Claude's change",
            "lines": [
              { "who": "out", "text": "--- src/services/claimService.js" },
              { "who": "out", "text": "-  return { status, nextStep, expected_date: claim.expectedDate };" },
              { "who": "out", "text": "+  return { status, nextStep, expectedDate: claim.expectedDate };" }
            ],
            "sets": { "fixed": true }
          },
          {
            "id": "build", "cmd": "RUN BUILD", "aliases": ["npm run build"], "hint": "Run the build",
            "lines": [
              { "who": "out", "text": "> npm run build" },
              { "who": "out", "status": "ok", "text": "Build succeeded" }
            ],
            "sets": { "buildPass": true }
          }
        ]
      },
      "activity": {
        "id": "feedback.run",
        "maxXp": 15,
        "completion": "the test and the build both pass after the fix",
        "items": []
      }
    },
    {
      "type": "show",
      "heading": "A feedback loop and a verifier subagent do different jobs",
      "simple": "In a loop, the same session checks its own work against a real signal such as a test. A verifier subagent is a separate helper that checks independently. One does not replace the other.",
      "component": "compare",
      "config": {
        "legend": "Compare the two checks",
        "views": [
          {
            "id": "loop",
            "label": "Feedback loop",
            "heading": "Feedback loop: the session checks itself",
            "lines": [
              { "id": "l1", "text": "The same session runs the test and reads the result." },
              { "id": "l2", "text": "It checks against a real signal, such as a failing test." },
              { "id": "l3", "text": "It can fix and retry immediately." }
            ]
          },
          {
            "id": "verifier",
            "label": "Verifier subagent",
            "heading": "Verifier subagent: a separate helper checks",
            "lines": [
              { "id": "v1", "text": "A separate, scoped helper reviews the work." },
              { "id": "v2", "text": "It checks independently of the session that wrote the code." },
              { "id": "v3", "text": "It can catch what the writing session overlooked." }
            ]
          }
        ]
      }
    },
    {
      "type": "debrief",
      "heading": "People define what working means",
      "simple": "A feedback loop lets Claude find and fix its own errors, but only against checks a person chose. The better the checks, the less a reviewer has to catch.",
      "humanDecides": "What counts as working, and whether the result is good enough to merge.",
      "addsNode": "Tests (feedback loop)"
    }
  ],
  "links": [],
  "claims": [
    {
      "text": "Giving Claude a way to run tests and a build and read the results lets it detect and fix its own mistakes before human review.",
      "verified": null,
      "source": null
    },
    {
      "text": "A feedback loop and a verifier subagent are different checks and complement each other.",
      "verified": null,
      "source": null
    }
  ]
});
