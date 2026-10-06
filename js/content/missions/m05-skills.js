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
      "heading": "A Skill teaches Claude a repeatable kind of work",
      "simple": "CLAUDE.md teaches Claude about this repository. A Skill teaches Claude how to do a repeatable kind of work, such as a security review. A Skill is a folder you build once and use again and again.",
      "deeper": "A Skill is not tied to one repository. Its description decides when Claude loads it, so writing that description well is the most important skill of all.",
      "terms": ["skill"]
    },
    {
      "type": "show",
      "heading": "A Skill is a folder with one required file",
      "simple": "Select each item in the folder to see what it is for. Only SKILL.md is required. The other folders are optional.",
      "component": "tree",
      "config": { "root": "skill", "label": "The secure-api-review Skill folder" }
    },
    {
      "type": "show",
      "heading": "Only what is needed is loaded",
      "simple": "Claude does not read every Skill in full. It keeps only the name and description in mind, reads the body when a Skill looks relevant, and opens linked files only if needed. That keeps its working memory small.",
      "terms": ["progressive-disclosure"],
      "caption": "Illustrative: the meter shows the idea, not exact sizes.",
      "component": "stepper",
      "config": {
        "label": "How a Skill is loaded",
        "meterLabel": "Context used",
        "nodes": [
          { "id": "l1", "label": "Level 1: name and description", "detail": "Always loaded" },
          { "id": "l2", "label": "Level 2: the SKILL.md body", "detail": "Loaded when the Skill looks relevant" },
          { "id": "l3", "label": "Level 3: linked files", "detail": "Opened only when needed" }
        ],
        "steps": [
          { "caption": "Level 1: only the name and description are always loaded. This is why the description matters so much.", "reveal": ["l1"], "active": "l1", "meter": { "value": 5, "label": "very small" } },
          { "caption": "Level 2: the body loads when the Skill looks relevant to the task.", "reveal": ["l2"], "active": "l2", "meter": { "value": 25, "label": "small" } },
          { "caption": "Level 3: linked files open only when the instructions need them.", "reveal": ["l3"], "active": "l3", "meter": { "value": 40, "label": "only what is needed" } }
        ]
      }
    },
    {
      "type": "show",
      "heading": "A task arrives and the right Skill is found",
      "simple": "You ask for an external endpoint. Claude notices that the description of secure-api-review matches, loads that Skill and follows its security procedure. You did not have to remember to ask.",
      "caption": "Illustrative: a scripted example, not real model output.",
      "component": "stepper",
      "config": {
        "label": "A Skill being used",
        "nodes": [
          { "id": "t1", "label": "Task: add an external API endpoint" },
          { "id": "t2", "label": "Claude finds a matching Skill" },
          { "id": "t3", "label": "secure-api-review" },
          { "id": "t4", "label": "The security procedure is applied" }
        ],
        "steps": [
          { "caption": "You ask Claude to add an external API endpoint.", "reveal": ["t1"], "active": "t1" },
          { "caption": "Claude compares the task with the descriptions of the Skills it knows about.", "reveal": ["t2"], "active": "t2" },
          { "caption": "The description of secure-api-review matches, so Claude loads that Skill.", "reveal": ["t3"], "active": "t3" },
          { "caption": "Claude follows the Skill's steps: authentication, response fields, logs and tests.", "reveal": ["t4"], "active": "t4" }
        ]
      }
    },
    {
      "type": "try",
      "heading": "Write the description",
      "simple": "The description decides when Claude loads the Skill, so it must say what the Skill does and when to use it. The starting description is deliberately vague. Rewrite it, then run the simulated trigger test.",
      "component": "textlab",
      "config": { "start": "Helps with APIs." },
      "activity": {
        "id": "skills.description",
        "maxXp": 25,
        "completion": "all six rules and all four test prompts pass",
        "items": []
      }
    },
    {
      "type": "try",
      "heading": "Inspect the Skill",
      "simple": "This Skill folder has five planted defects. Flag each one, then run the simulated validator. It should show green once all five are caught.",
      "component": "flagger",
      "config": {
        "prompt": "Select each line that breaks a Skill rule to flag it.",
        "listLabel": "Skill folder contents",
        "finish": {
          "label": "Run validator",
          "blocked": "The validator still reports problems because you have not flagged them all.",
          "success": "Validator: PASSED. The file name, folder name, frontmatter, description and folder contents are all valid."
        }
      },
      "activity": {
        "id": "skills.inspect",
        "maxXp": 20,
        "completion": "all five defects flagged and the simulated validator shows green",
        "items": [
          { "id": "file", "mono": true, "text": "skill.md", "answer": "flaw", "explanation": "Correct. The file must be named exactly SKILL.md, with that capitalisation." },
          { "id": "folder", "mono": true, "text": "Secure_API_Review/", "answer": "flaw", "explanation": "Correct. Skill folder names use kebab-case, like secure-api-review." },
          { "id": "frontmatter", "mono": true, "text": "Frontmatter opens with --- but has no closing ---", "answer": "flaw", "explanation": "Correct. Frontmatter must be wrapped in a pair of --- lines, otherwise it cannot be read." },
          { "id": "nowhen", "mono": true, "text": "description: Reviews API endpoints for security problems.", "answer": "flaw", "explanation": "Correct. The description has no 'use when' clause, so Claude cannot tell when to load it." },
          { "id": "readme", "mono": true, "text": "README.md (inside the Skill folder)", "answer": "flaw", "explanation": "Correct. Documentation belongs in SKILL.md or references/, not in a README inside the Skill folder." },
          { "id": "name", "mono": true, "text": "name: secure-api-review", "answer": "ok", "explanation": "This line is fine. The name is kebab-case and matches the folder." },
          { "id": "script", "mono": true, "text": "scripts/check-endpoint.sh", "answer": "ok", "explanation": "This is fine. Optional scripts live in a scripts/ folder." },
          { "id": "reference", "mono": true, "text": "references/api-rules.md", "answer": "ok", "explanation": "This is fine. Longer documents live in a references/ folder." }
        ]
      }
    },
    {
      "type": "try",
      "heading": "Where does this live?",
      "simple": "Claude can be guided in four places. Sort each item into the one that fits best.",
      "component": "classifier",
      "activity": {
        "id": "skills.classify",
        "maxXp": 15,
        "completion": "all items correctly placed",
        "buckets": ["Prompt", "CLAUDE.md", "Skill", "Hook"],
        "items": [
          { "id": "rename", "text": "Rename this one variable to claimId.", "answer": "Prompt", "explanation": "It is a one-off request for this task, so just say it in the prompt." },
          { "id": "conv", "text": "Our API uses camelCase and tests run with npm test.", "answer": "CLAUDE.md", "explanation": "These are facts about this repository that apply every time." },
          { "id": "checklist", "text": "A step-by-step security review checklist for any new external endpoint.", "answer": "Skill", "explanation": "It is a repeatable procedure that Claude should load when the task matches." },
          { "id": "migration", "text": "Safely write database migrations, with rollback steps, in any repository.", "answer": "Skill", "explanation": "It is a reusable way of working that is not tied to one repository." },
          { "id": "pii", "text": "Block any API edit that fails the PII scan.", "answer": "Hook", "explanation": "It must hold every time, so it needs an automatic check, not just advice." },
          { "id": "release", "text": "Production deployments need release-manager approval.", "answer": "Hook", "explanation": "It must hold every time, so it needs an enforced gate, not just advice." },
          { "id": "monorepo", "text": "The repo is a monorepo on Postgres 15.", "answer": "CLAUDE.md", "explanation": "It is a fact about this repository that Claude should always know." }
        ]
      }
    },
    {
      "type": "show",
      "heading": "MCP is the kitchen; a Skill is the recipe",
      "simple": "MCP gives Claude access to tools, like the equipment in a professional kitchen. A Skill tells Claude how to use them well, like a recipe. This course covers Skills only, not MCP.",
      "terms": ["mcp"],
      "component": "compare",
      "config": {
        "legend": "Compare MCP and a Skill",
        "views": [
          {
            "id": "kitchen",
            "label": "MCP (the kitchen)",
            "heading": "MCP: what Claude can do",
            "lines": [
              { "id": "k1", "text": "Connects Claude to outside tools and data." },
              { "id": "k2", "text": "Gives Claude the equipment, like a professional kitchen." }
            ]
          },
          {
            "id": "recipe",
            "label": "A Skill (the recipe)",
            "heading": "A Skill: how Claude should do it",
            "lines": [
              { "id": "r1", "text": "Tells Claude the steps and the standards to follow." },
              { "id": "r2", "text": "Makes the work come out the same way each time." }
            ]
          }
        ]
      },
      "cards": [
        { "title": "Document and asset creation", "text": "Skills that produce consistent documents, reports or designs." },
        { "title": "Workflow automation", "text": "Skills that run a multi-step process the same way each time." },
        { "title": "MCP enhancement", "text": "Skills that tell Claude how to use the tools an MCP server provides." }
      ]
    },
    {
      "type": "deeper",
      "heading": "Test and iterate on your Skill",
      "deeper": "Test three things: does it trigger on the right prompts, does it produce valid results, and is it better than no Skill. Perfect one hard task first, then turn what worked into the Skill.",
      "component": "stepper",
      "config": {
        "label": "Testing a Skill",
        "nodes": [
          { "id": "x1", "label": "Triggering tests" },
          { "id": "x2", "label": "Functional tests" },
          { "id": "x3", "label": "Performance comparison" },
          { "id": "x4", "label": "Iterate" }
        ],
        "steps": [
          { "caption": "Triggering tests: it loads on the right prompts and stays out of the way on unrelated ones.", "reveal": ["x1"], "active": "x1" },
          { "caption": "Functional tests: when it loads, the output is valid and complete.", "reveal": ["x2"], "active": "x2" },
          { "caption": "Performance comparison: run the same task with and without the Skill and compare.", "reveal": ["x3"], "active": "x3" },
          { "caption": "Iterate. If it under-triggers, add specific trigger phrases. If it over-triggers, add negative triggers and narrow the scope.", "reveal": ["x4"], "active": "x4" }
        ]
      }
    },
    {
      "type": "deeper",
      "heading": "Five patterns for Skills",
      "deeper": "Most Skills follow one of a few shapes. Pick the one that matches your work.",
      "cards": [
        { "title": "Sequential workflow", "text": "Use when steps must happen in a fixed order. Shape: step 1, then step 2, then step 3." },
        { "title": "Multi-service coordination", "text": "Use when one job spans several tools or systems. Shape: tool A, then tool B, then check both." },
        { "title": "Iterative refinement", "text": "Use when output improves through a draft and check loop. Shape: draft, check, improve, repeat." },
        { "title": "Context-aware tool selection", "text": "Use when the right tool depends on the situation. Shape: look at the case, then choose the tool." },
        { "title": "Domain-specific intelligence", "text": "Use when specialist rules apply, such as compliance. Shape: apply the rules, then record why." }
      ],
      "component": "classifier",
      "activity": {
        "id": "skills.patterns",
        "maxXp": 0,
        "completion": "optional practice: all items correctly placed",
        "buckets": ["Sequential workflow", "Iterative refinement", "Domain-specific intelligence"],
        "items": [
          { "id": "p1", "text": "Create the release notes in a fixed order: gather, summarise, format, publish.", "answer": "Sequential workflow", "explanation": "The steps must happen in order, so this is a sequential workflow." },
          { "id": "p2", "text": "Draft a report, check it against a checklist, and improve it until it passes.", "answer": "Iterative refinement", "explanation": "The output improves through a draft and check loop." },
          { "id": "p3", "text": "Apply the company's data rules to each new field and record the reasoning.", "answer": "Domain-specific intelligence", "explanation": "Specialist rules drive the work, so this is domain-specific intelligence." }
        ]
      },
      "required": false
    },
    {
      "type": "deeper",
      "heading": "Why isn't my Skill working?",
      "deeper": "Match each symptom to its most likely cause. This is optional practice, and no XP is awarded for it.",
      "component": "classifier",
      "activity": {
        "id": "skills.diagnose",
        "maxXp": 0,
        "completion": "optional practice: all symptoms matched",
        "buckets": [
          "Wrong file name or format",
          "Description too vague",
          "Description too broad",
          "Instructions unclear or buried",
          "Skill too large"
        ],
        "items": [
          { "id": "s1", "text": "The Skill won't upload.", "answer": "Wrong file name or format", "explanation": "Check that the file is exactly SKILL.md, the folder is kebab-case and the frontmatter is closed." },
          { "id": "s2", "text": "The Skill never triggers.", "answer": "Description too vague", "explanation": "Fix it by adding specific trigger phrases a user would really say." },
          { "id": "s3", "text": "The Skill triggers on unrelated work.", "answer": "Description too broad", "explanation": "Fix it by adding negative triggers and narrowing the scope." },
          { "id": "s4", "text": "Claude loads the Skill but ignores its instructions.", "answer": "Instructions unclear or buried", "explanation": "Fix it by putting the critical steps first and making them short and specific." },
          { "id": "s5", "text": "Responses are slow or quality drops.", "answer": "Skill too large", "explanation": "Fix it by moving long detail into linked files so less loads at once." }
        ]
      },
      "required": false
    },
    {
      "type": "deeper",
      "heading": "From instruction to script to Hook",
      "deeper": "A rule written as prose can be missed. For a rule that must be exact, bundle a script the Skill runs. For a rule that must always hold, move it to a Hook, which is the next mission.",
      "notes": [
        "Order of strength: an instruction guides, a script checks, a Hook enforces."
      ]
    },
    {
      "type": "debrief",
      "heading": "You wrote a Skill description, and you can keep it",
      "simple": "Skills work across Claude.ai, Claude Code and the API, but this course uses them in Claude Code. What you wrote is the part that decides when Claude loads the Skill. Download it inside a complete SKILL.md.",
      "notes": [
        "To share a Skill, put its folder in the Claude Code skills directory, keep it in the repository so the whole team gets it, or ask an organisation admin to deploy it. Skills follow an open standard called Agent Skills. Features that only Claude Code has do not carry over to other places."
      ],
      "download": "skill-md",
      "humanDecides": "Which kinds of work deserve a Skill, and what its description promises.",
      "addsNode": "Skills"
    }
  ],
  "links": [],
  "claims": [
    {
      "text": "A Skill is a folder containing a SKILL.md file, with optional scripts, references and assets folders.",
      "verified": "2026-10-06",
      "source": "The Complete Guide to Building Skills for Claude (Anthropic), file structure"
    },
    {
      "text": "The file must be named exactly SKILL.md, the folder name is kebab-case, and frontmatter is wrapped in a pair of --- lines.",
      "verified": "2026-10-06",
      "source": "The Complete Guide to Building Skills for Claude (Anthropic), critical rules and troubleshooting"
    },
    {
      "text": "The description lives in frontmatter that is always in Claude's context, so the guide says it must stay under 1024 characters and contain no angle brackets. Claude Code also truncates the combined description and when_to_use text at 1,536 characters in its skill listing.",
      "verified": "2026-10-06",
      "source": "The Complete Guide to Building Skills for Claude (Anthropic), field requirements; Claude Code docs, Extend Claude with skills (code.claude.com/docs/en/skills)"
    },
    {
      "text": "Skills load progressively: the description is always loaded, the body when relevant, and linked files only when needed.",
      "verified": "2026-10-06",
      "source": "The Complete Guide to Building Skills for Claude (Anthropic), progressive disclosure"
    },
    {
      "text": "Skills can be placed in the Claude Code skills directory, committed in a repository, or deployed by an organisation admin, and follow the open Agent Skills standard.",
      "verified": "2026-10-06",
      "source": "The Complete Guide to Building Skills for Claude (Anthropic), distribution and sharing; Claude Code docs, Extend Claude with skills (code.claude.com/docs/en/skills)"
    },
    {
      "text": "Skills work across Claude.ai, Claude Code and the API, but fields and features specific to Claude Code do not carry over.",
      "verified": "2026-10-06",
      "source": "The Complete Guide to Building Skills for Claude (Anthropic); Claude Code docs, Extend Claude with skills (code.claude.com/docs/en/skills)"
    }
  ]
});
