// m14-final.js
Lab.content.registerMission({
  "id": "final",
  "number": 14,
  "stage": "maintain",
  "title": "Final Challenge",
  "minutes": 15,
  "xp": 50,
  "reviewedBy": null,
  "reviewedOn": null,
  "beats": [
    {
      "type": "explain",
      "heading": "Now apply everything to a real scenario",
      "simple": "There is no quiz. You get a scenario packet and twelve tiles. Arrange the tiles into a workflow, say what covers each policy, and run it. Poor choices have consequences, and you can revise and run again.",
      "deeper": "A violation-free run earns the full 50 XP. Each critical problem costs 10, each other problem 5, with a floor of 10. Each failed run also reduces the award a little."
    },
    {
      "type": "try",
      "heading": "Build the workflow",
      "simple": "Read the packet, add tiles to the lane in the order you would use them, choose what enforces each policy, and run the workflow.",
      "component": "workflow",
      "config": {
        "packet": [
          { "id": "repo", "label": "Repository", "lines": ["ClaimsPortal: a customer self-service claims portal.", "API in src/api, services in src/services, tests in tests/.", "A shared auth middleware is used by every route."] },
          { "id": "request", "label": "Product request", "lines": ["Customers cannot see their claim status and keep calling support.", "They should see status, next step and expected date without calling."] },
          { "id": "policy", "label": "Security policy", "lines": ["No personal data in logs.", "Production deploys require release-manager approval."] },
          { "id": "test", "label": "Failing test", "lines": ["tests/claims.status.test.js fails.", "It expects expectedDate but the code returns expected_date."] },
          { "id": "pipeline", "label": "Deployment pipeline", "lines": ["Push, Build, Tests, Evals, AI PR review, Human approval, Deploy, Health check, Success."] },
          { "id": "metric", "label": "Production metric", "lines": ["Error rate of GET /claims/{id}/status."] }
        ],
        "tiles": [
          { "id": "intent", "label": "intent.md", "hint": "What and why" },
          { "id": "spec", "label": "spec.md", "hint": "How it behaves" },
          { "id": "plan", "label": "plan.md", "hint": "How to build it" },
          { "id": "claude-md", "label": "CLAUDE.md", "hint": "Teaches Claude the repository" },
          { "id": "skill", "label": "Skill", "hint": "A repeatable kind of work" },
          { "id": "subagent", "label": "Subagent", "hint": "A scoped helper" },
          { "id": "feedback", "label": "Feedback Loop", "hint": "Run tests and read results" },
          { "id": "eval", "label": "Eval", "hint": "Protects behaviour after changes" },
          { "id": "review", "label": "PR Review", "hint": "Independent review" },
          { "id": "hook", "label": "Hook", "hint": "An enforced rule or gate" },
          { "id": "ci", "label": "CI/CD", "hint": "The pipeline" },
          { "id": "monitoring", "label": "Production Monitoring", "hint": "Metrics and alerts" }
        ],
        "policies": [
          { "id": "pii", "label": "No personal data in logs" },
          { "id": "approval", "label": "Production deploys need release-manager approval" }
        ],
        "reasons": [
          { "id": "none", "label": "No stated reason" },
          { "id": "verify", "label": "An independent check of the diff" },
          { "id": "research", "label": "Reading many files for a report" }
        ],
        "simulation": {
          "nodes": [
            { "id": "s1", "label": "Idea" },
            { "id": "s2", "label": "intent.md" },
            { "id": "s3", "label": "spec.md and plan.md" },
            { "id": "s4", "label": "Build with a feedback loop" },
            { "id": "s5", "label": "PR review" },
            { "id": "s6", "label": "Hook gate and approval" },
            { "id": "s7", "label": "CI/CD" },
            { "id": "s8", "label": "Production" },
            { "id": "s9", "label": "Metrics" },
            { "id": "s10", "label": "New intent.md" }
          ],
          "steps": [
            { "caption": "An idea: customers should see their claim status.", "reveal": ["s1"], "active": "s1" },
            { "caption": "It becomes an intent.md that says what and why.", "reveal": ["s2"], "active": "s2" },
            { "caption": "The spec and the plan are written and approved.", "reveal": ["s3"], "active": "s3" },
            { "caption": "Claude builds, runs the tests, and fixes the failing one.", "reveal": ["s4"], "active": "s4" },
            { "caption": "An independent review clears the mechanical findings.", "reveal": ["s5"], "active": "s5" },
            { "caption": "The hook blocks the deploy until the release manager approves.", "reveal": ["s6"], "active": "s6" },
            { "caption": "The pipeline builds, tests and deploys.", "reveal": ["s7"], "active": "s7" },
            { "caption": "The change is live in production.", "reveal": ["s8"], "active": "s8" },
            { "caption": "The error-rate metric is watched.", "reveal": ["s9"], "active": "s9" },
            { "caption": "A metric moves, and a new intent.md is written. The loop is closed.", "reveal": ["s10"], "active": "s10" }
          ]
        }
      },
      "activity": {
        "id": "final.workflow",
        "maxXp": 50,
        "completion": "a violation-free run, or an accepted workflow scored 50 minus penalties, floor 10",
        "items": []
      }
    },
    {
      "type": "debrief",
      "heading": "You built one controlled system, not a pile of features",
      "simple": "Each part has a job: intent and specs aim the work, CLAUDE.md and Skills guide it, feedback and evals check it, hooks and gates enforce it, and monitoring starts the next loop. People decide at the risk points.",
      "humanDecides": "Which risks are acceptable, which rules are enforced, and when to release.",
      "addsNode": "Complete loop"
    }
  ],
  "links": [],
  "claims": [
    {
      "text": "Instructions in CLAUDE.md are context, not enforcement, so a rule that must always hold needs a deterministic hook.",
      "verified": "2026-10-06",
      "source": "Claude Code docs, How Claude remembers your project (code.claude.com/docs/en/memory); Claude Code docs, Best practices, Set up hooks (code.claude.com/docs/en/best-practices)"
    }
  ]
});
