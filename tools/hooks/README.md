# Project hooks

Claude Code hooks for this repository. They enforce the rules that must hold every time, which is the point of Mission 6: instructions in `CLAUDE.md` reduce mistakes, hooks enforce boundaries. They are wired up in [.claude/settings.json](../../.claude/settings.json).

| Hook | Event and tools | Blocks or reports | Enforces |
|---|---|---|---|
| H1 `h1_build_gate.py` | Before Edit, Write, MultiEdit, NotebookEdit, Bash | Blocks writing `index.html`, `css/`, `js/` until a person creates `.claude/build-unblocked`. Blocks anyone creating that file from a tool. | Spec §20.3; the "before build" decisions in §22 |
| H2 `h2_push_guard.py` | Before Bash | Blocks pushes to or from `main`, force pushes, `--no-verify` | SEC-11 (local safety net) |
| H3 `h3_secrets_guard.py` | When a prompt is submitted; before Edit, Write, MultiEdit, NotebookEdit | Blocks prompts and file writes containing credentials; blocks `.env` and key files | SEC-05, SEC-18, GOV-10 |
| H4 `h4_brand_code_check.py` | After Edit, Write, MultiEdit | Reports brand violations and forbidden code in the edited file | BRD-06 to BRD-12, SEC-01, SEC-02, SEC-04, SEC-07 |
| H5 `h5_mission_validator.py` | After Edit, Write, MultiEdit | Reports mission-file errors from `validate_mission.py` | Spec §9, GOV-08 |
| H6 `h6_no_dependencies.py` | Before Bash | Blocks package installs and download-and-run commands | SEC-12, SEC-14 |

A "block" is exit code 2 with the reason on stderr, which Claude sees and acts on. H4 and H5 run **after** the edit, so they cannot undo it; they tell Claude what to fix.

## Opening the build gate (H1)

Only a person does this, once the decisions in spec §22 marked "before build" are closed and GOV-07 (multi-factor sign-in) is confirmed:

```bash
echo "Gate opened by <name> on <date>: D-02, D-04, D-11, D-12 decided; GOV-07 confirmed" > .claude/build-unblocked
```

Commit the file so the decision is recorded in history.

## Behaviour on failure

- **H1, H2, H3, H6 fail closed.** If one of these scripts crashes, it blocks the action and says so, because a guard that silently stops guarding is worse than one that stops work.
- **H4 and H5 fail open.** If a checker cannot run, it stays quiet; CI is the backstop.

## Limits (be honest about what these do not do)

- **Bash checks are best-effort.** H1, H2 and H6 read the command text. A person or a determined agent can phrase a command to get around them (a script that writes the file, a renamed tool). They stop unthinking mistakes, not deliberate bypass. Branch protection, CI and review on the server are what actually protect `main`.
- **H3 matches specific patterns.** It catches common token and key formats and quoted `password = "..."` assignments, not every possible secret.
- **Hooks protect this repository, on this machine.** Another checkout without the same settings is unprotected. The CI checks (spec §17.1) are the shared backstop.
- **The hooks, settings and scripts are not themselves protected.** Anyone with write access can edit them; changes show up in review like any other file.
- **Hooks run commands on your machine.** Read a hook before you trust it, and review changes to `.claude/settings.json` and this folder carefully.

## Tests

Offline tests feed each script realistic payloads and check the result:

```bash
python tools/hooks/test_hooks.py
```

They prove the scripts' logic. To prove Claude Code actually calls them, do the live check below after any change to `.claude/settings.json`.

### Live check

In a Claude Code session in this folder (reload hooks or restart the session first), ask Claude to:

1. create `index.html`: expected result, blocked by H1 with the build-gate message;
2. run `git push --force --dry-run origin add-spec`: blocked by H2;
3. run `npm install --dry-run left-pad`: blocked by H6;
4. write a file containing a fake token such as `ghp_` followed by 36 letters and digits: blocked by H3;
5. write `docs/x.svg` containing `fill="#FF5500"`: the write succeeds, then H4 reports the off-palette colour;
6. write an incomplete mission draft to `docs/mission-drafts/m06-hooks.js`: the write succeeds, then H5 lists the errors.

**Result on 2026-10-06:** all six checks behaved as expected in a live session. The prompt half of H3 (a credential typed into a prompt) cannot be triggered by Claude itself; it is covered by the offline tests and should be tried once by hand.

## Verified against documentation

Event names (`PreToolUse`, `PostToolUse`, `UserPromptSubmit`), the settings structure, exec-form `command` plus `args` with `${CLAUDE_PROJECT_DIR}`, and exit code 2 as the blocking signal were checked against the Claude Code hooks reference on 2026-10-06. Two points were **not** confirmed and should be re-checked if behaviour looks wrong: the exact stdin field name for the prompt (these scripts accept both `prompt` and `user_prompt`), and how a PostToolUse exit code 2 is presented to Claude.
