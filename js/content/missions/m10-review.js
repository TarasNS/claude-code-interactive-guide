// m10-review.js
Lab.content.registerMission({
  "id": "review",
  "number": 10,
  "stage": "deploy",
  "title": "AI PR Review",
  "minutes": 8,
  "xp": 30,
  "reviewedBy": null,
  "reviewedOn": null,
  "beats": [
    {
      "type": "show",
      "heading": "AI review does the mechanical checking; a person judges",
      "simple": "After Claude implements a change and opens a pull request, a separate AI review checks it for bugs, security, plan compliance and policy compliance. Claude fixes what it finds. Then a person reviews intent and risk.",
      "caption": "Illustrative: a scripted flow.",
      "component": "stepper",
      "config": {
        "label": "From implementation to approval",
        "nodes": [
          { "id": "f1", "label": "Claude implements the change" },
          { "id": "f2", "label": "Pull request" },
          { "id": "f3", "label": "Independent AI review" },
          { "id": "f4", "label": "Claude fixes the findings" },
          { "id": "f5", "label": "Human reviews intent and risk" }
        ],
        "steps": [
          { "caption": "Claude implements the planned change.", "reveal": ["f1"], "active": "f1" },
          { "caption": "The change goes into a pull request.", "reveal": ["f2"], "active": "f2" },
          { "caption": "An independent review checks for bugs, security, plan compliance and policy compliance.", "reveal": ["f3"], "active": "f3" },
          { "caption": "Claude fixes the findings that matter.", "reveal": ["f4"], "active": "f4" },
          { "caption": "A person reviews what a machine cannot judge: intent and risk.", "reveal": ["f5"], "active": "f5" }
        ]
      }
    },
    {
      "type": "try",
      "heading": "Triage the findings",
      "simple": "The AI reviewer left three findings on this change. Read the diff, then decide whether each one is important, only a nit, or not an issue at all.",
      "component": "classifier",
      "config": {
        "diffLabel": "The pull request diff",
        "diff": " // src/api/routes/claims.js\n router.use(requireAuth);\n\n+router.get(\"/claims/:id/status\", async (req, res) => {\n+  const d = await getClaim(req.params.id);\n+  console.log(d);\n+  res.json({ status: d.status, nextStep: d.nextStep, expectedDate: d.expectedDate });\n+});"
      },
      "activity": {
        "id": "review.triage",
        "maxXp": 20,
        "completion": "all findings correctly triaged",
        "buckets": ["Important", "Nit", "Not an issue"],
        "items": [
          { "id": "pii", "text": "console.log(d) writes the whole claim, including PII, to the logs.", "answer": "Important", "explanation": "It breaks the rule against logging personal data, so it must be fixed before merging." },
          { "id": "style", "text": "The variable is named d, and the file has no trailing newline.", "answer": "Nit", "explanation": "These are style points only. They are worth tidying but do not block the change." },
          { "id": "auth", "text": "Missing authentication check on the new route.", "answer": "Not an issue", "explanation": "The route sits under router.use(requireAuth), which is visible in the diff context. The reviewer missed it, so this is a false positive." }
        ]
      }
    },
    {
      "type": "try",
      "heading": "Machine or human?",
      "simple": "Some review questions have a checkable answer. Others need a person to weigh trade-offs. Sort each question to who should answer it.",
      "component": "classifier",
      "activity": {
        "id": "review.who",
        "maxXp": 10,
        "completion": "all items correctly placed",
        "buckets": ["Mechanical review", "Human judgment"],
        "items": [
          { "id": "plan", "text": "Does the diff follow the plan?", "answer": "Mechanical review", "explanation": "It can be checked by comparing the diff with the plan." },
          { "id": "bugs", "text": "Are there likely bugs in the new code?", "answer": "Mechanical review", "explanation": "Spotting likely bugs is pattern-checking that AI review does well." },
          { "id": "logging", "text": "Does the change log personal data against policy?", "answer": "Mechanical review", "explanation": "It is a rule that can be checked against the code." },
          { "id": "tradeoff", "text": "Is this the right product trade-off for customers?", "answer": "Human judgment", "explanation": "It weighs priorities and customer needs, which need a person." },
          { "id": "risky", "text": "Is a known risky change acceptable this week?", "answer": "Human judgment", "explanation": "It depends on timing and risk appetite, which a person must own." }
        ]
      }
    },
    {
      "type": "debrief",
      "heading": "AI review reduces what a person has to find",
      "simple": "AI review does not replace human approval. It clears away the mechanical findings so a person can spend attention on intent and risk, where judgment matters most.",
      "humanDecides": "Whether the change delivers the intent and whether its risk is acceptable.",
      "addsNode": "PR review"
    }
  ],
  "links": [],
  "claims": [
    {
      "text": "An independent AI review can check a pull request for bugs, security issues, plan compliance and policy compliance, and may produce false positives.",
      "verified": null,
      "source": null
    }
  ]
});
