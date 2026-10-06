#!/usr/bin/env python3
"""SEC-08 / SEC-13 header check for a staging or production URL. Standard library only. Never shipped.

Usage:
    python tools/check-headers.py https://staging.example.internal/
    python tools/check-headers.py http://127.0.0.1:8000/ --allow-http   (local test; skips HSTS)

Exit code 0 when every required header is present with the specified value, 1 otherwise.
"""

import re
import sys
import urllib.error
import urllib.request

# The policy from spec SEC-02, plus frame-ancestors (SEC-08).
CSP_DIRECTIVES = [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "connect-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
]
PERMISSIONS_DENIED = ["camera", "microphone", "geolocation"]


def normalise(headers):
    return {k.lower(): v for k, v in headers.items()}


def check(headers, scheme="https"):
    """Pure: return a list of problems (empty means every SEC-08 header is right)."""
    h = normalise(headers)
    problems = []

    if scheme == "https":
        sts = h.get("strict-transport-security")
        if not sts:
            problems.append("Strict-Transport-Security is missing")
        else:
            m = re.search(r"max-age=(\d+)", sts)
            if not m or int(m.group(1)) < 31536000:
                problems.append("Strict-Transport-Security max-age must be at least 31536000")
            if "includesubdomains" not in sts.lower():
                problems.append("Strict-Transport-Security must include includeSubDomains")

    csp = h.get("content-security-policy")
    if not csp:
        problems.append("Content-Security-Policy is missing")
    else:
        parts = [p.strip() for p in csp.split(";") if p.strip()]
        for want in CSP_DIRECTIVES:
            if want not in parts:
                problems.append("Content-Security-Policy is missing the directive: " + want)
        if "unsafe-inline" in csp or "unsafe-eval" in csp:
            problems.append("Content-Security-Policy must not allow unsafe-inline or unsafe-eval")

    if h.get("x-content-type-options", "").strip().lower() != "nosniff":
        problems.append("X-Content-Type-Options must be nosniff")

    if h.get("referrer-policy", "").strip().lower() != "no-referrer":
        problems.append("Referrer-Policy must be no-referrer")

    pp = h.get("permissions-policy", "")
    if not pp:
        problems.append("Permissions-Policy is missing")
    else:
        for feature in PERMISSIONS_DENIED:
            if not re.search(r"\b" + feature + r"=\(\s*\)", pp):
                problems.append("Permissions-Policy must deny " + feature + " (" + feature + "=())")

    return problems


def fetch(url, timeout=15):
    req = urllib.request.Request(url, method="GET", headers={"User-Agent": "cclab-header-check"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return dict(resp.headers.items())
    except urllib.error.HTTPError as e:
        return dict(e.headers.items())


def main(argv):
    args = [a for a in argv[1:] if not a.startswith("--")]
    allow_http = "--allow-http" in argv
    if len(args) != 1:
        print(__doc__)
        return 2
    url = args[0]
    scheme = url.split(":", 1)[0].lower()
    if scheme not in ("http", "https"):
        print("check-headers: the URL must start with http:// or https://")
        return 2
    if scheme == "http" and not allow_http:
        print("check-headers: FAIL " + url + " is not served over HTTPS (SEC-08)")
        return 1
    problems = check(fetch(url), scheme)
    if problems:
        print("check-headers: FAIL " + url)
        for p in problems:
            print("  " + p)
        return 1
    print("check-headers: PASS " + url)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
