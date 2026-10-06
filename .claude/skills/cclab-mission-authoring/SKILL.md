---
name: cclab-mission-authoring
description: Write, revise or review a mission for the Claude Engineering Lab tutorial in this repository, meaning the mission data files in js/content/missions/ (m00-orientation.js to m14-final.js). Use this whenever the task is to add, draft, extend, rebalance or check the content of a mission, a beat, an activity, classifier items, a simulated Claude run, debrief text or Read more links, even if the user only says "write Mission 6", "do the hooks lesson" or "the agents exercise needs another task". Not for building the rendering components in js/components/ or the shell.
---

# Mission authoring for the Claude Engineering Lab

A mission is **data, not code**: one file per mission that the reusable components render. The specification in `spec.md` already decides what each mission teaches, which activities it has and how much XP each is worth. Your job is to turn that into a correct, readable data file, without inventing a different lesson.

## Before you write

1. **Check the build gate.** `CLAUDE.md` says product code is blocked while the "before build" decisions in spec §22 are open. Mission files are product content. If those decisions are still open, tell the user and offer to write the draft to `docs/mission-drafts/` instead of `js/content/missions/`. Write there unless they say otherwise.
2. **Read the spec sections this mission depends on**, in this order:
   - §9.1: the mission's row (id, number, stage, XP, level reached).
   - The mission's own section (§9.3 for Mission 0 up to §9.17 for Mission 14). Its activities, items, correct answers and explanations are the content. Keep them.
   - §5.3 beat types, §7 the component it uses, §11.3 XP rules.
   - §13 the ClaimsPortal project, so names, endpoints, commands and policy match every other mission.
   - §14.7 content style and §16 content rules.
3. If the user asks for something the spec does not contain (a new activity, a different answer), say so. That is a spec change, and spec changes come first (CLAUDE.md). Offer to draft the spec wording.

## Write the file

Use the exact file format in [references/mission-format.md](references/mission-format.md). It is a JavaScript file whose body is strict JSON, so CI and the validator can read it without running JavaScript. Read that reference before writing your first mission in a session.

Content rules, and why they matter:

- **At most 60 words of prose per beat**, in both the `simple` and `deeper` text. Learners must reach an interaction quickly; the validator enforces it. If a beat needs more, split it into two beats.
- **One key message per beat.** The heading states it; the text supports it.
- **Every activity item has an explanation**, for the right answer and, where the spec gives one, for the tempting wrong answer. The coach panel shows it after every placement, right or wrong. An explanation says *why*, never just "Correct".
- **Simple and Deeper.** `simple` is plain English for a newcomer. `deeper` adds precision for an experienced engineer but must not hide anything the newcomer needs (spec §8).
- **Simulated Claude runs carry `"simulated": true`**, and scripted Claude lines use `"who": "claude"`. Learners must never mistake a script for real model output (GOV-09). Where the behaviour shown is illustrative rather than typical, add a caption that says so.
- **Paraphrase sources.** The Anthropic playbook and the Skills guide are sources, not text to copy. Use ClaimsPortal examples instead of the sources' own.
- **No emoji or symbol characters** anywhere. States and icons are rendered by components as SVG.
- **Nordic Solar context.** Where a mission touches real-world use of AI tools (Missions 0 and 12 in particular), keep the GOV-10 message consistent: only approved tools; no proprietary code, confidential data, personal data or credentials in them.

## Record technical claims, do not assume them

Any statement about how Claude Code behaves (hook events, Plan Mode, subagents, Skills, CLAUDE.md loading, CI use) goes into the file's `claims` list with `"verified": null`. Spec §16.4 requires each one to be checked against current documentation before release. If the user asks you to verify, use the `claude-code-guide` agent and record the date and the documentation page. Do not mark a claim verified from memory.

## Leave the human review fields empty

Set `"reviewedBy": null` and `"reviewedOn": null`. GOV-08 requires a named subject-matter expert to review AI-drafted content. Filling these in yourself would defeat the control. Only fill them in if the user tells you who reviewed it and when.

## Check your work

Run the validator on the file you wrote:

```bash
python .claude/skills/cclab-mission-authoring/scripts/validate_mission.py js/content/missions/m06-hooks.js
```

It checks the format, the mission's XP against spec §9.1, activity ids and XP, explanations, beat word counts, simulated flags, debrief fields and emoji. Fix every error and rerun until it passes. Warnings about unreviewed content or unverified claims are expected for a draft; report them.

If `tests.html` exists, also open it (or run it headless) and confirm `RESULT: PASS`.

## Report back

Finish with a short summary for the user:

- The file path, the mission's XP and how it splits across activities.
- Anything you could not take from the spec and how you handled it.
- The open `claims` that still need verification.
- A reminder that a named reviewer must fill in `reviewedBy` and `reviewedOn` before release.
