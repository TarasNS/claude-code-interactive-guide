# Release readiness

State of the build against `plan.md` and spec §17, as of 2026-10-06. "Checked" means a test or a recorded run. "Owed" means only a named person can do or sign it.

## Automated checks (spec 17.1)

| Check | Result | Where it runs |
|---|---|---|
| `tests.html` | 152 tests pass | Every pull request, headless Chrome |
| `tools/static-checks.py` | Palette, forbidden code, emoji and the 400 KB size budget pass (about 372 KB) | Every pull request |
| JavaScript syntax check | Passes for `js/`, `tests/` and `tools/` | Every pull request |
| Mission validator | All 15 mission files pass | On every mission edit (hook H5) |
| Hook tests and header-checker tests | 46 and 11 pass | Every pull request |
| CodeQL, secret scan, dependency check | Pass on every pull request so far | Every pull request |

## Phase exit checks

| Phase | Exit check | Status |
|---|---|---|
| 1 | Store, migration and fallback tests; XP, levels, unlock rules; contrast from live tokens | Checked |
| 1 | Static checks pass | Checked |
| 1 | CSP meta tag works from `file://` | Checked in Edge 154 (Chromium): the page and tests load and run under the policy. **Owed:** Firefox and Safari. Chrome shares Edge's engine but was not run separately. |
| 1 | Shell at 320 px and 200% zoom, with and without Aptos | Checked at 320 px (equal to 200% zoom of 640 px) on all 80 views. **Owed:** a look on a machine without Aptos installed. |
| 2 to 7 | Each phase's listed checks | Checked by tests, and by a scripted perfect run of all 15 missions through the real interface: exactly 500 XP, level 11, all 23 success criteria covered |
| 8 | Accessibility, responsive and reduced-motion pass | Checked: `tools/view-audit.js` over all 80 views at desktop and 320 px found four problems, all fixed; reduced motion removes Play, speed and animation. **Owed:** a screen reader, and a real touch device. |
| 8 | Total code size under the budget | Checked. The budget was amended from 300 to 400 KB (spec 4.6, v2.1) because the content-complete product is about 372 KB. |
| 8 | Technical claims verified (spec 16.4) | 26 of 35 recorded with date and source; see below |
| 8 | Content review recorded in every mission file (GOV-08) | **Owed:** `reviewedBy` and `reviewedOn` are null in all 15 mission files, on purpose |
| 8 | Brand compliance review by the brand owner | **Owed** (spec 17.2 item 10) |
| 9 | Header check, DAST, independent security test, system approval test, release approval | **Owed.** `tools/check-headers.py` is ready for the header check; it needs a staging URL (decision D-11). |

## Technical claims (spec 16.4)

Checked on 2026-10-06 against Claude Code's documentation (code.claude.com) and the Skills guide that spec 9.8 names as its source. Each verified claim carries its date and source in its mission file.

- **Reworded after checking** (the source only partly supported the first wording): Skills across Claude.ai, Claude Code and the API (features specific to Claude Code do not carry over); `CLAUDE.md` is read at session start (the "not used in API calls" half was not stated anywhere); when Plan Mode helps; what belongs in `CLAUDE.md`; hooks as approval gates; CI use (`claude -p`, GitHub Actions, GitLab CI/CD, Agent SDK).
- **Worth knowing:** the Skills guide says a description must stay under 1024 characters with no angle brackets, and the product teaches that. Claude Code's own documentation separately says it truncates the combined `description` and `when_to_use` text at 1,536 characters in its skill listing. Mission 5 now states both.
- **Still unverified (9), because no documentation page can support them:** the intent and spec definitions (course methodology), "more agents add overhead", what evals are, production access being logged, rolling back before fixing forward, and metrics closing the loop. A subject-matter expert should confirm these during the GOV-08 review.
- The dependency-map edges (`js/content/map-graph.js`) are still unchecked against the official playbook, which I could not access. Section text pasted into the project later covers the PR-review step and is consistent with Mission 10; the full edge set still needs checking.

## Owed by people

1. Name a human reviewer on each pull request (SEC-19) and merge in order: PR #2 then #3 to #9. Branch protection requires a reviewer who is not the author.
2. Governance in spec 20.1 and the sign-offs in spec 20.4. The Head of IT & Digitalization must also re-confirm the repository location, because it was made public to enable code scanning (see D-03).
3. Content review of all 15 missions (GOV-08), and confirmation of the amendments in `plan.md` section 3.
4. Brand owner sign-off; logo and Aptos licence (D-01).
5. Privacy confirmation of local storage (D-09).
6. Staging host (D-11), hosting (D-07), DAST, independent security test, release approval.
7. Firefox, Safari, iOS Safari and Android Chrome runs, a screen-reader pass, the full greyscale run-through of Missions 10 to 13, and a font-fallback look on a machine without Aptos (spec 17.2).
