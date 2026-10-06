# Spec: Claude Engineering Lab

- **Status:** Draft
- **Derived from:** [intent.md](intent.md)
- **Product:** Interactive, gamified, browser-based tutorial on building software with Claude Code
- **Scope:** Version 1

`intent.md` says **what and why**. This document says **how the product behaves**. It makes the decisions the intent left open (§2), defines the architecture, data model, interaction components and every mission, and ends with acceptance criteria. Implementation order and file-level planning belong in `plan.md`.

Section references like "intent §6" point to the numbered sections of `intent.md`.

---

## 1. Summary

**Claude Engineering Lab** is a static web app (HTML, CSS and plain JavaScript, no build step, no backend) that looks and feels like a small development workspace. The learner works through **15 missions** across the six SDLC stages. Each mission is a short sequence of *beats* (explain, show, try, debrief). The learner earns XP only for verified understanding, reaches 11 levels, and watches a diagram of their own AI-native engineering system grow until the loop closes at the end.

All examples use one fictional project, the **ClaimsPortal** (a customer self-service claims portal). All data, repositories, logs and "Claude" behaviour are scripted simulations. Nothing calls a model or a network service.

---

## 2. Decisions on the intent's open questions

| # | Question (intent §22) | Decision | Rationale |
|---|---|---|---|
| 1 | One page or series of missions? | **Application-like single-page app** with one mission on screen at a time. A landing view, mission views, a map view and a summary view, switched by hash routing. | Keeps each interaction focused. Hash routing works on `file://`. |
| 2 | Persist progress in `localStorage`? | **Yes.** One versioned key, wrapped in try/catch with an in-memory fallback. A visible "progress is saved in this browser" note and a Reset button. | Intent §32. Must degrade gracefully in private windows. |
| 3 | How much simulated terminal? | A **scripted terminal** used in four missions (Plan, Context, Feedback, Pipeline). Input is constrained: suggested-command buttons plus typed input that is accepted only if it matches an allowed command (with autocomplete). No free shell. | Gives the "real tool" feel without dead ends. |
| 4 | Editable fake files? | **Constrained editing.** `intent.md` and `CLAUDE.md` are built by selecting and placing lines. The Skill `description` is the only free-text field, checked by a deterministic validator (§9.8.1). | Free text is unfair to grade. One free-text exercise is where it teaches the most. |
| 5 | Beginner and Advanced modes? | **No separate modes.** One global **Explain simply / Go deeper** switch (intent §24). Deeper content adds beats and detail; it never gates progress or XP. | Avoids two courses to maintain. |
| 6 | Skip to any play? | **Yes**, through **Explore freely** (no locks) and by clicking any unlocked mission or map node. | "Start anywhere" principle (intent §20). |
| 7 | Dependency map as main navigation? | **Secondary navigation.** The mission rail is the primary path; the map is its own view, and every node links to its mission. | A graph is poor as the only path for a first-time learner. |
| 8 | Links to official documentation? | **Yes**, a short "Read more" list at the end of each mission, from a single `links.js` file, opened in a new tab. Never required. | Intent §14. |
| 9 | Completion certificate? | **No certificate.** At the end the learner gets a **Journey summary** with their generated final `intent.md` (copy and download). | Certification is a non-goal. |
| 10 | Real repositories as an advanced mode? | **Out of scope for v1.** | Non-goal. |
| 11 | Export the learner's Skill? | **Yes.** The Skill lab offers "Download SKILL.md" generated client-side. | Turns the lesson into something usable. |
| 12 | How deep are Skills sub-missions? | The core Skills path is required. The **pattern gallery** and **troubleshooting game** are *Go deeper* only and are not required for completion. | Keeps the core path short. |
| 13 | MCP-enhancement in the Skills lab? | **Concept only.** The kitchen analogy and a category card explain MCP versus Skills. There is no MCP lab. | MCP is outside this course's scope. |

---

## 3. Scope

### 3.1 In scope

Everything in `intent.md` §6 to §18, §20 to §23, plus the Skills content added to intent §6 (Stage 3, Skills).

### 3.2 Non-goals

Those in intent §19, and additionally: no analytics or tracking, no cookies, no network requests at runtime (except user-clicked outbound links), no third-party scripts, no web fonts, no user-generated content leaving the browser, no server-side rendering.

---

## 4. Architecture

### 4.1 Principles

1. **No build step.** The repository root *is* the deployable site. Open `index.html` by double-click, or host the folder on any static host (for example GitHub Pages).
2. **No ES modules.** Browsers block module scripts on `file://`. Use classic `<script defer>` files that each register on a single global namespace, `window.Lab`.
3. **Data-driven missions.** A mission is a data object plus the reusable components it names. Adding a mission should not require new rendering code unless it needs a new component.
4. **Pure logic is separate from the DOM.** XP, unlock rules, validators and the final-challenge rules engine are pure functions, so they can be tested without a browser (§17).
5. **Semantic HTML first.** Components render real `<button>`, `<ul>`, `<table>`, `<details>` and form controls. SVG is used only for diagrams.

### 4.2 Repository layout

```
index.html                 shell, landing markup, script and style tags
css/
  tokens.css               design tokens (colour, type, space, motion, z-index)
  base.css                 reset, typography, focus styles, utilities
  layout.css               app shell, rail, lab, coach panel, responsive rules
  components.css           classifier, compare, stepper, terminal, pipeline, builder, diagram, map
  missions.css             mission-specific styling only
js/
  core/
    store.js               state, persistence, selectors
    router.js              hash router
    xp.js                  XP awards, levels, anti-gaming rules (pure)
    unlock.js              mission and map-node unlock rules (pure)
    a11y.js                live-region announcer, focus management, reduced-motion
    dom.js                 tiny helpers: h(), mount(), on(), ids
  components/
    choice.js              single-choice cards with per-option feedback
    classifier.js          tap-to-place sorting into labelled buckets
    compare.js             two-state toggle view (intent/spec, before/after)
    stepper.js             animated sequence with Play, Step and Reset
    terminal.js            scripted terminal
    pipeline.js            stage runner with five states
    builder.js             pick and arrange items under rules
    tree.js                explorable file tree
    diagram.js             "Your System" SVG renderer
    map.js                 dependency map renderer
    coach.js               feedback panel
  content/
    missions/              m00-orientation.js ... m14-final.js (one file per mission)
    system-nodes.js        nodes of the Your System diagram
    map-graph.js           nodes and edges of the dependency map
    links.js               curated outbound links
    glossary.js            Simple and Deeper definitions
  app.js                   boot: store, router, shell, first render
tests.html                 dependency-free browser test page (§17)
README.md                  how to run, structure, how to add a mission
```

### 4.3 Global namespace

```
Lab.store    state + persistence        Lab.xp       award and level maths
Lab.router   hash routing               Lab.unlock   availability rules
Lab.a11y     announcer, focus           Lab.ui       component registry
Lab.content  mission and graph data     Lab.dom      helpers
```

### 4.4 Routes

| Hash | View |
|---|---|
| `#/` | Landing: pitch, **Start the journey**, **Explore freely**, **Continue** (when progress exists) |
| `#/m/<missionId>` | Mission view, optional `?beat=<n>` |
| `#/map` | Dependency map |
| `#/summary` | Journey summary (available after mission 14, or in Explore) |

Unknown hashes fall back to `#/`. Navigation moves focus to the view's `<h1>`.

### 4.5 Browser support

Latest two versions of Chrome, Edge, Firefox, Safari and iOS Safari. Must work from `file://`.

### 4.6 Performance budget

- Total shipped code (HTML, CSS, JS) under **300 KB uncompressed**, no images other than inline SVG.
- Landing view interactive in under 1 second from local disk on a mid-range laptop.
- Animations use `transform` and `opacity` only. No layout thrash in loops.

