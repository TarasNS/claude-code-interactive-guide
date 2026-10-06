// m05-skills.js
Lab.content.registerMission({
  "id": "skills",
  "number": 5,
  "stage": "build",
  "title": "Skills",
  "minutes": 15,
  "xp": 60,
  "reviewedBy": null,
  "reviewedOn": null,
  "beats": [
    {
      "type": "explain",
      "heading": "A Skill teaches Claude how to do a repeatable kind of work",
      "simple": "CLAUDE.md teaches Claude about your repository. A Skill teaches Claude how to do a repeatable class of work—a security review, a database migration, a test strategy—in any repository. A Skill is a folder you build once and share."
    },
    {
      "type": "show",
      "heading": "Skill anatomy",
      "simple": "A Skill folder holds SKILL.md (required), plus optional scripts, references and assets. Each file serves a purpose.",
      "component": "tree",
      "config": {}
    },
    {
      "type": "show",
      "heading": "Progressive disclosure keeps context small",
      "simple": "Only the frontmatter loads first. The body loads when the Skill looks relevant. Linked files open on demand. This keeps context small.",
      "component": "stepper",
      "config": {}
    },
    {
      "type": "show",
      "heading": "A task arrives; Claude detects the relevant Skill",
      "simple": "Claude reads your prompt, matches it against Skill descriptions, and loads the relevant ones automatically.",
      "component": "stepper",
      "config": {}
    },
    {
      "type": "try",
      "heading": "Write the description",
      "simple": "Rewrite a vague description to be clear, specific, and triggerable on real prompts.",
      "component": "choice",
      "activity": {
        "id": "skills.description",
        "maxXp": 25,
        "completion": "description passes all validator rules and all four trigger tests",
        "items": []
      }
    },
    {
      "type": "try",
      "heading": "Inspect the Skill",
      "simple": "Find five structural defects in a broken Skill folder: naming, format and missing content.",
      "component": "builder",
      "activity": {
        "id": "skills.inspect",
        "maxXp": 20,
        "completion": "all five defects flagged",
        "items": [
          {
            "id": "case",
            "text": "skill.md (wrong case; should be SKILL.md)",
            "answer": true,
            "explanation": "SKILL.md is the required name. Capitalization matters."
          },
          {
            "id": "folder",
            "text": "Folder Secure_API_Review (should be kebab-case: secure-api-review)",
            "answer": true,
            "explanation": "Kebab-case is the standard for Skill folders."
          },
          {
            "id": "frontmatter",
            "text": "Frontmatter missing the closing --- delimiter",
            "answer": true,
            "explanation": "YAML frontmatter needs both opening and closing markers."
          },
          {
            "id": "description",
            "text": "Description with no 'use when' clause",
            "answer": true,
            "explanation": "Every description must say when to load the Skill."
          },
          {
            "id": "readme",
            "text": "README.md inside the Skill folder (should be SKILL.md only)",
            "answer": true,
            "explanation": "Only SKILL.md; README files belong outside the Skill folder."
          }
        ]
      }
    },
    {
      "type": "try",
      "heading": "Where does this live?",
      "simple": "Classify work: Prompt, CLAUDE.md, Skill or Hook?",
      "component": "classifier",
      "activity": {
        "id": "skills.classify",
        "maxXp": 15,
        "completion": "all items correctly placed",
        "buckets": ["Prompt", "CLAUDE.md", "Skill", "Hook"],
        "items": [
          {
            "id": "var",
            "text": "Rename this one variable to `claimId`.",
            "answer": "Prompt",
            "explanation": "Task-specific instruction. Belongs in the prompt, not stored."
          },
          {
            "id": "conventions",
            "text": "Our API uses camelCase and tests run with `npm test`.",
            "answer": "CLAUDE.md",
            "explanation": "Repository conventions. Every task needs to know them."
          },
          {
            "id": "review",
            "text": "A step-by-step security review checklist for any new external endpoint.",
            "answer": "Skill",
            "explanation": "Repeatable kind of work. A Skill can be reused across projects."
          },
          {
            "id": "migration",
            "text": "Safely write database migrations, with rollback steps, in any repository.",
            "answer": "Skill",
            "explanation": "A complex, repeatable process. Skill."
          },
          {
            "id": "enforce",
            "text": "Block any API edit that fails the PII scan.",
            "answer": "Hook",
            "explanation": "A rule that must always hold. A Hook enforces it deterministically."
          },
          {
            "id": "approve",
            "text": "Production deployments need release-manager approval.",
            "answer": "Hook",
            "explanation": "A mandatory gate. A Hook enforces it."
          },
          {
            "id": "db",
            "text": "The repo is a monorepo on Postgres 15.",
            "answer": "CLAUDE.md",
            "explanation": "Repository structure and infrastructure. Every session should know it."
          }
        ]
      }
    },
    {
      "type": "show",
      "heading": "Skills vs MCP",
      "simple": "MCP is the kitchen: what Claude can do. A Skill is the recipe: how Claude should do it.",
      "component": "choice",
      "config": {}
    },
    {
      "type": "debrief",
      "heading": "A Skill is a reusable instruction pack; download yours when you are done",
      "simple": "You can now export your Skill description in a complete SKILL.md template, ready to share.",
      "humanDecides": "Which kinds of work are repeatable enough to warrant a Skill, and where to share it.",
      "addsNode": "Skills"
    }
  ],
  "links": [],
  "claims": [
    {
      "text": "A Skill is a folder containing SKILL.md, with optional scripts, references and assets.",
      "verified": null,
      "source": null
    },
    {
      "text": "The SKILL.md frontmatter must include name, description with a 'use when' clause, and minimum and maximum context tokens.",
      "verified": null,
      "source": null
    },
    {
      "text": "A Skill description triggers loading when the user's prompt matches. The validator checks for length, trigger phrases and overly broad scope.",
      "verified": null,
      "source": null
    },
    {
      "text": "Skills work in Claude Code, Claude.ai and the API. This course focuses on Claude Code.",
      "verified": null,
      "source": null
    }
  ]
});
