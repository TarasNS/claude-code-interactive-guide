# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

**Claude Engineering Lab** is an interactive, gamified browser tutorial that teaches the AI-native SDLC with Claude Code. It is built for Nordic Solar.

The repository is still at the documents stage. There is **no application code yet**, and therefore no build, lint or test commands. The project follows its own subject matter, one document per step:

1. [intent.md](intent.md) says what and why. It is the source of truth for scope and the success criteria (intent §17).
2. [spec.md](spec.md) says how the product behaves and which rules it must satisfy. Requirement IDs (`FR-`, `NFR-`, `SEC-`, `BRD-`, `UX-`, `GOV-`), concern IDs (`C-`) and decision IDs (`D-`) are stable; never renumber them.
3. [plan.md](plan.md) holds the implementation phases (0 to 9), the files each phase creates, and the exit checks that must pass before the next phase starts.

Change them in that order. A product change that contradicts `intent.md` needs the intent updated first. A behaviour change needs `spec.md` updated before code.

**Build is blocked** until the "before build" decisions in spec §22 are closed and MFA is confirmed for every contributor (GOV-07). One of the open decisions concerns this very tool: whether Claude Code is an approved AI coding tool at Nordic Solar (D-02). Spec §19.3 explains why. Do not start writing product code while they are open.

## Planned architecture (spec §4)

These decisions are deliberate. Do not "modernise" them without changing the spec first.

- **No build step and no dependencies.** The repository root is the deployable site. `index.html` must work when opened directly from `file://`.
- **No ES modules.** Browsers block module scripts on `file://`. Use classic `<script defer>` files that register on one global namespace, `window.Lab` (`Lab.store`, `Lab.router`, `Lab.xp`, `Lab.unlock`, `Lab.ui`, `Lab.content`, …).
- **Data-driven missions.** Each of the 15 missions is a data file in `js/content/missions/`, rendered by reusable components in `js/components/`. A mission should only need new rendering code if it needs a new component.
- **Pure logic is kept apart from the DOM.** XP, unlock rules, the Skill description validator and the final-challenge rules engine (`evaluateWorkflow`) are pure functions, so `tests.html` can test them without a framework.
- **XP and level are derived, never stored.** Total XP is the sum of per-activity awards in state. Levels come from completed missions. Mission XP must total exactly 500 (spec §9.1, §11).
- **Routing** uses the URL hash (`#/`, `#/m/<missionId>`, `#/map`, `#/summary`).
- **Persistence** uses one versioned `localStorage` key, `cclab.v1`, wrapped in try/catch with an in-memory fallback.

When code exists, tests run by opening `tests.html` in a browser (spec §17.1). CI also runs it headless, alongside static analysis and secret and dependency scans (SEC-12). The release gates are in spec §17.3.

## Constraints that override generic defaults

**Brand** (spec §14). For anything visual, the `ns-brand-guidelines` skill takes precedence over the generic `brand-guidelines` and `web-design` skills; spec §19.1 records what was rejected from each.

- Colours: Nordic Green `#1A5C00`, Almost Black `#1C1C1C`, Off White `#F4F2EB`, White `#FFFFFF`, and Black for text. No secondary colour, no teal, no yellow or amber, no gradients.
- Text is only Black, Almost Black or White. Links are underlined, not coloured.
- Font: `Aptos` first, with no web fonts. Google Fonts are forbidden for both brand and privacy reasons.
- No emoji, no badge artwork, no redrawn logo. Use monochrome inline SVG icons.
- State is never shown by colour alone. Use icon, text label and border style (spec §14.5).
- Nordic Green on Almost Black is 2.09:1 contrast. Never use it for focus rings, borders or icons on dark surfaces.

**Security** (spec §4.7). This is a static site, so most rules come down to these:

- No runtime network requests.
- Learner text is written with `textContent` only.
- Strict CSP. No `eval`, `new Function` or `document.write`.
- No secrets or credentials, real or realistic-looking.
- AI-generated code needs a named human reviewer recorded in the pull request.

**Content** (spec §16).

- Source material (the Anthropic SDLC playbook and the Skills guide) is paraphrased, never copied. No Anthropic logos or styling.
- Every example uses the fictional ClaimsPortal project.
- Scripted "Claude" output is always labelled **Simulated**.
- Each mission file records its human content reviewer (`reviewedBy`, `reviewedOn`).
- Technical claims about Claude Code features must be checked against current docs before release (spec §16.4).

## Repository conventions

- Work on a branch and open a pull request to `main`.
- `The-Complete-Guide-to-Building-Skill-for-Claude.pdf` is a third-party document kept for reference. Leave it untracked.
- `spec.md` refers to internal Nordic Solar policies by name and section. Do not paste policy text into the repository. The repository's location on a personal GitHub account was accepted on 2026-10-06 (spec D-03).
