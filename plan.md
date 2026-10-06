# Plan: Claude Engineering Lab v1

- **Status:** Draft for approval with [spec.md](spec.md) v2.0 (GOV-04, GOV-13)
- **Derived from:** [intent.md](intent.md) → [spec.md](spec.md)
- **Scope:** Implementation order, files, risks and checks. Behaviour is defined in the spec and not repeated here; section and requirement IDs point to it.

The plan has ten phases. Each phase ends with checks that must pass before the next starts. Phase 0 is governance and repository set-up, and **no product code is written until it is complete** (spec §20.3).

---

## 1. Phases, files and exit checks

### Phase 0 — Governance and repository (no product code)

**Do**

- Close the "before build" decisions: D-02 (Claude Code approval), D-03 (repository location), D-04 (change approval), D-11 (staging host), D-12 (review of the remaining policies).
- Complete GOV-01 to GOV-07 and GOV-12 to GOV-14: risk assessment, Data Owner, Risma entry, staging environment, document owner, sign-off (spec §20.4).
- Apply branch protection on `main` (SEC-11) and confirm MFA for every contributor (SEC-10).

**Create**

| File | Purpose |
|---|---|
| `README.md` | How to open locally, folder structure, how to add a mission, `file://` security posture (SEC-09) |
| `SECURITY.md` | Reporting path to the Head of IT & Digitalization (SEC-17) |
| `.github/pull_request_template.md` | AI-assistance disclosure and named human reviewer (SEC-19) |
| `.github/workflows/ci.yml` | SAST (CodeQL for JavaScript), secret scan, "no dependency manifest" check; every action pinned to a commit SHA (SEC-12) |
| `docs/sbom.md` | Runtime dependencies: none; build dependencies: the pinned CI actions (SEC-14) |

**Exit checks**

- A test pull request triggers CI and every job passes.
- A direct push to `main` is rejected.
- D-02, D-03, D-04, D-11 and D-12 are recorded as decided, and spec §20.4 is signed.

### Phase 1 — Foundations

**Create**

| File | Purpose |
|---|---|
| `index.html` | Shell, landmarks, CSP meta (SEC-02), `lang="en"`, script and style tags |
| `css/tokens.css`, `css/base.css`, `css/layout.css` | Brand tokens (§14.2 to §14.4), focus rules (UX-01, UX-05), responsive shell (§5) |
| `js/core/dom.js`, `store.js`, `router.js`, `a11y.js` | Helpers, versioned state with in-memory fallback (§6), hash routes (§4.4), live region and focus management |
| `js/core/xp.js`, `js/core/unlock.js` | Pure XP, level and unlock logic (§11) |
| `js/app.js` | Boot and landing view, including the GOV-09 and GOV-10 notices |
| `tests.html` and `tests/*.test.js` | In-browser test runner. It prints a single `RESULT: PASS` or `RESULT: FAIL` line so CI can read it |
| `tools/static-checks.py` | CI script for the palette, forbidden-code and emoji checks (spec §17.1) |

**Extend:** `ci.yml` to run `static-checks.py` and `tests.html` in headless Chrome.

**Exit checks**

- `tests.html` passes the store round-trip, migration and in-memory-fallback tests, plus XP decay, levels, unlock rules and the contrast check from computed tokens.
- The static checks pass.
- **CSP spike:** the CSP meta tag is proven to work from `file://` in Chrome, Edge, Firefox and Safari (spec §17.2 item 11). If it does not, the document owner decides before Phase 2.
- The shell renders at 320 px and 200% zoom, with and without Aptos installed.

### Phase 2 — Core components and Missions 0–2

**Create**

- Components in `js/components/`: `choice.js`, `classifier.js`, `coach.js`, `compare.js`, `stepper.js` (spec §7).
- Mission data: `js/content/missions/m00-orientation.js`, `m01-intent.js`, `m02-spec.js`, each with `reviewedBy` and `reviewedOn`.
- Supporting content: `js/content/glossary.js`, `js/content/links.js`.
- Styles: `css/components.css`.

**Exit checks**

- Mission data validation tests pass (ids, `maxXp`, explanations, per-mission XP sums).
- Missions 0–2 can be completed by keyboard only and by touch at 375 px.
- The beat model and the Simple / Deeper switch keep activity state.
- XP and levels 1–2 are awarded correctly.

### Phase 3 — Your System diagram and dependency map

**Create:** `js/components/diagram.js`, `js/components/map.js`, `js/content/system-nodes.js`, `js/content/map-graph.js`.

**Exit checks**

- Nodes unlock as missions complete and in Explore mode.
- Each diagram has a text alternative (UX-12).
- Arrow-key navigation works on the map.
- The list fallback appears below 768 px.

### Phase 4 — Terminal, tree, builder and Missions 3–5

**Create**

- Components: `terminal.js`, `tree.js`, `builder.js`.
- Mission data: `m03-plan.js`, `m04-context.js`, `m05-skills.js`.
- `js/core/skills-validator.js`: the pure description validator (§9.8.1).

**Exit checks**

- The validator passes a fixture table of good and bad descriptions.
- The downloaded `SKILL.md` is valid: frontmatter delimiters, kebab-case name, no angle brackets.
- The terminal output is readable by a screen reader.
- The builder can be operated by keyboard.

