"""H1 build gate (PreToolUse: Edit|Write|MultiEdit|NotebookEdit|Bash).

Product code (index.html, css/, js/) may not be written until a person creates
.claude/build-unblocked. That file records that the "before build" decisions in
spec.md section 22 and GOV-07 are closed (spec section 20.3). Claude must not create it.

Bash is checked on a best-effort basis: a command that both names a protected path and
looks like a write is blocked. A determined person can get around that; the gate is there
to stop accidental or unthinking writes, not to defeat a deliberate one.
"""
import re
import common

GATE = ".claude/build-unblocked"
PROTECTED = re.compile(r"^(index\.html|css/.*|js/.*)$")
# A write operation, then (later on the same line) a protected path. Requiring that order keeps
# harmless commands, such as a commit message that mentions a path and ends in "<name@host>", from matching.
WRITE_OP = r"(?:>>?|\btee\b|\bsed\s+-i|\bcp\b|\bmv\b|\bmkdir\b|\btouch\b|Out-File|Set-Content|Add-Content|New-Item|\bcopy\b|\bmove\b|\bxcopy\b)"
WRITES_TO_PROTECTED = re.compile(WRITE_OP + r"[^\n|;&]*?(?<![\w/.-])(?:index\.html|css/|js/)", re.I)
WRITES_TO_GATE = re.compile(WRITE_OP + r"[^\n|;&]*?build-unblocked", re.I)
MESSAGE = (
    "Build gate (H1): product code in index.html, css/ and js/ is blocked until the 'before build' "
    "decisions in spec.md section 22 are closed and MFA is confirmed (GOV-07). A person records that by "
    "creating .claude/build-unblocked. Do not create it yourself. Meanwhile, draft mission content in "
    "docs/mission-drafts/ or work on the documents."
)


def main():
    data = common.payload()
    tool = data.get("tool_name")
    gate_open = (common.ROOT / GATE).exists()

    if tool in common.WRITE_TOOLS:
        rel = common.rel_path(common.file_path(data), data)
        if rel == GATE:
            common.block("H1: .claude/build-unblocked records a human decision. Do not create or edit it; ask the owner.")
        if rel and PROTECTED.match(rel) and not gate_open:
            common.block(MESSAGE + " (blocked: %s)" % rel)
    elif tool == "Bash":
        cmd = common.command(data)
        if WRITES_TO_GATE.search(cmd):
            common.block("H1: .claude/build-unblocked records a human decision. Do not create it from a command; ask the owner.")
        if not gate_open and WRITES_TO_PROTECTED.search(cmd):
            common.block(MESSAGE + " (blocked: the command appears to write to a protected path)")


if __name__ == "__main__":
    common.guarded(main)
