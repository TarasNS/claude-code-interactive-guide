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
      "heading": "Intent is what and why; spec is how it behaves",
      "simple": "A specification says how the system works. If the intent is 'customers see claim status', the spec is 'GET /claims/{id}/status returns status, nextStep and expectedDate'. The spec is written with policies and constraints in mind."
    },
    {
      "type": "show",
      "heading": "Intent and specification side by side",
      "simple": "See how an intent statement becomes a concrete spec line: specific endpoints, responses, constraints and error cases.",
      "component": "compare",
      "config": {}
    },
    {
      "type": "try",
      "heading": "Trace it",
      "simple": "Match spec lines to the intent statements they implement.",
      "component": "classifier",
      "activity": {
        "id": "spec.trace",
        "maxXp": 15,
        "completion": "all items correctly matched",
        "buckets": [],
        "items": [
          {
            "id": "trace1",
            "text": "The response includes `status`, `nextStep` and `expectedDate`.",
            "answer": "Customers can see their current claim status.",
            "explanation": "This spec line makes the outcome concrete: what data is returned to show the status."
          },
          {
            "id": "trace2",
            "text": "Unauthenticated requests receive 401.",
            "answer": "Must reuse the existing customer login.",
            "explanation": "The spec enforces the constraint: access is authenticated."
          },
          {
            "id": "trace3",
            "text": "The endpoint is GET /claims/{id}/status, not GET /claims/{id}.",
            "answer": "No additional personal data may be exposed.",
            "explanation": "Limiting the response to status data only implements the constraint."
          }
        ]
      }
    },
    {
      "type": "try",
      "heading": "Which document?",
      "simple": "Classify statements: which belong in intent.md, spec.md or plan.md?",
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
            "explanation": "The problem and desired outcome belong in intent."
          },
          {
            "id": "doc2",
            "text": "The response includes `status`, `nextStep` and `expectedDate`.",
            "answer": "spec.md",
            "explanation": "How the endpoint behaves. This is specification."
          },
          {
            "id": "doc3",
            "text": "Unauthenticated requests receive 401.",
            "answer": "spec.md",
            "explanation": "A behaviour rule; belongs in spec."
          },
          {
            "id": "doc4",
            "text": "Change `claimService.js` and add a route in `routes/claims.js`.",
            "answer": "plan.md",
            "explanation": "Which files to change. This is planning."
          },
          {
            "id": "doc5",
            "text": "Risk: the shared auth middleware is used by every route.",
            "answer": "plan.md",
            "explanation": "A risk or trade-off identified during planning."
          },
          {
            "id": "doc6",
            "text": "Success means fewer status-check calls.",
            "answer": "intent.md",
            "explanation": "How you measure the outcome. Intent."
          }
        ]
      }
    },
    {
      "type": "debrief",
      "heading": "Specification is approved before planning starts",
      "simple": "Specification is the contract: what the system will do, in detail, to meet the intent.",
      "humanDecides": "Whether the spec fully implements the intent and meets the constraints.",
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
