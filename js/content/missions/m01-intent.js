// m01-intent.js
Lab.content.registerMission({
  "id": "intent",
  "number": 1,
  "stage": "plan",
  "title": "Capture the Intent",
  "minutes": 8,
  "xp": 30,
  "reviewedBy": null,
  "reviewedOn": null,
  "beats": [
    {
      "type": "explain",
      "heading": "Start with the problem, not the solution",
      "simple": "Before you ask Claude to build anything, write down what you are trying to achieve and why. Keep it in a file that is versioned with the code, so everyone works from the same understanding.",
      "deeper": "A versioned intent file gives reviewers and Claude a shared reference. It states the problem, outcome, constraints and open questions, and leaves solution details for later.",
      "terms": ["intent"]
    },
    {
      "type": "show",
      "heading": "From a vague request to a clear intent",
      "simple": "A request like this is where every project starts. A finished intent says who is affected, what success looks like, what limits apply, and what is still unknown.",
      "component": "compare",
      "config": {
        "legend": "Compare the request with the finished intent",
        "views": [
          {
            "id": "request",
            "label": "Vague request",
            "heading": "What the customer said",
            "lines": [
              { "id": "r1", "text": "Customers keep calling us to check their claim." }
            ]
          },
          {
            "id": "intent",
            "label": "Finished intent",
            "heading": "intent.md",
            "lines": [
              { "id": "i1", "text": "Problem: customers call support to find out their claim status." },
              { "id": "i2", "text": "Outcome: customers can see their status without contacting support." },
              { "id": "i3", "text": "Constraint: reuse the existing customer login." },
              { "id": "i4", "text": "Open question: should status refresh in real time or once a day?" }
            ]
          }
        ]
      }
    },
    {
      "type": "try",
      "heading": "Build the intent",
      "simple": "Sort each statement into the part of the intent it belongs to. Solution details are too early, so park them.",
      "component": "classifier",
      "config": {
        "request": "Customers keep calling us to check their claim.",
        "artifact": {
          "file": "intent.md",
          "title": "Intent: claim status self-service",
          "sections": [
            { "heading": "Problem", "bucket": "Problem" },
            { "heading": "Outcome", "bucket": "Outcome" },
            { "heading": "Constraints", "bucket": "Constraint" },
            { "heading": "Open questions", "bucket": "Open Question" },
            { "heading": "Parked for design", "bucket": "Park it (solution detail)" }
          ],
          "extra": [
            {
              "heading": "Affected users and systems",
              "lines": ["Support team", "Customers", "Claims system", "Authentication service"]
            }
          ]
        }
      },
      "activity": {
        "id": "intent.sort",
        "maxXp": 30,
        "completion": "all items correctly placed",
        "buckets": ["Problem", "Outcome", "Constraint", "Open Question", "Park it (solution detail)"],
        "items": [
          {
            "id": "problem1",
            "text": "Customers call support to find out the status of their claim.",
            "answer": "Problem",
            "explanation": "This is an observed problem: time spent on a low-value call."
          },
          {
            "id": "problem2",
            "text": "Support agents spend much of their call time reading out claim status.",
            "answer": "Problem",
            "explanation": "This is another symptom of the same problem, and a cost to the business."
          },
          {
            "id": "outcome1",
            "text": "Customers can see their current claim status without contacting support.",
            "answer": "Outcome",
            "explanation": "This is the desired end state. If it is true, the problem is solved."
          },
          {
            "id": "outcome2",
            "text": "Fewer status-check calls reach support.",
            "answer": "Outcome",
            "explanation": "This is another way to measure success: less support volume on this task."
          },
          {
            "id": "constraint1",
            "text": "Must reuse the existing customer login.",
            "answer": "Constraint",
            "explanation": "This is a boundary that shapes how the problem can be solved."
          },
          {
            "id": "constraint2",
            "text": "No additional personal data may be exposed.",
            "answer": "Constraint",
            "explanation": "This is a security and privacy requirement that any solution must respect."
          },
          {
            "id": "question1",
            "text": "Should status refresh in real time or once a day?",
            "answer": "Open Question",
            "explanation": "Nobody knows yet. The team must decide this during design."
          },
          {
            "id": "question2",
            "text": "Should the adjuster's name be shown to customers?",
            "answer": "Open Question",
            "explanation": "This is another choice the team has to make during design."
          },
          {
            "id": "solutiondetail",
            "text": "Build a React page with a progress bar.",
            "answer": "Park it (solution detail)",
            "explanation": "This says how, not what. Technology choices belong in design and planning, not in the intent."
          }
        ]
      }
    },
    {
      "type": "debrief",
      "heading": "Claude should start by asking what you are trying to achieve",
      "simple": "A good start is the question 'What are we trying to achieve?', not 'Write some code.' The intent is the reference every later step is checked against.",
      "humanDecides": "What the outcome is, and which open questions matter most.",
      "addsNode": "intent.md"
    }
  ],
  "links": [],
  "claims": [
    {
      "text": "Intent captures what and why: the problem, the desired outcome, constraints and open questions, not solution details.",
      "verified": null,
      "source": null
    },
    {
      "text": "Intent is the input to specification; it describes what success looks like before design begins.",
      "verified": null,
      "source": null
    }
  ]
});
