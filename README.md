# Claude Engineering Lab

An interactive, gamified browser-based tutorial on building software with Claude Code using the AI-native SDLC, developed for Nordic Solar.

## Getting started

### Local development

Claude Engineering Lab is a static site. To open it locally:

**Option 1: Direct file access (file:// posture)**

1. Clone the repository
2. Open `index.html` in a web browser by double-clicking it, or with:
   ```
   open index.html
   ```

**Option 2: Local server**

For testing with response headers (closer to production):

```bash
# Python 3
python -m http.server 8000

# Node.js / http-server
npx http-server .
```

Then open `http://localhost:8000` in your browser.

### Important note on file:// security

Running from `file://` (direct file access) offers a weaker security posture than HTTPS with proper response headers. The production deployment requires strict response headers and HTTPS (spec §4.7 SEC-08). Local development from `file://` is a convenience only. Learn more in [SECURITY.md](SECURITY.md).

## Repository structure

```
.
├── index.html                  Shell, landmarks, CSP meta tag, script and style tags
├── css/
│   ├── tokens.css             Design tokens (the only file with colour literals)
│   ├── base.css               Reset, typography, focus, utilities
│   ├── layout.css             App shell, rail, lab, responsive rules
│   └── components.css         Component, state and view styling
├── js/
│   ├── app.js                 Boot, shell, routes, rail, settings
│   ├── mission.js             Mission runner: beats, gating, XP, hints, level banner
│   ├── summary.js             Journey summary view
│   ├── core/                  dom, a11y, xp, unlock, store, router,
│   │                          skills-validator, workflow (rules engine)
│   ├── components/            icons, notices, coach, classifier, compare, stepper,
│   │                          choice, diagram, map, tree, terminal, flagger, builder,
│   │                          textlab, evalgate, pipeline, policygrid, workflow, files
│   └── content/
│       ├── registry.js        Mission, glossary and link lookups
│       ├── missions/          m00-orientation.js ... m14-final.js (data, one per mission)
│       ├── glossary.js, links.js, repo.js, system-nodes.js, map-graph.js, final.js
├── tests.html                 In-browser test runner (prints RESULT: PASS or FAIL)
├── tests/                     Test scripts loaded by tests.html
├── tools/
│   ├── static-checks.py       CI script: palette, forbidden code, emoji, size budget
│   ├── view-audit.js          Accessibility audit to paste into a browser console
│   ├── headers.json           The SEC-08 response-header policy (single source of truth)
│   ├── make-header-config.py  Print that policy for nginx, Netlify/Cloudflare or Azure Static Web Apps
│   ├── check-headers.py       Check a staging or production URL against the policy (SEC-08, SEC-13)
│   └── hooks/                 Claude Code hooks (build gate, push guard, etc.)
├── .github/                   CI workflow and pull request template
├── .claude/                   Claude Code settings, hooks wiring, the mission-authoring skill
├── docs/                      SBOM and mission drafts
├── SECURITY.md, CLAUDE.md
└── intent.md, spec.md, plan.md
```

## Adding a mission

A mission is a data file rendered by reusable components. The format, with every field and component option, is in `.claude/skills/cclab-mission-authoring/references/mission-format.md`.

1. Add or check the mission's row (`id`, title, stage, XP) in `js/core/xp.js`, and the level table if levels change.
2. Create `js/content/missions/mNN-<id>.js` as strict JSON inside `Lab.content.registerMission({ ... })`. Leave `reviewedBy` and `reviewedOn` as `null` for a named human reviewer to fill in (GOV-08), and record every technical claim in `claims` with `verified: null`.
3. Add the file's `<script defer>` tag to `index.html` and `tests.html`, after the other missions.
4. Run the validator: `python .claude/skills/cclab-mission-authoring/scripts/validate_mission.py js/content/missions/mNN-<id>.js`.
5. Open `tests.html` and confirm `RESULT: PASS` (it checks XP totals, explanations, word counts and the level table).
6. A new component needs a file in `js/components/`, its `Lab.ui.register` call, script tags, and a name in the validator's component list.

A mission needs new rendering code only if it needs a new component.

## Development workflow

1. **Branch:** Create a branch and open a pull request to `main`
2. **CI:** Every PR triggers automated checks:
   - Static analysis (CodeQL for JavaScript)
   - Secret scan
   - Dependency check ("no manifest found")
   - Brand compliance (palette, forbidden APIs, emoji)
   - Tests (`tests.html` in headless Chrome)
3. **Review:** Requires at least one reviewer who is not the author, and declaration of AI-assisted code with a named human reviewer (spec §20.2)
4. **Merge:** CI must pass, branch protection enforced

## Building and testing

- **Tests:** Open `tests.html` in a browser or run in CI with headless Chrome. Prints `RESULT: PASS` or `RESULT: FAIL`.
- **Static checks:** `python tools/static-checks.py` (brand palette, no forbidden APIs, no emoji, the size budget).
- **Syntax check:** `for f in $(find js tests tools -name '*.js'); do node --check "$f"; done`. CI runs it too.
- **Hook and header-tool tests:** `python tools/hooks/test_hooks.py` and `python tools/test_check_headers.py`.
- **Hosting headers:** `python tools/make-header-config.py nginx|netlify|azure-swa` prints the configuration for the host chosen in D-07 and D-11; `python tools/check-headers.py https://<host>/` verifies it.
- **Accessibility audit:** paste `tools/view-audit.js` into the browser console on `index.html` and read the report. It checks every view for headings, landmarks, live regions, names, touch targets and horizontal overflow.
- **CSP validation:** The `Content-Security-Policy` meta tag is verified in Chrome, Edge, Firefox and Safari from `file://` (spec §17.2 item 11).
- **Size budget:** Total shipped code (HTML, CSS, JS) must stay under 400 KB uncompressed (spec §4.6, enforced by `tools/static-checks.py`).

## Technical decisions

These decisions are deliberate and documented in spec §4. Do not "modernise" without changing the spec first:

- **No build step and no dependencies.** The repository root is the deployable site.
- **No ES modules.** Browsers block module scripts on `file://`. Use classic `<script defer>` tags that register on the global namespace `window.Lab`.
- **Data-driven missions.** Missions are data objects plus reusable components. Adding a mission should not need new code unless it needs a new component type.
- **Pure logic is separate from the DOM.** XP, unlock rules, validators and the rules engine are pure functions so they can be tested without a browser.

## For more information

- [Intent: what and why](intent.md) — the problem, the core learning goal, success criteria
- [Spec: how it behaves](spec.md) — architecture, components, requirements, brand guidelines, security rules
- [Plan: implementation order](plan.md) — phases, file-level planning, risks, exit checks
- [Security reporting](SECURITY.md) — how to report a security issue

## Brand and accessibility

This project follows the Nordic Solar brand guidelines as captured in the `ns-brand-guidelines` skill and spec §14. The brand owner signs off the result before release (spec §17.2 item 10).

- **Colours:** Nordic Green (#1A5C00), Almost Black (#1C1C1C), Off White (#F4F2EB), White (#FFFFFF), Black text only. No secondary colours, no gradients.
- **Font:** Aptos only, with system fallbacks. No web fonts.
- **Icons:** Monochrome inline SVG only. State is shown by icon, text label and border style, never by colour alone.
- **Accessibility:** WCAG 2.2 level AA is the product's own working target (spec §15), not a confirmed company standard.
- **Keyboard:** Every interaction works with the keyboard only.
- **Reduced motion:** Respects `prefers-reduced-motion` and an in-app setting.
