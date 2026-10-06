"""H4 brand and code check (PostToolUse: Edit|Write|MultiEdit).

After Claude edits index.html, css/, js/ or an .svg, check that one file against:
  - the Nordic Solar brand rules (tools/hooks/brand_check.py: palette, tints, fonts, gradients, emoji)
  - the forbidden-code list from spec section 17.1 (network calls, eval, innerHTML, external scripts ...)

Problems are reported on stderr with exit 2 so Claude sees them and fixes the file. This is a
feedback hook: the edit has already happened, so it cannot undo it. If the checker itself fails
to run, it stays quiet rather than blocking work (the CI check is the backstop).
"""
import re
import sys
from pathlib import Path

import common

sys.path.insert(0, str(Path(__file__).resolve().parent))

SCOPE = re.compile(r"^(index\.html|css/.+\.css|js/.+\.js|.+\.svg)$")
FORBIDDEN = [
    (re.compile(r"\bfetch\s*\("), "fetch() call (SEC-04: no runtime network requests)"),
    (re.compile(r"XMLHttpRequest|\bWebSocket\b|sendBeacon|EventSource\s*\("), "network API (SEC-04)"),
    (re.compile(r"\beval\s*\(|new\s+Function\b|document\.write\b"), "eval, new Function or document.write (SEC-07)"),
    (re.compile(r"\.(inner|outer)HTML\b|insertAdjacentHTML"), "HTML string injection; use textContent (SEC-01)"),
    (re.compile(r"javascript:", re.I), "javascript: URL (SEC-07)"),
    (re.compile(r"<(script|link)\b[^>]*\b(src|href)\s*=\s*[\"']\s*(https?:)?//", re.I), "external script or stylesheet (SEC-02, SEC-04)"),
    (re.compile(r"\bstyle\s*=\s*[\"']", re.I), "inline style attribute (SEC-02: CSP forbids it)"),
    (re.compile(r"<style\b", re.I), "<style> element (SEC-02: CSP forbids it)"),
    (re.compile(r"\bimport\s+[\w{*].*\bfrom\b|^\s*import\s*\(|\bexport\s+(default|const|function|class)\b", re.M), "ES module syntax (file:// requires classic scripts)"),
]


def main():
    data = common.payload()
    if data.get("tool_name") not in common.WRITE_TOOLS:
        return
    rel = common.rel_path(common.file_path(data), data)
    if not rel or not SCOPE.match(rel):
        return
    path = common.ROOT / rel
    if not path.is_file():
        return
    problems = []
    try:
        import brand_check
        for n, msg in brand_check.check(str(path)):
            problems.append("line %d: %s" % (n, msg))
    except Exception:
        pass
    if rel.endswith((".js", ".html")):
        text = path.read_text(encoding="utf-8", errors="replace")
        for n, line in enumerate(text.split("\n"), 1):
            stripped = line.strip()
            if stripped.startswith(("//", "*", "/*")):
                continue
            for rx, label in FORBIDDEN:
                if rx.search(line):
                    problems.append("line %d: %s" % (n, label))
    if problems:
        shown = problems[:15]
        more = "" if len(problems) <= 15 else "\n  ... and %d more" % (len(problems) - 15)
        common.block("Brand and code check (H4) found problems in %s. Fix them before continuing:\n  %s%s"
                     % (rel, "\n  ".join(shown), more))


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception:
        sys.exit(0)
