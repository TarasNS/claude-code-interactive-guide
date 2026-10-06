#!/usr/bin/env python3
"""Print the SEC-08 response headers in the format a host needs. Standard library only. Never shipped.

Usage: python tools/make-header-config.py nginx|netlify|azure-swa|json
The policy lives in tools/headers.json, the single source of truth. Verify a deployment with
tools/check-headers.py.
"""

import json
import sys
from pathlib import Path

POLICY = json.loads((Path(__file__).resolve().parent / "headers.json").read_text(encoding="utf-8"))


def render(fmt, policy=None):
    policy = policy or POLICY
    if fmt == "nginx":
        lines = ["# Put these in the server or location block that serves the site.", "# 'always' keeps them on error responses too."]
        for k, v in policy.items():
            lines.append('add_header %s "%s" always;' % (k, v.replace('"', '\\"')))
        return "\n".join(lines) + "\n"
    if fmt == "netlify":
        lines = ["# _headers file (Netlify and Cloudflare Pages)", "/*"]
        for k, v in policy.items():
            lines.append("  %s: %s" % (k, v))
        return "\n".join(lines) + "\n"
    if fmt == "azure-swa":
        return json.dumps({"globalHeaders": policy}, indent=2) + "\n"
    if fmt == "json":
        return json.dumps(policy, indent=2) + "\n"
    raise ValueError("unknown format: " + fmt)


def main(argv):
    if len(argv) != 2 or argv[1] not in ("nginx", "netlify", "azure-swa", "json"):
        print(__doc__)
        return 2
    sys.stdout.write(render(argv[1]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