### 4.7 Security

- Learner-typed text (the Skill description) is only ever written with `textContent`, never `innerHTML`.
- `index.html` sets a restrictive `Content-Security-Policy` meta tag (`default-src 'self'`, inline styles allowed for SVG attributes only if needed).
- Outbound links use `target="_blank" rel="noopener noreferrer"`.

---

## 5. Application shell and layout

### 5.1 Regions

```
┌──────────────────────────────────────────────────────────────────┐
│ Header: Claude Engineering Lab │ Level + XP bar │ Simple|Deeper │ ⚙ │
├──────────────┬───────────────────────────────────┬───────────────┤
│ Mission rail │ Lab (current mission, one beat)   │ Your System   │
│ 6 stages     │                                   │ (diagram)     │
│ 15 missions  │                                   │               │
├──────────────┴───────────────────────────────────┴───────────────┤
│ Coach panel: explanation · feedback · next challenge · Continue   │
└──────────────────────────────────────────────────────────────────┘
```

- **Header.** Product name, current level title, XP bar (`XP 420 / 500`), the **Explain simply / Go deeper** switch, and a settings menu (theme, reduced motion, reset progress, Explore freely toggle).
- **Mission rail.** Six stage groups (Plan, Design, Build, Test, Deploy, Maintain), each listing its missions with a status glyph and text: *Locked*, *Available*, *In progress*, *Complete*. Shows the Claude Code versus API orientation mission first.
- **Lab.** Renders the current beat. One primary action per beat.
- **Your System.** The progressive diagram (§12). Always visible at ≥1280 px; otherwise a tab beside the mission.
- **Coach panel.** The only place for feedback text. It is an `aria-live="polite"` region. It replaces modals and popups entirely.

### 5.2 Responsive behaviour

| Width | Layout |
|---|---|
| ≥1280 px | Rail, Lab and Your System side by side; coach panel docked at the bottom. |
| 768–1279 px | Rail collapses to icons plus a stage label; Your System becomes a tab above the Lab. |
| <768 px | Single column. Rail becomes a slide-in drawer opened from a menu button. Your System is a tab. The coach panel sits in normal flow under the interaction, never as an overlay. Touch targets are at least 44×44 px. |

No horizontal page scroll at any width from 320 px. Code blocks scroll inside their own container.

### 5.3 The beat model

A mission is an ordered list of **beats**. Only one beat is visible at a time, with progress dots and Back / Continue controls. Beat types:

| Type | Purpose | Gating |
|---|---|---|
| `explain` | WHAT / WHY / WHEN in plain language, with the Simple or Deeper text | None |
| `show` | A scripted demonstration (stepper, compare, replay) | None |
| `try` | An activity using a component | **Continue is disabled until the activity's completion rule passes** (in Explore mode too, but the learner may press "Skip for now", which awards no XP) |
| `debrief` | Connect to the bigger system; the system diagram gains its new node | None |
| `deeper` | Extra detail shown only in Go deeper | Never required |

Beats are short: a heading, at most about 60 words of prose, and one visual. Longer reading is split into more beats.

---

## 6. State and persistence

### 6.1 Storage

`localStorage` key `cclab.v1`. Reads and writes are wrapped in try/catch; on failure the store keeps working in memory and the settings menu shows "Progress will not be saved in this browser."

### 6.2 Schema

```json
{
  "v": 1,
  "settings": { "explain": "simple", "theme": "system", "reducedMotion": "system", "explore": false },
  "missions": {
    "context": { "beat": 3, "complete": false }
  },
  "activities": {
    "context.classify": { "attempts": 2, "done": true, "xp": 15 }
  },
  "lastView": "#/m/context",
  "updatedAt": "2026-10-06T12:00:00.000Z"
}
```

- **XP is derived.** Total XP is the sum of `activities[*].xp`. It is never stored separately, so it cannot drift.
- **Level is derived** from completed missions (§11.2).
- An unknown `v` triggers a migration function; if none exists the app offers Reset instead of crashing.
- **Reset progress** asks for inline confirmation (not a modal) and clears the key.

### 6.3 Selectors (public contract of `Lab.store`)

`getSettings()`, `setSetting(k, v)`, `getActivity(id)`, `recordAttempt(id, result)`, `completeMission(id)`, `isMissionComplete(id)`, `totalXp()`, `level()`, `subscribe(fn)`.

---

## 7. Interaction components

Every component takes a config object, renders accessible DOM, and reports through a single callback: `onResult({ activityId, correct, mistakes, detail })`. The mission runner turns results into XP and coach feedback.

### 7.1 `classifier`: tap-to-place sorting

- A pool of item cards and 2–5 labelled buckets.
- **Primary interaction:** select a card (click, tap, Enter or Space), then select a bucket. This works identically on mouse, touch and keyboard. Pointer **drag-and-drop is an optional enhancement**, never the only route.
- Each placement gives **immediate feedback** in the coach panel with the item's explanation, whether right or wrong. A wrong placement is marked and the card returns to the pool; the explanation says *why*, not just "incorrect".
- Cards carry an optional `acceptable` list (more than one defensible bucket) and a `note` for nuanced items.
- Completion rule: every item correctly placed. `mistakes` counts wrong placements.
- Correct placement is shown with text and an icon, never colour alone.

### 7.2 `compare`: two-state view

Segmented control (a real radio group) switching between two views, for example **Intent view / Specification view**, **Without CLAUDE.md / With CLAUDE.md**. Optionally *linked*: selecting a line in one view highlights the line it traces to in the other.

### 7.3 `stepper`: animated sequence

Renders a flow (boxes and arrows) and plays it step by step: **Play**, **Pause**, **Step**, **Reset**, speed control. Under reduced motion it starts paused and advances only with **Step**. Each step has a caption that is also announced in the live region. Used for Path A vs Path B, the hook simulation, the feedback loop and the loop closing.

### 7.4 `terminal`: scripted terminal

- Dark, monospaced panel with a prompt, suggested-command chips and a text input with autocomplete over the allowed commands.
- Each allowed command maps to a scripted output (lines with optional delay and a status: `ok`, `fail`, `info`).
- Unknown commands print a friendly list of valid commands for this step. The terminal never dead-ends.
- Output is real text in a `role="log"` region so screen readers can read it.
- Supports scripted "Claude" turns: lines prefixed `claude ›` that are visually distinct from command output.

### 7.5 `pipeline`: stage runner

Stages as cards with a state of exactly one of:

| State | Icon | Label |
|---|---|---|
| waiting | ○ | WAITING |
| running | ◔ (animated) | RUNNING |
| passed | ✓ | PASSED |
| failed | ✕ | FAILED |
| blocked | ⛔ | BLOCKED |

State is always conveyed by icon *and* text, plus colour. The learner starts the run, can step stage by stage, and at gated stages must act (approve, reject). A scenario file declares each stage's outcome so runs are deterministic.

### 7.6 `builder`: arrange and configure

Used for `intent.md`, `CLAUDE.md`, hook configuration and the final workflow. Items are chosen from a palette and placed in ordered slots. Validation rules are declared in data (required items, forbidden items, ordering constraints, and a human-readable reason for each). Keyboard operation: Tab to a palette item, Enter to pick it up, arrow keys or slot buttons to place it, Enter to drop.

### 7.7 `tree`: explorable file tree

A real `role="tree"` with arrow-key navigation. Selecting a file shows its contents in a code panel. Used for the simulated repository and the Skill folder.

### 7.8 `choice`: single choice with consequences

Large option cards. Selecting one reveals that option's explanation and, where defined, a short consequence animation (for example "rework" on the wrong plan). Used for decisions such as one agent, subagent or parallel session.

### 7.9 `coach`

