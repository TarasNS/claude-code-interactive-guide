// m13-loop.js
Lab.content.registerMission({
  "id": "loop",
  "number": 13,
  "stage": "maintain",
  "title": "Close the Loop",
  "minutes": 10,
  "xp": 30,
  "reviewedBy": null,
  "reviewedOn": null,
  "beats": [
    {
      "type": "show",
      "heading": "Production sends signals that start the next piece of work",
      "simple": "After release, metrics act as sensors. When one shows an anomaly, Claude helps diagnose it, and the finding becomes a new intent. The line you have followed through the course turns into a loop.",
      "caption": "Illustrative: a scripted flow.",
      "component": "stepper",
      "config": {
        "label": "The loop closing",
        "nodes": [
          { "id": "n1", "label": "Production" },
          { "id": "n2", "label": "Metrics" },
          { "id": "n3", "label": "Anomaly detected" },
          { "id": "n4", "label": "Claude diagnoses" },
          { "id": "n5", "label": "New intent.md" },
          { "id": "n6", "label": "Design" },
          { "id": "n7", "label": "Plan" },
          { "id": "n8", "label": "Build" },
          { "id": "n9", "label": "Test" },
          { "id": "n10", "label": "Review" },
          { "id": "n11", "label": "Deploy" },
          { "id": "n12", "label": "Production again" }
        ],
        "steps": [
          { "caption": "The released system is running in production.", "reveal": ["n1"], "active": "n1" },
          { "caption": "Metrics, such as the endpoint's error rate, are the sensors.", "reveal": ["n2"], "active": "n2" },
          { "caption": "A metric moves outside its normal range: an anomaly.", "reveal": ["n3"], "active": "n3" },
          { "caption": "Claude helps diagnose what the logs and metrics show.", "reveal": ["n4"], "active": "n4" },
          { "caption": "The diagnosis becomes a new intent.md, and a person decides it is worth doing.", "reveal": ["n5"], "active": "n5" },
          { "caption": "The new intent goes through design.", "reveal": ["n6"], "active": "n6" },
          { "caption": "Then a plan.", "reveal": ["n7"], "active": "n7" },
          { "caption": "Then the build.", "reveal": ["n8"], "active": "n8" },
          { "caption": "Then the tests.", "reveal": ["n9"], "active": "n9" },
          { "caption": "Then review.", "reveal": ["n10"], "active": "n10" },
          { "caption": "Then deploy, with gates where the risk is.", "reveal": ["n11"], "active": "n11" },
          { "caption": "Back in production. The line has become a loop.", "reveal": ["n12"], "active": "n12" }
        ]
      }
    },
    {
      "type": "try",
      "heading": "From signal to intent",
      "simple": "The status endpoint is returning errors. Read the log excerpt and Claude's diagnosis, then sort the statements into a new intent. Leave out solution detail and speculation.",
      "simulated": true,
      "caption": "Illustrative: a simulated incident and a scripted diagnosis.",
      "component": "classifier",
      "config": {
        "diffLabel": "Simulated log excerpt and diagnosis",
        "diff": "09:10  GET /claims/c-1042/status  500  (timeout)\n09:14  GET /claims/c-2210/status  500  (timeout)\n09:21  GET /claims/c-0377/status  500  (timeout)\n...\nclaude: Error rate on /claims/{id}/status rose from about 0% to 12%\nclaude: between 09:10 and 09:40. All errors are timeouts.\nclaude: I cannot see the cause from these logs alone.",
        "artifact": {
          "file": "intent.md",
          "title": "Intent: restore the claim status endpoint",
          "sections": [
            { "heading": "Problem", "bucket": "Problem" },
            { "heading": "Outcome", "bucket": "Outcome" },
            { "heading": "Constraints", "bucket": "Constraint" },
            { "heading": "Open questions", "bucket": "Open Question" }
          ],
          "extra": [
            { "heading": "Affected users and systems", "lines": ["Customers", "Support team", "Claims system"] }
          ]
        }
      },
      "activity": {
        "id": "loop.intent",
        "maxXp": 30,
        "completion": "all statements correctly sorted",
        "buckets": ["Problem", "Outcome", "Constraint", "Open Question", "Leave out"],
        "items": [
          { "id": "problem", "text": "The status endpoint returned errors for about 12% of requests between 09:10 and 09:40.", "answer": "Problem", "explanation": "This is the observed problem, taken straight from the metrics." },
          { "id": "outcome", "text": "The status endpoint error rate returns to its baseline.", "answer": "Outcome", "explanation": "This is the end state that would show the problem is solved." },
          { "id": "constraint", "text": "No new personal data may be written to logs while debugging.", "answer": "Constraint", "explanation": "Debugging must still respect the PII policy." },
          { "id": "question", "text": "Should the endpoint degrade gracefully when the claims database is slow?", "answer": "Open Question", "explanation": "Nobody knows yet, and the team must decide it during design." },
          { "id": "solution", "text": "Add a retry loop with five attempts around the database call.", "answer": "Leave out", "explanation": "This is a solution detail. How to fix it belongs in design and planning, not the intent." },
          { "id": "speculation", "text": "The database vendor is probably to blame.", "answer": "Leave out", "explanation": "This is speculation. The logs show timeouts, not who is responsible." }
        ]
      }
    },
    {
      "type": "debrief",
      "heading": "The line from the start has become a loop",
      "simple": "Production signals create the next intent, and the same stages run again. Claude speeds up each stage, while approval stays at the points where the risk is.",
      "humanDecides": "Whether an incident warrants new work and at what priority, with approval kept at the risk boundaries.",
      "addsNode": "Production and metrics"
    }
  ],
  "links": [],
  "claims": [
    {
      "text": "Production metrics and logs can be used as signals that start new work, closing the lifecycle loop.",
      "verified": null,
      "source": null
    }
  ]
});
