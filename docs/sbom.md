# Software Bill of Materials

Claude Engineering Lab — Version 1.0

## Overview

As a static HTML, CSS, and JavaScript application with no build step and no external dependencies, Claude Engineering Lab has a minimal attack surface and dependency footprint.

**Runtime dependencies:** None

**Build dependencies:** GitHub Actions (listed below)

## Runtime environment

- Web browser (latest two versions of Chrome, Edge, Firefox, Safari, iOS Safari)
- No backend services
- No external APIs or network requests at runtime
- No package manager dependencies (npm, pip, poetry, etc.)

## Build-time dependencies

All CI/CD infrastructure uses GitHub Actions pinned to a specific commit SHA (spec §4.7 SEC-12). Pinning prevents supply-chain attacks from tag or branch manipulation.

| Action | Purpose | Version (SHA) |
|---|---|---|
| `actions/checkout` | Clone repository | `692973182b3a8f0ff2642bc3736060e6d3c6be5d` (v4.1.7) |
| `github/codeql-action/init` | Static analysis setup | `94e57daf2c7250fada4d37149160336b8f9b2ff0` (v3.26.3) |
| `github/codeql-action/analyze` | CodeQL analysis | `94e57daf2c7250fada4d37149160336b8f9b2ff0` (v3.26.3) |
| `gitleaks/gitleaks-action` | Secret scanning | `v2.0.0` |
| `actions/setup-python` | Python environment | `f677139bbe7f9c59b41e7462f20cc37da61f0c9d` (v5.2.0) |

### Verification

- **SAST:** CodeQL (JavaScript/TypeScript) scans every pull request
- **Secret scan:** gitleaks prevents credentials from entering the repository
- **Dependency check:** CI fails if `package-lock.json` or `poetry.lock` appear (spec SEC-12)
- **Static checks:** `tools/static-checks.py` enforces brand compliance (colour palette, forbidden APIs, emoji)
- **Tests:** `tests.html` runs in headless Chrome to verify logic and CSP

## Security notes

Per spec §4.7:
- **SEC-01:** Learner input is written to the page with `textContent` only, never `innerHTML` or evaluated
- **SEC-02:** Content-Security-Policy meta tag: `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; base-uri 'none'; form-action 'none'`
- **SEC-03:** Outbound links are curated in `links.js` with `target="_blank" rel="noopener noreferrer"`
- **SEC-04:** No network requests at runtime (tested in CI)
- **SEC-05:** No secrets, tokens or credentials in the repository
- **SEC-06:** Stored state contains no identifier, name, email or free text other than the learner's Skill description (stored locally only)
- **SEC-07:** No `eval`, `new Function`, `document.write` or `javascript:` URLs

## Maintenance

This SBOM is updated at each release (plan.md Phase 9, §2). Changes to CI actions, build tools or GitHub-hosted runners must be reflected here.

**Last updated:** 2026-10-06
**Next review:** On first production release and after any major toolchain change
