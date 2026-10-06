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
├── index.html                  Shell, landmarks, script and style tags
├── css/
│   ├── tokens.css             Design tokens (colour, typography, spacing)
│   ├── base.css               Reset, typography, focus, utilities
│   ├── layout.css             App shell, rail, lab, responsive rules
│   ├── components.css         Component styling (classifier, terminal, etc.)
│   └── missions.css           Mission-specific overrides
├── js/
│   ├── core/
│   │   ├── store.js           State, persistence, selectors
│   │   ├── router.js          Hash routing
│   │   ├── xp.js              XP awards, levels, anti-gaming rules
│   │   ├── unlock.js          Mission and map-node unlock rules
│   │   ├── skills-validator.js Skill description validator
│   │   ├── workflow.js        Final challenge rules engine
│   │   ├── a11y.js            Accessibility: announcer, focus, reduced motion
│   │   └── dom.js             DOM helpers
│   ├── components/
│   │   ├── choice.js          Single-choice cards with feedback
│   │   ├── classifier.js      Tap-to-place sorting
│   │   ├── compare.js         Two-state toggle view
│   │   ├── stepper.js         Animated sequence
│   │   ├── terminal.js        Scripted terminal
│   │   ├── pipeline.js        Stage runner with state
│   │   ├── builder.js         Arrange and configure items
│   │   ├── tree.js            Explorable file tree
│   │   ├── diagram.js         Your System SVG renderer
│   │   ├── map.js             Dependency map renderer
│   │   └── coach.js           Feedback panel
│   ├── content/
│   │   ├── missions/          m00-orientation.js ... m14-final.js
│   │   ├── system-nodes.js    Your System diagram nodes
│   │   ├── map-graph.js       Dependency map nodes and edges
│   │   ├── links.js           Curated outbound links
│   │   └── glossary.js        Simple and Deeper definitions
│   └── app.js                 Boot, router setup, first render
├── tests.html                 In-browser test runner
├── tests/
│   └── *.test.js              Test scripts
├── tools/
│   ├── static-checks.py       CI script for palette, forbidden APIs, emoji
│   └── hooks/                 Claude Code hooks (build gate, push guard, etc.)
├── .github/
│   ├── workflows/
│   │   └── ci.yml             GitHub Actions pipeline
│   └── pull_request_template.md PR template
├── .claude/
│   ├── settings.json          Claude Code configuration and hooks
│   └── build-unblocked        Unblock the build gate (not checked in)
├── docs/
│   └── sbom.md                Software bill of materials
├── SECURITY.md                Security contact and reporting
├── CLAUDE.md                  Guidance for Claude Code
└── intent.md, spec.md, plan.md Project documentation
```

## Adding a mission

Each mission is a data file in `js/content/missions/` combined with reusable components in `js/components/`.

**To add a new mission:**

1. Reference the skill: [cclab-mission-authoring](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf)
2. Create `js/content/missions/m<num>-<slug>.js` with mission data, beats, and activities
3. Add the mission id to unlock rules in `js/core/unlock.js`
4. Add any new nodes to `js/content/system-nodes.js` and edges to `js/content/map-graph.js`
5. Run tests: open `tests.html` in a browser
6. CI validates mission data automatically on every pull request

Mission data includes metadata (`id`, `title`, `stage`), beats (explain, show, try, debrief, deeper), and activities with completion rules. A mission should only need new rendering code if it requires a new component type.

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
- **Static checks:** `python tools/static-checks.py` (brand palette, no forbidden APIs or emoji, no console.log in shipped code).
- **CSP validation:** The `Content-Security-Policy` meta tag is verified in Chrome, Edge, Firefox and Safari from `file://` (spec §17.2 item 11).
- **Size budget:** Total shipped code (HTML, CSS, JS) must stay under 300 KB uncompressed.

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

This project follows the [Nordic Solar brand guidelines](https://nordicsolar.example.com/brand) and WCAG 2.1 AA accessibility standards.

- **Colours:** Nordic Green (#1A5C00), Almost Black (#1C1C1C), Off White (#F4F2EB), White (#FFFFFF), Black text only. No secondary colours, no gradients.
- **Font:** Aptos only, with system fallbacks. No web fonts.
- **Icons:** Monochrome inline SVG only.
- **Keyboard navigation:** All interactions work with keyboard only.
- **Reduced motion:** Respects `prefers-reduced-motion`.

## License and attribution

This project is proprietary Nordic Solar learning material.