Holds the current feedback message, a **Hint** button (reveals up to two progressive hints, each costing nothing but recorded), a **Why?** expander that shows the *Deeper* explanation, and the primary **Continue** action. Messages are announced to assistive technology once.

---

## 8. Explain simply / Go deeper

- Every concept has a record in `glossary.js`:

  ```js
  { id: "hook", simple: "A hook is an automatic rule that runs when Claude tries to do something.",
    deeper: "Claude Code hooks execute deterministic commands around tool-use events and can allow, ask, or deny actions based on policy." }
  ```
- The header switch sets `settings.explain`. Switching re-renders the current beat in place, without losing activity state.
- `explain` and `show` beats supply `simple` and `deeper` text. A `deeper` beat appears only in Go deeper mode.
- Go deeper may add precision, terminology and caveats. It must not contain required information that the Simple version omits.

---

## 9. Missions

### 9.1 Mission list, levels and XP

| ID | # | Stage | Mission | Component focus | XP | Level reached on completion |
|---|---|---|---|---|---|---|
| `orientation` | 0 | Start | Claude Code vs API, and the loop | classifier, stepper | 10 | – |
| `intent` | 1 | Plan | Capture the Intent | classifier, builder | 30 | **1** Intent Explorer |
| `spec` | 2 | Design | Turn Intent Into a Specification | compare, classifier | 30 | **2** Spec Designer |
| `plan` | 3 | Build | Plan Before Coding | stepper, tree, terminal, choice | 40 | **3** Claude Planner |
| `context` | 4 | Build | Teach Claude About the Repository | compare, classifier, builder | 30 | **4** Context Builder |
| `skills` | 5 | Build | Skills | tree, stepper, text validator, classifier | 60 | – |
| `hooks` | 6 | Build | Hooks | builder, stepper | 30 | **5** Skill Builder |
| `agents` | 7 | Build | Subagents and Parallel Work | choice | 40 | **6** Agent Orchestrator |
| `feedback` | 8 | Test | Give Claude a Feedback Loop | builder, terminal | 30 | **7** Feedback Engineer |
| `evals` | 9 | Test | Evals | compare, choice | 30 | **8** Eval Engineer |
| `review` | 10 | Deploy | AI PR Review | classifier | 30 | **9** AI Reviewer |
| `gates` | 11 | Deploy | Approval Gates | builder, choice | 30 | – |
| `pipeline` | 12 | Deploy | CI/CD | pipeline | 30 | **10** Release Engineer |
| `loop` | 13 | Maintain | Close the Loop | stepper, choice | 30 | – |
| `final` | 14 | Maintain | Final Challenge | builder, pipeline | 50 | **11** Loop Architect |

Total **500 XP**. Level N is reached when every mission that lists it is complete.

### 9.2 Common mission rules

- Each mission page title: stage label, mission name, level it contributes to, estimated minutes.
- Each `try` beat is an **activity** with an id (`<mission>.<name>`), `maxXp`, a completion rule, and per-item explanations.
- The last beat is always a `debrief` that names what this concept connects to, what the human still decides, and adds the mission's node to Your System.
- A "Read more" list from `links.js` follows the debrief.
- The same ClaimsPortal repository, request, policy and metrics recur so each mission builds on the previous one (§13).

### 9.3 Mission 0 — Orientation

**Goal.** Establish the loop and the Claude Code vs API distinction before anything else (intent §27).

Beats:

1. `explain`: the full loop as a stepper, nodes revealed one at a time, with a caption on each.
2. `show`: a split panel, **CLAUDE CODE** (interactive, engineers work with Claude in repositories) versus **CLAUDE API / MODEL ACCESS** (programmatic, systems and pipelines invoke Claude).
3. `try` — **Where does it live?** (`orientation.where`, 10 XP). Classifier with buckets *Claude Code*, *Programmatic / automation*, *Works in both*:

   | Item | Bucket | Why |
   |---|---|---|
   | An engineer asks Claude to refactor a module in the repo | Claude Code | Interactive work in a repository |
   | `CLAUDE.md` | Claude Code | Read by Claude Code in the repo; no API code needed |
   | Plan Mode | Claude Code | An interactive Claude Code mode |
   | Hooks | Claude Code | Configured for Claude Code sessions; no API integration needed |
   | A CI job that runs Claude on every pull request, unattended | Programmatic / automation | Non-interactive invocation by a pipeline |
   | Your own application sending requests to the model | Programmatic / automation | Direct model access from code |
   | Skills | Works in both | The same Skill works in Claude Code and through the API |

4. `debrief`: "You do **not** need any API integration to use `CLAUDE.md`, Skills, Plan Mode, Hooks or subagents in normal Claude Code work." This sentence is shown verbatim as a pinned note. A reminder reappears in the Pipeline mission.

### 9.4 Mission 1 — Capture the Intent (Plan)

**Goal.** Turn a vague request into an `intent.md` (intent §6, Stage 1).

Beats: `explain` (what, why a versioned artifact, why start with understanding) → `show` (a vague request and a finished intent side by side) → `try` → `debrief`.

**Activity — Build the intent** (`intent.sort`, 30 XP). The request shown is:

> "Customers keep calling us to check their claim."

Classifier with buckets **Problem**, **Outcome**, **Constraint**, **Open Question**, plus a fifth tray, **Park it (solution detail)**, for statements that are too early for an intent.

| Statement | Bucket |
|---|---|
| Customers call support to find out the status of their claim. | Problem |
| Support agents spend much of their call time reading out claim status. | Problem |
| Customers can see their current claim status without contacting support. | Outcome |
| Fewer status-check calls reach support. | Outcome |
| Must reuse the existing customer login. | Constraint |
| No additional personal data may be exposed. | Constraint |
| Should status refresh in real time or once a day? | Open Question |
| Should the adjuster's name be shown to customers? | Open Question |
| Build a React page with a progress bar. | Park it (solution detail) |

After a complete sort, a generated `intent.md` appears in a file panel, built from the learner's placements and including **Affected users and systems** (support team, customers, claims system, authentication service), supplied by the mission. The learner can copy it.

**Debrief.** Claude should start with "What are we trying to achieve?", not "Write some code." *Human decides:* what the outcome is and which open questions matter.

### 9.5 Mission 2 — Turn Intent Into a Specification (Design)

**Goal.** Show that `intent.md` is what and why, `spec.md` is how it behaves, and `plan.md` is how to build it (intent §7, success criterion 3).

1. `explain`: stepper showing `intent.md` → *Claude + policies* → `spec.md`.
2. `show` — **Intent / Specification** `compare`. Intent view: "Customers should see their claim status." Spec view: `GET /claims/{id}/status`, returns current status, next step, expected date; constraints: existing authentication, no additional PII. Linked highlighting between lines of each view.
3. `try` — **Trace it** (`spec.trace`, 15 XP). Four spec lines to match to the intent statement they came from.
4. `try` — **Which document?** (`spec.which`, 15 XP). Classifier with buckets **intent.md**, **spec.md**, **plan.md**:

   | Statement | Bucket |
   |---|---|
   | Customers should not need to call to learn their claim status. | intent.md |
   | The response includes `status`, `nextStep` and `expectedDate`. | spec.md |
   | Unauthenticated requests receive 401. | spec.md |
   | Change `claimService.js` and add a route in `routes/claims.js`. | plan.md |
   | Risk: the shared auth middleware is used by every route. | plan.md |
   | Success means fewer status-check calls. | intent.md |

5. `debrief`. *Human decides:* approves the spec before planning starts.

### 9.6 Mission 3 — Plan Before Coding (Build)

**Goal.** Teach Plan Mode and when *not* to use it (intent §8, Stage 3).

