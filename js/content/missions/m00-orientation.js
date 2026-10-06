// m00-orientation.js
Lab.content.registerMission({
  "id": "orientation",
  "number": 0,
  "stage": "start",
  "title": "Claude Code vs API, and the loop",
  "minutes": 5,
  "xp": 10,
  "reviewedBy": null,
  "reviewedOn": null,
  "beats": [
    {
      "type": "explain",
      "heading": "One loop, and Claude can join at any point",
      "simple": "Building software is one cycle: decide what to build, plan, build, test, review, release, measure, then start again. Claude can help at every stage. A person decides where the risk is.",
      "deeper": "An AI-native lifecycle keeps the same stages. What changes is who does the routine work, and where a human checkpoint is kept.",
      "terms": ["sdlc-loop"],
      "component": "stepper",
      "config": {
        "label": "The software loop",
        "nodes": [
          { "id": "ask", "label": "Ask", "detail": "What should we build, and why?" },
          { "id": "plan", "label": "Plan", "detail": "How will we build it?" },
          { "id": "build", "label": "Build", "detail": "Write the code" },
          { "id": "test", "label": "Test", "detail": "Does it work?" },
          { "id": "review", "label": "Review", "detail": "Is it safe to merge?" },
          { "id": "release", "label": "Release", "detail": "Put it in front of users" },
          { "id": "measure", "label": "Measure", "detail": "What happened in production?" }
        ],
        "steps": [
          { "caption": "It starts with a question: what are we trying to achieve?", "reveal": ["ask"], "active": "ask" },
          { "caption": "Then a plan for how to get there.", "reveal": ["plan"], "active": "plan" },
          { "caption": "The plan becomes working code.", "reveal": ["build"], "active": "build" },
          { "caption": "Tests show whether the code does what was intended.", "reveal": ["test"], "active": "test" },
          { "caption": "Someone reviews the change before it merges.", "reveal": ["review"], "active": "review" },
          { "caption": "The change is released to users.", "reveal": ["release"], "active": "release" },
          { "caption": "Measurements feed back into the next question, so the loop starts again.", "reveal": ["measure"], "active": "measure" }
        ]
      }
    },
    {
      "type": "show",
      "heading": "Claude Code works with you; the API works for your systems",
      "simple": "Claude Code is interactive: you and Claude work together in a repository. The API is programmatic: your own software or a pipeline calls Claude with nobody watching. Both fit the loop. This course uses Claude Code.",
      "terms": ["claude-code", "claude-api"],
      "component": "compare",
      "config": {
        "legend": "Compare Claude Code and the Claude API",
        "views": [
          {
            "id": "code",
            "label": "Claude Code",
            "heading": "Claude Code: interactive, in a repository",
            "lines": [
              { "id": "c1", "text": "You and Claude work together in your repository." },
              { "id": "c2", "text": "You see and review each change as it happens." },
              { "id": "c3", "text": "CLAUDE.md, Skills, Plan Mode, Hooks and subagents all live here." }
            ]
          },
          {
            "id": "api",
            "label": "Claude API / model access",
            "heading": "Claude API: programmatic, for systems and pipelines",
            "lines": [
              { "id": "a1", "text": "Your own software or a pipeline sends requests to Claude." },
              { "id": "a2", "text": "Nobody watches each request as it runs." },
              { "id": "a3", "text": "You write the code that calls the model." }
            ]
          }
        ]
      }
    },
    {
      "type": "try",
      "heading": "Where does it live?",
      "simple": "Sort each item: is it part of working interactively in Claude Code, something automation does unattended, or something that works in both?",
      "component": "classifier",
      "activity": {
        "id": "orientation.where",
        "maxXp": 10,
        "completion": "all items correctly placed",
        "buckets": ["Claude Code", "Programmatic / automation", "Works in both"],
        "items": [
          {
            "id": "refactor",
            "text": "An engineer asks Claude to refactor a module in the repo",
            "answer": "Claude Code",
            "explanation": "This is interactive work in a repository, guided by the engineer."
          },
          {
            "id": "claude_md",
            "text": "CLAUDE.md",
            "answer": "Claude Code",
            "explanation": "Claude Code reads it from the repository. No API code is needed."
          },
          {
            "id": "plan_mode",
            "text": "Plan Mode",
            "answer": "Claude Code",
            "explanation": "It is an interactive mode of Claude Code that you use at your keyboard."
          },
          {
            "id": "hooks",
            "text": "Hooks",
            "answer": "Claude Code",
            "explanation": "They are set up for Claude Code sessions. No API integration is required."
          },
          {
            "id": "ci_job",
            "text": "A CI job that runs Claude on every pull request, unattended",
            "answer": "Programmatic / automation",
            "explanation": "A pipeline starts Claude without a person watching, so this is automation."
          },
          {
            "id": "app_request",
            "text": "Your own application sending requests to the model",
            "answer": "Programmatic / automation",
            "explanation": "This is direct model access from code, with no Claude Code session involved."
          },
          {
            "id": "skills",
            "text": "Skills",
            "answer": "Works in both",
            "explanation": "The same Skill can be used in Claude Code and through the API."
          }
        ]
      }
    },
    {
      "type": "debrief",
      "heading": "No API integration is needed for everyday Claude Code",
      "simple": "You do not need any API integration to use CLAUDE.md, Skills, Plan Mode, Hooks or subagents in normal Claude Code work.",
      "humanDecides": "Whether a task is interactive work for a person or unattended automation, and which approved tool to use for it.",
      "addsNode": "You, Claude and Code",
      "notice": "ai-tools"
    }
  ],
  "links": [
    { "label": "Claude Code overview", "linkId": "claude-code-overview" }
  ],
  "claims": [
    {
      "text": "Claude Code is interactive work in a repository; the API is programmatic access from applications or pipelines.",
      "verified": null,
      "source": null
    },
    {
      "text": "CLAUDE.md is read by Claude Code; it is not used in API calls.",
      "verified": null,
      "source": null
    },
    {
      "text": "Skills work in both Claude Code and the API.",
      "verified": null,
      "source": null
    }
  ]
});
