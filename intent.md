# Intent: Interactive Claude Code Learning Experience

- **Status:** Draft
- **Product type:** Interactive browser-based tutorial
- **Primary topic:** Building software effectively with Claude Code
- **Primary source:** Anthropic Claude Academy — The AI-native SDLC playbook

---

## 1. Problem

Anthropic's AI-native SDLC playbook contains valuable guidance for using Claude Code throughout the software development lifecycle.

However, much of the material is presented as a traditional reading course.

For people who learn better by seeing, doing, experimenting, and receiving immediate feedback, the concepts can feel more complicated than they actually are.

Important ideas such as:

- `intent.md`
- `spec.md`
- Plan Mode
- `CLAUDE.md`
- Skills
- Hooks
- Subagents
- Feedback loops
- Evals
- PR review
- CI/CD
- Production feedback

are closely related, but beginners may struggle to understand:

- what each component actually does;
- when it should be used;
- how the components differ;
- which components depend on others;
- what belongs in Claude Code versus an API-based system;
- how the pieces work together in a real development workflow.

The dependency diagram is useful, but the learner still has to mentally translate the diagram into an actual way of working.

## 2. Proposed Outcome

Build a visually rich, interactive, gamified HTML learning experience that teaches users how to build software with Claude Code using the concepts from Anthropic's AI-native SDLC playbook.

The product should preserve the meaning and technical principles of the official material while significantly improving how the information is explained and experienced.

The learner should not simply read the course. They should experience the workflow.

The tutorial should transform:

> "Read about Claude Code development practices"

into:

> "Build a Claude-powered development system step by step and see why every component exists."

## 3. Core Learning Goal

By the end of the experience, the learner should understand the complete loop:

```
IDEA
 ↓
intent.md
 ↓
spec.md
 ↓
Plan Mode
 ↓
CLAUDE.md + Skills
 ↓
Build
 ↓
Subagents where useful
 ↓
Feedback Loop
 ↓
Evals
 ↓
PR Review
 ↓
Hooks / Approval Gates
 ↓
CI/CD
 ↓
Production
 ↓
Metrics / Incidents
 ↓
new intent.md
 ↺
```

The learner should understand not only what these things are, but:

1. Why they exist.
2. What problem they solve.
3. When to use them.
4. When not to use them.
5. How they connect.
6. What the human still controls.
7. How Claude verifies its own work.
8. How increasingly mature teams can automate more of the loop.

## 4. Target Users

Primary users:

- Software engineers starting with Claude Code
- Developers already using Claude Code only as a coding assistant
- Tech leads
- Engineering managers
- Platform engineers
- AI engineers
- DevOps engineers
- Architects

The tutorial should also remain understandable to technically minded product managers.

Assume that the learner understands basic software-development concepts such as Git, tests, pull requests, and CI/CD, but does not need previous knowledge of advanced Claude Code features.

## 5. Teaching Philosophy

The experience should follow:

**Explain → Show → Let me try → Give feedback → Connect it to the bigger system**

Avoid long walls of text.

Each major concept should preferably answer five simple questions:

- **WHAT?** Explain the concept in plain language.
- **WHY?** Explain what development problem it solves.
- **WHEN?** Explain when the learner should use it.
- **SHOW ME.** Show a realistic example.
- **TRY IT.** Give the learner a small interactive task.

Use analogies where they improve understanding. For example:

```
CLAUDE.md = onboarding manual for a developer

Skill = reusable company procedure

Subagent = specialist teammate

Hook = automatic guardrail

Feedback loop = Claude checking its homework

Eval = exam for the agent system

PR review = independent reviewer

CI/CD = automated factory line

Production metrics = sensors telling the system what happened in reality
```

Do not oversimplify technical details when they are important.

## 6. Learning Structure

Organize the main experience around the six stages of the AI-native SDLC.

### Stage 1 — PLAN

**Mission: Capture the Intent**

Teach:

- what `intent.md` is;
- why an idea should become a version-controlled artifact;
- problem;
- desired outcome;
- affected users/systems;
- constraints;
- open questions.

**Interactive activity**

