# Spec: Claude Engineering Lab

## Document control

| Field | Value |
|---|---|
| **Version** | 2.0 (draft for engineering hand-over) |
| **Status** | Draft. Not approved. See §20 for the approvals required before build starts. |
| **Derived from** | [intent.md](intent.md) |
| **Product** | Interactive, gamified, browser-based tutorial on building software with Claude Code |
| **Scope** | Version 1 of the product |
| **Document owner** | To be named (proposed: the person who owns `intent.md`) |
| **Required approvers** | Head of IT & Digitalization (change approval, tool approval, security). CPIO as AI Compliance Owner (AI rules, AI literacy positioning). Brand owner (palette, font, logo asset). Privacy owner or DPO (local storage). Sign-off is recorded in §20.4. |
| **Next review** | At the end of each delivery step in §21, and whenever a cited policy is reissued |
| **Audience** | The engineering team that will build it, the approvers above, and reviewers |

**Change log**

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-10-06 | First specification from `intent.md`. |
| 2.0 | 2026-10-06 | Applied Nordic Solar brand guidelines, the Information and IT Security Policy, the Company Rules on Secure Software Development and the Company Rules on Artificial Intelligence. Rewrote §14 (visual design) to the brand palette. Added requirement IDs, §19 (compliance and concerns), §20 (delivery governance) and §22 (open decisions). Removed all emoji and colour-only state indicators. Incorporated an independent content review: aligned concern severities with decision deadlines, defined tints and allowed text colours, made the automated checks testable (§17.1), and added the sign-off table (§20.4), the staging-host decision (D-11) and the policy-review decision (D-12). |

**How to read this document**

`intent.md` says **what and why**. This document says **how the product behaves** and **what rules it must satisfy**. It makes the decisions the intent left open (§2), defines the architecture, data model, interaction components and every mission, then records how the product meets company policy and where it cannot (§19). Implementation order and file-level planning belong in `plan.md`.

Requirements that engineering must verify carry an ID: `FR-` functional, `NFR-` non-functional, `SEC-` security, `BRD-` brand, `UX-` usability and accessibility, `GOV-` governance. IDs are stable; do not renumber them. Section references like "intent §6" point to the numbered sections of `intent.md`.

**Glossary**

| Term | Meaning here |
|---|---|
| Mission | One learning unit; there are 15 |
| Beat | One screen within a mission (explain, show, try, debrief, deeper) |
| Activity | A graded interaction inside a `try` beat; the only thing that awards XP |
| Simulated Claude | Scripted text that stands in for Claude's behaviour; no model is called |
| ClaimsPortal | The fictional project used in every example |
| Approved tool | An AI coding tool approved by the Head of IT & Digitalization under the Company Rules on Secure Software Development |

---

## 1. Summary

**Claude Engineering Lab** is a static web app (HTML, CSS and plain JavaScript, no build step, no backend) that looks and feels like a small development workspace. The learner works through **15 missions** across the six SDLC stages. Each mission is a short sequence of *beats* (explain, show, try, debrief). The learner earns XP only for verified understanding, reaches 11 levels, and watches a diagram of their own AI-native engineering system grow until the loop closes at the end.

All examples use one fictional project, the **ClaimsPortal** (a customer self-service claims portal). All data, repositories, logs and "Claude" behaviour are scripted simulations. Nothing calls a model or a network service.

The product is Nordic Solar learning material. It follows the Nordic Solar brand guidelines (§14) and the company's security and AI rules (§4.7, §16.3). Where those rules conflict with each other or with the intent, §19 says so and names who decides.

---

## 2. Decisions on the intent's open questions

| # | Question (intent §22) | Decision | Rationale |
|---|---|---|---|
| 1 | One page or series of missions? | **Application-like single-page app** with one mission on screen at a time. A landing view, mission views, a map view and a summary view, switched by hash routing. | Keeps each interaction focused. Hash routing works on `file://`. |
| 2 | Persist progress in `localStorage`? | **Yes.** One versioned key, wrapped in try/catch with an in-memory fallback. A visible "progress is saved in this browser" note and a Reset button. | Intent §20. Must degrade gracefully in private windows. See SEC-06 and concern C-09. |
| 3 | How much simulated terminal? | A **scripted terminal** used in four missions (Plan, Context, Feedback, Pipeline). Input is constrained: suggested-command buttons plus typed input that is accepted only if it matches an allowed command (with autocomplete). No free shell. | Gives the "real tool" feel without dead ends. |
| 4 | Editable fake files? | **Constrained editing.** `intent.md` and `CLAUDE.md` are built by selecting and placing lines. The Skill `description` is the only free-text field, checked by a deterministic validator (§9.8.1). | Free text is unfair to grade. One free-text exercise is where it teaches the most. |
| 5 | Beginner and Advanced modes? | **No separate modes.** One global **Explain simply / Go deeper** switch (intent §12). Deeper content adds beats and detail; it never gates progress or XP. | Avoids two courses to maintain. |
| 6 | Skip to any play? | **Yes**, through **Explore freely** (no locks) and by clicking any unlocked mission or map node. | "Start anywhere" principle (intent §8). |
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

Everything in `intent.md` §1 to §18 and §20 to §23 (intent §19 lists the non-goals), including the Skills content in intent §6 (Stage 3).

### 3.2 Non-goals

Those in intent §19, and additionally: no analytics or tracking, no cookies, no network requests at runtime (except user-clicked outbound links), no third-party scripts, no web fonts, no user-generated content leaving the browser, no server-side rendering.

---

## 4. Architecture

### 4.1 Principles

1. **No build step.** The repository root *is* the deployable site. Open `index.html` by double-click, or serve the folder from a static host that meets SEC-08.
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
    skills-validator.js    Skill description validator (pure, §9.8.1)
    workflow.js            evaluateWorkflow rules engine (pure, §9.17)
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
tests.html                 dependency-free browser test page (§17.1)
tests/                     test scripts loaded by tests.html
tools/static-checks.py     CI-only checks (§17.1); never shipped
README.md                  how to run, structure, how to add a mission, file:// posture (SEC-09)
SECURITY.md                how to report a security issue (SEC-17)
.github/
  workflows/ci.yml          per-pull-request gates, actions pinned by SHA (SEC-12)
  pull_request_template.md  AI-assistance disclosure and named human reviewer (SEC-19)
docs/sbom.md               software bill of materials, updated each release (SEC-14)
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

These requirements implement the Company Rules on Secure Software Development and the Information and IT Security Policy as they apply to a static site with no backend, no accounts and no dependencies. Where a rule needs a decision the team cannot take, §19 records it.

**Application security**