1. `show` — **Two paths** `stepper`. Path A: prompt, immediately code, unexpected architecture problem, rework. Path B: `spec.md`, Plan Mode, explore repository, identify files, risks and tests, `plan.md`, human approval, build. Both paths animate side by side.
2. `show` — **Watch Claude plan.** A terminal plus file tree of the simulated ClaimsPortal repository (§13.2). Scripted Claude turns read files (highlighted in the tree), then output a `plan.md`.
3. `try` — **Review the plan** (`plan.review`, 25 XP). The learner asks four challenge questions; each reveals the plan's answer:
   - Which files will change?
   - What could break?
   - Which test proves this works?
   - Is there a simpler implementation?

   The plan contains **two deliberate flaws** the learner must catch by flagging plan lines: (a) it modifies the shared authentication middleware used by every route, a bigger blast radius than needed; (b) it has no test for an unauthorised request. The simpler path (reuse `claimService.getClaim`) is also discoverable. The **Approve** button works at any time, but approving with an unflagged flaw plays a short consequence beat ("Path A: rework") and awards no XP until the learner returns and fixes the plan. Completion rule: both flaws flagged, then plan approved.
4. `try` — **Plan or just do it?** (`plan.when`, 15 XP). Classifier with buckets *Plan Mode first* and *Just do it*:

   | Task | Bucket |
   |---|---|
   | Fix a typo in an error message | Just do it |
   | Rename a local variable | Just do it |
   | Add a new endpoint that touches authentication | Plan Mode first |
   | Change a database schema with live data | Plan Mode first |

5. `debrief`. *Human decides:* approves the plan before any code is written.

### 9.7 Mission 4 — Teach Claude About the Repository (Build)

**Goal.** Show what `CLAUDE.md` is for and what belongs in it (intent §9).

1. `explain`: "the onboarding document Claude reads when working in this repository."
2. `show` — **Replay** `compare` (Without / With). The same task, *Add `GET /claims/:id/status`*, run twice in a terminal replay. Without `CLAUDE.md`, scripted Claude makes four predictable mistakes: uses `yarn test` (the repo uses npm), returns `snake_case` fields, logs the full claim object, and stops without running tests. With `CLAUDE.md`, none occur.
3. `try` — **What belongs in CLAUDE.md?** (`context.classify`, 20 XP). Buckets *CLAUDE.md* and *Not CLAUDE.md*:

   | Item | Expected | Note |
   |---|---|---|
   | Use `npm test` before finishing. | CLAUDE.md | A repo command |
   | API responses use camelCase. | CLAUDE.md | A convention |
   | Never log customer PII. | CLAUDE.md | Claude should know it. **But** knowing is not enforcing; see Hooks. |
   | This task should add a blue button. | Not CLAUDE.md | Task-specific; belongs in the prompt |
   | Deployments require release-manager approval. | CLAUDE.md | Claude should know it. **But** a rule that must hold needs a gate; see Approval Gates. |

4. `try` — **Write the CLAUDE.md** (`context.build`, 10 XP). A `builder` with six sections (Architecture, Commands, Conventions, Important rules, Known mistakes, Verification requirements). The learner chooses the correct lines for each from a palette that includes distractors; the live preview updates.
5. `debrief`. Sets up the next lesson: `CLAUDE.md` teaches Claude about *this repository*; a Skill teaches Claude a *repeatable kind of work*.

### 9.8 Mission 5 — Skills (Build)

**Goal.** Understand what a Skill is, how it loads, and how to write one that triggers correctly. Source: Anthropic's [The Complete Guide to Building Skills for Claude](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf), paraphrased (intent §14).

Beats (required unless marked *deeper*):

1. `explain`: `CLAUDE.md` teaches Claude about *this repository*; a Skill teaches Claude *how to do a repeatable class of work*. A Skill is a folder you build once.
2. `show` — **Skill anatomy** (`tree`). Folder `secure-api-review/` containing `SKILL.md` (required) with `scripts/`, `references/`, `assets/` (optional). Selecting each shows its purpose and a sample.
3. `show` — **Progressive disclosure** (`stepper`, with a context meter). Level 1: frontmatter always loaded. Level 2: the body loads when the Skill looks relevant. Level 3: linked files open only when needed. The meter shows why this keeps context small.
4. `show` — **A task arrives** (`stepper`): "Add external API endpoint" → Claude detects the relevant Skill → `secure-api-review` → the security procedure is applied.
5. `try` — **Write the description** (`skills.description`, 25 XP). See §9.8.1.
6. `try` — **Inspect the Skill** (`skills.inspect`, 20 XP). A broken Skill folder with five planted defects, each clickable to flag: `skill.md` (wrong case), folder `Secure_API_Review` (not kebab-case), frontmatter missing the closing `---`, a description with no "use when" clause, and a `README.md` inside the Skill folder. Completion rule: all five flagged and a simulated validator then shows green.
7. `try` — **Where does this live?** (`skills.classify`, 15 XP). Buckets *Prompt*, *CLAUDE.md*, *Skill*, *Hook*, with an explanation after every choice:

   | Item | Bucket |
   |---|---|
   | Rename this one variable to `claimId`. | Prompt |
   | Our API uses camelCase and tests run with `npm test`. | CLAUDE.md |
   | A step-by-step security review checklist for any new external endpoint. | Skill |
   | Safely write database migrations, with rollback steps, in any repository. | Skill |
   | Block any API edit that fails the PII scan. | Hook |
   | Production deployments need release-manager approval. | Hook |
   | The repo is a monorepo on Postgres 15. | CLAUDE.md |

8. `show` — **Skills vs MCP**: the kitchen analogy. MCP is the professional kitchen (what Claude *can* do); a Skill is the recipe (how Claude *should* do it). A three-category card (document and asset creation, workflow automation, MCP enhancement). Concept only; no MCP lab.
9. `deeper` — **Test and iterate** (`stepper`): triggering tests, functional tests, and performance comparison (with and without the Skill); iterate on one hard task first, then extract the Skill; under- versus over-triggering fixes.
10. `deeper` — **Pattern gallery**: sequential workflow, multi-service coordination, iterative refinement, context-aware tool selection, domain-specific intelligence, each with a "use when" line and a miniature diagram.
11. `deeper` — **Why isn't my Skill working?** A diagnostic game: five symptoms (won't upload, never triggers, triggers too often, instructions ignored, slow or degraded) to match to the likely cause and fix. Not required for completion.
12. `deeper` — **Skill to script to Hook**: for a rule that must hold, bundle a script rather than rely on prose, and for a rule that must *always* hold, move it to a Hook. Leads into Mission 6.
13. `debrief`: includes a **Download SKILL.md** button that exports the learner's description inside a complete, valid `SKILL.md` template, and the note on sharing (a Skill folder in the Claude Code skills directory, in the repository for a team, or deployed by an organisation admin; the open Agent Skills standard). Required nuance: Skills work across Claude.ai, Claude Code and the API, but this course uses them in Claude Code.

#### 9.8.1 Description lab (free text, deterministic)

The learner sees a Skill named `secure-api-review` with this starting description, which is deliberately vague:

> `Helps with APIs.`

They rewrite it in a textarea. A **Simulated trigger test** then runs.

**Validator rules** (all pure functions in `skills-validator`; the UI says "simulated heuristic"):

| Rule | Check | Failure message (summary) |
|---|---|---|
| Length | 60 ≤ length ≤ 1024 characters | Too short to tell Claude when to load it / over the limit |
| No tags | contains neither `<` nor `>` | Frontmatter appears in Claude's context; angle brackets are not allowed |
| What | mentions at least one of: `review`, `security`, `endpoint`, `api` | Say what the Skill does |
| When | contains `use when` or `when the user` (case-insensitive) | Add a "use when" clause |
| Trigger phrases | contains at least two quoted phrases or at least three comma-separated trigger terms after the "use when" clause | Include phrases a user would really say |
| Not too broad | contains none of: `anything`, `all tasks`, `any code`, `everything`, `helps with` | Too broad; it will fire on unrelated work |