Give the learner a vague request:

> "Customers keep calling us to check their claim."

Let them convert it into an `intent.md`. The interface can provide several candidate statements and let the learner choose where they belong:

```
Problem
Outcome
Constraint
Open Question
```

At the end, visually generate the finished `intent.md`.

**Core lesson**

Claude should not start with:

> "Write some code."

It should start by understanding:

> "What are we trying to achieve?"

### Stage 2 — DESIGN

**Mission: Turn Intent Into a Specification**

Explain how an approved `intent.md` develops into requirements and design.

Visually transform:

```
intent.md

        ↓ Claude + policies

spec.md
```

Teach the learner that `intent.md` describes what and why, while `spec.md` becomes much more precise about how the product should behave.

**Interactive comparison**

```
INTENT

Customers should see their claim status.

                    ↓

SPEC

GET /claims/{id}/status

Returns:
- current status
- next step
- expected date

Constraints:
- existing authentication
- no additional PII
```

Allow the learner to switch between **Intent View** and **Specification View** to understand the transformation.

### Stage 3 — BUILD

This should be the largest part of the tutorial.

#### Mission: Plan Before Coding

Teach Claude Code Plan Mode. Show two paths.

**Path A**

```
Prompt
 ↓
Immediately code
 ↓
Unexpected architecture problem
 ↓
Rework
```

**Path B**

```
spec.md
 ↓
Plan Mode
 ↓
Explore repository
 ↓
Identify files
 ↓
Identify risks
 ↓
Identify tests
 ↓
plan.md
 ↓
Human approval
 ↓
Build
```

Let the learner inspect a simulated repository while Claude creates a plan. The learner can approve or challenge the plan. For example:

- Which files will change?
- What could break?
- Which test proves this works?
- Is there a simpler implementation?

The goal is to teach that Plan Mode is valuable for substantial work but unnecessary for trivial changes.

#### Mission: Teach Claude About the Repository

Introduce `CLAUDE.md`. Explain it as:

> The onboarding document Claude reads when working in this repository.

Show a simulated repository without `CLAUDE.md`. Claude makes several predictable mistakes. Then add `CLAUDE.md` containing:

```
Architecture
Commands
Conventions
Important rules
Known mistakes
Verification requirements
```

Replay the same task. Show the difference.

**Interactive activity**

Give several pieces of information:

```
Use npm test before finishing.

API responses use camelCase.

Never log customer PII.

This task should add a blue button.

Deployments require release-manager approval.
```

Ask: *Which belong in CLAUDE.md?*

This prepares the learner for the next lesson.

#### Mission: Skills

Teach that Skills operationalize reusable knowledge and procedures.

Simple explanation:

- `CLAUDE.md` teaches Claude about this repository.
- A Skill teaches Claude how to perform a repeatable class of work.

Examples:

```
secure-api-review
database-migration
accessibility-review
frontend-design
release-validation
```

Visualize:

```
Task arrives

"Add external API endpoint"

        ↓

Claude detects relevant skill

        ↓

secure-api-review

        ↓

Security procedure applied
```

**Interactive activity**

Ask learners to classify knowledge as:

```
PROMPT
CLAUDE.md
SKILL
HOOK
```

Provide immediate explanations after each choice.

**Skills in depth** *(source: [The Complete Guide to Building Skills for Claude](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf))*

The Skills mission should be expanded into a short sequence of sub-missions so the learner understands both how Skills work and how to build a good one.

*What a Skill is.* A Skill is a folder that teaches Claude a repeatable task or workflow once, so the learner stops re-explaining preferences and procedures in every conversation. Visualize the folder anatomy as an explorable tree:

```
secure-api-review/
├── SKILL.md        required — instructions, with YAML frontmatter
├── scripts/        optional — executable checks (Python, Bash, …)
├── references/     optional — docs loaded only when needed
└── assets/         optional — templates, fonts, icons used in output
```

*Progressive disclosure.* Show the three-level loading model as an animation, with a visible "context budget" meter so the learner sees why it exists:

