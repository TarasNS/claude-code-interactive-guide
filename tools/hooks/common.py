"""Shared helpers for the Claude Code hooks in this repository.

Each hook reads one JSON payload on stdin and signals its result by exit code:
  0  allow / checks passed
  2  block; the message on stderr is shown to Claude (and, for prompts, to the user)

Project data lives under ROOT. Tests point CCLAB_ROOT at a temporary folder; the
hook scripts themselves are always found relative to this file.
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

TOOLS_ROOT = Path(__file__).resolve().parents[2]
ROOT = Path(os.environ.get("CCLAB_ROOT") or TOOLS_ROOT).resolve()

WRITE_TOOLS = {"Edit", "Write", "MultiEdit", "NotebookEdit"}

# Shared with the gate checker: patterns for credentials that must never reach a prompt or a file.
SECRET_PATTERNS = [
    ("private key block", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----")),
    ("GitHub token", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{30,}\b")),
    ("AWS access key id", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("Slack token", re.compile(r"\bxox[abprs]-[A-Za-z0-9-]{10,}\b")),
    ("Azure storage key", re.compile(r"AccountKey=[A-Za-z0-9+/=]{40,}")),
    ("JWT", re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b")),
    ("secret assignment", re.compile(
        r"(?i)\b(password|passwd|secret|api[_-]?key|access[_-]?token|client[_-]?secret)\b\s*[:=]\s*[\"'][^\"'\s]{12,}[\"']")),
]
SECRET_FILE = re.compile(r"(^|/)(\.env(\..+)?|id_rsa|id_ed25519|[^/]*\.pem|[^/]*\.pfx|[^/]*\.p12|credentials(\.json)?|\.npmrc|\.pypirc)$", re.I)


def payload():
    try:
        data = json.load(sys.stdin)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def rel_path(p, data=None):
    """Return p as a posix path relative to ROOT, or None if it is outside ROOT."""
    if not p:
        return None
    try:
        q = Path(p)
        if not q.is_absolute():
            base = Path((data or {}).get("cwd") or ROOT)
            q = base / q
        return q.resolve().relative_to(ROOT).as_posix()
    except Exception:
        return None


def file_path(data):
    ti = data.get("tool_input") or {}
    return ti.get("file_path") or ti.get("notebook_path") or ti.get("path")


def written_text(data):
    """Text a write tool is about to put into a file."""
    ti = data.get("tool_input") or {}
    parts = [ti.get("content"), ti.get("new_string"), ti.get("new_source")]
    for e in ti.get("edits") or []:
        if isinstance(e, dict):
            parts.append(e.get("new_string"))
    return "\n".join(p for p in parts if isinstance(p, str))


def command(data):
    return (data.get("tool_input") or {}).get("command") or ""


def current_branch():
    forced = os.environ.get("CCLAB_BRANCH")
    if forced is not None:
        return forced
    try:
        out = subprocess.run(["git", "-C", str(ROOT), "branch", "--show-current"],
                             capture_output=True, text=True, timeout=10)
        return out.stdout.strip()
    except Exception:
        return ""


def find_secrets(text):
    return sorted({name for name, rx in SECRET_PATTERNS if rx.search(text or "")})


def block(message):
    # Write UTF-8 bytes directly: on Windows the console code page would otherwise garble symbols.
    data = (message.rstrip() + "\n").encode("utf-8", "replace")
    try:
        sys.stderr.buffer.write(data)
        sys.stderr.flush()
    except Exception:
        sys.stderr.write(message.rstrip() + "\n")
    sys.exit(2)


def guarded(main):
    """Run a PreToolUse/UserPromptSubmit guard. If the hook itself crashes, fail closed:
    a guard that silently stops guarding is worse than one that stops work and says why."""
    try:
        main()
    except SystemExit:
        raise
    except Exception as e:  # pragma: no cover
        block("Hook error in %s: %s. Blocking to be safe; fix the hook in tools/hooks/." % (Path(sys.argv[0]).name, e))