**Simulated trigger test** on four prompts:

| Prompt | Expected | Logic |
|---|---|---|
| "Add an external API endpoint for claim status" | Triggers | Passes if the description contains `endpoint` or `api` and passes the *What* and *When* rules |
| "Review this new route for security problems" | Triggers | Passes if it contains `review` or `security` and passes *When* |
| "Change the button colour to blue" | Must not trigger | Fails if the description also fails *Not too broad* |
| "Explain how our CI pipeline works" | Must not trigger | Same |

Results are shown as ✓ / ✕ with text, each with the reason. XP is awarded when all rules and all four prompts pass. The lab also shows a **Fix guide**: *under-triggering* → add specific trigger phrases; *over-triggering* → add negative triggers and narrow scope. Optional hint: an example of a good description appears after two failed attempts.

### 9.9 Mission 6 — Hooks (Build)

**Goal.** Skills inform; Hooks enforce (intent §11).

1. `explain`: a hook is an automatic rule that runs when Claude tries to do something.
2. `show` — **Skill vs Hook** `compare`. *Skill:* "Never expose PII in logs." *Hook:* automatically run the PII checker whenever an API file changes. A one-line scripted run of the Skill-only case shows an **illustrative** miss (scripted, with a caption "illustrative, not a measured rate") and the Hook-enforced case catching it.
3. `try` — **Build the hook** (`hooks.build`, 20 XP). A `builder` with three decisions:
   - **When:** before or after Claude edits a file (event), matched to `src/api/**` (matcher)
   - **Do what:** run the PII checker (command)
   - **If it fails:** allow, ask the human, or **deny and tell Claude why**

   Only the combination *after-or-before an edit to API files, run the PII checker, deny with the reason* passes. Other combinations show their consequence (for example "ask the human" interrupts every edit; "allow" lets PII through).
4. `show` — **Run it** (`stepper`): Claude edits file → hook fires → PII detected → BLOCKED → Claude sees the reason → Claude fixes the code → hook passes.
5. `try` — **Skill or Hook?** (`hooks.choose`, 10 XP). Three rules to assign (a style preference, "never deploy to production without approval", "prefer small functions"). Only the must-always-hold rule is a Hook.
6. `deeper`: hooks run deterministic commands around tool-use events and can allow, ask or deny; the denial reason is returned to Claude; hooks can serve as approval gates and organisational policy. Exact event names and exit-code behaviour are shown only after verification against current documentation (§16.3).
7. `debrief`: "Instructions reduce mistakes. Guardrails enforce boundaries." *Human decides:* which rules are important enough to enforce.

### 9.10 Mission 7 — Subagents and Parallel Work (Build)

**Goal.** Distinguish the two and show that more agents are not automatically better (intent §12).

1. `show` — two diagrams. **Subagent:** one Claude Code session with a coordinator and scoped helpers (researcher, verifier, security reviewer). **Parallel sessions:** one engineer, several independent Claude sessions, each in its own worktree. A short caption on each: *scoped helpers inside one task* versus *independent development streams*.
2. `show` — **Cost of coordination**: an illustrative (not numeric) meter showing that each added agent adds coordination and context overhead.
3. `try` — **How many agents?** (`agents.choose`, 40 XP, 8 XP per task). `choice` with *One agent*, *Subagent*, *Parallel session*:

   | Task | Answer | Reasoning |
   |---|---|---|
   | Fix a typo in an error message. | One agent | One small task; more agents only add overhead |
   | Find everywhere claim status is computed across many files, then report back. | Subagent | Context-heavy reading; a researcher keeps the main session clean |
   | Build the status API and, independently, the status page UI. | Parallel session | Independent streams in separate worktrees |
   | Before opening the PR, independently check the diff for security issues. | Subagent | A scoped reviewer or verifier inside the task |
   | Fix three unrelated bugs in different modules, all needed today. | Parallel session | Independent, no shared files |

4. `debrief`: "One task, one agent" is the default. *Human decides:* whether parallel work is worth the review load.

### 9.11 Mission 8 — Give Claude a Feedback Loop (Test)

**Goal.** A Claude session should be able to observe whether its work succeeded (intent §13). This is the strongest visual interaction.

1. `show` — **Before and after** `stepper`. Before: Claude writes code → "Done!" → human finds the error. After: write, run test, FAIL, inspect, fix, run test, PASS, run build, PASS, human review. The loop is animated with the failing and passing runs shown as state-labelled nodes.
2. `show` — **Different work, different feedback** (matching list): Backend → tests; Build system → build command; UI → screenshot or browser comparison; API → request/response check; Performance → benchmark; Data → validation query.
3. `try` — **Build the loop** (`feedback.arrange`, 15 XP). A `builder` with shuffled steps. Rules: *Run test* must come after code is written; *Fix* must follow *Inspect failure*; a **second test run must follow the fix**; *Human review* comes last; "Done!" without any check is rejected with an explanation.
4. `try` — **Run it** (`feedback.run`, 15 XP). The terminal shows a broken `getClaimStatus` that returns `expected_date` where the test expects `expectedDate`. The learner presses **RUN TEST** (FAIL with output), then **Let Claude inspect** (scripted reasoning), **Apply fix** (a visible diff), **RUN TEST** (PASS), **RUN BUILD** (PASS). XP is awarded **only when both verifications pass**.
5. `show` — **Feedback loop vs verifier subagent** `compare`. *Loop:* the same session checks its own work against a real signal. *Verifier subagent:* a separate scoped helper checks independently. One does not replace the other.
6. `debrief`. *Human decides:* what counts as "working" and reviews the result.

### 9.12 Mission 9 — Evals (Test)

**Goal.** Tests check the software; evals check Claude's configuration (intent §14, Evals).

1. `show` — **Test vs Eval** `compare`. *Test:* does `GET /status` return HTTP 200? *Eval:* does Claude still pass tests, keep lint clean, keep existing tests, avoid exposing PII and follow project policy?
2. `try` — **Test or eval?** (`evals.classify`, 10 XP). Four statements, two buckets.
3. `show` — **What can change?** Five toggles: `CLAUDE.md`, a Skill, a Hook, the model, the prompt. Each is a change that could shift behaviour.
4. `try` — **Gate the change** (`evals.gate`, 20 XP). Three proposed configuration changes (shorten `CLAUDE.md`, rewrite a Skill description, switch a model). For each the learner must **run the eval suite** before deciding Merge or Reject. Results come from a fixed table (illustrative scenario data): the shortened `CLAUDE.md` removes the PII rule and causes a **REGRESSION** on the PII check in two of six tasks; the other two changes pass. Completion rule: the learner runs the eval for each change and rejects the regression while accepting the passing changes.
5. `debrief`: agent configuration deserves regression testing like code. *Human decides:* which behaviours the eval suite must protect.

### 9.13 Mission 10 — AI PR Review (Deploy)

**Goal.** Separate mechanical review from human judgment (intent §15).

1. `show` — **Flow** `stepper`: Claude implementation → pull request → independent AI review (bugs, security, plan compliance, policy compliance) → Claude fixes findings → human reviews intent and risk.
2. `try` — **Triage the findings** (`review.triage`, 20 XP). A small diff with three reviewer findings, classified as *Important*, *Nit* or *Not an issue*:

   | Finding | Answer | Why |
   |---|---|---|
   | `console.log(claim)` writes the whole claim, including PII, to logs. | Important | Violates the PII policy |
   | Variable named `d`; a missing trailing newline. | Nit | Style only |
   | "Missing authentication check on the new route." | Not an issue | The route sits under the router-level `requireAuth`, visible in the diff context; the review is a false positive |