```
Level 1  Frontmatter (name + description)   always in Claude's context
Level 2  SKILL.md body                      loaded when the skill looks relevant
Level 3  scripts / references / assets      opened only if the task needs them
```

*The description decides everything.* The frontmatter `description` is how Claude chooses whether to load a Skill. It must say **what the Skill does** and **when to use it**, include phrases a user would really say, and stay under 1024 characters with no XML angle brackets. The `name` is kebab-case and matches the folder; the file must be exactly `SKILL.md`; no `README.md` inside the Skill folder.

**Interactive activity — Write the description.** Show a Skill that never triggers because its description is vague ("Helps with projects") and another that fires too often. The learner rewrites the description, then a simulated trigger test runs it against prompts:

```
Should trigger      "Add an external API endpoint for claim status"
Should trigger      "Review this new route for security problems"
Should NOT trigger  "Change the button colour to blue"
Should NOT trigger  "Explain how our CI pipeline works"
```

Teach both failure modes: *under-triggering* (add specific trigger phrases and keywords) and *over-triggering* (add negative triggers and narrow the scope).

**Interactive activity — Inspect a Skill.** Let the learner spot the bugs in a broken Skill folder: a file named `skill.md`, a folder named `Secure_API_Review`, missing `---` delimiters, a description with no "use when" clause. Award progress only when the Skill passes a simulated validator.

*Skill categories.* Show three common kinds, each with a claims-portal example:

- **Document and asset creation** — consistent output with embedded style guides and quality checklists (e.g. a release-notes Skill).
- **Workflow automation** — multi-step processes with validation gates between steps (e.g. `database-migration`).
- **MCP enhancement** — workflow guidance layered on top of tool access.

*Skills vs MCP.* Use the kitchen analogy: MCP is the professional kitchen (tools, ingredients, equipment — *what Claude can do*); a Skill is the recipe (*how Claude should do it*). Make explicit that the two are complementary, and that a Skill does not require MCP.

*Skill patterns.* Offer a compact pattern gallery the learner can click through, each with "use when" guidance: sequential workflow, multi-service coordination, iterative refinement (draft → validate → refine until a quality bar is met), context-aware tool selection, and domain-specific intelligence (check policy *before* acting, keep an audit trail).

*Testing and iterating a Skill.* Introduce the three test types — **triggering** tests (loads when it should, stays quiet when it should not), **functional** tests (correct outputs, edge cases, error handling) and **performance comparison** (with vs without the Skill: fewer back-and-forth messages, fewer failed calls, fewer tokens). Teach the tip to get one hard task working first, then extract the winning approach into a Skill. Skills are living documents: monitor for under- and over-triggering and iterate. This connects forward to the Evals mission.

*When a Skill is not enough.* Connect to Hooks: for a validation that must always hold, the guide recommends bundling a script that checks it programmatically instead of relying on Claude interpreting prose, because code is deterministic and language is not. The learner should see the progression *Skill instruction → Skill with bundled script → Hook that enforces it*.

*Troubleshooting game.* A "why isn't my Skill working?" diagnostic: won't upload (naming, frontmatter), never triggers (description), triggers too often (negative triggers), instructions ignored (too verbose, critical rules buried, ambiguous wording), slow or degraded (SKILL.md too large — keep it focused and move detail to `references/`; too many Skills enabled at once).

*Sharing Skills.* Briefly show how Skills reach people: a personal Skill folder in the Claude Code skills directory, a Skill checked into the repository so the whole team gets it, admin-deployed organization Skills, and the open Agent Skills standard. Skills work across Claude.ai, Claude Code and the API; in this course the learner uses them in Claude Code and does not need the API (see §15).

#### Mission: Hooks

Teach the critical distinction:

```
Skill = tells Claude what it should do

Hook = technically enforces what must happen
```

Example:

```
Skill:
"Never expose PII in logs."

Hook:
Automatically run the PII checker
whenever an API file changes.
```

Show a visual simulation:

```
Claude edits file
      ↓
Hook fires
      ↓
PII detected
      ↓
BLOCKED
      ↓
Claude sees reason
      ↓
Claude fixes code
```

The learner should understand:

> Instructions reduce mistakes. Guardrails enforce boundaries.

#### Mission: Subagents and Parallel Work

Explain the difference particularly clearly because it is easy to confuse.

**Subagent**

```
One Claude Code session

Coordinator
   ├── researcher
   ├── verifier
   └── security reviewer
```

The agents operate as scoped helpers inside the larger task.

**Parallel sessions**

```
Engineer

├── Claude session A → worktree A
├── Claude session B → worktree B
└── Claude session C → worktree C
```

They are independent development streams.

Teach: **More agents are not automatically better.**

For small tasks:

```
One task → One agent
```

For independent complex work:

```
Task
 ├── Backend
 ├── UI
 └── Research
```

parallelism may help.

**Interactive challenge**

Show five development tasks. Ask: *One agent, subagent, or parallel session?* Explain the reasoning after each decision.

### Stage 4 — TEST

#### Mission: Give Claude a Feedback Loop

This should be one of the strongest visual interactions.

Start with:

```
Claude writes code
      ↓
"Done!"
      ↓
Human discovers error
```

Then transform it into:

```
Claude writes code
      ↓
Run test
      ↓
FAIL
      ↓
Inspect failure
      ↓
Fix implementation
      ↓
Run test
      ↓
PASS
      ↓
Run build
      ↓
PASS
      ↓
Human review
```

Animate the loop.

Teach: a Claude session should have a way of observing whether its work actually succeeded. Different work requires different feedback:

```
Backend → tests

Build system → build command

UI → screenshot/browser comparison

API → request/response check

Performance → benchmark

Data → validation query
```

**Interactive activity**

Give Claude a broken implementation. Let the learner press **RUN TEST**. Display the failure. Then let simulated Claude fix it. Run the test again. Award progress only when verification passes.

This should make the concept memorable.

#### Mission: Evals

Explain the difference between tests and evals visually.

```
TEST

Does the software work?

versus

EVAL

Does Claude still perform the task correctly?
```

A test could check:

```
GET /status returns HTTP 200
```

An eval could check whether Claude:

```
passes tests
keeps lint clean
does not remove existing tests
does not expose PII
follows project policy
```

Show what happens when:

```
CLAUDE.md changes
Skill changes
Hook changes
Model changes
Prompt changes
```

Then:

```
Run eval suite
      ↓
Compare quality
      ↓
PASS / REGRESSION
```

Teach that agent configuration deserves regression testing just like code.

### Stage 5 — DEPLOY

#### Mission: AI PR Review

Show:

```
Claude implementation
        ↓
Pull Request
        ↓
Independent AI review
        ↓
Bugs
Security
Plan compliance
Policy compliance
        ↓
Claude fixes findings
        ↓
Human reviews intent + risk
```

Teach separation between **mechanical review** and **human judgment**. The human remains responsible for decisions requiring judgment.

**Interactive activity**

Show a small PR diff with three findings. Let the learner classify each:

```
IMPORTANT

NIT

NOT AN ISSUE
```

Then explain why.

#### Mission: Approval Gates

Demonstrate autonomy levels visually.

Development:

```
Claude → Deploy
         ✅ allowed
```

Staging:

```
Claude → Deploy
         ⚠ approval may be required
```

Production:

```
Claude → Deploy
         🔒 release approval required
```

Teach that AI-native development does not mean removing governance. It means:

> Automate everything that can safely be automated and make important human gates explicit.

#### Mission: CI/CD

Visualize Claude operating inside the pipeline.

```
Push
 ↓
Build
 ↓
Tests
 ↓
Evals
 ↓
AI PR Review
 ↓
Human approval
 ↓
Deploy
 ↓
Health check
 ↓
Success
```

Include a failure scenario:

```
Deploy
 ↓
5xx errors increase
 ↓
Health check fails
 ↓
Rollback
```

Let the learner run the simulated pipeline themselves. Each stage should animate and visibly change state:

```
WAITING
RUNNING
PASSED
FAILED
BLOCKED
```

### Stage 6 — MAINTAIN

#### Mission: Close the Loop

This is where the whole learning experience should come together. Show the learner the complete system they have assembled.