| ID | Requirement |
|---|---|
| SEC-01 | Learner-typed text (the Skill description) is only ever written to the page with `textContent`, never `innerHTML`, and never evaluated. |
| SEC-02 | `index.html` sets a `Content-Security-Policy` meta tag: `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; base-uri 'none'; form-action 'none'`. SVG is styled with presentation attributes (`fill`, `stroke`) or classes, never `style` attributes or `<style>` elements, so `'unsafe-inline'` is not needed. Behaviour from `file://` is verified per browser (§17.2 item 11). |
| SEC-03 | Outbound links use `target="_blank" rel="noopener noreferrer"` and point only at URLs listed in `links.js`. |
| SEC-04 | The app makes **no network requests** at runtime. The test page asserts that no `fetch`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon` or external `<script>`/`<link>` appears in shipped code. |
| SEC-05 | No secrets, tokens, credentials or internal hostnames appear in the repository. The CI secret scan (SEC-12) enforces this. The fictional ClaimsPortal uses obviously fictional values only. |
| SEC-06 | Stored state (§6) contains no identifier, name, e-mail or free text other than the learner's Skill description, which is stored only on their own device. |
| SEC-07 | The page does not use `eval`, `new Function`, `document.write` or `javascript:` URLs. |

**Hosting and transport**

| ID | Requirement |
|---|---|
| SEC-08 | Any deployment other than opening the file locally is served over HTTPS from a host that can set response headers: `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `Content-Security-Policy` (same policy as SEC-02, plus `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy` denying camera, microphone and geolocation. A host that cannot set headers (for example GitHub Pages) is not acceptable for a company-facing deployment. See concern C-08. |
| SEC-09 | Running from `file://` is a convenience mode for local review. Its weaker posture (no response headers, meta-tag CSP only) is documented in the README. |

**Development environment, repository and pipeline**

| ID | Requirement |
|---|---|
| SEC-10 | The repository, its CI and any hosting account are protected by multi-factor authentication for every user, including contractors. The repository lives in a company-controlled organisation, or the Head of IT & Digitalization records in writing that the current location is acceptable. See concern C-07. |
| SEC-11 | Branch protection on `main`: pull request required, at least one reviewer who is not the author, CI must pass, no force-push. |
| SEC-12 | CI runs on every pull request: static analysis of the JavaScript (SAST), a secret scan, a dependency scan (SCA). With no package manifest, SCA is a check that no manifest exists; adding one requires an SCA tool and an SBOM update, and the test page (§17.1) in a headless browser. CI actions are pinned to a commit SHA, not a floating tag. |
| SEC-13 | Before every production deployment, a dynamic scan (DAST) runs against the staging URL, and the response headers in SEC-08 are checked automatically. |
| SEC-14 | A Software Bill of Materials is produced at each release. For v1 it lists the browser as the only runtime dependency and the pinned CI actions as build dependencies. |
| SEC-15 | Development does not take place in the production environment. Staging and production are separate URLs. |
| SEC-16 | An independent security test (someone outside the build team, which may be the IT department) is performed before the first production release and after any major change. A major change is one that adds or changes a component handling learner input, a storage key, the CSP or response headers, or a domain in `links.js`. The test's depth is set in the risk assessment (GOV-01). |
| SEC-17 | Security incidents or suspected weaknesses found in the product are reported the same working day to the Head of IT & Digitalization, who consults the CPIO. A `SECURITY.md` in the repository states this path. |

**AI-assisted development of this product**

| ID | Requirement |
|---|---|
| SEC-18 | Only AI coding tools approved by the Head of IT & Digitalization are used to build this product, and no proprietary source code from other company systems, internal system logic, confidential company information, personal data or credentials are given to them. The repository holds only fictional content and this specification; whether the specification itself may be processed by the tool is part of the approval. See concern C-04. |
| SEC-19 | AI-generated code and content is reviewed before merge, with the same care as third-party code, by a named person who did not prompt the AI tool for that change. The reviewer is recorded in the pull request. |

---

## 5. Application shell and layout

### 5.1 Regions

```
┌──────────────────────────────────────────────────────────────────┐
│ Claude Engineering Lab │ Level + XP │ Simple|Deeper │ Menu       │
├──────────────┬───────────────────────────────────┬───────────────┤
│ Mission rail │ Lab (current mission, one beat)   │ Your System   │
│ 6 stages     │                                   │ (diagram)     │
│ 15 missions  │                                   │               │
├──────────────┴───────────────────────────────────┴───────────────┤
│ Coach panel: explanation · feedback · next challenge · Continue  │
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

Beats are short: a heading, at most 60 words of prose (checked in §17.1), and one visual. Longer reading is split into more beats.

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
  "skillDescription": "Reviews new API endpoints for security problems. Use when …",
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

Stages as cards with a state of exactly one of `waiting`, `running`, `passed`, `failed`, `blocked`, rendered with the shared state vocabulary in §14.5 (icon, text label and border style; never colour alone). The learner starts the run, can step stage by stage, and at gated stages must act (approve, reject). A scenario file declares each stage's outcome so runs are deterministic.

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

**Goal.** Establish the loop and the Claude Code vs API distinction before anything else (intent §15).

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

**Goal.** Show that `intent.md` is what and why, `spec.md` is how it behaves, and `plan.md` is how to build it (intent §6, Stage 2, success criterion 3).

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

**Goal.** Teach Plan Mode and when *not* to use it (intent §6, Stage 3).

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

**Goal.** Show what `CLAUDE.md` is for and what belongs in it (intent §6, Stage 3).

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

Results are shown with the Passed and Failed icons from §14.5 and a text label, each with the reason. XP is awarded when all rules and all four prompts pass. The lab also shows a **Fix guide**: *under-triggering* → add specific trigger phrases; *over-triggering* → add negative triggers and narrow scope. Optional hint: an example of a good description appears after two failed attempts.

### 9.9 Mission 6 — Hooks (Build)

**Goal.** Skills inform; Hooks enforce (intent §6, Stage 3).

1. `explain`: a hook is an automatic rule that runs when Claude tries to do something.
2. `show` — **Skill vs Hook** `compare`. *Skill:* "Never expose PII in logs." *Hook:* automatically run the PII checker whenever an API file changes. A one-line scripted run of the Skill-only case shows an **illustrative** miss (scripted, with a caption "illustrative, not a measured rate") and the Hook-enforced case catching it.
3. `try` — **Build the hook** (`hooks.build`, 20 XP). A `builder` with three decisions:
   - **When:** before or after Claude edits a file (event), matched to `src/api/**` (matcher)
   - **Do what:** run the PII checker (command)
   - **If it fails:** allow, ask the human, or **deny and tell Claude why**

   Only the combination *after-or-before an edit to API files, run the PII checker, deny with the reason* passes. Other combinations show their consequence (for example "ask the human" interrupts every edit; "allow" lets PII through).
4. `show` — **Run it** (`stepper`): Claude edits file → hook fires → PII detected → BLOCKED → Claude sees the reason → Claude fixes the code → hook passes.
5. `try` — **Skill or Hook?** (`hooks.choose`, 10 XP). Three rules to assign (a style preference, "never deploy to production without approval", "prefer small functions"). Only the must-always-hold rule is a Hook.
6. `deeper`: hooks run deterministic commands around tool-use events and can allow, ask or deny; the denial reason is returned to Claude; hooks can serve as approval gates and organisational policy. Exact event names and exit-code behaviour are shown only after verification against current documentation (§16.4).
7. `debrief`: "Instructions reduce mistakes. Guardrails enforce boundaries." *Human decides:* which rules are important enough to enforce.

### 9.10 Mission 7 — Subagents and Parallel Work (Build)

**Goal.** Distinguish the two and show that more agents are not automatically better (intent §6, Stage 3).

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

**Goal.** A Claude session should be able to observe whether its work succeeded (intent §6, Stage 4). This is the strongest visual interaction.

1. `show` — **Before and after** `stepper`. Before: Claude writes code → "Done!" → human finds the error. After: write, run test, FAIL, inspect, fix, run test, PASS, run build, PASS, human review. The loop is animated with the failing and passing runs shown as state-labelled nodes.
2. `show` — **Different work, different feedback** (matching list): Backend → tests; Build system → build command; UI → screenshot or browser comparison; API → request/response check; Performance → benchmark; Data → validation query.
3. `try` — **Build the loop** (`feedback.arrange`, 15 XP). A `builder` with shuffled steps. Rules: *Run test* must come after code is written; *Fix* must follow *Inspect failure*; a **second test run must follow the fix**; *Human review* comes last; "Done!" without any check is rejected with an explanation.
4. `try` — **Run it** (`feedback.run`, 15 XP). The terminal shows a broken `getClaimStatus` that returns `expected_date` where the test expects `expectedDate`. The learner presses **RUN TEST** (FAIL with output), then **Let Claude inspect** (scripted reasoning), **Apply fix** (a visible diff), **RUN TEST** (PASS), **RUN BUILD** (PASS). XP is awarded **only when both verifications pass**.
5. `show` — **Feedback loop vs verifier subagent** `compare`. *Loop:* the same session checks its own work against a real signal. *Verifier subagent:* a separate scoped helper checks independently. One does not replace the other.
6. `debrief`. *Human decides:* what counts as "working" and reviews the result.

### 9.12 Mission 9 — Evals (Test)

**Goal.** Tests check the software; evals check Claude's configuration (intent §6, Stage 4).

1. `show` — **Test vs Eval** `compare`. *Test:* does `GET /status` return HTTP 200? *Eval:* does Claude still pass tests, keep lint clean, keep existing tests, avoid exposing PII and follow project policy?
2. `try` — **Test or eval?** (`evals.classify`, 10 XP). Four statements, two buckets.
3. `show` — **What can change?** Five toggles: `CLAUDE.md`, a Skill, a Hook, the model, the prompt. Each is a change that could shift behaviour.
4. `try` — **Gate the change** (`evals.gate`, 20 XP). Three proposed configuration changes (shorten `CLAUDE.md`, rewrite a Skill description, switch a model). For each the learner must **run the eval suite** before deciding Merge or Reject. Results come from a fixed table (illustrative scenario data): the shortened `CLAUDE.md` removes the PII rule and causes a **REGRESSION** on the PII check in two of six tasks; the other two changes pass. Completion rule: the learner runs the eval for each change and rejects the regression while accepting the passing changes.
5. `debrief`: agent configuration deserves regression testing like code. *Human decides:* which behaviours the eval suite must protect.

### 9.13 Mission 10 — AI PR Review (Deploy)

**Goal.** Separate mechanical review from human judgment (intent §6, Stage 5).

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

**Goal.** Autonomy scaled to risk, with governance explicit (intent §6, Stage 5).

1. `show`: three environments side by side. Development: Claude → deploy, **Allowed**. Staging: **Approval may be required**. Production: **Release approval required**. Each carries a text label and a monochrome icon from §14.5 (Passed check, Needs approval person, Locked padlock).
2. `try` — **Set the policy** (`gates.policy`, builder; 10 XP). A grid of actions (*deploy*, *run a database migration*, *read logs*) by environment (*dev*, *staging*, *production*); each cell is *Allow*, *Ask* or *Deny*. Validity: reads may be allowed everywhere; production deploys and production data changes must be *Ask* or *Deny*; development may be *Allow*. Violations explain the risk.
3. `try` — **Spot the unsafe deployment** (`gates.detect`, 20 XP). Three pipeline configurations are shown as short diagrams. Exactly one is unsafe: Claude holds broad production credentials and deploys with no approval stage. The learner flags it and names the missing control (a gate, scoped access).
4. `debrief`: "Automate everything that can safely be automated and make important human gates explicit." Highlights production access: scoped, gated and logged. *Human decides:* acceptable risk and release approval.

### 9.15 Mission 12 — CI/CD (Deploy)

**Goal.** See Claude inside the pipeline and run it (intent §6, Stage 5). Also the second mention of Claude Code vs API.

1. `show`: the pipeline as a `pipeline` component: Push, Build, Tests, Evals, AI PR Review, Human approval, Deploy, Health check, Success.
2. `show` — a panel: "In a pipeline, Claude usually runs **unattended**, so this is where programmatic or non-interactive use (CLI, SDK or API) can appear. Everything you built in Claude Code still applies." Reinforces §9.3.
3. `try` — **Run the happy path** (`pipeline.happy`, 10 XP). The learner starts the run and acts at the **Human approval** stage: reviewing a short summary, then approving. Stages animate waiting → running → passed.
4. `try` — **Run the incident path** (`pipeline.incident`, 20 XP). Same pipeline; after Deploy the health check fails (5xx errors rise). The learner chooses among *Wait and watch*, *Roll back automatically*, *Push a quick fix forward*. Only *Roll back automatically* completes the stage; the others show their consequence. The failed stage shows FAILED, the next stages BLOCKED, and the rollback shows PASSED.
5. `debrief`: each stage has a state shown by icon, label and border style. *Human decides:* what blocks a release and who approves.

### 9.16 Mission 13 — Close the Loop (Maintain)

**Goal.** Production signals create the next piece of work (intent §6, Stage 6).

1. `show` — **Sensors** `stepper`: Production → metrics → anomaly detected → Claude diagnoses → new `intent.md` → design → plan → build → test → review → deploy → production (loop arrow).
2. `try` — **From signal to intent** (`loop.intent`, 30 XP). A simulated 5xx spike on `/claims/{id}/status` with a short log excerpt. Claude's scripted diagnosis lists four candidate statements. The learner picks the ones that belong in the new `intent.md` (the observed problem, the outcome "status endpoint error rate returns to baseline", the constraint "no new PII in logs while debugging", and an open question "should the endpoint degrade gracefully?") and rejects solution detail and speculation. The generated `intent.md` appears.
3. `debrief`: the line from the start becomes a loop. *Human decides:* whether the incident warrants new work and at what priority; approval remains at the risk boundaries.

### 9.17 Mission 14 — Final Challenge (Maintain)

**Goal.** Apply everything to a practical scenario instead of a quiz (intent §18).

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

Each node has: `id`, label, linked mission, and the seven panel fields from intent §8 (WHAT IT IS, WHY IT EXISTS, WHEN TO USE IT, WHAT IT DEPENDS ON, WHAT IT ENABLES, EXAMPLE, TRY IT). TRY IT links to the mission's activity.

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
- **Locked nodes** are visible with a dotted border, carry the lock icon from §14.5 and the text "Unlocks after: <mission>". **Explore freely** unlocks all.
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
5. The named rewards in intent §7 map to activities: classify `CLAUDE.md` versus Skill (+20, `context.classify`), build a valid feedback loop (+30, `feedback.*`), detect an unsafe deployment (+30, `gates.*`), design the correct agent architecture (+40, `agents.choose`), complete the full SDLC loop (+50, `final.workflow`).
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

The visual design follows the **Nordic Solar brand guidelines** (the brand deck, as captured by the `ns-brand-guidelines` skill). Where the brand guidelines and generic web-design advice disagree, the brand wins; §19 lists each such conflict.

### 14.1 Direction

A modern developer environment, not an LMS: a restrained IDE feel in Nordic Green, Almost Black and the neutrals, strong type hierarchy, generous spacing, and one key message per beat. Playfulness comes from interaction and motion, never from decoration.

| ID | Requirement |
|---|---|
| BRD-01 | No decorative shapes, gradients, textures or overlay patterns. Diagrams, the XP bar and state chips are functional UI, not decoration. |
| BRD-02 | No badge artwork, trophies, confetti or mascots. Levels are shown as a number and a title in type (§11.2). |
| BRD-03 | No photography in v1. If photography is ever added, it must be real Nordic Solar photography; generic stock images and green-leaf bokeh images are retired by the brand. |
| BRD-04 | The circular tagline ring ("Sun. People. Energy.") is the only decorative graphic the brand allows. It is **omitted in v1** because the approved asset is not available; it may be added later only from the official asset. |
| BRD-05 | Logo: only the current square-icon and two-line-wordmark logo, supplied as the official asset by the brand owner. Until it is supplied, the header shows the product name in type and leaves the logo slot empty. Do not redraw or approximate the logo. White logo on Nordic Green or Almost Black; dark logo on White or Off White. Clear space: the brand gives no measurement, so the working default is at least the height of the square icon on every side, until the brand owner supplies a rule (D-01). |

### 14.2 Colour

| ID | Requirement |
|---|---|
| BRD-06 | Only these colours appear anywhere in the product: Nordic Green `#1A5C00`, Almost Black `#1C1C1C`, Off White `#F4F2EB`, White `#FFFFFF`, and Black `#000000` (text only). A **tint** is an approved colour mixed with White or Almost Black, or shown at reduced opacity, written in CSS only as `color-mix(in srgb, var(--token) N%, …)` or `rgb(… / α)` of an approved value. Tints are allowed only for borders, dividers, hover and pressed fills and focus halos, never for text. |
| BRD-07 | No secondary brand colour. The brand's secondaries are assigned to People and Culture, IR and Finance, and Impact and ESG; none applies to engineering learning content. Retired colours (teal, yellow, mustard) never appear. Amber and red state colours are therefore not used. See concern C-02. |
| BRD-08 | Text is only Black `#000000`, Almost Black `#1C1C1C` or White `#FFFFFF`, at full opacity. Never Nordic Green, Off White, a tint or any other colour. This includes headings, links, labels, state chips and disabled controls. Secondary text is distinguished by size and weight, not colour. |
| BRD-09 | Links are distinguished by underline (and weight in navigation), not by colour. |

**Themes.** Dark theme: Almost Black page, White text, Nordic Green for filled primary actions and success chips with White text and a 1 px White border. Light theme: Off White or White page, Almost Black text, Nordic Green fills with White text. The theme defaults to `prefers-color-scheme` and can be switched in settings.

**Verified contrast ratios** (WCAG relative luminance, computed for this spec):

| Foreground on background | Ratio | Use |
|---|---|---|
| White on Almost Black | 17.04:1 | Dark-theme body text |
| Almost Black on White | 17.04:1 | Light-theme body text |
| Almost Black on Off White | 15.21:1 | Light-theme body text |
| White on Nordic Green | 8.16:1 | Text on primary buttons and success chips |
| Nordic Green on Off White | 7.28:1 | Non-text: borders, icons, focus on light surfaces |
| **Nordic Green on Almost Black** | **2.09:1** | **Fails the 3:1 minimum for UI components. Never used for focus rings, borders or icons on dark surfaces.** |

| ID | Requirement |
|---|---|
| UX-01 | On dark surfaces, focus rings, component borders and icons use White or Off White. Nordic Green is only used on dark surfaces as a filled area that carries White text **and** a 1 px White border, so the component edge meets 3:1 (the green fill alone is 2.09:1 against Almost Black). |

### 14.3 Typography

| ID | Requirement |
|---|---|
| BRD-10 | All text uses **Aptos**. The font stack is `Aptos, "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif`. Aptos is not downloaded or embedded; on systems without Aptos (most Mac, Linux and mobile devices) the system fallback is shown. See concern C-01. |
| BRD-11 | Code, terminal output and file contents use `"Aptos Mono", ui-monospace, "Cascadia Code", Consolas, Menlo, monospace`. The brand guidelines do not cover monospace text; this is a working default. |
| BRD-12 | No web fonts, including Google Fonts (privacy and brand). Inter UI is used only inside the logo asset, never for text. |
| BRD-13 | Three-tier hierarchy as in the brand deck: bold headline clearly largest, regular-weight subheading, regular-weight body. Body text is at least 16 px; prose containers have `max-width: 70ch`. |

### 14.4 Tokens (`tokens.css`)

Tokens are CSS custom properties. Themes switch via `data-theme` on `<html>`. Every colour token resolves to one of the BRD-06 values or a tint of one.

| Group | Tokens |
|---|---|
| Surfaces | `--bg`, `--surface-1`, `--surface-2`, `--border`, `--code-bg` |
| Text | `--text` (Almost Black in light theme, White in dark theme), `--text-on-fill` (White). No muted text colour (BRD-08) |
| Fill | `--fill-primary` (Nordic Green), `--fill-primary-hover` (a tint of Nordic Green mixed with Almost Black) |
| Focus | `--focus` (Almost Black in light theme, White in dark theme) |
| Type | `--font-ui`, `--font-mono` (BRD-10, BRD-11), a modular scale from `--text-xs` to `--text-3xl` |
| Space and shape | `--space-1…8`, `--radius-s/m/l`, `--shadow-1/2` (neutral shadows only) |
| Motion | `--dur-fast: 150ms`, `--dur-med: 250ms`, `--dur-slow: 400ms`, `--ease` |

The brand gives no spacing or grid system. The spacing scale is a working default (concern C-10).

### 14.5 State vocabulary

Every state has an **icon, a text label and a border style**, and appears identically across the pipeline, the rail and the map. Icons are monochrome inline SVG in the text colour. No emoji are used anywhere (they render in platform colours outside the palette).

| State | Icon (inline SVG) | Text | Border and fill |
|---|---|---|---|
| Waiting | Empty circle | WAITING | Dashed border, no fill |
| Running | Quarter-filled circle (rotates; static under reduced motion) | RUNNING | Solid border, no fill |
| Passed | Check mark | PASSED | Nordic Green fill, White text |
| Failed | Cross | FAILED | Double border (3 px) in the text colour, no fill |
| Blocked | Circle with bar | BLOCKED | Thick solid border (3 px) in the text colour; label in bold |
| Needs approval | Person silhouette | APPROVAL REQUIRED | Solid border, label in bold; the card shows who approves |
| Locked | Padlock | LOCKED | Dotted border; card and label at full opacity |

| ID | Requirement |
|---|---|
| UX-02 | A learner who cannot distinguish any colours can tell every state apart from icon and label alone (test in §17.2). |

### 14.6 Motion

- Motion exists only to clarify relationships (a node appearing on a path, a state changing, a fix being applied).
- Durations come from the motion tokens; no animation exceeds 400 ms for a single transition. Sequences are stepper-controlled and pausable.
- `prefers-reduced-motion: reduce`, or the in-app setting, disables transitions and auto-play. Steppers start paused and advance with **Step**.

### 14.7 Content style

Plain English first. Short sentences, active voice, no walls of text (at most 60 words of prose per beat, checked in §17.1). Code and file contents are real text in monospace. Original wording throughout; the source material is paraphrased (intent §14).

---

## 15. Accessibility

Nordic Solar has **no UX or accessibility standard**, and the brand guidelines state no contrast requirement (concern C-10). This spec adopts **WCAG 2.2 level AA as a working target**. It is the product's own target, not a confirmed company standard, and must not be described as a company compliance claim.

| ID | Area | Requirement |
|---|---|---|
| UX-03 | Structure | Semantic landmarks (`header`, `nav`, `main`, `aside`); one `<h1>` per view; logical heading order |
| UX-04 | Keyboard | Every control is reachable and operable by keyboard; no drag-only interactions; Esc closes menus and drawers; skip link to main content |
| UX-05 | Focus | Visible focus ring on every interactive element, at least 3:1 against adjacent colours, using `--focus` (UX-01); focus moves to the `<h1>` on route change and to the first new control when a beat changes |
| UX-06 | Contrast | Text at least 4.5:1, large text and UI components at least 3:1, in both themes. The approved pairings in §14.2 all exceed 7:1; Nordic Green on Almost Black (2.09:1) is never used for text, borders or focus |
| UX-07 | Colour | State and correctness are never conveyed by colour alone (§14.5) |
| UX-08 | Motion | Respects `prefers-reduced-motion`; a settings toggle overrides it; no content flashes more than three times per second |
| UX-09 | Announcements | One polite live region for coach feedback and XP; the terminal output is a `role="log"` |
| UX-10 | Targets | Minimum 44×44 px touch targets on touch devices |
| UX-11 | Text | Base font size at least 16 px; layout works at 200% zoom and 320 px width with no loss of function |
| UX-12 | Diagrams | Every diagram has a text alternative or an equivalent ordered list |
| UX-13 | Forms | The Skill description textarea has a visible label, an associated validation list (`aria-describedby`), and validation messages as text |
| UX-14 | Language | The page declares `lang="en"`. v1 is English only (open decision D-08) |

---

## 16. Content and source integrity

### 16.1 Sources

- Primary: Anthropic Claude Academy, *The AI-native SDLC playbook*.
- Skills: Anthropic, [The Complete Guide to Building Skills for Claude](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf).

### 16.2 Rules

Paraphrase everything; do not copy sections of source wording; create original examples. Every mission ends with "Read more" links from `links.js`. Link text names the destination; no bare URLs.

The product is Nordic Solar learning material about a third-party tool. It does not use Anthropic logos or brand styling and does not present itself as an Anthropic product; Anthropic material is cited as a source only.

### 16.3 AI-assisted content and in-product notices

These requirements follow the Company Rules on Artificial Intelligence (transparency, review of AI-generated output, no confidential or personal data in third-party AI tools).

| ID | Requirement |
|---|---|
| GOV-08 | All learning content (mission text, explanations, simulated output) drafted with AI assistance is reviewed by a named subject-matter expert before release. The reviewer and date are recorded in each mission file's metadata (`reviewedBy`, `reviewedOn`). |
| GOV-09 | Every scripted Claude run carries a visible **Simulated** label, and the landing page states that no AI model is called by this product. Because nothing generates AI output at runtime, this spec assumes the product is not an AI system for the AI inventory; the CPIO confirms this (D-05). |
| GOV-10 | The landing page and the debrief of Mission 0 show a **Using AI tools at Nordic Solar** notice: use only AI coding tools approved by the Head of IT & Digitalization; never give them proprietary source code, internal system logic, confidential company information, personal data or credentials; review AI-generated code with the same care as third-party code. The notice names the Company Rules on Artificial Intelligence and the Company Rules on Secure Software Development. If the product is hosted internally (D-07), it also links to them; those intranet URLs are listed in `links.js` like every other link (SEC-03). |
| GOV-11 | The product does not claim to be the AI literacy training required by the Company Rules on Artificial Intelligence. Whether it can count towards that requirement is open decision D-05. |

### 16.4 Technical-claim verification checklist

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

### 17.1 Automated, dependency-free checks

**`tests.html`** opens in a browser and runs pure-logic tests with a minimal in-file assertion helper. It ends by printing one line, `RESULT: PASS` or `RESULT: FAIL`, which CI reads from a headless browser run:

- XP maths and decay (§11.3), level derivation (§11.2), total XP equals 500 across all activities.
- Unlock rules for missions and map nodes, including Explore.
- The Skill description validator against a table of passing and failing descriptions.
- `evaluateWorkflow` against fixtures: the correct workflow yields no findings; each rule R1–R8 violated alone yields exactly its consequence.
- Store round-trip, migration and the in-memory fallback.
- Every mission's data validates: each activity has an id, `maxXp`, and every item has an explanation; sums per mission match §9.1; every mission file has `reviewedBy` and `reviewedOn` (GOV-08) before a release build.
- **Contrast check:** the token pairs used for text, borders and focus in both themes meet UX-06, computed from the live token values with `getComputedStyle` (not hard-coded expectations).
- **Content limits:** every beat's prose is at most 60 words (§14.7).

**`tools/static-checks.py`** runs in CI on every pull request. These checks live outside `tests.html` because a page opened from `file://` cannot read its own source files. It scans the shipped files (`index.html`, `css/`, `js/`) and fails on any of the following:

- **Palette:** a colour literal (hex, `rgb()`, `hsl()`, named colour) other than the BRD-06 values, outside `css/tokens.css`; or a tint written in a form other than the two allowed in BRD-06.
- **Forbidden code:** any match of `\bfetch\s*\(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `\beval\s*\(`, `new Function`, `document.write`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `javascript:`, a `<script src>` or `<link href>` pointing outside the repository, or a `style=` attribute (SEC-01, SEC-02, SEC-04, SEC-07, BRD-12). Patterns are matched in code only; mission prose such as "git fetch" does not match `fetch(`.
- **Emoji and pictographs:** any code point in U+1F000–U+1FAFF, U+2600–U+27BF, U+2B00–U+2BFF or U+FE0F (§14.5). Icons are inline SVG, so no symbol characters are needed.

### 17.2 Manual acceptance

1. Full run-through on desktop (Chrome, Edge, Firefox, Safari) and iOS Safari and Android Chrome, from `file://` and from the staging URL.
2. Keyboard-only run-through of every activity.
3. Screen-reader spot-check of a classifier, the terminal and the pipeline.
4. Reduced-motion run-through.
5. Reset and resume: close the tab mid-mission, reopen, and land where the learner left off.
6. 320 px width and 200% zoom: no horizontal page scroll, no lost function.
7. Private window: the app works and shows the "not saved" notice.
8. Greyscale run-through (browser greyscale filter): every state and every correct or incorrect placement is identifiable (UX-02, UX-07).
9. Font fallback: check on a machine with Aptos (Windows with Microsoft 365) and one without (macOS or iOS) that hierarchy and layout hold in both (BRD-10).
10. **Brand compliance review**, screen by screen, against the `ns-brand-guidelines` checklist: logo (BRD-05), colour (BRD-06 to BRD-09), text colour, typography, no retired elements, one key message per beat. Signed off by the brand owner.
11. **`file://` and CSP:** the app runs from `file://` under the SEC-02 policy in Chrome, Edge, Firefox and Safari. If a browser blocks it, the document owner decides between changing SEC-02 for that mode and dropping `file://` support for that browser, and records the decision here.

### 17.3 Security and release gates

| Gate | When | Passes when | Requirement |
|---|---|---|---|
| CI: SAST, secret scan, SCA, `tools/static-checks.py`, `tests.html` | Every pull request | No high or critical findings; all tests pass | SEC-05, SEC-12 |
| Peer review | Every pull request | One reviewer other than the author approves; AI-assisted changes name the human reviewer | SEC-11, SEC-19 |
| Header check | Every staging deployment | All SEC-08 headers present with the specified values | SEC-08 |
| DAST | Before every production deployment | No high or critical findings | SEC-13 |
| Independent security test | Before first production release and after major changes | Findings resolved or accepted by the Head of IT & Digitalization | SEC-16 |
| System approval test | Before each production release, on staging | §17.2 completed on staging; no new findings in the scans above | GOV-05 |
| Change approval | Before each production release | Head of IT & Digitalization (or the delegate agreed in D-04) approves the release | GOV-04, D-04 |
| SBOM | Each release | SBOM attached to the release | SEC-14 |

### 17.4 Traceability to the success criteria (intent §17)

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

### 17.5 Definition of done (v1)

| ID | Done when |
|---|---|
| FR-01 | All 15 missions complete end to end with working activities and feedback (§9). |
| FR-02 | Total available XP is exactly 500 and all 11 levels are reachable (§11). |
| FR-03 | The dependency map, Your System diagram, Explain simply / Go deeper, Explore freely, persistence and reset all work (§6, §8, §10, §12). |
| FR-04 | The Journey summary shows the generated `intent.md` and the `SKILL.md` download works (§9.18). |
| NFR-01 | Total code size within the budget in §4.6; works from `file://` and from staging in the browsers in §4.5. |
| NFR-02 | §17.1 passes, §17.2 is signed off, and every gate in §17.3 that applies to the release has passed. |
| NFR-03 | §16.4 is fully checked, with no unverified technical claim shipped; every mission has a recorded content reviewer (GOV-08). |
| NFR-04 | The open decisions marked "before build" in §22 are closed, and those marked "before release" are closed for a production release. |

---

## 18. Residual risks

Policy conflicts and decisions the team cannot take are in §19.3 and §22. The remaining delivery risks are:

| Risk | Mitigation | Owner |
|---|---|---|
| The dependency-graph edges are derived, not copied from the playbook | Verify against the official diagram (§10.2, §16.4) | Document owner |
| Technical details of Claude Code features change | Content verification dates; links to current docs; "illustrative" labels on scripted behaviour | Document owner |
| The Skill description validator is a heuristic and may reject a good description | Label it "simulated"; show reasons; keep rules permissive; add fixtures for good descriptions | Build team |
| Scripted "Claude" could be mistaken for real behaviour | GOV-09: a persistent Simulated label and a landing-page statement | Build team |
| 15 missions may feel long | Beats are short; Deeper content is optional; Explore freely and the map allow jumping; progress is saved | Document owner |
| `file://` restrictions | No modules, no `fetch`, no web fonts; all content is in classic scripts (SEC-09) | Build team |
| The Claude Academy URLs are not yet confirmed | Keep them in `links.js` flagged as placeholders until verified | Document owner |
| On devices without Aptos the product looks less on-brand | Accepted until D-01 is decided; layout tested with the fallback font (§17.2 item 9) | Brand owner |

---

## 19. Compliance and concerns

This section records which company rules apply, how the spec meets them, and **where it cannot**. Policies are cited by title and version only; their text is not reproduced here. Read them on the intranet Policy House.

### 19.1 Sources relied on

| Source | Version and status | How it was used |
|---|---|---|
| Nordic Solar brand guidelines (brand deck, via the `ns-brand-guidelines` skill) | Current deck as held by the team | §14, BRD- requirements |
| Policy for Information and IT Security | v4, approved by the Board January 2026 | Confidentiality, integrity and availability objectives; Data Owner and risk assessment; incident reporting (GOV-01 to GOV-03, SEC-17) |
| Company Rules on Secure Software Development | v3.0, signed June 2026 | Security requirements from the outset, AI coding tools, dependencies, change management, environments, testing, CI security, MFA (§4.7, §17.3, §20) |
| Company Rules on Artificial Intelligence | No 1, signed March 2026 (held in the Policy House Drafts folder) | Transparency, review of AI output, no confidential data in third-party AI, AI literacy (§16.3) |
| Artificial Intelligence Policy (docx draft) | Draft; approval date not filled in | Read for context only; the signed company rules take precedence |
| UX or accessibility standard | **None found** in the Policy House or on SharePoint | WCAG 2.2 AA adopted as a working target (§15) |

**Not reviewed**, and to be checked by the Head of IT & Digitalization before build: Company Rules on Access Control, Company Rules on the Use of Encryption, Policy for Processing of Personal Data, and the Business Procedure for Information Security Risk Assessment.

**Authoring aids used to write this spec, and how their conflicts were settled**

These are Claude Code skills (reusable instruction packs) used while drafting this document, not product features. Engineers do not need them: the brand deck, supplied by the brand owner with this spec, is the reference for every colour and rule named in §14.

| Authoring aid | Applied | Not applied, and why |
|---|---|---|
| `ns-brand-guidelines` | In full; it states it overrides generic brand skills for Nordic Solar output | – |
| Anthropic `brand-guidelines` | Not applied | It sets Anthropic's palette and fonts, which would breach the Nordic Solar brand and imply Anthropic authorship |
| `web-design` | Type-scale discipline, layout craft, short purposeful motion | Google Fonts (breaches BRD-12 and sends visitor IP addresses to a third party), placeholder photos from `picsum.photos` (runtime network request, stock imagery, both forbidden), "pick an expressive palette" (breaches BRD-06), single-file output (conflicts with the reviewed architecture in §4) |

### 19.2 Requirements traceability

| Rule (source) | What it requires, in short | Met by | Verified by |
|---|---|---|---|
| Brand: colours | Primary green and black, one secondary by topic, neutral text only, retired colours | BRD-06 to BRD-09, UX-01 | §17.1 palette and contrast checks; §17.2 item 10 |
| Brand: typography | Aptos throughout | BRD-10 to BRD-13 | §17.2 items 9 and 10 |
| Brand: logo and graphics | Current logo only, clear space; tagline ring only decoration; no retired imagery | BRD-01 to BRD-05 | §17.2 item 10 |
| Secure Software Development: security requirements from the outset | Risk assessment before building | GOV-01 | §20 checklist |
| Secure Software Development: AI coding tools | Approved tools only; no proprietary code, credentials or confidential data in external tools; review AI code | SEC-18, SEC-19, GOV-10 | Pull request template; D-02 |
| Secure Software Development: dependencies | Trusted sources, pinned versions, SBOM, scanning | No runtime dependencies; SEC-12, SEC-14 | §17.3 |
| Secure Software Development: change management | Formal approval before changes, documentation, audit trail | GOV-04, SEC-11 | §17.3 change approval; Git history |
| Secure Software Development: environments | No development in production; access control on development and test | SEC-10, SEC-15 | §20 checklist |
| Secure Software Development: testing | Independent security test, system approval test, protected test data | SEC-16, GOV-05; fictional data only (§13) | §17.3 |
| Secure Software Development: CI/CD controls | SAST, DAST, SCA, secrets protected, MFA | SEC-10, SEC-12, SEC-13 | §17.3 |
| Secure Software Development and IT Security Policy: incidents | Report to the Head of IT & Digitalization | SEC-17 | `SECURITY.md` present |
| IT Security Policy: Data Owners | Each system has a Data Owner and a risk rating | GOV-02, GOV-03 | §20 checklist; D-03 |
| AI company rules: transparency | Users told when they deal with AI | GOV-09 | §17.2 run-through |
| AI company rules: review of AI output | Verify AI-generated content before use | GOV-08, SEC-19 | §17.1 metadata check |
| AI company rules: third-party AI tools | No confidential or personal data without approval | SEC-18, GOV-10 | D-02 |
| AI company rules: AI literacy | Role-appropriate training with completion records | GOV-11 (not claimed) | D-05 |

### 19.3 Concern register

Severity: **High** blocks build until decided; **Medium** blocks production release until decided; **Low** means the default is accepted unless the owner objects, so no deadline applies. Each concern's decision in §22 has the matching "Needed" value.

| ID | Severity | Concern | Sources in tension | What this spec does by default | Why it cannot be fully resolved here | Decision owner |
|---|---|---|---|---|---|---|
| C-01 | Medium | **Aptos is the required font, but it cannot be delivered to all learners.** Aptos ships with Microsoft 365 and is absent on most Mac, Linux and mobile devices. | Brand (Aptos everywhere) vs this spec's no-web-font and no-network rules; privacy (Google Fonts sends visitor IP addresses to a third party) | Aptos first in the stack, system fallback, nothing embedded (BRD-10, BRD-12) | Self-hosting Aptos needs a licence that permits web embedding; that licence is not confirmed. A hosted font service conflicts with SEC-04. | Brand owner (asset), Head of IT & Digitalization (font licence) (D-01) |
| C-02 | Low | **No red or amber for failures and warnings.** Developer tools conventionally use red, amber and green for state. | Brand (neutral text only; one secondary colour, assigned by topic; yellow retired) vs common UX conventions | No secondary colour; states distinguished by icon, label and border style; Nordic Green only for success (§14.5) | Using Sunset Red for errors would apply a secondary colour to a topic it is not assigned to. Only the brand owner can grant an exception. | Brand owner (D-06) |
| C-03 | Low | **Nordic Green fails contrast on dark surfaces** (2.09:1 against Almost Black). | Brand (green as primary) vs WCAG 1.4.11 non-text contrast | Green is used on dark surfaces only as a filled area with White text; focus rings and borders use White or Off White (UX-01) | Resolved by the rule above; recorded because it constrains every component. | None (resolved) |
| C-04 | **High** | **This product teaches engineers to use Claude Code on real repositories, and is being built with Claude Code, but no record was found that Claude Code is an approved AI coding tool.** (Searched: the SharePoint Policy House, including the Company Rules overview, and the IT site.) The rules also forbid submitting proprietary source code, internal system logic, credentials or confidential information to external AI coding tools. | Company Rules on Secure Software Development and Company Rules on Artificial Intelligence vs intent §2, §17 (the learner should be able to apply this to a real repository) | All product content is fictional; GOV-10 tells learners to use only approved tools and never share confidential data; SEC-18 binds the build team | Whether Claude Code is approved, and on what terms, is the Head of IT & Digitalization's decision. If it is not approved, the product teaches a workflow employees may not use, and the build team may not use it either. | Head of IT & Digitalization, with the CPIO (D-02) |
| C-05 | Medium | **AI literacy records versus no tracking.** The AI rules require role-appropriate AI literacy training with completion records that can be shown to the supervisory authority. This product deliberately has no accounts, no backend and no tracking. | Company Rules on Artificial Intelligence vs intent §19 non-goals and privacy by design | The product is positioned as learning material, not as the required training (GOV-11) | Producing completion records needs identities, storage, a GDPR legal basis and a backend, all outside v1. v1 cannot do both. | CPIO as AI Compliance Owner (D-05) |
| C-06 | **High** | **Change approval cadence.** The rules require formal approval of proposed changes by the Head of IT & Digitalization before work starts, and an audit trail. | Company Rules on Secure Software Development vs incremental delivery of 15 missions | GOV-04: one approval of this spec and `plan.md` before build, then approval per production release; pull requests provide the audit trail | Whether approval per release (rather than per change) satisfies the rule, or whether the Head of IT & Digitalization delegates it, is theirs to decide. | Head of IT & Digitalization (D-04) |
| C-07 | **High** | **Repository location.** The repository is a private repository on a personal GitHub account. The rules require MFA for repositories and pipelines, access control on development environments, and security in version management. Compliance of this account cannot be verified from here. | Company Rules on Secure Software Development and the Information and IT Security Policy vs current setup | SEC-10 requires MFA and a company-controlled location, or a written acceptance. Build does not start until D-03 is decided | Moving the repository or accepting it is not an engineering decision. | Head of IT & Digitalization (D-03) |
| C-08 | Medium | **Hosting and headers.** Free static hosts such as GitHub Pages cannot set security headers. A meta-tag CSP cannot set `frame-ancestors`, and how `'self'` behaves on `file://` differs between browsers. | Company Rules on Secure Software Development (protection of applications on public networks; DAST) vs intent §20 (works locally, minimal setup) | SEC-08 requires a header-capable host for any company-facing deployment; `file://` stays a documented convenience mode (SEC-09) | Where the product is hosted, and whether it is internal or public, is not decided. | Head of IT & Digitalization (D-07 production, D-11 staging) |
| C-09 | Medium | **Local storage and privacy.** Progress is kept in `localStorage`. It contains no identifiers, and storing it serves a feature the learner uses. Whether that makes it outside the personal-data policy and exempt under the Danish cookie rules has not been confirmed. | Policy for Processing of Personal Data (not reviewed) vs intent §20 (persist progress locally) | SEC-06: no identifiers stored; no cookies; storage can be reset | The privacy owner has not reviewed it. | Privacy owner or DPO (D-09) |
| C-10 | Low | **No company UX, accessibility, spacing or grid standard exists.** | Absence of a standard | WCAG 2.2 AA as a working target (§15); spacing scale as a working default (§14.4) | There is nothing to conform to. This is recorded so nobody claims compliance with a company standard. | Head of IT & Digitalization (D-10) |
| C-11 | Low | **"Premium, playful, gamified" versus a strict brand.** The brand permits one decorative element and no gradients or overlays. | Intent §7, §9 vs brand graphics rules | Gamification is functional only: XP bar, numbered levels, typography, purposeful motion (BRD-01, BRD-02) | The product will look more restrained than the intent's "strategy game" inspiration. Accepted unless the brand owner allows more. | Brand owner (no decision needed unless they object) |
| C-12 | Medium | **The official logo asset is not available**, and no clear-space measurement exists. Logo image files exist in an unrelated local project folder, not in the brand library, and could not be confirmed as the current mark. | Brand (current logo only; do not redraw) | Logo slot left empty until the official asset is supplied (BRD-05) | Only the brand owner can supply the asset. | Brand owner (D-01) |
| C-13 | Low | **Policy provenance.** The signed AI company rules sit in the Policy House Drafts folder; the AI Policy document has no approval date filled in; review cycles differ between documents (annual versus two-yearly). | Policy House housekeeping | The signed company rules are treated as authoritative | Housekeeping for the policy owners, not this project. | CPIO |
| C-14 | **High** | **Internal policy detail in an external repository.** This spec names internal policies and summarises what they require (§19.2, §19.3). | Information and IT Security Policy (confidentiality) vs keeping the spec next to the code | Policies are cited by title and version and summarised in short; no policy text is reproduced | Whether even summaries may sit in the current repository depends on D-03. | Head of IT & Digitalization (D-03) |

---

## 20. Delivery governance

### 20.1 Before build starts

| ID | Prerequisite | Owner | Status |
|---|---|---|---|
| GOV-01 | Information-security risk assessment of the product carried out per the Business Procedure for Information Security Risk Assessment, covering confidentiality, integrity and availability, the staging host (D-11) and the intended production hosting (D-07) | Head of IT & Digitalization | Open |
| GOV-02 | Data Owner named for the product | Head of IT & Digitalization | Open |
| GOV-03 | Product recorded in Risma with its risk rating (1 to 5), if the Head of IT & Digitalization agrees a static training site counts as a "system" under the Information and IT Security Policy (this spec's interpretation) | Data Owner | Open |
| GOV-04 | This spec and `plan.md` approved as the change proposal; release-level approval agreed (D-04) | Head of IT & Digitalization | Open |
| GOV-05 | Staging environment set up on the host chosen in D-11, separate from production, for the system approval test (§17.3) | Build team | Open |
| GOV-06 | AI coding tool decision taken (D-02), and the build team briefed on SEC-18 and SEC-19 | Head of IT & Digitalization | Open |
| GOV-07 | Repository location decided and MFA confirmed for all contributors (D-03, SEC-10) | Head of IT & Digitalization | Open |
| GOV-12 | Document owner named for `intent.md`, `spec.md` and `plan.md` | Head of IT & Digitalization | Open |
| GOV-13 | Spec and plan signed off by every approver in §20.4 | Document owner | Open |
| GOV-14 | The policies listed as not reviewed in §19.1 checked against this spec, and any new requirements added (D-12) | Head of IT & Digitalization | Open |

GOV-08 to GOV-11 (content review and in-product notices) are in §16.3.

### 20.2 Responsibilities

| Activity | Responsible | Accountable | Consulted | Informed |
|---|---|---|---|---|
| Specification and plan | Document owner | Head of IT & Digitalization | CPIO, brand owner | Build team |
| Build and code review | Build team | Head of IT & Digitalization | – | Document owner |
| Security testing (independent) | IT department or external tester | Head of IT & Digitalization | Build team | CPIO |
| Brand compliance review | Build team | Brand owner | – | Document owner |
| Content accuracy review | Subject-matter expert | Document owner | Build team | – |
| AI-rule questions | Document owner | CPIO (AI Compliance Owner) | Head of IT & Digitalization | – |
| Release approval | Build team | Head of IT & Digitalization | Data Owner | Learners' managers |

### 20.3 Definition of ready (for engineering)

Build starts when: GOV-01 to GOV-07 and GOV-12 to GOV-14 are done; open decisions marked "before build" in §22 are closed; `plan.md` exists and is approved; and the staging environment and CI with the §17.3 per-pull-request gates exist.


### 20.4 Sign-off

| Approver | Signs off | Name | Date |
|---|---|---|---|
| Head of IT & Digitalization | Whole spec and plan as the change proposal (GOV-04); §4.7 security; §17.3 gates | | |
| CPIO (AI Compliance Owner) | §16.3 AI-assisted content and notices; concerns C-04 and C-05 | | |
| Brand owner | §14 visual design; concerns C-01, C-02, C-11, C-12 | | |
| Privacy owner or DPO | SEC-06 and §6 stored data; concern C-09 | | |
| Document owner | Mission content (§9) and intent alignment | | |

---

## 21. Delivery order (input for `plan.md`)

0. Governance prerequisites (§20.1); repository protections (SEC-10, SEC-11); `README.md`, `SECURITY.md`, the pull request template and `docs/sbom.md`; CI gates (SEC-12).
1. Shell, tokens, router, store, a11y helpers, and `tests.html` skeleton, including the palette, contrast, forbidden-API and emoji checks.
2. Core components: `classifier`, `coach`, `compare`, `stepper`; Missions 0–2 (proves the beat model and XP), including the GOV-09 and GOV-10 notices.
3. Your System diagram and the map; unlock logic.
4. `terminal`, `tree`, `builder`; Missions 3–5 (including the Skill validator).
5. Missions 6–9.
6. `pipeline`; Missions 10–13.
7. Final challenge rules engine, Mission 14 and the Journey summary.

   In steps 2 to 7, each mission's content review (GOV-08) is done and recorded as that mission is written, not at the end.
8. Accessibility, responsive and reduced-motion pass; brand compliance review; final technical-claim verification (§16.4).
9. Staging deployment, header check, DAST, independent security test, system approval test and release approval (§17.3).

---

## 22. Open decisions

| ID | Decision | Owner | Needed | Default if not decided |
|---|---|---|---|---|
| D-01 | Supply the official logo asset and its clear-space rule; confirm whether a licensed Aptos web font may be self-hosted | Brand owner (asset); Head of IT & Digitalization (font licence) | Before release | Empty logo slot; Aptos from the device only |
| D-02 | Is Claude Code an approved AI coding tool, on what terms, and may this spec and the fictional content be processed by it? | Head of IT & Digitalization, CPIO | **Before build** | None. Build does not start until decided. |
| D-03 | Repository location: move to a company-controlled organisation, or accept the current one in writing | Head of IT & Digitalization | **Before build** | None. Build does not start until decided. |
| D-04 | Change approval at release level, or per change; delegation | Head of IT & Digitalization | **Before build** | None. Proposed: approval of spec and plan, then per release. |
| D-05 | Should the product count towards AI literacy training (a new intent would be needed for records)? Confirm the product is not an AI system for the AI inventory | CPIO | Before release | Not counted (GOV-11) |
| D-06 | May a secondary colour (for example the brand's red) mark failures? | Brand owner | No deadline | No (BRD-07) |
| D-07 | Production hosting: internal or public, and which header-capable host | Head of IT & Digitalization | Before release | Local `file://` use only |
| D-08 | Language: English only, or Danish as well | Document owner | Before release | English only |
| D-09 | Confirm local storage of progress is acceptable under the personal-data policy and cookie rules | Privacy owner or DPO | Before release | None. Release waits for confirmation. |
| D-10 | Adopt WCAG 2.2 AA as a company target, or name another standard | Head of IT & Digitalization | No deadline | WCAG 2.2 AA as this product's own target |
| D-11 | Staging host: a non-public, header-capable environment for the system approval test | Head of IT & Digitalization | **Before build** | None. Build does not start until decided. |
| D-12 | Review the policies not yet checked against this spec (Access Control, Encryption, Processing of Personal Data, Information Security Risk Assessment procedure) | Head of IT & Digitalization | **Before build** | None |