3. `try` — **Machine or human?** (`review.who`, 10 XP). Classifier, *Mechanical review* versus *Human judgment*: for example "does the diff follow the plan?" (mechanical), "is this the right product trade-off for customers?" (human), "is a known risky change acceptable this week?" (human).
4. `debrief`: AI review does not replace human approval; it reduces what the human has to find so they can spend attention on intent and risk.

### 9.14 Mission 11 — Approval Gates (Deploy)

**Goal.** Autonomy scaled to risk, with governance explicit (intent §16).

1. `show`: three environments side by side. Development: Claude → deploy ✅ allowed. Staging: ⚠ approval may be required. Production: 🔒 release approval required. Each carries text as well as the icon.
2. `try` — **Set the policy** (`gates.policy`, builder; 10 XP). A grid of actions (*deploy*, *run a database migration*, *read logs*) by environment (*dev*, *staging*, *production*); each cell is *Allow*, *Ask* or *Deny*. Validity: reads may be allowed everywhere; production deploys and production data changes must be *Ask* or *Deny*; development may be *Allow*. Violations explain the risk.
3. `try` — **Spot the unsafe deployment** (`gates.detect`, 20 XP). Three pipeline configurations are shown as short diagrams. Exactly one is unsafe: Claude holds broad production credentials and deploys with no approval stage. The learner flags it and names the missing control (a gate, scoped access).
4. `debrief`: "Automate everything that can safely be automated and make important human gates explicit." Highlights production access: scoped, gated and logged. *Human decides:* acceptable risk and release approval.

### 9.15 Mission 12 — CI/CD (Deploy)

**Goal.** See Claude inside the pipeline and run it (intent §17). Also the second mention of Claude Code vs API.

1. `show`: the pipeline as a `pipeline` component: Push, Build, Tests, Evals, AI PR Review, Human approval, Deploy, Health check, Success.
2. `show` — a panel: "In a pipeline, Claude usually runs **unattended**, so this is where programmatic or non-interactive use (CLI, SDK or API) can appear. Everything you built in Claude Code still applies." Reinforces §9.3.
3. `try` — **Run the happy path** (`pipeline.happy`, 10 XP). The learner starts the run and acts at the **Human approval** stage: reviewing a short summary, then approving. Stages animate waiting → running → passed.
4. `try` — **Run the incident path** (`pipeline.incident`, 20 XP). Same pipeline; after Deploy the health check fails (5xx errors rise). The learner chooses among *Wait and watch*, *Roll back automatically*, *Push a quick fix forward*. Only *Roll back automatically* completes the stage; the others show their consequence. The failed stage shows FAILED, the next stages BLOCKED, and the rollback shows PASSED.
5. `debrief`: each stage has a state shown by icon, label and colour. *Human decides:* what blocks a release and who approves.

### 9.16 Mission 13 — Close the Loop (Maintain)

**Goal.** Production signals create the next piece of work (intent §18).

1. `show` — **Sensors** `stepper`: Production → metrics → anomaly detected → Claude diagnoses → new `intent.md` → design → plan → build → test → review → deploy → production (loop arrow).
2. `try` — **From signal to intent** (`loop.intent`, 30 XP). A simulated 5xx spike on `/claims/{id}/status` with a short log excerpt. Claude's scripted diagnosis lists four candidate statements. The learner picks the ones that belong in the new `intent.md` (the observed problem, the outcome "status endpoint error rate returns to baseline", the constraint "no new PII in logs while debugging", and an open question "should the endpoint degrade gracefully?") and rejects solution detail and speculation. The generated `intent.md` appears.
3. `debrief`: the line from the start becomes a loop. *Human decides:* whether the incident warrants new work and at what priority; approval remains at the risk boundaries.

### 9.17 Mission 14 — Final Challenge (Maintain)

**Goal.** Apply everything to a practical scenario instead of a quiz (intent §30).

**Scenario packet** (presented as tabs): the ClaimsPortal repository; a product request (customers see claim status); a security policy (no PII in logs; production deploys require release-manager approval); a failing test; a deployment pipeline; a production metric (status endpoint error rate).

**Palette** (12 tiles): `intent.md`, `spec.md`, `plan.md`, `CLAUDE.md`, Skill, Subagent, Feedback Loop, Eval, PR Review, Hook, CI/CD, Production Monitoring.

**Task.** Arrange the tiles in a workflow lane. Where a tile can be applied to a policy or rule, the learner chooses what it covers (for example, which tile enforces "no PII in logs").

**Rules engine** (pure function `evaluateWorkflow(selection) → findings[]`). Each rule produces a consequence if violated:

| Rule | Violation | Consequence shown |
|---|---|---|
| R1 | Production-approval or PII policy covered only by a **Skill** (no Hook) | Skill recommends the rule → Claude misses it → unsafe action possible. Lesson: *use a deterministic Hook for a rule that must always hold.* |
| R2 | No Feedback Loop | Claude says "Done!" with the failing test still failing; a human finds it later |
| R3 | `CLAUDE.md` or a Skill used but no Eval | A later configuration edit silently regresses behaviour |
| R4 | No Hook or approval gate before production | An unapproved production deploy goes through |
| R5 | No Production Monitoring | Customers report the incident before the team sees it |
| R6 | No `spec.md` or `plan.md` before building | Unexpected architecture problem, then rework |
| R7 | No `CLAUDE.md` | Repeats conventions mistakes (wrong test command, snake_case) |
| R8 | No PR Review before CI/CD | Mechanical defects reach the pipeline |
| O1 | Ordering: `intent.md` → `spec.md` → `plan.md`; context before build; feedback before review; review and gates before CI/CD; monitoring last | Ordering feedback with explanation |
| N1 | Subagent used for no stated reason | Neutral note: allowed, but adds overhead for a task this small |

R1, R2, R4 and R6 are **critical**.

**Scoring.** `final.workflow` awards up to 50 XP: start from 50, subtract 10 per critical violation and 5 per other violation, floor 10. All rules satisfied is "full loop". The learner may revise and re-run; the attempt decay of §11.3 applies on top.

**Completion.** After a violation-free run, a final animated simulation runs the whole system: idea → … → production → metrics → a **new `intent.md`** generated from the scenario. The Your System diagram completes with its loop arrow. The learner is taken to the Journey summary (§9.18).

### 9.18 Journey summary (`#/summary`)

Shows: level reached, XP, the system diagram complete with the **Show where humans decide** layer on, the final generated `intent.md` (copy and download as a `.md` file), the learner's exported `SKILL.md` button, and a checklist of the 23 success criteria with the mission that covers each. Includes the first-step advice from intent §17: "what I should introduce first, why, and what comes next."

---

## 10. Dependency map (`#/map`)

### 10.1 Nodes

Each node has: `id`, label, linked mission, and the seven panel fields from intent §20 (WHAT IT IS, WHY IT EXISTS, WHEN TO USE IT, WHAT IT DEPENDS ON, WHAT IT ENABLES, EXAMPLE, TRY IT). TRY IT links to the mission's activity.

Nodes: `intent`, `spec`, `plan-mode`, `claude-md`, `skills`, `hooks`, `subagents`, `feedback-loop`, `evals`, `pr-review`, `approval-gates`, `ci-cd`, `monitoring`.

### 10.2 Edges

Edges point from prerequisite to dependent. **Solid** means strong dependency; **dotted** means "helps but is not required".

| From | To | Type |
|---|---|---|
| intent | spec | solid |
| spec | plan-mode | dotted |
| claude-md | skills | dotted |
| claude-md | feedback-loop | dotted |
| skills | hooks | dotted |
| subagents | feedback-loop | dotted |
| feedback-loop | evals | solid |
| feedback-loop | hooks | dotted |
| feedback-loop | pr-review | dotted |
| hooks | approval-gates | solid |
| feedback-loop | ci-cd | solid |
| pr-review | ci-cd | solid |
| approval-gates | ci-cd | solid |
| evals | ci-cd | dotted |
| ci-cd | monitoring | solid |
| monitoring | intent | dotted (closes the loop) |