```
Production
    ↓
Metrics
    ↓
Anomaly detected
    ↓
Claude diagnoses
    ↓
intent.md
    ↓
Design
    ↓
Plan
    ↓
Build
    ↓
Test
    ↓
Review
    ↓
Deploy
    ↓
Production
    ↺
```

The final concept is:

> Software development becomes a controlled continuous loop rather than a one-way line from ticket to deployment.

Explain that production signals can create the next piece of work rather than waiting for somebody to manually restart the development process. Human approval should remain at appropriate risk boundaries.

## 7. Gamification

Gamification should support learning rather than distract from it.

The learner progresses through a visual **Claude Engineering Journey**. Possible progression:

```
LEVEL 1  Intent Explorer
LEVEL 2  Spec Designer
LEVEL 3  Claude Planner
LEVEL 4  Context Builder
LEVEL 5  Skill Builder
LEVEL 6  Agent Orchestrator
LEVEL 7  Feedback Engineer
LEVEL 8  Eval Engineer
LEVEL 9  AI Reviewer
LEVEL 10 Release Engineer
LEVEL 11 Loop Architect
```

Award XP for completing meaningful learning actions. Examples:

```
+20 XP  Correctly classify CLAUDE.md vs Skill

+25 XP  Write a Skill description that triggers correctly

+30 XP  Build a valid feedback loop

+30 XP  Detect an unsafe deployment

+40 XP  Design the correct agent architecture

+50 XP  Complete the full SDLC loop
```

Do not reward meaningless clicking.

## 8. Dependency Map

Include an interactive version of the playbook dependency graph. The learner should be able to hover or click each node. Example nodes:

```
Capture Intent
CLAUDE.md
Skills
Feedback Loop
Hooks
Plan Mode
```

Selecting a node should show:

```
WHAT IT IS

WHY IT EXISTS

WHEN TO USE IT

WHAT IT DEPENDS ON

WHAT IT ENABLES

EXAMPLE

TRY IT
```

- Solid connections indicate strong dependencies.
- Dotted connections indicate that another capability helps but is not required.
- The graph should gradually become unlocked as the learner progresses.

Also provide **Explore freely** for users who do not want linear progression. This preserves the important "start anywhere" principle.

## 9. Visual Design

The product should feel like a modern interactive developer environment rather than an LMS.

Desired qualities:

- premium
- modern
- clean
- technical
- slightly playful
- highly visual
- responsive
- polished animations
- strong typography
- excellent information hierarchy

Possible visual inspiration:

```
Developer IDE
+
interactive system diagram
+
strategy game progression map
+
modern product landing page
```

Avoid:

- childish game aesthetics;
- excessive gradients;
- generic dashboard appearance;
- walls of text;
- conventional slide-deck layouts;
- excessive popups;
- animations that slow down learning.

## 10. Interactive Developer Environment

A central visual metaphor should be a simulated development workspace. Possible layout:

```
┌───────────────────────────────────────────────┐
│ Claude Engineering Lab          XP 420 / 500 │
├───────────────┬───────────────────────────────┤
│               │                               │
│ Mission Map   │       Interactive Lab         │
│               │                               │
│ Plan          │  Terminal / editor / diagram │
│ Design        │                               │
│ Build         │                               │
│ Test          │                               │
│ Deploy        │                               │
│ Maintain      │                               │
│               │                               │
├───────────────┴───────────────────────────────┤
│ Explanation / Feedback / Next Challenge      │
└───────────────────────────────────────────────┘
```

The learner should feel that they are building the development system rather than reading about it.

## 11. Progressive System Building

The interface should visually grow as the learner progresses.

At the beginning:

```
YOU → CLAUDE → CODE
```

After `CLAUDE.md`:

```
YOU
 ↓
CLAUDE
 ↕
CLAUDE.md
 ↓
CODE
```

After Skills:

```
YOU
 ↓
CLAUDE
 ├── CLAUDE.md
 └── Skills
 ↓
CODE
```

After feedback:

```
Claude
 ↓
Code
 ↕
Tests
```

After review:

```
Claude → Code → Tests → Review
```

At completion:

```
Intent
 ↓
Design
 ↓
Claude + Context + Skills
 ↓
Build + Agents
 ↓
Feedback
 ↓
Evals
 ↓
Review
 ↓
Gates
 ↓
CI/CD
 ↓
Production
 ↓
Metrics
 ↺
```

The learner should literally see their AI-native engineering system being assembled.

## 12. Explanations

Use plain English first. For every concept provide two modes, and allow users to switch between **Explain simply** and **Go deeper**. This keeps the tutorial useful to both beginners and experienced engineers.

**SIMPLE** — example:

> A hook is an automatic rule that runs when Claude tries to do something.

**DEEPER** — example:

> Claude Code hooks execute deterministic commands around tool-use events and can allow, ask, or deny actions based on organizational policy.

## 13. Realistic Examples

Use one consistent fictional software project throughout the tutorial so concepts build upon one another.

Suggested project: **Customer self-service claims portal**

Example initial problem:

> Customers frequently contact support because they cannot see the current status of their claim.

This project can naturally demonstrate:

- `intent.md`
- API design
- authentication
- PII policies
- `CLAUDE.md`
- security skills
- tests
- logging mistakes
- evals
- PR review
- hooks
- deployment
- error metrics
- rollback
- production incidents

The examples should remain simple enough that understanding the example application does not become harder than understanding Claude Code.

## 14. Source Integrity

The official Anthropic AI-native SDLC playbook is the primary source of truth for the technical concepts represented by the tutorial.

The product may:

- simplify explanations;
- reorganize information;
- add diagrams;
- add analogies;
- create original examples;
- add interactive simulations;
- add exercises;
- add quizzes;
- add game mechanics.

It should not copy large sections of source wording or reproduce the course verbatim.

The goal is to teach the same underlying concepts through a substantially different educational experience.

Where relevant, provide a link back to the official Claude Academy material for deeper reading.

The Skills content additionally draws on Anthropic's [The Complete Guide to Building Skills for Claude](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf), which is the source of truth for Skill structure, frontmatter rules, patterns, testing and distribution. The same rules apply: paraphrase, add original examples, and link back rather than reproduce. Where a Skill detail may change over time (distribution options, limits), the tutorial should link to the current official documentation.

## 15. Claude Code vs API

The tutorial must clearly explain this distinction early.

The main course is about Claude Code and AI-native software-development workflows. Some advanced stages may use API/model access when Claude runs non-interactively inside CI/CD or autonomous systems.

Visually distinguish:

```
CLAUDE CODE
Interactive development environment
Engineers work with Claude in repositories

        versus

CLAUDE API / MODEL ACCESS
Programmatic model access
Used when systems or pipelines invoke Claude automatically
```

Do not allow learners to leave the tutorial thinking they need direct API integration to use `CLAUDE.md`, Skills, Plan Mode, Hooks, or Subagents during normal Claude Code development.

## 16. Human Responsibility

The tutorial should avoid presenting autonomy as the objective by itself.

The lesson should be:

> Give Claude autonomy where verification and guardrails make that autonomy safe.

Humans remain responsible for:

- defining intent;
- resolving ambiguous product decisions;
- determining acceptable risk;
- approving high-risk changes;
- governing production access;
- reviewing decisions requiring judgment.

The experience should visually show where human judgment enters the loop.

## 17. Success Criteria

The product succeeds if a learner who completes it can clearly explain:

1. What an AI-native SDLC is.
2. Why `intent.md` exists.
3. Difference between `intent.md`, `spec.md`, and `plan.md`.
4. What Plan Mode is for.
5. What belongs in `CLAUDE.md`.
6. Difference between `CLAUDE.md`, Skills, prompts, and Hooks.
7. Difference between subagents and parallel sessions.
8. Why more agents are not automatically better.
9. What a feedback loop is.
10. Difference between a feedback loop and a verifier subagent.
11. Difference between tests and evals.
12. How Claude can participate in PR review.
13. Why AI review does not automatically replace human approval.
14. How hooks create deterministic guardrails and approval gates.
15. How Claude can operate inside CI/CD.
16. Why production access should be scoped and gated.
17. How metrics and incidents can restart the development lifecycle.
18. Where Claude Code ends and API/model-driven automation begins.
19. How all the pieces fit together into one controlled system.
20. How a Skill is structured (`SKILL.md`, `scripts/`, `references/`, `assets/`) and how progressive disclosure keeps it cheap.
21. Why a Skill's `description` (what + when) determines whether it triggers, and how to fix under- and over-triggering.
22. How Skills differ from MCP (recipe vs kitchen) and why a Skill does not require MCP.
23. How to test and iterate a Skill, and when a rule should move from a Skill to a script or Hook.

A learner should be able to look at a real repository afterward and say:

> "I understand what I should introduce first, why I need it, and what capability should come next."

## 18. Final Challenge

Finish the experience with a practical scenario rather than a traditional quiz.

Give the learner:

```
A repository
A product request
A security policy
A failing test
A deployment pipeline
A production metric
```

Ask them to construct the correct AI-native workflow. They choose and arrange:

```
intent.md
spec.md
plan.md
CLAUDE.md
Skill
Subagent
Feedback Loop
Eval
PR Review
Hook
CI/CD
Production Monitoring
```

Then simulate the complete workflow. If they make a poor architectural choice, explain the consequence. For example:

> You used a Skill for a mandatory production restriction.

Then demonstrate:

```
Skill recommends rule
        ↓
Claude ignores/misses it
        ↓
Unsafe action possible
```

and teach:

> Use a deterministic Hook for a rule that must always hold.

Completion should show the full system running successfully from idea to production and back into a new `intent.md`.

## 19. Non-Goals

Version 1 does not need:

- a real Claude API integration;
- user accounts;
- backend infrastructure;
- actual GitHub repositories;
- real production deployment;
- a full coding IDE;
- certification;
- multiplayer features.

Interactions can be convincingly simulated in the browser. The educational experience is more important than implementing real infrastructure.

## 20. Technical Constraint

Version 1 should be deliverable as a browser-based interactive experience using HTML, CSS, and JavaScript.

It should:

- work locally;
- require minimal setup;
- be responsive;
- work well on desktop;
- remain usable on mobile;
- persist learner progress locally where appropriate;
- avoid unnecessary dependencies;
- load quickly.

Technology decisions beyond these constraints belong in the design/specification stage rather than this intent.

## 21. Accessibility

The experience should support:

- keyboard navigation;
- visible focus states;
- sufficient contrast;
- reduced-motion preference;
- semantic HTML;
- readable font sizes;
- non-color indicators for state;
- mobile and touch interaction.

Animations must clarify relationships rather than merely decorate the page.

## 22. Open Questions

The design phase should decide:

1. Should the experience be one continuous page or an application-like series of missions?
2. Should progress persist through `localStorage`?
3. How much simulated terminal interaction should be included?
4. Should users be able to edit fake `intent.md`, `CLAUDE.md`, and Skill files directly?
5. Should the tutorial offer Beginner and Advanced modes?
6. Should users be able to skip directly to any play?
7. Should the dependency map serve as the main navigation?
8. Should there be optional links to official Anthropic documentation after each mission?
9. Should a final completion certificate or shareable result exist?
10. Should the tutorial later support real Claude Code repositories as an advanced mode?
11. Should learners be able to export the Skill they build (a downloadable `SKILL.md` folder) to use in their own Claude Code setup?
12. How deep should the Skills sub-missions go for learners who only want the core idea — should the pattern gallery and troubleshooting game be optional "Go deeper" content?
13. Should the Skills lab include the MCP-enhancement category, given that MCP is otherwise outside the scope of this course?

## 23. Guiding Product Principle

Whenever there is a choice between **explaining another paragraph** and **letting the learner interact with the concept**, prefer the interaction.

Whenever there is a choice between **showing a definition** and **showing the concept operating inside the development lifecycle**, show the system operating.

The desired learner reaction is:

> "Now I understand why this exists, where it fits, and how I would actually use it with Claude Code."
