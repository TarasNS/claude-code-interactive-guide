// m12-pipeline.js
Lab.content.registerMission({
  "id": "pipeline",
  "number": 12,
  "stage": "deploy",
  "title": "CI/CD",
  "minutes": 10,
  "xp": 30,
  "reviewedBy": null,
  "reviewedOn": null,
  "beats": [
    {
      "type": "show",
      "heading": "A pipeline is a row of stages with a state each",
      "simple": "Every change passes the same stages, from push to a successful health check. Each stage shows its state by icon, label and border. Step through a demo run. In the demo the human approval is granted for you.",
      "caption": "Illustrative: a scripted run.",
      "component": "pipeline",
      "config": {
        "mode": "demo",
        "label": "A CI/CD pipeline",
        "outcomes": { "approval": "gate" },
        "gate": { "stage": "approval", "approver": "Release manager", "summary": [], "approve": "Approve", "reject": "Reject" },
        "stages": [
          { "id": "push", "label": "Push" },
          { "id": "build", "label": "Build" },
          { "id": "tests", "label": "Tests" },
          { "id": "evals", "label": "Evals" },
          { "id": "review", "label": "AI PR review" },
          { "id": "approval", "label": "Human approval" },
          { "id": "deploy", "label": "Deploy" },
          { "id": "health", "label": "Health check" },
          { "id": "success", "label": "Success" }
        ]
      }
    },
    {
      "type": "explain",
      "heading": "In a pipeline, Claude usually runs unattended",
      "simple": "In a pipeline Claude usually runs unattended, so this is where programmatic or non-interactive use can appear: the command line, an SDK or the API. Everything you built in Claude Code still applies, including CLAUDE.md, Skills and Hooks.",
      "terms": ["claude-api"],
      "notes": [
        "Reminder: you do not need any API integration to use CLAUDE.md, Skills, Plan Mode, Hooks or subagents in normal Claude Code work."
      ]
    },
    {
      "type": "try",
      "heading": "Run the happy path",
      "simple": "Start the run and step through the stages. At Human approval the pipeline stops and asks you. Read the summary, then approve.",
      "component": "pipeline",
      "config": {
        "label": "Release pipeline",
        "outcomes": { "approval": "gate" },
        "gate": {
          "stage": "approval",
          "approver": "Release manager",
          "summary": [
            "Change: add GET /claims/{id}/status.",
            "Tests: all passed.",
            "Evals: no regressions.",
            "AI review: no important findings."
          ],
          "approve": "Approve release",
          "reject": "Reject release"
        },
        "stages": [
          { "id": "push", "label": "Push" },
          { "id": "build", "label": "Build" },
          { "id": "tests", "label": "Tests" },
          { "id": "evals", "label": "Evals" },
          { "id": "review", "label": "AI PR review" },
          { "id": "approval", "label": "Human approval" },
          { "id": "deploy", "label": "Deploy" },
          { "id": "health", "label": "Health check" },
          { "id": "success", "label": "Success" }
        ]
      },
      "activity": {
        "id": "pipeline.happy",
        "maxXp": 10,
        "completion": "the run reaches Success after the release is approved",
        "items": []
      }
    },
    {
      "type": "try",
      "heading": "Run the incident path",
      "simple": "Same pipeline, but after the deploy the health check fails and errors rise. Step through, approve the release, then decide what the pipeline should do.",
      "component": "pipeline",
      "config": {
        "label": "Release pipeline with an incident",
        "outcomes": { "approval": "gate", "health": "fail" },
        "gate": {
          "stage": "approval",
          "approver": "Release manager",
          "summary": [
            "Change: add GET /claims/{id}/status.",
            "Tests: all passed.",
            "Evals: no regressions.",
            "AI review: no important findings."
          ],
          "approve": "Approve release",
          "reject": "Reject release"
        },
        "incident": {
          "stage": "health",
          "title": "The health check failed",
          "prompt": "After the deploy, 5xx errors on the status endpoint are rising. What should the pipeline do?",
          "rollback": "Rollback",
          "options": [
            { "id": "wait", "label": "Wait and watch", "consequence": "Errors keep rising while customers see failures. Waiting is not a plan when a release is causing harm." },
            { "id": "rollback", "label": "Roll back automatically", "correct": true, "consequence": "Rolled back. Customers are protected first, and the team can find the cause calmly. The failed stage shows FAILED, the next stage is BLOCKED, and the rollback PASSED." },
            { "id": "forward", "label": "Push a quick fix forward", "consequence": "A rushed fix skips the safeguards and can make things worse. Roll back first, then fix properly." }
          ]
        },
        "stages": [
          { "id": "push", "label": "Push" },
          { "id": "build", "label": "Build" },
          { "id": "tests", "label": "Tests" },
          { "id": "evals", "label": "Evals" },
          { "id": "review", "label": "AI PR review" },
          { "id": "approval", "label": "Human approval" },
          { "id": "deploy", "label": "Deploy" },
          { "id": "health", "label": "Health check" },
          { "id": "success", "label": "Success" }
        ]
      },
      "activity": {
        "id": "pipeline.incident",
        "maxXp": 20,
        "completion": "the learner rolls back automatically",
        "items": []
      }
    },
    {
      "type": "debrief",
      "heading": "Every stage has a state you can read without colour",
      "simple": "Each stage shows an icon, a text label and a border style, so you can tell waiting, running, passed, failed, blocked and needs-approval apart. The pipeline enforces; people decide what blocks a release.",
      "humanDecides": "What blocks a release, and who approves it.",
      "addsNode": "CI/CD"
    }
  ],
  "links": [],
  "claims": [
    {
      "text": "In CI, Claude usually runs unattended through non-interactive use such as the command line, an SDK or the API.",
      "verified": null,
      "source": null
    },
    {
      "text": "A failed health check after deployment should trigger a rollback before any fix is pushed forward.",
      "verified": null,
      "source": null
    }
  ]
});