> **Verification required.** This edge set is derived from the intent and the course's teaching order. Before release it must be checked against the official playbook's dependency diagram and corrected. The data lives in one file (`map-graph.js`) so corrections are one-line changes.

### 10.3 Behaviour

- Rendered as SVG with a fixed, hand-tuned layout (no force-directed physics, so it is stable and fast).
- **Hover or focus** a node: highlights its incoming and outgoing edges. **Click, Enter or Space**: opens the panel.
- Edge style is distinguishable without colour: solid line versus dashed line, with a legend and a text list of dependencies in the panel.
- **Locked nodes** are visible but dimmed with a 🔒 and the text "Unlocks after: <mission>". **Explore freely** unlocks all.
- A node unlocks when its mission is complete, or in Explore. A node's panel is always readable once the node's *prerequisite* node is unlocked, so the learner can preview what is coming.
- Keyboard: nodes are in a logical Tab order; arrow keys move between connected nodes.
- Under 768 px the graph is replaced with an expandable list of nodes showing the same fields and dependencies.

---

## 11. Gamification

### 11.1 Principles

XP rewards **verified understanding**. There are no rewards for clicking, reading, re-reading or replaying.

### 11.2 Levels

| Level | Title | Reached after completing | Cumulative XP |
|---|---|---|---|
| 1 | Intent Explorer | Missions 0, 1 | 40 |
| 2 | Spec Designer | 2 | 70 |
| 3 | Claude Planner | 3 | 110 |
| 4 | Context Builder | 4 | 140 |
| 5 | Skill Builder | 5, 6 | 230 |
| 6 | Agent Orchestrator | 7 | 270 |
| 7 | Feedback Engineer | 8 | 300 |
| 8 | Eval Engineer | 9 | 330 |
| 9 | AI Reviewer | 10 | 360 |
| 10 | Release Engineer | 11, 12 | 420 |
| 11 | Loop Architect | 13, 14 | 500 |

The XP bar shows progress toward the next level. Reaching a level shows a short inline banner (not a modal) naming it and what it unlocked.

### 11.3 XP rules

1. XP is awarded **per activity**, once. Replaying an activity never awards XP again.
2. An activity's XP is `max(25% of maxXp, maxXp × (1 − 0.25 × wrongAttempts))`, rounded to the nearest whole number, where `wrongAttempts` counts incorrect submissions or placements. Using a **Hint** does not reduce XP.
3. XP is awarded **only when the activity's verification passes** (for example, both test and build pass in the feedback lab).
4. Skipped activities (Explore mode) award nothing.
5. The named rewards in intent §19 map to activities: classify `CLAUDE.md` versus Skill (+20, `context.classify`), build a valid feedback loop (+30, `feedback.*`), detect an unsafe deployment (+30, `gates.*`), design the correct agent architecture (+40, `agents.choose`), complete the full SDLC loop (+50, `final.workflow`).
6. An award is announced in the live region ("+20 XP, correct CLAUDE.md classification") and shown as an inline coach message.

### 11.4 Mission status

`locked` → `available` (previous mission complete, or Explore) → `in progress` (any beat reached) → `complete` (final beat reached **and** all required activities done). Deeper-only activities never block completion.

---

## 12. Progressive system diagram ("Your System")

An SVG built from `system-nodes.js`. Each node has a position on a fixed grid, a label, the mission that unlocks it, and a `human` flag.

| Node | Appears after | Human decision it represents |
|---|---|---|
| You → Claude → Code | start | – |
| `intent.md` | Mission 1 | Defines the outcome |
| `spec.md` | Mission 2 | Approves the specification |
| `plan.md` | Mission 3 | Approves the plan |
| `CLAUDE.md` | Mission 4 | – |
| Skills | Mission 5 | – |
| Hooks | Mission 6 | Chooses which rules are enforced |
| Subagents | Mission 7 | – |
| Tests (feedback loop) | Mission 8 | Defines what "working" means |
| Evals | Mission 9 | Chooses behaviours to protect |
| PR Review | Mission 10 | Reviews intent and risk |
| Approval gates | Mission 11 | Approves production release |
| CI/CD | Mission 12 | – |
| Production + Metrics + loop arrow | Mission 13 | Triages incidents |
| Complete loop | Mission 14 | – |

Behaviour:

- A new node animates in with its edges, and a caption says what it adds. Under reduced motion it appears without animation.
- A **Show where humans decide** toggle highlights nodes with `human: true` using a person icon and text label (not colour alone).
- Each node is focusable and shows a tooltip with its definition (Simple or Deeper).
- An accessible **text alternative**: an ordered list of the nodes and connections currently unlocked.
- In Explore, the diagram shows nodes for all missions the learner has completed, and a "preview" ghost for the rest.

---

## 13. Shared fictional project: ClaimsPortal

### 13.1 Principles

One small, believable project, simple enough that the app is never harder to understand than Claude Code. Data is invented and clearly labelled "fictional".

### 13.2 Simulated repository

```
claims-portal/
├── CLAUDE.md                 (absent in Mission 4's "Without" replay)
├── package.json
├── src/
│   ├── api/
│   │   ├── routes/claims.js
│   │   └── middleware/auth.js        shared by every route
│   ├── services/claimService.js     getClaim(id)
│   └── lib/logger.js
├── tests/
│   ├── claimService.test.js
│   └── claims.status.test.js         the failing test in Missions 8 and 14
└── .claude/
    └── skills/secure-api-review/SKILL.md
```

### 13.3 Recurring artifacts

- **Request:** customers cannot see their claim status and keep calling support.
- **Endpoint:** `GET /claims/{id}/status` returning `status`, `nextStep`, `expectedDate`.
- **Policy:** no PII in logs; production deploys require release-manager approval.
- **Commands:** `npm test`, `npm run build`.
- **Conventions:** camelCase API responses.
- **Metric:** error rate of the status endpoint.

---

## 14. Visual design

### 14.1 Direction

A modern developer environment, not an LMS: dark-by-default IDE feel with a light theme, restrained colour, strong type hierarchy, generous spacing, slightly playful micro-interactions. No childish game visuals, no gradient-heavy surfaces, no dashboard clichés.

### 14.2 Tokens (`tokens.css`)

Tokens are CSS custom properties. Themes switch via `data-theme` on `<html>`, defaulting to `prefers-color-scheme`.

| Group | Tokens |
|---|---|
| Surfaces | `--bg`, `--surface-1`, `--surface-2`, `--border`, `--code-bg` |
| Text | `--text`, `--text-muted`, `--text-on-accent` |
| Accent | `--accent`, `--accent-soft` |
| State | `--ok`, `--fail`, `--run`, `--blocked`, `--wait` |
| Stage hues | `--stage-plan`, `--stage-design`, `--stage-build`, `--stage-test`, `--stage-deploy`, `--stage-maintain` |
| Type | `--font-ui` (system UI stack), `--font-mono` (system monospace stack), a modular scale from `--text-xs` to `--text-3xl` |
| Space and shape | `--space-1…8`, `--radius-s/m/l`, `--shadow-1/2` |
| Motion | `--dur-fast: 150ms`, `--dur-med: 250ms`, `--dur-slow: 400ms`, `--ease` |

System font stacks only, so nothing is downloaded and the first paint is fast.

### 14.3 State vocabulary

Every state has **colour, icon and text** and appears identically across the pipeline, the rail and the map.