### Phase 5 — Missions 6–9

**Create:** `m06-hooks.js`, `m07-agents.js`, `m08-feedback.js`, `m09-evals.js`.

**Exit checks**

- The feedback mission awards XP only after both the test and the build pass.
- The eval mission's results come from the fixed scenario table.
- Running total XP matches spec §11.2 at level 8.

### Phase 6 — Pipeline and Missions 10–13

**Create:** `js/components/pipeline.js`, `m10-review.js`, `m11-gates.js`, `m12-pipeline.js`, `m13-loop.js`.

**Exit checks**

- Every pipeline state is distinguishable in greyscale (UX-02).
- The incident path completes only with rollback.
- The greyscale run-through passes for Missions 10–13.

### Phase 7 — Final challenge and Journey summary

**Create**

- `js/core/workflow.js`: `evaluateWorkflow`, the pure rules engine (§9.17).
- `m14-final.js`.
- The summary view in `app.js`.

**Exit checks**

- The correct workflow fixture produces no findings.
- Each rule R1–R8, violated alone, produces exactly its consequence.
- Scoring floors at 10 XP.
- Total XP across all activities is exactly 500 and all 11 levels are reachable.

### Phase 8 — Hardening and content sign-off

**Do**

- Accessibility, responsive and reduced-motion pass across all views.
- Brand compliance review, signed off by the brand owner (§17.2 item 10).
- Technical-claim verification (§16.4).
- Content review recorded in every mission file (GOV-08).
- Fix the Claude Academy URLs in `links.js`, or remove them.

**Exit checks**

- §17.1 is all green.
- §17.2 items 1 to 10 are signed off, except the staging runs.
- Total code size is under 300 KB (§4.6).

### Phase 9 — Staging and release

**Do**

- Deploy to the header-capable host chosen in D-07, staging first.
- Run the header check (SEC-08) and DAST (SEC-13).
- Run the independent security test (SEC-16) and the system approval test on staging (GOV-05).
- Obtain release approval (GOV-04) and attach the SBOM.

**Create:** the host's header configuration file (its name depends on the host chosen in D-07).

**Exit checks**

- Every gate in §17.3 that applies has passed.
- §17.5 definition of done is met.

---

## 2. Dependencies and risks

### Decisions that block phases

| Decision | Blocks | If late |
|---|---|---|
| D-02 Claude Code approval, D-03 repository location, D-04 change approval, D-11 staging host, D-12 policy review | Phase 1 onward | Nothing starts. The fallback is to build without Claude Code, which still needs the other four. |
| D-07 hosting | Phase 9 | Ship for local `file://` use only. Spec §19.3 C-08 records the weaker security posture of that mode. |
| D-01 logo asset and Aptos licence | Phase 8 brand sign-off | Release with an empty logo slot and a system-font fallback (BRD-05, BRD-10). |
| D-05 AI literacy, D-08 language, D-09 privacy | Phase 9 | D-05 and D-08 use the defaults in spec §22; D-09 has no default, so release waits. |
| D-06 secondary colour, D-10 UX standard | Nothing | Defaults apply; no deadline. |

### Technical and delivery risks

| Risk | Mitigation |
|---|---|
| A strict CSP may block scripts from `file://` in some browsers | Spike in Phase 1, before any components are built |
| Browsers block `file://` pages from reading their own source files | Static checks run as a CI script (`tools/static-checks.py`, spec §17.1) |
| Headless test runs in CI | Use the Chrome already on the CI runner to load `tests.html` and read the `RESULT` line; no npm packages |
| Writing the content of 15 missions, not the code, is the largest effort | Write mission content alongside each phase. Book subject-matter-expert review time early (GOV-08). |
| Claude Code features change during the build | Re-run the §16.4 verification in Phase 8, not earlier |
| The dependency-map edges are unverified (§10.2) | Check them against the official playbook in Phase 3 |
| Layout and hierarchy may break without Aptos | Test with the fallback font from Phase 1 |

---

## 3. Spec amendments

None outstanding. The three amendments an earlier draft of this plan asked for (static checks as a CI script, the extra folders and files in the layout, and the SCA wording) are now in spec §17.1, §4.2 and SEC-12.

---

## 4. Checks that prove it works

| Check | What it proves | Where | Runs |
|---|---|---|---|
| `tests.html` | Logic: store, XP, levels, unlock rules, validator, rules engine, mission data, contrast | Browser and CI | Every pull request |
| `tools/static-checks.py` | Brand palette, no forbidden APIs or network calls, no emoji | CI | Every pull request |
| SAST, secret scan, manifest check | SEC-05, SEC-12 | CI | Every pull request |
| Peer review with named human reviewer | SEC-11, SEC-19 | GitHub | Every pull request |
| Phase exit checks (§1 of this plan) | Each increment works before the next starts | Build team | End of each phase |
| Manual acceptance §17.2 | Browsers, keyboard, screen reader, reduced motion, greyscale, font fallback, brand | Build team, brand owner | Phase 8 and on staging |
| Header check and DAST | SEC-08, SEC-13 | Staging | Each staging deployment and before release |
| Independent security test and system approval test | SEC-16, GOV-05 | IT department | Before first production release |
| Definition of done §17.5 | FR-01 to FR-04, NFR-01 to NFR-04 | Approvers | Release |
