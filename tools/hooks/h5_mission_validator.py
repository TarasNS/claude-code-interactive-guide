"""H5 mission validator (PostToolUse: Edit|Write|MultiEdit).

After Claude edits a mission data file (js/content/missions/m*.js, or a draft in
docs/mission-drafts/), run the mission validator from the cclab-mission-authoring skill.
Errors go to stderr with exit 2 so Claude fixes them. Warnings (unreviewed content,
unverified claims) are expected in drafts and are not reported here.
"""
import os
import re
import subprocess
import sys

import common

SCOPE = re.compile(r"^(js/content/missions|docs/mission-drafts)/m\d\d-[\w-]+\.js$")
VALIDATOR = common.TOOLS_ROOT / ".claude" / "skills" / "cclab-mission-authoring" / "scripts" / "validate_mission.py"


def main():
    data = common.payload()
    if data.get("tool_name") not in common.WRITE_TOOLS:
        return
    rel = common.rel_path(common.file_path(data), data)
    if not rel or not SCOPE.match(rel):
        return
    path = common.ROOT / rel
    if not path.is_file() or not VALIDATOR.is_file():
        return
    out = subprocess.run([sys.executable, str(VALIDATOR), str(path)], capture_output=True, text=True,
                         encoding="utf-8", errors="replace", timeout=30,
                         env=dict(os.environ, PYTHONIOENCODING="utf-8"))
    if out.returncode != 0:
        errors = [l.strip() for l in out.stdout.splitlines() if l.strip().startswith("error:")]
        common.block("Mission validator (H5) found %d error(s) in %s:\n  %s\nFix them, then the file is checked again on the next edit."
                     % (len(errors), rel, "\n  ".join(errors[:15])))


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception:
        sys.exit(0)
