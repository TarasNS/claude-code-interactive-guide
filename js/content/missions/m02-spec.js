// m02-spec.js
Lab.content.registerMission({
  "id": "spec",
  "number": 2,
  "stage": "design",
  "title": "Turn Intent Into a Specification",
  "minutes": 8,
  "xp": 30,
  "reviewedBy": null,
  "reviewedOn": null,
  "beats": [
    {
      "type": "explain",
      "heading": "Intent says what and why; the spec says how it behaves",
      "simple": "If the intent is 'customers see their claim status', the spec says exactly how: which endpoint, what it returns, who may call it. Claude turns the intent into a spec using your policies.",
      "deeper": "The plan comes after the spec. The intent is the what and why, the spec is how the system behaves, and the plan is how to build it.",
      "terms": ["specification", "plan"],
      "component": "stepper",
      "config": {
        "label": "From intent to specification",
        "nodes": [
          { "id": "intent", "label": "intent.md", "detail": "What and why" },
          { "id": "claude", "label": "Claude and your policies", "detail": "Turns the intent into precise behaviour" },
          { "id": "spec", "label": "spec.md", "detail": "How the system behaves" }
        ],
        "steps": [
          { "caption": "You start from the intent: the problem, outcome and constraints.", "reveal": ["intent"], "active": "intent" },
          { "caption": "Claude drafts behaviour from it, checking company policies and constraints.", "reveal": ["claude"], "active": "claude" },
          { "caption": "The result is a spec that a person reviews and approves.", "reveal": ["spec"], "active": "spec" }
        ]
      }
    },
    {
      "type": "show",
      "heading": "Every spec line traces back to the intent",
      "simple": "Switch between the two views. Select a line to see which line in the other view it connects to. Nothing in the spec should exist without a reason in the intent.",
      "component": "compare",
      "config": {
        "legend": "Compare the intent with the specification",
        "views": [
          {
            "id": "intent",
            "label": "Intent",
            "heading": "intent.md",
            "lines": [
              { "id": "i1", "text": "Customers should see their claim status.", "traces": ["s2"] },
              { "id": "i2", "text": "Reuse the existing customer login.", "traces": ["s3"] },
              { "id": "i3", "text": "No additional personal data may be exposed.", "traces": ["s4"] }
            ]
          },
          {
            "id": "spec",
            "label": "Specification",
            "heading": "spec.md",
            "lines": [
              { "id": "s1", "text": "GET /claims/{id}/status", "mono": true },
              { "id": "s2", "text": "Returns the current status, next step and expected date." },
              { "id": "s3", "text": "Unauthenticated requests receive 401." },
              { "id": "s4", "text": "Only status data is returned, never the full claim." }
            ]
          }
        ]
      }
    },
    {
      "type": "try",
      "heading": "Trace it",
      "simple": "Match each spec line to the intent statement it came from.",
      "component": "classifier",
      "activity": {
        "id": "spec.trace",
        "maxXp": 15,
        "completion": "all spec lines matched to their intent",
        "buckets": [
          "Customers can see their current claim status.",
          "Must reuse the existing customer login.",
          "No additional personal data may be exposed."
        ],
        "items": [
          {
            "id": "trace1",
            "text": "The response includes status, nextStep and expectedDate.",
            "answer": "Customers can see their current claim status.",
            "explanation": "This line makes the outcome concrete: it says what data is returned to show the status."
          },
          {
            "id": "trace2",
            "text": "Unauthenticated requests receive 401.",
            "answer": "Must reuse the existing customer login.",
            "explanation": "The spec enforces the constraint by requiring authentication on the endpoint."
          },
          {
            "id": "trace3",
            "text": "The endpoint is GET /claims/{id}/status, not GET /claims/{id}.",
            "answer": "No additional personal data may be exposed.",
            "explanation": "Limiting the route to status data keeps the rest of the claim out of the response."
          },
          {
            "id": "trace4",
            "text": "The response never includes the customer's address or phone number.",
            "answer": "No additional personal data may be exposed.",
            "explanation": "Naming the personal fields that must stay out turns the constraint into something testable."
          }
        ]
      }
    },
    {
      "type": "try",
      "heading": "Which document?",
      "simple": "Decide whether each statement belongs in intent.md, spec.md or plan.md.",
      "component": "classifier",
      "activity": {
        "id": "spec.which",
        "maxXp": 15,
        "completion": "all items correctly placed",
        "buckets": ["intent.md", "spec.md", "plan.md"],
        "items": [
          {
            "id": "doc1",
            "text": "Customers should not need to call to learn their claim status.",
            "answer": "intent.md",
            "explanation": "The problem and the outcome you want belong in the intent."
          },
          {
            "id": "doc2",
            "text": "The response includes status, nextStep and expectedDate.",
            "answer": "spec.md",
            "explanation": "This describes how the endpoint behaves, which is specification."
          },
          {
            "id": "doc3",
            "text": "Unauthenticated requests receive 401.",
            "answer": "spec.md",
            "explanation": "This is a behaviour rule, so it belongs in the spec."
          },
          {
            "id": "doc4",
            "text": "Change claimService.js and add a route in routes/claims.js.",
            "answer": "plan.md",
            "explanation": "Which files to change is planning, not behaviour."
          },
          {
            "id": "doc5",
            "text": "Risk: the shared auth middleware is used by every route.",
            "answer": "plan.md",
            "explanation": "A risk found while working out how to build it belongs in the plan."
          },
          {
            "id": "doc6",
            "text": "Success means fewer status-check calls.",
            "answer": "intent.md",
            "explanation": "How you will know the outcome was reached is part of the intent."
          }
        ]
      }
    },
    {
      "type": "debrief",
      "heading": "The spec is approved before planning starts",
      "simple": "The spec is the contract for what the system will do. Claude drafts it quickly, and a person decides whether it really delivers the intent and respects the constraints.",
      "humanDecides": "Whether the spec fully delivers the intent, and approves it before planning starts.",
      "addsNode": "spec.md"
    }
  ],
  "links": [],
  "claims": [
    {
      "text": "A specification describes how a system behaves: endpoints, responses, constraints and error cases.",
      "verified": null,
      "source": null
    },
    {
      "text": "Specification is derived from intent and organizational policies; it is approved before implementation planning.",
      "verified": null,
      "source": null
    }
  ]
});
