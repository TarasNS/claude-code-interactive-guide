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
      "simple": "Before you ask Claude to build anything, write down what you are trying to achieve. Why does this problem matter? Who is affected? What counts as success? That is your intent. It is the north star for every decision that follows."
    },
    {
      "type": "show",
      "heading": "From vague request to intent",
      "simple": "See a vague request transformed into a clear intent with problems, outcomes, constraints and open questions.",
      "component": "compare",
      "config": {}
    },
    {
      "type": "try",
      "heading": "Sort the statements",
      "simple": "Classify statements from a customer request: which are problems, outcomes, constraints, open questions, or solution details?",
      "component": "classifier",
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
            "explanation": "Another symptom of the same problem; a cost to the business."
          },
          {
            "id": "outcome1",
            "text": "Customers can see their current claim status without contacting support.",
            "answer": "Outcome",
            "explanation": "This is the desired end state. If this is true, the problem is solved."
          },
          {
            "id": "outcome2",
            "text": "Fewer status-check calls reach support.",
            "answer": "Outcome",
            "explanation": "Another way to measure success: less support volume on this task."
          },
          {
            "id": "constraint1",
            "text": "Must reuse the existing customer login.",
            "answer": "Constraint",
            "explanation": "A boundary that shapes how you solve it."
          },
          {
            "id": "constraint2",
            "text": "No additional personal data may be exposed.",
            "answer": "Constraint",
            "explanation": "A security and privacy requirement."
          },
          {
            "id": "question1",
            "text": "Should status refresh in real time or once a day?",
            "answer": "Open Question",
            "explanation": "Unknown. The team must decide this during design."
          },
          {
            "id": "question2",
            "text": "Should the adjuster's name be shown to customers?",
            "answer": "Open Question",
            "explanation": "Another design choice; the team will decide."
          },
          {
            "id": "solutiondetail",
            "text": "Build a React page with a progress bar.",
            "answer": "Park it (solution detail)",
            "explanation": "This is how, not what. Technology choices belong in design and plan, not intent."
          }
        ]
      }
    },
    {
      "type": "debrief",
      "heading": "Intent is approved by everyone who cares about the outcome",
      "simple": "Intent drives design and implementation. It is the north star. Start every project here.",
      "humanDecides": "What the outcome is and which open questions matter most.",
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
