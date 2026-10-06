"""H2 push guard (PreToolUse: Bash).

Blocks, before they run:
  - git push when the current branch is main or master, or when the target is main or master
  - any force push (--force, -f, --force-with-lease, --mirror, a +refspec)
  - --no-verify on git commit or git push (skips hooks and checks)

This is a local safety net for SEC-11. It does not replace branch protection on the server.
"""
import re
import common

PUSH = re.compile(r"\bgit\b[^|;&\n]*?\bpush\b")
COMMIT_OR_PUSH = re.compile(r"\bgit\b[^|;&\n]*?\b(commit|push)\b")
FORCE = re.compile(r"(\s--force(-with-lease)?\b|\s-f\b|\s--mirror\b|\s\+[\w./-]+)")
NO_VERIFY = re.compile(r"\s--no-verify\b|\s-n\b(?=[^|;&\n]*\bcommit\b)")
MAIN_TARGET = re.compile(r"(\s|:|/)(main|master)(\s|$|\b)")


def main():
    data = common.payload()
    if data.get("tool_name") != "Bash":
        return
    cmd = common.command(data)
    if COMMIT_OR_PUSH.search(cmd) and NO_VERIFY.search(cmd):
        common.block("Push guard (H2): --no-verify skips the checks this repository relies on. Run the checks, or ask the owner for an exception.")
    if not PUSH.search(cmd):
        return
    if FORCE.search(cmd):
        common.block("Push guard (H2): force pushes are blocked. Make a new commit instead; if history really must change, ask the owner to do it.")
    branch = common.current_branch()
    explicit_target = MAIN_TARGET.search(cmd)
    if explicit_target or branch in ("main", "master"):
        common.block("Push guard (H2): pushing to main is blocked (SEC-11: changes go through a pull request). "
                     "Current branch: %r. Push a feature branch and open a pull request." % branch)


if __name__ == "__main__":
    common.guarded(main)
