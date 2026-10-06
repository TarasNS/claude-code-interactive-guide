// m11-gates.js
Lab.content.registerMission({
  "id": "gates",
  "number": 11,
  "stage": "deploy",
  "title": "Approval Gates",
  "minutes": 8,
  "xp": 30,
  "reviewedBy": null,
  "reviewedOn": null,
  "beats": [
    {
      "type": "show",
      "heading": "Autonomy should match the risk",
      "simple": "Claude can deploy freely where mistakes are cheap and must ask where they are costly. Development allows deployment, staging may need approval, and production needs release approval. Each carries an icon and a text label.",
      "component": "pipeline",
      "config": {
        "static": true,
        "label": "Three environments",
        "stages": [
          { "id": "dev", "label": "Development", "state": "passed", "stateLabel": "ALLOWED", "detail": "Claude can deploy here without asking." },
          { "id": "staging", "label": "Staging", "state": "approval", "stateLabel": "APPROVAL MAY BE REQUIRED", "detail": "Depends on what is being deployed." },
          { "id": "production", "label": "Production", "state": "locked", "stateLabel": "RELEASE APPROVAL REQUIRED", "detail": "A person must approve every release." }
        ]
      }
    },
    {
      "type": "try",
      "heading": "Set the policy",
      "simple": "Choose Allow, Ask or Deny for each action in each environment. Reading logs is harmless. In production, anything that releases code or changes live data needs a person.",
      "component": "policygrid",
      "config": {
        "prompt": "Choose Allow, Ask or Deny for every cell, then check your policy.",
        "success": "Safe. Reading is open, and production deployments and data changes are gated.",
        "actions": [
          { "id": "deploy", "label": "Deploy" },
          { "id": "migrate", "label": "Run a database migration" },
          { "id": "logs", "label": "Read logs" }
        ],
        "envs": [
          { "id": "dev", "label": "Development" },
          { "id": "staging", "label": "Staging" },
          { "id": "production", "label": "Production" }
        ],
        "rules": [
          { "action": "deploy", "env": "production", "allow": ["ask", "deny"], "reason": "Deploying to production without a person's approval means a mistake reaches customers with nothing to stop it." },
          { "action": "migrate", "env": "production", "allow": ["ask", "deny"], "reason": "A migration changes live customer data and can be hard to undo, so a person must approve it." }
        ],
        "solution": {
          "deploy:dev": "allow", "deploy:staging": "ask", "deploy:production": "ask",
          "migrate:dev": "allow", "migrate:staging": "ask", "migrate:production": "deny",
          "logs:dev": "allow", "logs:staging": "allow", "logs:production": "allow"
        }
      },
      "activity": {
        "id": "gates.policy",
        "maxXp": 10,
        "completion": "no production deployment or data change is left on Allow",
        "items": []
      }
    },
    {
      "type": "try",
      "heading": "Spot the unsafe deployment",
      "simple": "Three pipelines are described below. Exactly one is unsafe. Find it, then name the control it is missing.",
      "component": "choice",
      "config": {
        "options": ["Pipeline A", "Pipeline B", "Pipeline C"],
        "intro": [
          { "title": "Pipeline A", "text": "Push, Build, Tests, release-manager approval, then Deploy with a scoped token that expires." },
          { "title": "Pipeline B", "text": "Push, Build, Tests, then Deploy. Claude holds broad production credentials and nothing asks for approval." },
          { "title": "Pipeline C", "text": "Push, Build, Tests, Evals, approval, then Deploy with scoped credentials and every action logged." }
        ]
      },
      "activity": {
        "id": "gates.detect",
        "maxXp": 20,
        "completion": "the unsafe pipeline and its missing control are both named",
        "items": [
          { "id": "which", "text": "Which pipeline is unsafe?", "answer": "Pipeline B", "explanation": "Pipeline B gives Claude broad production credentials and deploys with no approval stage, so one mistake reaches production unchecked." },
          { "id": "missing", "text": "What control is missing?", "answer": "An approval gate and scoped access", "options": ["An approval gate and scoped access", "More unit tests", "A faster build"], "explanation": "A gate makes a person approve the release, and scoped access limits what Claude can touch even if something goes wrong." }
        ]
      }
    },
    {
      "type": "debrief",
      "heading": "Automate what is safe and make the human gates explicit",
      "simple": "Automate everything that can safely be automated, and make the important human gates explicit. Production access should be scoped, gated and logged.",
      "humanDecides": "How much risk is acceptable, and who approves a release.",
      "addsNode": "Approval gates"
    }
  ],
  "links": [],
  "claims": [
    {
      "text": "Production access for an automated agent should be scoped, gated by human approval and logged.",
      "verified": null,
      "source": null
    }
  ]
});
