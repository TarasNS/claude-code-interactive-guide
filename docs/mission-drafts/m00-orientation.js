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
      "heading": "One loop, two paths",
      "simple": "An AI-native SDLC is one cycle: ask what to build, plan it, build it, test it, review it, release it, measure it, start again. Claude can join at any point. This course shows you how."
    },
    {
      "type": "show",
      "heading": "Claude Code vs Claude API",
      "simple": "Claude Code is interactive: you and Claude work together in a repository. The API is programmatic: your systems call Claude unattended. Both fit the loop. This course uses Claude Code.",
      "component": "compare",
      "config": {}
    },
    {
      "type": "try",
      "heading": "Where does it live?",
      "simple": "Classify each use of Claude: interactive in a repository, or unattended through a system.",
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
            "explanation": "You work interactively in the repository, guided by Claude's suggestions."
          },
          {
            "id": "claude_md",
            "text": "CLAUDE.md",
            "answer": "Claude Code",
            "explanation": "Claude Code reads it from the repository. No API code needed."
          },
          {
            "id": "plan_mode",
            "text": "Plan Mode",
            "answer": "Claude Code",
            "explanation": "An interactive Claude Code feature. You use it at your keyboard."
          },
          {
            "id": "hooks",
            "text": "Hooks",
            "answer": "Claude Code",
            "explanation": "Configured in Claude Code sessions; no API integration required."
          },
          {
            "id": "ci_job",
            "text": "A CI job that runs Claude on every pull request, unattended",
            "answer": "Programmatic / automation",
            "explanation": "A pipeline invokes Claude non-interactively, without a person watching."
          },
          {
            "id": "app_request",
            "text": "Your own application sending requests to the model",
            "answer": "Programmatic / automation",
            "explanation": "Direct model access from code. No Claude Code session involved."
          },
          {
            "id": "skills",
            "text": "Skills",
            "answer": "Works in both",
            "explanation": "The same Skill works in Claude Code and through the API."
          }
        ]
      }
    },
    {
      "type": "debrief",
      "heading": "No API integration needed for Claude Code",
      "simple": "Claude Code works without API integration. Plan Mode, Hooks, Skills and subagents all run in Claude Code.",
      "humanDecides": "When to use Claude Code versus programmatic access, based on whether a human is actively working or automation is running unattended.",
      "addsNode": "intent.md"
    }
  ],
  "links": [],
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
