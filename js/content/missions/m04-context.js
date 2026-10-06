// m04-context.js
Lab.content.registerMission({
  "id": "context",
  "number": 4,
  "stage": "build",
  "title": "Teach Claude About the Repository",
  "minutes": 8,
  "xp": 30,
  "reviewedBy": null,
  "reviewedOn": null,
  "beats": [
    {
      "type": "explain",
      "heading": "CLAUDE.md is the onboarding document Claude reads",
      "simple": "When Claude starts work in a repository it reads CLAUDE.md. The file says how the code is organised, which commands to run, which conventions to follow and which mistakes to avoid. Without it, Claude guesses.",
      "deeper": "A good CLAUDE.md holds what is true for this whole repository. Task details belong in the prompt, and rules that must always hold need enforcement as well.",
      "terms": ["claude-md"]
    },
    {
      "type": "show",
      "heading": "The same task, with and without CLAUDE.md",
      "simple": "Claude is asked to add the status endpoint twice. Switch the view to compare. Without CLAUDE.md it makes four predictable mistakes. With it, none of them happen.",
      "simulated": true,
      "caption": "Illustrative: scripted replays, not real model output.",
      "component": "compare",
      "config": {
        "legend": "Compare the two replays",
        "views": [
          {
            "id": "without",
            "label": "Without CLAUDE.md",
            "heading": "Without CLAUDE.md: four mistakes",
            "lines": [
              { "id": "w0", "text": "Task: add GET /claims/:id/status" },
              { "id": "w1", "text": "claude: Runs yarn test. This repository uses npm, so the command fails." },
              { "id": "w2", "text": "claude: Returns snake_case fields such as next_step." },
              { "id": "w3", "text": "claude: Logs the whole claim object, which includes personal data." },
              { "id": "w4", "text": "claude: Stops without running the tests." }
            ]
          },
          {
            "id": "with",
            "label": "With CLAUDE.md",
            "heading": "With CLAUDE.md: none of them",
            "lines": [
              { "id": "c0", "text": "Task: add GET /claims/:id/status" },
              { "id": "c1", "text": "claude: Runs npm test, as the file says." },
              { "id": "c2", "text": "claude: Returns camelCase fields such as nextStep." },
              { "id": "c3", "text": "claude: Logs only the claim id." },
              { "id": "c4", "text": "claude: Runs npm test and npm run build before finishing." }
            ]
          }
        ]
      }
    },
    {
      "type": "try",
      "heading": "What belongs in CLAUDE.md?",
      "simple": "Sort each statement. CLAUDE.md holds what is true for the whole repository, not directions for one task.",
      "component": "classifier",
      "activity": {
        "id": "context.classify",
        "maxXp": 20,
        "completion": "all items correctly placed",
        "buckets": ["CLAUDE.md", "Not CLAUDE.md"],
        "items": [
          {
            "id": "cmd",
            "text": "Use npm test before finishing.",
            "answer": "CLAUDE.md",
            "explanation": "This is a repository command, and Claude needs to know it every session."
          },
          {
            "id": "convention",
            "text": "API responses use camelCase.",
            "answer": "CLAUDE.md",
            "explanation": "This is a project convention that applies to all of the code."
          },
          {
            "id": "rule",
            "text": "Never log customer PII.",
            "answer": "CLAUDE.md",
            "explanation": "Claude should know this rule.",
            "note": "But knowing is not enforcing. A rule that must always hold also needs a Hook."
          },
          {
            "id": "taskspecific",
            "text": "This task should add a blue button.",
            "answer": "Not CLAUDE.md",
            "explanation": "This is direction for one task. It belongs in your prompt, not in the repository's standing file."
          },
          {
            "id": "gate",
            "text": "Deployments require release-manager approval.",
            "answer": "CLAUDE.md",
            "explanation": "Claude should know this rule.",
            "note": "But a rule that must hold needs a gate. See Approval Gates."
          }
        ]
      }
    },
    {
      "type": "try",
      "heading": "Write the CLAUDE.md",
      "simple": "Build the file section by section. Pick a line from the palette, then put it in the section it belongs to. Some lines do not belong in the file at all, so leave those out.",
      "component": "builder",
      "config": {
        "prompt": "Pick a line, then choose its section.",
        "check": "Check my CLAUDE.md",
        "success": "The CLAUDE.md is complete. Claude now starts every session knowing how this repository works.",
        "preview": { "title": "ClaimsPortal", "file": "CLAUDE.md" },
        "slots": [
          { "id": "architecture", "label": "Architecture" },
          { "id": "commands", "label": "Commands" },
          { "id": "conventions", "label": "Conventions" },
          { "id": "rules", "label": "Important rules" },
          { "id": "mistakes", "label": "Known mistakes" },
          { "id": "verification", "label": "Verification requirements" }
        ]
      },
      "activity": {
        "id": "context.build",
        "maxXp": 10,
        "completion": "all six sections filled with the correct lines and no distractors",
        "items": [
          { "id": "arch1", "text": "API code is in src/api and business logic is in src/services.", "answer": "architecture", "explanation": "It describes how the code is organised." },
          { "id": "arch2", "text": "The shared auth middleware in src/api/middleware/auth.js is used by every route.", "answer": "architecture", "explanation": "It describes a part of the structure that has wide impact." },
          { "id": "cmd1", "text": "Run the tests with npm test.", "answer": "commands", "explanation": "It is a command Claude needs to run." },
          { "id": "cmd2", "text": "Build with npm run build.", "answer": "commands", "explanation": "It is a command Claude needs to run." },
          { "id": "conv1", "text": "API responses use camelCase.", "answer": "conventions", "explanation": "It is a convention for the whole project." },
          { "id": "rule1", "text": "Never log customer personal data.", "answer": "rules", "explanation": "It is a standing rule." },
          { "id": "rule2", "text": "Production deployments need release-manager approval.", "answer": "rules", "explanation": "It is a standing rule." },
          { "id": "mist1", "text": "Do not use yarn. This repository uses npm.", "answer": "mistakes", "explanation": "It records a mistake Claude would otherwise repeat." },
          { "id": "mist2", "text": "Do not edit the shared auth middleware to fix one route.", "answer": "mistakes", "explanation": "It records a risky shortcut to avoid." },
          { "id": "ver1", "text": "Run npm test and npm run build before saying a task is done.", "answer": "verification", "explanation": "It says how Claude proves its work." },
          { "id": "dis1", "text": "Make the status page button blue.", "answer": "none", "explanation": "That is direction for one task. Put it in the prompt, not in CLAUDE.md." },
          { "id": "dis2", "text": "Today's priority is the claims dashboard.", "answer": "none", "explanation": "That changes often, so it belongs in the prompt, not in a standing file." }
        ]
      }
    },
    {
      "type": "debrief",
      "heading": "CLAUDE.md teaches Claude this repository; a Skill teaches a kind of work",
      "simple": "CLAUDE.md is the onboarding document for one repository. Next you will meet Skills, which teach Claude a repeatable kind of work that can be used in any repository.",
      "humanDecides": "Which conventions and rules Claude must know when it works in your code.",
      "addsNode": "CLAUDE.md"
    }
  ],
  "links": [],
  "claims": [
    {
      "text": "Claude Code reads CLAUDE.md at the start of a session in the repository.",
      "verified": "2026-10-06",
      "source": "Claude Code docs, How Claude remembers your project (code.claude.com/docs/en/memory)"
    },
    {
      "text": "CLAUDE.md holds commands, code style, workflow rules and common gotchas that apply broadly; information that changes often does not belong in it.",
      "verified": "2026-10-06",
      "source": "Claude Code docs, Best practices, Write an effective CLAUDE.md (code.claude.com/docs/en/best-practices)"
    }
  ]
});