| State | Icon | Text |
|---|---|---|
| Waiting | ○ | WAITING |
| Running | ◔ | RUNNING |
| Passed | ✓ | PASSED |
| Failed | ✕ | FAILED |
| Blocked | ⛔ | BLOCKED |
| Locked | 🔒 | LOCKED |

### 14.4 Motion

- Motion exists only to clarify relationships (a node appearing on a path, a state changing, a fix being applied).
- Durations come from the motion tokens; no animation exceeds 400 ms for a single transition. Sequences are stepper-controlled and pausable.
- `prefers-reduced-motion: reduce`, or the in-app setting, disables transitions and auto-play. Steppers start paused and advance with **Step**.

### 14.5 Content style

Plain English first. Short sentences, active voice, no walls of text (at most about 60 words per beat before an interaction). Code and file contents are real text in monospace. Original wording throughout; the source material is paraphrased (intent §14).

---

## 15. Accessibility

Target **WCAG 2.2 AA**.

| Area | Requirement |
|---|---|
| Structure | Semantic landmarks (`header`, `nav`, `main`, `aside`); one `<h1>` per view; logical heading order |
| Keyboard | Every control is reachable and operable by keyboard; no drag-only interactions; Esc closes menus and drawers; skip link to main content |
| Focus | Visible focus ring on every interactive element (≥3:1 against adjacent colours); focus is moved to the `<h1>` on route change and to the first new control when a beat changes |
| Contrast | Text ≥4.5:1, large text and UI components ≥3:1, in both themes |
| Colour | State and correctness are never conveyed by colour alone (§14.3) |
| Motion | Respects `prefers-reduced-motion`; a settings toggle overrides it; no content flashes more than three times per second |
| Announcements | One polite live region for coach feedback and XP; the terminal output is a `role="log"` |
| Targets | Minimum 44×44 px touch targets on touch devices |
| Text | Base font size ≥16 px; layout works at 200% zoom and 320 px width with no loss of function |
| Diagrams | Every diagram has a text alternative or an equivalent ordered list |
| Forms | The Skill description textarea has a visible label, an associated validation list (`aria-describedby`), and validation messages as text |

---

## 16. Content and source integrity

### 16.1 Sources

- Primary: Anthropic Claude Academy, *The AI-native SDLC playbook*.
- Skills: Anthropic, [The Complete Guide to Building Skills for Claude](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf).

### 16.2 Rules

Paraphrase everything; do not copy sections of source wording; create original examples. Every mission ends with "Read more" links from `links.js`. Link text names the destination; no bare URLs.

### 16.3 Technical-claim verification checklist

Before release, each of these must be checked against current official documentation and recorded in the content file as `verified: <date>`:

- Hook events, matchers, and allow, ask and deny behaviour (Mission 6, *deeper*).
- Plan Mode behaviour and how it is entered.
- Subagent and parallel-worktree descriptions.
- `CLAUDE.md` scope and loading.
- Skill frontmatter rules (name, description limits, forbidden content), Skill locations and distribution (Mission 5).
- The dependency graph edges (§10.2).
- Non-interactive use of Claude in CI (Mission 12).
- All `links.js` URLs (those not already confirmed are placeholders until checked).

---

## 17. Testing and acceptance

### 17.1 Automated, dependency-free (`tests.html`)

Opens in a browser and runs pure-logic tests with a minimal in-file assertion helper:

- XP maths and decay (§11.3), level derivation (§11.2), total XP equals 500 across all activities.
- Unlock rules for missions and map nodes, including Explore.
- The Skill description validator against a table of passing and failing descriptions.
- `evaluateWorkflow` against fixtures: the correct workflow yields no findings; each rule R1–R8 violated alone yields exactly its consequence.
- Store round-trip, migration and the in-memory fallback.
- Every mission's data validates: each activity has an id, `maxXp`, and every item has an explanation; sums per mission match §9.1.

### 17.2 Manual acceptance

1. Full run-through on desktop (Chrome, Edge, Firefox, Safari) and iOS Safari and Android Chrome, from `file://`.
2. Keyboard-only run-through of every activity.
3. Screen-reader spot-check of a classifier, the terminal and the pipeline.
4. Reduced-motion run-through.
5. Reset and resume: close the tab mid-mission, reopen, and land where the learner left off.
6. 320 px width and 200% zoom: no horizontal page scroll, no lost function.
7. Private window: the app works and shows the "not saved" notice.

### 17.3 Traceability to the success criteria (intent §17)

| # | Criterion | Covered in |
|---|---|---|
| 1 | What an AI-native SDLC is | 0, 14 |
| 2 | Why `intent.md` exists | 1 |
| 3 | `intent.md` vs `spec.md` vs `plan.md` | 2 |
| 4 | What Plan Mode is for | 3 |
| 5 | What belongs in `CLAUDE.md` | 4 |
| 6 | `CLAUDE.md` vs Skills vs prompts vs Hooks | 5, 6 |
| 7 | Subagents vs parallel sessions | 7 |
| 8 | More agents are not automatically better | 7 |
| 9 | What a feedback loop is | 8 |
| 10 | Feedback loop vs verifier subagent | 8 |
| 11 | Tests vs evals | 9 |
| 12 | How Claude participates in PR review | 10 |
| 13 | AI review does not replace human approval | 10 |
| 14 | Hooks as guardrails and gates | 6, 11 |
| 15 | Claude inside CI/CD | 12 |
| 16 | Production access scoped and gated | 11, 12 |
| 17 | Metrics and incidents restart the lifecycle | 13 |
| 18 | Where Claude Code ends and API automation begins | 0, 12 |
| 19 | How everything fits together | 14, summary |
| 20 | Skill structure and progressive disclosure | 5 |
| 21 | The description decides triggering | 5 |
| 22 | Skills vs MCP | 5 |
| 23 | Testing Skills; Skill to script to Hook | 5, 6 |

### 17.4 Definition of done (v1)

- All 15 missions complete end to end with working activities and feedback.
- Total available XP is exactly 500 and all 11 levels are reachable.
- The dependency map, Your System diagram, Explain simply / Go deeper, Explore freely, persistence and reset all work.
- §17.1 passes and §17.2 is signed off.
- §16.3 is fully checked, with no unverified technical claim shipped.
- Total code size within the budget in §4.6.

---

## 18. Risks and assumptions

| Risk or assumption | Mitigation |
|---|---|
| The dependency-graph edges are derived, not copied from the playbook | Verify against the official diagram (§10.2, §16.3) |
| Technical details of Claude Code features change | Content verification dates; links to current docs; "illustrative" labels on scripted behaviour |
| The Skill description validator is a heuristic and may reject a good description | Label it "simulated"; show reasons; keep rules permissive; add fixtures for good descriptions |
| Scripted "Claude" could be mistaken for real behaviour | A persistent "Simulated" badge on every scripted run, and captions where behaviour is illustrative |
| 15 missions may feel long | Beats are short; Deeper content is optional; Explore freely and the map allow jumping; progress is saved |
| `file://` restrictions | No modules, no `fetch`, no web fonts; all content is in classic scripts |
| The Claude Academy URLs are not yet confirmed | Keep them in `links.js` flagged as placeholders until verified |

---

## 19. Suggested delivery order (input for `plan.md`)

1. Shell, tokens, router, store, a11y helpers, and `tests.html` skeleton.
2. Core components: `classifier`, `coach`, `compare`, `stepper`; Missions 0–2 (proves the beat model and XP).
3. Your System diagram and the map; unlock logic.
4. `terminal`, `tree`, `builder`; Missions 3–5 (including the Skill validator).
5. Missions 6–9.
6. `pipeline`; Missions 10–13.
7. Final challenge rules engine, Mission 14 and the Journey summary.
8. Accessibility, responsive and reduced-motion pass; content verification (§16.3); acceptance (§17).
